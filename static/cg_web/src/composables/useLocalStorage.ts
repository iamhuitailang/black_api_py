import { ref, watch } from 'vue';
import type { GameSaveData, GameState } from '@/types/game';
import { SAVE_KEY, GAME_VERSION, CHARACTERS } from '@/utils/constants';
import { deepClone } from '@/utils/helpers';

const defaultGameState: GameState = {
  unlockedLevels: [1],
  levelStars: {},
  levelScores: {},
  totalCoins: 0,
  unlockedCharacters: ['hero'],
  currentCharacter: 'hero',
  inventory: []
};

const defaultSettings = {
  soundEnabled: true,
  musicVolume: 0.7,
  sfxVolume: 0.5
};

function getDefaultSaveData(): GameSaveData {
  return {
    version: GAME_VERSION,
    timestamp: Date.now(),
    gameState: deepClone(defaultGameState),
    settings: { ...defaultSettings }
  };
}

function validateSaveData(data: unknown): data is GameSaveData {
  if (typeof data !== 'object' || data === null) return false;
  
  const save = data as Record<string, unknown>;
  if (typeof save.version !== 'string') return false;
  if (typeof save.timestamp !== 'number') return false;
  
  const gameState = save.gameState as Record<string, unknown>;
  if (!gameState) return false;
  if (!Array.isArray(gameState.unlockedLevels)) return false;
  if (typeof gameState.totalCoins !== 'number') return false;
  if (!Array.isArray(gameState.unlockedCharacters)) return false;
  if (typeof gameState.currentCharacter !== 'string') return false;
  
  return true;
}

function migrateSaveData(data: GameSaveData): GameSaveData {
  if (data.version === GAME_VERSION) return data;
  
  const migrated = getDefaultSaveData();
  
  if (data.gameState) {
    migrated.gameState = {
      ...migrated.gameState,
      ...data.gameState
    };
  }
  
  if (data.settings) {
    migrated.settings = {
      ...migrated.settings,
      ...data.settings
    };
  }
  
  migrated.version = GAME_VERSION;
  migrated.timestamp = Date.now();
  
  return migrated;
}

const saveData = ref<GameSaveData>(getDefaultSaveData());
const isLoaded = ref(false);

function loadFromStorage(): boolean {
  try {
    const stored = localStorage.getItem(SAVE_KEY);
    
    if (!stored) {
      saveData.value = getDefaultSaveData();
      isLoaded.value = true;
      return false;
    }
    
    const parsed = JSON.parse(stored);
    
    if (!validateSaveData(parsed)) {
      saveData.value = getDefaultSaveData();
      isLoaded.value = true;
      return false;
    }
    
    saveData.value = migrateSaveData(parsed);
    isLoaded.value = true;
    return true;
  } catch (error) {
    saveData.value = getDefaultSaveData();
    isLoaded.value = true;
    return false;
  }
}

function saveToStorage(): boolean {
  try {
    saveData.value.timestamp = Date.now();
    saveData.value.version = GAME_VERSION;
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData.value));
    return true;
  } catch (error) {
    return false;
  }
}

loadFromStorage();

export function useLocalStorage() {
  function saveGame(): boolean {
    return saveToStorage();
  }

  function resetGame(): void {
    saveData.value = getDefaultSaveData();
    saveToStorage();
  }

  function updateGameState(updates: Partial<GameState>): void {
    saveData.value.gameState = {
      ...saveData.value.gameState,
      ...updates
    };
    saveToStorage();
  }

  function addCoins(amount: number): void {
    saveData.value.gameState.totalCoins += amount;
    saveToStorage();
  }

  function spendCoins(amount: number): boolean {
    if (saveData.value.gameState.totalCoins >= amount) {
      saveData.value.gameState.totalCoins -= amount;
      saveToStorage();
      return true;
    }
    return false;
  }

  function unlockLevel(levelId: number): void {
    if (!saveData.value.gameState.unlockedLevels.includes(levelId)) {
      saveData.value.gameState.unlockedLevels.push(levelId);
      saveToStorage();
    }
  }

  function unlockCharacter(charId: string): void {
    if (!saveData.value.gameState.unlockedCharacters.includes(charId)) {
      saveData.value.gameState.unlockedCharacters.push(charId);
      saveToStorage();
    }
  }

  function setCurrentCharacter(charId: string): boolean {
    if (saveData.value.gameState.unlockedCharacters.includes(charId)) {
      saveData.value.gameState.currentCharacter = charId;
      saveToStorage();
      return true;
    }
    return false;
  }

  function updateLevelProgress(levelId: number, score: number, stars: number): void {
    const currentStars = saveData.value.gameState.levelStars[levelId] || 0;
    const currentScore = saveData.value.gameState.levelScores[levelId] || 0;
    
    if (stars > currentStars) {
      saveData.value.gameState.levelStars[levelId] = stars;
    }
    if (score > currentScore) {
      saveData.value.gameState.levelScores[levelId] = score;
    }
    
    saveToStorage();
  }

  function addToInventory(itemType: string): void {
    saveData.value.gameState.inventory.push(itemType);
    saveToStorage();
  }

  function removeFromInventory(itemType: string): boolean {
    const index = saveData.value.gameState.inventory.indexOf(itemType);
    if (index > -1) {
      saveData.value.gameState.inventory.splice(index, 1);
      saveToStorage();
      return true;
    }
    return false;
  }

  function isLevelUnlocked(levelId: number): boolean {
    return saveData.value.gameState.unlockedLevels.includes(levelId);
  }

  function isCharacterUnlocked(charId: string): boolean {
    return saveData.value.gameState.unlockedCharacters.includes(charId);
  }

  function getCharacterStats() {
    const charId = saveData.value.gameState.currentCharacter;
    return CHARACTERS[charId] || CHARACTERS.hero;
  }

  return {
    saveData,
    isLoaded,
    loadGame: loadFromStorage,
    saveGame,
    resetGame,
    updateGameState,
    addCoins,
    spendCoins,
    unlockLevel,
    unlockCharacter,
    setCurrentCharacter,
    updateLevelProgress,
    addToInventory,
    removeFromInventory,
    isLevelUnlocked,
    isCharacterUnlocked,
    getCharacterStats
  };
}
