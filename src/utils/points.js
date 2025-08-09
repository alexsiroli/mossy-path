import { load } from './storage';

export function calculatePoints(dateKey, dataArg, userId = null) {
  const data = dataArg || load(userId);
  const comps = data.completions?.[dateKey] || {};
  const viewDate = new Date(dateKey + 'T00:00:00');

  const itShortDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const itFullDays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const enShortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayShort = itShortDays[viewDate.getDay()];
  const weekdayFull = itFullDays[viewDate.getDay()];
  const weekdayEnShort = enShortDays[viewDate.getDay()];

  const normalize = (s) =>
    (s || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  const weekdayShortNorm = normalize(weekdayShort); // es. 'lun'
  const weekdayFullNorm = normalize(itFullDays[viewDate.getDay()]); // es. 'lunedi'
  const weekdayFullPrefix3 = weekdayFullNorm.slice(0, 3); // 'lun'
  const weekdayEnShortNorm = normalize(weekdayEnShort); // 'mon'

  const normalizePart = (p) => {
    const v = normalize(p);
    if (v === 'mattina') return 'morning';
    if (v === 'pomeriggio') return 'afternoon';
    // accept short forms
    if (v === 'am') return 'morning';
    if (v === 'pm') return 'afternoon';
    return v; // expect 'morning' or 'afternoon'
  };

  let points = 0;

  // Base: 5 each
  const baseCount = (data.baseActivities || []).length;
  let baseDone = 0;
  (data.baseActivities || []).forEach((_, idx) => {
    if (comps[`base-${idx}`]) baseDone += 1;
  });
  points += baseDone * 5;

  // Sleep: 15 each
  let sleepDone = 0;
  if (data.sleep) {
    if (comps['sleep-bed']) sleepDone += 1;
    if (comps['sleep-wake']) sleepDone += 1;
  }
  points += sleepDone * 15;

  // Collect tasks per part (morning/afternoon)
  const collectPartTasks = (part) => {
    const tasks = [];
    
    // Helper function to add tasks to the array
    const addTask = (key, reason) => {

      tasks.push(key);
    };
    
    // Process all daily activities

    (data.dailyActivities || []).forEach((act, idx) => {
      if (!act) {

        return;
      }
      
      const actPartOfDay = act.partOfDay || 'morning';
      const actWeekday = typeof act.weekday === 'string' ? act.weekday : (Array.isArray(act.days) ? act.days.join(',') : 'unknown');

      
      // Check if weekday matches
      let matchesWeekday = false;
      if (typeof act.weekday === 'string') {
        const wNorm = normalize(act.weekday);
        // accetta short IT, full IT, prefisso di full IT (3), e short EN
        matchesWeekday =
          wNorm === weekdayShortNorm ||
          wNorm === weekdayFullNorm ||
          wNorm.startsWith(weekdayFullPrefix3) ||
          wNorm === weekdayEnShortNorm;
        
        if (!matchesWeekday) {

          return;
        }
        // else {

        // }
      } else if (Array.isArray(act.days)) {
        // legacy format: EN short names
        matchesWeekday = act.days.includes(weekdayEnShort);
        if (!matchesWeekday) {

          return;
        }
        // else {

        // }
      } else {

        return;
      }
      
      // If createdAt is missing, treat it as if created on the viewDate for repeat/offset calculation
      if (!act.createdAt) {

        // Continue with processing - we'll use viewDate as the effective createdAt below
      }
      
      // Check repeat/offset pattern
      // Use start-of-day comparison in Europe/Rome to avoid timezone-related negatives
      const createdAtDate = act.createdAt ? new Date(act.createdAt) : viewDate;
      const createdStart = new Date(createdAtDate);
      createdStart.setHours(0, 0, 0, 0);

      const viewStart = new Date(viewDate);
      viewStart.setHours(0, 0, 0, 0);

      const msInWeek = 7 * 24 * 60 * 60 * 1000;
      const diffMs = viewStart - createdStart;
      if (diffMs < 0) {
        // Activity created in the future – not yet started for this day
        return;
      }
      const weeksDiff = Math.floor(diffMs / msInWeek);
      

      
      const repeat = Math.max(1, Number(act.repeat || 1));
      const offset = Math.max(0, Number(act.offset || 0));
      
      if (((weeksDiff - offset) % repeat) !== 0) {

        return;
      }
      // else {

      // }
      
      const partNorm = normalizePart(actPartOfDay);
      if (partNorm === part) {
        addTask(`daily-${idx}`, `matching weekday + repeat schedule (${act.name})`);
      }
      // else {

      // }
    });
    // specific for this day

    const specificActivities = data.dailySpecific?.[dateKey] || [];
    // if (specificActivities.length === 0) {

    // }
    
    specificActivities.forEach((act, idx) => {
      if (!act) {

        return;
      }
      
      const actPartOfDay = act.partOfDay || 'morning';
      const partNorm = normalizePart(actPartOfDay);
      

      
      if (partNorm === part) {
        addTask(`spec-${idx}`, "day-specific activity");
      }
      // else {

      // }
    });
    
    // We've removed the "missing keys" logic that was incorrectly pulling in activities from other days
    // The collectPartTasks function should be the sole determinant of which activities are relevant for the current day
    
    return tasks;
  };

  const morningTasks = collectPartTasks('morning');
  const afternoonTasks = collectPartTasks('afternoon');

  // All present tasks for the part must be checked; if there are zero tasks, it's NOT auto-complete
  const allDone = (keys) => {
    if (keys.length === 0) return false;
    const result = keys.every((k) => !!comps[k]);

    return result;
  };
  
  // Check if any tasks are present but not completed
  const hasIncompleteTasks = (keys) => {
    if (keys.length === 0) return false;
    const result = !keys.every((k) => !!comps[k]);

    return result;
  };

  // Morning/Afternoon: 20 only if there is at least one task and all are done
  if (allDone(morningTasks)) {
    points += 20;
  }
  if (allDone(afternoonTasks)) {
    points += 20;
  }

  // Bonus if a part has no tasks: Base +2 each completed, Sleep +5 each completed (apply independently)
  // Only apply this bonus if there are genuinely no tasks for that part of the day
  const applyNoPartBonus = (hasNoTasks) => {
    if (!hasNoTasks) return 0;
    // If there are tasks but they're all not visible due to repeat/offset, we shouldn't give bonus
    return baseDone * 2 + sleepDone * 5;
  };
  
  // First check if there are weekly activities for today that should be visible
  const hasMorningActivities = morningTasks.length > 0;
  const hasAfternoonActivities = afternoonTasks.length > 0;
  
  // Only apply bonus if there are genuinely no tasks for that part
  if (!hasMorningActivities) {
    const morningBonus = applyNoPartBonus(true);
    points += morningBonus;
  }
  
  if (!hasAfternoonActivities) {
    const afternoonBonus = applyNoPartBonus(true);
    points += afternoonBonus;
  }

  // Malus: -10 each
  (data.malus || []).forEach((malus, idx) => {
    const weekdaysOnly = typeof malus === 'object' ? !!malus.weekdaysOnly : false;
    const day = viewDate.getDay();
    const isWeekday = day !== 0 && day !== 6;
    if (weekdaysOnly && !isWeekday) return;
    if (comps[`malus-${idx}`]) points -= 10;
  });

  // Clamp & gentle top-off
  points = Math.max(0, points);
  
  // Only give the 100-point bonus if all requirements are actually completed
  // This means all morning tasks and all afternoon tasks must be completed if they exist
  const allRequiredTasksCompleted = 
    (!hasMorningActivities || allDone(morningTasks)) &&
    (!hasAfternoonActivities || allDone(afternoonTasks));
  
  if (points >= 90 && allRequiredTasksCompleted) { // Changed from 95 to 90
    points = 100;
  }
  return points;
}

export function getProgressColor(totalPoints) {
  if (totalPoints >= 100) return 'bg-green-400'; // light green for 100
  if (totalPoints > 95) return 'bg-green-600';   // dark green up to 95
  if (totalPoints > 70) return 'bg-yellow-500';
  if (totalPoints > 50) return 'bg-orange-500';
  return 'bg-red-500';
}