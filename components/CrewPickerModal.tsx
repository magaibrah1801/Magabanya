
import React, { useState } from 'react';
import { CompanyMember } from '../types';
import { Button } from './Button';

interface CrewPickerModalProps {
  members: CompanyMember[];
  onSelect: (member: CompanyMember) => void;
  onClose: () => void;
  itemName: string;
}

export const CrewPickerModal: React.FC<CrewPickerModalProps> = ({ members, onSelect, onClose, itemName }) => {
  const [search, setSearch] = useState('');

  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-5 border-b border-zinc-900 bg-zinc-900/30">
          <h3 className="text-zinc-100 font-black uppercase tracking-tighter italic text-xl">Authorise Custodian</h3>
          <p className="text-[10px] text-zinc-500 font-mono tracking-widest mt-1 uppercase">Assigning: <span className="text-amber-500">{itemName}</span></p>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              autoFocus
              type="text"
              placeholder="Search Crew by Name or Role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
            {filtered.length > 0 ? filtered.map(member => (
              <button
                key={member.id}
                onClick={() => onSelect(member)}
                className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 p-3 rounded-2xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500 group-hover:text-amber-500 transition-colors">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100 uppercase tracking-tight italic">{member.name}</p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{member.position}</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-amber-500/50 group-hover:text-amber-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            )) : (
              <div className="py-10 text-center">
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">No matching crew members found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/10 border-t border-zinc-900 flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel Assignment</Button>
        </div>
      </div>
    </div>
  );
};
