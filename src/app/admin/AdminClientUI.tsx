'use client';

import { useState } from 'react';
import { adminCreateUser, adminDeleteUser, logout } from '@/app/actions';
import { LogOut, UserPlus, Trash2 } from 'lucide-react';

export interface AppUser {
  id: string;
  username: string;
  role: string;
  messages_sent: number;
  message_limit: number;
}

export function AdminClientUI({ initialUsers }: { initialUsers: AppUser[] }) {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await adminCreateUser(formData);

    if (result.error) {
      setError(result.error);
    } else {
      // Optimistic refresh - in a real app, re-fetch from server
      alert("User created! Refresh the page to see them.");
      (e.target as HTMLFormElement).reset();
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user ${username}?`)) return;
    
    const result = await adminDeleteUser(id);
    if (result.error) {
      alert(result.error);
    } else {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-surface p-6 rounded-2xl border border-white/10">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-white/50 text-sm">Manage user access and message limits</p>
          </div>
          <button 
            onClick={() => logout()}
            className="flex items-center gap-2 text-white/50 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="glass-panel p-6 rounded-2xl h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserPlus size={18} /> Create New User
            </h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-white/70 block mb-1">Username</label>
                <input name="username" required className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="text-sm text-white/70 block mb-1">Password</label>
                <input name="password" required className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="text-sm text-white/70 block mb-1">Message Limit (Plan)</label>
                <input name="limit" type="number" defaultValue={50} required className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-primary-500" />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button disabled={isLoading} type="submit" className="w-full bg-primary-600 hover:bg-primary-500 py-2 rounded-xl mt-2 transition-colors">
                Create User
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="md:col-span-2 glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold mb-4">Active Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-sm">
                    <th className="py-2">Username</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Messages Sent</th>
                    <th className="py-2">Plan Limit</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-white/5">
                      <td className="py-3 font-medium">{user.username}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-primary-500/20 text-primary-400' : 'bg-white/10 text-white/70'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3">{user.messages_sent}</td>
                      <td className="py-3">{user.message_limit}</td>
                      <td className="py-3">
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleDelete(user.id, user.username)}
                            className="text-white/40 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
