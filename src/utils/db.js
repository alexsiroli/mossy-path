import { db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const PENDING_KEY = 'mossypath:pendingWrites';

function loadPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function savePending(list) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list)); } catch {}
}
function enqueueWrite(entry) {
  const list = loadPending();
  list.push({ ...entry, id: Date.now() + ':' + Math.random().toString(36).slice(2) });
  savePending(list);
}
async function processPending() {
  const list = loadPending();
  if (!list.length) return;
  const remaining = [];
  for (const item of list) {
    try {
      const ref = doc(db, ...item.pathSegments);
      await setDoc(ref, item.data, item.options || { merge: true });
    } catch (e) {
      remaining.push(item);
    }
  }
  savePending(remaining);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void processPending(); });
  // Retry ogni 30s
  setInterval(() => { void processPending(); }, 30000);
  // Primo tentativo all'avvio
  void processPending();
}

/**
 * Salva le impostazioni dell'utente in Firebase
 * @param {string} userId - ID dell'utente
 * @param {Object} settings - Impostazioni da salvare
 * @param {boolean} isSetupComplete - Indica se il setup è completo
 */
export async function saveUserSettings(userId, settings, isSetupComplete = false) {
  if (!userId) return;
  
  // Se è il setup completo, assicuriamoci che tutti i dati necessari siano presenti
  const dataToSave = isSetupComplete ? {
    ...settings,
    setupCompleted: true,
    setupCompletedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString()
  } : {
    ...settings,
    lastSyncedAt: new Date().toISOString()
  };
  
  try {
    await setDoc(doc(db, 'users', userId, 'data', 'settings'), dataToSave, { merge: true });
  } catch (e) {
    console.warn('saveUserSettings error', e);
    enqueueWrite({ pathSegments: ['users', userId, 'data', 'settings'], data: dataToSave, options: { merge: true } });
  }
}

export async function saveWeeklyActivities(userId, activities) {
  if (!userId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'data', 'weeklyActivities'), { activities }, { merge: true });
  } catch (e) {
    console.warn('saveWeeklyActivities error', e);
    enqueueWrite({ pathSegments: ['users', userId, 'data', 'weeklyActivities'], data: { activities }, options: { merge: true } });
  }
}

export async function saveTodosRemote(userId, lists) {
  if (!userId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'data', 'todos'), { lists }, { merge: true });
  } catch (e) {
    console.warn('saveTodosRemote error', e);
    enqueueWrite({ pathSegments: ['users', userId, 'data', 'todos'], data: { lists }, options: { merge: true } });
  }
}

export async function saveCompletions(userId, dateKey, completions) {
  if (!userId || !dateKey) return;
  try {
    const ref = doc(db, 'users', userId, 'completions', dateKey);
    await setDoc(ref, { completions }, { merge: true });
  } catch (e) {
    console.warn('saveCompletions error', e);
    enqueueWrite({ pathSegments: ['users', userId, 'completions', dateKey], data: { completions }, options: { merge: true } });
  }
}

export async function loadUserSettings(userId) {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'data', 'settings'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('loadUserSettings error', e);
    return null;
  }
}

/**
 * Carica tutti i dati dell'utente da Firebase e li sincronizza con localStorage
 * @param {string} userId - ID dell'utente
 * @param {number} timeoutMs - Timeout in millisecondi (default: 10 secondi)
 * @returns {Promise<boolean>} - true se l'utente ha completato il setup, false altrimenti
 */
export async function syncUserData(userId, timeoutMs = 10000) {
  if (!userId) return false;
  
  // Controlla se siamo offline
  if (!navigator.onLine) {
    console.log('App offline, salto sincronizzazione');
    return false;
  }
  
  // Implementa un timeout per evitare blocchi infiniti
  const syncPromise = async () => {
    try {
      // Carica le impostazioni utente
      const settings = await loadUserSettings(userId);
      // Carica le attività settimanali
      const weeklyActivities = await loadWeeklyActivities(userId);
      // Carica le todo list
      const todoLists = await loadTodosRemote(userId);
      
      // Se l'utente ha già completato il setup, avrà impostazioni salvate
      const hasCompletedSetup = settings && 
        settings.baseActivities && 
        settings.sleep && 
        settings.malus;
      
      if (hasCompletedSetup) {
        // Importa i dati da Firebase nel localStorage
        const { load, save } = await import('./storage');
        const localData = load(userId) || {};
        
        // Merge dei dati remoti con quelli locali, dando priorità ai remoti
        save({
          ...localData,
          baseActivities: settings.baseActivities || localData.baseActivities || [],
          sleep: settings.sleep || localData.sleep || {},
          malus: settings.malus || localData.malus || [],
          dailyActivities: weeklyActivities || localData.dailyActivities || [],
          todos: todoLists || localData.todos || [],
        }, userId, false); // false per evitare loop di sincronizzazione
        
        return true;
      }
      
      return false;
    } catch (e) {
      console.warn('syncUserData error', e);
      throw e;
    }
  };
  
  // Implementa timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Sync timeout')), timeoutMs);
  });
  
  try {
    return await Promise.race([syncPromise(), timeoutPromise]);
  } catch (e) {
    console.warn('Sincronizzazione fallita o timeout:', e);
    return false;
  }
}

export async function loadWeeklyActivities(userId) {
  if (!userId) return [];
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'data', 'weeklyActivities'));
    return snap.exists() ? (snap.data().activities || []) : [];
  } catch (e) {
    console.warn('loadWeeklyActivities error', e);
    return [];
  }
}

export async function loadTodosRemote(userId) {
  if (!userId) return [];
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'data', 'todos'));
    return snap.exists() ? (snap.data().lists || []) : [];
  } catch (e) {
    console.warn('loadTodosRemote error', e);
    return [];
  }
}

