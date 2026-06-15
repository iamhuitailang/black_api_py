import { ZombieType } from '@/types/game';
import { WAVE_CONFIGS } from '@/constants/gameConfig';

export function buildWaveQueue(waveNumber: number): ZombieType[] {
  const config = WAVE_CONFIGS[waveNumber - 1];
  if (!config) return [];

  const queue: ZombieType[] = [];

  for (let i = 0; i < config.walkers; i++) queue.push(ZombieType.WALKER);
  for (let i = 0; i < config.runners; i++) queue.push(ZombieType.RUNNER);
  for (let i = 0; i < config.tanks; i++) queue.push(ZombieType.TANK);

  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  return queue;
}

export function getSpawnInterval(waveNumber: number): number {
  const config = WAVE_CONFIGS[waveNumber - 1];
  return config ? config.spawnInterval : 1500;
}
