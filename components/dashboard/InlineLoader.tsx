import React from 'react';

/** Small three-dot loading indicator used inside dashboard panels. */
const InlineLoader: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
    {label}
  </div>
);

export default InlineLoader;
