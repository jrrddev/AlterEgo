import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminClientUI, AppUser } from './AdminClientUI';

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.role !== 'admin') {
    redirect('/');
  }

  // Fetch users securely server-side
  const { data: users, error } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Failed to fetch users", error);
  }

  return <AdminClientUI initialUsers={(users || []) as AppUser[]} />;
}
