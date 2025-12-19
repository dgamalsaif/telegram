
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { searchTelegramGroups } from './services/geminiService';
import { TelegramGroup, SearchResult, SearchType, SearchHistoryItem, UserProfile, Platform, TelegramMessage } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('topic');
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmingGroup, setConfirmingGroup] = useState<TelegramGroup | null>(null);

  // Tactical Parameters
  const [country, setCountry] = useState('السعودية');
  const [language, setLanguage] = useState('العربية');
  const [category, setCategory] = useState('عام');

  const [platforms] = useState<Platform[]>([
    { id: '1', name: 'X / Twitter', icon: 'fa-brands fa-x-twitter', connected: true, color: 'text-white' },
    { id: '2', name: 'Telegram', icon: 'fa-brands fa-telegram', connected: true, color: 'text-indigo-400' },
    { id: '3', name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', connected: true, color: 'text-emerald-400' },
    { id: '6', name: 'Discord', icon: 'fa-brands fa-discord', connected: true, color: 'text-indigo-500' }
  ]);

  const [activeJoinMethods, setActiveJoinMethods] = useState<string[]>(['inviteLink', 'username', 'idSearch', 'mention']);
  const [minConfidence, setMinConfidence] = useState<number>(0);

  const logIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('scout_v7_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-8), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSearch = async (targetQuery?: string, type?: SearchType) => {
    const currentType = type || searchType;
    let finalQuery = targetQuery || query;
    if (!finalQuery.trim()) return;
    
    setLoading(true);
    setRetrying(false);
    setResult(null);
    setError(null);
    setLogs([]);

    addLog("بدء تشفير القناة الاستكشافية...");
    addLog("توجيه الإشارة نحو الأقمار الصناعية...");

    try {
      const data = await searchTelegramGroups({ 
        query: finalQuery, country, language, category, 
        platforms: platforms.filter(p => p.connected), 
        mode: 'deep', searchType: currentType
      });
      setResult(data);
      setHistory(prev => [{ query: finalQuery, timestamp: new Date().toLocaleTimeString('ar-EG'), type: currentType }, ...prev.filter(i => i.query !== finalQuery)].slice(0, 15));
      addLog("تم اعتراض الحزمة بنجاح.");
    } catch (err: any) {
      // إذا كان الخطأ يدل على فشل المحاولة الأولى وبدء الثانية (داخلياً في الخدمة)
      // نحن هنا في الـ catch النهائي، أي أن المحاولتين فشلتا أو هناك خطأ جذري
      setError(err.message);
      addLog(`خطأ فادح: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    let groups = result?.parsedGroups || [];
    groups = groups.filter(g => g.confidenceScore >= minConfidence);
    groups = groups.filter(g => !g.joinMethod || activeJoinMethods.includes(g.joinMethod));
    return groups;
  }, [result, minConfidence, activeJoinMethods]);

  const joinMethodsConfig = [
    { id: 'inviteLink', label: 'روابط الدعوة', icon: 'fa-link' },
    { id: 'username', label: 'المعرفات', icon: 'fa-at' },
    { id: 'idSearch', label: 'الأرقام', icon: 'fa-fingerprint' },
    { id: 'mention', label: 'الإشارات', icon: 'fa-quote-right' }
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-gray-200 font-cairo">
      {confirmingGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-[#080a10] border border-white/10 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-center uppercase tracking-tighter">تأكيد الانتقال للمصدر</h3>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
               <div className="bg-black/40 p-4 rounded-xl text-[11px] font-mono text-indigo-400 break-all">{confirmingGroup.url}</div>
            </div>
            <div className="flex gap-4">
               <button onClick={() => setConfirmingGroup(null)} className="flex-1 py-4 rounded-2xl bg-white/5 font-black text-[10px] uppercase">إلغاء</button>
               <button onClick={() => { window.open(confirmingGroup.url, '_blank'); setConfirmingGroup(null); }} className="flex-1 py-4 rounded-2xl bg-indigo-600 font-black text-[10px] uppercase">تنفيذ</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      <aside className={`fixed top-0 bottom-0 right-0 z-50 bg-[#080a10]/95 border-l border-white/5 transition-all duration-500 ${isSidebarOpen ? 'w-80' : 'w-0 invisible'}`}>
        <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">إعدادات العقدة</span>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
          </div>
          
          <div className="space-y-4">
            <label className="text-[9px] font-black text-gray-600 uppercase">دقة النتائج (Confidence)</label>
            <input type="range" min="0" max="100" value={minConfidence} onChange={(e) => setMinConfidence(parseInt(e.target.value))} className="w-full accent-indigo-500" />
            <div className="flex justify-between text-[10px] font-bold text-indigo-400"><span>0%</span><span>{minConfidence}%</span><span>100%</span></div>
          </div>

          <div className="space-y-4">
            <label className="text-[9px] font-black text-gray-600 uppercase">طرق الاستكشاف</label>
            <div className="grid grid-cols-1 gap-2">
              {joinMethodsConfig.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setActiveJoinMethods(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id])}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-[11px] font-bold transition-all ${activeJoinMethods.includes(m.id) ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-transparent border-white/5 text-gray-600'}`}
                >
                  <i className={`fa-solid ${m.icon}`}></i> {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
             <label className="text-[9px] font-black text-gray-600 uppercase block mb-4">السجل الأخير</label>
             <div className="space-y-2">
               {history.map((h, i) => (
                 <div key={i} onClick={() => handleSearch(h.query, h.type)} className="p-3 bg-white/5 rounded-xl text-[10px] font-bold cursor-pointer hover:bg-white/10 truncate">{h.query}</div>
               ))}
             </div>
          </div>
        </div>
      </aside>

      <main className={`transition-all duration-500 p-6 lg:p-12 max-w-6xl mx-auto ${isSidebarOpen ? 'mr-80' : ''}`}>
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-500 border border-white/10"><i className="fa-solid fa-sliders"></i></button>
            <h1 className="text-2xl font-black tracking-tighter uppercase">SCOUT <span className="text-indigo-500">OPS</span> <span className="text-[10px] opacity-50 ml-2">v7.2</span></h1>
          </div>
          <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">System Online</span>
          </div>
        </header>

        <div className="max-w-3xl mx-auto mb-16 space-y-6">
          <div className="flex justify-center gap-2">
            <button onClick={() => setSearchType('topic')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${searchType === 'topic' ? 'bg-indigo-600' : 'bg-white/5 text-gray-500'}`}>موضوع</button>
            <button onClick={() => setSearchType('user')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${searchType === 'user' ? 'bg-rose-600' : 'bg-white/5 text-gray-500'}`}>مستخدم</button>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-10 group-focus-within:opacity-30 transition-all"></div>
            <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="relative flex items-center bg-[#080a10] border border-white/10 rounded-[1.8rem] p-2">
              <div className="flex-1 flex items-center px-6 gap-4">
                <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-magnifying-glass-chart'} text-indigo-500 text-lg`}></i>
                <input 
                  type="text" 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  placeholder="أدخل هدف المسح..." 
                  className="w-full bg-transparent py-4 text-lg font-bold focus:outline-none placeholder:text-gray-700"
                />
              </div>
              <button disabled={loading} className="px-8 py-4 bg-indigo-600 rounded-[1.4rem] font-black text-xs uppercase shadow-xl hover:bg-indigo-500 transition-all disabled:opacity-50">
                {loading ? 'اعتراض...' : 'بدء المسح'}
              </button>
            </form>
          </div>
        </div>

        {/* Tactical Logs */}
        {(loading || logs.length > 0) && (
          <div className="max-w-2xl mx-auto mb-12 bg-black/40 border border-white/5 rounded-3xl p-6 font-mono text-[10px] text-indigo-400">
             <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                <span className="uppercase font-black opacity-50">Signal Monitor</span>
                {loading && <div className="flex gap-1"><span className="w-1 h-1 bg-indigo-500 animate-bounce"></span><span className="w-1 h-1 bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span><span className="w-1 h-1 bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span></div>}
             </div>
             {logs.map((log, i) => <div key={i} className="mb-1 opacity-70">{log}</div>)}
          </div>
        )}

        {/* Results Container */}
        {result && !loading && (
          <div className="space-y-12 animate-fadeIn">
            <div className="bg-[#0a0c14] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <i className="fa-solid fa-file-invoice text-indigo-500"></i> ملخص الاستكشاف الرقمي
                </h3>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-black uppercase">الخطر: {result.summary?.riskLevel}</div>
                  <div className="px-4 py-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase">النتائج: {result.summary?.totalDetected}</div>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed italic text-sm border-r-4 border-indigo-500 pr-6 py-2 bg-indigo-500/5 rounded-xl">{result.text}</p>
              
              {/* Intercepted Messages */}
              {result.messages && result.messages.length > 0 && (
                <div className="mt-10 space-y-4">
                  <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">رسائل معترضة (Intercepted)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.messages.map(m => (
                      <div key={m.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2"><span>{m.sender}</span><span>{m.date}</span></div>
                        <p className="text-xs text-gray-300 italic mb-3 line-clamp-2">"{m.text}"</p>
                        <a href={m.url} target="_blank" className="text-[9px] font-black text-indigo-400 hover:text-white uppercase"><i className="fa-solid fa-arrow-up-right-from-square mr-1"></i> عرض المصدر</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {filteredResults.map(group => (
                <div key={group.id} className="group bg-[#080a10] border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all shadow-xl hover:-translate-y-1">
                  <div className="flex justify-between mb-6">
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black rounded-lg uppercase">{group.linkType}</span>
                    <span className="text-[9px] font-black text-gray-700 uppercase">{group.platformSource}</span>
                  </div>
                  <h4 className="text-lg font-black mb-3 truncate group-hover:text-indigo-400 transition-colors">{group.title}</h4>
                  <p className="text-gray-600 text-[11px] leading-relaxed line-clamp-2 mb-6 italic">{group.description}</p>
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-gray-700 uppercase">الثقة الرقمية</span>
                       <span className="text-xs font-black text-indigo-500">{group.confidenceScore}%</span>
                    </div>
                    <button onClick={() => setConfirmingGroup(group)} className="px-6 py-2.5 bg-indigo-600 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 transition-all">دخول</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto mt-20 p-10 bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] text-center animate-fadeIn">
            <i className="fa-solid fa-triangle-exclamation text-rose-500 text-4xl mb-6"></i>
            <h3 className="text-rose-500 font-black mb-2 uppercase tracking-tighter text-xl">انقطاع في الإشارة الاستكشافية</h3>
            <p className="text-rose-400/70 text-sm mb-8 leading-relaxed">{error}</p>
            <button onClick={() => handleSearch()} className="px-10 py-4 bg-rose-600 text-white font-black text-xs uppercase rounded-2xl hover:bg-rose-500 transition-all shadow-xl">إعادة المحاولة ببروتوكول بديل</button>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1b4b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
