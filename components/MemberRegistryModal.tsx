
import React, { useState } from 'react';
import { CompanyMember, Department } from '../types';
import { Button } from './Button';

interface MemberRegistryModalProps {
  members: CompanyMember[];
  onAddMember: (member: CompanyMember) => void;
  onRemoveMember: (id: string) => void;
  onClose: () => void;
}

export const MemberRegistryModal: React.FC<MemberRegistryModalProps> = ({ 
  members, 
  onAddMember, 
  onRemoveMember, 
  onClose 
}) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState<Department>(Department.GRIP);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !position) return;

    const newMember: CompanyMember = {
      id: crypto.randomUUID(),
      name,
      position,
      department,
      joinedDate: new Date().toISOString()
    };

    onAddMember(newMember);
    setName('');
    setPosition('');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <svg className="w-6 h-6 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-zinc-100 font-black uppercase tracking-tighter italic text-xl leading-none">Company Registry</h3>
              <p className="text-[10px] text-zinc-500 font-mono tracking-widest mt-1 uppercase">Authorised Crew Members & Production Staff</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 p-2 hover:bg-zinc-800 rounded-xl transition-all">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Add New Member Form */}
          <div className="lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-zinc-900 bg-zinc-900/20">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6 italic">Enlist New Member</h4>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Full Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Robert Miller"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Position / Title</label>
                <input
                  required
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Best Boy Grip"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-amber-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer"
                >
                  {Object.values(Department).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" fullWidth className="h-12 mt-4 shadow-amber-500/10">
                Register Member
              </Button>
            </form>
          </div>

          {/* Member List */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Current Roster</h4>
              <span className="text-[10px] font-mono text-zinc-700">{members.length} Registered</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.length > 0 ? members.map(member => (
                <div key={member.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-black text-zinc-500 text-sm border border-zinc-700 group-hover:text-amber-500 transition-colors">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100 uppercase italic tracking-tight">{member.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">{member.position}</span>
                        <span className="text-[8px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-bold uppercase">{member.department}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveMember(member.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-xs text-zinc-600 uppercase font-black italic tracking-widest opacity-40">No staff registered for this production tier.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
