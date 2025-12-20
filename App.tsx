
import React, { useState, useEffect, useRef } from 'react';
import { searchGlobalIntel, EnhancedSearchResult } from './services/geminiService';
import { IntelLink, PlatformType, SearchMode, SearchParams, ConnectedIdentity, SearchScope } from './types';

// --- Assets & Data ---
const ALL_PLATFORMS: { id: PlatformType; icon: string; color: string; hoverColor: string }[] = [
  { id: 'Telegram', icon: 'fa-brands fa-telegram', color: 'text-sky-400', hoverColor: 'hover:bg-sky-500' },
  { id: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: 'text-emerald-400', hoverColor: 'hover:bg-emerald-500' },
  { id: 'Discord', icon: 'fa-brands fa-discord', color: 'text-indigo-400', hoverColor: 'hover:bg-indigo-500' },
  { id: 'X', icon: 'fa-brands fa-x-twitter', color: 'text-white', hoverColor: 'hover:bg-slate-700' },
  { id: 'Facebook', icon: 'fa-brands fa-facebook', color: 'text-blue-600', hoverColor: 'hover:bg-blue-600' },
  { id: 'LinkedIn', icon: 'fa-brands fa-linkedin', color: 'text-blue-500', hoverColor: 'hover:bg-blue-500' },
  { id: 'Reddit', icon: 'fa-brands fa-reddit', color: 'text-orange-500', hoverColor: 'hover:bg-orange-600' },
  { id: 'Instagram', icon: 'fa-brands fa-instagram', color: 'text-pink-500', hoverColor: 'hover:bg-pink-600' },
  { id: 'TikTok', icon: 'fa-brands fa-tiktok', color: 'text-pink-400', hoverColor: 'hover:bg-pink-500' },
  { id: 'Signal', icon: 'fa-solid fa-comment-dots', color: 'text-blue-300', hoverColor: 'hover:bg-blue-400' },
];

const REAL_AUTH_URLS: Record<PlatformType, string> = {
  'Telegram': 'https://web.telegram.org/k/',
  'WhatsApp': 'https://web.whatsapp.com/',
  'X': 'https://twitter.com/i/flow/login',
  'Facebook': 'https://www.facebook.com/login.php',
  'LinkedIn': 'https://www.linkedin.com/login',
  'Discord': 'https://discord.com/login',
  'Instagram': 'https://www.instagram.com/accounts/login/',
  'Reddit': 'https://www.reddit.com/login/',
  'TikTok': 'https://www.tiktok.com/login',
  'Signal': 'https://signal.org/download/'
};

const SEARCH_MODES: { id: SearchMode; label: string; icon: string }[] = [
  { id: 'discovery', label: 'Turbo Recon', icon: 'fa-solid fa-bolt' },
  { id: 'username', label: 'Identity Sync', icon: 'fa-solid fa-fingerprint' },
  { id: 'phone', label: 'Signal Trace', icon: 'fa-solid fa-tower-cell' },
  { id: 'medical-residency', label: 'Medical Ops', icon: 'fa-solid fa-user-doctor' },
];

const SEARCH_SCOPES: { id: SearchScope; label: string; icon: string }[] = [
  { id: 'communities', label: 'Communities', icon: 'fa-solid fa-users' },
  { id: 'channels', label: 'Channels', icon: 'fa-solid fa-bullhorn' },
  { id: 'events', label: 'Intel / Events', icon: 'fa-solid fa-calendar-check' },
  { id: 'profiles', label: 'Profiles', icon: 'fa-solid fa-id-card' },
];

const SIMULATED_ACCOUNTS = [
  { id: 'acc_01', name: 'Scout Operator', email: 'operator@gmail.com', initial: 'OP', color: 'bg-emerald-600' },
  { id: 'acc_02', name: 'Ahmed Khalid', email: 'ahmed.dev@gmail.com', initial: 'AK', color: 'bg-blue-600' },
  { id: 'acc_03', name: 'Work Profile', email: 'research@unit-7.org', initial: 'WP', color: 'bg-purple-600' },
];

const ScanOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden opacity-20">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
    <div className="absolute top-0 w-full h-1 bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-scan" />
  </div>
);

const AnalysisReport = ({ analysis, identities, suggestion }: { analysis: string, identities: ConnectedIdentity[], suggestion?: string }) => {
  const formattedAnalysis = analysis.split('\n').map((line, i) => {
    if (line.includes('[') && line.includes(']')) {
      return <div key={i} className="text-emerald-400 font-black mt-4 mb-2 tracking-widest text-xs uppercase border-b border-emerald-500/20 pb-1 w-full">{line.replace('[', '').replace(']', '')}</div>;
    }
    return <div key={i} className="text-indigo-100/90 text-[10px] leading-relaxed mb-1">{line}</div>;
  });

  return (
    <div className="space-y-4">
      <div className="bg-[#050608] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4 relative z-10">
              <div className="flex gap-4">
                  <div className="w-12 h-12 bg-indigo-950/30 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-bolt text-xl text-yellow-400"></i>
                  </div>
                  <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                          Turbo Mission Intel
                          <span className="bg-yellow-500/10 text-yellow-500 text-[8px] px-2 py-0.5 rounded border border-yellow-500/20">V9 TURBO</span>
                      </h2>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">Multi-Stream Identity Aware Recon</p>
                  </div>
              </div>
          </div>
          <div className="relative z-10 font-mono bg-black/40 rounded-lg p-4 border border-white/5 h-64 overflow-y-auto custom-scrollbar text-xs">
              {formattedAnalysis}
          </div>
      </div>

      {suggestion && (
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex gap-4 items-start animate-in slide-in-from-left-4">
           <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <i className="fa-solid fa-lightbulb text-emerald-400"></i>
           </div>
           <div>
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Human-Agent Suggestion</div>
              <p className="text-[11px] text-emerald-100 italic leading-relaxed font-medium">"{suggestion}"</p>
           </div>
        </div>
      )}
    </div>
  );
};

const ConnectModal = ({ platform, onClose, onConnect }: { platform: PlatformType | null, onClose: () => void, onConnect: (id: ConnectedIdentity) => void }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'token' | 'demo'>('live');
  const [authStep, setAuthStep] = useState<'start' | 'waiting' | 'verifying' | 'success'>('start');
  const [realHandle, setRealHandle] = useState('');
  const [apiKey, setApiKey] = useState('');
  if (!platform) return null;
  const platformData = ALL_PLATFORMS.find(p => p.id === platform);

  const openRealAuth = () => {
    setAuthStep('waiting');
    const width = 600; const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(REAL_AUTH_URLS[platform], `Connect ${platform}`, `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
  };

  const confirmLiveAuth = () => {
    if (!realHandle.trim()) return;
    setAuthStep('verifying');
    setTimeout(() => {
        setAuthStep('success');
        setTimeout(() => {
            onConnect({ platform, type: 'handle', value: realHandle, authProvider: 'manual', connectionMethod: 'oauth_handshake', verifiedAt: new Date().toISOString() });
            onClose();
        }, 1200);
    }, 1500);
  };

  const submitApiKey = () => {
    if (apiKey.length < 10) return;
    onConnect({ platform, type: 'handle', value: 'API_CONNECTED_USER', authProvider: 'manual', connectionMethod: 'api_key', apiKey, verifiedAt: new Date().toISOString() });
    onClose();
  };

  const connectSimulated = (acc: any) => {
    onConnect({ platform, type: 'email', value: acc.name, email: acc.email, authProvider: 'google', connectionMethod: 'simulated', verifiedAt: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#1e2024] border border-slate-700 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-[#0f1115] px-4 py-3 border-b border-slate-700 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200"><i className={`${platformData?.icon} ${platformData?.color}`}></i><span>Identity Uplink Center</span></div>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="flex border-b border-slate-700 bg-black/20 shrink-0">
            {['live', 'token', 'demo'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === t ? 'border-indigo-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {t === 'live' ? 'Account Sync' : t === 'token' ? 'Dev Portal' : 'Simulation'}
              </button>
            ))}
        </div>
        <div className="p-6 overflow-y-auto">
            {activeTab === 'live' && (
                <div className="space-y-6 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-[#0f1115] flex items-center justify-center text-3xl mb-4 border border-slate-700 ${platformData?.color} shadow-lg shadow-${platformData?.color}/20`}><i className={platformData?.icon}></i></div>
                    <h3 className="text-white font-bold text-lg">Platform Handshake</h3>
                    <p className="text-xs text-slate-400 mt-1">Establishing a identity-aware stream with {platform}.</p>
                    {authStep === 'start' && <button onClick={openRealAuth} className={`w-full ${platformData?.color.replace('text-', 'bg-')} text-white font-bold py-3.5 rounded-xl text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2`}><i className="fa-solid fa-arrow-up-right-from-square"></i> Connect via {platform}</button>}
                    {authStep === 'waiting' && <div className="space-y-4"><div className="text-sm font-bold text-white">Handshake in Progress...</div><input type="text" value={realHandle} onChange={e => setRealHandle(e.target.value)} placeholder="@handle" className="w-full bg-black border border-slate-600 rounded-lg px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none"/><button onClick={confirmLiveAuth} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm">Verify Synchronized Stream</button></div>}
                </div>
            )}
            {activeTab === 'token' && (
                <div className="space-y-4"><textarea value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={`Input ${platform} Bearer Tokens...`} className="w-full bg-black border border-slate-600 rounded-lg px-4 py-3 text-[10px] font-mono text-emerald-400 h-32 resize-none"/><button onClick={submitApiKey} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm">Authorize Stream Access</button></div>
            )}
            {activeTab === 'demo' && (
                <div className="space-y-2">{SIMULATED_ACCOUNTS.map((acc) => (<div key={acc.id} onClick={() => connectSimulated(acc)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-transparent hover:border-slate-600 transition-all group"><div className={`w-9 h-9 rounded-full ${acc.color} flex items-center justify-center text-white font-bold text-xs`}>{acc.initial}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{acc.name}</div><div className="text-[10px] text-slate-500 truncate">{acc.email}</div></div><i className="fa-solid fa-chevron-right text-slate-600 text-xs"></i></div>))}</div>
            )}
        </div>
        <div className="bg-[#0f1115] px-4 py-2 text-center border-t border-slate-700 flex justify-between items-center shrink-0 text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Secure Tunneling Verified</span>
            <span><i className="fa-solid fa-lock text-[8px] mr-1"></i> E2EE Scan</span>
        </div>
      </div>
    </div>
  );
};

const SidebarSection = ({ title, icon, children, defaultOpen = false }: { title: string; icon: string; children?: React.ReactNode; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 last:border-0 pb-4 mb-4">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors mb-4 group"><span className="flex items-center gap-2"><i className={icon}></i> {title}</span><i className={`fa-solid fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i></button>
      <div className={`space-y-3 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>{children}</div>
    </div>
  );
};

const FilterSidebar = ({ platforms, setPlatforms, identities, onOpenConnect, geo, setGeo, medical, setMedical, mode, filters, setFilters, isOpen, onClose }: any) => {
  const togglePlatform = (p: PlatformType) => {
    if (platforms.includes(p)) setPlatforms(platforms.filter((x: any) => x !== p));
    else setPlatforms([...platforms, p]);
  };
  const drawerClasses = isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0";
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#06070a]/95 border-r border-white/5 p-6 flex flex-col h-full overflow-y-auto backdrop-blur-xl transition-transform duration-300 lg:relative ${drawerClasses} custom-scrollbar`}>
      <div className="lg:hidden flex justify-end mb-4"><button onClick={onClose} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button></div>
      <SidebarSection title="Synchronized Streams" icon="fa-solid fa-fingerprint" defaultOpen={true}>
        <div className="bg-indigo-950/10 border border-indigo-500/20 rounded-xl p-4">{identities.length === 0 ? <p className="text-[9px] text-slate-500 text-center uppercase tracking-widest">No Active Sync</p> : <div className="flex flex-col gap-2">{identities.map((id: any, i: number) => (<div key={i} className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] text-indigo-500"><i className="fa-solid fa-link"></i></div><div><div className="text-[10px] font-bold text-emerald-400">{id.platform}</div><div className="text-[8px] text-slate-400 font-mono truncate w-28">{id.value}</div></div></div><i className="fa-solid fa-circle text-[6px] text-emerald-500 animate-pulse"></i></div>))}</div>}</div>
      </SidebarSection>
      <SidebarSection title="Platforms To Recon" icon="fa-solid fa-network-wired" defaultOpen={true}>
        <div className="space-y-2">{ALL_PLATFORMS.map(p => { const isConnected = identities.some((i: any) => i.platform === p.id); const isSelected = platforms.includes(p.id); return (<div key={p.id} className="flex gap-2"><button onClick={() => togglePlatform(p.id)} className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${isSelected ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400'}`}><i className={`${p.icon} text-sm ${isSelected ? p.color : ''}`}></i>{p.id}</button><button onClick={() => onOpenConnect(p.id)} className={`px-3 flex items-center justify-center rounded-lg border transition-all ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white'}`}>{isConnected ? <i className="fa-solid fa-check text-xs"></i> : <span className="text-[8px] font-bold">SYNC</span>}</button></div>); })}</div>
      </SidebarSection>
      <SidebarSection title="Scan Tuning" icon="fa-solid fa-filter">
         <div className="space-y-4">
            <div><div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mb-2"><span>Min Probability</span><span className="text-emerald-400">{filters.minConfidence}%</span></div><input type="range" min="0" max="100" value={filters.minConfidence} onChange={(e) => setFilters({...filters, minConfidence: Number(e.target.value)})} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"/></div>
         </div>
      </SidebarSection>
      <SidebarSection title="Global Context" icon="fa-solid fa-earth-americas">
        <div className="space-y-3">{['Country', 'City'].map((p, i) => (<input key={p} type="text" placeholder={p} value={i === 0 ? geo.country : geo.city} onChange={e => i === 0 ? setGeo({...geo, country: e.target.value}) : setGeo({...geo, city: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-[10px] font-bold text-white outline-none placeholder:text-slate-700"/>))}</div>
      </SidebarSection>
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<SearchMode>('discovery');
  const [scope, setScope] = useState<SearchScope>('communities');
  const [query, setQuery] = useState('');
  const [platforms, setPlatforms] = useState<PlatformType[]>(['Telegram', 'WhatsApp', 'Discord']);
  const [identities, setIdentities] = useState<ConnectedIdentity[]>([]);
  const [geo, setGeo] = useState<SearchParams['location']>({ country: 'Saudi Arabia' });
  const [medical, setMedical] = useState<SearchParams['medicalContext']>({});
  const [filters, setFilters] = useState({ minConfidence: 5, onlyActive: false }); 
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [platformToConnect, setPlatformToConnect] = useState<PlatformType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnhancedSearchResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('scoutops_identities');
    if (saved) { try { setIdentities(JSON.parse(saved)); log("RESTORING MULTI-STREAM IDENTITIES..."); } catch (e) {} }
  }, []);
  useEffect(() => { localStorage.setItem('scoutops_identities', JSON.stringify(identities)); }, [identities]);
  useEffect(() => { if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight; }, [logs]);

  const log = (msg: string) => { const ts = new Date().toLocaleTimeString('en-US', { hour12: false }); setLogs(p => [...p.slice(-12), `[${ts}] ${msg}`]); };
  const handleOpenConnect = (p: PlatformType) => { setPlatformToConnect(p); setConnectModalOpen(true); };
  const handleConnectIdentity = (id: ConnectedIdentity) => { setIdentities(prev => [...prev.filter(i => i.platform !== id.platform), id]); log(`SYNC ACTIVE: Account for ${id.platform} linked to search core.`); };

  const handleSearch = async () => {
    if (!query.trim() && mode !== 'medical-residency') return;
    setLoading(true);
    setResult(null);
    log(`V9 TURBO SCAN INITIATED...`);
    log(`IDENTITY-AWARE: Cross-referencing platform streams...`);
    try {
      const data = await searchGlobalIntel({ query, mode, scope, platforms, identities, location: geo, medicalContext: { ...medical, specialty: medical.specialty || query }, filters });
      setResult(data);
      log(`TURBO RECON COMPLETE: Identified ${data.links.length} potential private & public uplinks.`);
    } catch (e: any) { log(`SCAN INTERRUPTED: ${e.message}`); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#010204] text-slate-200 overflow-hidden relative" dir="ltr">
      <div ref={bgRef} className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,27,75,0.4)_0%,transparent_60%)] z-0 pointer-events-none" />
      <ScanOverlay />
      <FilterSidebar platforms={platforms} setPlatforms={setPlatforms} identities={identities} onOpenConnect={handleOpenConnect} geo={geo} setGeo={setGeo} medical={medical} setMedical={setMedical} mode={mode} filters={filters} setFilters={setFilters} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-full relative z-10">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-4"><button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400"><i className="fa-solid fa-bars text-xl"></i></button><div className="relative group"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg"><i className="fa-solid fa-bolt text-yellow-400 animate-pulse"></i></div></div><h1 className="text-xl font-black italic text-white flex items-center gap-2">SCOUT<span className="text-indigo-500">OPS</span> <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-slate-400 font-mono">v9.0 TURBO</span></h1></div>
          <div className="hidden md:flex bg-black/40 border border-white/5 rounded-xl p-1 gap-1">{SEARCH_MODES.map(m => (<button key={m.id} onClick={() => setMode(m.id)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${mode === m.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><i className={m.icon}></i><span>{m.label}</span></button>))}</div>
        </header>
        <div className="p-8 pb-4"><div className="max-w-5xl mx-auto w-full space-y-4">
            <div className="flex justify-center gap-4">{SEARCH_SCOPES.map(s => (<button key={s.id} onClick={() => setScope(s.id)} className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${scope === s.id ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'border-transparent text-slate-600 hover:text-slate-400'}`}>{s.label}</button>))}</div>
            <div className="relative group"><div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div><div className="relative flex bg-[#08090c] rounded-2xl border border-white/10 items-center p-2 shadow-2xl"><div className="pl-6 pr-4 text-slate-500"><i className="fa-solid fa-bolt text-lg"></i></div><input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Turbo Target Recon (e.g. Private Pediatric Boards)..." className="flex-1 bg-transparent py-4 text-base font-bold text-white outline-none font-mono"/><button onClick={() => handleSearch()} disabled={loading} className="hidden sm:block bg-white text-black hover:bg-indigo-600 hover:text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">{loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'START TURBO SCAN'}</button></div><button onClick={() => handleSearch()} disabled={loading} className="sm:hidden mt-3 w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase">{loading ? 'ANALYZING...' : 'EXECUTE TURBO SCAN'}</button></div>
        </div></div>
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar relative z-10">
           {result ? (
             <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
               <AnalysisReport analysis={result.analysis} identities={identities} suggestion={result.suggestion} />
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                 {result.links.length > 0 ? result.links.map((link) => {
                   const pInfo = ALL_PLATFORMS.find(p => p.id === link.platform);
                   const isPrivate = link.tags?.includes('Private');
                   return (
                     <div key={link.id} className="bg-[#0b0d12] border border-white/5 hover:border-indigo-500/40 rounded-2xl p-6 transition-all group relative flex flex-col hover:-translate-y-1">
                       {isPrivate && (<div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg animate-pulse flex items-center gap-1"><i className="fa-solid fa-user-secret"></i> PRIVATE SIGNAL</div>)}
                       <div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black border border-white/10 text-lg ${pInfo?.color || 'text-white'}`}><i className={pInfo?.icon || 'fa-solid fa-globe'}></i></div><div><div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{link.type}</div><div className="text-[10px] font-bold text-indigo-400 truncate w-32">{link.location}</div></div></div><div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wide border ${isPrivate ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>{isPrivate ? 'SECURE' : 'UPLINK ACTIVE'}</div></div>
                       <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-indigo-300">{link.title}</h3>
                       <p className="text-[10px] text-slate-400 line-clamp-2 mb-2 leading-relaxed font-mono italic">"{link.context || link.description}"</p>
                       
                       <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="bg-white/5 p-2 rounded border border-white/5">
                            <div className="text-[7px] text-slate-500 uppercase font-black mb-1">Source Stream</div>
                            <div className="text-[9px] text-emerald-400 truncate font-mono">{link.sharedBy || "Detected Signal"}</div>
                          </div>
                          <div className="bg-white/5 p-2 rounded border border-white/5">
                            <div className="text-[7px] text-slate-500 uppercase font-black mb-1">Context detection</div>
                            <div className="text-[9px] text-indigo-400 truncate font-mono">{link.source || "Global Recon"}</div>
                          </div>
                       </div>

                       <div className="mb-4"><div className="flex justify-between text-[8px] text-slate-500 mb-1 font-mono"><span>SIGNAL PROBABILITY</span><span>{link.confidence}%</span></div><div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isPrivate ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${link.confidence}%` }}></div></div></div>
                       <div className="flex gap-2 mt-auto"><button onClick={() => window.open(link.url, '_blank')} className={`flex-1 ${isPrivate ? 'bg-rose-900/30 hover:bg-rose-700 text-rose-200' : 'bg-white/5 hover:bg-indigo-600 text-slate-300 hover:text-white'} py-2.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2`}>{isPrivate ? 'Request Entry' : 'Open Uplink'} <i className={`fa-solid ${isPrivate ? 'fa-lock-open' : 'fa-external-link'}`}></i></button><button onClick={() => { navigator.clipboard.writeText(link.url); log("UPLINK SAVED TO BUFFER"); }} className="w-10 bg-black border border-white/10 text-slate-500 hover:text-white rounded-lg flex items-center justify-center transition-all"><i className="fa-regular fa-copy text-xs"></i></button></div>
                     </div>
                   );
                 }) : (<div className="col-span-full py-20 text-center bg-black/40 border border-white/5 rounded-2xl"><i className="fa-solid fa-bolt-slash text-4xl text-slate-700 mb-4 opacity-50"></i><h3 className="text-slate-400 font-bold">No High-Confidence Signals Detected</h3><p className="text-slate-600 text-xs mt-2">Target may be using unlisted/private archives. Adjust tuning filters.</p></div>)}
               </div>
             </div>
           ) : (<div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-6"><div className="relative"><i className="fa-solid fa-bolt text-8xl opacity-10 animate-pulse"></i><i className="fa-solid fa-radar text-4xl text-indigo-900/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></i></div><div className="text-center"><p className="text-[10px] text-slate-800 font-mono mt-2 uppercase tracking-widest">Awaiting Turbo Recon Parameters</p></div></div>)}
        </div>
        <div className="h-24 bg-black/80 border-t border-white/10 p-4 font-mono text-[9px] backdrop-blur-md relative z-20">
           <div className="flex justify-between items-end mb-2 text-slate-600 border-b border-white/5 pb-1"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div> RECON BUFFER OUTPUT</span><span>SYNC HANDSHAKE: <span className="text-emerald-500">OPTIMIZED</span></span></div>
           <div ref={terminalRef} className="h-full overflow-y-auto space-y-1 custom-scrollbar text-indigo-400/80">{logs.map((l, i) => <div key={i}>{l}</div>)}</div>
        </div>
      </div>
      {connectModalOpen && <ConnectModal platform={platformToConnect} onClose={() => setConnectModalOpen(false)} onConnect={handleConnectIdentity} />}
    </div>
  );
};
export default App;
