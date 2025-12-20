
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { searchGlobalIntel } from './services/geminiService';
import { IntelLink, IntelMessage, SearchResult, SearchType, Platform, PlatformType, SearchHistoryItem } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [town, setTown] = useState('');
  const [hospital, setHospital] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('topic');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1400);
  const [activeTab, setActiveTab] = useState<'links' | 'chats' | 'sources'>('links');
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [confirmingLink, setConfirmingLink] = useState<IntelLink | null>(null);
  
  const terminalRef = useRef<HTMLDivElement>(null);

  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: '1', name: 'X', icon: 'fa-brands fa-x-twitter', connected: true, color: 'text-gray-100' },
    { id: '2', name: 'Telegram', icon: 'fa-brands fa-telegram', connected: true, color: 'text-sky-400' },
    { id: '3', name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', connected: true, color: 'text-emerald-400' },
    { id: '4', name: 'Discord', icon: 'fa-brands fa-discord', connected: true, color: 'text-indigo-400' },
    { id: '5', name: 'Facebook', icon: 'fa-brands fa-facebook', connected: true, color: 'text-blue-500' },
    { id: '6', name: 'Instagram', icon: 'fa-brands fa-instagram', connected: true, color: 'text-pink-500' },
    { id: '7', name: 'TikTok', icon: 'fa-brands fa-tiktok', connected: true, color: 'text-cyan-400' },
    { id: '8', name: 'LinkedIn', icon: 'fa-brands fa-linkedin', connected: true, color: 'text-blue-700' }
  ]);

  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('scout_v17_history');
    if (saved) setHistory(JSON.parse(saved));
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 1400);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [...prev.slice(-12), `[${timestamp}] ${msg}`]);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleSearch = async (targetQuery?: string) => {
    const finalQuery = (targetQuery || query).trim();
    if (!finalQuery && !hospital.trim()) {
      setError("يرجى إدخال كلمات بحث أو اختيار مرفق طبي للبدء.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);
    setLoadingStep('Initializing Neural Nexus...');

    addLog(`STARTING NEXUS RECON v17.0...`);
    
    try {
      setLoadingStep('Synthesizing Search Vectors...');
      addLog(`Target sector: ${location || 'Global'}`);
      
      setLoadingStep('Intercepting Global Signals...');
      const data = await searchGlobalIntel({
        query: finalQuery,
        location: location || 'Global',
        town,
        hospital,
        platforms: platforms.filter(p => p.connected),
        searchType,
        filters: { activeOnly: false, privateOnly: false, minConfidence: 0 }
      });

      setLoadingStep('Analyzing Signal Authenticity...');
      setResult(data);
      addLog(`RECON COMPLETE: Intercepted ${data.links.length} validated nodes.`);
      
      const newHistoryItem: SearchHistoryItem = {
        query: finalQuery || hospital,
        location, town, hospital,
        timestamp: new Date().toLocaleTimeString(),
        type: searchType
      };

      setHistory(prev => {
        const next = [newHistoryItem, ...prev.filter(i => i.query !== (finalQuery || hospital))].slice(0, 15);
        localStorage.setItem('scout_v17_history', JSON.stringify(next));
        return next;
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ في مزامنة الشبكة العصبية.");
      addLog("FAILURE: Connection interrupted.");
    } finally {
      // CRITICAL FIX: Ensure loading is ALWAYS set to false
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#010309] text-gray-200 font-cairo overflow-x-hidden selection:bg-indigo-600/50 relative">
      
      {/* Visual Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,#010309_70%)] opacity-30"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
         <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
      </div>

      {/* Persistent Overlay Fix: Ensuring it has a high z-index and conditional rendering is bulletproof */}
      {loading && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#010309]/95 backdrop-blur-3xl animate-fadeIn">
           <div className="w-64 h-64 rounded-full border-2 border-indigo-500/10 flex items-center justify-center relative mb-12">
              <div className="absolute inset-0 rounded-full border-t-[4px] border-indigo-500 animate-spin"></div>
              <div className="absolute inset-10 rounded-full border-b-[4px] border-sky-500 animate-reverse-spin opacity-50"></div>
              <i className="fa-solid fa-satellite-dish text-6xl text-white animate-pulse"></i>
           </div>
           <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-white uppercase tracking-[0.4em] animate-pulse">{loadingStep}</h2>
              <p className="text-indigo-400/60 font-mono text-[10px] uppercase tracking-widest">Neural Nexus v17.0 Active</p>
           </div>
           <div className="mt-12 flex gap-3">
              <span className="w-3 h-3 rounded-full bg-indigo-600 animate-bounce" style={{animationDelay: '0ms'}}></span>
              <span className="w-3 h-3 rounded-full bg-indigo-600 animate-bounce" style={{animationDelay: '200ms'}}></span>
              <span className="w-3 h-3 rounded-full bg-indigo-600 animate-bounce" style={{animationDelay: '400ms'}}></span>
           </div>
        </div>
      )}

      {/* Signal Verification Modal */}
      {confirmingLink && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-fadeIn">
          <div className="bg-[#0c1221] border border-white/10 rounded-[2.5rem] p-12 max-w-lg w-full shadow-3xl space-y-8 border-t-indigo-500/50">
             <div className="text-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-xl">
                   <i className={`fa-solid ${confirmingLink.platform === 'WhatsApp' ? 'fa-brands fa-whatsapp' : 'fa-link'} text-3xl`}></i>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{confirmingLink.title}</h3>
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-2 block">Signal Verified & Secured</span>
             </div>
             <div className="bg-black/60 p-5 rounded-2xl border border-white/5 font-mono text-[11px] text-indigo-300 break-all leading-relaxed shadow-inner truncate text-center">
                {confirmingLink.url}
             </div>
             <div className="flex gap-4 pt-4">
                <button onClick={() => setConfirmingLink(null)} className="flex-1 py-4 bg-white/5 rounded-2xl font-black text-xs uppercase text-gray-500 hover:text-white border border-white/5 transition-all">Back</button>
                <button onClick={() => { window.open(confirmingLink.url, '_blank'); setConfirmingLink(null); }} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase shadow-2xl transition-all active:scale-95">Establish Link</button>
             </div>
          </div>
        </div>
      )}

      {/* Side Console */}
      <aside className={`fixed top-0 bottom-0 right-0 z-[120] bg-[#050811]/98 border-l border-white/5 transition-all duration-700 backdrop-blur-4xl ${isSidebarOpen ? 'w-[360px]' : 'w-0 invisible translate-x-full'}`}>
        <div className="p-10 space-y-12 h-full overflow-y-auto flex flex-col no-scrollbar">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">NEXUS CONSOLE</span>
              <span className="text-[8px] font-bold text-gray-700 uppercase">v17.0 Ultra</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-600 hover:text-white"><i className="fa-solid fa-angles-right"></i></button>
          </div>

          <div className="space-y-6">
             <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Recon Matrix</label>
             <div className="grid grid-cols-2 gap-3">
                {platforms.map(p => (
                  <button key={p.id} onClick={() => setPlatforms(prev => prev.map(pl => pl.id === p.id ? {...pl, connected: !pl.connected} : pl))} className={`p-4 rounded-2xl border text-[9px] font-black flex flex-col items-center gap-3 transition-all ${p.connected ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-lg' : 'bg-transparent border-white/5 text-gray-800'}`}>
                    <i className={`${p.icon} text-lg ${p.connected ? p.color : 'text-gray-900'}`}></i>
                    {p.name}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-4">
             <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Signal Feed</label>
             <div ref={terminalRef} className="flex-1 bg-black/60 rounded-3xl border border-white/5 p-5 font-mono text-[10px] text-indigo-400/80 overflow-y-auto space-y-1 shadow-inner custom-scrollbar">
                {logs.length === 0 && <div className="opacity-10 italic py-4">Standing by...</div>}
                {logs.map((log, i) => <div key={i} className="animate-fadeIn opacity-80"> {log} </div>)}
             </div>
          </div>

          <div className="pt-8 border-t border-white/5">
             <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-4 block">History</label>
             <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {history.map((h, i) => (
                  <div key={i} onClick={() => { setQuery(h.query); handleSearch(h.query); }} className="p-3 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-bold text-gray-500 hover:text-indigo-400 cursor-pointer truncate transition-all">
                     {h.query}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </aside>

      {/* Main Command Layout */}
      <main className={`transition-all duration-700 p-6 lg:p-20 max-w-7xl mx-auto flex flex-col relative z-10 ${isSidebarOpen ? 'lg:mr-[360px]' : ''}`}>
        
        <header className="flex justify-between items-center mb-24">
           <div className="flex items-center gap-8">
              {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 bg-[#0c1221] border border-white/10 rounded-2xl text-indigo-500 flex items-center justify-center hover:bg-indigo-600 transition-all"><i className="fa-solid fa-terminal"></i></button>
              )}
              <div className="flex flex-col">
                <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-white uppercase leading-none">SCOUT <span className="text-indigo-500">OPS</span></h1>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-[1em] mt-3">Nexus Grid v17.0</span>
              </div>
           </div>
           <div className="hidden lg:flex items-center gap-3 px-8 py-3 bg-[#0c1221] border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-500 shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Operational Status: Locked
           </div>
        </header>

        <div className="max-w-4xl mx-auto w-full space-y-16 mb-32">
           <div className="text-center space-y-6">
              <h2 className="text-6xl lg:text-9xl font-black text-white leading-none tracking-tighter uppercase">NEXUS <span className="text-indigo-500">RECON</span></h2>
              <p className="text-gray-500 text-lg lg:text-xl max-w-2xl mx-auto italic">أسرع نظام استخباراتي مفتوح لاستكشاف المجموعات العامة والبيانات الميدانية.</p>
           </div>

           <div className="flex justify-center gap-3 flex-wrap">
              {['topic', 'medical-scan', 'user', 'deep-scan'].map(t => (
                <button key={t} onClick={() => setSearchType(t as any)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${searchType === t ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-[#0c1221] border-white/5 text-gray-700 hover:text-white'}`}>
                   {t.replace('-', ' ')}
                </button>
              ))}
           </div>

           <div className="relative group">
              <div className="absolute -inset-4 bg-indigo-500/5 rounded-[3rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-all"></div>
              <div className="relative flex flex-col lg:flex-row bg-[#0c1221] border border-white/10 rounded-[2.5rem] lg:rounded-full p-3 gap-3 shadow-3xl">
                 <div className="flex-1 flex items-center px-8 gap-6">
                    <i className="fa-solid fa-satellite-dish text-indigo-500 text-3xl"></i>
                    <input 
                      type="text" 
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="أدخل كلمات البحث، المجموعات، أو المواضيع..."
                      className="w-full bg-transparent py-4 text-3xl lg:text-4xl font-black text-white focus:outline-none placeholder:text-gray-900 tracking-tighter"
                    />
                 </div>
                 <button onClick={() => handleSearch()} disabled={loading} className="px-16 py-6 rounded-[2rem] lg:rounded-full font-black text-xs uppercase shadow-2xl transition-all bg-indigo-600 hover:bg-indigo-500 text-white">
                   Launch Recon
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { val: location, set: setLocation, ph: 'الدولة...', icon: 'fa-earth-americas' },
                { val: town, set: setTown, ph: 'المدينة...', icon: 'fa-city' },
                { val: hospital, set: setHospital, ph: 'المرفق الصحي...', icon: 'fa-hospital-user' }
              ].map((f, i) => (
                <div key={i} className="flex items-center bg-[#0c1221] border border-white/5 rounded-2xl px-8 py-5">
                   <i className={`fa-solid ${f.icon} text-indigo-500/30 mr-4`}></i>
                   <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="bg-transparent text-sm font-black focus:outline-none w-full text-gray-300" />
                </div>
              ))}
           </div>
        </div>

        {/* Results Grid */}
        {result && (
          <div className="space-y-20 animate-fadeIn pb-60">
             
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: 'Signals Captured', val: result.stats.totalFound, icon: 'fa-bolt' },
                  { label: 'Validated Links', val: result.links.length, icon: 'fa-link' },
                  { label: 'Intercepted Nodes', val: result.stats.privateCount, icon: 'fa-mask' },
                  { label: 'Nexus Confidence', val: 'High-P', icon: 'fa-check' }
                ].map(s => (
                  <div key={s.label} className="bg-[#0c1221] border border-white/5 p-10 rounded-[2.5rem] flex flex-col items-center text-center gap-3 hover:border-indigo-500/20 transition-all shadow-xl">
                     <i className={`fa-solid ${s.icon} text-indigo-500/30 text-xl mb-2`}></i>
                     <span className="text-4xl font-black text-white tracking-tighter">{s.val}</span>
                     <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{s.label}</span>
                  </div>
                ))}
             </div>

             <div className="flex justify-center border-b border-white/5 gap-16 lg:gap-32 overflow-x-auto no-scrollbar pb-6">
                {[
                  { id: 'links', label: 'Intercepted Nodes', icon: 'fa-diagram-project' },
                  { id: 'chats', label: 'Neural Echoes', icon: 'fa-comment-dots' },
                  { id: 'sources', label: 'Sources', icon: 'fa-fingerprint' }
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-4 pb-4 text-xs font-black uppercase relative transition-all ${activeTab === t.id ? 'text-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}>
                    <i className={`fa-solid ${t.icon}`}></i> {t.label}
                    {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>}
                  </button>
                ))}
             </div>

             <div className="min-h-[400px]">
               {activeTab === 'links' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {result.links.length === 0 ? (
                      <div className="col-span-full py-40 text-center opacity-20 italic font-black text-4xl">SIGNAL VOID</div>
                    ) : (
                      result.links.map(link => (
                        <div key={link.id} className="group bg-[#0c1221] border border-white/5 rounded-[3rem] p-10 hover:border-indigo-500/40 transition-all shadow-2xl flex flex-col relative overflow-hidden">
                           {link.isPrivate && <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black px-6 py-2 rounded-bl-xl uppercase">Node Active</div>}
                           <div className="flex justify-between items-center mb-10">
                              <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase border border-indigo-500/20 text-indigo-400 bg-indigo-500/5`}>{link.platform}</span>
                              <span className="text-2xl font-black text-white tracking-tighter">{link.confidence}%</span>
                           </div>
                           <h4 className="text-2xl font-black text-white mb-6 line-clamp-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{link.title}</h4>
                           <p className="text-gray-600 text-sm italic mb-12 line-clamp-2 leading-relaxed">{link.description}</p>
                           <div className="mt-auto pt-10 border-t border-white/5 flex items-center justify-between">
                              <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Protocol Sec</span>
                              <button onClick={() => setConfirmingLink(link)} className="px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase shadow-2xl transition-all">Establish Link</button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
               )}

               {activeTab === 'chats' && (
                  <div className="max-w-4xl mx-auto space-y-8">
                     {result.messages.map((m, idx) => (
                       <div key={idx} className="bg-[#0c1221] border border-white/5 rounded-[3.5rem] p-12 flex gap-10 items-start group shadow-xl">
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-500 font-black text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all">{m.author[0]}</div>
                          <div className="flex-1">
                             <div className="flex justify-between items-center mb-6">
                                <span className="text-2xl font-black text-white uppercase tracking-tight">{m.author}</span>
                                <span className="text-indigo-400 font-black text-xl">{m.relevance}%</span>
                             </div>
                             <p className="text-gray-400 text-xl italic pr-10 border-r-4 border-indigo-600/20 leading-relaxed font-medium">{m.content}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               )}

               {activeTab === 'sources' && (
                  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                     {result.sources.map((s, idx) => (
                       <a key={idx} href={s.uri} target="_blank" className="bg-[#0c1221] border border-white/5 p-10 rounded-[3rem] flex items-center justify-between group hover:bg-white/[0.03] transition-all shadow-xl">
                          <span className="text-xl font-black text-gray-300 group-hover:text-indigo-400 truncate max-w-[280px] uppercase tracking-tight">{s.title}</span>
                          <i className="fa-solid fa-arrow-up-right-from-square text-gray-700 group-hover:text-white transition-colors"></i>
                       </a>
                     ))}
                  </div>
               )}
             </div>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <div className="max-w-2xl mx-auto mt-20 p-16 bg-[#0c1221] border border-rose-500/20 rounded-[4rem] text-center shadow-3xl animate-fadeIn">
             <i className="fa-solid fa-triangle-exclamation text-6xl text-rose-500 mb-8 animate-pulse"></i>
             <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter">Neural Error</h3>
             <p className="text-rose-400/50 mb-12 italic text-xl font-medium">{error}</p>
             <button onClick={() => { setQuery(''); setError(null); }} className="px-16 py-6 bg-white/5 text-white font-black rounded-2xl border border-white/10 uppercase text-xs hover:bg-white/10 transition-all">Reset Matrix</button>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-12 text-center pointer-events-none opacity-20 z-0">
         <span className="text-[11px] font-black uppercase tracking-[1.5em] text-white">v17.0 NEURAL NEXUS • ULTRA SPEED • SIGNAL GRID ACTIVE</span>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes reverse-spin { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .animate-fadeIn { animation: fadeIn 1s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-reverse-spin { animation: reverse-spin 4s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1b4b; border-radius: 20px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input::placeholder { color: #15181f; transition: 0.5s; font-weight: 900; }
        input:focus::placeholder { opacity: 0; transform: translateX(30px); }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .backdrop-blur-4xl { backdrop-filter: blur(60px); }
      `}</style>
    </div>
  );
};

export default App;
