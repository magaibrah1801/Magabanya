
import React from 'react';
import { Equipment, EquipmentStatus } from '../types';
import { Button } from './Button';

interface EquipmentListItemProps {
  item: Equipment;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const EquipmentListItem: React.FC<EquipmentListItemProps> = ({ 
  item, 
  isSelected,
  onSelect,
  onToggleStatus, 
  onViewDetails
}) => {
  const statusColors = {
    [EquipmentStatus.AVAILABLE]: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    [EquipmentStatus.CHECKED_OUT]: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    [EquipmentStatus.MAINTENANCE]: "text-red-400 bg-red-500/10 border-red-500/20",
    [EquipmentStatus.LOST]: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
    [EquipmentStatus.DAMAGED]: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    [EquipmentStatus.ON_HOLD]: "text-blue-400 bg-blue-500/10 border-blue-500/20"
  };

  return (
    <div 
      onClick={() => onViewDetails(item.id)}
      className={`group flex flex-col md:flex-row md:items-center gap-4 p-3 bg-zinc-900/40 border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-all cursor-pointer ${isSelected ? 'bg-amber-500/5 border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'}`}
    >
      <div className="flex items-center gap-4 min-w-[200px]">
        <button 
          onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
          className={`w-5 h-5 rounded border transition-all shrink-0 flex items-center justify-center ${
            isSelected ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'border-zinc-700 bg-black/20'
          }`}
        >
          {isSelected && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter leading-none mb-1">{item.serialNumber}</span>
          <span className="text-sm font-bold text-zinc-100 uppercase italic truncate">{item.name}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:flex-1">
        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
          {item.category}
        </span>
        <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${statusColors[item.status]}`}>
          {item.status}
        </span>
        {item.currentHolder && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-zinc-100 uppercase">👤 {item.currentHolder}</span>
            <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest italic">{item.currentHolderPosition}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:ml-auto">
        <Button 
          variant={item.status === EquipmentStatus.AVAILABLE ? 'primary' : 'secondary'} 
          size="sm" 
          className="h-8 px-4"
          onClick={(e) => { e.stopPropagation(); onToggleStatus(item.id); }}
        >
          {item.status === EquipmentStatus.AVAILABLE ? 'Out' : 'In'}
        </Button>
      </div>
    </div>
  );
};
