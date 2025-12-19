
import React, { useState, useEffect, useMemo } from 'react';
import { searchTelegramGroups } from './services/geminiService';
import { TelegramGroup, SearchResult, SearchType, SearchHistoryItem, Platform } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('topic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmingGroup, setConfirmingGroup] = useState<TelegramGroup | null>(null);

  const [platforms] = useState<Platform[]>([
    { id: '1', name: 'X / Twitter', icon: 'fa-brands fa-x-twitter', connected: true, color: 'text-white' },
    { id: '2', name: 'Telegram', icon: 'fa-brands fa-telegram', connected: true, color: 'text-indigo-400' },
    { id: '3', name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', connected: true, color: 'text-emerald-400' }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('scout_bot_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), `> ${msg}`]);
  };

  const handleSearch = async (targetQuery?: string) => {
    const finalQuery = targetQuery || query;
    if (!finalQuery.trim()) return;
    
    setLoading(true);
    setResult(null);
    setError(null);
    setLogs([]);

    addLog("بدء اتصال البوت بالخادم...");
    addLog("جارٍ فحص فهارس الويب المتاحة...");

    try {
      const data = await searchTelegramGroups({ 
        query: finalQuery, country: 'السعودية', language: 'العربية', category: 'عام', 
        platforms: platforms.filter(p => p.connected), 
        mode: 'deep', searchType
      });
      setResult(data);
      
      // Fix: Use functional update to avoid undefined "prev" error and sync localStorage correctly
      setHistory(prevHistory => {
        const newHistory = [
          { query: finalQuery, timestamp: new Date().toLocaleTimeString(), type: searchType }, 
          ...prevHistory.filter(i => i.query !== finalQuery)
        ].slice(0, 10);
        localStorage.setItem('scout_bot_history', JSON.stringify(newHistory));
        return newHistory;
      });
      
      addLog("تم العثور على روابط متوافقة.");
    } catch (err: any) {
      setError(err.message);
      addLog("خطأ: تعذر الوصول لبعض المصادر.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-gray-200 font-cairo">
      {/* Confirmation Modal */}
      {confirmingGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b0e14] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center">
              <i className="fa-solid fa-arrow-up-right-from-square text-indigo-500 text-3xl mb-4"></i>
              <h3 className="text-xl font-black">توجيه خارجي</h3>
              <p className="text-xs text-gray-500 mt-2">أنت الآن تغادر التطبيق للانتقال إلى الرابط المكتشف</p>
            </div>
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] font-mono text-indigo-400 break-all leading-relaxed">{confirmingGroup.url}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setConfirmingGroup(null)} className="flex-1 py-3 rounded-xl bg-white/5 font-bold hover:bg-white/10 transition-all">إلغاء</button>
              <button onClick={() => { window.open(confirmingGroup.url, '_blank'); setConfirmingGroup(null); }} className="flex-1 py-3 rounded-xl bg-indigo-600 font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-900/30 transition-all">تأكيد</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 bottom-0 right-0 z-50 bg-[#080a10] border-l border-white/5 transition-all duration-500 ${isSidebarOpen ? 'w-72' : 'w-0 invisible'}`}>
        <div className="p-8 space-y-8 overflow-y-auto h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">محفوظات البحث</span>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="space-y-2">
            {history.length === 0 && <p className="text-[10px] text-gray-600 text-center py-10 italic">لا توجد عمليات بحث سابقة</p>}
            {history.map((h, i) => (
              <div key={i} onClick={() => handleSearch(h.query)} className="group p-3 bg-white/5 rounded-xl text-[11px] cursor-pointer hover:bg-indigo-600/10 border border-transparent hover:border-indigo-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-clock-rotate-left text-gray-700 group-hover:text-indigo-500"></i>
                  <span className="truncate flex-1">{h.query}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-10 border-t border-white/5">
            <button onClick={() => { setHistory([]); localStorage.removeItem('scout_bot_history'); }} className="w-full py-3 rounded-xl border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">مسح السجل</button>
          </div>
        </div>
      </aside>

      <main className={`transition-all duration-500 p-6 lg:p-12 max-w-5xl mx-auto ${isSidebarOpen ? 'mr-72' : ''}`}>
        <header className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-500 border border-white/10 hover:border-indigo-500/50 transition-all"><i className="fa-solid fa-bars-staggered"></i></button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">SCOUT <span className="text-indigo-500">BOT</span></h1>
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1">AI Link Recovery Engine</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 bg-white/5 px-5 py-2 rounded-2xl border border-white/5">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-gray-600 uppercase">الحالة</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase">متصل بالخادم</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto mb-16 space-y-8">
          <div className="text-center space-y-3">
             <h2 className="text-3xl font-black text-white">ماذا تريد أن <span className="text-indigo-500">تجد</span> اليوم؟</h2>
             <p className="text-gray-500 text-sm">أدخل الكلمات المفتاحية وسيقوم البوت بالبحث عن روابط المجموعات العامة.</p>
          </div>

          <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-10 group-focus-within:opacity-30 transition-all duration-500"></div>
            <div className="relative flex items-center bg-[#0a0c14] border border-white/10 rounded-[2rem] p-2 focus-within:border-indigo-500/50 transition-all shadow-2xl">
              <div className="flex-1 flex items-center px-6 gap-4">
                <i className={`fa-solid ${loading ? 'fa-circle-notch fa-spin' : 'fa-magnifying-glass'} text-indigo-500 text-lg`}></i>
                <input 
                  type="text" 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  placeholder="مثال: مجموعات برمجية، قنوات أخبار، قروبات واتساب..." 
                  className="w-full bg-transparent py-4 text-lg font-bold focus:outline-none placeholder:text-gray-700"
                />
              </div>
              <button disabled={loading} className="px-8 py-4 bg-indigo-600 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'جارٍ الفحص...' : 'بحث'}
              </button>
            </div>
          </form>

          {logs.length > 0 && (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-indigo-400/80 flex flex-col gap-1 transition-all">
              {logs.map((log, i) => <div key={i} className="animate-fadeIn">{log}</div>)}
            </div>
          )}
        </div>

        {/* Results Display */}
        {result && (
          <div className="space-y-12 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
               <h3 className="text-lg font-black flex items-center gap-3">
                 <i className="fa-solid fa-list-ul text-indigo-500"></i> الروابط المكتشفة ({result.parsedGroups.length})
               </h3>
               <div className="text-[10px] font-black text-gray-600 uppercase">تم العثور عليها في {result.sources.length} مصدر</div>
            </div>

            {result.parsedGroups.length === 0 ? (
              <div className="py-20 text-center bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10">
                <i className="fa-solid fa-ghost text-4xl text-gray-700 mb-4"></i>
                <p className="text-gray-500 font-bold italic">لم يتم العثور على روابط لهذه الكلمات، جرب مصطلحات أكثر دقة.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {result.parsedGroups.map(group => (
                  <div key={group.id} className="group bg-[#080a10] border border-white/10 rounded-[2rem] p-8 hover:border-indigo-500/40 transition-all duration-300 shadow-xl flex flex-col hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-6">
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border transition-all ${
                        group.linkType === 'WhatsApp' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        group.linkType === 'Telegram' ? 'bg-sky-500/10 border-sky-500/20 text-sky-500' :
                        'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                      }`}>
                        {group.linkType}
                      </span>
                      <div className="flex items-center gap-1 text-[8px] font-black text-gray-700">
                        <i className="fa-solid fa-shield-check"></i> {group.confidenceScore}%
                      </div>
                    </div>
                    <h4 className="text-lg font-black mb-3 line-clamp-1 group-hover:text-indigo-400 transition-colors">{group.title}</h4>
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 mb-8 italic">{group.description}</p>
                    <button 
                      onClick={() => setConfirmingGroup(group)} 
                      className="mt-auto w-full py-3.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all active:scale-95"
                    >
                      دخول المجموعة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-xl mx-auto mt-10 p-10 bg-rose-500/5 border border-rose-500/10 rounded-3xl text-center animate-fadeIn shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6 text-rose-500">
              <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            </div>
            <h3 className="text-rose-500 font-black mb-2 uppercase tracking-tighter text-lg">تنبيه من البوت</h3>
            <p className="text-rose-400/80 text-sm mb-8 leading-relaxed italic">{error}</p>
            <button onClick={() => { setQuery(''); setError(null); }} className="px-10 py-3.5 bg-rose-600 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-900/20 hover:bg-rose-500 transition-all">تغيير كلمات البحث</button>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center pointer-events-none">
        <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest opacity-50">Scout Bot Interface v7.2 - Secure Connection Active</span>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        input::placeholder { color: #1e293b; }
      `}</style>
    </div>
  );
};

export default App;
