// ===== STORAGE COMPLETAMENTE FIREBASE - NO LOCALSTORAGE =====

// In-memory cache per prestazioni (si svuota al reload)
let userDataCache = {};
let completionsCache = {};

export function load(userId = null) {
  if (!userId) return {};
  
  // Restituisce i dati dalla cache in-memory
  const data = userDataCache[userId] || {};
  

  
  return {
    ...data,
    completions: completionsCache[userId] || {}
  };
}

/**
 * Salva SOLO su Firebase - no localStorage
 * @param {Object} data - Dati da salvare
 * @param {string} userId - ID dell'utente
 */
export async function save(data, userId = null) {
  if (!userId) return;
  

  
  // Aggiorna cache locale per UI reattiva
  userDataCache[userId] = {
    baseActivities: data.baseActivities,
    sleep: data.sleep,
    malus: data.malus,
    dailyActivities: data.dailyActivities
  };
  
  if (data.completions) {
    completionsCache[userId] = data.completions;
  }
  
  try {
    const { saveUserSettings, saveWeeklyActivities, saveCompletions } = await import('./db');
    
    // Salva settings
    const settingsToSave = {
      baseActivities: data.baseActivities,
      sleep: data.sleep,
      malus: data.malus,
      dailyActivities: data.dailyActivities
    };
    

    
    await saveUserSettings(userId, settingsToSave, !!data.baseActivities);
    
    // Salva activities
    if (data.dailyActivities) {
      await saveWeeklyActivities(userId, data.dailyActivities);
    }
    
    // Salva completions
    if (data.completions) {
      for (const [dateKey, completions] of Object.entries(data.completions)) {
        if (completions && Object.keys(completions).length > 0) {
          await saveCompletions(userId, dateKey, completions);
        }
      }
    }
    

  } catch (e) {

  }
}

// Aggiorna la cache quando arrivano dati da Firebase
export function updateCache(userId, type, data) {
  if (!userId) return;
  
  if (type === 'settings') {
    userDataCache[userId] = { ...userDataCache[userId], ...data };
  } else if (type === 'completions') {
    if (!completionsCache[userId]) completionsCache[userId] = {};
    Object.assign(completionsCache[userId], data);
  }
}

export function isConfigured(userId = null) {
  if (!userId) return false;
  const d = userDataCache[userId] || {};
  return !!d.baseActivities && !!d.sleep && !!d.dailyActivities && !!d.malus && 
         d.baseActivities.length > 0 && d.dailyActivities.length > 0 && d.malus.length > 0;
}

export function isNewUser(userId = null) {
  if (!userId) return true;
  const d = userDataCache[userId] || {};
  return !d.baseActivities && !d.sleep && !d.dailyActivities && !d.malus;
}

export function clear(userId = null) {
  if (!userId) return;
  delete userDataCache[userId];
  delete completionsCache[userId];

} 