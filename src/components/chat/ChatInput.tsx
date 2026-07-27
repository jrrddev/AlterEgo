import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Volume2, VolumeX } from 'lucide-react';
import { speechService } from '@/lib/speech';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isMuted, setIsMuted] = useState(speechService.getMutedState());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [input]);

  const toggleMute = () => {
    const muted = speechService.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="w-full relative">
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-end w-full glass-panel p-2 rounded-2xl border-white/10 focus-within:border-primary-500/50 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all duration-300"
      >
        <button
          type="button"
          onClick={toggleMute}
          className="p-3 text-white/40 hover:text-white/80 transition-colors self-end mb-1 rounded-xl hover:bg-white/5"
          title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          className="w-full bg-transparent border-none text-white/90 placeholder:text-white/30 resize-none outline-none py-3 px-2 max-h-[150px] overflow-y-auto font-sans text-base"
          rows={1}
          disabled={isLoading}
        />
        
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-3 mb-1 ml-2 self-end rounded-xl bg-primary-600/80 text-white hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
      <div className="text-center mt-2 text-[10px] text-white/30 uppercase tracking-widest font-mono">
        AlterEgo AI • Shift+Enter for new line
      </div>
    </div>
  );
}
