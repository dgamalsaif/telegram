
import React, { useState, useEffect, useRef } from 'react';
import { searchGlobalIntel } from './services/geminiService';
import { IntelLink, SearchResult, SearchType, Platform, PlatformType, SearchHistoryItem } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [town, setTown] = useState('');
  const [hospital, setHospital] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('medical-recon');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [confirmingLink, setConfirmingLink] = useState<IntelLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);

  const availablePlatforms: Platform[] = [
    { id: '1', name: 'Telegram', icon: 'fa-brands fa-telegram', connected: true, color: 'text-sky-400' },
    { id: '2', name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', connected: true, color: 'text-emerald-400' },
    { id: '3', name: 'LinkedIn', icon: 'fa-brands fa-linkedin', connected: true, color: 'text-blue-700' },
    { id: '4', name: 'X', icon: 'fa-brands fa-x-twitter', connected: true, color: 'text-gray-100' },
    { id: '5', name: 'Facebook', icon: 'fa-brands fa-facebook', connected: true, color: 'text-blue-500' },
    { id: '6', name: 'Discord', icon: 'fa-brands fa-discord', connected: true, color: 'text-indigo-400' },
    { id: '7', name: 'Reddit', icon: 'fa-brands fa-reddit', connected: true, color: 'text-orange-500' },
    { id: '8', name: 'Instagram', icon: 'fa-brands fa-instagram', connected: true, color: 'text-pink-500' }
  ];

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [...prev.slice(-30), `[${timestamp}] ${msg}`]);
    setTimeout(() => {
      if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, 50);
  };

  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const handleSearch = async (targetQuery?: string) => {
    const finalQuery = (targetQuery || query).trim();
    if (!finalQuery && !hospital && !specialty) {
      setError("Input target parameters (Keyword, Specialty, or Institution).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);
    setLoadingStep('Initializing Neural Recon Protocol...');

    try {
      addLog(`ENGINE: Starting ultra-scan for "${finalQuery || specialty}"`);
      addLog(`PLATFORMS: ${selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'Global Search'}`);
      
      const data = await searchGlobalIntel({
        query: finalQuery,
        location: location || 'Global',
        town,
        hospital,
        specialty,
        platforms: selectedPlatforms,
        searchType,
        filters: { activeOnly: true, privateOnly: false, minConfidence: 90 }
      });

      setResult(data);
      addLog(`SUCCESS: Found ${data.links.length} potential intelligence nodes.`);
      addLog(`REASONING: ${data.analysis.substring(0, 50)}...`);
    } catch (err: any) {
      setError(err.message || "Operation failed.");
      addLog(`FATAL: Signal loss during extraction.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010204] text-gray-200 font-cairo selection:bg-indigo-600/50 relative overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,#010204_70%)] opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px'}}></div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-b-4 border-sky-400 rounded-full animate-reverse-spin opacity-50"></div>
            <i className="fa-solid fa-satellite-dish text-6xl text-white animate-pulse"></i>
          </div>
          <h2 className="mt-12 text-4xl font-black text-white uppercase tracking-[0.2em]">{loadingStep}</h2>
          <div className="mt-4 flex gap-2">
            {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>)}
          </div>
        </div>
      )}

      {/* Link Access Modal */}
      {confirmingLink && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fadeIn">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] p-12 max-w-xl w-full shadow-[0_0_80px_rgba(79,70,229,0.15)] space-y-8">
            <div className="text-center">
              <div className={`w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-4xl bg-white/5 border border-white/10 mb-6`}>
                <i className={`fa-brands fa-${confirmingLink.platform.toLowerCase().replace('x', 'x-twitter')}`}></i>
              </div>
              <h3 className="text-3xl font-black text-white leading-tight">{confirmingLink.title}</h3>
              <p className="text-indigo-400 font-mono text-xs uppercase tracking-widest mt-2">{confirmingLink.platform} Intelligence</p>
            </div>
            
            <div className="p-6 bg-black rounded-2xl border border-white/5 font-mono text-xs break-all text-gray-400">
              {confirmingLink.url}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setConfirmingLink(null)} className="flex-1 py-5 bg-white/5 rounded-2xl font-black text-[11px] uppercase text-gray-400 hover:text-white transition-all">Abort</button>
              <button onClick={() => window.open(confirmingLink.url, '_blank')} className="flex-1 py-5 bg-indigo-600 rounded-2xl font-black text-[11px] uppercase text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all">Establish Link</button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto p-6 lg:p-12 space-y-16 pt-24">
        
        {/* Header Section */}
        <header className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center gap-4 px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">System Live: v7.5 Ultra Pro</span>
          </div>
          <h1 className="text-7xl lg:text-9xl font-black tracking-tighter text-white uppercase leading-none">
            SCOUT<span className="text-indigo-600">OPS</span>
          </h1>
          <p className="text-gray-500 max-w-2xl font-medium text-lg lg:text-xl">
            نظام الاستكشاف الرقمي المتقدم لتتبع المجتمعات الطبية والمهنية عبر كافة المنصات
          </p>
        </header>

        {/* Dashboard Controls */}
        <section className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 lg:p-12 backdrop-blur-3xl shadow-2xl space-y-12">
          
          {/* Platform Matrix */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Platform Matrix</h3>
              <button onClick={() => setSelectedPlatforms([])} className="text-[10px] font-bold text-gray-600 hover:text-white transition-colors">Clear All</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {availablePlatforms.map(p => (
                <button 
                  key={p.name}
                  onClick={() => togglePlatform(p.name as PlatformType)}
                  className={`h-24 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all duration-300 group ${selectedPlatforms.includes(p.name as PlatformType) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/50 border-white/5 text-gray-600 hover:border-white/10 hover:text-gray-300'}`}
                >
                  <i className={`${p.icon} text-xl group-hover:scale-110 transition-transform`}></i>
                  <span className="text-[9px] font-black uppercase tracking-tight">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Module */}
          <div className="space-y-8">
            <div className="flex justify-center gap-2 flex-wrap">
              {[
                { id: 'medical-recon', label: 'Medical Groups', icon: 'fa-stethoscope' },
                { id: 'mention-tracker', label: 'Mention Tracker', icon: 'fa-quote-left' },
                { id: 'deep-scan', label: 'Deep Global Scan', icon: 'fa-globe' }
              ].map(t => (
                <button key={t.id} onClick={() => setSearchType(t.id as any)} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase border transition-all flex items-center gap-3 ${searchType === t.id ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-transparent border-white/10 text-gray-500 hover:text-white'}`}>
                  <i className={`fa-solid ${t.icon}`}></i> {t.label}
                </button>
              ))}
            </div>

            <div className="relative group max-w-4xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative flex bg-black rounded-[3rem] p-2 items-center">
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Target Keyword, ID, or Link..."
                  className="flex-1 bg-transparent py-6 px-10 text-2xl font-black text-white focus:outline-none placeholder:text-gray-800"
                />
                <button onClick={() => handleSearch()} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] px-10 py-6 font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95">
                  {loading ? 'Processing...' : 'Execute'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { val: location, set: setLocation, ph: 'Global Region', icon: 'fa-location-dot' },
                { val: hospital, set: setHospital, ph: 'Target Institution', icon: 'fa-building-shield' },
                { val: specialty, set: setSpecialty, ph: 'Specialty Focus', icon: 'fa-brain' }
              ].map((f, i) => (
                <div key={i} className="flex items-center bg-black border border-white/5 rounded-2xl px-6 py-4">
                  <i className={`fa-solid ${f.icon} text-indigo-500/50 mr-4`}></i>
                  <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="bg-transparent text-xs font-bold text-gray-400 placeholder:text-gray-800 focus:outline-none w-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Results Deck */}
        {result && (
          <div className="animate-fadeIn space-y-12 pb-32">
            
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Signals Captured', val: result.stats.totalFound, icon: 'fa-satellite' },
                { label: 'Verified Nodes', val: result.links.length, icon: 'fa-shield-check' },
                { label: 'Medical Index', val: result.stats.medicalMatches, icon: 'fa-file-medical' },
                { label: 'Confidence', val: '98.4%', icon: 'fa-microchip' }
              ].map(s => (
                <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col items-center">
                  <div className="text-4xl font-black text-white mb-2 tracking-tighter">{s.val}</div>
                  <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                    <i className={`fa-solid ${s.icon} text-indigo-500`}></i> {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Terminal Feed */}
            <div className="bg-[#050508] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-white/5 px-6 py-3 flex items-center justify-between border-b border-white/5">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live Terminal Feed</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
              </div>
              <div ref={terminalRef} className="h-40 p-6 font-mono text-[10px] text-gray-500 overflow-y-auto space-y-2 scroll-smooth">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-indigo-900 shrink-0">[{i}]</span>
                    <span className="text-indigo-400/60 leading-relaxed">{log}</span>
                  </div>
                ))}
                {logs.length === 0 && <div className="opacity-20 italic">Waiting for connection...</div>}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {result.links.map(link => (
                <div key={link.id} className="group bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-500 flex flex-col relative overflow-hidden">
                  
                  <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest ${link.source.type === 'Direct' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {link.source.type} Signal
                  </div>

                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-3xl text-gray-600 group-hover:text-indigo-500 transition-colors">
                      <i className={`fa-brands fa-${link.platform.toLowerCase().replace('x', 'x-twitter')}`}></i>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">{link.platform}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{link.confidence}% Confidence</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    <h3 className="text-lg font-bold text-gray-200 leading-tight">{link.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{link.description}</p>
                  </div>

                  <div className="bg-black/50 rounded-2xl p-4 border border-white/5 mb-8">
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">Intel Context</span>
                    <p className="text-[10px] text-gray-400 italic font-mono leading-relaxed">
                      "{link.source.context || link.source.name}"
                    </p>
                  </div>

                  <button 
                    onClick={() => setConfirmingLink(link)}
                    className="w-full py-4 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/20 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
                  >
                    Initiate Connection
                  </button>
                </div>
              ))}
            </div>

            {result.links.length === 0 && !loading && (
              <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[4rem]">
                <i className="fa-solid fa-radar text-6xl text-white/5 mb-6"></i>
                <h3 className="text-2xl font-black text-white/20 uppercase tracking-[0.3em]">No Valid Signals Captured</h3>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto p-12 bg-rose-500/5 border border-rose-500/20 rounded-[3rem] text-center space-y-6 animate-shake">
            <i className="fa-solid fa-triangle-exclamation text-5xl text-rose-500"></i>
            <h3 className="text-2xl font-black text-white uppercase">Uplink Interrupted</h3>
            <p className="text-rose-400/70 text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full font-black text-[10px] uppercase tracking-widest transition-all">Retry Handshake</button>
          </div>
        )}

      </main>

      <footer className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50">
        <div className="bg-black/80 backdrop-blur-xl border border-white/5 px-8 py-3 rounded-full flex items-center gap-8 shadow-2xl">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Operational Status: <span className="text-indigo-500">Normal</span></span>
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Extraction Mode: <span className="text-sky-500">{searchType.replace('-', ' ')}</span></span>
        </div>
      </footer>

      <style>{`
        @keyframes reverse-spin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
        .animate-reverse-spin { animation: reverse-spin 10s linear infinite; }
        .animate-shake { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 10px; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default App;
