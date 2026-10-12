import React from 'react';

export const BloodGroupBadge = ({ group, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 min-w-[32px]',
    md: 'text-sm px-2.5 py-1 min-w-[40px]',
    lg: 'text-lg px-3 py-1.5 min-w-[50px] font-bold',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-extrabold bg-black text-white border-l-4 border-blood-600 ${sizeClasses[size]}`}
    >
      {group || 'N/A'}
    </span>
  );
};
