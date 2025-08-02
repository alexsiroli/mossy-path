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

export function save(data, userId = null) {
  const key = getUserKey(userId);
  localStorage.setItem(key, JSON.stringify(data));
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