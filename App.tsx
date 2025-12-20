
import React, { useState, useEffect, useRef } from 'react';
import { searchGlobalIntel } from './services/geminiService';
import { IntelLink, SearchResult, SearchType, Platform, PlatformType } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('deep-scan');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['Telegram', 'WhatsApp']);
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeLink, setActiveLink] = useState<IntelLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);

  // بروتوكول التشغيل الأولي لمحاكاة الفحص
  useEffect(() => {
    const bootSequence = [
      "SYSTEM: INITIALIZING SCOUT OPS KERNEL v7.5...",
      "MODULE: LOADING NEURAL SEARCH VECTORS...",
      "NETWORK: ESTABLISHING SECURE HANDSHAKE WITH GEMINI 3 PRO...",
      "GROUNDING: GOOGLE SEARCH TOOL READY.",
      "STATUS: ALL SYSTEMS OPERATIONAL. READY FOR RECONNAISSANCE."
    ];

    bootSequence.forEach((msg, i) => {
      setTimeout(() => addLog(msg), i * 600);
    });
  }, []);

  const availablePlatforms: Platform[] = [
    { id: '1', name: 'Telegram', icon: 'fa-brands fa-telegram', connected: true, color: 'text-sky-400' },
    { id: '2', name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', connected: true, color: 'text-emerald-400' },
    { id: '3', name: 'LinkedIn', icon: 'fa-brands fa-linkedin', connected: true, color: 'text-blue-700' },
    { id: '4', name: 'X', icon: 'fa-brands fa-x-twitter', connected: true, color: 'text-white' },
    { id: '5', name: 'Facebook', icon: 'fa-brands fa-facebook', connected: true, color: 'text-blue-500' },
    { id: '6', name: 'Discord', icon: 'fa-brands fa-discord', connected: true, color: 'text-indigo-400' },
    { id: '7', name: 'Reddit', icon: 'fa-brands fa-reddit', connected: true, color: 'text-orange-500' },
    { id: '8', name: 'Instagram', icon: 'fa-brands fa-instagram', connected: true, color: 'text-pink-500' }
  ];

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour12: false });
    setLogs(prev => [...prev.slice(-50), `[${timestamp}] ${msg}`]);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const handleSearch = async () => {
    if (!query.trim() && !specialty.trim()) {
      setError("يرجى إدخال كلمة البحث الأساسية أو التخصص المطلوب.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] --- NEW OPERATION STARTED ---`]);
    setLoadingStep('جاري تهيئة بروتوكول الاستكشاف...');

    try {
      addLog(`ENGINE: بدء البحث عن "${query || specialty}"`);
      addLog(`PARAMS: الموقع [${location || 'عالمي'}] | المنصات [${selectedPlatforms.join(', ')}]`);
      
      setLoadingStep('جاري تحليل فضاء البيانات الرقمي...');
      addLog("INTEL: جاري الاتصال بمحركات البحث والتحقق من الروابط...");

      const data = await searchGlobalIntel({
        query,
        location: location || 'Global',
        specialty,
        platforms: selectedPlatforms,
        searchType,
        filters: { activeOnly: true, privateOnly: false, minConfidence: 85 }
      });

      setResult(data);
      addLog(`SUCCESS: تم العثور على ${data.links.length} إشارة استخباراتية.`);
      addLog(`ANALYSIS: ${data.analysis.substring(0, 100)}...`);
    } catch (err: any) {
      const msg = "فشل في استرداد البيانات. يرجى التأكد من صلاحية المفتاح أو اتصال الشبكة.";
      setError(msg);
      addLog(`CRITICAL: خطأ في المحرك. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010204] text-slate-200 font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      
      {/* Background Visuals */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#1e1b4b_0%,#010204_80%)] opacity-40"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px'}}></div>
      </div>

      {/* Operation Loader */}
      {loading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl transition-opacity">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
            <div className="text-center z-10">
              <i className="fa-solid fa-radar text-6xl text-indigo-500 animate-pulse mb-4"></i>
              <div className="text-[10px] font-black text-indigo-400 font-mono tracking-widest uppercase">Executing Recon</div>
            </div>
          </div>
          <h2 className="mt-12 text-3xl font-black text-white uppercase tracking-[0.2em]">{loadingStep}</h2>
          <div className="mt-6 flex gap-2">
            {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>)}
          </div>
        </div>
      )}

      {/* Link Insight Modal */}
      {activeLink && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-[3rem] p-10 max-w-xl w-full shadow-[0_0_100px_rgba(79,70,229,0.2)] relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"></div>
            <div className="text-center space-y-8">
              <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mx-auto text-indigo-500 shadow-inner">
                <i className={`fa-brands fa-${activeLink.platform.toLowerCase().replace('x', 'x-twitter')}`}></i>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white leading-tight">{activeLink.title}</h3>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">{activeLink.platform} Network Node</p>
              </div>
              
              <div className="p-6 bg-black rounded-2xl border border-white/5 font-mono text-[10px] break-all text-indigo-300/60 text-center leading-relaxed">
                {activeLink.url}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setActiveLink(null)} className="flex-1 py-5 bg-white/5 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">إلغاء الأمر</button>
                <button onClick={() => window.open(activeLink.url, '_blank')} className="flex-1 py-5 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">تفعيل الرابط</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto p-6 lg:p-12 space-y-12 pt-24 pb-40">
        
        {/* Top Header */}
        <header className="flex flex-col items-center text-center space-y-10 animate-in fade-in slide-in-from-top-12 duration-1000">
          <div className="inline-flex items-center gap-4 px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-2xl">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Operational Status: Ready</span>
          </div>
          <h1 className="text-7xl lg:text-9xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-2xl">
            SCOUT<span className="text-indigo-600">OPS</span><span className="text-indigo-500 text-3xl font-black align-top mr-4">7.5</span>
          </h1>
          <p className="text-slate-500 max-w-3xl font-medium text-lg lg:text-2xl leading-relaxed">
            النظام الاستخباراتي الأقوى لاستكشاف المجموعات والمجتمعات الرقمية المتخصصة عبر كافة المنصات.
          </p>
        </header>

        {/* Command Center Panel */}
        <section className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-8 lg:p-14 backdrop-blur-3xl shadow-2xl space-y-14">
          
          {/* Platform Selector */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-6">
              <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">مصفوفة الاستهداف (Platforms)</h3>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{selectedPlatforms.length} منصة مفعلة</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {availablePlatforms.map(p => (
                <button 
                  key={p.name}
                  onClick={() => togglePlatform(p.name as PlatformType)}
                  className={`h-28 flex flex-col items-center justify-center gap-4 rounded-3xl border transition-all duration-500 group relative overflow-hidden ${selectedPlatforms.includes(p.name as PlatformType) ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]' : 'bg-black/40 border-white/5 text-slate-600 hover:border-white/20'}`}
                >
                  <i className={`${p.icon} text-3xl group-hover:scale-125 transition-transform duration-500`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Module */}
          <div className="space-y-12">
            <div className="flex justify-center gap-4 flex-wrap">
              {[
                { id: 'deep-scan', label: 'مسح شامل', icon: 'fa-globe' },
                { id: 'medical-recon', label: 'بحث طبي متخصص', icon: 'fa-user-doctor' },
                { id: 'mention-tracker', label: 'تتبع الروابط', icon: 'fa-link' }
              ].map(t => (
                <button key={t.id} onClick={() => setSearchType(t.id as any)} className={`px-10 py-5 rounded-full text-[10px] font-black uppercase border transition-all flex items-center gap-4 ${searchType === t.id ? 'bg-white text-black border-white shadow-2xl scale-110' : 'bg-transparent border-white/10 text-slate-500 hover:text-white'}`}>
                  <i className={`fa-solid ${t.icon}`}></i> {t.label}
                </button>
              ))}
            </div>

            <div className="relative group max-w-5xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 rounded-[4rem] blur opacity-10 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative flex bg-[#020305] rounded-[4rem] p-3 items-center border border-white/10 shadow-3xl">
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="أدخل الكلمة المفتاحية (مثال: أطباء امتياز، هندسة، تجارة)..."
                  className="flex-1 bg-transparent py-8 px-10 text-2xl font-bold text-white focus:outline-none placeholder:text-slate-800 placeholder:italic"
                />
                <button onClick={() => handleSearch()} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-[3.5rem] px-14 py-8 font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 shadow-2xl shadow-indigo-600/30 flex items-center gap-4 group">
                  {loading ? 'Processing...' : 'تنفيذ المسح'}
                  <i className="fa-solid fa-bolt-lightning group-hover:-translate-x-2 transition-transform"></i>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="flex items-center bg-black border border-white/5 rounded-3xl px-10 py-6 group focus-within:border-indigo-500/50 transition-all">
                <i className="fa-solid fa-map-location-dot text-indigo-500 text-xl ml-6"></i>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="المنطقة الجغرافية / عالمي" className="bg-transparent text-sm font-bold text-slate-400 placeholder:text-slate-800 focus:outline-none w-full" />
              </div>
              <div className="flex items-center bg-black border border-white/5 rounded-3xl px-10 py-6 group focus-within:border-indigo-500/50 transition-all">
                <i className="fa-solid fa-microchip text-indigo-500 text-xl ml-6"></i>
                <input type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="التخصص الدقيق (اختياري)" className="bg-transparent text-sm font-bold text-slate-400 placeholder:text-slate-800 focus:outline-none w-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence Intel Deck */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 space-y-16 pb-32">
            
            {/* Intel Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'إجمالي الإشارات', val: result.stats.totalFound, icon: 'fa-satellite-dish' },
                { label: 'روابط مفحوصة', val: result.links.length, icon: 'fa-shield-check' },
                { label: 'تطابق المحتوى', val: result.stats.medicalMatches, icon: 'fa-dna' },
                { label: 'وقت التشغيل', val: '100%', icon: 'fa-bolt' }
              ].map(s => (
                <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 flex flex-col items-center group hover:bg-white/[0.04] transition-all">
                  <div className="text-6xl font-black text-white mb-2 tracking-tighter group-hover:scale-110 transition-transform">{s.val}</div>
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-3">
                    <i className={`fa-solid ${s.icon} text-indigo-500`}></i> {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Data Feed (Terminal) */}
            <div className="bg-[#050508] border border-white/10 rounded-[3rem] overflow-hidden shadow-3xl">
              <div className="bg-white/5 px-8 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">مراقب المخرجات اللحظي</span>
                </div>
                <div className="text-[9px] font-mono text-slate-700">SCOUT_LOG_7.5</div>
              </div>
              <div ref={terminalRef} className="h-56 p-10 font-mono text-[11px] text-slate-500 overflow-y-auto space-y-3 scroll-smooth custom-scrollbar bg-[rgba(0,0,0,0.7)]">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <span className="text-indigo-900 shrink-0 select-none">[{i.toString().padStart(3, '0')}]</span>
                    <span className={`leading-relaxed ${log.includes('SUCCESS') ? 'text-emerald-400/80' : log.includes('CRITICAL') ? 'text-rose-400/80' : 'text-indigo-400/60'}`}>{log}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Discovery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {result.links.map(link => (
                <div key={link.id} className="group bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all duration-700 flex flex-col relative overflow-hidden">
                  
                  <div className="absolute top-0 right-0 px-10 py-4 rounded-bl-[2rem] text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border-l border-b border-white/5">
                    ثقة {link.confidence}%
                  </div>

                  <div className="flex items-center gap-8 mb-12">
                    <div className="w-20 h-20 rounded-[2rem] bg-black border border-white/5 flex items-center justify-center text-4xl text-slate-600 group-hover:text-indigo-500 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                      <i className={`fa-brands fa-${link.platform.toLowerCase().replace('x', 'x-twitter')}`}></i>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{link.platform}</h4>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Verified Node</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 mb-12">
                    <h3 className="text-2xl font-bold text-slate-100 leading-tight group-hover:text-white transition-colors">{link.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 font-medium">{link.description}</p>
                  </div>

                  <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 mb-12 space-y-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">سياق الاستخراج</span>
                    <p className="text-[11px] text-slate-400 italic font-mono leading-relaxed line-clamp-2">
                      "{link.source.context || "تم العثور على الإشارة عبر مسح القنوات المفتوحة والمؤرشفة رقمياً."}"
                    </p>
                  </div>

                  <button 
                    onClick={() => setActiveLink(link)}
                    className="w-full py-6 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/20 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] transition-all duration-500 active:scale-95 shadow-xl group/btn overflow-hidden relative"
                  >
                    <span className="relative z-10">إقامة اتصال (Link)</span>
                    <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
                  </button>
                </div>
              ))}
            </div>

            {result.links.length === 0 && !loading && (
              <div className="text-center py-40 border-2 border-dashed border-white/10 rounded-[5rem] animate-pulse">
                <i className="fa-solid fa-radar text-7xl text-white/5 mb-8"></i>
                <h3 className="text-3xl font-black text-white/10 uppercase tracking-[0.4em]">Zero Signals Captured</h3>
                <p className="text-slate-800 mt-4 text-xs font-bold uppercase">Adjust recon parameters and retry handshake</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto p-16 bg-rose-500/5 border border-rose-500/20 rounded-[4rem] text-center space-y-10 animate-shake">
            <i className="fa-solid fa-triangle-exclamation text-7xl text-rose-500 drop-shadow-2xl"></i>
            <div className="space-y-6">
              <h3 className="text-3xl font-black text-white uppercase tracking-tight">انقطاع في الإشارة</h3>
              <p className="text-rose-400/80 text-md font-bold leading-relaxed">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="px-14 py-5 bg-white/5 hover:bg-white/10 text-white rounded-full font-black text-[11px] uppercase tracking-widest transition-all border border-white/5">إعادة المحاولة</button>
          </div>
        )}

      </main>

      {/* Floating Status Bar */}
      <footer className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none z-[100]">
        <div className="bg-black/90 backdrop-blur-3xl border border-white/10 px-12 py-5 rounded-full flex items-center gap-12 shadow-3xl pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">الحالة: <span className="text-white">نشط</span></span>
          </div>
          <div className="h-6 w-px bg-white/10"></div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">النمط: <span className="text-indigo-400">{searchType.replace('-', ' ')}</span></span>
          <div className="h-6 w-px bg-white/10"></div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">المحرك: <span className="text-sky-400">G-3 PRO</span></span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #312e81; border-radius: 10px; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.4s ease-in-out infinite; }
        .animate-in { animation: fadeIn 1s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default App;
