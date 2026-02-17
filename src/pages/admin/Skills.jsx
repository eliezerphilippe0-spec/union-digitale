import React, { useEffect, useState } from 'react';
import { useAdminFetch } from '../../hooks/useAdminFetch';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminSkills = () => {
  const { t } = useLanguage();
  const adminFetch = useAdminFetch();
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [window, setWindow] = useState('7d');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const load = async () => {
      const s = await adminFetch(`/api/admin/skills/usage/summary?window=${window}`);
      const e = await adminFetch('/api/admin/skills/usage/events?limit=100');
      setSummary(s);
      setEvents(e.events || []);
    };
    load();
  }, [window]);

  const filteredEvents = selectedSkill === 'all'
    ? events
    : events.filter((e) => e.selectedSkill === selectedSkill);

  const skills = Array.from(new Set(events.map((e) => e.selectedSkill)));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Skills Governance</h1>

      <div className="flex gap-2 items-center">
        {['24h', '7d', '30d'].map((w) => (
          <button
            key={w}
            onClick={() => setWindow(w)}
            className={`px-3 py-1 text-sm rounded ${window === w ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded border">
          <div className="text-xs text-gray-500">Total runs</div>
          <div className="text-2xl font-bold">{summary?.totalRuns || 0}</div>
        </div>
        <div className="bg-white p-4 rounded border">
          <div className="text-xs text-gray-500">Blocked runs</div>
          <div className="text-2xl font-bold text-red-600">{summary?.blockedRuns || 0}</div>
        </div>
        <div className="bg-white p-4 rounded border">
          <div className="text-xs text-gray-500">Top skills</div>
          <div className="text-sm text-gray-700">
            {(summary?.topSkills || []).map((s) => (
              <div key={s.skill} className="flex justify-between">
                <span>{s.skill}</span>
                <span>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent events</h2>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All skills</option>
            {skills.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Skill</th>
                <th className="p-2 text-left">Result</th>
                <th className="p-2 text-left">Task</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEvents.map((e) => (
                <tr key={e.id}>
                  <td className="p-2 text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="p-2">{e.selectedSkill}</td>
                  <td className={`p-2 ${e.result === 'BLOCKED' ? 'text-red-600' : 'text-green-700'}`}>{e.result}</td>
                  <td className="p-2 text-xs text-gray-600 line-clamp-1">{e.task}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => setSelectedEvent(e)}
                      className="text-blue-600 text-xs"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Skill event detail</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-500">✕</button>
            </div>
            <div className="text-sm space-y-2">
              <div><strong>Skill:</strong> {selectedEvent.selectedSkill}</div>
              <div><strong>Result:</strong> {selectedEvent.result}</div>
              <div><strong>Task:</strong> {selectedEvent.task}</div>
              <div><strong>Secondary:</strong> {JSON.stringify(selectedEvent.secondarySkills || [])}</div>
              <div><strong>Changed files:</strong> {JSON.stringify(selectedEvent.changedFiles || [])}</div>
              <div><strong>Commit:</strong> {selectedEvent.commitHash || '—'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSkills;
