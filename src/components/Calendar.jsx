import { useState, useEffect } from 'react';
import { load, save } from '../utils/storage';
import useAuth from '../hooks/useAuth';
import SectionTitle from './SectionTitle';
import TaskItem from './TaskItem';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { getProgressColor, calculatePoints } from '../utils/points';

// Funzione per ottenere il nome del mese in italiano
const getMonthName = (month) => {
  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  return months[month];
};

// Funzione per ottenere il nome del giorno in italiano
const getDayName = (day) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  return days[day];
};

// Funzione per formattare la data in italiano
const formatDate = (date) => {
  return `${date.getDate()} ${getMonthName(date.getMonth())} ${date.getFullYear()}`;
};

export default function Calendar() {
  const { user } = useAuth();
  const [data, setData] = useState(load(user?.uid));
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newActivity, setNewActivity] = useState({ name: '', partOfDay: 'morning' });
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [dayTasks, setDayTasks] = useState([]);
  const [completions, setCompletions] = useState({});
  const [slideOffset, setSlideOffset] = useState(0);
  
  // Carica i dati all'avvio
  useEffect(() => {
    const userData = load(user?.uid);
    setData(userData);
  }, [user?.uid]);
  
  // Aggiorna le completions quando cambia la data selezionata
  useEffect(() => {
    if (selectedDate) {
      const dateKey = selectedDate.toISOString().split('T')[0];
      setCompletions(data.completions?.[dateKey] || {});
    }
  }, [selectedDate, data]);
  
  // Calcola i giorni del mese corrente (iniziando da lunedì)
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Primo giorno del mese
    const firstDay = new Date(year, month, 1);
    // Adatta il giorno della settimana per iniziare da lunedì (1=lunedì, 0=domenica)
    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    // Ultimo giorno del mese
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Giorni del mese precedente per riempire la prima settimana
    const prevMonthDays = [];
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthLastDay = prevMonth.getDate();
      
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = new Date(year, month - 1, prevMonthLastDay - i);
        prevMonthDays.push({
          date: day,
          isCurrentMonth: false,
          isPast: day < new Date(),
          isToday: false
        });
      }
    }
    
    // Giorni del mese corrente
    const currentMonthDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      const isToday = day.getDate() === today.getDate() && 
                      day.getMonth() === today.getMonth() && 
                      day.getFullYear() === today.getFullYear();
      
      currentMonthDays.push({
        date: day,
        isCurrentMonth: true,
        isPast: day < today,
        isToday
      });
    }
    
    // Giorni del mese successivo per riempire l'ultima settimana
    const nextMonthDays = [];
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = 42 - totalDays; // 6 righe x 7 colonne = 42 celle
    
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      nextMonthDays.push({
        date: day,
        isCurrentMonth: false,
        isPast: false,
        isToday: false
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };
  
  // Cambia mese
  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
    // Ripristina vista mensile
    setSelectedDate(null);
    setShowDayDetails(false);
  };
  
  // Controlla se un giorno è prima della data di creazione dell'account
  const isBeforeAccountCreation = (date) => {
    if (!user?.metadata?.creationTime) return false;
    const creationDate = new Date(user.metadata.creationTime);
    creationDate.setHours(0, 0, 0, 0);
    return date < creationDate;
  };
  
  // Seleziona un giorno
  const selectDay = (day) => {
    if (isBeforeAccountCreation(day.date)) return;
    
    setSelectedDate(day.date);
    setShowDayDetails(true);
    
    // Carica le attività del giorno
    const dateKey = day.date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Usa dati freschi da storage per evitare ritardi di render
    const currentData = load(user?.uid);

    // Carica subito le completions del giorno selezionato
    setCompletions(currentData.completions?.[dateKey] || {});
    
    const tasks = [];
    const baseTasks = [];
    const sleepTasks = [];
    const morningTasks = [];
    const afternoonTasks = [];
    const malusTasks = [];
    
    // Base activities
    currentData.baseActivities?.forEach((act, idx) => {
      const obj = { key: `base-${idx}`, label: act };
      tasks.push(obj);
      baseTasks.push(obj);
    });
    
    // Sleep
    if (currentData.sleep) {
      const bed = { key: 'sleep-bed', label: `Andare a letto entro ${currentData.sleep.bedtime}` };
      const wake = { key: 'sleep-wake', label: `Sveglia entro ${currentData.sleep.wakeup}` };
      tasks.push(bed, wake);
      sleepTasks.push(bed, wake);
    }
    
    // Weekly repeating activities
    const englishDow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.date.getDay()];
    const italianDow = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][day.date.getDay()];
    (currentData.dailyActivities || []).forEach((act, idx) => {
      let include = false;
      if (act && act.weekday) {
        if (act.weekday === italianDow) {
          const start = new Date(act.createdAt || dateKey);
          const msWeek = 7 * 24 * 60 * 60 * 1000;
          const weeksDiff = Math.floor((day.date - start) / msWeek);
          const repeat = Math.max(1, Number(act.repeat || 1));
          const offset = Math.max(0, Number(act.offset || 0));
          include = ((weeksDiff - offset) % repeat) === 0;
        }
      } else if (act && Array.isArray(act.days)) {
        if (act.days.includes(englishDow)) {
          const start = new Date(act.createdAt || dateKey);
          const msWeek = 7 * 24 * 60 * 60 * 1000;
          const weeksDiff = Math.floor((day.date - start) / msWeek);
          const repeat = Math.max(1, Number(act.repeat || 1));
          include = (weeksDiff % repeat) === 0;
        }
      }
      if (!include) return;
      const obj = {
        key: `daily-${idx}`,
        label: act.name,
        partOfDay: act.partOfDay,
      };
      tasks.push(obj);
      (act.partOfDay === 'morning' ? morningTasks : afternoonTasks).push(obj);
    });
    
    // Specific activities for this day
    const specificToday = currentData.dailySpecific?.[dateKey] || [];
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
    currentData.malus?.forEach((malus, idx) => {
      const weekdaysOnly = typeof malus === 'object' ? malus.weekdaysOnly : false;
      const isWeekday = (d) => {
        const day = d.getDay();
        return day !== 0 && day !== 6;
      };
      if (weekdaysOnly && !isWeekday(day.date)) return;
      const name = typeof malus === 'string' ? malus : malus.name;
      const obj = { key: `malus-${idx}`, label: name };
      tasks.push(obj);
      malusTasks.push(obj);
    });
    
    setDayTasks({
      all: tasks,
      base: baseTasks,
      sleep: sleepTasks,
      morning: morningTasks,
      afternoon: afternoonTasks,
      malus: malusTasks,
      date: day.date,
      dateKey,
      isPast: day.date < today,
      isToday: day.isToday
    });
  };

  const navigateDay = (delta) => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);

    // Aggiorna mese se si supera il confine
    if (
      newDate.getMonth() !== currentMonth.getMonth() ||
      newDate.getFullYear() !== currentMonth.getFullYear()
    ) {
      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }

    // Slide-in animation (semplice)
    setSlideOffset(delta < 0 ? -16 : 16);
    // Aggiorna selezione e rientra a 0
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = newDate.toDateString() === today.toDateString();
    const isPast = newDate < today;
    // Aggiorna i dettagli del giorno
    selectDay({ date: newDate, isToday, isPast });
    // Rientro dell'offset
    setTimeout(() => setSlideOffset(0), 0);
  };
  
  // Gestisce il toggle di un'attività
  const handleToggle = (key, value) => {
    if (dayTasks.isPast && !dayTasks.isToday) return;
    
    const dateKey = dayTasks.dateKey;
    const updatedCompletions = { ...completions, [key]: value };
    setCompletions(updatedCompletions);
    
    const userData = load(user?.uid);
    save({
      ...userData,
      completions: { ...(userData.completions || {}), [dateKey]: updatedCompletions },
    }, user?.uid);
    
    setData(load(user?.uid));
  };
  
  // Aggiunge un'attività specifica
  const addSpecificActivity = () => {
    if (!newActivity.name.trim() || !selectedDate) return;
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    const userData = load(user?.uid);
    
    const newSpecific = {
      name: newActivity.name.trim(),
      partOfDay: newActivity.partOfDay,
    };
    
    const updatedSpecific = {
      ...(userData.dailySpecific || {}),
      [dateKey]: [...(userData.dailySpecific?.[dateKey] || []), newSpecific],
    };
    
    save({ ...userData, dailySpecific: updatedSpecific }, user?.uid);
    setData(load(user?.uid));
    setNewActivity({ name: '', partOfDay: 'morning' });
    
    // Aggiorna le attività del giorno
    selectDay({ date: selectedDate, isToday: dayTasks.isToday, isPast: dayTasks.isPast });
  };
  
  // Rimuove un'attività specifica
  const removeSpecificActivity = (specIndex) => {
    if (!selectedDate) return;
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    const userData = load(user?.uid);
    
    const updatedActivities = (userData.dailySpecific?.[dateKey] || []).filter((_, idx) => idx !== specIndex);
    
    const updatedSpecific = {
      ...(userData.dailySpecific || {}),
      [dateKey]: updatedActivities,
    };
    
    save({ ...userData, dailySpecific: updatedSpecific }, user?.uid);
    setData(load(user?.uid));
    
    // Aggiorna le attività del giorno
    selectDay({ date: selectedDate, isToday: dayTasks.isToday, isPast: dayTasks.isPast });
  };
  
  // Calcola i punti per un giorno
  const getPointsForDay = (date) => {
    if (isBeforeAccountCreation(date)) return null;
    
    const dateKey = date.toISOString().split('T')[0];
    return calculatePoints(dateKey, data);
  };
  
  // Ottiene il colore in base ai punti
  const getColorForPoints = (points) => {
    if (points === null) return null;
    if (points >= 80) return 'bg-green-500';
    if (points >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Calcola lo streak attuale e il miglior streak
  const calculateStreaks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    // Controlla gli ultimi 30 giorni
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      if (isBeforeAccountCreation(d)) break;
      
      const key = d.toISOString().split('T')[0];
      const pts = calculatePoints(key, data);
      
      if (pts >= 80) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return { currentStreak, bestStreak };
  };
  
  const streaks = calculateStreaks();
  const days = getDaysInMonth();

  // Filtra settimane: mostra solo quelle che contengono almeno un giorno del mese corrente
  const getVisibleMonthDays = () => {
    const visible = [];
    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      if (week.some((d) => d.isCurrentMonth)) {
        visible.push(...week);
      }
    }
    return visible;
  };
  const monthDaysToShow = getVisibleMonthDays();

  // Calcola la settimana della data selezionata (array di 7 giorni lun-dom)
  const getSelectedWeekDays = () => {
    if (!selectedDate) return null;
    const idx = days.findIndex((d) => d.date.toDateString() === selectedDate.toDateString());
    if (idx === -1) return null;
    const start = Math.floor(idx / 7) * 7;
    return days.slice(start, start + 7);
  };
  const selectedWeekDays = getSelectedWeekDays();
  const [expandedSections, setExpandedSections] = useState({ base: false, sleep: false, morning: false, afternoon: false, malus: false });
  const toggleSection = (key) => setExpandedSections((s) => ({ ...s, [key]: !s[key] }));

  const sectionPercent = (taskArr) => {
    if (!dayTasks || !taskArr || taskArr.length === 0) return 0;
    const done = taskArr.filter((t) => completions[t.key]).length;
    return Math.round((done / taskArr.length) * 100);
  };

  const sectionDoneCount = (taskArr) => {
    if (!taskArr || taskArr.length === 0) return 0;
    return taskArr.filter((t) => completions[t.key]).length;
  };

  const sectionPoints = (key, taskArr) => {
    const totalCount = taskArr?.length || 0;
    if (key === 'base') {
      return { done: sectionDoneCount(taskArr) * 10, total: totalCount * 10 };
    }
    if (key === 'sleep') {
      return { done: sectionDoneCount(taskArr) * 15, total: totalCount * 15 };
    }
    if (key === 'morning' || key === 'afternoon') {
      // Max 10 anche senza attività
      const total = 10;
      const done = totalCount === 0 || sectionDoneCount(taskArr) === totalCount ? 10 : 0;
      return { done, total };
    }
    return { done: 0, total: 0 };
  };

  return (
    <>
      <SectionTitle title="" className="py-4">
        <div className="flex items-center justify-between w-full">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          </button>
          <h1
            className="text-xl font-bold text-black dark:text-white leading-none m-0 cursor-pointer hover:opacity-90"
            title="Vai al mese corrente"
            onClick={() => {
              const now = new Date();
              setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDate(null);
              setShowDayDetails(false);
            }}
          >
            {getMonthName(currentMonth.getMonth())} {currentMonth.getFullYear()}
          </h1>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
          </button>
        </div>
      </SectionTitle>

      {/* Barra settimana fissa quando un giorno è selezionato */}
      {showDayDetails && selectedWeekDays && (
        <div className="fixed top-36 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto z-40">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
              <div key={day} className="text-center font-semibold p-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 bg-white/10 dark:bg-black/10 rounded-xl p-1 backdrop-blur-sm">
            {selectedWeekDays.map((day, idx) => {
              const points = getPointsForDay(day.date);
              const pointsColor = points !== null ? getProgressColor(points) : null;
              const isDisabled = isBeforeAccountCreation(day.date);
              const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isDisabled) return;
                    if (isSelected) {
                      setSelectedDate(null);
                      setShowDayDetails(false);
                    } else {
                      selectDay(day);
                    }
                  }}
                  className={`relative h-12 p-1 border rounded-lg transition-all ${
                    day.isCurrentMonth
                      ? day.isToday
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500'
                        : 'bg-white/30 dark:bg-black/30 border-gray-200 dark:border-gray-700'
                      : 'bg-gray-100/30 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600'
                  } ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500'} ${
                    isSelected ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''
                  }`}
                >
                  <div className="text-right text-sm font-medium">{day.date.getDate()}</div>
                  {pointsColor && day.isPast && (
                    <div className="absolute bottom-1 left-1 right-1 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${pointsColor}`}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header fisso del giorno selezionato */}
      {showDayDetails && selectedDate && (
        <div className="fixed top-64 inset-x-4 sm:inset-x-0 sm:max-w-screen-md sm:mx-auto z-40">
          <div className="bg-emerald-500/30 dark:bg-emerald-600/30 backdrop-blur-xl ring-1 ring-emerald-500/40 dark:ring-emerald-600/40 shadow-xl rounded-2xl px-4 py-2">
            <div className="grid grid-cols-[auto,1fr,auto] items-center">
              <button onClick={() => navigateDay(-1)} className="p-1 rounded-md hover:bg-white/20" aria-label="Giorno precedente">
                <ChevronLeftIcon className="h-5 w-5 text-white" />
              </button>
              <h3
                className="text-center font-semibold text-white leading-none whitespace-nowrap m-0"
                style={{ transform: `translateX(${slideOffset}px)`, transition: 'transform 150ms ease' }}
              >
                {formatDate(selectedDate)}
              </h3>
              <button onClick={() => navigateDay(1)} className="p-1 rounded-md hover:bg-white/20" aria-label="Giorno successivo">
                <ChevronRightIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`pb-20 ${showDayDetails ? 'mt-80 animate-fade-in-up' : 'mt-36 animate-fade-in-up'}`}>
        {/* Griglia calendario mese completa */}
        {!showDayDetails && (
          <div className="grid grid-cols-7 gap-1 mb-6">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
              <div key={day} className="text-center font-semibold p-2">{day}</div>
            ))}
            {monthDaysToShow.map((day, idx) => {
              const points = getPointsForDay(day.date);
              const pointsColor = points !== null ? getProgressColor(points) : null;
              const isDisabled = isBeforeAccountCreation(day.date);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isDisabled) return;
                    if (selectedDate && day.date.toDateString() === selectedDate.toDateString()) {
                      setSelectedDate(null);
                      setShowDayDetails(false);
                    } else {
                      selectDay(day);
                    }
                  }}
                  className={`relative h-14 p-1 border rounded-lg transition-all ${
                    day.isCurrentMonth
                      ? day.isToday
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500'
                        : 'bg-white/30 dark:bg-black/30 border-gray-200 dark:border-gray-700'
                      : 'bg-gray-100/30 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600'
                  } ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500'} ${
                    selectedDate && day.date.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''
                  } ${getPointsForDay(day.date)===100 ? 'glow-outline' : ''}`}
                >
                  <div className="text-right text-sm font-medium">{day.date.getDate()}</div>
                  {pointsColor && day.isPast && (
                    <div className="absolute bottom-1 left-1 right-1 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${pointsColor}`}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Dettagli giorno selezionato */}
        {showDayDetails && selectedDate && (
          <div className="space-y-4">
            {/* Punteggio del giorno (solo giorni passati) */}
            {dayTasks.isPast && (
              <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold m-0">Punteggio del giorno</p>
                  <p className="text-sm font-semibold m-0">{calculatePoints(dayTasks.dateKey, data)} / 100</p>
                </div>
                <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${getProgressColor(calculatePoints(dayTasks.dateKey, data))}`} style={{ width: `${Math.min(100, calculatePoints(dayTasks.dateKey, data))}%` }} />
                </div>
              </div>
            )}

            {/* Sezioni collassabili */}
            {[
              { key: 'base', title: 'Attività base', colorClasses: 'text-emerald-600 dark:text-emerald-400', tasks: dayTasks.base },
              { key: 'sleep', title: 'Sonno', colorClasses: 'text-blue-600 dark:text-blue-400', tasks: dayTasks.sleep },
              { key: 'morning', title: 'Mattina', colorClasses: 'text-amber-600 dark:text-amber-400', tasks: dayTasks.morning },
              { key: 'afternoon', title: 'Pomeriggio', colorClasses: 'text-orange-600 dark:text-orange-400', tasks: dayTasks.afternoon },
              { key: 'malus', title: 'Malus', colorClasses: 'text-red-600 dark:text-red-400', tasks: dayTasks.malus },
            ].map(({ key, title, colorClasses, tasks }) => (
              ((key === 'morning' || key === 'afternoon') || tasks.length > 0) && (
                <div key={key} className="bg-white/30 dark:bg-black/30 backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 shadow-xl rounded-2xl">
                  <button
                    className="w-full px-4 py-2 min-h-12 flex items-center justify-between"
                    onClick={() => toggleSection(key)}
                  >
                    <span className={`font-semibold ${colorClasses}`}>{title}</span>
                    <div className="flex items-center gap-2">
                      {/* Punti prima, poi avanzamento circolare (eccetto malus) */}
                      {dayTasks.isPast && key !== 'malus' && (
                        <>
                          {(() => {
                            const { done, total } = sectionPoints(key, tasks);
                            const complete = total > 0 && done === total;
                            return (
                              <span className={`text-xs font-semibold ${complete ? 'text-emerald-500' : 'text-white/80'}`}>{done}/{total}</span>
                            );
                          })()}
                          {tasks.length > 0 && (
                            <div className="relative h-8 w-8">
                              <svg className="h-8 w-8" viewBox="0 0 36 36">
                                <path className="stroke-current text-gray-300 dark:text-gray-600" fill="none" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="stroke-current text-emerald-500" fill="none" strokeWidth="3" strokeDasharray={`${sectionPercent(tasks)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              </svg>
                            </div>
                          )}
                        </>
                      )}
                      {/* Malus: mostra solo -XX o 0/0 in verde */}
                      {dayTasks.isPast && key === 'malus' && (
                        (() => {
                          const doneMalus = sectionDoneCount(tasks);
                          const text = doneMalus === 0 ? '0/0' : `-${doneMalus * 10}`;
                          const cls = doneMalus === 0 ? 'text-emerald-500' : 'text-red-500';
                          return <span className={`text-sm font-semibold ${cls}`}>{text}</span>;
                        })()
                      )}
                    </div>
                  </button>

                  {expandedSections[key] && (
                    <div className="px-4 pb-3 space-y-2">
                      {tasks.length > 0 ? (
                        tasks.map((task) => (
                          <TaskItem
                            key={task.key}
                            label={task.label}
                            checked={!!completions[task.key]}
                            onChange={(v) => handleToggle(task.key, v)}
                            disabled={true}
                            onDelete={
                              task.isSpecific && (!dayTasks.isPast || dayTasks.isToday)
                                ? () => removeSpecificActivity(task.specIndex)
                                : undefined
                            }
                            className="group"
                          />
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nessuna attività</p>
                      )}

                      {/* Aggiungi attività per giorni futuri (mattina/pomeriggio) */}
                      {(!dayTasks.isPast || dayTasks.isToday) && (key === 'morning' || key === 'afternoon') && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            placeholder={`Nuova attività ${key === 'morning' ? 'mattina' : 'pomeriggio'}`}
                            value={newActivity.partOfDay === key ? newActivity.name : ''}
                            onChange={(e) => setNewActivity({ name: e.target.value, partOfDay: key })}
                            className="flex-1 px-3 py-2 text-sm border rounded-lg"
                          />
                          <button onClick={() => newActivity.partOfDay === key && addSpecificActivity()} className="h-8 w-8 mt-3 flex items-center justify-center bg-emerald-500 text-white rounded-md">
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </>
  );
}