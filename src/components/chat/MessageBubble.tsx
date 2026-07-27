'use client';

import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User } from 'lucide-react';
import { Persona } from '@/lib/personas';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  personaId?: string;
  isError?: boolean;
  errorPayload?: string;
}

interface MessageBubbleProps {
  message: Message;
  currentPersona: Persona;
}

export function MessageBubble({ message, currentPersona }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [showError, setShowError] = useState(false);

  return (
    <div className={cn(
      "flex w-full animate-slide-up mb-6",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[80%] gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full shadow-lg border",
          isUser 
            ? "bg-primary-600/20 border-primary-500/30 text-primary-400" 
            : "bg-surface border-primary-500/30 shadow-[0_0_15px_var(--color-primary-500)] text-2xl shadow-primary-500/20"
        )}>
          {isUser ? <User size={20} /> : currentPersona.avatar}
        </div>

        {/* Message Content */}
        <div className={cn(
          "flex flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}>
          <span className="text-xs text-white/40 px-1 font-medium">
            {isUser ? 'You' : currentPersona.name}
          </span>
          <div className={cn(
            "p-4 rounded-2xl leading-relaxed whitespace-pre-wrap glass-panel",
            isUser 
              ? "bg-primary-600/10 border-primary-500/20 text-white/90 rounded-tr-sm" 
              : "text-white/80 rounded-tl-sm"
          )}>
            {message.content}
            {message.isError && message.errorPayload && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button 
                    onClick={() => setShowError(!showError)}
                    className="text-xs text-primary-400 hover:text-primary-300 font-medium underline"
                  >
                    {showError ? 'Hide Dev Report' : 'Show Dev Report'}
                  </button>
                  <a href="https://jrrd.dev" target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 hover:text-white/80 underline underline-offset-2">
                    Contact Developer
                  </a>
                </div>
                {showError && (
                  <pre className="mt-2 p-3 bg-black/40 rounded-lg text-xs font-mono text-red-300 overflow-x-auto">
                    {message.errorPayload}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
