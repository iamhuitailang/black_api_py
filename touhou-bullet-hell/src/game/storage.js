import { STORAGE_KEY } from './constants.js';

const defaultSave = {
  highScore: 0,
  unlockedCharacters: ['reimu', 'marisa'],
  progress: {
    highestStageCleared: 0,
    bossDefeated: false
  },
  lastPlayed: null,
  settings: {
    soundEnabled: true
  }
};

export function loadSave() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { ...defaultSave };
    }
    const parsed = JSON.parse(data);
    return { ...defaultSave, ...parsed };
  } catch (e) {
    console.warn('Failed to load save:', e);
    return { ...defaultSave };
  }
}

export function saveSave(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save:', e);
  }
}

export function updateHighScore(score) {
  const save = loadSave();
  if (score > save.highScore) {
    save.highScore = score;
    saveSave(save);
    return true;
  }
  return false;
}

export function unlockCharacter(charId) {
  const save = loadSave();
  if (!save.unlockedCharacters.includes(charId)) {
    save.unlockedCharacters.push(charId);
    saveSave(save);
    return true;
  }
  return false;
}

export function updateStageProgress(stageId, bossDefeated = false) {
  const save = loadSave();
  if (stageId > save.progress.highestStageCleared) {
    save.progress.highestStageCleared = stageId;
  }
  if (bossDefeated) {
    save.progress.bossDefeated = true;
    if (!save.unlockedCharacters.includes('sanae')) {
      save.unlockedCharacters.push('sanae');
    }
  }
  save.lastPlayed = Date.now();
  saveSave(save);
}

export function saveGameState(state) {
  try {
    const save = loadSave();
    save.lastPlayed = Date.now();
    
    let trimmed = false;
    const maxEnemyBullets = 400;
    const maxPlayerBullets = 100;
    const maxEnemies = 20;
    const maxPowerUps = 10;
    
    if (state.enemyBullets && state.enemyBullets.length > maxEnemyBullets) {
      state.enemyBullets = state.enemyBullets.slice(-maxEnemyBullets);
      trimmed = true;
    }
    if (state.playerBullets && state.playerBullets.length > maxPlayerBullets) {
      state.playerBullets = state.playerBullets.slice(-maxPlayerBullets);
      trimmed = true;
    }
    if (state.enemies && state.enemies.length > maxEnemies) {
      state.enemies = state.enemies.slice(0, maxEnemies);
      trimmed = true;
    }
    if (state.powerUps && state.powerUps.length > maxPowerUps) {
      state.powerUps = state.powerUps.slice(0, maxPowerUps);
      trimmed = true;
    }
    
    save.quickSave = state;
    const jsonStr = JSON.stringify(save);
    
    if (jsonStr.length > 4500000) {
      console.warn('Save data still too large, aggressive trim');
      if (state.enemyBullets && state.enemyBullets.length > 100) {
        state.enemyBullets = state.enemyBullets.slice(-100);
        save.quickSave = state;
        saveSave(save);
        return;
      }
    }
    
    saveSave(save);
    if (trimmed) {
      console.debug('Save data trimmed to fit localStorage');
    }
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
}

export function loadGameState() {
  const save = loadSave();
  return save.quickSave || null;
}

export function clearQuickSave() {
  const save = loadSave();
  delete save.quickSave;
  saveSave(save);
}
