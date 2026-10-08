import React from 'react';
import type { MarkStats } from '../../hooks/useReportFilters';

interface ClassStatsProps {
  analytics: MarkStats;
  totalReports: number;
}

/** Indigo card with mean / total / highest / lowest mark across saved reports. */
const ClassStats: React.FC<ClassStatsProps> = ({ analytics, totalReports }) => {
  const hasReports = totalReports > 0;
  const stats = [
    { label: 'Mean', value: hasReports ? `${analytics.avg}%` : '—' },
    { label: 'Total', value: String(totalReports) },
    { label: 'Highest', value: hasReports ? `${analytics.high}%` : '—' },
    { label: 'Lowest', value: hasReports ? `${analytics.low}%` : '—' },
  ];
  return (
    <div className="p-8 bg-indigo-600 rounded-4xl text-white shadow-xl">
      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">
        Class Stats
      </h4>
      <div className="grid grid-cols-2 gap-6">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block mb-1">
              {label}
            </span>
            <span className="text-2xl font-black">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassStats;
