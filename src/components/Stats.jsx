import { load } from '../utils/storage';
import useAuth from '../hooks/useAuth';
import { calculatePoints } from '../utils/points';

export default function Stats() {
  const { user } = useAuth();
  const data = load(user?.uid);
  const today = new Date();
  const rows = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    // ensure not in the future (can happen due to timezone)
    const nowMidnight = new Date();
    nowMidnight.setHours(0, 0, 0, 0);
    if (d > nowMidnight) continue;
    const pts = calculatePoints(key, data);
    rows.push({ key, pts });
  }

  // Current streak (points >= 80) and best streak in last 30 days
  let currentStreak = 0;
  let bestStreak = 0;
  rows.forEach((r, idx) => {
    if (r.pts >= 80) {
      currentStreak = idx === 0 ? currentStreak + 1 : currentStreak;
    }
  });
  // compute best
  let temp = 0;
  rows.forEach((r) => {
    if (r.pts >= 80) {
      temp += 1;
      bestStreak = Math.max(bestStreak, temp);
    } else {
      temp = 0;
    }
  });

  return (
    <main>
      <h1>Statistiche ultime 30 giorni</h1>
      <p className="mt-2 text-sm">Streak attuale: <strong>{currentStreak}</strong> giorni — Miglior streak: <strong>{bestStreak}</strong> giorni</p>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b p-2 text-left">Data</th>
            <th className="border-b p-2 text-left">Punti</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const colorClass =
              r.pts >= 80 ? 'text-green-600' : r.pts >= 50 ? 'text-yellow-600' : 'text-red-600';
            const barColor =
              r.pts >= 80 ? 'bg-green-500' : r.pts >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            return (
              <tr key={r.key} className={colorClass}>
                <td className="p-2 border-b flex items-center gap-2">
                  <span
                    className={`block h-3 w-3 rounded-full ${barColor}`}
                    aria-label="colore punti"
                  />
                  {r.key}
                </td>
                <td className="p-2 border-b">{r.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
} 