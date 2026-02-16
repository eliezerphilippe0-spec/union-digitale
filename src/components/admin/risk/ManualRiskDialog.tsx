import React, { useState } from 'react';

const ManualRiskDialog = ({ store, onClose, onSubmit }: any) => {
  const [riskLevel, setRiskLevel] = useState('WATCH');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [payoutsFrozen, setPayoutsFrozen] = useState(false);

  if (!store) return null;

  const submit = () => {
    if (reason.trim().length < 5) return;
    onSubmit({ riskLevel, reason, note, payoutsFrozen });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">Set Risk Level</h3>
        <div className="space-y-3">
          <select className="w-full border rounded px-3 py-2" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            <option value="NORMAL">NORMAL</option>
            <option value="WATCH">WATCH</option>
            <option value="HIGH">HIGH</option>
            <option value="FROZEN">FROZEN</option>
          </select>
          <textarea className="w-full border rounded px-3 py-2" placeholder="Reason (min 5 chars)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <textarea className="w-full border rounded px-3 py-2" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={payoutsFrozen} onChange={(e) => setPayoutsFrozen(e.target.checked)} />
            Force payoutsFrozen
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-3 py-1.5 text-xs border rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1.5 text-xs rounded bg-black text-white" onClick={submit} disabled={reason.trim().length < 5}>Apply</button>
        </div>
      </div>
    </div>
  );
};

export default ManualRiskDialog;
