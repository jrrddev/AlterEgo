'use server';

import { supabase } from '@/lib/supabase';
import { setSession, clearSession, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data || data.password !== password) {
    return { error: 'Invalid username or password' };
  }

  await setSession({
    userId: data.id,
    username: data.username,
    role: data.role,
    messageLimit: data.message_limit
  });

  return { success: true, role: data.role };
}

export async function logout() {
  await clearSession();
  redirect('/login');
}

export async function adminCreateUser(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const limit = parseInt(formData.get('limit') as string, 10);

  if (!username || !password || isNaN(limit)) {
    return { error: 'Invalid inputs' };
  }

  const { error } = await supabase
    .from('app_users')
    .insert([{ username, password, role: 'user', message_limit: limit }]);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function adminDeleteUser(userId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', userId)
    .neq('role', 'admin'); // Prevent deleting admin

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
