import { useEffect, useState } from 'react';
import { load, save } from '../utils/storage';
import { saveCompletions as saveCompletionsRemote } from '../utils/db';
import TaskItem from './TaskItem';
import SectionCard from './SectionCard';
import { calculatePoints, getProgressColor } from '../utils/points';
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
const itShortDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function normalize(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizePart(part) {
  const v = normalize(part);
  if (v === 'mattina' || v === 'am') return 'morning';
  if (v === 'pomeriggio' || v === 'pm') return 'afternoon';
  return v || 'morning';
}

function getPointsTextColor(pts) {
  if (pts >= 100) return 'text-green-400';
  if (pts > 95) return 'text-green-600';
  if (pts > 70) return 'text-yellow-500';
  if (pts > 50) return 'text-orange-500';
  return 'text-red-500';
}

function romeNow() {
  const now = new Date();
  const s = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  return s;
}

function appDayFrom(date) {
  const d = new Date(date);
  const hour = d.getHours();
  if (hour < 5) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(0,0,0,0);
  return d;
}

function addAppDays(date, delta) {
  const d = new Date(date);
  // Portiamo l'orario a mezzogiorno per evitare il cutoff < 5:00 che sottrae un giorno
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + delta);
  return appDayFrom(d);
}

function formatKey(dateObj) {
  // Use Europe/Rome timezone to produce a stable YYYY-MM-DD regardless of the runtime locale
  return dateObj.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }); // en-CA gives ISO 8601 format
}

export default function Today() {
  const { user } = useAuth();
  const [data, setData] = useState(load(user?.uid));
  const [isAnimating, setIsAnimating] = useState(true);

  // Data navigation
  const [viewDate, setViewDate] = useState(() => appDayFrom(romeNow()));
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
    // remote
    void saveCompletionsRemote(user?.uid, dateKey, completions);
  }, [completions, dateKey, user?.uid]);

  // Animazione di entrata
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Ricarica i dati locali quando cambia il giorno (per dailySpecific e impostazioni aggiornate)
  useEffect(() => {
    setData(load(user?.uid));
  }, [dateKey, user?.uid]);

  const isWeekday = (d) => {
    const day = d.getDay();
    return day !== 0 && day !== 6;
  };

  const todayDateOnly = new Date();
  todayDateOnly.setHours(0, 0, 0, 0);
  const viewDateStart = new Date(viewDate);
  viewDateStart.setHours(0, 0, 0, 0);
  const appToday = appDayFrom(romeNow());
  const yesterday = addAppDays(appToday, -1);
  const tomorrow = addAppDays(appToday, 1);
  const viewKey = formatKey(viewDate);
  const todayKey = formatKey(appToday);
  const yKey = formatKey(yesterday);
  const tKey = formatKey(tomorrow);
  const isTodayView = viewKey === todayKey;
  const isYesterdayView = viewKey === yKey;
  const isTomorrowView = viewKey === tKey;
  const isFuture = isTomorrowView;

  const tasks = [];
  const baseTasks = [];
  const sleepTasks = [];
  const morningTasks = [];
  const afternoonTasks = [];
  const malusTasks = [];
  // Stato di espansione per sezioni
  const [expanded, setExpanded] = useState({ base: true, sleep: true, morning: true, afternoon: true, malus: true });
  const toggle = (key) => setExpanded((s) => ({ ...s, [key]: !s[key] }));


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

  // Weekly repeating activities - support legacy (days[]) and new (weekday)
  const englishDow = weekdays[viewDate.getDay()];
  const italianDow = itShortDays[viewDate.getDay()];
  const itFullDays = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
  const weekdayShortNorm = normalize(italianDow);
  const weekdayFullNorm = normalize(itFullDays[viewDate.getDay()]);
  const weekdayFullPrefix3 = weekdayFullNorm.slice(0,3);
  const weekdayEnShortNorm = normalize(englishDow);
  (data.dailyActivities || []).forEach((act, idx) => {
    if (!act) return;
    let include = false;
    if (typeof act.weekday === 'string') {
      const wNorm = normalize(act.weekday);
      include = (
        wNorm === weekdayShortNorm ||
        wNorm === weekdayFullNorm ||
        wNorm.startsWith(weekdayFullPrefix3) ||
        wNorm === weekdayEnShortNorm
      );
    } else if (Array.isArray(act.days)) {
      include = act.days.includes(englishDow);
    }
    if (!include) return;
    const start = new Date(act.createdAt || dateKey);
    const msWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksDiff = Math.floor((viewDate - start) / msWeek);
    const repeat = Math.max(1, Number(act.repeat || 1));
    const offset = Math.max(0, Number(act.offset || 0));
    if (((weeksDiff - offset) % repeat) !== 0) return;
    const part = normalizePart(act.partOfDay || 'morning');
    const obj = {
      key: `daily-${idx}`,
      label: act.name,
      partOfDay: part,
    };
    tasks.push(obj);
    (part === 'morning' ? morningTasks : afternoonTasks).push(obj);
  });

  // Specific activities for this day
  const specificToday = data.dailySpecific?.[dateKey] || [];
  specificToday.forEach((act, idx) => {
    const obj = {
      key: `spec-${idx}`,
      label: act.name,
      partOfDay: normalizePart(act.partOfDay),
      isSpecific: true,
      specIndex: idx,
    };
    tasks.push(obj);
    (obj.partOfDay === 'morning' ? morningTasks : afternoonTasks).push(obj);
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

  const countPoints = () => {
    return calculatePoints(dateKey, data, user?.uid);
  };

  const [newName, setNewName] = useState('');
  const [newPart, setNewPart] = useState('morning');

  const addSpecific = () => {};

  const changeDay = (delta) => {
    // Recalcola i limiti rispetto all'"oggi" corrente (con cutoff 5:00)
    const nowToday = appDayFrom(romeNow());
    const nowY = addAppDays(nowToday, -1);
    const nowT = addAppDays(nowToday, 1);
    const c = addAppDays(viewDate, delta);
    const cKey = formatKey(c);
    if (![formatKey(nowY), formatKey(nowToday), formatKey(nowT)].includes(cKey)) return;
    setViewDate(c);
  };

  return (
    <>
      {/* Header con data formattata - FUORI dal main per rimanere fisso */}
      <div className="fixed top-20 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl px-4 py-3 z-50">
        <div className="grid grid-cols-[auto,1fr,auto] items-center">
          <button onClick={() => changeDay(-1)} disabled={isYesterdayView} className={`p-1 rounded-md hover:bg-white/20 ${isYesterdayView ? 'opacity-50 cursor-not-allowed' : ''}`} aria-label="Giorno precedente">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 14.707a1 1 0 01-1.414 0L7.586 11l3.707-3.707a1 1 0 011.414 1.414L10.414 11l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
          </button>
          <div className="flex justify-between items-center leading-none m-0">
            <span className="text-lg font-semibold text-black dark:text-white capitalize">{formatDateParts(viewDate).weekday}</span>
            <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatDateParts(viewDate).datePart}</span>
          </div>
          <button onClick={() => changeDay(1)} disabled={isTomorrowView} className={`p-1 rounded-md hover:bg-white/20 ${isTomorrowView ? 'opacity-50 cursor-not-allowed' : ''}`} aria-label="Giorno successivo">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 5.293a1 1 0 011.414 0L12.414 9 8.707 12.707a1 1 0 01-1.414-1.414L9.586 9 7.293 6.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
        </div>
      </div>
      
      {/* Progress bar - Fisso in basso */}
      {!isFuture && (
      <div className={`fixed bottom-24 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl px-4 py-3 z-40 ${countPoints()===100 ? 'glow-emerald' : ''}`}>
        {(() => {
          const pts = countPoints();
          const color = getProgressColor(pts);
          return (
            <>
              <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} transition-all duration-300`}
                  style={{ width: `${Math.min(100, pts)}%` }}
                />
              </div>
              <p className="text-sm mt-1 text-center font-semibold">
                <span className={getPointsTextColor(pts)}>
                  {pts}
                </span> / 100 punti
              </p>
            </>
          );
        })()}
      </div>
      )}

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
            <SectionCard title="Attività base" collapsible expanded={expanded.base} onToggle={() => toggle('base')} className="bg-gradient-to-br from-emerald-500/40 to-emerald-600/30 ring-1 ring-emerald-500/40 dark:ring-emerald-600/40">
              {baseTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  hideCheckbox={isFuture}
                />
              ))}
            </SectionCard>
          )}
          
          {/* Sonno */}
          {sleepTasks.length > 0 && (
            <SectionCard title="Sonno" collapsible expanded={expanded.sleep} onToggle={() => toggle('sleep')} className="bg-gradient-to-br from-blue-500/40 to-blue-600/30 ring-1 ring-blue-500/40 dark:ring-blue-600/40">
              {sleepTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  hideCheckbox={isFuture}
                />
              ))}
            </SectionCard>
          )}
        </div>
        
        {/* Attività quotidiane e Malus */}
        <div className="space-y-4">
          {/* Mattina */}
          {morningTasks.length > 0 && (
            <SectionCard title="Mattina" collapsible expanded={expanded.morning} onToggle={() => toggle('morning')} className="bg-gradient-to-br from-amber-500/40 to-amber-600/30 ring-1 ring-amber-500/40 dark:ring-amber-600/40">
              {morningTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  hideCheckbox={isFuture}
                  onDelete={
                    t.isSpecific && !isFuture
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
            <SectionCard title="Pomeriggio" collapsible expanded={expanded.afternoon} onToggle={() => toggle('afternoon')} className="bg-gradient-to-br from-orange-500/40 to-orange-600/30 ring-1 ring-orange-500/40 dark:ring-orange-600/40">
              {afternoonTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  hideCheckbox={isFuture}
                  onDelete={
                    t.isSpecific && !isFuture
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
            <SectionCard title="Malus" collapsible expanded={expanded.malus} onToggle={() => toggle('malus')} className="bg-gradient-to-br from-red-500/40 to-red-600/30 ring-1 ring-red-500/40 dark:ring-red-600/40">
              {malusTasks.map((t) => (
                <TaskItem
                  key={t.key}
                  label={t.label}
                  checked={!!completions[t.key]}
                  onChange={(v) => handleToggle(t.key, v)}
                  hideCheckbox={isFuture}
                />
              ))}
            </SectionCard>
          )}
        </div>
      </div>

      {/* Progress bar - Spostato fuori dal main per essere fisso */}

      
      
      {/* Spazio extra per evitare che il contenuto venga nascosto dalla barra di avanzamento */}
      <div className="pb-20"></div>
        </main>
      </>
    );
  } 