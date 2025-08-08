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

export async function saveUserSettings(userId, settings) {
  if (!userId) return;
  try {
    await setDoc(doc(db, 'users', userId, 'data', 'settings'), settings, { merge: true });
  } catch (e) {
    console.warn('saveUserSettings error', e);
    enqueueWrite({ pathSegments: ['users', userId, 'data', 'settings'], data: settings, options: { merge: true } });
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

