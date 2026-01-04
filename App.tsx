
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Equipment, EquipmentStatus, Category, Transaction, CompanyMember, Department, CompanyConfig } from './types';
import { INITIAL_INVENTORY } from './constants';
import { EquipmentCard } from './components/EquipmentCard';
import { EquipmentListItem } from './components/EquipmentListItem';
import { Assistant } from './components/Assistant';
import { Button } from './components/Button';
import { Scanner } from './components/Scanner';
import { AddEquipmentModal } from './components/AddEquipmentModal';
import { EquipmentDetailModal } from './components/EquipmentDetailModal';
import { MemberRegistryModal } from './components/MemberRegistryModal';
import { CrewPickerModal } from './components/CrewPickerModal';

const STORAGE_KEY = 'gripcheck_inventory_v1';
const CREW_KEY = 'gripcheck_crew_v1';
const COMPANY_KEY = 'gripcheck_company_v1';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

type BulkActionType = 'checkout' | 'checkin' | 'maintenance' | 'lost' | 'damaged';
type ViewMode = 'grid' | 'list';

const Logo = ({ collapsed = false }: { collapsed?: boolean }) => (
  <div className="flex items-center gap-3 group cursor-default">
    <div className="relative">
      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center transform transition-transform duration-500 group-hover:rotate-12 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
        <svg className="w-6 h-6 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" strokeWidth="2.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2v3m0 14v3M2 12h3m14 0h3M5.636 5.636l2.122 2.122m8.484 8.484l2.122 2.122M5.636 18.364l2.122-2.122m8.484-8.484l2.122-2.122" />
        </svg>
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-zinc-100 rounded-full border-2 border-zinc-950 animate-pulse"></div>
    </div>
    {!collapsed && (
      <div className="flex flex-col">
        <h1 className="text-xl font-black text-amber-500 italic tracking-tighter uppercase leading-none">
          Grip<span className="text-zinc-100">Check</span>
        </h1>
        <div className="flex items-center gap-1 mt-1">
          <div className="h-[1px] w-3 bg-amber-500/50"></div>
          <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-[0.3em] font-bold">Studio Pro</span>
        </div>
      </div>
    )}
  </div>
);

const App: React.FC = () => {
  // --- STATE ---
  const [inventory, setInventory] = useState<Equipment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_INVENTORY;
  });

  const [crew, setCrew] = useState<CompanyMember[]>(() => {
    const saved = localStorage.getItem(CREW_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'admin-1', name: 'John Doe', position: 'Key Grip', department: Department.GRIP, joinedDate: new Date().toISOString() },
      { id: 'admin-2', name: 'Sarah Miller', position: 'Best Boy Electric', department: Department.ELECTRIC, joinedDate: new Date().toISOString() }
    ];
  });

  const [company, setCompany] = useState<CompanyConfig | null>(() => {
    const saved = localStorage.getItem(COMPANY_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [holderFilter, setHolderFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | 'All'>('All');
  const [sortOrder, setSortOrder] = useState<'name' | 'serial' | 'last-checked'>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAssistant, setShowAssistant] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [pendingCheckOutId, setPendingCheckOutId] = useState<string | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingBulkAction, setPendingBulkAction] = useState<BulkActionType | null>(null);
  const [isBulkCheckOutPicking, setIsBulkCheckOutPicking] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem(CREW_KEY, JSON.stringify(crew)); }, [crew]);
  useEffect(() => { if (company) localStorage.setItem(COMPANY_KEY, JSON.stringify(company)); }, [company]);

  // --- ACTIONS ---
  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const recordTransaction = (item: Equipment, type: Transaction['type'], user: string, position?: string, extra: any = {}): Transaction => ({
    id: crypto.randomUUID(),
    equipmentId: item.id,
    type,
    user,
    userPosition: position,
    timestamp: new Date().toISOString(),
    ...extra
  });

  const handleCheckOut = (member: CompanyMember) => {
    if (isBulkCheckOutPicking) {
      // Bulk Check Out
      const timestamp = new Date().toISOString();
      setInventory(prev => prev.map(item => {
        if (selectedIds.has(item.id) && item.status === EquipmentStatus.AVAILABLE) {
          return {
            ...item,
            status: EquipmentStatus.CHECKED_OUT,
            currentHolder: member.name,
            currentHolderPosition: member.position,
            lastChecked: timestamp,
            history: [recordTransaction(item, 'check-out', member.name, member.position), ...(item.history || [])]
          };
        }
        return item;
      }));
      addToast(`Bulk Assignment Complete: ${selectedIds.size} units to ${member.name}`);
      setSelectedIds(new Set());
      setIsBulkCheckOutPicking(false);
    } else if (pendingCheckOutId) {
      // Single Check Out
      setInventory(prev => prev.map(item => {
        if (item.id === pendingCheckOutId) {
          addToast(`${item.name} assigned to ${member.name}`);
          return {
            ...item,
            status: EquipmentStatus.CHECKED_OUT,
            currentHolder: member.name,
            currentHolderPosition: member.position,
            lastChecked: new Date().toISOString(),
            history: [recordTransaction(item, 'check-out', member.name, member.position), ...(item.history || [])]
          };
        }
        return item;
      }));
      setPendingCheckOutId(null);
    }
  };

  const toggleStatus = useCallback((id: string) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    if (item.status === EquipmentStatus.AVAILABLE) {
      setPendingCheckOutId(id);
    } else {
      setInventory(prev => prev.map(it => {
        if (it.id === id) {
          addToast(`${it.name} Returned to Base`);
          return {
            ...it,
            status: EquipmentStatus.AVAILABLE,
            currentHolder: undefined,
            currentHolderPosition: undefined,
            currentProject: undefined,
            lastChecked: new Date().toISOString(),
            history: [recordTransaction(it, 'check-in', 'System Base'), ...(it.history || [])]
          };
        }
        return it;
      }));
    }
  }, [inventory]);

  const executeBulkAction = () => {
    if (!pendingBulkAction) return;

    const action = pendingBulkAction;
    const timestamp = new Date().toISOString();

    setInventory(prev => prev.map(item => {
      if (selectedIds.has(item.id)) {
        switch (action) {
          case 'checkin':
            return {
              ...item,
              status: EquipmentStatus.AVAILABLE,
              currentHolder: undefined,
              currentHolderPosition: undefined,
              lastChecked: timestamp,
              history: [recordTransaction(item, 'check-in', 'Bulk Action'), ...(item.history || [])]
            };
          case 'maintenance':
            return {
              ...item,
              status: EquipmentStatus.MAINTENANCE,
              lastChecked: timestamp,
              history: [recordTransaction(item, 'maintenance', 'Bulk Action'), ...(item.history || [])]
            };
          case 'lost':
            return {
              ...item,
              status: EquipmentStatus.LOST,
              lastChecked: timestamp,
              history: [recordTransaction(item, 'status-change', 'Bulk Action', undefined, { notes: 'Marked as Lost' }), ...(item.history || [])]
            };
          case 'damaged':
            return {
              ...item,
              status: EquipmentStatus.DAMAGED,
              lastChecked: timestamp,
              history: [recordTransaction(item, 'damage-report', 'Bulk Action'), ...(item.history || [])]
            };
          default:
            return item;
        }
      }
      return item;
    }));

    addToast(`Bulk ${action} complete for ${selectedIds.size} units`);
    setSelectedIds(new Set());
    setPendingBulkAction(null);
  };

  const handleStatusUpdate = (id: string, status: EquipmentStatus) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const type: Transaction['type'] = status === EquipmentStatus.DAMAGED ? 'damage-report' : 'status-change';
        addToast(`${item.name} marked as ${status}`, status === EquipmentStatus.DAMAGED ? 'error' : 'info');
        return {
          ...item,
          status,
          lastChecked: new Date().toISOString(),
          history: [recordTransaction(item, type, 'Admin'), ...(item.history || [])]
        };
      }
      return item;
    }));
  };

  const filteredInventory = useMemo(() => {
    let result = inventory.filter(item => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchTermLower) || item.serialNumber.toLowerCase().includes(searchTermLower);
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
      const matchesHolder = !holderFilter || (item.currentHolder?.toLowerCase().includes(holderFilter.toLowerCase()) ?? false);
      return matchesSearch && matchesCategory && matchesStatus && matchesHolder;
    });

    result.sort((a, b) => {
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      if (sortOrder === 'serial') return a.serialNumber.localeCompare(b.serialNumber);
      if (sortOrder === 'last-checked') return (b.lastChecked || '').localeCompare(a.lastChecked || '');
      return 0;
    });
    return result;
  }, [inventory, searchTerm, selectedCategory, selectedStatus, holderFilter, sortOrder]);

  const handleOnboarding = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('companyName') as string;
    const level = formData.get('productionLevel') as any;
    setCompany({ name, level, foundedDate: new Date().toISOString() });
    addToast(`Production Profile Created: ${name}`);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 sticky top-0 z-10">
        <Logo />
        <button 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="md:hidden text-zinc-500 hover:text-zinc-100 p-2 bg-zinc-900 rounded-xl active:scale-90 transition-all shadow-inner"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between px-2 pb-2">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Navigation</p>
        </div>
        <button 
          onClick={() => { setSelectedCategory('All'); setIsMobileMenuOpen(false); }} 
          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 active:scale-95 ${selectedCategory === 'All' ? 'bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'}`}
        >
          Master Inventory
        </button>
        <button 
          onClick={() => { setIsCrewModalOpen(true); setIsMobileMenuOpen(false); }} 
          className="w-full text-left px-4 py-3 rounded-xl text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 active:scale-95 transition-all flex items-center gap-3"
        >
           <svg className="w-4 h-4 text-amber-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
           </svg>
           Crew Directory
        </button>
        <div className="pt-6 pb-2 px-2">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Departments</p>
        </div>
        {Object.values(Category).map(cat => (
          <button 
            key={cat} 
            onClick={() => { setSelectedCategory(cat); setIsMobileMenuOpen(false); }} 
            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 active:scale-95 ${selectedCategory === cat ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700 shadow-md' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'}`}
          >
            {cat}
          </button>
        ))}
      </nav>
      <div className="p-4 mt-auto border-t border-zinc-800 bg-zinc-900/10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-inner">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-xs border border-amber-500/20 shadow-sm">{company?.name.charAt(0)}</div>
             <div className="overflow-hidden">
               <p className="text-xs font-black text-zinc-100 uppercase tracking-tighter truncate">{company?.name}</p>
               <p className="text-[8px] text-amber-500 font-black uppercase tracking-widest">{company?.level} Tier</p>
             </div>
           </div>
        </div>
      </div>
    </>
  );

  if (!company) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6 text-zinc-100">
        <div className="max-w-md w-full bg-zinc-950 border-2 border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
          <Logo />
          <h2 className="text-2xl font-black italic uppercase tracking-tighter mt-8 mb-2">Production Onboarding</h2>
          <p className="text-zinc-500 text-sm mb-8">Welcome to GripCheck Pro. Register your studio identity to begin tracking your inventory assets.</p>
          <form onSubmit={handleOnboarding} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Studio / Company Name</label>
              <input required name="companyName" type="text" placeholder="e.g. Paramount Grips" className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 focus:outline-none focus:border-amber-500 transition-all font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Production Tier</label>
              <select required name="productionLevel" className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none">
                <option value="Indie">Indie / Music Video</option>
                <option value="Commercial">Commercial / Corporate</option>
                <option value="Studio">Major Motion Studio</option>
                <option value="Union">Union Hire Tier</option>
              </select>
            </div>
            <Button type="submit" fullWidth className="h-14 rounded-2xl text-base shadow-amber-500/20">Establish Company Profile</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-black text-zinc-100 font-sans relative">
      <div className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800">
        <SidebarContent />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-[85%] bg-zinc-950 border-r border-zinc-800 flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
        <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-6 py-3 md:h-16 gap-3">
            <div className="flex items-center gap-3 flex-1">
              {/* Interactive Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden text-zinc-400 p-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-90 rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                aria-label="Toggle navigation menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="relative flex-1 max-w-xl">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                <input type="text" placeholder="Scan or Search Assets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-inner" />
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
               <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all active:scale-90 ${viewMode === 'grid' ? 'bg-amber-500 text-zinc-950 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg></button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all active:scale-90 ${viewMode === 'list' ? 'bg-amber-500 text-zinc-950 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/></svg></button>
               </div>
               <Button size="sm" onClick={() => setIsScannerOpen(true)} className="whitespace-nowrap shadow-amber-500/10">Scan</Button>
               <Button variant="secondary" size="sm" onClick={() => setShowAssistant(!showAssistant)} className={`whitespace-nowrap transition-all ${showAssistant ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' : ''}`}>AI Bot</Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-zinc-100 tracking-tight italic uppercase leading-none">{selectedCategory === 'All' ? 'Master Inventory' : selectedCategory}</h2>
              <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1">Found {filteredInventory.length} units</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(true)} className="shadow-lg border-zinc-700/50 hover:border-zinc-500">+ New Asset</Button>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-32">
              {filteredInventory.map(item => (
                <EquipmentCard key={item.id} item={item} isSelected={selectedIds.has(item.id)} onSelect={(id) => setSelectedIds(prev => { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; })} onToggleStatus={toggleStatus} onUpdateNotes={() => {}} onUpdateImage={() => {}} onViewDetails={setSelectedDetailId} onQuickStatus={handleStatusUpdate} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col bg-zinc-950/50 rounded-2xl border border-zinc-800 overflow-hidden mb-32">
              {filteredInventory.map(item => (
                <EquipmentListItem key={item.id} item={item} isSelected={selectedIds.has(item.id)} onSelect={(id) => setSelectedIds(prev => { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; })} onToggleStatus={toggleStatus} onViewDetails={setSelectedDetailId} />
              ))}
            </div>
          )}
        </div>

        {/* Persistent Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 md:bottom-8 md:left-1/2 md:-translate-x-1/2 bg-zinc-900/95 border-t md:border border-amber-500/50 md:rounded-[2rem] px-6 py-4 md:py-3.5 flex flex-col md:flex-row items-center gap-4 shadow-[0_0_50px_rgba(245,158,11,0.2)] z-50 animate-in slide-in-from-bottom duration-500 backdrop-blur-3xl md:max-w-4xl w-full">
            <div className="flex items-center w-full md:w-auto justify-between md:justify-start border-b md:border-b-0 md:border-r border-zinc-800 pb-3 md:pb-0 md:pr-6 md:mr-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-zinc-950 font-black text-xs shadow-inner">{selectedIds.size}</div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Units Active</span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">Bulk Action Pool</span>
                </div>
              </div>
              <button onClick={() => setSelectedIds(new Set())} className="text-[10px] font-black text-zinc-600 hover:text-zinc-100 uppercase tracking-widest transition-colors ml-6 active:scale-95">Reset</button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
              <Button size="sm" className="h-9 px-4 flex items-center gap-2" onClick={() => setIsBulkCheckOutPicking(true)}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Out
              </Button>
              <Button size="sm" variant="secondary" className="h-9 px-4 flex items-center gap-2" onClick={() => setPendingBulkAction('checkin')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3h-4a3 3 0 00-3 3v1" /></svg>
                In
              </Button>
              <Button size="sm" variant="secondary" className="h-9 px-4 flex items-center gap-2 border-red-500/20 text-red-400 hover:text-red-300" onClick={() => setPendingBulkAction('maintenance')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Shop
              </Button>
              <Button size="sm" variant="secondary" className="h-9 px-4 flex items-center gap-2 border-zinc-700 text-zinc-500 hover:text-zinc-400" onClick={() => setPendingBulkAction('lost')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Lost
              </Button>
              <Button size="sm" variant="danger" className="h-9 px-4 flex items-center gap-2" onClick={() => setPendingBulkAction('damaged')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Dmg
              </Button>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right duration-300 ${toast.type === 'error' ? 'bg-red-950 border-red-500/50 text-red-200' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}`}>
              <span className="text-xs font-black uppercase tracking-tight italic">{toast.message}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Modals */}
      {isCrewModalOpen && (
        <MemberRegistryModal 
          members={crew} 
          onAddMember={(m) => setCrew(p => [...p, m])} 
          onRemoveMember={(id) => setCrew(p => p.filter(m => m.id !== id))} 
          onClose={() => setIsCrewModalOpen(false)} 
        />
      )}
      
      {(pendingCheckOutId || isBulkCheckOutPicking) && (
        <CrewPickerModal 
          members={crew} 
          itemName={isBulkCheckOutPicking ? `${selectedIds.size} Units` : inventory.find(i => i.id === pendingCheckOutId)?.name || ''} 
          onSelect={handleCheckOut} 
          onClose={() => { setPendingCheckOutId(null); setIsBulkCheckOutPicking(false); }} 
        />
      )}

      {/* Bulk Action Confirmation Modal */}
      {pendingBulkAction && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPendingBulkAction(null)}></div>
          <div className="relative bg-zinc-950 border-2 border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${pendingBulkAction === 'damaged' || pendingBulkAction === 'lost' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-black text-zinc-100 uppercase italic mb-3">Execute Mass Batch?</h3>
              <p className="text-sm text-zinc-500 mb-8 leading-relaxed font-medium">
                Confirming <span className="text-zinc-100 font-bold uppercase">{pendingBulkAction}</span> for <span className="text-amber-500 font-black">{selectedIds.size} assets</span>. This update will be logged in each unit's technical timeline.
              </p>
              <div className="flex flex-col gap-3">
                <Button fullWidth size="lg" variant={pendingBulkAction === 'damaged' || pendingBulkAction === 'lost' ? 'danger' : 'primary'} onClick={executeBulkAction} className="h-14">
                  Commit Batch Update
                </Button>
                <Button fullWidth variant="ghost" onClick={() => setPendingBulkAction(null)} className="h-12 text-zinc-500">
                  Abort Transition
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && <Scanner onScan={() => {}} onClose={() => setIsScannerOpen(false)} />}
      {isAddModalOpen && <AddEquipmentModal onAdd={(e) => setInventory(p => [e, ...p])} onClose={() => setIsAddModalOpen(false)} />}
      {selectedDetailId && <EquipmentDetailModal item={inventory.find(i => i.id === selectedDetailId)!} onClose={() => setSelectedDetailId(null)} onToggleStatus={toggleStatus} onUpdateImage={() => {}} />}
      
      {showAssistant && (
        <div className="fixed inset-0 md:relative md:inset-auto z-[60] md:z-20 flex md:block">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md md:hidden" onClick={() => setShowAssistant(false)}></div>
          <div className="relative ml-auto w-full max-w-md h-full md:h-auto animate-in slide-in-from-right duration-500">
             <Assistant inventory={inventory} isOnline={isOnline} onAction={() => {}} onClose={() => setShowAssistant(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
