
import React, { useState, useRef } from 'react';
import { StudentInput, Sentiment, YearGroup, ReportTone, ReportLength, Curriculum, Gender } from '../types';
import Papa from 'papaparse';

interface ReportFormProps {
  onSubmit: (input: StudentInput) => void;
  onBulkSubmit: (inputs: StudentInput[]) => void;
  isLoading: boolean;
}

const SUPPORTED_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Cantonese', 'Arabic', 'Bengali', 'Portuguese', 'Russian', 'Japanese', 'Hindi', 'Urdu', 'Polish', 'Turkish'
];

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onBulkSubmit, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'csv'>('single');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  
  const [formData, setFormData] = useState<StudentInput>({
    name: '',
    year: YearGroup.YEAR_1,
    gradeLevel: '',
    gender: Gender.FEMALE,
    subject: 'ICT',
    sentiment: Sentiment.POSITIVE,
    tone: ReportTone.FRIENDLY,
    length: ReportLength.MEDIUM,
    curriculum: Curriculum.UK_NATIONAL,
    details: '',
    language: 'English',
    targetMark: 85,
    imageEvidence: undefined,
    studentPhoto: undefined
  });
  
  const [bulkText, setBulkText] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
      setFormData(prev => ({ ...prev, name: '', details: '', gradeLevel: '', imageEvidence: undefined, studentPhoto: undefined }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'evidence' | 'photo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'evidence') {
          setFormData(prev => ({ ...prev, imageEvidence: reader.result as string }));
        } else {
          setFormData(prev => ({ ...prev, studentPhoto: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleListening = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser does not support Speech Recognition.");
    
    // Cleanup any existing instance to avoid "aborted" or "already started" errors
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    // Capture the exact state of the text area BEFORE we start recording
    // This serves as the foundation so we don't overwrite existing content
    baseTextRef.current = formData.details;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; 
    
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    
    recognition.onresult = (event: any) => {
      // Accumulate the ENTIRE transcript of the CURRENT session
      let sessionTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        sessionTranscript += event.results[i][0].transcript;
      }
      
      // Append the full session transcript to the original base text
      // We ensure there's a space if base text exists and doesn't end in one
      const separator = baseTextRef.current && !baseTextRef.current.endsWith(' ') ? ' ' : '';
      const newDetails = baseTextRef.current + separator + sessionTranscript;
      
      setFormData(prev => ({ ...prev, details: newDetails }));
    };

    recognition.onerror = (event: any) => {
      // 'aborted' is a common side effect of manual stopping, filter it out for cleaner logs
      if (event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleBulkTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split('\n').filter(line => line.trim().length > 0);
    const students = lines.map(line => {
      const parts = line.split(',');
      return {
        ...formData,
        name: parts[0]?.trim() || 'Student',
        details: parts.slice(1).join(', ').trim() || formData.details
      };
    });
    onBulkSubmit(students);
    setBulkText('');
  };

  const handleCsvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const students = results.data.map((row: any) => ({
          ...formData,
          name: row.Name || row.Student || row.student_name,
          subject: row.Subject || formData.subject,
          gradeLevel: row.Class || row.Grade || row.gradeLevel || formData.gradeLevel,
          gender: row.Gender?.toLowerCase().includes('m') ? Gender.MALE : (row.Gender?.toLowerCase().includes('f') ? Gender.FEMALE : Gender.NEUTRAL),
          targetMark: row.Mark || row.GradePercent || formData.targetMark,
          details: row.Details || row.Notes || row.observations || '',
          language: row.Language || formData.language
        }));
        onBulkSubmit(students);
        setCsvFile(null);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
      <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 m-2 rounded-2xl">
        {(['single', 'bulk', 'csv'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'single' && (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-500 transition-colors"
              >
                {formData.studentPhoto ? (
                  <img src={formData.studentPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <i className="fas fa-user-plus text-slate-300 group-hover:text-indigo-500 text-lg"></i>
                    <span className="block text-[8px] font-black uppercase text-slate-400 mt-1">Photo</span>
                  </div>
                )}
              </div>
              <input type="file" ref={photoInputRef} onChange={(e) => handleFileUpload(e, 'photo')} accept="image/*" className="hidden" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maya Angelou"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Gender / Pronouns</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Grade / Mark (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.targetMark}
                  onChange={(e) => setFormData({ ...formData, targetMark: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Class / Grade ID</label>
                <input
                  type="text"
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  placeholder="e.g. 3B, Red Group"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Year Group</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value as YearGroup })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(YearGroup).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Output Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {SUPPORTED_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Curriculum</label>
                <select
                  value={formData.curriculum}
                  onChange={(e) => setFormData({ ...formData, curriculum: e.target.value as Curriculum })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(Curriculum).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Tone</label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value as ReportTone })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(ReportTone).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Length</label>
                <select
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value as ReportLength })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(ReportLength).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Sentiment</label>
                <select
                  value={formData.sentiment}
                  onChange={(e) => setFormData({ ...formData, sentiment: e.target.value as Sentiment })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(Sentiment).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">Notes & Observations</label>
              <textarea
                rows={3}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Specific highlights..."
                className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white resize-none transition-all"
              ></textarea>
              <button 
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center rounded-full transition-all z-10 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-indigo-600 shadow-sm'}`}
              >
                <i className={`fas ${isRecording ? 'fa-microphone' : 'fa-microphone-lines'}`}></i>
              </button>
              {isRecording && (
                <div className="absolute right-12 bottom-4 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.imageEvidence ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}`}
              >
                <i className="fas fa-camera"></i>
                {formData.imageEvidence ? 'Work Attached' : 'Attach Work'}
              </button>
              <input type="file" ref={imageInputRef} onChange={(e) => handleFileUpload(e, 'evidence')} accept="image/*" className="hidden" />
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.name}
              className="w-full py-4 px-6 rounded-2xl font-black text-white gradient-bg shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
              {isLoading ? 'Crafting Report...' : 'Generate Report'}
            </button>
          </form>
        )}

        {activeTab === 'bulk' && (
          <form onSubmit={handleBulkTextSubmit} className="space-y-4">
             <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
               <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Bulk Pattern</p>
               <p className="text-[11px] text-indigo-500/80 mt-1 italic">Name, Observations (one per line)</p>
             </div>
             <textarea
                rows={8}
                required
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="John Doe, Great effort in English grammar.&#10;Jane Smith, Needs to focus during lab work."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono leading-relaxed dark:text-white"
              ></textarea>
              <button
                type="submit"
                disabled={isLoading || !bulkText.trim()}
                className="w-full py-4 px-6 rounded-2xl font-black text-white gradient-bg shadow-xl transition-all disabled:opacity-50"
              >
                Start Bulk Process
              </button>
          </form>
        )}

        {activeTab === 'csv' && (
          <div className="space-y-6">
            <div 
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group bg-slate-50/50 dark:bg-slate-800/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={(e) => setCsvFile(e.target.files?.[0] || null)} accept=".csv" className="hidden" />
              <div className="w-16 h-16 bg-white dark:bg-slate-700 shadow-md border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className={`fas ${csvFile ? 'fa-check text-green-500' : 'fa-file-csv text-slate-400 group-hover:text-indigo-500'}`}></i>
              </div>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                {csvFile ? csvFile.name : 'Upload Class CSV'}
              </p>
            </div>
            <button
                onClick={handleCsvSubmit}
                disabled={isLoading || !csvFile}
                className="w-full py-4 px-6 rounded-2xl font-black text-white gradient-bg shadow-xl transition-all disabled:opacity-50"
              >
                Import & Generate
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportForm;
