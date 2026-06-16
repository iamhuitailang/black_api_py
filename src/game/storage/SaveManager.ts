import type { GameState } from '../types';
import { STORAGE_KEY, GAME_CONFIG, SKINS } from '../config';

export interface SaveData {
  highScore: number;
  totalScore: number;
  selectedSkin: string;
  unlockedSkins: string[];
  starsCollected: number;
  lastPlayed: number;
}

export class SaveManager {
  private storageKey: string;

  constructor() {
    this.storageKey = STORAGE_KEY;
  }

  save(state: Partial<GameState>): void {
    try {
      const saveData: SaveData = {
        highScore: state.highScore || 0,
        totalScore: state.totalScore || 0,
        selectedSkin: state.selectedSkin || 'default',
        unlockedSkins: state.unlockedSkins || ['default'],
        starsCollected: state.starsCollected || 0,
        lastPlayed: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  load(): SaveData | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load game:', e);
    }
    return null;
  }

  getInitialState(): Partial<GameState> {
    const saved = this.load();
    if (saved) {
      return {
        highScore: saved.highScore,
        totalScore: saved.totalScore,
        selectedSkin: saved.selectedSkin,
        unlockedSkins: saved.unlockedSkins,
        starsCollected: saved.starsCollected,
      };
    }
    return {
      highScore: 0,
      totalScore: 0,
      selectedSkin: 'default',
      unlockedSkins: ['default'],
      starsCollected: 0,
    };
  }

  checkAndUpdateUnlocks(totalScore: number): string[] {
    const saved = this.load();
    const currentUnlocked = saved?.unlockedSkins || ['default'];
    const newlyUnlocked: string[] = [];

    for (const skin of SKINS) {
      if (totalScore >= skin.unlockScore && !currentUnlocked.includes(skin.id)) {
        newlyUnlocked.push(skin.id);
      }
    }

    if (newlyUnlocked.length > 0 && saved) {
      saved.unlockedSkins = [...currentUnlocked, ...newlyUnlocked];
      localStorage.setItem(this.storageKey, JSON.stringify(saved));
    }

    return newlyUnlocked;
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}
