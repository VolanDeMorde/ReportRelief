
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
  onGoFAQ: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onGoFAQ, isDarkMode, toggleDarkMode }) => {
  const scrollToWorkflow = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden transition-colors duration-300">
      <header className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-leaf text-white"></i>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">ReportRelief</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onGoFAQ} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors mr-2">Q&A</button>
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
          </button>
          <button onClick={onStart} className="px-5 py-2.5 rounded-xl font-black text-white gradient-bg shadow-lg text-xs uppercase tracking-widest transition-transform hover:scale-105 active:scale-95">
            Launch
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-8">
          <i className="fas fa-sparkles text-[8px]"></i>
          Built for Teachers
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-8">
          Writing Reports <br />
          <span className="gradient-text">Shouldn't Be Painful.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
          The ultimate term companion. Turn rough notes, voice memos, and student work into professional reports with AI precision.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onStart}
            className="w-full sm:w-auto px-10 py-4 rounded-[22px] font-black text-white gradient-bg shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg"
          >
            Get Started
          </button>
          <div className="flex gap-4 w-full sm:w-auto">
            <button 
              onClick={scrollToFeatures}
              className="flex-1 sm:flex-none px-8 py-4 rounded-[22px] font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-base flex items-center justify-center gap-3"
            >
              Features
            </button>
            <button 
              onClick={scrollToWorkflow}
              className="flex-1 sm:flex-none px-8 py-4 rounded-[22px] font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-base flex items-center justify-center gap-3"
            >
              Process
              <i className="fas fa-arrow-down text-xs"></i>
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-100 dark:border-slate-800" id="features">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4 uppercase text-[10px] tracking-[0.3em] opacity-40">Core Capabilities</h2>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-200">Everything you need to save time.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: 'fa-microphone-lines', title: 'Voice Input', desc: 'Dictate observations naturally. Our AI fixes the grammar and formats it for reports.', color: 'indigo' },
            { icon: 'fa-camera', title: 'Work Analysis', desc: 'Scan student work samples to add specific, evidence-based context to your comments.', color: 'purple' },
            { icon: 'fa-language', title: 'Multilingual Support', desc: 'Instantly translate reports for EAL families into over 10 different languages.', color: 'emerald' },
            { icon: 'fa-file-csv', title: 'Bulk CSV Import', desc: 'Process your entire class list at once by uploading a simple spreadsheet.', color: 'blue' },
            { icon: 'fa-bolt', title: 'Action Plans', desc: 'Generate personalized next steps and targets for every student automatically.', color: 'amber' },
            { icon: 'fa-shield-halved', title: 'Privacy Focused', desc: 'All data is stored locally in your browser. Nothing is saved on our servers.', color: 'rose' }
          ].map((feat, i) => (
            <div key={i} className="p-10 rounded-[40px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-${feat.color}-50 dark:bg-${feat.color}-900/20 text-${feat.color}-600 dark:text-${feat.color}-400`}>
                <i className={`fas ${feat.icon} text-xl`}></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-32 bg-slate-50/50 dark:bg-slate-900/30 rounded-[60px] my-24" id="workflow">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-[10px] tracking-[0.3em] opacity-40 mb-4">The Workflow</h2>
          <p className="text-4xl font-black text-slate-800 dark:text-slate-100">Three Steps to Freedom</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Add Data', desc: 'Type observations, speak into the mic, or upload a CSV class list.' },
            { step: '02', title: 'AI Refines', desc: 'Our tuned Gemini model structures the data into a professional report.' },
            { step: '03', title: 'Export', desc: 'Review, tweak the mark, and download as PDF or copy to clipboard.' }
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm text-center transition-transform hover:-translate-y-1">
               <span className="text-5xl font-black opacity-10 mb-6 block">{item.step}</span>
               <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{item.title}</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-20 text-center border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">ReportRelief</span>
        </div>
        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Privacy First • Locally Stored • Open Source AI</p>
      </footer>
    </div>
  );
};

export default LandingPage;
