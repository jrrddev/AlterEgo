import { NextResponse } from 'next/server';
import { personas, PersonaId } from '@/lib/personas';
import { models } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { content: userContent, personaId, modelId } = await req.json();

    if (!userContent || typeof userContent !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (!personaId || !personas[personaId as PersonaId]) {
      return NextResponse.json({ error: 'Invalid persona ID' }, { status: 400 });
    }

    // Verify user message quota
    const { data: user, error: userErr } = await supabase
      .from('app_users')
      .select('messages_sent, message_limit')
      .eq('id', session.userId)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Failed to verify user limits.' }, { status: 500 });
    }

    if (user.messages_sent >= user.message_limit && session.role !== 'admin') {
      return NextResponse.json({ error: 'You have reached your plan limit.' }, { status: 403 });
    }

    const persona = personas[personaId as PersonaId];
    const apiKey = process.env.OPENROUTER_API_KEY?.replace(/["'\r\n]/g, '').trim();

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API Key not configured.' }, { status: 500 });
    }

    // Fetch recent chat history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', session.userId)
      .eq('persona_id', personaId)
      .eq('is_error', false)
      .order('created_at', { ascending: true })
      .limit(20);

    const previousMessages = history || [];

    if (previousMessages.length >= 20) {
      return NextResponse.json({ error: 'History limit reached. Please clear your chat history to continue.' }, { status: 403 });
    }

    // Save user message to DB
    await supabase.from('chat_messages').insert([{
      user_id: session.userId,
      persona_id: personaId,
      role: 'user',
      content: userContent
    }]);

    const aiModel = models[modelId] || models['server_1'];
    let assistantContent = "";

    if (aiModel.id === 'server_1') {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "AlterEgo AI",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiModel.modelString,
          temperature: persona.temperature,
          messages: [
            { role: "system", content: persona.systemPrompt + "\n\nIMPORTANT: You must reply in English only." },
            ...previousMessages,
            { role: "user", content: userContent }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: 'Provider returned error', details: errorText }, { status: response.status });
      }

      const data = await response.json();
      assistantContent = data.choices[0]?.message?.content || "";
    } else if (aiModel.id === 'server_2') {
      const geminiKey = process.env.geminiAPIKey?.replace(/["'\r\n]/g, '').trim();
      if (!geminiKey) {
        return NextResponse.json({ error: 'Gemini API Key not configured.' }, { status: 500 });
      }

      const geminiMessages = previousMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      
      geminiMessages.push({ role: 'user', parts: [{ text: userContent }] });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel.modelString}:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: persona.systemPrompt + "\n\nIMPORTANT: You must reply in English only." }]
          },
          contents: geminiMessages,
          generationConfig: {
             temperature: persona.temperature
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: 'Provider returned error', details: errorText }, { status: response.status });
      }

      const data = await response.json();
      assistantContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Save assistant message to DB
    await supabase.from('chat_messages').insert([{
      user_id: session.userId,
      persona_id: personaId,
      role: 'assistant',
      content: assistantContent
    }]);

    // Update user usage metric
    const { error: rpcError } = await supabase.rpc('increment_message_count', { user_id: session.userId });
    if (rpcError) {
      // Fallback to direct update if RPC fails
      await supabase.from('app_users').update({ messages_sent: user.messages_sent + 1 }).eq('id', session.userId);
    }


    return NextResponse.json({
      content: assistantContent,
      usage: { sent: user.messages_sent + 1, limit: user.message_limit }
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const e = error as Error;
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const personaId = searchParams.get('personaId');

  if (!personaId) return NextResponse.json({ error: 'Missing personaId' }, { status: 400 });

  const { data: history } = await supabase
    .from('chat_messages')
    .select('id, role, content, is_error')
    .eq('user_id', session.userId)
    .eq('persona_id', personaId)
    .order('created_at', { ascending: true });

  return NextResponse.json({ messages: history || [] });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const personaId = searchParams.get('personaId');

  if (!personaId) return NextResponse.json({ error: 'Missing personaId' }, { status: 400 });

  await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', session.userId)
    .eq('persona_id', personaId);

  return NextResponse.json({ success: true });
}
