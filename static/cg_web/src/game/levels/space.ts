import type { LevelData, Platform, Enemy, Item, Obstacle, Boss } from '@/types/game';
import { COLORS, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/utils/constants';
import { PlatformEntity } from '../entities/Platform';
import { EnemyEntity } from '../entities/Enemy';
import { ItemEntity } from '../entities/Item';
import { BossEntity } from '../entities/Boss';

const LEVEL_WIDTH = CANVAS_WIDTH * 5;
const LEVEL_HEIGHT = CANVAS_HEIGHT;
const GROUND_Y = LEVEL_HEIGHT - TILE_SIZE * 2;

const createPlatforms = (): Platform[] => {
  const platforms: Platform[] = [];

  platforms.push(PlatformEntity.createGround(0, GROUND_Y, TILE_SIZE * 12));

  platforms.push(PlatformEntity.createGround(TILE_SIZE * 22, GROUND_Y, TILE_SIZE * 8));

  platforms.push(PlatformEntity.createGround(TILE_SIZE * 40, GROUND_Y, TILE_SIZE * 10));

  platforms.push(PlatformEntity.createGround(TILE_SIZE * 60, GROUND_Y, TILE_SIZE * 8));

  platforms.push(PlatformEntity.createGround(TILE_SIZE * 80, GROUND_Y, TILE_SIZE * 12));

  platforms.push(PlatformEntity.createGround(TILE_SIZE * 105, GROUND_Y, LEVEL_WIDTH - TILE_SIZE * 105));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 14, GROUND_Y - TILE_SIZE * 3, TILE_SIZE * 3));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 14, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 3));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 14, GROUND_Y - TILE_SIZE * 9, TILE_SIZE * 3));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 25, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 3, { x: 0, y: 1 }, TILE_SIZE * 4));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 32, GROUND_Y - TILE_SIZE * 4, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 36, GROUND_Y - TILE_SIZE * 7, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 32, GROUND_Y - TILE_SIZE * 10, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createBounce(TILE_SIZE * 43, GROUND_Y - TILE_SIZE * 2, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 50, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 3, { x: 1, y: 0 }, TILE_SIZE * 5));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 62, GROUND_Y - TILE_SIZE * 3, TILE_SIZE * 3));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 68, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 3));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 62, GROUND_Y - TILE_SIZE * 9, TILE_SIZE * 3));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 75, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 3, { x: 0, y: 1 }, TILE_SIZE * 5));

  platforms.push(PlatformEntity.createBreakable(TILE_SIZE * 85, GROUND_Y - TILE_SIZE * 4, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createBreakable(TILE_SIZE * 89, GROUND_Y - TILE_SIZE * 7, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createBreakable(TILE_SIZE * 93, GROUND_Y - TILE_SIZE * 10, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 98, GROUND_Y - TILE_SIZE * 8, TILE_SIZE * 5));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 108, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 4, { x: 1, y: 0 }, TILE_SIZE * 6));

  platforms.push(PlatformEntity.createBounce(TILE_SIZE * 120, GROUND_Y - TILE_SIZE * 4, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 128, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 6));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 138, GROUND_Y - TILE_SIZE * 8, TILE_SIZE * 6));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 148, GROUND_Y - TILE_SIZE * 10, TILE_SIZE * 10));

  return platforms;
};

const createEnemies = (): Enemy[] => {
  const enemies: Enemy[] = [];

  enemies.push(new EnemyEntity(TILE_SIZE * 3, GROUND_Y - TILE_SIZE, 'robot', 'patrol', [
    { x: TILE_SIZE * 1, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 10, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 8, GROUND_Y - TILE_SIZE * 6, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 15, GROUND_Y - TILE_SIZE * 7, 'turret', 'stationary'));

  enemies.push(new EnemyEntity(TILE_SIZE * 24, GROUND_Y - TILE_SIZE, 'robot', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 28, GROUND_Y - TILE_SIZE * 8, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 35, GROUND_Y - TILE_SIZE * 5, 'blackhole', 'stationary'));

  enemies.push(new EnemyEntity(TILE_SIZE * 42, GROUND_Y - TILE_SIZE, 'robot', 'patrol', [
    { x: TILE_SIZE * 40, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 48, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 45, GROUND_Y - TILE_SIZE * 8, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 52, GROUND_Y - TILE_SIZE * 9, 'turret', 'stationary'));

  enemies.push(new EnemyEntity(TILE_SIZE * 58, GROUND_Y - TILE_SIZE * 5, 'robot', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 65, GROUND_Y - TILE_SIZE * 7, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 70, GROUND_Y - TILE_SIZE, 'robot', 'patrol', [
    { x: TILE_SIZE * 68, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 78, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 73, GROUND_Y - TILE_SIZE * 8, 'blackhole', 'stationary'));

  enemies.push(new EnemyEntity(TILE_SIZE * 82, GROUND_Y - TILE_SIZE * 6, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 87, GROUND_Y - TILE_SIZE * 7, 'turret', 'stationary'));

  enemies.push(new EnemyEntity(TILE_SIZE * 95, GROUND_Y - TILE_SIZE, 'robot', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 100, GROUND_Y - TILE_SIZE * 10, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 110, GROUND_Y - TILE_SIZE, 'robot', 'patrol', [
    { x: TILE_SIZE * 105, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 120, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 115, GROUND_Y - TILE_SIZE * 8, 'turret', 'stationary'));

  enemies.push(new EnemyEntity(TILE_SIZE * 125, GROUND_Y - TILE_SIZE * 9, 'bat', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 132, GROUND_Y - TILE_SIZE, 'robot', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 140, GROUND_Y - TILE_SIZE * 10, 'blackhole', 'stationary'));

  return enemies;
};

const createItems = (): Item[] => {
  const items: Item[] = [];

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 2, GROUND_Y - TILE_SIZE * 3, 6));

  items.push(ItemEntity.createCoin(TILE_SIZE * 15, GROUND_Y - TILE_SIZE * 4));
  items.push(ItemEntity.createCoin(TILE_SIZE * 17, GROUND_Y - TILE_SIZE * 4));
  items.push(ItemEntity.createCoin(TILE_SIZE * 15, GROUND_Y - TILE_SIZE * 7));
  items.push(ItemEntity.createCoin(TILE_SIZE * 17, GROUND_Y - TILE_SIZE * 7));
  items.push(ItemEntity.createCoin(TILE_SIZE * 15, GROUND_Y - TILE_SIZE * 10));
  items.push(ItemEntity.createCoin(TILE_SIZE * 17, GROUND_Y - TILE_SIZE * 10));

  items.push(ItemEntity.createHealth(TILE_SIZE * 19, GROUND_Y - TILE_SIZE * 6));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 26, GROUND_Y - TILE_SIZE * 7, 5));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 30, GROUND_Y - TILE_SIZE * 8, 'speed'));

  items.push(ItemEntity.createCoin(TILE_SIZE * 33, GROUND_Y - TILE_SIZE * 5));
  items.push(ItemEntity.createCoin(TILE_SIZE * 37, GROUND_Y - TILE_SIZE * 8));
  items.push(ItemEntity.createCoin(TILE_SIZE * 33, GROUND_Y - TILE_SIZE * 11));

  items.push(...ItemEntity.createCoinArc(TILE_SIZE * 44, GROUND_Y - TILE_SIZE * 5, 6));

  items.push(ItemEntity.createHealth(TILE_SIZE * 48, GROUND_Y - TILE_SIZE * 3));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 51, GROUND_Y - TILE_SIZE * 8, 4));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 55, GROUND_Y - TILE_SIZE * 10, 'shield'));

  items.push(ItemEntity.createCoin(TILE_SIZE * 63, GROUND_Y - TILE_SIZE * 4));
  items.push(ItemEntity.createCoin(TILE_SIZE * 65, GROUND_Y - TILE_SIZE * 4));
  items.push(ItemEntity.createCoin(TILE_SIZE * 69, GROUND_Y - TILE_SIZE * 7));
  items.push(ItemEntity.createCoin(TILE_SIZE * 71, GROUND_Y - TILE_SIZE * 7));
  items.push(ItemEntity.createCoin(TILE_SIZE * 63, GROUND_Y - TILE_SIZE * 10));
  items.push(ItemEntity.createCoin(TILE_SIZE * 65, GROUND_Y - TILE_SIZE * 10));

  items.push(ItemEntity.createHealth(TILE_SIZE * 67, GROUND_Y - TILE_SIZE * 12));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 76, GROUND_Y - TILE_SIZE * 7, 6));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 80, GROUND_Y - TILE_SIZE * 8, 'invincible'));

  items.push(ItemEntity.createCoin(TILE_SIZE * 86, GROUND_Y - TILE_SIZE * 5));
  items.push(ItemEntity.createCoin(TILE_SIZE * 90, GROUND_Y - TILE_SIZE * 8));
  items.push(ItemEntity.createCoin(TILE_SIZE * 94, GROUND_Y - TILE_SIZE * 11));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 100, GROUND_Y - TILE_SIZE * 10, 5));

  items.push(ItemEntity.createHealth(TILE_SIZE * 104, GROUND_Y - TILE_SIZE * 6));

  items.push(...ItemEntity.createCoinArc(TILE_SIZE * 110, GROUND_Y - TILE_SIZE * 8, 7));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 116, GROUND_Y - TILE_SIZE * 10, 'power'));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 122, GROUND_Y - TILE_SIZE * 6, 5));
  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 130, GROUND_Y - TILE_SIZE * 8, 6));
  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 140, GROUND_Y - TILE_SIZE * 10, 7));

  items.push(ItemEntity.createHealth(TILE_SIZE * 145, GROUND_Y - TILE_SIZE * 8));
  items.push(ItemEntity.createPowerUp(TILE_SIZE * 152, GROUND_Y - TILE_SIZE * 12, 'invincible'));

  return items;
};

const createObstacles = (): Obstacle[] => {
  const obstacles: Obstacle[] = [];

  for (let i = 0; i < 10; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'laser',
      x: TILE_SIZE * 12 + i * TILE_SIZE,
      y: 0,
      width: TILE_SIZE * 0.5,
      height: GROUND_Y,
      damage: 2,
      active: true,
      timer: i * 300,
      interval: 2000
    });
  }

  for (let i = 0; i < 8; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'laser',
      x: TILE_SIZE * 30 + i * TILE_SIZE,
      y: 0,
      width: TILE_SIZE * 0.5,
      height: GROUND_Y,
      damage: 2,
      active: true,
      timer: i * 250 + 100,
      interval: 1800
    });
  }

  for (let i = 0; i < 10; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'laser',
      x: TILE_SIZE * 50 + i * TILE_SIZE,
      y: 0,
      width: TILE_SIZE * 0.5,
      height: GROUND_Y,
      damage: 2,
      active: true,
      timer: i * 200 + 50,
      interval: 2200
    });
  }

  for (let i = 0; i < 8; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'laser',
      x: TILE_SIZE * 72 + i * TILE_SIZE,
      y: 0,
      width: TILE_SIZE * 0.5,
      height: GROUND_Y,
      damage: 2,
      active: true,
      timer: i * 300 + 150,
      interval: 1900
    });
  }

  for (let i = 0; i < 10; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'laser',
      x: TILE_SIZE * 92 + i * TILE_SIZE,
      y: 0,
      width: TILE_SIZE * 0.5,
      height: GROUND_Y,
      damage: 2,
      active: true,
      timer: i * 250 + 200,
      interval: 2100
    });
  }

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'meteor',
    x: TILE_SIZE * 40,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    damage: 3,
    active: true,
    timer: 0,
    interval: 2500
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'meteor',
    x: TILE_SIZE * 70,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    damage: 3,
    active: true,
    timer: 1250,
    interval: 3000
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'meteor',
    x: TILE_SIZE * 100,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    damage: 3,
    active: true,
    timer: 625,
    interval: 2800
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'meteor',
    x: TILE_SIZE * 130,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    damage: 3,
    active: true,
    timer: 1875,
    interval: 3200
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'pit',
    x: TILE_SIZE * 12,
    y: GROUND_Y,
    width: TILE_SIZE * 10,
    height: TILE_SIZE * 3,
    damage: 2,
    active: true
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'pit',
    x: TILE_SIZE * 30,
    y: GROUND_Y,
    width: TILE_SIZE * 10,
    height: TILE_SIZE * 3,
    damage: 2,
    active: true
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'pit',
    x: TILE_SIZE * 50,
    y: GROUND_Y,
    width: TILE_SIZE * 10,
    height: TILE_SIZE * 3,
    damage: 2,
    active: true
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'pit',
    x: TILE_SIZE * 68,
    y: GROUND_Y,
    width: TILE_SIZE * 12,
    height: TILE_SIZE * 3,
    damage: 2,
    active: true
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'pit',
    x: TILE_SIZE * 92,
    y: GROUND_Y,
    width: TILE_SIZE * 13,
    height: TILE_SIZE * 3,
    damage: 2,
    active: true
  });

  return obstacles;
};

const createBoss = (): Boss => {
  return new BossEntity(
    LEVEL_WIDTH - TILE_SIZE * 8,
    GROUND_Y - TILE_SIZE * 6,
    'space_emperor'
  );
};

export const spaceLevel: LevelData = {
  id: 4,
  name: '宇宙深空',
  theme: 'space',
  width: LEVEL_WIDTH,
  height: LEVEL_HEIGHT,
  spawnPoint: { x: TILE_SIZE, y: GROUND_Y - TILE_SIZE * 3 },
  platforms: createPlatforms(),
  enemies: createEnemies(),
  items: createItems(),
  obstacles: createObstacles(),
  boss: createBoss(),
  bossSpawnPoint: { x: LEVEL_WIDTH - TILE_SIZE * 10, y: GROUND_Y - TILE_SIZE * 6 },
  backgroundColor: COLORS.space.bg,
  groundColor: COLORS.space.ground,
  accentColor: COLORS.space.accent
};

export const spaceMechanics = {
  gravityMultiplier: 0.4,
  isIce: false,
  specialMechanic: 'low_gravity' as const,
  description: '太空关卡 - 重力只有地球的40%，跳跃更高更远，小心激光和黑洞！',
  tips: [
    '低重力下跳跃高度和距离都会增加',
    '激光会周期性开关，注意时机',
    '黑洞会吸引你靠近，保持距离',
    '炮台敌人会发射子弹，注意躲避'
  ]
};
