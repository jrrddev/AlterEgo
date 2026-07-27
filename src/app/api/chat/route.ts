import { NextResponse } from 'next/server';
import { personas, PersonaId } from '@/lib/personas';

export async function POST(req: Request) {
  try {
    const { messages, personaId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    if (!personaId || !personas[personaId as PersonaId]) {
      return NextResponse.json({ error: 'Invalid persona ID' }, { status: 400 });
    }

    const persona = personas[personaId as PersonaId];
    const rawApiKey = process.env.OPENROUTER_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.replace(/["'\r\n]/g, '').trim() : undefined;

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API Key not configured on the server.' }, { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "AlterEgo AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        temperature: persona.temperature,
        messages: [
          { role: "system", content: persona.systemPrompt + "\n\nIMPORTANT: You must reply in English only." },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      
      let errorMessage = response.statusText;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {}

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
