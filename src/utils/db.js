import { db } from '../config/firebase';
import { doc, setDoc, getDoc, onSnapshot, collection } from 'firebase/firestore';

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

    enqueueWrite({ pathSegments: ['users', userId, 'data', 'settings'], data: dataToSave, options: { merge: true } });
  }
}

export async function saveWeeklyActivities(userId, activities) {
  if (!userId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'data', 'weeklyActivities'), { activities }, { merge: true });
  } catch (e) {

    enqueueWrite({ pathSegments: ['users', userId, 'data', 'weeklyActivities'], data: { activities }, options: { merge: true } });
  }
}

export async function saveTodosRemote(userId, lists) {
  if (!userId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'data', 'todos'), { lists }, { merge: true });
  } catch (e) {

    enqueueWrite({ pathSegments: ['users', userId, 'data', 'todos'], data: { lists }, options: { merge: true } });
  }
}

export async function saveCompletions(userId, dateKey, completions) {
  if (!userId || !dateKey) return;
  

  
  try {
    const ref = doc(db, 'users', userId, 'completions', dateKey);
    await setDoc(ref, { completions }, { merge: true });

  } catch (e) {

    enqueueWrite({ pathSegments: ['users', userId, 'completions', dateKey], data: { completions }, options: { merge: true } });
  }
}

export async function loadUserSettings(userId) {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'data', 'settings'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {

    return null;
  }
}

/**
 * Carica i dati personali dell'utente da Firebase
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object|null>} - Dati personali o null se non trovati
 */
export async function loadPersonalInfo(userId) {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'data', 'settings'));
    if (snap.exists()) {
      const data = snap.data();
      return data.personalInfo || null;
    }
    return null;
  } catch (e) {

    return null;
  }
}

/**
 * FASE 1: Scarica solo i dati essenziali per aprire l'app velocemente
 * @param {string} userId - ID dell'utente
 * @returns {Promise<boolean>} - true se l'utente ha completato il setup, false altrimenti
 */
export async function loadEssentialDataFromServer(userId) {
  if (!userId) return false;
  

  
  try {
    // Carica solo le impostazioni base (veloce)
    const settings = await loadUserSettings(userId);
    

    
    // Se l'utente ha dati sul server
    const hasCompletedSetup = settings && 
      settings.personalInfo &&
      settings.baseActivities && 
      settings.sleep && 
      settings.malus;
    
    if (hasCompletedSetup) {
      // Salva solo le impostazioni base per ora
      const { load } = await import('./storage');
      const localData = load(userId) || {};
      
      const essentialData = {
        ...localData, // Mantieni i dati locali esistenti
        personalInfo: settings.personalInfo,
        baseActivities: settings.baseActivities,
        sleep: settings.sleep,
        malus: settings.malus,
        dailyActivities: settings.dailyActivities || localData.dailyActivities || []
      };
      
      // Salva direttamente nel localStorage
      const key = `mossypath:data:${userId}`;
      localStorage.setItem(key, JSON.stringify(essentialData));
      

      return true;
    }
    

    return false;
  } catch (e) {

    return false;
  }
}

/**
 * FASE 2: Scarica tutti gli altri dati in background
 * @param {string} userId - ID dell'utente
 */
export async function loadRemainingDataFromServer(userId) {
  if (!userId) return;
  

  
  try {
    // Carica tutti gli altri dati (può essere lento)
    const [weeklyActivities, todoLists, allCompletions] = await Promise.all([
      loadWeeklyActivities(userId), 
      loadTodosRemote(userId),
      loadAllCompletions(userId)
    ]);
    

    
    // Aggiorna i dati locali con tutti i dati
    const { load } = await import('./storage');
    const localData = load(userId) || {};
    
    const completeData = {
      ...localData,
      dailyActivities: weeklyActivities || localData.dailyActivities || [],
      todos: todoLists || localData.todos || [],
      completions: {
        ...localData.completions,
        ...allCompletions
      }
    };
    
    // Salva direttamente nel localStorage
    const key = `gamelife:data:${userId}`;
    localStorage.setItem(key, JSON.stringify(completeData));
    

    
    // Trigger un refresh dei componenti che potrebbero aver bisogno dei nuovi dati
    window.dispatchEvent(new CustomEvent('dataRefresh'));
    
  } catch (e) {

  }
}

export async function loadWeeklyActivities(userId) {
  if (!userId) return [];
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'data', 'weeklyActivities'));
    return snap.exists() ? (snap.data().activities || []) : [];
  } catch (e) {

    return [];
  }
}

export async function loadTodosRemote(userId) {
  if (!userId) return [];
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'data', 'todos'));
    return snap.exists() ? (snap.data().lists || []) : [];
  } catch (e) {

    return [];
  }
}

/**
 * Carica tutte le completions dell'utente da Firebase
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object>} - Oggetto con tutte le completions organizzate per data
 */
export async function loadAllCompletions(userId) {
  if (!userId) return {};
  try {
    // Carica tutti i documenti della collezione completions
    const { getDocs } = await import('firebase/firestore');
    const completionsRef = collection(db, 'users', userId, 'completions');
    const snapshot = await getDocs(completionsRef);
    
    const allCompletions = {};
    snapshot.forEach(doc => {
      const dateKey = doc.id;
      const data = doc.data();
      if (data.completions) {
        allCompletions[dateKey] = data.completions;
      }
    });
    

    return allCompletions;
  } catch (e) {

    return {};
  }
}

// ===== Realtime subscriptions =====

let activeUnsubscribers = [];

function registerUnsub(unsub) {
  activeUnsubscribers.push(unsub);
}

export function unsubscribeUserSubscriptions() {
  try {
    activeUnsubscribers.forEach((u) => {
      try { u(); } catch {}
    });
  } finally {
    activeUnsubscribers = [];
  }
}

/**
 * Sottoscrive in realtime le impostazioni e le completions per un dateKey (oggi)
 * Aggiorna localStorage e chiama onReady alla prima risposta delle impostazioni
 */
export function subscribeEssential(userId, dateKey, onReady) {
  if (!userId) return () => {};

  let initialSettingsDelivered = false;
  let connectionTimeout;

  // Fallback: se dopo 3 secondi non abbiamo dati, procediamo offline  
  const fallbackTimer = setTimeout(() => {
    if (!initialSettingsDelivered) {

      onReady?.(true); // FORZA setup completato dopo timeout
      initialSettingsDelivered = true;
    }
  }, 3000);

  // Settings realtime con error handling
  const settingsRef = doc(db, 'users', userId, 'data', 'settings');
  const unsubSettings = onSnapshot(settingsRef, async (snap) => {

    
    const settings = snap.exists() ? snap.data() : null;
    const { load } = await import('./storage');
    const local = load(userId) || {};
    
    if (settings) {

      
      // Aggiorna cache direttamente dai dati Firebase
      const { updateCache } = await import('./storage');
      updateCache(userId, 'settings', {
        personalInfo: settings.personalInfo || {},
        baseActivities: settings.baseActivities || [],
        sleep: settings.sleep || {},
        malus: settings.malus || [],
        dailyActivities: settings.dailyActivities || []
      });
      

      
      if (!initialSettingsDelivered) {
        initialSettingsDelivered = true;
        clearTimeout(fallbackTimer);
        // Fix per setup incompleti: se abbiamo baseActivities ma non dailyActivities, 
        // consideriamo il setup come incompleto (sarà richiesto di nuovo)
        const hasCompletedSetup = !!(settings.personalInfo && settings.baseActivities && settings.sleep && settings.malus && settings.dailyActivities && settings.dailyActivities.length > 0);
        
        // FALLBACK URGENTE: se Firebase non ha dailyActivities ma ha altri dati, considera setup completo
        const hasBasicSetup = !!(settings.personalInfo && settings.baseActivities && settings.sleep && settings.malus);
        
        if (hasBasicSetup && (!settings.dailyActivities || settings.dailyActivities.length === 0)) {

          onReady?.(true); // Forza setup completato
          return;
        }
        
        if (!hasCompletedSetup) {

        }
        

        onReady?.(hasCompletedSetup);
      }
      // Notifica UI
      window.dispatchEvent(new CustomEvent('dataRefresh'));
    } else {

      if (!initialSettingsDelivered) {
        initialSettingsDelivered = true;
        clearTimeout(fallbackTimer);
        onReady?.(false);
      }
    }
  }, (error) => {

    if (!initialSettingsDelivered) {
      initialSettingsDelivered = true;
      clearTimeout(fallbackTimer);

      onReady?.(true); // FORZA setup completato anche su errore
    }
  });
  registerUnsub(unsubSettings);

  // Completions realtime (solo oggi)
  if (dateKey) {
    const todayRef = doc(db, 'users', userId, 'completions', dateKey);
    const unsubToday = onSnapshot(todayRef, async (snap) => {

      
      const data = snap.exists() ? snap.data() : null;
      const { load } = await import('./storage');
      const local = load(userId) || {};
      const newCompletions = data?.completions || {};
      

      
      // Aggiorna cache completions
      const { updateCache } = await import('./storage');
      updateCache(userId, 'completions', { [dateKey]: newCompletions });
      

      
      window.dispatchEvent(new CustomEvent('dataRefresh'));
    }, (error) => {

      // Non è critico - le completions possono fallire silently
    });
    registerUnsub(unsubToday);
  }

  return () => {
    clearTimeout(fallbackTimer);
    unsubscribeUserSubscriptions();
  };
}

