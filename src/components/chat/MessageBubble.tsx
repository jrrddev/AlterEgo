import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Bot, User } from 'lucide-react';
import { Persona } from '@/lib/personas';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  personaId?: string; // Optional: to track which persona generated this if it's an assistant message
}

interface MessageBubbleProps {
  message: Message;
  currentPersona: Persona;
}

export function MessageBubble({ message, currentPersona }: MessageBubbleProps) {
  const isUser = message.role === 'user';

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
            : "bg-surface border-surface-border text-2xl"
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
          </div>
        </div>
      </div>
    </div>
  );
}
