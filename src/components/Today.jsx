import { useEffect, useState } from 'react';
import { load, save } from '../utils/storage';
import TaskItem from './TaskItem';
import SectionCard from './SectionCard';
import { calculatePoints } from '../utils/points';
import useAuth from '../hooks/useAuth';
import SectionTitle from './SectionTitle';

// Funzione per formattare la data in italiano
const formatDate = (date) => {
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  return date.toLocaleDateString('it-IT', options);
};

// Funzione per separare giorno della settimana e data
const formatDateParts = (date) => {
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  const fullDate = date.toLocaleDateString('it-IT', options);
  const parts = fullDate.split(' ');
  const weekday = parts[0];
  const datePart = parts.slice(1).join(' ');
  return { weekday, datePart };
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatKey(dateObj) {
  return dateObj.toISOString().split('T')[0];
}

export default function Today() {
  const { user } = useAuth();
  const [data, setData] = useState(load(user?.uid));
  const [isAnimating, setIsAnimating] = useState(true);

  // Data navigation
  const [viewDate, setViewDate] = useState(new Date());
  const dateKey = formatKey(viewDate);

  const [completions, setCompletions] = useState(() => data.completions?.[dateKey] || {});

  // Refresh completions when changing day or loading new data
  useEffect(() => {
    setCompletions(load(user?.uid).completions?.[dateKey] || {});
  }, [dateKey, user?.uid]);

  // Persist completions
  useEffect(() => {
    const current = load(user?.uid);
    save({
      ...current,
      completions: { ...(current.completions || {}), [dateKey]: completions },
    }, user?.uid);
    setData(load(user?.uid));
  }, [completions, dateKey, user?.uid]);

  // Animazione di entrata
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
    const wake = { key: 'sleep-wake', label: `Sveglia entro ${data.sleep.wakeup}` };
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
  data.malus?.forEach((malus, idx) => {
    const weekdaysOnly = typeof malus === 'object' ? malus.weekdaysOnly : false;
    if (weekdaysOnly && !isWeekday(viewDate)) return;
    const name = typeof malus === 'string' ? malus : malus.name;
    const obj = { key: `malus-${idx}`, label: name };
    tasks.push(obj);
    malusTasks.push(obj);
  });

  const handleToggle = (key, value) => {
    setCompletions((prev) => ({ ...prev, [key]: value }));
  };

  const countPoints = () => calculatePoints(dateKey, data, user?.uid);

  const [newName, setNewName] = useState('');
  const [newPart, setNewPart] = useState('morning');

  const addSpecific = () => {
    if (!newName.trim()) return;
    const current = load(user?.uid);
    const list = (current.dailySpecific?.[dateKey] || []).concat({
      name: newName.trim(),
      partOfDay: newPart,
    });
    const newDailySpecific = {
      ...(current.dailySpecific || {}),
      [dateKey]: list,
    };
    save({ ...current, dailySpecific: newDailySpecific }, user?.uid);
    setData(load(user?.uid));
    setNewName('');
  };

  const changeDay = (delta) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + delta);
    setViewDate(d);
  };

  return (
    <>
      {/* Header con data formattata - FUORI dal main per rimanere fisso */}
      <div className="fixed top-20 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl px-6 py-3 z-50">
        <div className="flex justify-between items-center leading-none m-0">
          <span className="text-lg font-semibold text-black dark:text-white capitalize">
            {formatDateParts(viewDate).weekday}
          </span>
          <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {formatDateParts(viewDate).datePart}
          </span>
        </div>
      </div>
      
      {/* Progress bar - Fisso in basso */}
      <div className="fixed bottom-24 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl px-4 py-3 z-40">
        {(() => {
          const pts = countPoints();
          const color = pts >= 80 ? 'bg-green-500' : pts >= 50 ? 'bg-yellow-500' : 'bg-red-500';
          return (
            <>
              <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} transition-all duration-300`}
                  style={{ width: `${Math.min(100, pts)}%` }}
                />
              </div>
              <p className="text-sm mt-1 text-center font-semibold">
                <span className={pts >= 80 ? 'text-green-500' : pts >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                  {pts}
                </span> / 100 punti{isFuture && ' (solo lettura)'}
              </p>
            </>
          );
        })()}
      </div>

      <main className={`transition-all duration-1000 ease-out mt-32 ${
        isAnimating 
          ? 'opacity-0 translate-y-8 scale-95' 
          : 'opacity-100 translate-y-0 scale-100'
      }`}>


      {/* Sezioni organizzate in grid per layout più moderno */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attività base e Sonno */}
        <div className="space-y-4">
          {/* Attività base */}
          {baseTasks.length > 0 && (
            <SectionCard title="Attività base" className="animate-fade-in-delay-2 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
              {baseTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  disabled={isFuture}
                />
              ))}
            </SectionCard>
          )}
          
          {/* Sonno */}
          {sleepTasks.length > 0 && (
            <SectionCard title="Sonno" className="animate-fade-in-delay-2 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              {sleepTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  disabled={isFuture}
                />
              ))}
            </SectionCard>
          )}
        </div>
        
        {/* Attività quotidiane e Malus */}
        <div className="space-y-4">
          {/* Mattina */}
          {morningTasks.length > 0 && (
            <SectionCard title="Mattina" className="animate-fade-in-delay-3 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
              {morningTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  disabled={isFuture}
                  onDelete={
                    t.isSpecific
                      ? () => {
                          const updated = load(user?.uid);
                          const list = (updated.dailySpecific?.[dateKey] || []).filter(
                            (_, i) => i !== t.specIndex
                          );
                          const newDailySpecific = {
                            ...(updated.dailySpecific || {}),
                            [dateKey]: list,
                          };
                          save({ ...updated, dailySpecific: newDailySpecific }, user?.uid);
                          setData(load(user?.uid));
                        }
                      : undefined
                  }
                />
              ))}
            </SectionCard>
          )}
          
          {/* Pomeriggio */}
          {afternoonTasks.length > 0 && (
            <SectionCard title="Pomeriggio" className="animate-fade-in-delay-3 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
              {afternoonTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  disabled={isFuture}
                  onDelete={
                    t.isSpecific
                      ? () => {
                          const updated = load(user?.uid);
                          const list = (updated.dailySpecific?.[dateKey] || []).filter(
                            (_, i) => i !== t.specIndex
                          );
                          const newDailySpecific = {
                            ...(updated.dailySpecific || {}),
                            [dateKey]: list,
                          };
                          save({ ...updated, dailySpecific: newDailySpecific }, user?.uid);
                          setData(load(user?.uid));
                        }
                      : undefined
                  }
                />
              ))}
            </SectionCard>
          )}
          
          {/* Malus */}
          {malusTasks.length > 0 && (
            <SectionCard title="Malus" className="animate-fade-in-delay-4 bg-gradient-to-br from-red-500/10 to-red-600/5">
              {malusTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  disabled={isFuture}
                />
              ))}
            </SectionCard>
          )}
        </div>
      </div>

      {/* Progress bar - Spostato fuori dal main per essere fisso */}

      {/* Aggiungi attività specifica - Sezione modernizzata */}
      <div className="mt-8 mb-24 p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl shadow-md animate-fade-in-delay-4">
        <h3 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">Aggiungi attività specifica</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Nome attività"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded-lg"
          />
          <select className="select rounded-lg" value={newPart} onChange={(e) => setNewPart(e.target.value)}>
            <option value="morning">Mattina</option>
            <option value="afternoon">Pomeriggio</option>
          </select>
          <button onClick={addSpecific} className="btn-primary">Aggiungi</button>
        </div>
        
        {specificToday.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2 text-purple-500 dark:text-purple-400">Attività specifiche di oggi:</h4>
            <ul className="space-y-2">
              {specificToday.map((t, idx) => (
                <li key={idx} className="flex items-center justify-between p-2 bg-white/30 dark:bg-black/30 rounded-lg">
                  <span>
                    {t.name} <span className="text-xs text-gray-500">({t.partOfDay === 'morning' ? 'mattina' : 'pomeriggio'})</span>
                  </span>
                  <button
                    className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    onClick={() => {
                      const updated = load(user?.uid);
                      const list = (updated.dailySpecific?.[dateKey] || []).filter((_, i) => i !== idx);
                      const newDailySpecific = {
                        ...(updated.dailySpecific || {}),
                        [dateKey]: list,
                      };
                      save({ ...updated, dailySpecific: newDailySpecific }, user?.uid);
                      setData(load(user?.uid));
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Spazio extra per evitare che il contenuto venga nascosto dalla barra di avanzamento */}
      <div className="pb-20"></div>
        </main>
      </>
    );
  } 