
import React, { useState, useEffect, useRef } from 'react';
import { searchGlobalIntel, testConnection } from './services/geminiService';
import { IntelLink, SearchResult, PlatformType } from './types';

const availablePlatforms: { name: PlatformType; icon: string }[] = [
  { name: 'Telegram', icon: 'fa-brands fa-telegram' },
  { name: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
  { name: 'Discord', icon: 'fa-brands fa-discord' },
  { name: 'X', icon: 'fa-brands fa-x-twitter' },
  { name: 'Facebook', icon: 'fa-brands fa-facebook' },
  { name: 'Instagram', icon: 'fa-brands fa-instagram' },
  { name: 'LinkedIn', icon: 'fa-brands fa-linkedin' },
  { name: 'Reddit', icon: 'fa-brands fa-reddit' },
  { name: 'TikTok', icon: 'fa-brands fa-tiktok' },
];

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['Telegram', 'WhatsApp']);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  const terminalRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour12: false });
    setLogs(prev => [...prev.slice(-30), `[${timestamp}] ${msg}`]);
  };

  const checkApi = async () => {
    setApiStatus('checking');
    try {
      const isOk = await testConnection();
      if (isOk) {
        setApiStatus('online');
        addLog("SYSTEM: CONNECTION SECURE. READY.");
      } else {
        setApiStatus('offline');
        addLog("SYSTEM: API KEY REQUIRED.");
      }
    } catch {
      setApiStatus('offline');
    }
  };

  useEffect(() => {
    checkApi();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleOpenKeyDialog = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      addLog("USER: SELECTING KEY...");
      // @ts-ignore
      await window.aistudio.openSelectKey();
      checkApi();
    } else {
      setError("يرجى التأكد من إضافة مفتاح API في إعدادات البيئة.");
    }
  };

  const handleSearch = async () => {
    if (apiStatus !== 'online') {
      handleOpenKeyDialog();
      return;
    }
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      addLog(`RECON: SCANNING FOR "${query}"...`);
      const data = await searchGlobalIntel({
        query,
        location: 'Global',
        platforms: selectedPlatforms,
        searchType: 'deep-scan',
        filters: { activeOnly: true, privateOnly: false, minConfidence: 85 }
      });

      setResult(data);
      addLog(`SUCCESS: ${data.links.length} SIGNALS FOUND.`);
    } catch (err: any) {
      setError("حدث خطأ في الاتصال. يرجى التحقق من المفتاح.");
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010204] text-slate-200 font-['Cairo'] relative selection:bg-indigo-500/30" dir="rtl">
      
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#1e1b4b_0%,#010204_80%)]"></div>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-20 space-y-12">
        
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-6">
          <div 
            onClick={apiStatus === 'offline' ? handleOpenKeyDialog : undefined}
            className={`cursor-pointer inline-flex items-center gap-3 px-5 py-2 rounded-full border transition-all ${apiStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'}`}
          >
            <span className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {apiStatus === 'online' ? 'Engine Ready' : apiStatus === 'checking' ? 'Testing...' : 'Action Required: Connect Key'}
            </span>
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-white uppercase italic">
            SCOUT<span className="text-indigo-600">OPS</span><span className="text-indigo-400 text-xl not-italic mr-2">v7</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto">نظام استخباراتي للبحث المفتوح عن مجموعات وقنوات التواصل.</p>
        </header>

        {/* Controls */}
        <section className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 lg:p-12 backdrop-blur-3xl shadow-2xl space-y-10">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {availablePlatforms.map(p => (
              <button 
                key={p.name}
                onClick={() => setSelectedPlatforms(prev => prev.includes(p.name) ? prev.filter(x => x !== p.name) : [...prev, p.name])}
                className={`h-20 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all ${selectedPlatforms.includes(p.name) ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-600 hover:border-white/20'}`}
              >
                <i className={`${p.icon} text-xl`}></i>
                <span className="text-[8px] font-black uppercase">{p.name}</span>
              </button>
            ))}
          </div>

          <div className="relative group">
            <div className="flex bg-black/60 rounded-3xl p-2 border border-white/10 shadow-inner">
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="أدخل موضوع البحث (مثلاً: وظائف، مجموعات طبية)..."
                className="flex-1 bg-transparent py-5 px-8 text-lg font-bold text-white focus:outline-none placeholder:text-slate-700"
              />
              <button 
                onClick={handleSearch} 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl px-10 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
              >
                {loading ? 'Recon...' : 'بدء المسح'}
              </button>
            </div>
          </div>
        </section>

        {/* Console & Results */}
        {(logs.length > 0 || result) && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden font-mono text-[9px] text-indigo-400/60 p-6 h-32 overflow-y-auto custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 mb-1">
                  <span className="text-slate-800">[{i}]</span>
                  <span className={log.includes('SUCCESS') ? 'text-emerald-500/80' : log.includes('ERROR') ? 'text-rose-500/80' : ''}>{log}</span>
                </div>
              ))}
            </div>

            {result && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.links.map(link => (
                  <div key={link.id} className="group bg-white/[0.01] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all">
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-12 h-12 rounded-xl bg-black border border-white/5 flex items-center justify-center text-2xl text-slate-500 group-hover:text-indigo-400">
                        <i className={`fa-brands fa-${link.platform.toLowerCase().replace('x', 'x-twitter')}`}></i>
                      </div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{link.confidence}% Match</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{link.title}</h3>
                    <p className="text-[11px] text-slate-500 mb-6 line-clamp-2 leading-relaxed">{link.description}</p>
                    <button onClick={() => window.open(link.url, '_blank')} className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600 rounded-xl text-indigo-400 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all">
                      فتح القناة / المجموعة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl text-center space-y-4">
            <p className="text-rose-400 text-sm font-bold">{error}</p>
            <button onClick={handleOpenKeyDialog} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase">إعداد المفتاح</button>
          </div>
        )}

      </main>

      {/* Mini Status */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/90 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full flex items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-[8px] font-black text-slate-500 uppercase">Flash: {apiStatus}</span>
          </div>
          <button onClick={handleOpenKeyDialog} className="text-[8px] font-black text-indigo-400 hover:text-white uppercase transition-colors">Config</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
