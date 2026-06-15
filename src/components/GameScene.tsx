import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import ZombieSprite from '@/components/ZombieSprite';
import HUD from '@/components/HUD';
import StartMenu from '@/components/StartMenu';
import GameOverScreen from '@/components/GameOverScreen';
import PauseMenu from '@/components/PauseMenu';
import Crosshair from '@/components/Crosshair';
import Background from '@/components/Background';
import Ground from '@/components/Ground';
import DamageNumbers from '@/components/DamageNumbers';
import MuzzleFlash from '@/components/MuzzleFlash';
import WaveNotice from '@/components/WaveNotice';
import ReloadOverlay from '@/components/ReloadOverlay';
import { loadSaveData } from '@/utils/saveSystem';
import { MAX_LIVES } from '@/constants/gameConfig';

export default function GameScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

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
  } = useGameStore();

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

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, update]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (status !== 'playing') return;
      if (isReloading) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      shoot(x, y, rect.width, rect.height);
    },
    [status, isReloading, shoot]
  );

  const handleStartGame = () => {
    startGame(1);
  };

  const handleContinue = () => {
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
  };

  const handleMainMenu = () => {
    useGameStore.setState({ status: 'menu' });
  };

  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 20 : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 20 : 0;

  const sortedZombies = [...zombies].sort((a, b) => b.distance - a.distance);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden cursor-crosshair select-none"
      onClick={handleClick}
      style={{
        transform: `translate(${shakeX}px, ${shakeY}px)`,
        background: '#0a0a12',
      }}
    >
      <Background />

      <Ground />

      {sortedZombies.map((zombie) => (
        <ZombieSprite key={zombie.id} zombie={zombie} sceneHeight={dimensions.height} />
      ))}

      <DamageNumbers numbers={damageNumbers} />

      <MuzzleFlash intensity={muzzleFlash} />

      {status === 'playing' && <Crosshair />}

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
    </div>
  );
}
