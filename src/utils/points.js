import { load } from './storage';

export function calculatePoints(dateKey, dataArg, userId = null) {
  const data = dataArg || load(userId);
  const comps = data.completions?.[dateKey] || {};
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const viewDate = new Date(dateKey + 'T00:00:00');
  const weekdayName = weekdays[viewDate.getDay()];
  const isWeekday = viewDate.getDay() !== 0 && viewDate.getDay() !== 6;
  let pts = 0;
  // base
  data.baseActivities?.forEach((_, idx) => {
    if (comps[`base-${idx}`]) pts += 10;
  });
  // sleep
  if (data.sleep) {
    if (comps['sleep-bed']) pts += 15;
    if (comps['sleep-wake']) pts += 15;
  }
  // daily and specific
  const partDone = (part) => {
    const tasks = [];
    data.dailyActivities?.forEach((act, idx) => {
      if (!act.days.includes(weekdayName)) return;
      const start = new Date(act.createdAt || dateKey);
      const weeksDiff = Math.floor((viewDate - start) / (7 * 24 * 60 * 60 * 1000));
      if (weeksDiff % (act.repeat || 1) !== 0) return;
      if (act.partOfDay === part) tasks.push(`daily-${idx}`);
    });
    (data.dailySpecific?.[dateKey] || []).forEach((act, idx) => {
      if (act.partOfDay === part) tasks.push(`spec-${idx}`);
    });
    return tasks.length === 0 || tasks.every((k) => comps[k]);
  };
  if (partDone('morning')) pts += 10;
  if (partDone('afternoon')) pts += 10;
  // malus
  data.malus?.forEach((malus, idx) => {
    // Se malus è una stringa, non ha weekdaysOnly
    const weekdaysOnly = typeof malus === 'object' ? malus.weekdaysOnly : false;
    if (weekdaysOnly && !isWeekday) return;
    if (comps[`malus-${idx}`]) pts -= 10;
  });
  return pts;
} 