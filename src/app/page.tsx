import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ChatClientUI from './ChatClientUI';

export default async function HomePage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('app_users')
    .select('messages_sent, message_limit')
    .eq('id', session.userId)
    .single();

  const usage = user ? { sent: user.messages_sent, limit: user.message_limit } : { sent: 0, limit: session.messageLimit };
  
  return <ChatClientUI initialUsage={usage} />;
}
