const BASE_KEY = 'gamelife:data';

// Get user-specific key
function getUserKey(userId) {
  return userId ? `gamelife:data:${userId}` : BASE_KEY;
}

export function load(userId = null) {
  try {
    const key = getUserKey(userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Salva i dati nel localStorage e opzionalmente li sincronizza con Firebase
 * @param {Object} data - Dati da salvare
 * @param {string} userId - ID dell'utente
 * @param {boolean} syncWithFirebase - Se sincronizzare i dati con Firebase
 */
export function save(data, userId = null, syncWithFirebase = true) {
  const key = getUserKey(userId);
  localStorage.setItem(key, JSON.stringify(data));
  
  // Sincronizza con Firebase se richiesto e se l'utente è autenticato
  if (syncWithFirebase && userId) {
    // Importa in modo dinamico per evitare dipendenze circolari
    import('./db').then(({ saveUserSettings, saveWeeklyActivities }) => {
      // Salva le impostazioni base
      saveUserSettings(userId, {
        baseActivities: data.baseActivities,
        sleep: data.sleep,
        malus: data.malus
      });
      
      // Salva le attività settimanali
      if (data.dailyActivities) {
        saveWeeklyActivities(userId, data.dailyActivities);
      }
    }).catch(err => {
      console.warn('Errore durante la sincronizzazione con Firebase:', err);
    });
  }
}

export function isConfigured(userId = null) {
  const d = load(userId);
  return !!d.baseActivities && !!d.sleep && !!d.dailyActivities && !!d.malus;
}

export function isNewUser(userId = null) {
  const d = load(userId);
  return !d.hasOwnProperty('baseActivities') && !d.hasOwnProperty('sleep') && !d.hasOwnProperty('dailyActivities') && !d.hasOwnProperty('malus');
}

export function clear(userId = null) {
  const key = getUserKey(userId);
  localStorage.removeItem(key);
} 