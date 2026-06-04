const STORAGE_KEY = 'city_builder_game_state';

export function saveGameState(state: unknown): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function loadGameState<T>(): T | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized) as T;
  } catch (e) {
    console.error('Failed to load game state:', e);
    return null;
  }
}

export function clearGameState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportGameState(state: unknown): string {
  return btoa(encodeURIComponent(JSON.stringify(state)));
}

export function importGameState(encoded: string): unknown | null {
  try {
    const decoded = decodeURIComponent(atob(encoded));
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Failed to import game state:', e);
    return null;
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
