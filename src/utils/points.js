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
      // console.log(`DEBUG - Adding ${part} task: ${key} (${reason})`);
      tasks.push(key);
    };
    
    // Process all daily activities
    // console.log(`DEBUG - Scanning all dailyActivities for ${part} tasks:`);
    (data.dailyActivities || []).forEach((act, idx) => {
      if (!act) {
        // console.log(`  daily-${idx}: SKIPPED (null or undefined activity)`);
        return;
      }
      
      const actPartOfDay = act.partOfDay || 'morning';
      const actWeekday = typeof act.weekday === 'string' ? act.weekday : (Array.isArray(act.days) ? act.days.join(',') : 'unknown');
      // console.log(`  daily-${idx}: "${act.name}" (${actWeekday}, ${actPartOfDay}, repeat:${act.repeat || 1}, offset:${act.offset || 0})`);
      
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
          // console.log(`    ❌ Weekday doesn't match: '${act.weekday}' vs today's '${weekdayShort}/${weekdayFull}/${weekdayEnShort}'`);
          return;
        }
        // else {
        //   console.log(`    ✅ Weekday matches: '${act.weekday}' matches today's '${weekdayShort}/${weekdayFull}/${weekdayEnShort}'`);
        // }
      } else if (Array.isArray(act.days)) {
        // legacy format: EN short names
        matchesWeekday = act.days.includes(weekdayEnShort);
        if (!matchesWeekday) {
          // console.log(`    ❌ Weekday doesn't match: [${act.days.join(',')}] doesn't include today's '${weekdayEnShort}'`);
          return;
        }
        // else {
        //   console.log(`    ✅ Weekday matches: [${act.days.join(',')}] includes today's '${weekdayEnShort}'`);
        // }
      } else {
        // console.log(`    ❌ No weekday info found in activity`);
        return;
      }
      
      // If createdAt is missing, treat it as if created on the viewDate for repeat/offset calculation
      if (!act.createdAt) {
        // console.log(`    ℹ️ No createdAt, using viewDate as default`);
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
      
      // console.log(`    📅 Created: ${act.createdAt || 'N/A (using viewDate)'}, Weeks diff (start-of-day): ${weeksDiff}`);
      
      const repeat = Math.max(1, Number(act.repeat || 1));
      const offset = Math.max(0, Number(act.offset || 0));
      
      if (((weeksDiff - offset) % repeat) !== 0) {
        // console.log(`    ❌ Doesn't match repeat pattern: (${weeksDiff} - ${offset}) % ${repeat} = ${(weeksDiff - offset) % repeat}`);
        return;
      }
      // else {
      //   console.log(`    ✅ Matches repeat pattern: (${weeksDiff} - ${offset}) % ${repeat} = 0`);
      // }
      
      const partNorm = normalizePart(actPartOfDay);
      if (partNorm === part) {
        addTask(`daily-${idx}`, `matching weekday + repeat schedule (${act.name})`);
      }
      // else {
      //   console.log(`    ❌ Part of day doesn't match: '${actPartOfDay}' (${partNorm}) vs required '${part}'`);
      // }
    });
    // specific for this day
    // console.log(`DEBUG - Checking day-specific activities for ${dateKey}:`);
    const specificActivities = data.dailySpecific?.[dateKey] || [];
    // if (specificActivities.length === 0) {
    //   console.log(`  No specific activities for ${dateKey}`);
    // }
    
    specificActivities.forEach((act, idx) => {
      if (!act) {
        // console.log(`  spec-${idx}: SKIPPED (null or undefined activity)`);
        return;
      }
      
      const actPartOfDay = act.partOfDay || 'morning';
      const partNorm = normalizePart(actPartOfDay);
      
      // console.log(`  spec-${idx}: "${act.name}" (${actPartOfDay})`);
      
      if (partNorm === part) {
        addTask(`spec-${idx}`, "day-specific activity");
      }
      // else {
      //   console.log(`    ❌ Part of day doesn't match: '${actPartOfDay}' vs required '${part}'`);
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
    // console.log(`DEBUG - allDone check for [${keys.join(', ')}]: ${result}`);
    return result;
  };
  
  // Check if any tasks are present but not completed
  const hasIncompleteTasks = (keys) => {
    if (keys.length === 0) return false;
    const result = !keys.every((k) => !!comps[k]);
    // console.log(`DEBUG - hasIncompleteTasks check for [${keys.join(', ')}]: ${result}`);
    return result;
  };

  // Morning/Afternoon: 20 only if there is at least one task and all are done
  console.log('DEBUG - Morning tasks:', morningTasks);
  console.log('DEBUG - Morning tasks completions:', morningTasks.map(k => `${k}:${!!comps[k]}`));
  console.log('DEBUG - Morning allDone:', allDone(morningTasks));
  
  console.log('DEBUG - Afternoon tasks:', afternoonTasks);
  console.log('DEBUG - Afternoon tasks completions:', afternoonTasks.map(k => `${k}:${!!comps[k]}`));
  console.log('DEBUG - Afternoon allDone:', allDone(afternoonTasks));
  
  if (allDone(morningTasks)) {
    console.log('DEBUG - Adding 20 points for morning');
    points += 20;
  }
  if (allDone(afternoonTasks)) {
    console.log('DEBUG - Adding 20 points for afternoon');
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
  
  console.log('DEBUG - Has morning activities:', hasMorningActivities);
  console.log('DEBUG - Has afternoon activities:', hasAfternoonActivities);
  console.log('DEBUG - Base done:', baseDone, 'Sleep done:', sleepDone);
  
  // Only apply bonus if there are genuinely no tasks for that part
  if (!hasMorningActivities) {
    const morningBonus = applyNoPartBonus(true);
    console.log('DEBUG - Applying morning bonus (no activities):', morningBonus);
    points += morningBonus;
  }
  
  if (!hasAfternoonActivities) {
    const afternoonBonus = applyNoPartBonus(true);
    console.log('DEBUG - Applying afternoon bonus (no activities):', afternoonBonus);
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

  console.log('DEBUG - Points before clamp:', points);
  
  // Clamp & gentle top-off
  points = Math.max(0, points);
  
  // Solo per debug: controlliamo quali attività sono nel 'completions'
  console.log('DEBUG - Checking completions keys:');
  Object.keys(comps).forEach(key => {
    if (key.startsWith('daily-')) {
      console.log(`  ${key}: ${comps[key]}`);
    }
  });
  
  // Simplified logic: we now rely solely on the morningTasks and afternoonTasks arrays
  // populated by collectPartTasks, which has been fixed to properly handle createdAt
  console.log('DEBUG - Morning tasks from collectPartTasks:', morningTasks);
  console.log('DEBUG - Afternoon tasks from collectPartTasks:', afternoonTasks);
  
  // Only give the 100-point bonus if all requirements are actually completed
  // This means all morning tasks and all afternoon tasks must be completed if they exist
  const allRequiredTasksCompleted = 
    (!hasMorningActivities || allDone(morningTasks)) &&
    (!hasAfternoonActivities || allDone(afternoonTasks));
    
  console.log('DEBUG - All required tasks completed:', allRequiredTasksCompleted);
  console.log('DEBUG - Points >= 90:', points >= 90);
  
  if (points >= 90 && allRequiredTasksCompleted) { // Changed from 95 to 90
    console.log('DEBUG - Applying 100 point bonus');
    points = 100;
  }
  
  console.log('DEBUG - Final points:', points);
  return points;
}

export function getProgressColor(totalPoints) {
  if (totalPoints >= 100) return 'bg-green-400'; // light green for 100
  if (totalPoints > 95) return 'bg-green-600';   // dark green up to 95
  if (totalPoints > 70) return 'bg-yellow-500';
  if (totalPoints > 50) return 'bg-orange-500';
  return 'bg-red-500';
}