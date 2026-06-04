import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { GameState, GameStatus, LevelData, Player, Enemy, Boss, Item, Platform, Obstacle, Projectile, KeyboardState } from '@/types/game';
import { SAVE_KEY, GAME_VERSION, CHARACTERS, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/utils/constants';
import { deepClone } from '@/utils/helpers';

export const SESSION_KEY = 'pixel_game_session';

interface GameSession {
  levelId: number;
  characterId: string;
  playerState: {
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    coins: number;
    score: number;
    hasShield: boolean;
    speedBoost: boolean;
    powerBoost: boolean;
    boostTimer: number;
    invincible: boolean;
    invincibleTimer: number;
  } | null;
  cameraX: number;
  cameraY: number;
  gameTime: number;
  timestamp: number;
}

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

function getDefaultSaveData() {
  return {
    version: GAME_VERSION,
    timestamp: Date.now(),
    gameState: deepClone(defaultGameState),
    settings: { ...defaultSettings }
  };
}

function validateSaveData(data: unknown): boolean {
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

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(SAVE_KEY);
    if (!stored) return getDefaultSaveData();
    const parsed = JSON.parse(stored);
    if (!validateSaveData(parsed)) return getDefaultSaveData();
    return parsed;
  } catch {
    return getDefaultSaveData();
  }
}

function saveToStorage(data: any) {
  try {
    data.timestamp = Date.now();
    data.version = GAME_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

const savedData = loadFromStorage();

export const useGameStore = defineStore('game', () => {
  const saveData = ref(savedData);

  const gameStatus = ref<GameStatus>('menu');
  const currentLevelId = ref<number>(1);
  const currentLevel = ref<LevelData | null>(null);
  const cameraX = ref(0);
  const cameraY = ref(0);
  const gameTime = ref(0);
  const lastSaveTime = ref(0);
  
  const player = ref<Player | null>(null);
  const enemies = ref<Enemy[]>([]);
  const boss = ref<Boss | null>(null);
  const items = ref<Item[]>([]);
  const platforms = ref<Platform[]>([]);
  const obstacles = ref<Obstacle[]>([]);
  const projectiles = ref<Projectile[]>([]);
  const particles = ref<any[]>([]);
  
  const keys = ref<KeyboardState>({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    attack: false,
    pause: false
  });

  const gameState = saveData.value.gameState;
  const totalCoins = ref(saveData.value.gameState.totalCoins);
  const unlockedLevels = ref([...saveData.value.gameState.unlockedLevels]);
  const unlockedCharacters = ref([...saveData.value.gameState.unlockedCharacters]);
  const currentCharacter = ref(saveData.value.gameState.currentCharacter);
  const inventory = ref([...saveData.value.gameState.inventory]);
  const levelStars = ref({ ...saveData.value.gameState.levelStars });
  const levelScores = ref({ ...saveData.value.gameState.levelScores });

  function persist() {
    saveData.value.gameState = {
      unlockedLevels: unlockedLevels.value,
      levelStars: levelStars.value,
      levelScores: levelScores.value,
      totalCoins: totalCoins.value,
      unlockedCharacters: unlockedCharacters.value,
      currentCharacter: currentCharacter.value,
      inventory: inventory.value
    };
    saveToStorage(saveData.value);
    lastSaveTime.value = Date.now();
  }

  function setGameStatus(status: GameStatus) {
    gameStatus.value = status;
  }

  function setCurrentLevelId(levelId: number) {
    currentLevelId.value = levelId;
  }

  function setCurrentLevel(level: LevelData | null) {
    currentLevel.value = level;
  }

  function setPlayer(p: Player | null) {
    player.value = p;
  }

  function setEnemies(e: Enemy[]) {
    enemies.value = e;
  }

  function setBoss(b: Boss | null) {
    boss.value = b;
  }

  function setItems(i: Item[]) {
    items.value = i;
  }

  function setPlatforms(p: Platform[]) {
    platforms.value = p;
  }

  function setObstacles(o: Obstacle[]) {
    obstacles.value = o;
  }

  function setProjectiles(p: Projectile[]) {
    projectiles.value = p;
  }

  function addProjectile(p: Projectile) {
    projectiles.value.push(p);
  }

  function removeProjectile(id: string) {
    const index = projectiles.value.findIndex(p => p.id === id);
    if (index > -1) projectiles.value.splice(index, 1);
  }

  function addParticle(particle: any) {
    particles.value.push(particle);
  }

  function removeParticle(index: number) {
    if (index >= 0 && index < particles.value.length) {
      particles.value.splice(index, 1);
    }
  }

  function clearParticles() {
    particles.value = [];
  }

  function setCamera(x: number, y: number) {
    cameraX.value = x;
    cameraY.value = y;
  }

  function updateGameTime(delta: number) {
    gameTime.value += delta;
  }

  function resetGameTime() {
    gameTime.value = 0;
  }

  function updateKeys(newKeys: Partial<KeyboardState>) {
    keys.value = { ...keys.value, ...newKeys };
  }

  function resetKeys() {
    keys.value = { left: false, right: false, up: false, down: false, jump: false, attack: false, pause: false };
  }

  function resetLevelEntities() {
    player.value = null;
    enemies.value = [];
    boss.value = null;
    items.value = [];
    platforms.value = [];
    obstacles.value = [];
    projectiles.value = [];
    particles.value = [];
    cameraX.value = 0;
    cameraY.value = 0;
    gameTime.value = 0;
  }

  function isLevelUnlocked(levelId: number): boolean {
    return unlockedLevels.value.includes(levelId);
  }

  function unlockLevel(levelId: number) {
    if (!unlockedLevels.value.includes(levelId)) {
      unlockedLevels.value.push(levelId);
      persist();
    }
  }

  function unlockCharacter(charId: string) {
    if (!unlockedCharacters.value.includes(charId)) {
      unlockedCharacters.value.push(charId);
      persist();
    }
  }

  function setCurrentCharacter(charId: string): boolean {
    if (unlockedCharacters.value.includes(charId)) {
      currentCharacter.value = charId;
      persist();
      return true;
    }
    return false;
  }

  function addCoins(amount: number) {
    totalCoins.value += amount;
    if (player.value) player.value.coins += amount;
    persist();
  }

  function spendCoins(amount: number): boolean {
    if (totalCoins.value >= amount) {
      totalCoins.value -= amount;
      persist();
      return true;
    }
    return false;
  }

  function updateLevelProgress(levelId: number, score: number, stars: number) {
    const currentStars = levelStars.value[levelId] || 0;
    const currentScore = levelScores.value[levelId] || 0;
    
    if (stars > currentStars) levelStars.value[levelId] = stars;
    if (score > currentScore) levelScores.value[levelId] = score;
    
    persist();
  }

  function addToInventory(itemType: string) {
    inventory.value.push(itemType);
    persist();
  }

  function removeFromInventory(itemType: string): boolean {
    const index = inventory.value.indexOf(itemType);
    if (index > -1) {
      inventory.value.splice(index, 1);
      persist();
      return true;
    }
    return false;
  }

  function saveProgress() {
    persist();
  }

  function resetAllProgress() {
    const defaultData = getDefaultSaveData();
    saveData.value = defaultData;
    totalCoins.value = defaultData.gameState.totalCoins;
    unlockedLevels.value = [...defaultData.gameState.unlockedLevels];
    unlockedCharacters.value = [...defaultData.gameState.unlockedCharacters];
    currentCharacter.value = defaultData.gameState.currentCharacter;
    inventory.value = [...defaultData.gameState.inventory];
    levelStars.value = { ...defaultData.gameState.levelStars };
    levelScores.value = { ...defaultData.gameState.levelScores };
    persist();
  }

  function getLevelStars(levelId: number): number {
    return levelStars.value[levelId] || 0;
  }

  function getLevelScore(levelId: number): number {
    return levelScores.value[levelId] || 0;
  }

  function isCharacterUnlocked(charId: string): boolean {
    return unlockedCharacters.value.includes(charId);
  }

  function getCharacterStats() {
    return CHARACTERS[currentCharacter.value] || CHARACTERS.hero;
  }

  function saveGameSession(playerState: GameSession['playerState'], camX: number, camY: number, time: number) {
    const session: GameSession = {
      levelId: currentLevelId.value,
      characterId: currentCharacter.value,
      playerState,
      cameraX: camX,
      cameraY: camY,
      gameTime: time,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      console.log('[Store] 游戏会话已保存, levelId:', session.levelId, 'health:', playerState?.health, 'coins:', playerState?.coins);
    } catch (e) {
      console.error('[Store] 保存会话失败:', e);
    }
  }

  function loadGameSession(): GameSession | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;
      const session = JSON.parse(stored) as GameSession;
      if (!session || typeof session.levelId !== 'number' || !session.playerState) return null;
      console.log('[Store] 加载游戏会话, levelId:', session.levelId, 'health:', session.playerState.health);
      return session;
    } catch (e) {
      console.error('[Store] 加载会话失败:', e);
      return null;
    }
  }

  function clearGameSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      console.log('[Store] 游戏会话已清除');
    } catch (e) {
      console.error('[Store] 清除会话失败:', e);
    }
  }

  function hasGameSession(): boolean {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return false;
      const session = JSON.parse(stored);
      return session && typeof session.levelId === 'number' && session.playerState != null;
    } catch {
      return false;
    }
  }

  return {
    gameStatus,
    currentLevelId,
    currentLevel,
    cameraX,
    cameraY,
    gameTime,
    lastSaveTime,
    player,
    enemies,
    boss,
    items,
    platforms,
    obstacles,
    projectiles,
    particles,
    keys,
    totalCoins,
    unlockedLevels,
    unlockedCharacters,
    currentCharacter,
    inventory,
    levelStars,
    levelScores,
    setGameStatus,
    setCurrentLevelId,
    setCurrentLevel,
    setPlayer,
    setEnemies,
    setBoss,
    setItems,
    setPlatforms,
    setObstacles,
    setProjectiles,
    addProjectile,
    removeProjectile,
    addParticle,
    removeParticle,
    clearParticles,
    setCamera,
    updateGameTime,
    resetGameTime,
    updateKeys,
    resetKeys,
    resetLevelEntities,
    isLevelUnlocked,
    unlockLevel,
    unlockCharacter,
    setCurrentCharacter,
    addCoins,
    spendCoins,
    updateLevelProgress,
    addToInventory,
    removeFromInventory,
    saveProgress,
    persist,
    resetAllProgress,
    getLevelStars,
    getLevelScore,
    isCharacterUnlocked,
    getCharacterStats,
    saveGameSession,
    loadGameSession,
    clearGameSession,
    hasGameSession
  };
});
