
import React, { useState } from 'react';

interface FAQPageProps {
  onBack: () => void;
  onStart: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const FAQPage: React.FC<FAQPageProps> = ({ onBack, onStart, isDarkMode, toggleDarkMode }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is my student data secure and private?",
      a: "Absolutely. ReportRelief is built on a 'Privacy First' architecture. We do not store any student names or report data on our servers. All information stays on your local browser's storage until you manually export or share it. When using AI generation, data is sent securely via the Gemini API and is not used for training future models."
    },
    {
      q: "How does the Bulk Upload (CSV) work?",
      a: "You can upload a simple CSV file with columns like 'Name' and 'Observations'. The app will iterate through each row, generating a unique, professional report for every student in minutes. You can preview and edit each one before final export."
    },
    {
      q: "Can I use it for different subjects and year groups?",
      a: "Yes! ReportRelief is fully customizable. You can specify the subject (ICT, PE, English, etc.) and selecting a year group (Year 1 to Year 13) ensures the AI uses developmentally appropriate language and curriculum benchmarks."
    },
    {
      q: "What is 'Work Analysis' or Vision support?",
      a: "Vision support allows you to upload a photo of a student's workbook or project. The AI 'looks' at the image to identify specific strengths, effort levels, and areas for improvement, creating a much more personalized and evidence-based report."
    },
    {
      q: "Does it support non-English reports?",
      a: "Yes. You can select a target language (like Spanish, Mandarin, or French) and the AI will generate the professional report directly in that language, helping you better connect with EAL families."
    },
    {
      q: "Can I adjust the length and tone?",
      a: "Definitely. Whether you need a 'Quick Snippet' for a mid-term update or a 'Detailed Analysis' for end-of-year reports, you can toggle length. You can also choose tones like 'Friendly' for parents or 'Academic' for internal records."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col transition-colors duration-500">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={onBack}>
            <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <i className="fas fa-arrow-left text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">Frequently Asked Questions</h1>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={toggleDarkMode} className="w-11 h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:scale-105 transition-all">
                <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
             </button>
             <button onClick={onStart} className="px-6 py-2.5 rounded-2xl font-black text-white gradient-bg shadow-lg text-sm transition-transform hover:scale-105 uppercase tracking-widest">
                Start Reporting
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 flex-grow w-full">
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-[24px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-question text-3xl"></i>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Answers for Educators</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Everything you need to know about using ReportRelief in your classroom.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`rounded-[32px] border transition-all overflow-hidden ${activeIndex === i ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-xl shadow-indigo-500/5' : 'bg-white/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800'}`}
            >
              <button 
                onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                className="w-full p-8 text-left flex items-center justify-between group"
              >
                <span className={`text-lg font-black tracking-tight ${activeIndex === i ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white group-hover:text-indigo-500'}`}>
                  {faq.q}
                </span>
                <i className={`fas fa-chevron-down text-xs transition-transform duration-300 ${activeIndex === i ? 'rotate-180 text-indigo-500' : 'text-slate-300'}`}></i>
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${activeIndex === i ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-8 pb-8 pt-0 text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-12 bg-slate-900 dark:bg-slate-800 rounded-[40px] text-center text-white relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full gradient-bg opacity-10"></div>
           <h3 className="text-2xl font-black mb-4 relative z-10">Still have questions?</h3>
           <p className="text-slate-300 mb-8 relative z-10 font-medium">We're built by teachers, for teachers. If you have a specific concern or feature request, we'd love to hear from you.</p>
           <button onClick={onStart} className="px-10 py-4 bg-white text-slate-900 font-black rounded-2xl relative z-10 hover:scale-105 active:scale-95 transition-all">Get Started for Free</button>
        </div>
      </main>

      <footer className="py-12 text-center opacity-50">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">ReportRelief © 2024 • Professional Tools for Modern Teachers</p>
      </footer>
    </div>
  );
};

export default FAQPage;
