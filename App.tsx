
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { searchTelegramGroups } from './services/geminiService';
import { TelegramGroup, SearchResult, SearchType, SearchHistoryItem, UserProfile, Platform, TelegramMessage } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('topic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePlatformFilter, setActivePlatformFilter] = useState('All');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmingGroup, setConfirmingGroup] = useState<TelegramGroup | null>(null);

  // Tactical Parameters
  const [country, setCountry] = useState('السعودية');
  const [language, setLanguage] = useState('العربية');
  const [category, setCategory] = useState('عام');

  // Platforms State
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: '1', name: 'X / Twitter', icon: 'fa-brands fa-x-twitter', connected: true, color: 'text-white' },
    { id: '2', name: 'Telegram', icon: 'fa-brands fa-telegram', connected: true, color: 'text-indigo-400' },
    { id: '3', name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', connected: true, color: 'text-emerald-400' },
    { id: '4', name: 'LinkedIn', icon: 'fa-brands fa-linkedin', connected: true, color: 'text-blue-400' },
    { id: '5', name: 'Facebook', icon: 'fa-brands fa-facebook', connected: true, color: 'text-blue-600' },
    { id: '6', name: 'Discord', icon: 'fa-brands fa-discord', connected: true, color: 'text-indigo-500' }
  ]);
  const [newPlatformName, setNewPlatformName] = useState('');

  // Filter States
  const [showPrivate, setShowPrivate] = useState<boolean>(true);
  const [showPublic, setShowPublic] = useState<boolean>(true);
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [activeJoinMethods, setActiveJoinMethods] = useState<string[]>(['inviteLink', 'username', 'idSearch', 'mention']);

  // Sync / Profile
  const [profile, setProfile] = useState<UserProfile>({
    agentName: 'العميل المستكشف',
    telegramHandle: '',
    operationalId: 'AG-99',
    isRegistered: true,
    syncStatus: 'disconnected'
  });
  const [syncStep, setSyncStep] = useState<1 | 2>(1);
  const [syncForm, setSyncForm] = useState({ phone: '', code: '' });

  const logIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('scout_v7_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedSync = localStorage.getItem('scout_sync_data');
    if (savedSync) {
      const data = JSON.parse(savedSync);
      setSyncForm(data);
      setProfile(prev => ({ ...prev, syncStatus: 'authorized', phoneNumber: data.phone }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scout_v7_history', JSON.stringify(history));
  }, [history]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const exportHistoryToJSON = () => {
    if (history.length === 0) return;
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scout_history_${new Date().getTime()}.json`;
    a.click();
    addLog("تم تصدير السجل بصيغة JSON.");
  };

  const exportResultsToCSV = () => {
    if (!result || filteredResults.length === 0) return;
    const headers = ['Title', 'Description', 'URL', 'Source', 'Platform', 'Confidence', 'Type', 'Method'];
    const rows = filteredResults.map(g => [
      `"${g.title.replace(/"/g, '""')}"`,
      `"${g.description.replace(/"/g, '""')}"`,
      g.url,
      g.sourcePostUrl || 'N/A',
      g.platformSource,
      `${g.confidenceScore}%`,
      g.isPrivate ? 'Private' : 'Public',
      g.joinMethod || 'Unknown'
    ]);
    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `intel_export_${new Date().getTime()}.csv`;
    link.click();
    addLog("تم تصدير التقرير بصيغة CSV.");
  };

  const handleSearch = async (targetQuery?: string, type?: SearchType) => {
    const currentType = type || searchType;
    let finalQuery = targetQuery || query;
    if (!finalQuery.trim()) return;
    
    setLoading(true);
    setResult(null);
    setError(null);
    setLogs([]);

    const logSteps = ["بدء بروتوكول المسح...", "تشفير القناة الاستخباراتية...", "اعتراض إشارات OSINT...", "تحليل الوصلات الرقمية..."];
    let stepIdx = 0;
    logIntervalRef.current = setInterval(() => {
      if (stepIdx < logSteps.length) addLog(logSteps[stepIdx++]);
    }, 800);

    try {
      const data = await searchTelegramGroups({ 
        query: finalQuery, country, language, category, 
        platforms: platforms.filter(p => p.connected), 
        mode: 'deep', searchType: currentType, agentContext: profile
      });
      setResult(data);
      setHistory(prev => [{ query: finalQuery, timestamp: new Date().toLocaleTimeString('ar-EG'), type: currentType }, ...prev.filter(i => i.query !== finalQuery)].slice(0, 15));
      addLog("اكتمل المسح بنجاح.");
    } catch (err: any) {
      setError(err.message);
      addLog("خطأ: تم فشل اعتراض الإشارة.");
    } finally {
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    let groups = result?.parsedGroups || [];
    if (activePlatformFilter !== 'All') groups = groups.filter(g => g.platformSource.includes(activePlatformFilter));
    groups = groups.filter(g => (g.isPrivate && showPrivate) || (!g.isPrivate && showPublic));
    groups = groups.filter(g => g.confidenceScore >= minConfidence);
    groups = groups.filter(g => !g.joinMethod || activeJoinMethods.includes(g.joinMethod));
    return groups;
  }, [result, activePlatformFilter, showPrivate, showPublic, minConfidence, activeJoinMethods]);

  // Fix: Added toggleJoinMethod to handle the multi-select discovery method filter
  const toggleJoinMethod = (id: string) => {
    setActiveJoinMethods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const joinMethodsConfig = [
    { id: 'inviteLink', label: 'روابط الدعوة', icon: 'fa-link' },
    { id: 'username', label: 'أسماء المستخدمين', icon: 'fa-at' },
    { id: 'idSearch', label: 'المعرفات الرقمية', icon: 'fa-fingerprint' },
    { id: 'mention', label: 'الإشارات المباشرة', icon: 'fa-quote-right' }
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-gray-200 font-cairo overflow-x-hidden">
      {/* Confirmation Modal */}
      {confirmingGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#080a10] border border-white/10 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl space-y-8 relative overflow-hidden">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto text-2xl"><i className="fa-solid fa-satellite-dish"></i></div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">تأكيد توجيه الوكيل</h3>
              <p className="text-xs text-gray-500 font-bold uppercase">سيتم توجيهك إلى مصدر خارجي عبر قناة {confirmingGroup.linkType}</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
               <div className="text-[10px] font-black text-gray-600 uppercase">Destination URL</div>
               <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-[11px] font-mono text-indigo-400 break-all leading-relaxed">{confirmingGroup.url}</div>
            </div>
            <div className="flex gap-4">
               <button onClick={() => setConfirmingGroup(null)} className="flex-1 py-4 rounded-2xl bg-white/5 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">إلغاء</button>
               <button onClick={() => { window.open(confirmingGroup.url, '_blank'); setConfirmingGroup(null); }} className="flex-1 py-4 rounded-2xl bg-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl">تنفيذ التوجيه</button>
            </div>
          </div>
        </div>
      )}

      {/* Background HUD */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.1),transparent)]"></div>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(18,24,38,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.3)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 right-0 z-50 bg-[#080a10]/95 border-l border-white/5 transition-all duration-500 shadow-2xl overflow-y-auto ${isSidebarOpen ? 'w-80' : 'w-0 invisible'}`}>
        <div className="p-8 flex flex-col min-h-full space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black tracking-widest text-indigo-500 uppercase">Mission Control</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-600 hover:text-white"><i className="fa-solid fa-chevron-right"></i></button>
          </div>

          {/* Profile Section */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20"><i className="fa-solid fa-user-shield"></i></div>
              <div className="flex flex-col">
                <div className="text-[12px] font-black">{profile.agentName}</div>
                <div className="flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${profile.syncStatus === 'authorized' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`}></div>
                   <span className="text-[8px] font-bold text-gray-500 uppercase">{profile.syncStatus === 'authorized' ? 'Secure Node Active' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network Nodes */}
          <div className="space-y-4">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Network Nodes</label>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {platforms.map(p => (
                <div key={p.id} className={`flex items-center justify-between bg-black/40 p-3 rounded-xl border transition-all ${p.connected ? 'border-indigo-500/20 shadow-[0_0_10px_rgba(79,70,229,0.05)]' : 'border-white/5 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${p.connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                    <i className={`${p.icon} text-[11px] ${p.connected ? 'text-indigo-400' : 'text-gray-600'}`}></i>
                    <span className="text-[10px] font-bold">{p.name}</span>
                  </div>
                  <button onClick={() => setPlatforms(platforms.map(item => item.id === p.id ? {...item, connected: !item.connected} : item))} className="text-xs text-indigo-500">
                    <i className={`fa-solid ${p.connected ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Logic Simulation */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-6 space-y-4">
            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Account Synchronization</label>
            {profile.syncStatus === 'authorized' ? (
              <button onClick={() => setProfile({ ...profile, syncStatus: 'disconnected' })} className="w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-[9px] uppercase tracking-widest hover:bg-rose-500/20">قطع الاتصال</button>
            ) : (
              <div className="space-y-3">
                <input type="text" placeholder="رقم الهاتف..." value={syncForm.phone} onChange={e => setSyncForm({ ...syncForm, phone: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold focus:outline-none" />
                <button onClick={() => setProfile({ ...profile, syncStatus: 'authorized' })} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest">ربط الحساب</button>
              </div>
            )}
          </div>

          {/* Tactical Filters */}
          <div className="space-y-6">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Tactical Filters</label>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400">Fidelity (الثقة)</span><span className="text-[10px] font-black text-indigo-500">{minConfidence}%</span></div>
              <input type="range" min="0" max="100" step="5" value={minConfidence} onChange={(e) => setMinConfidence(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 block mb-2">Discovery Method</span>
              <div className="flex flex-col gap-2.5">
                {joinMethodsConfig.map(method => (
                  <label key={method.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${activeJoinMethods.includes(method.id) ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 bg-black/40'}`}>
                      <input type="checkbox" className="hidden" checked={activeJoinMethods.includes(method.id)} onChange={() => toggleJoinMethod(method.id)} />
                      {activeJoinMethods.includes(method.id) && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                    </div>
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid ${method.icon} text-[10px] text-gray-600`}></i>
                      <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-300">{method.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="pt-6 border-t border-white/5 space-y-4">
             <div className="flex items-center justify-between">
               <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">سجل المسح</label>
               <div className="flex gap-3">
                 <button onClick={exportHistoryToJSON} className="text-[8px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase">تصدير JSON</button>
                 <button onClick={() => setHistory([])} className="text-[8px] font-black text-rose-500 hover:text-rose-400 transition-colors uppercase">مسح</button>
               </div>
             </div>
             <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
               {history.map((h, i) => (
                 <div key={i} onClick={() => handleSearch(h.query, h.type)} className="bg-white/[0.03] border border-white/5 p-3 rounded-xl cursor-pointer hover:bg-white/[0.06] flex items-center gap-3 transition-all">
                   <div className="text-[10px] font-bold truncate group-hover:text-white transition-colors">{h.query}</div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-500 relative z-10 ${isSidebarOpen ? 'mr-80' : 'mr-0'} p-6 lg:p-12 max-w-[1400px] mx-auto`}>
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-6">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500"><i className="fa-solid fa-bars"></i></button>}
            <h1 className="text-3xl font-black uppercase tracking-tighter">SCOUT <span className="text-indigo-500">OPS</span> <span className="text-[10px] bg-indigo-500/20 px-3 py-1 rounded-full text-indigo-400 font-bold border border-indigo-500/20 ml-2">v7.2</span></h1>
          </div>
        </header>

        {/* Search Area */}
        <div className="max-w-4xl mx-auto mb-16 space-y-8">
          <div className="flex justify-center">
            <div className="bg-[#080a10] border border-white/10 p-1 rounded-2xl flex gap-1">
              <button onClick={() => setSearchType('topic')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${searchType === 'topic' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/20' : 'text-gray-600 hover:text-gray-400'}`}>الموضوع</button>
              <button onClick={() => setSearchType('user')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${searchType === 'user' ? 'bg-rose-600 shadow-lg shadow-rose-900/20' : 'text-gray-600 hover:text-gray-400'}`}>مستخدم / ID</button>
            </div>
          </div>

          <div className={`bg-[#080a10] border rounded-[3rem] p-6 shadow-2xl transition-all ${searchType === 'user' ? 'border-rose-500/30' : 'border-white/10'}`}>
            <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="space-y-6">
              <div className="flex flex-col md:flex-row items-center bg-white/5 border border-white/10 focus-within:border-indigo-500/50 rounded-[2.5rem] p-2 transition-all">
                <div className="flex-1 flex items-center px-6 py-4 gap-6 w-full">
                  <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : searchType === 'topic' ? 'fa-satellite-dish text-indigo-500' : 'fa-fingerprint text-rose-500'} text-2xl`}></i>
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder={searchType === 'topic' ? "ابحث عن موضوع أو كلمات مفتاحية..." : "أدخل اسم مستخدم أو معرف رقمي..."} className="w-full bg-transparent text-xl font-bold focus:outline-none placeholder:text-gray-700" />
                </div>
                <button disabled={loading} className={`w-full md:w-auto px-12 py-5 rounded-[2rem] font-black text-xs uppercase shadow-xl transition-all disabled:opacity-50 ${searchType === 'user' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                  {loading ? 'مسح جارٍ...' : 'بدء المسح'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Country</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold focus:outline-none focus:border-indigo-500/40" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Language</label>
                  <input type="text" value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold focus:outline-none focus:border-indigo-500/40" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold focus:outline-none focus:border-indigo-500/40 appearance-none bg-no-repeat bg-[left_1rem_center] bg-[length:1em]">
                    <option value="عام">عام (General)</option>
                    <option value="تقنية">تقنية (Tech)</option>
                    <option value="أخبار">أخبار (News)</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Terminal Logs */}
        {loading && (
          <div className="max-w-2xl mx-auto mb-16 bg-black/60 border border-indigo-500/20 rounded-[2rem] p-8 font-mono text-[10px] text-indigo-400 shadow-2xl">
             <div className="flex items-center gap-3 mb-4 text-gray-600 border-b border-white/5 pb-3 font-black uppercase tracking-widest">scout.intel.recon</div>
             {logs.map((log, i) => <div key={i} className="mb-2 opacity-80 animate-pulse">{log}</div>)}
          </div>
        )}

        {/* Results Area */}
        {result && !loading && (
          <div className="space-y-12 animate-fadeIn pb-40">
            {/* Intel Dossier Summary */}
            <div className="border border-white/5 rounded-[3rem] p-12 bg-[#0a0c14] shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Intelligence Summary</h3>
                  <div className="flex items-center gap-4">
                    <i className="fa-solid fa-brain text-white text-2xl"></i>
                    <span className="text-2xl font-black uppercase tracking-tighter">تقرير الاستكشاف الرقمي</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${result.summary?.riskLevel === 'High' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>Risk: {result.summary?.riskLevel}</div>
                  <button onClick={exportResultsToCSV} className="px-6 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                    <i className="fa-solid fa-file-export"></i> Export CSV
                  </button>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg italic whitespace-pre-wrap p-8 bg-white/[0.02] border border-white/5 rounded-3xl mb-12">{result.text}</p>
              
              {/* Intercepted Messages */}
              {result.messages && result.messages.length > 0 && (
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3"><i className="fa-solid fa-bolt"></i> Communications Intercepted</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.messages.map(msg => (
                      <div key={msg.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-indigo-400 truncate max-w-[200px]">{msg.sender} @ {msg.groupTitle}</span>
                          <span className="text-[8px] font-bold text-gray-600">{msg.date}</span>
                        </div>
                        <p className="text-[13px] text-gray-300 mb-4 line-clamp-3 italic">"{msg.text}"</p>
                        <a href={msg.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-gray-500 hover:text-white flex items-center gap-2 transition-colors">
                          <i className="fa-solid fa-up-right-from-square"></i> عرض المصدر الأصلي
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Sources */}
              {result.sources.length > 0 && (
                 <div className="mt-12 pt-8 border-t border-white/5">
                   <h4 className="text-[10px] font-black text-gray-600 uppercase mb-4 tracking-widest">Grounding Sources</h4>
                   <div className="flex flex-wrap gap-4">
                     {result.sources.map((s, i) => (
                       <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] text-gray-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-all font-bold group">
                         <i className="fa-solid fa-link mr-3"></i> {s.title}
                       </a>
                     ))}
                   </div>
                 </div>
               )}
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {filteredResults.map(group => (
                 <div key={group.id} className="group border border-white/5 bg-[#0b0e15] rounded-[2.5rem] p-8 hover:border-indigo-500/30 transition-all flex flex-col shadow-xl hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-6">
                       <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black border uppercase ${group.linkType === 'WhatsApp' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : group.linkType === 'Discord' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'}`}>{group.linkType}</span>
                       <span className="text-[9px] font-black text-gray-600 uppercase">{group.platformSource}</span>
                    </div>
                    <div className="mb-4 self-start">
                      <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 flex items-center gap-2 transition-colors group-hover:bg-indigo-500/10">
                        <i className={`fa-solid ${methodIcons[group.joinMethod || 'inviteLink']}`}></i> {group.joinMethod || 'inviteLink'}
                      </span>
                    </div>
                    <div className="flex-1">
                       <h4 className="text-xl font-black mb-3 line-clamp-1 group-hover:text-indigo-400 transition-colors">{group.title}</h4>
                       <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 mb-6 italic">{group.description}</p>
                    </div>
                    <div className="space-y-4 pt-6 border-t border-white/5">
                       <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-700 uppercase">Fidelity</span>
                            <span className={`text-[11px] font-black ${group.confidenceScore > 70 ? 'text-indigo-500' : 'text-amber-500'}`}>{group.confidenceScore}%</span>
                          </div>
                          <div className="flex gap-4">
                            <button onClick={() => { navigator.clipboard.writeText(group.url); setCopiedId(group.id); setTimeout(() => setCopiedId(null), 2000); }} className="text-gray-500 hover:text-white transition-all"><i className={`fa-solid ${copiedId === group.id ? 'fa-check text-emerald-500' : 'fa-copy'}`}></i></button>
                            <button onClick={() => setConfirmingGroup(group)} className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 transition-all">دخول</button>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            {filteredResults.length === 0 && !loading && (
              <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[3rem]">
                <i className="fa-solid fa-satellite-dish text-7xl mb-6 text-gray-800"></i>
                <p className="font-black text-sm uppercase tracking-[1em] text-gray-700">لا توجد أهداف مطابقة</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto mt-20 p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center animate-fadeIn">
            <i className="fa-solid fa-triangle-exclamation text-rose-500 text-3xl mb-4"></i>
            <p className="text-rose-500 font-bold">{error}</p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1b4b; border-radius: 10px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%; background: #6366f1; cursor: pointer; border: 2px solid #020408; box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); }
      `}</style>
    </div>
  );
};

const methodIcons: any = {
  inviteLink: 'fa-link',
  username: 'fa-at',
  idSearch: 'fa-fingerprint',
  mention: 'fa-quote-right'
};

export default App;
