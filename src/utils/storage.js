const KEY = 'gamelife:data';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function isConfigured() {
  const d = load();
  return !!d.baseActivities && !!d.sleep && !!d.dailyActivities && !!d.malus;
}

export function clear() {
  localStorage.removeItem(KEY);
} 