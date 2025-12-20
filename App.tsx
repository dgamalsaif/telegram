
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
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour12: false });
    setLogs(prev => [...prev.slice(-30), `[${timestamp}] ${msg}`]);
    setTimeout(() => {
      if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, 100);
  };

  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const handleSearch = async (targetQuery?: string) => {
    const finalQuery = (targetQuery || query).trim();
    if (!finalQuery && !hospital && !specialty) {
      setError("يرجى إدخال معايير البحث (كلمة مفتاحية، تخصص، أو منشأة).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);
    setLoadingStep('جاري تهيئة بروتوكول الاستكشاف العصبي...');

    try {
      addLog(`ENGINE: بدء البحث عن "${finalQuery || specialty}"`);
      addLog(`PLATFORMS: ${selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'بحث شامل'}`);
      
      setLoadingStep('جاري اختراق فضاء البيانات...');
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
      addLog(`SUCCESS: تم العثور على ${data.links.length} نقطة استخباراتية.`);
    } catch (err: any) {
      setError("فشل في استرداد البيانات. يرجى التحقق من المفتاح أو الاتصال.");
      addLog(`FATAL: انقطاع الإشارة أثناء الاستخراج.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010204] text-gray-200 font-['Cairo'] selection:bg-indigo-600/50 relative overflow-x-hidden" dir="rtl">
      
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,#010204_80%)] opacity-40"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl animate-fadeIn">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
            <i className="fa-solid fa-satellite-dish text-5xl text-white animate-pulse"></i>
          </div>
          <h2 className="mt-12 text-3xl font-black text-white uppercase tracking-widest">{loadingStep}</h2>
          <p className="mt-4 text-indigo-400 font-mono text-[10px] tracking-[0.5em] animate-pulse">SCOUT OPS v7.5 ACTIVE</p>
        </div>
      )}

      {/* Result Modal */}
      {confirmingLink && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"></div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-6">
                <i className={`fa-brands fa-${confirmingLink.platform.toLowerCase().replace('x', 'x-twitter')}`}></i>
              </div>
              <h3 className="text-2xl font-black text-white leading-tight">{confirmingLink.title}</h3>
              <p className="text-indigo-400 text-xs font-bold mt-2 uppercase tracking-widest">{confirmingLink.platform} Network</p>
            </div>
            
            <div className="p-5 bg-black rounded-2xl border border-white/5 font-mono text-[10px] break-all text-gray-500 text-center">
              {confirmingLink.url}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setConfirmingLink(null)} className="flex-1 py-4 bg-white/5 rounded-2xl font-black text-xs text-gray-400 hover:text-white transition-all">إلغاء</button>
              <button onClick={() => window.open(confirmingLink.url, '_blank')} className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-xs text-white shadow-xl hover:bg-indigo-500 transition-all">دخول القناة</button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto p-6 lg:p-12 space-y-12 pt-20">
        
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">المستكشف الرقمي | v7.5 Ultra Pro</span>
          </div>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-white uppercase leading-none">
            SCOUT<span className="text-indigo-600">OPS</span>
          </h1>
          <p className="text-gray-500 max-w-2xl font-medium text-lg">
            تتبع المجموعات والمجتمعات المهنية عبر فضاء الإنترنت المفتوح بدقة الذكاء الاصطناعي
          </p>
        </header>

        {/* Dashboard Card */}
        <section className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 lg:p-10 backdrop-blur-3xl shadow-2xl space-y-10">
          
          {/* Platforms */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">مصفوفة المنصات</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {availablePlatforms.map(p => (
                <button 
                  key={p.name}
                  onClick={() => togglePlatform(p.name as PlatformType)}
                  className={`h-20 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all duration-300 group ${selectedPlatforms.includes(p.name as PlatformType) ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-black/50 border-white/5 text-gray-600 hover:border-white/20'}`}
                >
                  <i className={`${p.icon} text-lg group-hover:scale-110 transition-transform`}></i>
                  <span className="text-[9px] font-black uppercase tracking-tight">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="space-y-8">
            <div className="flex justify-center gap-2 flex-wrap">
              {[
                { id: 'medical-recon', label: 'مجموعات طبية', icon: 'fa-stethoscope' },
                { id: 'mention-tracker', label: 'تتبع الإشارات', icon: 'fa-radar' },
                { id: 'deep-scan', label: 'مسح عالمي عميق', icon: 'fa-globe' }
              ].map(t => (
                <button key={t.id} onClick={() => setSearchType(t.id as any)} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase border transition-all flex items-center gap-3 ${searchType === t.id ? 'bg-white text-black border-white shadow-xl' : 'bg-transparent border-white/10 text-gray-500 hover:text-white'}`}>
                  <i className={`fa-solid ${t.icon}`}></i> {t.label}
                </button>
              ))}
            </div>

            <div className="relative group max-w-4xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-sky-600 rounded-[3rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative flex bg-black rounded-[3rem] p-2 items-center border border-white/5">
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="أدخل الكلمة المفتاحية، التخصص، أو اسم المجموعة..."
                  className="flex-1 bg-transparent py-5 px-8 text-xl font-bold text-white focus:outline-none placeholder:text-gray-800"
                />
                <button onClick={() => handleSearch()} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] px-10 py-5 font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                  {loading ? 'جاري البحث...' : 'تنفيذ المسح'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { val: location, set: setLocation, ph: 'المنطقة الجغرافية', icon: 'fa-location-dot' },
                { val: hospital, set: setHospital, ph: 'المستشفى / المؤسسة', icon: 'fa-hospital' },
                { val: specialty, set: setSpecialty, ph: 'التخصص الدقيق', icon: 'fa-dna' }
              ].map((f, i) => (
                <div key={i} className="flex items-center bg-black border border-white/5 rounded-2xl px-6 py-4">
                  <i className={`fa-solid ${f.icon} text-indigo-500/40 ml-4`}></i>
                  <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="bg-transparent text-xs font-bold text-gray-400 placeholder:text-gray-800 focus:outline-none w-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        {result && (
          <div className="animate-fadeIn space-y-12 pb-24">
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'إجمالي الإشارات', val: result.stats.totalFound, icon: 'fa-satellite' },
                { label: 'روابط نشطة', val: result.links.length, icon: 'fa-link' },
                { label: 'تطابق مهني', val: result.stats.medicalMatches, icon: 'fa-user-doctor' },
                { label: 'دقة التحليل', val: '99.4%', icon: 'fa-microchip' }
              ].map(s => (
                <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col items-center">
                  <div className="text-3xl font-black text-white mb-1 tracking-tighter">{s.val}</div>
                  <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                    <i className={`fa-solid ${s.icon} text-indigo-500`}></i> {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Terminal Side */}
            <div className="bg-[#050508] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-white/5 px-6 py-2 flex items-center justify-between border-b border-white/5">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">سجل المخرجات الحية</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                </div>
              </div>
              <div ref={terminalRef} className="h-32 p-5 font-mono text-[10px] text-gray-500 overflow-y-auto space-y-1.5 scroll-smooth custom-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-indigo-900 shrink-0">[{i}]</span>
                    <span className="text-indigo-400/50 leading-relaxed">{log}</span>
                  </div>
                ))}
                {logs.length === 0 && <div className="opacity-20 italic">في انتظار تنفيذ أمر بحث...</div>}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.links.map(link => (
                <div key={link.id} className="group bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-500 flex flex-col relative overflow-hidden">
                  
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-2xl text-gray-600 group-hover:text-indigo-500 transition-colors">
                      <i className={`fa-brands fa-${link.platform.toLowerCase().replace('x', 'x-twitter')}`}></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">{link.platform}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                        <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">ثقة {link.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 mb-6">
                    <h3 className="text-md font-bold text-gray-200 leading-tight line-clamp-2">{link.title}</h3>
                    <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-3 font-medium">{link.description}</p>
                  </div>

                  <div className="bg-black/40 rounded-xl p-3 border border-white/5 mb-6">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-1">سياق المصدر</span>
                    <p className="text-[9px] text-gray-400 italic font-mono leading-relaxed line-clamp-2">
                      "{link.source.context || link.source.name}"
                    </p>
                  </div>

                  <button 
                    onClick={() => setConfirmingLink(link)}
                    className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                  >
                    عرض التفاصيل والاسترداد
                  </button>
                </div>
              ))}
            </div>

            {result.links.length === 0 && !loading && (
              <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[3rem]">
                <i className="fa-solid fa-radar text-5xl text-white/5 mb-4"></i>
                <h3 className="text-xl font-black text-white/20 uppercase tracking-widest">لم يتم التقاط أي إشارات صالحة</h3>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto p-10 bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] text-center space-y-6">
            <i className="fa-solid fa-triangle-exclamation text-4xl text-rose-500"></i>
            <h3 className="text-xl font-black text-white uppercase">خطأ في الاتصال</h3>
            <p className="text-rose-400/70 text-xs font-medium leading-relaxed">{error}</p>
            <button onClick={() => setError(null)} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full font-black text-[9px] uppercase tracking-widest transition-all">إعادة المحاولة</button>
          </div>
        )}

      </main>

      <footer className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-50">
        <div className="bg-black/80 backdrop-blur-2xl border border-white/10 px-6 py-2 rounded-full flex items-center gap-6 shadow-2xl">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">الحالة: <span className="text-indigo-500">نشط</span></span>
          <div className="h-3 w-px bg-white/10"></div>
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">المحرك: <span className="text-sky-500">Gemini 3 Pro</span></span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1b4b; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default App;
