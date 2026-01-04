
import React, { useState, useMemo, useEffect } from 'react';
import { Equipment, EquipmentStatus, Transaction } from '../types';
import { Button } from './Button';
import { generateEquipmentImage } from '../services/geminiService';

interface EquipmentDetailModalProps {
  item: Equipment;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onUpdateImage: (id: string, imageUrl: string) => void;
}

type HistoryFilter = 'all' | Transaction['type'];

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ item, onClose, onToggleStatus, onUpdateImage }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const statusConfig = {
    [EquipmentStatus.AVAILABLE]: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Ready for Rigging", dot: "bg-emerald-500" },
    [EquipmentStatus.CHECKED_OUT]: { color: "text-amber-400", bg: "bg-amber-500/10", label: "In Production", dot: "bg-amber-500" },
    [EquipmentStatus.MAINTENANCE]: { color: "text-red-400", bg: "bg-red-500/10", label: "Shop Floor Only", dot: "bg-red-500" },
    [EquipmentStatus.LOST]: { color: "text-zinc-400", bg: "bg-zinc-500/10", label: "Unaccounted For", dot: "bg-zinc-500" },
    [EquipmentStatus.DAMAGED]: { color: "text-orange-400", bg: "bg-orange-500/10", label: "Damaged Asset", dot: "bg-orange-500" },
    [EquipmentStatus.ON_HOLD]: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Hold for Project", dot: "bg-blue-500" }
  };

  const config = statusConfig[item.status] || statusConfig[EquipmentStatus.AVAILABLE];

  const handleRegenerateImage = async () => {
    setIsGenerating(true);
    const generated = await generateEquipmentImage(item.name);
    if (generated) {
      onUpdateImage(item.id, generated);
    } else {
      alert("Failed to generate model. Check your API connection.");
    }
    setIsGenerating(false);
  };

  const filteredHistory = useMemo(() => {
    if (!item.history) return [];
    if (historyFilter === 'all') return item.history;
    return item.history.filter(t => t.type === historyFilter);
  }, [item.history, historyFilter]);

  const filterOptions: { label: string, value: HistoryFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'In', value: 'check-in' },
    { label: 'Out', value: 'check-out' },
    { label: 'Shop', value: 'maintenance' },
    { label: 'Project', value: 'project-assign' },
    { label: 'Status', value: 'status-change' },
    { label: 'Damage', value: 'damage-report' },
  ];

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 md:p-8 backdrop-blur-md overflow-hidden"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl h-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800 px-2 py-1 rounded">Asset Detail</span>
            <h3 id="detail-title" className="text-zinc-100 font-bold uppercase tracking-tighter italic">{item.serialNumber}</h3>
          </div>
          <button 
            aria-label="Close detail view"
            onClick={onClose} 
            className="text-zinc-500 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row">
          {/* Left Column: Media & Core Info */}
          <div className="lg:w-2/5 border-b lg:border-b-0 lg:border-r border-zinc-800 p-6 space-y-6 bg-zinc-950/20">
            <div className="aspect-video w-full bg-zinc-800 rounded-xl overflow-hidden border border-zinc-800 shadow-inner relative group">
              <img 
                src={item.imageUrl} 
                alt={`Photo of ${item.name}`} 
                className={`w-full h-full object-cover transition-opacity duration-300 ${isGenerating ? 'opacity-30' : 'opacity-100'}`}
              />
              {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" role="status" aria-label="Loading AI model"></div>
                  <span className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] animate-pulse">Regenerating Realistic Model...</span>
                </div>
              )}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleRegenerateImage}
                  disabled={isGenerating}
                  className="bg-black/60 backdrop-blur-md border-zinc-700 text-[10px]"
                >
                  ✨ Regenerate AI Model
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-100 tracking-tight leading-tight uppercase italic">{item.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 border border-zinc-800 rounded uppercase tracking-tighter">{item.category}</span>
                  {item.subCategory && (
                    <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded uppercase tracking-widest">{item.subCategory}</span>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${config.bg} border-current/20`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div aria-hidden="true" className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></div>
                    <span className={`font-black uppercase tracking-widest text-lg italic ${config.color}`}>{item.status}</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter font-bold">{config.label}</p>
                
                {item.currentHolder && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Current Custodian</p>
                    <div className="flex items-center gap-2">
                      <div aria-hidden="true" className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-500">
                        {item.currentHolder.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{item.currentHolder}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Grip Technical Notes</p>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl italic text-sm text-zinc-400 leading-relaxed min-h-[100px]">
                  {item.notes || "No technical advisories recorded for this unit."}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  variant={item.status === EquipmentStatus.AVAILABLE ? 'primary' : 'secondary'} 
                  fullWidth
                  onClick={() => onToggleStatus(item.id)}
                  disabled={item.status === EquipmentStatus.MAINTENANCE}
                  className="h-12"
                >
                  {item.status === EquipmentStatus.AVAILABLE ? 'Authorize Check-Out' : 'Confirm Check-In'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Transaction History */}
          <div className="lg:w-3/5 p-6 flex flex-col h-full bg-zinc-900/10">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Timeline & Chain of Custody
                </h4>
                <span className="text-[10px] font-mono text-zinc-700">{filteredHistory.length} Records Shown</span>
              </div>

              {/* History Filter Chips */}
              <div 
                className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar"
                role="radiogroup"
                aria-label="Filter transaction history by type"
              >
                {filterOptions.map(opt => (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={historyFilter === opt.value}
                    onClick={() => setHistoryFilter(opt.value)}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border outline-none focus:ring-2 focus:ring-amber-500 ${
                      historyFilter === opt.value
                        ? 'bg-amber-500 border-amber-500 text-zinc-950'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 relative">
              {/* Timeline Vertical Line */}
              <div className="absolute left-4 top-2 bottom-0 w-px bg-zinc-800"></div>

              <div className="space-y-8 pl-10 h-full overflow-y-auto custom-scrollbar">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((trans) => (
                    <div key={trans.id} className="relative group/line">
                      {/* Circle indicator */}
                      <div className={`absolute -left-10 top-1.5 w-3 h-3 rounded-full border-2 border-zinc-900 z-10 transition-transform group-hover/line:scale-125 ${
                        trans.type === 'check-out' ? 'bg-amber-500' : 
                        trans.type === 'check-in' ? 'bg-emerald-500' : 
                        trans.type === 'maintenance' ? 'bg-red-500' : 
                        trans.type === 'damage-report' ? 'bg-orange-500' :
                        trans.type === 'project-assign' ? 'bg-blue-500' : 'bg-zinc-600'
                      }`}></div>

                      <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-lg p-4 transition-all hover:bg-zinc-950/60 hover:border-zinc-700">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                            trans.type === 'check-out' ? 'text-amber-500 border-amber-500/20' : 
                            trans.type === 'check-in' ? 'text-emerald-500 border-emerald-500/20' : 
                            trans.type === 'maintenance' ? 'text-red-500 border-red-500/20' :
                            trans.type === 'damage-report' ? 'text-orange-500 border-orange-500/20' :
                            trans.type === 'project-assign' ? 'text-blue-500 border-blue-500/20' :
                            'text-zinc-500 border-zinc-500/20'
                          }`}>
                            {trans.type.replace('-', ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-600">
                            {new Date(trans.timestamp).toLocaleDateString()} — {new Date(trans.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div aria-hidden="true" className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500 uppercase">
                            {trans.user.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-zinc-300">Authorized by {trans.user}</span>
                        </div>

                        {trans.project && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-amber-500 uppercase">Project:</span>
                            <span className="text-[10px] text-zinc-400">{trans.project}</span>
                          </div>
                        )}
                        
                        {trans.notes && (
                          <p className="mt-2 text-xs text-zinc-500 leading-relaxed pl-3 border-l-2 border-zinc-800 italic">
                            "{trans.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                    <svg aria-hidden="true" className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs uppercase tracking-widest font-black italic">
                      {historyFilter === 'all' ? 'No historical data' : `No ${historyFilter} records`}
                    </p>
                    <p className="text-[10px] mt-1 font-medium">Try clearing filters to see all entries.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
