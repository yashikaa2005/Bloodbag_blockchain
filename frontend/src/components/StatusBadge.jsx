import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const norm = (status || 'UNKNOWN').toUpperCase();

  const config = {
    COLLECTED: {
      bg: 'bg-zinc-100 text-zinc-800 border-zinc-300',
      dot: 'bg-zinc-500',
      label: 'COLLECTED',
    },
    TESTING: {
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      dot: 'bg-amber-500 animate-pulse',
      label: 'TESTING',
    },
    APPROVED: {
      bg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      dot: 'bg-emerald-600',
      label: 'APPROVED',
    },
    AVAILABLE: {
      bg: 'bg-blood-50 text-blood-700 border-blood-300 font-bold',
      dot: 'bg-blood-600',
      label: 'AVAILABLE',
    },
    TRANSFERRED: {
      bg: 'bg-blue-50 text-blue-900 border-blue-300',
      dot: 'bg-blue-600 animate-pulse',
      label: 'IN TRANSIT',
    },
    RECEIVED: {
      bg: 'bg-teal-50 text-teal-900 border-teal-300',
      dot: 'bg-teal-600',
      label: 'RECEIVED',
    },
    CONSUMED: {
      bg: 'bg-zinc-800 text-zinc-100 border-zinc-700',
      dot: 'bg-zinc-400',
      label: 'CONSUMED',
    },
    EXPIRED: {
      bg: 'bg-red-950 text-red-200 border-red-800',
      dot: 'bg-red-500',
      label: 'EXPIRED',
    },
    REJECTED: {
      bg: 'bg-red-100 text-red-900 border-red-300 font-semibold',
      dot: 'bg-red-600',
      label: 'REJECTED',
    },
    UNKNOWN: {
      bg: 'bg-zinc-100 text-zinc-600 border-zinc-300',
      dot: 'bg-zinc-400',
      label: 'UNKNOWN',
    },
  };

  const item = config[norm] || config.UNKNOWN;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold border ${item.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
};
