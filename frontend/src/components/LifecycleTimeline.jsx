import React from 'react';
import { StatusBadge } from './StatusBadge';
import { Clock, ShieldCheck, UserCheck, ArrowDown } from 'lucide-react';

export const LifecycleTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-6 text-center text-zinc-500 bg-zinc-50 border border-zinc-200">
        <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
        <p className="text-xs font-semibold uppercase tracking-wider">No lifecycle events recorded on-chain yet</p>
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-black ml-4 pl-6 space-y-6 py-2">
      {history.map((entry, index) => {
        const isLatest = index === history.length - 1;
        const dateStr = entry.date ? new Date(entry.date).toLocaleString() : 'N/A';

        return (
          <div key={index} className="relative group">
            {/* Timeline node */}
            <div
              className={`absolute -left-[31px] top-1 w-3.5 h-3.5 border-2 ${
                isLatest
                  ? 'bg-blood-600 border-black ring-4 ring-blood-100'
                  : 'bg-black border-white'
              }`}
            />

            <div className="bg-white border border-zinc-200 p-4 shadow-sm hover:border-zinc-400 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.statusName} />
                  <span className="text-xs font-bold text-black uppercase tracking-wider">
                    {entry.action}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  {dateStr}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-zinc-100 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-zinc-600">
                  <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[11px] font-medium">Actor:</span>
                  <span className="font-mono text-[11px] text-zinc-900 bg-zinc-100 px-1.5 py-0.5 border border-zinc-200">
                    {entry.actorTitle || entry.actor}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Event #{index + 1}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
