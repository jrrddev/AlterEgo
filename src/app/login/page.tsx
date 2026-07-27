'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions';
import Image from 'next/image';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      if (result.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="flex h-screen bg-background items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-2xl w-full max-w-md animate-fade-in flex flex-col items-center">
        <div className="w-16 h-16 rounded-xl overflow-hidden mb-6 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
          <Image src="/AlterEgoLogo.webp" alt="AlterEgo Logo" width={64} height={64} className="object-cover" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-white/90">Sign in to AlterEgo</h1>
        <p className="text-white/50 mb-8 text-center text-sm">Enter your credentials to continue</p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-white/70 block mb-1">Username</label>
            <input 
              name="username" 
              type="text" 
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/70 block mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>

          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 rounded-xl mt-4 transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-white/40 leading-relaxed">
          Need an account or having issues? <br/>
          <a href="https://jrrd.dev" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline underline-offset-2 font-medium">
            Contact Developer
          </a>
        </p>
      </div>
    </div>
  );
}
