import React from 'react';

const JobStatusCard = ({ status, onRun, onDryRun, loading }: { status: any; onRun: () => void; onDryRun: () => void; loading: boolean }) => {
  const report = status?.lastReport;
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">Daily Risk Eval</div>
          <div className="text-xs text-gray-500">Lock: {status?.expiresAt ? 'Active' : 'Idle'}</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs rounded border" onClick={onDryRun} disabled={loading}>Dry Run</button>
          <button className="px-3 py-1.5 text-xs rounded bg-black text-white" onClick={onRun} disabled={loading}>Run</button>
        </div>
      </div>
      {report && (
        <div className="text-xs text-gray-700 grid grid-cols-2 gap-2">
          <div>Evaluated: {report.evaluated}</div>
          <div>Changed: {report.changed}</div>
          <div>Frozen: {report.frozen}</div>
          <div>Unfrozen: {report.unfrozen}</div>
          <div>Errors: {report.errors}</div>
          <div>Finished: {report.finishedAt}</div>
        </div>
      )}
    </div>
  );
};

export default JobStatusCard;
