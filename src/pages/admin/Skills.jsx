import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Timer, Wrench } from 'lucide-react';
import { useAdminFetch } from '../../hooks/useAdminFetch';

const WINDOW_OPTIONS = [
  { label: '24h', value: '24h' },
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
];

const AdminSkills = () => {
  const { adminFetch } = useAdminFetch();
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState('7d');
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, eventsData] = await Promise.all([
        adminFetch(`/api/admin/skills/summary?window=${window}`),
        adminFetch('/api/admin/skills/events?limit=50'),
      ]);
      setSummary(summaryData);
      setEvents(eventsData.events || []);
    } catch (err) {
      console.error('Skills admin load failed', err);
      setError('Impossible de charger les données des skills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [window]);

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleString();
  };

  const errorCount = summary?.recentErrors?.length || 0;
  const totalEvents = summary?.totalEvents || 0;
  const totalSkills = summary?.skills?.length || 0;
  const avgDuration = events.length
    ? Math.round(events.reduce((sum, e) => sum + (e.durationMs || 0), 0) / events.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Skills</h3>
          <p className="text-sm text-gray-500">Suivi des usages et des définitions.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={window}
            onChange={(e) => setWindow(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {WINDOW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="px-3 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Activity className="w-5 h-5" />
            <span className="text-sm">Événements</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900">{totalEvents}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Wrench className="w-5 h-5" />
            <span className="text-sm">Skills actives</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900">{totalSkills}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">Erreurs récentes</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900">{errorCount}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Timer className="w-5 h-5" />
            <span className="text-sm">Durée moyenne</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900">{avgDuration} ms</div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900">Top Skills</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-6 py-3">Skill</th>
                <th className="text-left px-6 py-3">Utilisations</th>
                <th className="text-left px-6 py-3">Dernière activité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="3" className="px-6 py-6 text-center text-gray-400">Chargement...</td></tr>
              ) : (summary?.bySkill?.length ? summary.bySkill.map((row) => (
                <tr key={row.skillKey} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.skillKey}</td>
                  <td className="px-6 py-4 text-gray-700">{row.count}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(row.lastUsedAt)}</td>
                </tr>
              )) : (
                <tr><td colSpan="3" className="px-6 py-6 text-center text-gray-400">Aucune donnée.</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900">Derniers événements</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-left px-6 py-3">Skill</th>
                <th className="text-left px-6 py-3">Statut</th>
                <th className="text-left px-6 py-3">Source</th>
                <th className="text-left px-6 py-3">Acteur</th>
                <th className="text-left px-6 py-3">Durée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-6 text-center text-gray-400">Chargement...</td></tr>
              ) : events.length ? events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{formatDate(event.createdAt)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{event.skillKey}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${event.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{event.source}</td>
                  <td className="px-6 py-4 text-gray-500">{event.actorEmail || event.actorUserId || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{event.durationMs ? `${event.durationMs} ms` : '-'}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-6 py-6 text-center text-gray-400">Aucun événement.</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSkills;
