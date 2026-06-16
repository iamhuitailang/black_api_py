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
  const save = loadSave();
  save.lastPlayed = Date.now();
  saveSave({ ...save, quickSave: state });
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
