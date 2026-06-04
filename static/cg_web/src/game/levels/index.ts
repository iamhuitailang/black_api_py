import type { LevelData } from '@/types/game';
import { forestLevel, forestMechanics } from './forest';
import { volcanoLevel, volcanoMechanics } from './volcano';
import { iceLevel, iceMechanics } from './ice';
import { spaceLevel, spaceMechanics } from './space';

export { forestLevel, forestMechanics } from './forest';
export { volcanoLevel, volcanoMechanics } from './volcano';
export { iceLevel, iceMechanics } from './ice';
export { spaceLevel, spaceMechanics } from './space';

export const levels: LevelData[] = [
  forestLevel,
  volcanoLevel,
  iceLevel,
  spaceLevel
];

export const levelMechanics = {
  forest: forestMechanics,
  volcano: volcanoMechanics,
  ice: iceMechanics,
  space: spaceMechanics
};

export function getLevelById(id: number): LevelData | undefined {
  return levels.find(level => level.id === id);
}

export function getLevelByTheme(theme: string): LevelData | undefined {
  return levels.find(level => level.theme === theme);
}

export function getLevelCount(): number {
  return levels.length;
}
