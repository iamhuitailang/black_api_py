import type { LevelData, Platform, Enemy, Item, Obstacle, Boss, Vector2 } from '@/types/game';
import { COLORS, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/utils/constants';
import { PlatformEntity } from '../entities/Platform';
import { EnemyEntity } from '../entities/Enemy';
import { ItemEntity } from '../entities/Item';
import { BossEntity } from '../entities/Boss';

const LEVEL_WIDTH = CANVAS_WIDTH * 4;
const LEVEL_HEIGHT = CANVAS_HEIGHT;
const GROUND_Y = LEVEL_HEIGHT - TILE_SIZE * 2;

const createPlatforms = (): Platform[] => {
  const platforms: Platform[] = [];

  platforms.push(PlatformEntity.createGround(0, GROUND_Y, LEVEL_WIDTH));

  platforms.push(...PlatformEntity.createFloatingPlatforms(200, GROUND_Y - TILE_SIZE * 4, 3, TILE_SIZE * 4, TILE_SIZE * 2, TILE_SIZE * 3));

  platforms.push(PlatformEntity.createBounce(450, GROUND_Y - TILE_SIZE * 3, TILE_SIZE * 2));

  platforms.push(...PlatformEntity.createStaircase(600, GROUND_Y - TILE_SIZE * 2, 5, TILE_SIZE * 2, TILE_SIZE, 'up', 'normal'));

  platforms.push(PlatformEntity.createMoving(900, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 3, { x: 1, y: 0 }, TILE_SIZE * 3));

  platforms.push(PlatformEntity.createBreakable(1100, GROUND_Y - TILE_SIZE * 4, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createBreakable(1200, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createNormal(1350, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 3));
  platforms.push(PlatformEntity.createBounce(1500, GROUND_Y - TILE_SIZE * 7, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createMoving(1700, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 3, { x: 0, y: 1 }, TILE_SIZE * 3));

  platforms.push(...PlatformEntity.createFloatingPlatforms(1900, GROUND_Y - TILE_SIZE * 4, 4, TILE_SIZE * 3, TILE_SIZE * 2, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createNormal(2200, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 4));
  platforms.push(PlatformEntity.createBreakable(2400, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createBreakable(2500, GROUND_Y - TILE_SIZE * 7, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createBreakable(2600, GROUND_Y - TILE_SIZE * 9, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createNormal(2750, GROUND_Y - TILE_SIZE * 8, TILE_SIZE * 5));

  platforms.push(PlatformEntity.createMoving(3000, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 4, { x: 1, y: 0 }, TILE_SIZE * 4));

  platforms.push(PlatformEntity.createBounce(3300, GROUND_Y - TILE_SIZE * 4, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createNormal(3450, GROUND_Y - TILE_SIZE * 7, TILE_SIZE * 10));

  platforms.push(PlatformEntity.createNormal(3550, GROUND_Y - TILE_SIZE * 10, TILE_SIZE * 8));

  return platforms;
};

const createEnemies = (): Enemy[] => {
  const enemies: Enemy[] = [];

  enemies.push(new EnemyEntity(250, GROUND_Y - TILE_SIZE, 'wolf', 'patrol', [
    { x: 200, y: GROUND_Y - TILE_SIZE },
    { x: 400, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(500, GROUND_Y - TILE_SIZE * 6, 'bee', 'fly'));

  enemies.push(new EnemyEntity(700, GROUND_Y - TILE_SIZE * 6, 'vine', 'stationary'));

  enemies.push(new EnemyEntity(850, GROUND_Y - TILE_SIZE, 'slime', 'patrol', [
    { x: 800, y: GROUND_Y - TILE_SIZE },
    { x: 1000, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(1200, GROUND_Y - TILE_SIZE * 8, 'bee', 'fly'));

  enemies.push(new EnemyEntity(1400, GROUND_Y - TILE_SIZE, 'wolf', 'chase'));

  enemies.push(new EnemyEntity(1600, GROUND_Y - TILE_SIZE * 5, 'vine', 'stationary'));

  enemies.push(new EnemyEntity(1800, GROUND_Y - TILE_SIZE * 3, 'slime', 'patrol', [
    { x: 1750, y: GROUND_Y - TILE_SIZE * 3 },
    { x: 1950, y: GROUND_Y - TILE_SIZE * 3 }
  ]));

  enemies.push(new EnemyEntity(2100, GROUND_Y - TILE_SIZE * 6, 'bee', 'fly'));

  enemies.push(new EnemyEntity(2300, GROUND_Y - TILE_SIZE, 'wolf', 'patrol', [
    { x: 2200, y: GROUND_Y - TILE_SIZE },
    { x: 2500, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(2600, GROUND_Y - TILE_SIZE * 10, 'bee', 'fly'));

  enemies.push(new EnemyEntity(2800, GROUND_Y - TILE_SIZE * 9, 'vine', 'stationary'));

  enemies.push(new EnemyEntity(3100, GROUND_Y - TILE_SIZE, 'slime', 'chase'));

  enemies.push(new EnemyEntity(3300, GROUND_Y - TILE_SIZE * 5, 'wolf', 'patrol', [
    { x: 3200, y: GROUND_Y - TILE_SIZE * 5 },
    { x: 3450, y: GROUND_Y - TILE_SIZE * 5 }
  ]));

  return enemies;
};

const createItems = (): Item[] => {
  const items: Item[] = [];

  items.push(...ItemEntity.createCoinRow(220, GROUND_Y - TILE_SIZE * 5, 5));

  items.push(ItemEntity.createCoin(520, GROUND_Y - TILE_SIZE * 6));
  items.push(ItemEntity.createCoin(560, GROUND_Y - TILE_SIZE * 8));
  items.push(ItemEntity.createCoin(600, GROUND_Y - TILE_SIZE * 10));

  items.push(...ItemEntity.createCoinRow(650, GROUND_Y - TILE_SIZE * 7, 5, TILE_SIZE * 2));

  items.push(ItemEntity.createPowerUp(950, GROUND_Y - TILE_SIZE * 7, 'speed'));

  items.push(...ItemEntity.createCoinArc(1150, GROUND_Y - TILE_SIZE * 8, 5));

  items.push(ItemEntity.createHealth(1400, GROUND_Y - TILE_SIZE * 6));

  items.push(...ItemEntity.createCoinRow(1600, GROUND_Y - TILE_SIZE * 8, 3));

  items.push(ItemEntity.createPowerUp(1850, GROUND_Y - TILE_SIZE * 7, 'shield'));

  items.push(...ItemEntity.createCoinRow(1950, GROUND_Y - TILE_SIZE * 5, 4));
  items.push(...ItemEntity.createCoinRow(1950, GROUND_Y - TILE_SIZE * 7, 4));

  items.push(ItemEntity.createHealth(2250, GROUND_Y - TILE_SIZE * 8));

  items.push(...ItemEntity.createCoinArc(2500, GROUND_Y - TILE_SIZE * 10, 7));

  items.push(ItemEntity.createPowerUp(2800, GROUND_Y - TILE_SIZE * 10, 'invincible'));

  items.push(...ItemEntity.createCoinRow(3050, GROUND_Y - TILE_SIZE * 7, 6, TILE_SIZE));

  items.push(ItemEntity.createHealth(3350, GROUND_Y - TILE_SIZE * 6));

  items.push(...ItemEntity.createCoinRow(3500, GROUND_Y - TILE_SIZE * 11, 8));
  items.push(ItemEntity.createPowerUp(3700, GROUND_Y - TILE_SIZE * 12, 'power'));

  return items;
};

const createObstacles = (): Obstacle[] => {
  const obstacles: Obstacle[] = [];

  for (let i = 0; i < 5; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'spike',
      x: 1050 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.5,
      width: TILE_SIZE,
      height: TILE_SIZE * 0.5,
      damage: 1,
      active: true
    });
  }

  for (let i = 0; i < 3; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'spike',
      x: 2050 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.5,
      width: TILE_SIZE,
      height: TILE_SIZE * 0.5,
      damage: 1,
      active: true
    });
  }

  for (let i = 0; i < 4; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'spike',
      x: 2900 + i * TILE_SIZE,
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
    x: 1500,
    y: GROUND_Y,
    width: TILE_SIZE * 3,
    height: TILE_SIZE * 3,
    damage: 2,
    active: true
  });

  return obstacles;
};

const createBoss = (): Boss => {
  return new BossEntity(
    LEVEL_WIDTH - TILE_SIZE * 6,
    GROUND_Y - TILE_SIZE * 5,
    'forest_king'
  );
};

export const forestLevel: LevelData = {
  id: 1,
  name: '神秘森林',
  theme: 'forest',
  width: LEVEL_WIDTH,
  height: LEVEL_HEIGHT,
  spawnPoint: { x: TILE_SIZE, y: GROUND_Y - TILE_SIZE * 3 },
  platforms: createPlatforms(),
  enemies: createEnemies(),
  items: createItems(),
  obstacles: createObstacles(),
  boss: createBoss(),
  bossSpawnPoint: { x: LEVEL_WIDTH - TILE_SIZE * 8, y: GROUND_Y - TILE_SIZE * 5 },
  backgroundColor: COLORS.forest.bg,
  groundColor: COLORS.forest.ground,
  accentColor: COLORS.forest.accent
};

export const forestMechanics = {
  gravityMultiplier: 1,
  isIce: false,
  specialMechanic: 'vine_jump' as const,
  description: '森林关卡 - 利用弹跳蘑菇和藤蔓进行跳跃，小心尖刺陷阱！',
  tips: [
    '绿色蘑菇可以将你弹得很高',
    '藤蔓是固定敌人，无法移动但会攻击',
    '易碎平台踩上去后会掉落',
    '收集足够金币可以在商店购买道具'
  ]
};
