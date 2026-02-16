import React from 'react';

const styles: Record<string, string> = {
  NORMAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  WATCH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
  FROZEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

const RiskLevelBadge = ({ level }: { level: string }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[level] || styles.NORMAL}`}>
      {level}
    </span>
  );
};

export default RiskLevelBadge;
