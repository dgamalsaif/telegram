
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { searchTelegramGroups } from './services/geminiService';
import { TelegramGroup, SearchResult, Platform, SearchType, SearchHistoryItem } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('topic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(5);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState('All');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Fix: Use ReturnType<typeof setInterval> to avoid dependency on NodeJS namespace in browser environment
  const logIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('tg_scout_history_v2');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('tg_scout_history_v2', JSON.stringify(history));
  }, [history]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSearch = async (targetQuery?: string) => {
    const finalQuery = targetQuery || query;
    if (!finalQuery.trim()) return;
    
    setLoading(true);
    setResult(null);
    setLogs([]);
    if (targetQuery) setQuery(targetQuery);

    const processSteps = [
      "إطلاق بروتوكول الاستكشاف...",
      "الاتصال بقواعد بيانات X...",
      "مسح المنشورات المهنية في LinkedIn...",
      "تحليل أوصاف TikTok و Instagram...",
      "مطابقة روابط WhatsApp المكتشفة...",
      "تصفية النتائج بناءً على الموثوقية..."
    ];

    let stepIdx = 0;
    logIntervalRef.current = setInterval(() => {
      if (stepIdx < processSteps.length) {
        addLog(processSteps[stepIdx]);
        stepIdx++;
      }
    }, 1200);

    try {
      const data = await searchTelegramGroups({ 
        query: finalQuery, country: 'Saudi Arabia', language: 'Arabic', category: 'OSINT', 
        platforms: ['LinkedIn', 'X', 'TikTok', 'Instagram'], mode: 'deep', searchType: searchType 
      });
      setResult(data);
      addLog("اكتمل الفحص بنجاح. تم استخراج الأهداف.");
      const newItem = { query: finalQuery, timestamp: new Date().toLocaleTimeString('ar-EG'), type: searchType };
      setHistory(prev => [newItem, ...prev.filter(i => i.query !== finalQuery)].slice(0, 10));
    } catch (err) {
      addLog("خطأ فادح في الاتصال.");
    } finally {
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    let groups = result?.parsedGroups.filter(g => g.confidenceScore >= confidenceThreshold) || [];
    if (activePlatform !== 'All') {
      groups = groups.filter(g => g.platformSource.toLowerCase().includes(activePlatform.toLowerCase()) || g.linkType.toLowerCase() === activePlatform.toLowerCase());
    }
    return groups;
  }, [result, confidenceThreshold, activePlatform]);

  return (
    <div className="min-h-screen bg-[#020408] text-gray-200 font-cairo selection:bg-indigo-500/40 overflow-x-hidden">
      {/* Dynamic Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.1),transparent)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      {/* Modern Glass Sidebar */}
      <aside className={`fixed top-0 bottom-0 right-0 z-50 bg-[#080a10]/80 backdrop-blur-3xl border-l border-white/5 transition-all duration-700 shadow-2xl ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <h2 className="text-[10px] font-black tracking-[0.4em] text-indigo-500 uppercase">Mission Control</h2>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-600 hover:text-white"><i className="fa-solid fa-x"></i></button>
          </div>

          <div className="space-y-10 flex-1 overflow-y-auto pr-2 custom-scroll">
            <div>
              <label className="text-[9px] font-black text-gray-600 uppercase mb-4 block tracking-widest">Target Type</label>
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setSearchType('topic')} className={`py-3 text-[10px] font-black rounded-xl transition-all ${searchType === 'topic' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>TOPIC</button>
                <button onClick={() => setSearchType('user')} className={`py-3 text-[10px] font-black rounded-xl transition-all ${searchType === 'user' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>USER</button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Signal Sensitivity</label>
                <span className="text-indigo-400 font-black text-[10px]">{confidenceThreshold}%</span>
              </div>
              <input type="range" min="0" max="100" value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-600 uppercase mb-4 block tracking-widest">Activity Logs</label>
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <div key={idx} onClick={() => handleSearch(item.query)} className="w-full text-right p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group">
                    <div className="text-[11px] font-bold text-gray-400 truncate group-hover:text-indigo-400">{item.query}</div>
                    <div className="flex justify-between mt-2"><span className="text-[8px] text-gray-700 uppercase">{item.timestamp}</span><span className={`text-[8px] uppercase font-black ${item.type === 'user' ? 'text-rose-500' : 'text-indigo-500'}`}>{item.type}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Command Center */}
      <main className={`transition-all duration-700 relative z-10 ${isSidebarOpen ? 'mr-80' : 'mr-0'} p-6 lg:p-16 max-w-[1600px] mx-auto`}>
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-8">
            <button onClick={() => setIsSidebarOpen(true)} className={`w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all ${isSidebarOpen ? 'hidden' : 'flex'}`}>
              <i className="fa-solid fa-radar text-indigo-500"></i>
            </button>
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                <span className="text-indigo-500">SCOUT</span> OPS <span className="text-[10px] font-light text-gray-700 ml-4">v2.1 GOLD</span>
              </h1>
              <div className="flex items-center gap-4 mt-4">
                 <span className="flex items-center gap-2 text-[10px] text-emerald-500 font-black tracking-widest uppercase"><i className="fa-solid fa-circle text-[6px]"></i> Global Uplink Active</span>
                 <span className="w-1 h-1 bg-gray-800 rounded-full"></span>
                 <span className="text-[10px] text-gray-600 font-black tracking-widest uppercase">Encryption: AES-256</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tactical Search Interface */}
        <div className="max-w-4xl mx-auto mb-16 relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 rounded-[4rem] blur-3xl opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative flex flex-col md:flex-row items-center bg-[#080a10]/95 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-4 shadow-3xl">
             <div className="flex-1 flex items-center px-8 py-4 gap-6 w-full">
                <i className={`fa-solid ${loading ? 'fa-dna fa-spin text-indigo-500' : (searchType === 'user' ? 'fa-fingerprint text-rose-500' : 'fa-magnifying-glass-chart text-indigo-500')} text-3xl`}></i>
                <input 
                  type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder={searchType === 'user' ? "Interrogating ID via Deep Scan..." : "Identify target topic or keyword..."}
                  className="w-full bg-transparent text-2xl font-black focus:outline-none placeholder:text-gray-800"
                />
             </div>
             <button disabled={loading} className={`w-full md:w-auto h-20 px-16 rounded-[2.8rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${loading ? 'bg-gray-900 cursor-not-allowed text-gray-700' : 'bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-500/20'}`}>
                {loading ? 'SCANNIG...' : 'INITIATE'}
             </button>
          </form>

          {/* Quick Platform Filters */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {['All', 'WhatsApp', 'Telegram', 'X', 'LinkedIn', 'TikTok', 'Instagram'].map(p => (
              <button key={p} onClick={() => setActivePlatform(p)} className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${activePlatform === p ? 'bg-white text-black border-white' : 'border-white/5 text-gray-600 hover:text-white hover:bg-white/5'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Intelligence Real-time Logs */}
        {loading && (
          <div className="max-w-2xl mx-auto mb-20 bg-black/40 border border-white/5 rounded-3xl p-6 font-mono text-[11px] text-indigo-400/80">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <i className="fa-solid fa-terminal text-xs"></i>
              <span>RECON_ENGINE_OUTPUT</span>
            </div>
            {logs.map((log, i) => (
              <div key={i} className="animate-pulse mb-1">{log}</div>
            ))}
            <div className="w-1 h-4 bg-indigo-500 inline-block animate-pulse ml-1"></div>
          </div>
        )}

        {/* Data Grid */}
        {result && !loading && (
          <div className="space-y-16 animate-slideIn">
            {/* Intel Summary Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#0a0c14]/90 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 shadow-3xl">
                 <h3 className="text-xl font-black uppercase mb-8 flex items-center gap-4 text-gray-400">
                   <i className="fa-solid fa-file-invoice text-indigo-500"></i> Intelligence Briefing
                 </h3>
                 <p className="text-gray-300 leading-relaxed text-xl italic pr-8 border-r-4 border-indigo-500/20 whitespace-pre-wrap">{result.text}</p>
                 
                 {/* Grounding Sources */}
                 {result.sources.length > 0 && (
                   <div className="mt-12 pt-10 border-t border-white/5">
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] block mb-6">Validated Web Sources</span>
                      <div className="flex flex-wrap gap-4">
                        {result.sources.map((s, i) => (
                          <a key={i} href={s.uri} target="_blank" className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 text-[10px] text-gray-500 hover:text-indigo-400 transition-all truncate max-w-xs flex items-center gap-2">
                            <i className="fa-solid fa-link text-[8px]"></i> {s.title}
                          </a>
                        ))}
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="bg-[#0a0c14]/90 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-3xl flex flex-col justify-center items-center text-center">
                 <div className="relative w-32 h-32 mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-900" />
                      <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={376.8} strokeDashoffset={376.8 - (376.8 * (result.parsedGroups.length / 20))} className="text-indigo-500" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black">{result.parsedGroups.length}</span>
                      <span className="text-[8px] font-black text-gray-600 uppercase">Nodes</span>
                    </div>
                 </div>
                 <h4 className="text-sm font-black uppercase text-gray-400 mb-2">Threat Assessment</h4>
                 <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase ${result.summary?.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'}`}>
                   {result.summary?.riskLevel || 'Low'} Risk Level
                 </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-40">
               {filteredResults.map(group => (
                 <div key={group.id} className="group/card bg-[#0b0e14] border border-white/5 rounded-[3rem] p-8 hover:border-indigo-500/40 transition-all duration-700 flex flex-col h-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-indigo-500/40 animate-scan opacity-0 group-hover/card:opacity-100"></div>
                    
                    <div className="flex justify-between items-start mb-8">
                       <div className={`px-4 py-2 rounded-xl text-[8px] font-black border uppercase tracking-widest flex items-center gap-2 ${group.linkType === 'WhatsApp' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'}`}>
                         <i className={`fa-brands ${group.linkType === 'WhatsApp' ? 'fa-whatsapp' : 'fa-telegram'}`}></i>
                         {group.platformSource}
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(group.url); setCopiedId(group.id); setTimeout(() => setCopiedId(null), 2000); }} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                         <i className={`fa-solid ${copiedId === group.id ? 'fa-check text-emerald-500' : 'fa-copy'} text-[10px]`}></i>
                       </button>
                    </div>

                    <div className="flex-1 mb-8">
                       <h4 className="text-xl font-black mb-3 uppercase tracking-tighter leading-tight group-hover/card:text-indigo-400 transition-colors line-clamp-2">{group.title}</h4>
                       <p className="text-gray-500 text-[12px] leading-relaxed italic line-clamp-3 group-hover/card:text-gray-400">{group.description}</p>
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                       <div className="flex flex-col gap-1.5">
                          <span className="text-[7px] font-black text-gray-700 uppercase">Conf. {group.confidenceScore}%</span>
                          <div className="w-16 h-1 bg-gray-900 rounded-full overflow-hidden">
                            <div className={`h-full ${group.linkType === 'WhatsApp' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{width: `${group.confidenceScore}%`}}></div>
                          </div>
                       </div>
                       <a href={group.url} target="_blank" className={`h-12 px-8 rounded-2xl font-black text-[9px] uppercase flex items-center justify-center transition-all shadow-xl active:scale-95 ${group.linkType === 'WhatsApp' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                         Engage Node
                       </a>
                    </div>
                 </div>
               ))}
               {filteredResults.length === 0 && (
                 <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[4rem]">
                    <i className="fa-solid fa-ghost text-4xl text-gray-800 mb-6"></i>
                    <p className="text-gray-600 uppercase font-black text-xs tracking-widest">No active signals detected in this sector</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        .font-cairo { font-family: 'Cairo', sans-serif; }
        @keyframes scan { 0% { top: -10%; opacity: 0; } 50% { opacity: 0.5; } 100% { top: 110%; opacity: 0; } }
        .animate-scan { animation: scan 3s linear infinite; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideIn { animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #1a1c2e; border-radius: 10px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #6366f1; cursor: pointer; border: 2px solid #000; }
      `}</style>
    </div>
  );
};

export default App;
