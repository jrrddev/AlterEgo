import { Persona, personaList, PersonaId } from '@/lib/personas';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PersonaSelectorProps {
  selectedPersona: Persona;
  onSelect: (personaId: PersonaId) => void;
}

export function PersonaSelector({ selectedPersona, onSelect }: PersonaSelectorProps) {
  return (
    <div className="w-full flex flex-col gap-2 p-4 glass-panel rounded-2xl animate-fade-in">
      <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2 px-2">Select Persona</h2>
      <div className="flex flex-col gap-2">
        {personaList.map((persona) => (
          <button
            key={persona.id}
            onClick={() => onSelect(persona.id)}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 text-left border border-transparent",
              selectedPersona.id === persona.id
                ? "bg-primary-600/20 border-primary-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                : "hover:bg-white/5 hover:border-white/10"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full text-xl transition-all duration-300",
              selectedPersona.id === persona.id ? "bg-primary-500/30 scale-110" : "bg-white/5"
            )}>
              {persona.avatar}
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "font-medium transition-colors duration-300",
                selectedPersona.id === persona.id ? "text-primary-400" : "text-white/90"
              )}>
                {persona.name}
              </span>
              <span className="text-xs text-white/40 font-mono mt-0.5">
                Temp: {persona.temperature}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
