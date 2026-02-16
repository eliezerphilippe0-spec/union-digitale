import React from 'react';

const styles: Record<string, string> = {
  INFO: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[severity] || styles.INFO}`}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
