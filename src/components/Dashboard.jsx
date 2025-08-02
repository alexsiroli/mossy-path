import { useEffect, useState } from 'react';
import { load, save } from '../utils/storage';
import TaskItem from './TaskItem';
import SectionCard from './SectionCard';
import { calculatePoints } from '../utils/points';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatKey(dateObj) {
  return dateObj.toISOString().split('T')[0];
}

export default function Dashboard() {
  const [data, setData] = useState(load());

  // Data navigation
  const [viewDate, setViewDate] = useState(new Date());
  const dateKey = formatKey(viewDate);

  const [completions, setCompletions] = useState(() => data.completions?.[dateKey] || {});

  // Refresh completions when changing day or loading new data
  useEffect(() => {
    setCompletions(load().completions?.[dateKey] || {});
  }, [dateKey]);

  // Persist completions
  useEffect(() => {
    const current = load();
    save({
      ...current,
      completions: { ...(current.completions || {}), [dateKey]: completions },
    });
    setData(load());
  }, [completions, dateKey]);

  const isWeekday = (d) => {
    const day = d.getDay();
    return day !== 0 && day !== 6;
  };

  const todayDateOnly = new Date();
  todayDateOnly.setHours(0, 0, 0, 0);
  const viewDateStart = new Date(viewDate);
  viewDateStart.setHours(0, 0, 0, 0);
  const isFuture = viewDateStart > todayDateOnly;

  const tasks = [];
  const baseTasks = [];
  const sleepTasks = [];
  const morningTasks = [];
  const afternoonTasks = [];
  const malusTasks = [];

  // Base activities
  data.baseActivities?.forEach((act, idx) => {
    const obj = { key: `base-${idx}`, label: act };
    tasks.push(obj);
    baseTasks.push(obj);
  });

  // Sleep
  if (data.sleep) {
    const bed = { key: 'sleep-bed', label: `Andare a letto entro ${data.sleep.bedtime}` };
    const wake = { key: 'sleep-wake', label: `Sveglia entro ${data.sleep.wakeTime}` };
    tasks.push(bed, wake);
    sleepTasks.push(bed, wake);
  }

  // Weekly repeating activities
  const weekdayName = weekdays[viewDate.getDay()];
  data.dailyActivities?.forEach((act, idx) => {
    if (!act.days.includes(weekdayName)) return;
    // repeat logic
    const start = new Date(act.createdAt || dateKey);
    const weeksDiff = Math.floor((viewDate - start) / (7 * 24 * 60 * 60 * 1000));
    if (weeksDiff % (act.repeat || 1) !== 0) return;
    const obj = {
      key: `daily-${idx}`,
      label: act.name,
      partOfDay: act.partOfDay,
    };
    tasks.push(obj);
    (act.partOfDay === 'morning' ? morningTasks : afternoonTasks).push(obj);
  });

  // Specific activities for this day
  const specificToday = data.dailySpecific?.[dateKey] || [];
  specificToday.forEach((act, idx) => {
    const obj = {
      key: `spec-${idx}`,
      label: act.name,
      partOfDay: act.partOfDay,
      isSpecific: true,
      specIndex: idx,
    };
    tasks.push(obj);
    (act.partOfDay === 'morning' ? morningTasks : afternoonTasks).push(obj);
  });

  // Malus
  data.malus?.forEach((m, idx) => {
    if (m.weekdaysOnly && !isWeekday(viewDate)) return;
    const obj = { key: `malus-${idx}`, label: m.name };
    tasks.push(obj);
    malusTasks.push(obj);
  });

  const handleToggle = (key, value) => {
    if (isFuture) return;
    setCompletions({ ...completions, [key]: value });
  };

  /*
    Calcolo punti
  */
  const countPoints = () => calculatePoints(dateKey, data);

  /*
    Aggiunta attività specifica
  */
  const [newName, setNewName] = useState('');
  const [newPart, setNewPart] = useState('morning');

  const addSpecific = () => {
    if (!newName.trim()) return;
    const updated = load();
    const list = updated.dailySpecific?.[dateKey] || [];
    const newTask = { name: newName.trim(), partOfDay: newPart };
    const newDailySpecific = {
      ...(updated.dailySpecific || {}),
      [dateKey]: [...list, newTask],
    };
    save({ ...updated, dailySpecific: newDailySpecific });
    setData(load());
    setNewName('');
  };

  /*
    Navigazione giorni
  */
  const changeDay = (delta) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + delta);
    setViewDate(d);
  };

  return (
    <main>
      <h1>Dashboard</h1>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <button className="btn-ghost" onClick={() => changeDay(-1)}>
          ← Giorno precedente
        </button>
        <strong className="flex-1 text-center">{dateKey}</strong>
        <button className="btn-ghost" onClick={() => changeDay(1)}>
          Giorno successivo →
        </button>
      </div>

      {/* Section renderer helper */}
      {[
        { title: 'Attività base', items: baseTasks },
        { title: 'Sonno / Sveglia', items: sleepTasks },
        { title: 'Mattina', items: morningTasks },
        { title: 'Pomeriggio', items: afternoonTasks },
        { title: 'Malus', items: malusTasks },
      ].map(
        ({ title, items }) =>
          items.length > 0 && (
            <SectionCard key={title} title={title}>
              {items.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  disabled={isFuture}
                  onDelete={
                    t.isSpecific
                      ? () => {
                          const updated = load();
                          const list = (updated.dailySpecific?.[dateKey] || []).filter(
                            (_, i) => i !== t.specIndex
                          );
                          const newDailySpecific = {
                            ...(updated.dailySpecific || {}),
                            [dateKey]: list,
                          };
                          save({ ...updated, dailySpecific: newDailySpecific });
                          setData(load());
                        }
                      : undefined
                  }
                />
              ))}
            </SectionCard>
          )
      )}

      {/* Progress bar */}
      <div className="my-4">
        {(() => {
          const pts = countPoints();
          const color = pts >= 80 ? 'bg-green-500' : pts >= 50 ? 'bg-yellow-500' : 'bg-red-500';
          return (
            <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} transition-all duration-300`}
                style={{ width: `${Math.min(100, pts)}%` }}
              />
            </div>
          );
        })()}
        <p className="text-sm mt-1">Punti del giorno: {countPoints()} / 100{isFuture && ' (solo lettura)'}</p>
      </div>

      <hr />
      <h3>Aggiungi attività specifica</h3>
      <input
        type="text"
        placeholder="Nome attività"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <select className="select w-auto" value={newPart} onChange={(e) => setNewPart(e.target.value)}>
        <option value="morning">Mattina</option>
        <option value="afternoon">Pomeriggio</option>
      </select>
      <button onClick={addSpecific} className="btn-primary">Aggiungi</button>

      <ul>
        {specificToday.map((t, idx) => (
          <li key={idx}>
            {t.name} ({t.partOfDay}){' '}
            <button
              onClick={() => {
                const updated = load();
                const list = (updated.dailySpecific?.[dateKey] || []).filter((_, i) => i !== idx);
                const newDailySpecific = {
                  ...(updated.dailySpecific || {}),
                  [dateKey]: list,
                };
                save({ ...updated, dailySpecific: newDailySpecific });
                setData(load());
              }}
            >
              Rimuovi
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
} 