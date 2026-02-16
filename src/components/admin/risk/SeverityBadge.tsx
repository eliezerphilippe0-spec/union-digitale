import React from 'react';

const styles: Record<string, string> = {
  INFO: 'bg-gray-100 text-gray-700',
  WARNING: 'bg-yellow-100 text-yellow-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[severity] || styles.INFO}`}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
