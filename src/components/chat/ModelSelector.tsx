'use client';

import { modelList } from '@/lib/models';
import { Server } from 'lucide-react';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelect: (modelId: string) => void;
}

export function ModelSelector({ selectedModelId, onSelect }: ModelSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs uppercase tracking-wider font-semibold text-white/50 mb-1 flex items-center gap-2 px-1">
        <Server size={14} /> Server Connection
      </div>
      <div className="relative">
        <select 
          value={selectedModelId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white/90 outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
          style={{
              backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px"
          }}
        >
          {modelList.map(model => (
            <option key={model.id} value={model.id} className="bg-background text-white">
              {model.name}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] text-white/40 mt-1 px-2 leading-tight">
        If the AI is unresponsive, try switching to a different server.
      </p>
    </div>
  );
}
