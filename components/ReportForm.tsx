import React, { useState, useRef, useEffect } from 'react';
import {
  StudentInput,
  Focus,
  YearGroup,
  ReportTone,
  ReportLength,
  Curriculum,
  Gender,
  FormPreset,
} from '../types';
import Papa from 'papaparse';
import { csvRowsToStudentInputs, type CsvRow } from '../utils/csvImport';
import { loadFormDraft, saveFormDraft } from '../utils/formDraft';

// Minimal Web Speech API typings (not part of TypeScript's DOM lib).
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognition = (): SpeechRecognitionConstructor | undefined => {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const DEFAULT_FORM: StudentInput = {
  name: '',
  year: YearGroup.YEAR_1,
  gradeLevel: '',
  classGroup: '',
  gender: Gender.FEMALE,
  subject: 'ICT',
  focus: Focus.BALANCED,
  tone: ReportTone.FRIENDLY,
  length: ReportLength.MEDIUM,
  curriculum: Curriculum.UK_NATIONAL,
  details: '',
  language: 'English',
  targetMark: 85,
  imageEvidence: undefined,
  studentPhoto: undefined,
  includeActionPlan: true,
};

const DRAFT_SAVE_DELAY_MS = 300;

interface ReportFormProps {
  onSubmit: (input: StudentInput) => void;
  onBulkSubmit: (inputs: StudentInput[]) => void;
  isLoading: boolean;
}

const SUPPORTED_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Greek',
  'Mandarin',
  'Cantonese',
  'Arabic',
  'Bengali',
  'Portuguese',
  'Russian',
  'Japanese',
  'Hindi',
  'Urdu',
  'Polish',
  'Turkish',
  'Custom',
];

const PRESETS_STORAGE_KEY = 'rr_form_presets';

// Client-side image compression helper to shrink base64 payloads and save API tokens
const compressImageBase64 = (
  dataUrl: string,
  maxWidth: number = 1024,
  quality: number = 0.75
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
  });
};

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onBulkSubmit, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseTextRef = useRef<string>('');

  const [presets, setPresets] = useState<FormPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [showPresetSaveInput, setShowPresetSaveInput] = useState<boolean>(false);
  // S11: inline error for oversized images; S15/V5: inline error for speech not supported
  const [imageError, setImageError] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // S7: restore an unsent draft (e.g. after visiting another page)
  const [formData, setFormData] = useState<StudentInput>(() => ({
    ...DEFAULT_FORM,
    ...loadFormDraft(),
  }));

  // S7: save the draft shortly after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => saveFormDraft(formData), DRAFT_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [formData]);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [customLanguage, setCustomLanguage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
  }, []);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: FormPreset = {
      id: Date.now().toString(),
      presetName: newPresetName.trim(),
      year: formData.year,
      subject: formData.subject,
      tone: formData.tone,
      length: formData.length,
      curriculum: formData.curriculum,
      focus: formData.focus,
      language: formData.language,
      classGroup: formData.classGroup,
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    setSelectedPresetId(newPreset.id);
    setNewPresetName('');
    setShowPresetSaveInput(false);
  };

  const handleLoadPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        year: found.year,
        subject: found.subject,
        tone: found.tone,
        length: found.length,
        curriculum: found.curriculum,
        focus: found.focus,
        language: found.language,
        classGroup: found.classGroup || prev.classGroup,
      }));
    }
  };

  const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter((p) => p.id !== presetId);
    setPresets(updated);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    if (selectedPresetId === presetId) setSelectedPresetId('');
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  const handleNewStudent = () => {
    setFormData({
      ...DEFAULT_FORM,
      classGroup: formData.classGroup,
      subject: formData.subject || DEFAULT_FORM.subject,
      focus: formData.focus || DEFAULT_FORM.focus,
      tone: formData.tone || DEFAULT_FORM.tone,
      length: formData.length || DEFAULT_FORM.length,
      curriculum: formData.curriculum || DEFAULT_FORM.curriculum,
      language: formData.language || DEFAULT_FORM.language,
    });
  };

  // S11: Phone photos are routinely 2–5 MB, so accept large originals and enforce
  // the 500 KB cap on the *compressed* result instead (it's what gets uploaded/stored).
  const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
  const MAX_COMPRESSED_DATA_URL_LENGTH = 500 * 1024;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'evidence' | 'photo'
  ) => {
    setImageError(null);
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setImageError(
        `Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please use an image under 20 MB.`
      );
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      // Profile photos are shown small and stored with every report, so shrink them further.
      const compressedBase64 =
        type === 'photo'
          ? await compressImageBase64(rawBase64, 256, 0.8)
          : await compressImageBase64(rawBase64, 1024, 0.75);
      if (compressedBase64.length > MAX_COMPRESSED_DATA_URL_LENGTH) {
        setImageError(
          'This image could not be compressed enough. Please try a smaller or simpler image.'
        );
        input.value = '';
        return;
      }
      if (type === 'evidence') {
        setFormData((prev) => ({ ...prev, imageEvidence: compressedBase64 }));
      } else {
        setFormData((prev) => ({ ...prev, studentPhoto: compressedBase64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleListening = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* recognition already stopped */
      }
    }

    baseTextRef.current = formData.details;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-GB';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event) => {
      let sessionTranscript = '';
      for (const result of Array.from(event.results)) {
        sessionTranscript += result[0]?.transcript ?? '';
      }
      const separator = baseTextRef.current && !baseTextRef.current.endsWith(' ') ? ' ' : '';
      const newDetails = baseTextRef.current + separator + sessionTranscript;
      setFormData((prev) => ({ ...prev, details: newDetails }));
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleCsvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    Papa.parse<CsvRow>(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const students = csvRowsToStudentInputs(results.data, formData);
        if (students.length === 0) {
          setCsvError('No students found. The CSV needs a "Name" (or "Student") column header.');
          return;
        }
        setCsvError(null);
        onBulkSubmit(students);
        setCsvFile(null);
      },
      error: (err) => setCsvError(`Could not read the CSV file: ${err.message}`),
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
      {/* S11: Inline image error */}
      {imageError && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-start gap-2">
          <i className="fas fa-triangle-exclamation text-red-500 text-xs mt-0.5"></i>
          <p className="text-xs font-semibold text-red-700 dark:text-red-300 flex-1">
            {imageError}
          </p>
          <button
            onClick={() => setImageError(null)}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>
      )}
      {/* S15/V5: Inline speech recognition error */}
      {speechError && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-2">
          <i className="fas fa-microphone-slash text-amber-500 text-xs mt-0.5"></i>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex-1">
            {speechError}
          </p>
          <button
            onClick={() => setSpeechError(null)}
            className="text-amber-400 hover:text-amber-600 text-xs"
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>
      )}
      {csvError && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-start gap-2">
          <i className="fas fa-file-circle-exclamation text-red-500 text-xs mt-0.5"></i>
          <p className="text-xs font-semibold text-red-700 dark:text-red-300 flex-1">{csvError}</p>
          <button
            onClick={() => setCsvError(null)}
            className="text-red-400 hover:text-red-600 text-xs"
            aria-label="Dismiss CSV error"
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>
      )}
      <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 m-2 rounded-2xl">
        {(['single', 'csv'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Preset Selection & Save Bar */}
        <div className="mb-5 p-3.5 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl border border-indigo-100 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <i className="fas fa-bookmark"></i> Quick Preset Template
            </span>
            <button
              type="button"
              onClick={() => setShowPresetSaveInput(!showPresetSaveInput)}
              className="text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600"
            >
              {showPresetSaveInput ? 'Cancel' : '+ Save Preset'}
            </button>
          </div>

          {showPresetSaveInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g. Year 5 Maths - Friendly"
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSavePreset}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedPresetId}
                onChange={(e) => handleLoadPreset(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="">-- Load Saved Preset --</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.presetName} ({p.subject})
                  </option>
                ))}
              </select>
              {selectedPresetId && (
                <button
                  type="button"
                  onClick={(e) => handleDeletePreset(selectedPresetId, e)}
                  className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-xs"
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
          )}
        </div>

        {activeTab === 'single' && (
          <form onSubmit={handleSingleSubmit} className="space-y-4 pb-24">
            <div className="flex flex-col items-center mb-4">
              <div
                onClick={() => photoInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-500 transition-colors"
              >
                {formData.studentPhoto ? (
                  <img
                    src={formData.studentPhoto}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <i className="fas fa-user-plus text-slate-300 group-hover:text-indigo-500 text-lg"></i>
                    <span className="block text-[8px] font-black uppercase text-slate-400 mt-1">
                      Photo
                    </span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={photoInputRef}
                onChange={(e) => handleFileUpload(e, 'photo')}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                {/* S15: explicit label with htmlFor */}
                <label
                  htmlFor="rf-name"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Student Full Name
                </label>
                <input
                  id="rf-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maya Angelou"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="rf-classGroup"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Class / Group Name
                </label>
                <input
                  id="rf-classGroup"
                  type="text"
                  value={formData.classGroup || ''}
                  onChange={(e) => setFormData({ ...formData, classGroup: e.target.value })}
                  placeholder="e.g. Class 5B, Set 1"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="rf-gender"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Gender / Pronouns
                </label>
                <select
                  id="rf-gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(Gender).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="rf-mark"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Grade / Mark (%)
                </label>
                <input
                  id="rf-mark"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.targetMark}
                  onChange={(e) =>
                    setFormData({ ...formData, targetMark: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="rf-year"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Year Group
                </label>
                <select
                  id="rf-year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value as YearGroup })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(YearGroup).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="rf-subject"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Subject
                </label>
                <input
                  id="rf-subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="rf-language"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Output Language
                </label>
                <select
                  id="rf-language"
                  value={
                    formData.language === 'Custom' || customLanguage ? 'Custom' : formData.language
                  }
                  onChange={(e) => {
                    if (e.target.value === 'Custom') {
                      setFormData({ ...formData, language: customLanguage || 'Custom' });
                    } else {
                      setFormData({ ...formData, language: e.target.value });
                      setCustomLanguage('');
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                {(formData.language === 'Custom' || customLanguage) && (
                  <input
                    id="rf-custom-language"
                    type="text"
                    value={customLanguage}
                    onChange={(e) => {
                      setCustomLanguage(e.target.value);
                      setFormData({ ...formData, language: e.target.value || 'Custom' });
                    }}
                    placeholder="Enter language name..."
                    aria-label="Custom language name"
                    className="w-full px-4 py-3 mt-2 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor="rf-curriculum"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Curriculum
                </label>
                <select
                  id="rf-curriculum"
                  value={formData.curriculum}
                  onChange={(e) =>
                    setFormData({ ...formData, curriculum: e.target.value as Curriculum })
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(Curriculum).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="rf-tone"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Tone
                </label>
                <select
                  id="rf-tone"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value as ReportTone })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(ReportTone).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="rf-length"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Length
                </label>
                <select
                  id="rf-length"
                  value={formData.length}
                  onChange={(e) =>
                    setFormData({ ...formData, length: e.target.value as ReportLength })
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(ReportLength).map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="rf-focus"
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
                >
                  Focus
                </label>
                <select
                  id="rf-focus"
                  value={formData.focus}
                  onChange={(e) => setFormData({ ...formData, focus: e.target.value as Focus })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium dark:text-white"
                >
                  {Object.values(Focus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="rf-details"
                className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block"
              >
                Notes & Observations
              </label>
              <textarea
                id="rf-details"
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
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.imageEvidence ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}`}
              >
                <i className="fas fa-camera"></i>
                {formData.imageEvidence ? 'Work Attached (Compressed)' : 'Attach Work'}
              </button>
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => handleFileUpload(e, 'evidence')}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-3 px-2">
              <input
                type="checkbox"
                id="includeActionPlan"
                checked={formData.includeActionPlan}
                onChange={(e) => setFormData({ ...formData, includeActionPlan: e.target.checked })}
                className="w-5 h-5 text-indigo-600 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <label
                htmlFor="includeActionPlan"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none"
              >
                Include Action Plan
              </label>
            </div>

            <div className="sticky bottom-0 z-20 -mx-6 mt-2 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 pt-3 pb-4">
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !formData.name}
                  className="flex-1 py-4 px-6 rounded-2xl font-black text-white gradient-bg shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-wand-magic-sparkles"></i>
                  )}
                  {isLoading ? 'Crafting Report...' : 'Generate Report'}
                </button>
                <button
                  type="button"
                  onClick={handleNewStudent}
                  className="py-4 px-6 rounded-2xl font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus"></i>
                  <span className="hidden sm:inline">New Student</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'csv' && (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group bg-slate-50/50 dark:bg-slate-800/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                accept=".csv"
                className="hidden"
              />
              <div className="w-16 h-16 bg-white dark:bg-slate-700 shadow-md border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i
                  className={`fas ${csvFile ? 'fa-check text-green-500' : 'fa-file-csv text-slate-400 group-hover:text-indigo-500'}`}
                ></i>
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
