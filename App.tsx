
import React, { useState, useEffect, useMemo } from 'react';
import ReportForm from './components/ReportForm';
import ReportCard from './components/ReportCard';
import LandingPage from './components/LandingPage';
import FAQPage from './components/FAQPage';
import { StudentInput, GeneratedReport, ReportTone, Curriculum } from './types';
import { generateStudentReport } from './services/geminiService';

type View = 'landing' | 'dashboard' | 'faq';
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'mark-high' | 'mark-low';

const App: React.FC = () => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showFab, setShowFab] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('rb-dark-mode');
    return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowFab(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('rb-dark-mode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('rb-reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReports(parsed);
        if (parsed.length > 0) setCurrentView('dashboard');
      } catch (e) { console.error("Parse fail", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rb-reports', JSON.stringify(reports));
  }, [reports]);

  const sortedAndFilteredReports = useMemo(() => {
    let filtered = reports;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = reports.filter(r => 
        r.studentName.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'newest': return b.timestamp - a.timestamp;
        case 'oldest': return a.timestamp - b.timestamp;
        case 'name-asc': return a.studentName.localeCompare(b.studentName);
        case 'name-desc': return b.studentName.localeCompare(a.studentName);
        case 'mark-high': return b.mark - a.mark;
        case 'mark-low': return a.mark - b.mark;
        default: return 0;
      }
    });
  }, [reports, searchQuery, sortOption]);

  const analytics = useMemo(() => {
    if (!reports.length) return { avg: 0, high: 0, low: 0 };
    const marks = reports.map(r => r.mark);
    return {
      avg: Math.round(marks.reduce((a, b) => a + b, 0) / marks.length),
      high: Math.max(...marks),
      low: Math.min(...marks)
    };
  }, [reports]);

  const handleGenerateReport = async (input: StudentInput) => {
    if (!navigator.onLine) return setError("Connection required.");
    setIsLoading(true);
    setError(null);
    try {
      const { mark, reportText, actionPlan } = await generateStudentReport(input);
      const newReport: GeneratedReport = {
        id: crypto.randomUUID(),
        studentName: input.name,
        year: input.year,
        gradeLevel: input.gradeLevel,
        subject: input.subject,
        mark,
        reportText,
        actionPlan,
        tone: input.tone,
        curriculum: input.curriculum,
        timestamp: Date.now(),
        language: input.language,
        studentPhoto: input.studentPhoto
      };
      setReports(prev => [newReport, ...prev]);
    } catch (err: any) {
      setError(err.message || "Error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkGenerate = async (inputs: StudentInput[]) => {
    if (!navigator.onLine) return setError("Connection required.");
    setIsLoading(true);
    setError(null);
    setBulkProgress({ current: 0, total: inputs.length });
    
    const newReports: GeneratedReport[] = [];
    for (let i = 0; i < inputs.length; i++) {
      setBulkProgress({ current: i + 1, total: inputs.length });
      try {
        const { mark, reportText, actionPlan } = await generateStudentReport(inputs[i]);
        newReports.push({
          id: crypto.randomUUID(),
          studentName: inputs[i].name,
          year: inputs[i].year,
          gradeLevel: inputs[i].gradeLevel,
          subject: inputs[i].subject,
          mark,
          reportText,
          actionPlan,
          tone: inputs[i].tone,
          curriculum: inputs[i].curriculum,
          timestamp: Date.now(),
          // Fix: Changed 'input.language' to 'inputs[i].language'
          language: inputs[i].language,
          studentPhoto: inputs[i].studentPhoto
        });
      } catch (err) { console.error(err); }
      await new Promise(r => setTimeout(r, 50));
    }
    setReports(prev => [...newReports, ...prev]);
    setBulkProgress(null);
    setIsLoading(false);
  };

  const handleDeleteReport = (id: string) => setReports(prev => prev.filter(r => r.id !== id));

  const handlePrint = () => window.print();

  const handleShareAll = async () => {
    const text = reports.map(r => `${r.studentName} (${r.subject}): ${r.mark}% - ${r.reportText}`).join('\n\n---\n\n');
    if (navigator.share) await navigator.share({ title: 'Class Reports', text });
    else { navigator.clipboard.writeText(text); alert('Copied!'); }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFabAction = () => {
    if (currentView === 'landing') {
      setCurrentView('dashboard');
      window.scrollTo(0, 0);
    } else {
      scrollToTop();
    }
  };

  const renderFab = () => {
    if (!showFab) return null;
    return (
      <button
        onClick={handleFabAction}
        className="fixed bottom-8 right-8 z-[100] gradient-bg text-white shadow-2xl flex items-center justify-center gap-2 px-5 py-4 rounded-2xl hover:scale-110 active:scale-95 transition-all print:hidden"
      >
        {currentView === 'landing' ? (
          <>
            <i className="fas fa-rocket text-sm"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Launch App</span>
          </>
        ) : (
          <i className="fas fa-arrow-up"></i>
        )}
      </button>
    );
  };

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage onStart={() => setCurrentView('dashboard')} onGoFAQ={() => setCurrentView('faq')} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
        {renderFab()}
      </>
    );
  }

  if (currentView === 'faq') {
    return (
      <>
        <FAQPage onBack={() => setCurrentView('landing')} onStart={() => setCurrentView('dashboard')} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
        {renderFab()}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
            <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-leaf text-white text-lg"></i>
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">ReportRelief</h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{isOnline ? 'Active' : 'Offline'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
             <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
               <i className="fas fa-search text-slate-400 text-[10px] mr-2"></i>
               <input 
                type="text" 
                placeholder="Find student..." 
                className="bg-transparent border-none outline-none text-[11px] font-semibold dark:text-white w-32"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             <div className="flex gap-1.5">
               <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
               </button>
               {reports.length > 0 && (
                  <>
                    <button onClick={handlePrint} className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <i className="fas fa-file-pdf text-xs"></i>
                    </button>
                    <button onClick={handleShareAll} className="w-10 h-10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <i className="fas fa-share-nodes text-xs"></i>
                    </button>
                  </>
               )}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24 w-full flex-grow">
        <div className="flex flex-col lg:flex-row gap-10">
          
          <aside className="w-full lg:w-96 shrink-0 print:hidden">
            <div className="lg:sticky lg:top-24 space-y-6">
              <ReportForm onSubmit={handleGenerateReport} onBulkSubmit={handleBulkGenerate} isLoading={isLoading} />
              
              {bulkProgress && (
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating...</span>
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{bulkProgress.current}/{bulkProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="gradient-bg h-full rounded-full transition-all duration-300" style={{ width: `${(bulkProgress.current/bulkProgress.total)*100}%` }}></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex gap-3">
                  <i className="fas fa-circle-exclamation text-red-500 mt-1"></i>
                  <div className="flex-1 text-xs">
                    <p className="font-black text-red-900 dark:text-red-400 uppercase">Attention</p>
                    <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="p-8 bg-indigo-600 rounded-[32px] text-white shadow-xl">
                 <div className="flex items-center gap-2 mb-6">
                   <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Class Stats</h4>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block mb-1">Mean</span>
                       <span className="text-2xl font-black">{analytics.avg}%</span>
                    </div>
                    <div>
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block mb-1">Total</span>
                       <span className="text-2xl font-black">{reports.length}</span>
                    </div>
                 </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 print:hidden gap-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                Report Feed
                <span className="text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 font-bold">{sortedAndFilteredReports.length}</span>
              </h2>

              {reports.length > 0 && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
                  <i className="fas fa-arrow-down-wide-short text-slate-400 text-[10px]"></i>
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="mark-high">Mark (High-Low)</option>
                    <option value="mark-low">Mark (Low-High)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {sortedAndFilteredReports.length === 0 && !isLoading ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-wind text-2xl text-slate-200 dark:text-slate-700"></i>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">Nothing here yet</h3>
                  <p className="text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-2 text-sm">
                    {searchQuery ? `No results for "${searchQuery}".` : 'Start writing to see reports bloom here.'}
                  </p>
                </div>
              ) : (
                <>
                  {isLoading && !bulkProgress && (
                    <div className="bg-white/50 dark:bg-slate-900/50 border border-indigo-100 dark:border-indigo-900/20 p-10 rounded-[32px] flex flex-col items-center justify-center">
                      <div className="flex gap-1.5 mb-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Crafting...</p>
                    </div>
                  )}
                  {sortedAndFilteredReports.map(report => (
                    <ReportCard key={report.id} report={report} onDelete={handleDeleteReport} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      {renderFab()}
    </div>
  );
};

export default App;
