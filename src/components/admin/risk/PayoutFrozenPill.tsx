import React from 'react';
import { Snowflake } from 'lucide-react';

const PayoutFrozenPill = ({ frozen }: { frozen: boolean }) => {
  if (!frozen) return <span className="text-xs text-gray-500">No</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
      <Snowflake className="w-3 h-3" /> Frozen
    </span>
  );
};

export default PayoutFrozenPill;
