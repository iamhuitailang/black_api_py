import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import ZombieSprite from '@/components/ZombieSprite';
import HUD from '@/components/HUD';
import StartMenu from '@/components/StartMenu';
import GameOverScreen from '@/components/GameOverScreen';
import PauseMenu from '@/components/PauseMenu';
import Crosshair, { CrosshairRef } from '@/components/Crosshair';
import Background from '@/components/Background';
import Ground from '@/components/Ground';
import DamageNumbers from '@/components/DamageNumbers';
import MuzzleFlash from '@/components/MuzzleFlash';
import WaveNotice from '@/components/WaveNotice';
import ReloadOverlay from '@/components/ReloadOverlay';
import { loadSaveData, hasGameState, saveGameState } from '@/utils/saveSystem';
import { MAX_LIVES } from '@/constants/gameConfig';

export default function GameScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<CrosshairRef>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const lastSaveTimeRef = useRef<number>(0);

  const {
    status,
    zombies,
    screenShake,
    muzzleFlash,
    damageNumbers,
    showWaveNotice,
    waveNoticeText,
    isReloading,
    reloadProgress,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    shoot,
    reload,
    update,
    resumeFromSave,
    currentWave,
    score,
    lives,
    magazine,
    totalShots,
    headshots,
    waveZombieQueue,
    waveSpawnTimer,
  } = useGameStore();

  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'playing') {
        const gameState = {
          currentWave,
          lives,
          score,
          magazine,
          totalShots,
          headshots,
          zombies,
          waveZombieQueue,
          waveSpawnTimer,
          savedAt: Date.now(),
        };
        try {
          saveGameState(gameState);
        } catch {
          // localStorage 写入失败静默处理
        }
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status, currentWave, lives, score, magazine, totalShots, headshots, zombies, waveZombieQueue, waveSpawnTimer]);

  useEffect(() => {
    if (status === 'playing') {
      crosshairRef.current?.show();
    } else {
      crosshairRef.current?.hide();
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'playing') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      update(Math.min(deltaTime, 0.1));

      const now = Date.now();
      if (now - lastSaveTimeRef.current > 1000) {
        lastSaveTimeRef.current = now;
        try {
          const state = useGameStore.getState();
          saveGameState({
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
          });
        } catch {
          // localStorage 写入失败静默处理
        }
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = 0;
    lastSaveTimeRef.current = Date.now();
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, update]);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (status !== 'playing') return;
      if (isReloading) return;

      const pos = getMousePos(e);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      lastMousePos.current = pos;
      crosshairRef.current?.setPosition(pos.x, pos.y);

      shoot(pos.x, pos.y, rect.width, rect.height);

      try {
        const state = useGameStore.getState();
        saveGameState({
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
        });
      } catch {
        // localStorage 写入失败静默处理
      }
    },
    [status, isReloading, shoot, getMousePos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const pos = getMousePos(e);
      lastMousePos.current = pos;
      crosshairRef.current?.setPosition(pos.x, pos.y);
    },
    [getMousePos]
  );

  const handleMouseLeave = useCallback(() => {
    crosshairRef.current?.hide();
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (status === 'playing') {
      crosshairRef.current?.show();
      crosshairRef.current?.setPosition(lastMousePos.current.x, lastMousePos.current.y);
    }
  }, [status]);

  const handleStartGame = () => {
    startGame(1);
  };

  const handleContinue = () => {
    const resumed = resumeFromSave();
    if (!resumed) {
      const saveData = loadSaveData();
      if (saveData) {
        startGame(
          saveData.lastPlayedWave,
          saveData.lastPlayedScore,
          saveData.lastPlayedLives > 0 ? saveData.lastPlayedLives : MAX_LIVES
        );
      } else {
        startGame(1);
      }
    }
  };

  const handleMainMenu = () => {
    try {
      const state = useGameStore.getState();
      saveGameState({
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
      });
    } catch {
      // localStorage 写入失败静默处理
    }
    useGameStore.setState({ status: 'menu' });
  };

  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 20 : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 20 : 0;

  const sortedZombies = [...zombies].sort((a, b) => b.distance - a.distance);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden cursor-none select-none"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{ background: '#0a0a12' }}
    >
      <div
        className="absolute inset-0"
        style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}
      >
        <Background />
        <Ground />
        <MuzzleFlash intensity={muzzleFlash} />
      </div>

      {sortedZombies.map((zombie) => (
        <ZombieSprite key={zombie.id} zombie={zombie} sceneHeight={dimensions.height} />
      ))}

      <DamageNumbers numbers={damageNumbers} />

      <Crosshair ref={crosshairRef} />

      {showWaveNotice && <WaveNotice text={waveNoticeText} />}

      {status === 'playing' && <HUD onPause={pauseGame} onReload={reload} />}

      {status === 'menu' && (
        <StartMenu onStartGame={handleStartGame} onContinue={handleContinue} />
      )}

      {status === 'paused' && (
        <PauseMenu
          onResume={resumeGame}
          onRestart={restartGame}
          onMainMenu={handleMainMenu}
        />
      )}

      {(status === 'victory' || status === 'gameover') && (
        <GameOverScreen
          isVictory={status === 'victory'}
          onRestart={restartGame}
          onMainMenu={handleMainMenu}
        />
      )}

      {status === 'playing' && isReloading && (
        <ReloadOverlay progress={reloadProgress} />
      )}

      {status === 'playing' && hasGameState() && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className="px-2 py-1 rounded text-xs"
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: '#4ade80',
              border: '1px solid rgba(74,222,128,0.4)',
              boxShadow: '0 0 8px rgba(74,222,128,0.2)',
            }}
          >
            ✓ 已自动存档
          </div>
        </div>
      )}
    </div>
  );
}
