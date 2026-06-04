import type { LevelData, Platform, Enemy, Item, Obstacle, Boss } from '@/types/game';
import { COLORS, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/utils/constants';
import { PlatformEntity } from '../entities/Platform';
import { EnemyEntity } from '../entities/Enemy';
import { ItemEntity } from '../entities/Item';
import { BossEntity } from '../entities/Boss';

const LEVEL_WIDTH = CANVAS_WIDTH * 4.5;
const LEVEL_HEIGHT = CANVAS_HEIGHT;
const GROUND_Y = LEVEL_HEIGHT - TILE_SIZE * 2;

const createPlatforms = (): Platform[] => {
  const platforms: Platform[] = [];

  platforms.push(PlatformEntity.createIce(0, GROUND_Y, TILE_SIZE * 20, TILE_SIZE));

  platforms.push(PlatformEntity.createIce(TILE_SIZE * 28, GROUND_Y, TILE_SIZE * 15, TILE_SIZE));

  platforms.push(PlatformEntity.createIce(TILE_SIZE * 50, GROUND_Y, TILE_SIZE * 12, TILE_SIZE));

  platforms.push(PlatformEntity.createIce(TILE_SIZE * 70, GROUND_Y, TILE_SIZE * 18, TILE_SIZE));

  platforms.push(PlatformEntity.createIce(TILE_SIZE * 95, GROUND_Y, LEVEL_WIDTH - TILE_SIZE * 95, TILE_SIZE));

  platforms.push(PlatformEntity.createIce(TILE_SIZE * 22, GROUND_Y - TILE_SIZE * 3, TILE_SIZE * 4));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 30, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 3, { x: 1, y: 0 }, TILE_SIZE * 4));

  platforms.push(PlatformEntity.createIce(TILE_SIZE * 40, GROUND_Y - TILE_SIZE * 4, TILE_SIZE * 3));
  platforms.push(PlatformEntity.createIce(TILE_SIZE * 46, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 3));

  platforms.push(PlatformEntity.createBounce(TILE_SIZE * 53, GROUND_Y - TILE_SIZE * 2, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 60, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 3, { x: 0, y: 1 }, TILE_SIZE * 4));

  platforms.push(...PlatformEntity.createFloatingPlatforms(TILE_SIZE * 66, GROUND_Y - TILE_SIZE * 4, 4, TILE_SIZE * 3, TILE_SIZE * 2, TILE_SIZE * 2, 'ice'));

  platforms.push(PlatformEntity.createIce(TILE_SIZE * 82, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 4));
  platforms.push(PlatformEntity.createBreakable(TILE_SIZE * 88, GROUND_Y - TILE_SIZE * 7, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createBreakable(TILE_SIZE * 92, GROUND_Y - TILE_SIZE * 9, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createIce(TILE_SIZE * 98, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 5));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 108, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 4, { x: 1, y: 0 }, TILE_SIZE * 5));

  platforms.push(PlatformEntity.createBounce(TILE_SIZE * 120, GROUND_Y - TILE_SIZE * 3, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createIce(TILE_SIZE * 128, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 6));
  platforms.push(PlatformEntity.createIce(TILE_SIZE * 138, GROUND_Y - TILE_SIZE * 7, TILE_SIZE * 5));
  platforms.push(PlatformEntity.createIce(TILE_SIZE * 146, GROUND_Y - TILE_SIZE * 9, TILE_SIZE * 8));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 158, GROUND_Y - TILE_SIZE * 10, TILE_SIZE * 10));

  return platforms;
};

const createEnemies = (): Enemy[] => {
  const enemies: Enemy[] = [];

  enemies.push(new EnemyEntity(TILE_SIZE * 5, GROUND_Y - TILE_SIZE, 'snowball', 'patrol', [
    { x: TILE_SIZE * 2, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 15, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 10, GROUND_Y - TILE_SIZE * 5, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 18, GROUND_Y - TILE_SIZE, 'giant', 'patrol', [
    { x: TILE_SIZE * 16, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 25, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 32, GROUND_Y - TILE_SIZE * 7, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 38, GROUND_Y - TILE_SIZE, 'snowball', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 44, GROUND_Y - TILE_SIZE * 8, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 52, GROUND_Y - TILE_SIZE, 'giant', 'patrol', [
    { x: TILE_SIZE * 50, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 60, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 58, GROUND_Y - TILE_SIZE * 5, 'snowball', 'patrol', [
    { x: TILE_SIZE * 55, y: GROUND_Y - TILE_SIZE * 5 },
    { x: TILE_SIZE * 65, y: GROUND_Y - TILE_SIZE * 5 }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 68, GROUND_Y - TILE_SIZE * 6, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 75, GROUND_Y - TILE_SIZE, 'snowball', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 80, GROUND_Y - TILE_SIZE * 4, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 85, GROUND_Y - TILE_SIZE * 7, 'snowball', 'patrol', [
    { x: TILE_SIZE * 82, y: GROUND_Y - TILE_SIZE * 7 },
    { x: TILE_SIZE * 90, y: GROUND_Y - TILE_SIZE * 7 }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 95, GROUND_Y - TILE_SIZE, 'giant', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 100, GROUND_Y - TILE_SIZE * 8, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 110, GROUND_Y - TILE_SIZE * 7, 'snowball', 'patrol', [
    { x: TILE_SIZE * 108, y: GROUND_Y - TILE_SIZE * 7 },
    { x: TILE_SIZE * 118, y: GROUND_Y - TILE_SIZE * 7 }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 115, GROUND_Y - TILE_SIZE * 5, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 125, GROUND_Y - TILE_SIZE, 'giant', 'patrol', [
    { x: TILE_SIZE * 120, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 135, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 132, GROUND_Y - TILE_SIZE * 9, 'bat', 'fly'));

  return enemies;
};

const createItems = (): Item[] => {
  const items: Item[] = [];

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 3, GROUND_Y - TILE_SIZE * 3, 10));

  items.push(ItemEntity.createCoin(TILE_SIZE * 23, GROUND_Y - TILE_SIZE * 4));
  items.push(ItemEntity.createCoin(TILE_SIZE * 25, GROUND_Y - TILE_SIZE * 4));

  items.push(ItemEntity.createHealth(TILE_SIZE * 27, GROUND_Y - TILE_SIZE * 4));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 31, GROUND_Y - TILE_SIZE * 6, 5));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 35, GROUND_Y - TILE_SIZE * 7, 'speed'));

  items.push(ItemEntity.createCoin(TILE_SIZE * 41, GROUND_Y - TILE_SIZE * 5));
  items.push(ItemEntity.createCoin(TILE_SIZE * 43, GROUND_Y - TILE_SIZE * 5));
  items.push(ItemEntity.createCoin(TILE_SIZE * 47, GROUND_Y - TILE_SIZE * 7));
  items.push(ItemEntity.createCoin(TILE_SIZE * 49, GROUND_Y - TILE_SIZE * 7));

  items.push(...ItemEntity.createCoinArc(TILE_SIZE * 54, GROUND_Y - TILE_SIZE * 5, 6));

  items.push(ItemEntity.createHealth(TILE_SIZE * 58, GROUND_Y - TILE_SIZE * 3));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 61, GROUND_Y - TILE_SIZE * 8, 4));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 65, GROUND_Y - TILE_SIZE * 9, 'shield'));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 67, GROUND_Y - TILE_SIZE * 5, 3));
  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 70, GROUND_Y - TILE_SIZE * 7, 3));
  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 73, GROUND_Y - TILE_SIZE * 9, 3));

  items.push(ItemEntity.createHealth(TILE_SIZE * 78, GROUND_Y - TILE_SIZE * 6));

  items.push(ItemEntity.createCoin(TILE_SIZE * 83, GROUND_Y - TILE_SIZE * 6));
  items.push(ItemEntity.createCoin(TILE_SIZE * 85, GROUND_Y - TILE_SIZE * 6));
  items.push(ItemEntity.createCoin(TILE_SIZE * 89, GROUND_Y - TILE_SIZE * 8));
  items.push(ItemEntity.createCoin(TILE_SIZE * 93, GROUND_Y - TILE_SIZE * 10));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 95, GROUND_Y - TILE_SIZE * 11, 'invincible'));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 100, GROUND_Y - TILE_SIZE * 7, 7));

  items.push(ItemEntity.createHealth(TILE_SIZE * 106, GROUND_Y - TILE_SIZE * 4));

  items.push(...ItemEntity.createCoinArc(TILE_SIZE * 112, GROUND_Y - TILE_SIZE * 7, 7));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 118, GROUND_Y - TILE_SIZE * 8, 'power'));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 129, GROUND_Y - TILE_SIZE * 6, 5));
  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 139, GROUND_Y - TILE_SIZE * 8, 5));
  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 147, GROUND_Y - TILE_SIZE * 10, 7));

  items.push(ItemEntity.createHealth(TILE_SIZE * 152, GROUND_Y - TILE_SIZE * 8));
  items.push(ItemEntity.createPowerUp(TILE_SIZE * 160, GROUND_Y - TILE_SIZE * 12, 'speed'));

  return items;
};

const createObstacles = (): Obstacle[] => {
  const obstacles: Obstacle[] = [];

  for (let i = 0; i < 8; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'spike',
      x: TILE_SIZE * 20 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.5,
      width: TILE_SIZE,
      height: TILE_SIZE * 0.5,
      damage: 1,
      active: true
    });
  }

  for (let i = 0; i < 6; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'spike',
      x: TILE_SIZE * 43 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.5,
      width: TILE_SIZE,
      height: TILE_SIZE * 0.5,
      damage: 1,
      active: true
    });
  }

  for (let i = 0; i < 8; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'spike',
      x: TILE_SIZE * 62 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.5,
      width: TILE_SIZE,
      height: TILE_SIZE * 0.5,
      damage: 1,
      active: true
    });
  }

  for (let i = 0; i < 5; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'spike',
      x: TILE_SIZE * 88 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.5,
      width: TILE_SIZE,
      height: TILE_SIZE * 0.5,
      damage: 1,
      active: true
    });
  }

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'pit',
    x: TILE_SIZE * 32,
    y: GROUND_Y,
    width: TILE_SIZE * 4,
    height: TILE_SIZE * 3,
    damage: 2,
    active: true
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'pit',
    x: TILE_SIZE * 56,
    y: GROUND_Y,
    width: TILE_SIZE * 3,
    height: TILE_SIZE * 3,
    damage: 2,
    active: true
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'wind',
    x: TILE_SIZE * 75,
    y: GROUND_Y - TILE_SIZE * 6,
    width: TILE_SIZE * 5,
    height: TILE_SIZE * 6,
    damage: 0,
    active: true,
    timer: 0,
    interval: 5000
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'wind',
    x: TILE_SIZE * 115,
    y: GROUND_Y - TILE_SIZE * 6,
    width: TILE_SIZE * 4,
    height: TILE_SIZE * 6,
    damage: 0,
    active: true,
    timer: 2500,
    interval: 4500
  });

  for (let i = 0; i < 4; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'spike',
      x: TILE_SIZE * 122 + i * TILE_SIZE * 2,
      y: GROUND_Y - TILE_SIZE * 0.5,
      width: TILE_SIZE,
      height: TILE_SIZE * 0.5,
      damage: 1,
      active: true
    });
  }

  return obstacles;
};

const createBoss = (): Boss => {
  return new BossEntity(
    LEVEL_WIDTH - TILE_SIZE * 8,
    GROUND_Y - TILE_SIZE * 6,
    'ice_queen'
  );
};

export const iceLevel: LevelData = {
  id: 3,
  name: '极寒冰原',
  theme: 'ice',
  width: LEVEL_WIDTH,
  height: LEVEL_HEIGHT,
  spawnPoint: { x: TILE_SIZE, y: GROUND_Y - TILE_SIZE * 3 },
  platforms: createPlatforms(),
  enemies: createEnemies(),
  items: createItems(),
  obstacles: createObstacles(),
  boss: createBoss(),
  bossSpawnPoint: { x: LEVEL_WIDTH - TILE_SIZE * 10, y: GROUND_Y - TILE_SIZE * 6 },
  backgroundColor: COLORS.ice.bg,
  groundColor: COLORS.ice.ground,
  accentColor: COLORS.ice.accent
};

export const iceMechanics = {
  gravityMultiplier: 1,
  isIce: true,
  specialMechanic: 'slippery' as const,
  description: '冰原关卡 - 地面非常滑，需要小心控制移动，躲避尖刺和寒风！',
  tips: [
    '冰面摩擦力很小，移动会有惯性',
    '蓝色平台都是冰面，注意控制',
    '寒风会将你吹向一个方向',
    '雪球敌人会滚动追击，注意躲避'
  ]
};
