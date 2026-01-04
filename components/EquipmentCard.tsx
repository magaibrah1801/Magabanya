
import React, { useState, useRef, useEffect } from 'react';
import { Equipment, EquipmentStatus } from '../types';
import { Button } from './Button';

interface EquipmentCardProps {
  item: Equipment;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdateImage: (id: string, imageUrl: string) => void;
  onViewDetails: (id: string) => void;
  onQuickStatus: (id: string, status: EquipmentStatus) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ 
  item, 
  isSelected,
  onSelect,
  onToggleStatus, 
  onUpdateNotes,
  onUpdateImage,
  onViewDetails,
  onQuickStatus
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusColors = {
    [EquipmentStatus.AVAILABLE]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    [EquipmentStatus.CHECKED_OUT]: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    [EquipmentStatus.MAINTENANCE]: "bg-red-500/10 text-red-400 border-red-500/30",
    [EquipmentStatus.LOST]: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    [EquipmentStatus.DAMAGED]: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    [EquipmentStatus.ON_HOLD]: "bg-blue-500/10 text-blue-400 border-blue-500/30"
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleQuickStatus = (e: React.MouseEvent, status: EquipmentStatus) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onQuickStatus(item.id, status);
  };

  const isLost = item.status === EquipmentStatus.LOST;
  const isDamaged = item.status === EquipmentStatus.DAMAGED;

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails(item.id)}
      className={`group relative bg-zinc-900 border transition-all duration-300 rounded-2xl overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] ${
      isSelected ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-2xl translate-y-[-2px]' : 'border-zinc-800 hover:border-zinc-700'
    } ${isLost ? 'opacity-60' : ''}`}
    >
      <div className="absolute top-3 left-3 z-10">
        <button 
          aria-label={isSelected ? `Deselect ${item.name}` : `Select ${item.name}`}
          onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all active:scale-75 ${
            isSelected ? 'bg-amber-500 border-amber-500 text-zinc-950 scale-110' : 'bg-black/40 border-zinc-700'
          }`}
        >
          {isSelected && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
        </button>
      </div>

      <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent"></div>
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 backdrop-blur-md shadow-lg ${statusColors[item.status]}`}>
            {item.status}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col bg-zinc-900/40 relative">
        <div className="mb-3">
          <h3 className="font-black text-zinc-100 text-sm leading-tight italic uppercase tracking-tight truncate">{item.name}</h3>
          <p className="text-[10px] text-zinc-500 font-mono tracking-widest mt-0.5">{item.serialNumber}</p>
        </div>

        <div className="mt-auto space-y-3">
          {item.currentHolder && (
            <div className={`text-[10px] flex items-center justify-between px-3 py-2 bg-zinc-950/80 rounded-xl border ${isLost ? 'border-red-900/50' : 'border-zinc-800'}`}>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Custodian</span>
                <span className={`font-black uppercase truncate ${isLost ? 'text-red-400' : 'text-amber-500'}`}>
                  {item.currentHolder}
                </span>
              </div>
              <span className="text-[8px] font-black bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 uppercase tracking-widest italic">{item.currentHolderPosition}</span>
            </div>
          )}

          <div className="flex gap-2">
            {!isLost ? (
              <Button 
                variant={item.status === EquipmentStatus.AVAILABLE ? 'primary' : 'secondary'} 
                size="sm" 
                className="flex-1 h-10 shadow-lg"
                onClick={(e) => { e.stopPropagation(); onToggleStatus(item.id); }}
              >
                {item.status === EquipmentStatus.AVAILABLE ? 'Log Out' : 'Log In'}
              </Button>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex-1 h-10 text-emerald-400 border-emerald-500/20"
                onClick={(e) => { e.stopPropagation(); onQuickStatus(item.id, EquipmentStatus.AVAILABLE); }}
              >
                Recovered
              </Button>
            )}

            <div className="relative" ref={menuRef}>
              <Button 
                variant="secondary" 
                size="sm" 
                className={`w-10 h-10 p-0 shadow-lg ${isMenuOpen ? 'bg-zinc-700' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
              {isMenuOpen && (
                <div className="absolute bottom-full right-0 mb-3 w-40 bg-zinc-900 border-2 border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2">
                  <button onClick={(e) => handleQuickStatus(e, EquipmentStatus.MAINTENANCE)} className="w-full text-left px-4 py-3 text-[11px] text-zinc-300 hover:bg-zinc-800 font-black border-b border-zinc-800/50 uppercase">To Repair Shop</button>
                  <button onClick={(e) => handleQuickStatus(e, EquipmentStatus.LOST)} className="w-full text-left px-4 py-3 text-[11px] text-red-500 hover:bg-red-950/20 font-black uppercase">Flag Lost</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
