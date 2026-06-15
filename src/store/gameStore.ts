import { create } from 'zustand';
import { GameState, GameSaveState } from '@/types/game';
import {
  MAX_MAGAZINE,
  MAX_LIVES,
  DANGER_DISTANCE,
  BASE_ZOMBIE_SPEED,
  RELOAD_TIME,
  TOTAL_WAVES,
} from '@/constants/gameConfig';
import {
  playGunshot,
  playHeadshot,
  playReloadOut,
  playReloadIn,
  playZombieGroan,
  playAlarm,
  playEmptyClick,
  playWaveStart,
  playVictory,
  playGameOver,
} from '@/utils/soundEffects';
import {
  saveGameData,
  saveGameState,
  clearGameState,
  updateHighestWave,
  updateBestScore,
  loadGameState,
} from '@/utils/saveSystem';
import { createZombie } from '@/game/zombieFactory';
import { buildWaveQueue, getSpawnInterval } from '@/game/waveSystem';
import {
  detectHit,
  applyDamage,
  createDamageNumber,
  calculateScore,
  isMagazineEmpty,
  isMagazineFull,
} from '@/game/combatSystem';

const initialState: GameState = {
  status: 'menu',
  currentWave: 1,
  lives: MAX_LIVES,
  score: 0,
  magazine: MAX_MAGAZINE,
  maxMagazine: MAX_MAGAZINE,
  isReloading: false,
  reloadProgress: 0,
  totalShots: 0,
  headshots: 0,
  zombies: [],
  waveZombieQueue: [],
  waveSpawnTimer: 0,
  showWaveNotice: false,
  waveNoticeText: '',
  screenShake: 0,
  muzzleFlash: 0,
  damageNumbers: [],
};

interface GameStore extends GameState {
  startGame: (fromWave?: number, savedScore?: number, savedLives?: number) => void;
  resumeFromSave: () => boolean;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  shoot: (targetX: number, targetY: number, sceneWidth: number, sceneHeight: number) => void;
  reload: () => void;
  update: (deltaTime: number) => void;
  getRemainingZombies: () => number;
  autoSave: () => void;
}

function showWaveNotice(wave: number) {
  return {
    showWaveNotice: true,
    waveNoticeText: `第 ${wave} 波`,
  };
}

let saveTimer = 0;
const SAVE_INTERVAL = 1;

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  startGame: (fromWave = 1, savedScore = 0, savedLives = MAX_LIVES) => {
    const queue = buildWaveQueue(fromWave);
    clearGameState();
    set({
      status: 'playing',
      currentWave: fromWave,
      lives: savedLives,
      score: savedScore,
      magazine: MAX_MAGAZINE,
      isReloading: false,
      reloadProgress: 0,
      totalShots: 0,
      headshots: 0,
      zombies: [],
      waveZombieQueue: queue,
      waveSpawnTimer: 1000,
      ...showWaveNotice(fromWave),
      screenShake: 0,
      muzzleFlash: 0,
      damageNumbers: [],
    });
    saveTimer = 0;
    playWaveStart();
    setTimeout(() => set({ showWaveNotice: false }), 2000);
  },

  resumeFromSave: () => {
    const savedState = loadGameState();
    if (!savedState) return false;

    if (savedState.lives <= 0) return false;

    const aliveZombies = savedState.zombies.filter((z) => !z.isDead || z.deathAnimation > 0);

    set({
      status: 'playing',
      currentWave: savedState.currentWave,
      lives: savedState.lives,
      score: savedState.score,
      magazine: savedState.magazine,
      isReloading: false,
      reloadProgress: 0,
      totalShots: savedState.totalShots,
      headshots: savedState.headshots,
      zombies: aliveZombies.map((z) => ({ ...z, hitFlash: 0 })),
      waveZombieQueue: savedState.waveZombieQueue,
      waveSpawnTimer: savedState.waveSpawnTimer,
      showWaveNotice: false,
      waveNoticeText: '',
      screenShake: 0,
      muzzleFlash: 0,
      damageNumbers: [],
    });

    saveTimer = 0;
    return true;
  },

  pauseGame: () => {
    if (get().status === 'playing') {
      set({ status: 'paused' });
      get().autoSave();
    }
  },

  resumeGame: () => {
    if (get().status === 'paused') set({ status: 'playing' });
  },

  restartGame: () => {
    get().startGame(1);
  },

  shoot: (targetX, targetY, sceneWidth, sceneHeight) => {
    const state = get();
    if (state.status !== 'playing') return;
    if (state.isReloading) return;
    if (isMagazineEmpty(state.magazine)) {
      playEmptyClick();
      return;
    }

    playGunshot();
    set((s) => ({
      magazine: s.magazine - 1,
      totalShots: s.totalShots + 1,
      muzzleFlash: 1,
      screenShake: 0.3,
    }));

    const { hitZombie, isHeadshot } = detectHit(
      state.zombies,
      targetX,
      targetY,
      sceneWidth,
      sceneHeight
    );

    if (!hitZombie) return;

    const { updatedZombie, killed } = applyDamage(hitZombie, isHeadshot);

    if (isHeadshot) {
      playHeadshot();
      set((s) => ({ headshots: s.headshots + 1 }));
    }

    const dmgNum = createDamageNumber(targetX, targetY, isHeadshot, hitZombie.score);

    set((s) => {
      const newZombies = s.zombies.map((z) =>
        z.id === hitZombie.id ? updatedZombie : z
      );
      const newScore = s.score + calculateScore(killed, isHeadshot, hitZombie.score);

      if (killed) playZombieGroan();

      const result = {
        zombies: newZombies,
        score: newScore,
        damageNumbers: [...s.damageNumbers, dmgNum],
      };

      setTimeout(() => get().autoSave(), 0);

      return result;
    });
  },

  reload: () => {
    const state = get();
    if (state.status !== 'playing') return;
    if (state.isReloading) return;
    if (isMagazineFull(state.magazine)) return;

    set({ isReloading: true, reloadProgress: 0 });
    playReloadOut();

    setTimeout(() => playReloadIn(), RELOAD_TIME * 0.5);
    setTimeout(() => {
      set({ isReloading: false, reloadProgress: 0, magazine: MAX_MAGAZINE });
    }, RELOAD_TIME);
  },

  update: (deltaTime: number) => {
    const state = get();
    if (state.status !== 'playing') return;

    saveTimer += deltaTime;
    if (saveTimer >= SAVE_INTERVAL) {
      saveTimer = 0;
      get().autoSave();
    }

    set((s) => ({
      screenShake: Math.max(0, s.screenShake - deltaTime * 2),
      muzzleFlash: Math.max(0, s.muzzleFlash - deltaTime * 5),
    }));

    if (state.isReloading) {
      set((s) => ({
        reloadProgress: Math.min(1, s.reloadProgress + deltaTime / (RELOAD_TIME / 1000)),
      }));
    }

    set((s) => ({
      damageNumbers: s.damageNumbers
        .map((d) => ({ ...d, y: d.y - deltaTime * 50, life: d.life - deltaTime * 1.5 }))
        .filter((d) => d.life > 0),
    }));

    set((s) => {
      const updatedZombies = s.zombies.map((zombie) => {
        const z = { ...zombie };
        if (z.isDead) {
          z.deathAnimation = Math.max(0, z.deathAnimation - deltaTime * 2);
          return z;
        }
        z.distance -= z.speed * BASE_ZOMBIE_SPEED * deltaTime * 60;
        z.hitFlash = Math.max(0, z.hitFlash - deltaTime * 5);
        return z;
      });

      const reachedZombies = updatedZombies.filter(
        (z) => !z.isDead && z.distance <= DANGER_DISTANCE
      );

      let newLives = s.lives;
      if (reachedZombies.length > 0) {
        newLives -= reachedZombies.length;
        playAlarm();
      }

      const aliveZombies = updatedZombies.filter(
        (z) => z.distance > DANGER_DISTANCE || z.deathAnimation > 0
      );

      if (newLives !== s.lives) {
        setTimeout(() => get().autoSave(), 0);
      }

      return {
        zombies: aliveZombies,
        lives: Math.max(0, newLives),
      };
    });

    const currentState = get();
    if (currentState.lives <= 0) {
      set({ status: 'gameover' });
      playGameOver();
      updateBestScore(currentState.score);
      saveGameData({
        totalShots: currentState.totalShots,
        totalHeadshots: currentState.headshots,
      });
      clearGameState();
      return;
    }

    if (currentState.waveZombieQueue.length > 0) {
      set((s) => {
        const newTimer = s.waveSpawnTimer - deltaTime * 1000;
        if (newTimer <= 0) {
          const [nextType, ...restQueue] = s.waveZombieQueue;
          const newZombie = createZombie(nextType);
          return {
            zombies: [...s.zombies, newZombie],
            waveZombieQueue: restQueue,
            waveSpawnTimer: getSpawnInterval(s.currentWave),
          };
        }
        return { waveSpawnTimer: newTimer };
      });
    }

    const afterSpawnState = get();
    const aliveZombies = afterSpawnState.zombies.filter((z) => !z.isDead);
    const queueEmpty = afterSpawnState.waveZombieQueue.length === 0;

    if (aliveZombies.length === 0 && queueEmpty) {
      const currentWave = afterSpawnState.currentWave;

      if (currentWave >= TOTAL_WAVES) {
        set({ status: 'victory' });
        playVictory();
        updateHighestWave(TOTAL_WAVES);
        updateBestScore(afterSpawnState.score);
        saveGameData({
          totalShots: afterSpawnState.totalShots,
          totalHeadshots: afterSpawnState.headshots,
        });
        clearGameState();
      } else {
        const nextWave = currentWave + 1;
        const nextQueue = buildWaveQueue(nextWave);
        updateHighestWave(currentWave);

        set({
          currentWave: nextWave,
          waveZombieQueue: nextQueue,
          waveSpawnTimer: 2000,
          ...showWaveNotice(nextWave),
        });
        playWaveStart();
        setTimeout(() => set({ showWaveNotice: false }), 2000);
      }
    }
  },

  autoSave: () => {
    const state = get();
    if (state.status !== 'playing') return;

    const saveState: GameSaveState = {
      currentWave: state.currentWave,
      lives: state.lives,
      score: state.score,
      magazine: state.magazine,
      totalShots: state.totalShots,
      headshots: state.headshots,
      zombies: state.zombies,
      waveZombieQueue: state.waveZombieQueue,
      waveSpawnTimer: state.waveSpawnTimer,
      savedAt: Date.now(),
    };

    saveGameState(saveState);
  },

  getRemainingZombies: () => {
    const state = get();
    const alive = state.zombies.filter((z) => !z.isDead).length;
    return alive + state.waveZombieQueue.length;
  },
}));
