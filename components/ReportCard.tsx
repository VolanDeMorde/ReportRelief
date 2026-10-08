import React, { useState } from 'react';

/** Escape a string for safe injection into an HTML context. */
const escHtml = (str: string): string =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
import { GeneratedReport } from '../types';

interface ReportCardProps {
  report: GeneratedReport;
  onDelete: (id: string) => void;
  onUpdateReport?: (updatedReport: GeneratedReport) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onDelete, onUpdateReport }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(report.reportText);
  const [editedActionPlan, setEditedActionPlan] = useState<string[]>([...report.actionPlan]);
  const [showParentSummary, setShowParentSummary] = useState(false);
  const [parentSummaryText, setParentSummaryText] = useState<string>(report.parentSummary || '');
  const [pdfError, setPdfError] = useState<string | null>(null);

  const getReportString = (isPlain: boolean = false) => {
    let text = report.reportText;
    let actionPlanStr = report.actionPlan.map((p, i) => `${i + 1}. ${p}`).join('\n');

    if (isPlain) {
      text = text.replace(/\*\*/g, '');
      actionPlanStr = actionPlanStr.replace(/\*\*/g, '');
    }

    const header = `${report.studentName} | ${report.subject} (${report.year}${report.gradeLevel ? ` - ${report.gradeLevel}` : ''})\nMark: ${report.mark}%\n\n`;
    const actionSection = report.actionPlan.length > 0 ? `\n\nNext Steps:\n${actionPlanStr}` : '';

    return `${header}${text}${actionSection}`;
  };

  const renderText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const copyToClipboard = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      // Clipboard can be blocked (permissions / insecure context); don't claim success.
      console.warn('Copy to clipboard failed:', err);
      return;
    }
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const downloadPdf = () => {
    setPdfError(null);
    const printWindow = window.open('about:blank', '_blank');
    if (!printWindow) {
      setPdfError('Popups are blocked. Please allow popups for this site to download reports.');
      return;
    }

    const plainTextReport = escHtml(
      (isEditing ? editedText : report.reportText).replace(/\*\*/g, '')
    );
    const dateStr = new Date(report.timestamp).toLocaleDateString();
    const currentActionPlan = isEditing ? editedActionPlan : report.actionPlan;

    // All user-supplied values are HTML-escaped before injection (prevents XSS)
    const safeName = escHtml(report.studentName);
    const safeSubject = escHtml(report.subject);
    const safeYear = escHtml(report.year);
    const safeGrade = report.gradeLevel ? escHtml(report.gradeLevel) : '';
    const safeCurriculum = escHtml(report.curriculum);
    const safeTone = escHtml(report.tone);
    const safeMark = Number(report.mark); // numeric — no escaping needed
    const safeDate = escHtml(dateStr);

    const actionPlanHtml =
      currentActionPlan.length > 0
        ? `<div class="action-plan">
           <h4>Next Steps &amp; Action Plan</h4>
           <ul>
             ${currentActionPlan
               .map(
                 (step, i) =>
                   `<li><span class="num">${i + 1}.</span> <span>${escHtml(step.replace(/\*\*/g, ''))}</span></li>`
               )
               .join('')}
           </ul>
         </div>`
        : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Academic Report - ${safeName}</title>
          <style>
            body { font-family: 'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; padding: 50px; color: #1e293b; line-height: 1.7; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { margin: 0; font-size: 32px; font-weight: 800; color: #0f172a; }
            .subject-tag { font-size: 14px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; }
            .meta-item { font-size: 12px; }
            .meta-label { font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; }
            .meta-value { font-weight: 700; color: #334155; font-size: 14px; }
            .report-content { font-size: 15px; margin-bottom: 35px; white-space: pre-wrap; color: #334155; }
            .action-plan { background: #eff6ff; padding: 24px; border-radius: 16px; border: 1px solid #dbeafe; }
            .action-plan h4 { margin-top: 0; color: #2563eb; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
            .action-plan ul { padding-left: 0; margin: 0; list-style: none; }
            .action-plan li { margin-bottom: 10px; font-size: 14px; font-weight: 600; color: #1e40af; display: flex; gap: 10px; }
            .action-plan li .num { font-weight: 800; color: #2563eb; min-width: 20px; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; text-transform: uppercase; letter-spacing: 2px; }
            @media print { body { padding: 30px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <span class="subject-tag">${safeSubject}</span>
              <h1>${safeName}</h1>
            </div>
            <div style="text-align: right">
              <div style="font-size: 32px; font-weight: 800; color: #0f172a;">${safeMark}%</div>
              <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Overall Grade</div>
            </div>
          </div>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Year / Group</span>
              <span class="meta-value">${safeYear}${safeGrade ? ` (${safeGrade})` : ''}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date Issued</span>
              <span class="meta-value">${safeDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Curriculum</span>
              <span class="meta-value">${safeCurriculum}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Assessment Tone</span>
              <span class="meta-value">${safeTone}</span>
            </div>
          </div>
          <div class="report-content">${plainTextReport}</div>
          ${actionPlanHtml}
          <div class="footer">
            Generated via ReportRelief AI Assistant &bull; ${safeDate}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveChanges = () => {
    const updated: GeneratedReport = {
      ...report,
      reportText: editedText,
      actionPlan: editedActionPlan.filter((item) => item.trim() !== ''),
      parentSummary: parentSummaryText || report.parentSummary,
    };
    if (onUpdateReport) {
      onUpdateReport(updated);
    }
    setIsEditing(false);
  };

  const generateParentDigest = () => {
    if (parentSummaryText) {
      setShowParentSummary(!showParentSummary);
      return;
    }

    const firstSentence = report.reportText.split('.')[0] + '.';
    const nextSteps =
      report.actionPlan.length > 0
        ? `To build on this progress, we recommend focusing on: ${report.actionPlan.slice(0, 2).join('; ')}.`
        : '';

    const summary = `Dear Parent/Guardian,\n\nI am pleased to share ${report.studentName}'s recent report for ${report.subject} (${report.year}). ${report.studentName} has achieved an overall mark of ${report.mark}%.\n\n${firstSentence} ${nextSteps}\n\nPlease feel free to reach out if you would like to discuss ${report.studentName}'s progress further.\n\nWarm regards,\nClass Teacher`;

    setParentSummaryText(summary);
    setShowParentSummary(true);

    if (onUpdateReport) {
      onUpdateReport({ ...report, parentSummary: summary });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Report: ${report.studentName}`,
          text: getReportString(true),
        });
      } catch {
        /* user cancelled the share sheet */
      }
    } else void copyToClipboard(getReportString(true));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-5 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {report.studentPhoto ? (
                <img
                  src={report.studentPhoto}
                  alt={report.studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="fas fa-user text-slate-200 text-2xl"></i>
              )}
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {report.studentName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                  {report.subject}
                </span>
                {report.classGroup && (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {report.classGroup}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                {report.year} {report.gradeLevel ? `• ${report.gradeLevel}` : ''} •{' '}
                {new Date(report.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isEditing) handleSaveChanges();
                else setIsEditing(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                isEditing
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm hover:bg-emerald-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <i className={`fas ${isEditing ? 'fa-check mr-1.5' : 'fa-pen mr-1.5'}`}></i>
              {isEditing ? 'Save Edits' : 'Edit'}
            </button>
            <div
              className={`px-4 py-2 rounded-xl text-xl font-black shadow-inner ${
                report.mark >= 80
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : report.mark >= 60
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
              }`}
            >
              {report.mark}%
            </div>
          </div>
        </div>

        {/* Report Content */}
        {isEditing ? (
          <div className="mb-6 space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Report Body Text
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={6}
              className="w-full p-4 rounded-2xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        ) : (
          <div className="selectable text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap font-medium">
            {renderText(report.reportText)}
          </div>
        )}

        {/* Action Plan Section */}
        {isEditing ? (
          <div className="mb-6 p-5 bg-indigo-50/30 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
              Edit Action Plan Steps
            </h4>
            {editedActionPlan.map((step, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-xs font-bold text-indigo-500 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => {
                    const newSteps = [...editedActionPlan];
                    newSteps[idx] = e.target.value;
                    setEditedActionPlan(newSteps);
                  }}
                  className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
                />
                <button
                  onClick={() => setEditedActionPlan(editedActionPlan.filter((_, i) => i !== idx))}
                  className="w-7 h-7 text-xs text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
            <button
              onClick={() => setEditedActionPlan([...editedActionPlan, ''])}
              className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add Step
            </button>
          </div>
        ) : (
          report.actionPlan.length > 0 && (
            <div className="mb-6 p-6 bg-indigo-50/20 dark:bg-indigo-900/10 rounded-[28px] border border-indigo-50/50 dark:border-indigo-900/20">
              <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <i className="fas fa-stairs"></i>
                Action Plan & Next Steps
              </h4>
              <div className="space-y-4">
                {report.actionPlan.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start group">
                    <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-[11px] font-black text-indigo-500 shrink-0 shadow-sm transition-all group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white">
                      {idx + 1}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed pt-1 flex-1">
                      {renderText(step)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Parent Email Digest Card */}
        {showParentSummary && (
          <div className="mb-6 p-5 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-envelope-open-text"></i>
                Parent / Guardian Email Digest
              </h4>
              <div className="flex items-center gap-3">
                {/* S6: mailto link pre-populates the user's email client */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(`${report.studentName} – ${report.subject} Report`)}&body=${encodeURIComponent(parentSummaryText)}`}
                  className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider hover:underline flex items-center gap-1"
                  title="Open in email client"
                >
                  <i className="fas fa-paper-plane text-[8px]"></i>
                  Open in Mail
                </a>
                <button
                  onClick={() => copyToClipboard(parentSummaryText)}
                  className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider hover:underline"
                >
                  Copy Text
                </button>
              </div>
            </div>
            <p className="text-xs font-medium text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
              {parentSummaryText}
            </p>
          </div>
        )}

        {/* PDF error banner (replaces alert) */}
        {pdfError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-center gap-2">
            <i className="fas fa-circle-exclamation text-red-500 text-xs"></i>
            <p className="text-xs font-semibold text-red-700 dark:text-red-300">{pdfError}</p>
            <button
              onClick={() => setPdfError(null)}
              className="ml-auto text-red-400 hover:text-red-600 text-xs"
            >
              <i className="fas fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => copyToClipboard(getReportString(false))}
              className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              <i
                className={`fas ${copyStatus === 'copied' ? 'fa-check text-green-500' : 'fa-copy'}`}
              ></i>
              {copyStatus === 'copied' ? 'Copied' : 'Full Copy'}
            </button>
            <button
              onClick={() => copyToClipboard(getReportString(true))}
              className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              <i className="fas fa-font"></i>
              Plain Text
            </button>
            <button
              onClick={generateParentDigest}
              className="flex items-center gap-1.5 text-[9px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest hover:text-amber-700 transition-colors"
            >
              <i className="fas fa-envelope-open-text"></i>
              Parent Digest
            </button>
            <button
              onClick={downloadPdf}
              className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              <i className="fas fa-file-pdf"></i>
              PDF
            </button>
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest hover:text-emerald-600 transition-colors"
            >
              <i className="fas fa-share-nodes"></i>
              Share
            </button>
          </div>
          <button
            onClick={() => onDelete(report.id)}
            className="w-8 h-8 flex items-center justify-center text-slate-200 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <i className="fas fa-trash-alt text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
