import { SaveData } from '@/types/game';
import { SAVE_KEY } from '@/constants/gameConfig';

const DEFAULT_SAVE: SaveData = {
  highestWave: 0,
  bestScore: 0,
  totalShots: 0,
  totalHeadshots: 0,
  headshotAccuracy: 0,
  lastPlayedWave: 1,
  lastPlayedScore: 0,
  lastPlayedLives: 3,
  savedAt: Date.now(),
};

export function loadSaveData(): SaveData | null {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_SAVE,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to load save data:', e);
  }
  return null;
}

export function saveGameData(data: Partial<SaveData>): void {
  try {
    const existing = loadSaveData();
    const saveData: SaveData = {
      ...DEFAULT_SAVE,
      ...existing,
      lastPlayedWave: 1,
      lastPlayedScore: 0,
      lastPlayedLives: 3,
      savedAt: Date.now(),
      ...data,
    };

    if (data.totalShots !== undefined && data.totalHeadshots !== undefined) {
      const totalShots = (existing?.totalShots || 0) + data.totalShots;
      const totalHeadshots = (existing?.totalHeadshots || 0) + data.totalHeadshots;
      saveData.totalShots = totalShots;
      saveData.totalHeadshots = totalHeadshots;
      saveData.headshotAccuracy = totalShots > 0 ? totalHeadshots / totalShots : 0;
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.warn('Failed to save game data:', e);
  }
}

export function updateHighestWave(wave: number): void {
  try {
    const existing = loadSaveData();
    if (!existing || wave > existing.highestWave) {
      saveGameData({ highestWave: wave });
    }
  } catch (e) {
    console.warn('Failed to update highest wave:', e);
  }
}

export function updateBestScore(score: number): void {
  try {
    const existing = loadSaveData();
    if (!existing || score > existing.bestScore) {
      saveGameData({ bestScore: score });
    }
  } catch (e) {
    console.warn('Failed to update best score:', e);
  }
}

export function saveCurrentProgress(wave: number, score: number, lives: number): void {
  try {
    saveGameData({
      lastPlayedWave: wave,
      lastPlayedScore: score,
      lastPlayedLives: lives,
    });
  } catch (e) {
    console.warn('Failed to save current progress:', e);
  }
}

export function clearSaveData(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.warn('Failed to clear save data:', e);
  }
}

export function hasSaveData(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}
