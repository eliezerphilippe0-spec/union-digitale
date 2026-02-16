import React, { useState } from 'react';

const FreezeUnfreezeDialog = ({ store, mode, onClose, onSubmit }: any) => {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [level, setLevel] = useState('HIGH');

  if (!store) return null;

  const submit = () => {
    if (reason.trim().length < 5) return;
    onSubmit({ reason, note, level });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">{mode === 'freeze' ? 'Freeze' : 'Unfreeze'} Store</h3>
        {mode === 'freeze' && (
          <select className="w-full border rounded px-3 py-2 mb-3" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="HIGH">HIGH</option>
            <option value="FROZEN">FROZEN</option>
          </select>
        )}
        <textarea className="w-full border rounded px-3 py-2" placeholder="Reason (min 5 chars)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <textarea className="w-full border rounded px-3 py-2 mt-3" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-3 py-1.5 text-xs border rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1.5 text-xs rounded bg-black text-white" onClick={submit} disabled={reason.trim().length < 5}>Apply</button>
        </div>
      </div>
    </div>
  );
};

export default FreezeUnfreezeDialog;
