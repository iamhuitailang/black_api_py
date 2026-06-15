import { SaveData, GameSaveState, Zombie } from '@/types/game';
import { SAVE_KEY, MAX_LIVES } from '@/constants/gameConfig';

const DEFAULT_SAVE: SaveData = {
  highestWave: 0,
  bestScore: 0,
  totalShots: 0,
  totalHeadshots: 0,
  headshotAccuracy: 0,
  lastPlayedWave: 1,
  lastPlayedScore: 0,
  lastPlayedLives: MAX_LIVES,
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

export function saveGameState(gameState: GameSaveState): void {
  try {
    const existing = loadSaveData();
    const saveData: SaveData = {
      ...DEFAULT_SAVE,
      ...existing,
      savedAt: Date.now(),
      lastPlayedWave: gameState.currentWave,
      lastPlayedScore: gameState.score,
      lastPlayedLives: gameState.lives,
      gameState,
    };
    const serialized = JSON.stringify(saveData);
    localStorage.setItem(SAVE_KEY, serialized);
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
}

export function loadGameState(): GameSaveState | null {
  try {
    const data = loadSaveData();
    if (data?.gameState) {
      return data.gameState;
    }
    return null;
  } catch (e) {
    console.warn('Failed to load game state:', e);
    return null;
  }
}

export function clearGameState(): void {
  try {
    const existing = loadSaveData();
    if (existing) {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        ...existing,
        gameState: undefined,
        lastPlayedWave: 1,
        lastPlayedScore: 0,
        lastPlayedLives: MAX_LIVES,
      }));
    }
  } catch (e) {
    console.warn('Failed to clear game state:', e);
  }
}

export function hasGameState(): boolean {
  try {
    const data = loadSaveData();
    return !!data?.gameState;
  } catch {
    return false;
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

export function buildZombieFromSave(saved: Zombie): Zombie {
  return {
    ...saved,
    hitFlash: 0,
    deathAnimation: saved.isDead ? 0 : 1,
  };
}
