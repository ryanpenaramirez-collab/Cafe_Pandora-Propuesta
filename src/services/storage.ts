export function getItem<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null || stored === 'null' || stored === 'undefined') return fallback;
    return JSON.parse(stored) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function setItem<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function removeItem(key: string): void {
  localStorage.removeItem(key);
}
