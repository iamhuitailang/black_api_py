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

  platforms.push(PlatformEntity.createGround(0, GROUND_Y, TILE_SIZE * 15));

  platforms.push(PlatformEntity.createGround(TILE_SIZE * 25, GROUND_Y, TILE_SIZE * 10));

  platforms.push(PlatformEntity.createGround(TILE_SIZE * 45, GROUND_Y, TILE_SIZE * 15));

  platforms.push(PlatformEntity.createGround(TILE_SIZE * 70, GROUND_Y, TILE_SIZE * 10));

  platforms.push(PlatformEntity.createGround(TILE_SIZE * 90, GROUND_Y, LEVEL_WIDTH - TILE_SIZE * 90));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 16, GROUND_Y - TILE_SIZE * 2, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 20, GROUND_Y - TILE_SIZE * 4, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 16, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 28, GROUND_Y - TILE_SIZE * 4, TILE_SIZE * 3, { x: 1, y: 0 }, TILE_SIZE * 4));

  platforms.push(PlatformEntity.createBreakable(TILE_SIZE * 36, GROUND_Y - TILE_SIZE * 3, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createBreakable(TILE_SIZE * 40, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createBounce(TILE_SIZE * 48, GROUND_Y - TILE_SIZE * 2, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 55, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 3, { x: 0, y: 1 }, TILE_SIZE * 3));

  platforms.push(...PlatformEntity.createFloatingPlatforms(TILE_SIZE * 62, GROUND_Y - TILE_SIZE * 4, 3, TILE_SIZE * 3, TILE_SIZE * 2, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 75, GROUND_Y - TILE_SIZE * 3, TILE_SIZE * 3));
  platforms.push(PlatformEntity.createBreakable(TILE_SIZE * 80, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createBreakable(TILE_SIZE * 84, GROUND_Y - TILE_SIZE * 7, TILE_SIZE * 2));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 88, GROUND_Y - TILE_SIZE * 9, TILE_SIZE * 3));

  platforms.push(PlatformEntity.createMoving(TILE_SIZE * 95, GROUND_Y - TILE_SIZE * 6, TILE_SIZE * 4, { x: 1, y: 0 }, TILE_SIZE * 5));

  platforms.push(PlatformEntity.createBounce(TILE_SIZE * 105, GROUND_Y - TILE_SIZE * 3, TILE_SIZE * 2));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 112, GROUND_Y - TILE_SIZE * 5, TILE_SIZE * 5));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 120, GROUND_Y - TILE_SIZE * 7, TILE_SIZE * 6));
  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 128, GROUND_Y - TILE_SIZE * 9, TILE_SIZE * 8));

  platforms.push(PlatformEntity.createNormal(TILE_SIZE * 140, GROUND_Y - TILE_SIZE * 10, TILE_SIZE * 10));

  return platforms;
};

const createEnemies = (): Enemy[] => {
  const enemies: Enemy[] = [];

  enemies.push(new EnemyEntity(TILE_SIZE * 5, GROUND_Y - TILE_SIZE, 'lavaworm', 'patrol', [
    { x: TILE_SIZE * 2, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 12, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 8, GROUND_Y - TILE_SIZE * 5, 'dragon', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 18, GROUND_Y - TILE_SIZE * 7, 'bee', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 28, GROUND_Y - TILE_SIZE, 'lavaworm', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 32, GROUND_Y - TILE_SIZE * 6, 'dragon', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 38, GROUND_Y - TILE_SIZE * 7, 'slime', 'patrol', [
    { x: TILE_SIZE * 36, y: GROUND_Y - TILE_SIZE * 7 },
    { x: TILE_SIZE * 42, y: GROUND_Y - TILE_SIZE * 7 }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 47, GROUND_Y - TILE_SIZE, 'lavaworm', 'patrol', [
    { x: TILE_SIZE * 45, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 58, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 52, GROUND_Y - TILE_SIZE * 8, 'dragon', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 58, GROUND_Y - TILE_SIZE * 7, 'bee', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 65, GROUND_Y - TILE_SIZE * 6, 'slime', 'patrol', [
    { x: TILE_SIZE * 62, y: GROUND_Y - TILE_SIZE * 6 },
    { x: TILE_SIZE * 72, y: GROUND_Y - TILE_SIZE * 6 }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 75, GROUND_Y - TILE_SIZE, 'lavaworm', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 78, GROUND_Y - TILE_SIZE * 6, 'dragon', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 86, GROUND_Y - TILE_SIZE * 11, 'bee', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 95, GROUND_Y - TILE_SIZE, 'lavaworm', 'patrol', [
    { x: TILE_SIZE * 90, y: GROUND_Y - TILE_SIZE },
    { x: TILE_SIZE * 105, y: GROUND_Y - TILE_SIZE }
  ]));

  enemies.push(new EnemyEntity(TILE_SIZE * 100, GROUND_Y - TILE_SIZE * 8, 'dragon', 'fly'));

  enemies.push(new EnemyEntity(TILE_SIZE * 110, GROUND_Y - TILE_SIZE * 7, 'slime', 'chase'));

  enemies.push(new EnemyEntity(TILE_SIZE * 118, GROUND_Y - TILE_SIZE * 9, 'bee', 'fly'));

  return enemies;
};

const createItems = (): Item[] => {
  const items: Item[] = [];

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 2, GROUND_Y - TILE_SIZE * 3, 8));

  items.push(ItemEntity.createCoin(TILE_SIZE * 17, GROUND_Y - TILE_SIZE * 3));
  items.push(ItemEntity.createCoin(TILE_SIZE * 21, GROUND_Y - TILE_SIZE * 5));
  items.push(ItemEntity.createCoin(TILE_SIZE * 17, GROUND_Y - TILE_SIZE * 7));

  items.push(ItemEntity.createHealth(TILE_SIZE * 23, GROUND_Y - TILE_SIZE * 5));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 29, GROUND_Y - TILE_SIZE * 5, 5));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 33, GROUND_Y - TILE_SIZE * 6, 'speed'));

  items.push(ItemEntity.createCoin(TILE_SIZE * 37, GROUND_Y - TILE_SIZE * 4));
  items.push(ItemEntity.createCoin(TILE_SIZE * 41, GROUND_Y - TILE_SIZE * 6));

  items.push(...ItemEntity.createCoinArc(TILE_SIZE * 47, GROUND_Y - TILE_SIZE * 5, 6));

  items.push(ItemEntity.createHealth(TILE_SIZE * 53, GROUND_Y - TILE_SIZE * 3));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 56, GROUND_Y - TILE_SIZE * 7, 4));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 60, GROUND_Y - TILE_SIZE * 8, 'shield'));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 63, GROUND_Y - TILE_SIZE * 5, 3));
  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 66, GROUND_Y - TILE_SIZE * 7, 3));
  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 69, GROUND_Y - TILE_SIZE * 9, 3));

  items.push(ItemEntity.createHealth(TILE_SIZE * 76, GROUND_Y - TILE_SIZE * 4));

  items.push(ItemEntity.createCoin(TILE_SIZE * 81, GROUND_Y - TILE_SIZE * 6));
  items.push(ItemEntity.createCoin(TILE_SIZE * 85, GROUND_Y - TILE_SIZE * 8));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 89, GROUND_Y - TILE_SIZE * 10, 'invincible'));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 96, GROUND_Y - TILE_SIZE * 8, 7));

  items.push(ItemEntity.createHealth(TILE_SIZE * 103, GROUND_Y - TILE_SIZE * 5));

  items.push(...ItemEntity.createCoinArc(TILE_SIZE * 108, GROUND_Y - TILE_SIZE * 7, 7));

  items.push(ItemEntity.createPowerUp(TILE_SIZE * 115, GROUND_Y - TILE_SIZE * 6, 'power'));

  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 121, GROUND_Y - TILE_SIZE * 8, 6));
  items.push(...ItemEntity.createCoinRow(TILE_SIZE * 129, GROUND_Y - TILE_SIZE * 10, 8));

  items.push(ItemEntity.createHealth(TILE_SIZE * 135, GROUND_Y - TILE_SIZE * 8));
  items.push(ItemEntity.createPowerUp(TILE_SIZE * 142, GROUND_Y - TILE_SIZE * 12, 'invincible'));

  return items;
};

const createObstacles = (): Obstacle[] => {
  const obstacles: Obstacle[] = [];

  for (let i = 0; i < 10; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'lava',
      x: TILE_SIZE * 15 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.3,
      width: TILE_SIZE,
      height: TILE_SIZE * 1.5,
      damage: 2,
      active: true
    });
  }

  for (let i = 0; i < 10; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'lava',
      x: TILE_SIZE * 35 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.3,
      width: TILE_SIZE,
      height: TILE_SIZE * 1.5,
      damage: 2,
      active: true
    });
  }

  for (let i = 0; i < 10; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'lava',
      x: TILE_SIZE * 60 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.3,
      width: TILE_SIZE,
      height: TILE_SIZE * 1.5,
      damage: 2,
      active: true
    });
  }

  for (let i = 0; i < 10; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'lava',
      x: TILE_SIZE * 80 + i * TILE_SIZE,
      y: GROUND_Y - TILE_SIZE * 0.3,
      width: TILE_SIZE,
      height: TILE_SIZE * 1.5,
      damage: 2,
      active: true
    });
  }

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'meteor',
    x: TILE_SIZE * 50,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    damage: 3,
    active: true,
    timer: 0,
    interval: 3000
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'meteor',
    x: TILE_SIZE * 80,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    damage: 3,
    active: true,
    timer: 1500,
    interval: 3500
  });

  obstacles.push({
    type: 'obstacle',
    obstacleType: 'meteor',
    x: TILE_SIZE * 110,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
    damage: 3,
    active: true,
    timer: 750,
    interval: 4000
  });

  for (let i = 0; i < 4; i++) {
    obstacles.push({
      type: 'obstacle',
      obstacleType: 'spike',
      x: TILE_SIZE * 47 + i * TILE_SIZE * 2,
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
      x: TILE_SIZE * 92 + i * TILE_SIZE * 2,
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
    'volcano_lord'
  );
};

export const volcanoLevel: LevelData = {
  id: 2,
  name: '烈焰火山',
  theme: 'volcano',
  width: LEVEL_WIDTH,
  height: LEVEL_HEIGHT,
  spawnPoint: { x: TILE_SIZE, y: GROUND_Y - TILE_SIZE * 3 },
  platforms: createPlatforms(),
  enemies: createEnemies(),
  items: createItems(),
  obstacles: createObstacles(),
  boss: createBoss(),
  bossSpawnPoint: { x: LEVEL_WIDTH - TILE_SIZE * 10, y: GROUND_Y - TILE_SIZE * 6 },
  backgroundColor: COLORS.volcano.bg,
  groundColor: COLORS.volcano.ground,
  accentColor: COLORS.volcano.accent
};

export const volcanoMechanics = {
  gravityMultiplier: 1,
  isIce: false,
  specialMechanic: 'lava' as const,
  description: '火山关卡 - 熔岩会造成持续伤害，利用平台跳跃躲避流星！',
  tips: [
    '熔岩接触即造成2点伤害',
    '红色平台是易碎的，踩上去会倒塌',
    '小心从天而降的陨石',
    '火焰龙会在空中巡逻，注意躲避'
  ]
};
