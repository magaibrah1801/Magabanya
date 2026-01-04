
import React, { useState } from 'react';
import { Equipment, EquipmentStatus, Category } from '../types';
import { Button } from './Button';
import { generateEquipmentImage } from '../services/geminiService';

interface AddEquipmentModalProps {
  onAdd: (equipment: Equipment) => void;
  onClose: () => void;
}

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory] = useState<Category>(Category.GRIP_SUPPORT);
  const [subCategory, setSubCategory] = useState('');
  const [status, setStatus] = useState<EquipmentStatus>(EquipmentStatus.AVAILABLE);
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = async () => {
    if (!name) return;
    setIsGenerating(true);
    const generated = await generateEquipmentImage(name);
    if (generated) {
      setImageUrl(generated);
    } else {
      alert("Failed to generate model. Check your studio network connection.");
    }
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !serialNumber) return;

    const newEquipment: Equipment = {
      id: crypto.randomUUID(),
      name,
      serialNumber,
      category,
      subCategory: subCategory.trim() || undefined,
      status,
      notes,
      imageUrl: imageUrl || `https://picsum.photos/seed/${serialNumber}/400/300`,
      lastChecked: new Date().toISOString(),
    };

    onAdd(newEquipment);
    onClose();
  };

  const isReadyForGen = name.trim().length > 3;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-zinc-100 font-black uppercase tracking-tighter italic text-xl">Register New Asset</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-800 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Equipment Label</label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 10K Fresnel or 12x12 Frame"
                  className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500 transition-all font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Serial Number</label>
                <input
                  required
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Scan or Type Serial..."
                  className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none"
                    >
                      {Object.values(Category).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                      <span>Sub-Category / Brand</span>
                      <span className="text-[8px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">OPTIONAL</span>
                    </label>
                    <input
                      type="text"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      placeholder="e.g. Aputure, Matthews..."
                      className="w-full bg-zinc-900/50 border-2 border-zinc-800/50 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500/50 transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                    className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none"
                  >
                    {Object.values(EquipmentStatus).map((stat) => (
                      <option key={stat} value={stat}>{stat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="w-full md:w-56 space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <span>AI Asset Model</span>
                {imageUrl && <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">READY</span>}
              </label>
              <div className="aspect-[4/3] w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl overflow-hidden relative group">
                {imageUrl ? (
                  <>
                    <img src={imageUrl} className="w-full h-full object-cover animate-in fade-in duration-700" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="text-[9px] font-black text-white uppercase tracking-widest">Click below to change</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 p-4 text-center">
                    <svg className="w-10 h-10 mb-2 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[8px] uppercase font-bold tracking-widest opacity-30 italic">No Reference Image</span>
                  </div>
                )}
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] animate-pulse">Rendering 3D Model...</span>
                    {/* Scan line effect */}
                    <div className="absolute left-0 top-0 w-full h-0.5 bg-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-[scan_2s_linear_infinite]"></div>
                  </div>
                )}
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                fullWidth 
                onClick={handleGenerateImage}
                disabled={isGenerating || !isReadyForGen}
                className={`flex items-center gap-2 h-10 transition-all ${isReadyForGen && !imageUrl && !isGenerating ? 'ring-2 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse' : ''}`}
              >
                <span className="text-amber-500">✨</span> {isGenerating ? 'Rendering...' : imageUrl ? 'Regenerate Model' : 'Generate AI Model'}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Instructional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record any technical quirks or specific rigging instructions..."
              className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500 h-24 resize-none transition-all"
            />
          </div>

          <div className="pt-6 flex gap-4">
            <Button variant="ghost" type="button" onClick={onClose} className="flex-1 h-12 text-zinc-500 font-bold">
              Discard
            </Button>
            <Button variant="primary" type="submit" className="flex-1 h-12 shadow-amber-500/20">
              Commit to Inventory
            </Button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};
