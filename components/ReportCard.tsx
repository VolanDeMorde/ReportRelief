
import React, { useState } from 'react';
import { GeneratedReport } from '../types';

interface ReportCardProps {
  report: GeneratedReport;
  onDelete: (id: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onDelete }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const getReportString = (isPlain: boolean = false) => {
    let text = report.reportText;
    let actionPlanStr = report.actionPlan.map((p, i) => `${i + 1}. ${p}`).join('\n');
    
    if (isPlain) {
      text = text.replace(/\*\*/g, '');
      actionPlanStr = actionPlanStr.replace(/\*\*/g, '');
    }

    const header = `${report.studentName} | ${report.subject} (${report.year}${report.gradeLevel ? ` - ${report.gradeLevel}` : ''})\nMark: ${report.mark}%\n\n`;
    const actionSection = report.actionPlan.length > 0 
      ? `\n\nNext Steps:\n${actionPlanStr}` 
      : '';
    
    return `${header}${text}${actionSection}`;
  };

  const renderText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const copyToClipboard = (isPlain: boolean = false) => {
    navigator.clipboard.writeText(getReportString(isPlain));
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const downloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const plainTextReport = report.reportText.replace(/\*\*/g, '');
    const dateStr = new Date(report.timestamp).toLocaleDateString();

    printWindow.document.write(`
      <html>
        <head>
          <title>Report - ${report.studentName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 60px; color: #1e293b; line-height: 1.7; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { margin: 0; font-size: 32px; font-weight: 800; color: #0f172a; }
            .subject-tag { font-size: 14px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 12px; }
            .meta-item { font-size: 12px; }
            .meta-label { font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; }
            .meta-value { font-weight: 700; color: #334155; font-size: 14px; }
            .report-content { font-size: 16px; margin-bottom: 40px; white-space: pre-wrap; color: #334155; }
            .action-plan { background: #eff6ff; padding: 30px; border-radius: 20px; border: 1px solid #dbeafe; }
            .action-plan h4 { margin-top: 0; color: #2563eb; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; }
            .action-plan ul { padding-left: 0; margin: 0; list-style: none; }
            .action-plan li { margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #1e40af; display: flex; gap: 12px; }
            .action-plan li .num { font-weight: 800; color: #2563eb; min-width: 20px; }
            .footer { margin-top: 60px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; text-transform: uppercase; letter-spacing: 2px; }
            @media print { body { padding: 40px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <span class="subject-tag">${report.subject}</span>
              <h1>${report.studentName}</h1>
            </div>
            <div style="text-align: right">
              <div style="font-size: 32px; font-weight: 800; color: #0f172a;">${report.mark}%</div>
              <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Overall Grade</div>
            </div>
          </div>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Year / Group</span>
              <span class="meta-value">${report.year} ${report.gradeLevel ? `(${report.gradeLevel})` : ''}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date Issued</span>
              <span class="meta-value">${dateStr}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Curriculum</span>
              <span class="meta-value">${report.curriculum}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Assessment</span>
              <span class="meta-value">${report.tone} Report</span>
            </div>
          </div>
          <div class="report-content">${plainTextReport}</div>
          ${report.actionPlan.length > 0 ? `
            <div class="action-plan">
              <h4>Next Steps & Action Plan</h4>
              <ul>
                ${report.actionPlan.map((step, i) => `<li><span class="num">${i + 1}.</span> <span>${step.replace(/\*\*/g, '')}</span></li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="footer">
            Generated via ReportRelief AI Assistant • ${dateStr}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Report: ${report.studentName}`,
          text: getReportString(true),
        });
      } catch (err) {}
    } else copyToClipboard(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-5 flex-1">
             <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {report.studentPhoto ? (
                  <img src={report.studentPhoto} alt={report.studentName} className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-slate-200 text-2xl"></i>
                )}
             </div>
             <div>
                <div className="flex items-center flex-wrap gap-2 mb-1">
                   <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{report.studentName}</h3>
                   <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                     {report.subject}
                   </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                  {report.year} {report.gradeLevel ? `• ${report.gradeLevel}` : ''} • {new Date(report.timestamp).toLocaleDateString()}
                </p>
             </div>
          </div>
          <div className={`px-4 py-2 rounded-xl text-xl font-black shadow-inner ${
            report.mark >= 80 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
            report.mark >= 60 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
            'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
          }`}>
            {report.mark}%
          </div>
        </div>
        
        <div className="selectable text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap font-medium">
          {renderText(report.reportText)}
        </div>

        {report.actionPlan.length > 0 && (
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
        )}

        <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => copyToClipboard(false)}
              className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              <i className={`fas ${copyStatus === 'copied' ? 'fa-check text-green-500' : 'fa-copy'}`}></i>
              {copyStatus === 'copied' ? 'Copied' : 'Full Copy'}
            </button>
            <button
              onClick={() => copyToClipboard(true)}
              className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              <i className="fas fa-font"></i>
              Plain Text
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
