import React from 'react';

const styles: Record<string, string> = {
  NORMAL: 'bg-gray-100 text-gray-800',
  WATCH: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  FROZEN: 'bg-red-100 text-red-800',
};

const RiskLevelBadge = ({ level }: { level: string }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[level] || styles.NORMAL}`}>
      {level}
    </span>
  );
};

export default RiskLevelBadge;
