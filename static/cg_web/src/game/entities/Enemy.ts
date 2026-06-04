import type { Enemy, Vector2, Player, Platform, Obstacle } from '@/types/game';
import { ENEMY_STATS, TILE_SIZE } from '@/utils/constants';
import { generateId, applyGravity, checkPlatformCollision, checkBounds, rectCollision, distance, normalize, randomRange } from '../utils';

export class EnemyEntity implements Enemy {
  id: string;
  type: 'enemy' = 'enemy';
  enemyType: Enemy['enemyType'];
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: Vector2 = { x: 0, y: 0 };
  active: boolean = true;
  facing: 'left' | 'right' | 'up' | 'down' = 'left';

  health: number;
  maxHealth: number;
  damage: number;
  behavior: Enemy['behavior'];
  patrolPoints?: Vector2[];
  currentPatrolIndex?: number;
  attackCooldown: number = 0;

  private speed: number;
  private baseSpeed: number;
  private chaseRange: number = 200;
  private attackRange: number = 50;
  private lastAttackTime: number = 0;
  private isFlying: boolean = false;
  private gravityMultiplier: number = 1;
  private flyBobOffset: number = 0;
  private originalY: number;

  constructor(
    x: number,
    y: number,
    enemyType: Enemy['enemyType'],
    behavior: Enemy['behavior'] = 'patrol',
    patrolPoints?: Vector2[]
  ) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.enemyType = enemyType;
    this.behavior = behavior;
    this.patrolPoints = patrolPoints;
    this.originalY = y;

    const stats = ENEMY_STATS[enemyType] || { health: 2, damage: 1, speed: 2 };
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.damage = stats.damage;
    this.baseSpeed = stats.speed;
    this.speed = stats.speed;

    this.width = TILE_SIZE * 0.8;
    this.height = TILE_SIZE * 0.8;

    if (enemyType === 'bee' || enemyType === 'bat') {
      this.isFlying = true;
      this.height = TILE_SIZE * 0.6;
    }

    if (enemyType === 'giant') {
      this.width = TILE_SIZE * 1.2;
      this.height = TILE_SIZE * 1.5;
    }

    if (enemyType === 'vine' || enemyType === 'turret') {
      this.behavior = 'stationary';
    }

    if (patrolPoints && patrolPoints.length > 0) {
      this.currentPatrolIndex = 0;
    }
  }

  update(
    deltaTime: number,
    player: Player,
    platforms: Platform[],
    obstacles: Obstacle[],
    levelWidth: number,
    levelHeight: number
  ): void {
    if (!this.active) return;

    const now = Date.now();
    const distToPlayer = distance(this, player);

    this.updateAI(deltaTime, player, distToPlayer);

    if (!this.isFlying) {
      applyGravity(this.velocity, false, this.gravityMultiplier);
    } else {
      this.flyBobOffset += deltaTime * 0.003;
      this.velocity.y = Math.sin(this.flyBobOffset) * 0.5;
    }

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    if (!this.isFlying) {
      for (const platform of platforms) {
        if (!platform.active) continue;
        checkPlatformCollision(this, platform);
      }
    }

    checkBounds(this, levelWidth, levelHeight);

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    if (distToPlayer < this.attackRange && now - this.lastAttackTime > 1000) {
      this.attack(player);
      this.lastAttackTime = now;
    }
  }

  private updateAI(deltaTime: number, player: Player, distToPlayer: number): void {
    switch (this.behavior) {
      case 'patrol':
        this.patrolBehavior();
        break;
      case 'chase':
        if (distToPlayer < this.chaseRange) {
          this.chaseBehavior(player);
        } else {
          this.patrolBehavior();
        }
        break;
      case 'fly':
        this.flyBehavior(player, distToPlayer);
        break;
      case 'stationary':
        this.stationaryBehavior(player, distToPlayer);
        break;
    }
  }

  private patrolBehavior(): void {
    if (this.patrolPoints && this.patrolPoints.length > 0 && this.currentPatrolIndex !== undefined) {
      const target = this.patrolPoints[this.currentPatrolIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      } else {
        const dir = normalize({ x: dx, y: dy });
        this.velocity.x = dir.x * this.speed;
        if (this.isFlying) {
          this.velocity.y = dir.y * this.speed;
        }
        this.facing = dx > 0 ? 'right' : 'left';
      }
    } else {
      this.velocity.x = this.facing === 'right' ? this.speed : -this.speed;

      if (this.x <= 0) {
        this.facing = 'right';
      } else if (this.x + this.width >= 800) {
        this.facing = 'left';
      }
    }
  }

  private chaseBehavior(player: Player): void {
    const dx = player.x - this.x;
    this.velocity.x = dx > 0 ? this.speed * 1.5 : -this.speed * 1.5;
    this.facing = dx > 0 ? 'right' : 'left';
  }

  private flyBehavior(player: Player, distToPlayer: number): void {
    if (distToPlayer < this.chaseRange * 1.5) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dir = normalize({ x: dx, y: dy });
      this.velocity.x = dir.x * this.speed;
      this.velocity.y = dir.y * this.speed;
      this.facing = dx > 0 ? 'right' : 'left';
    } else {
      this.velocity.x = Math.sin(Date.now() * 0.001) * this.speed;
      this.facing = this.velocity.x > 0 ? 'right' : 'left';
    }
  }

  private stationaryBehavior(player: Player, distToPlayer: number): void {
    this.velocity.x = 0;
    if (!this.isFlying) {
      this.velocity.y = 0;
    }

    const dx = player.x - this.x;
    this.facing = dx > 0 ? 'right' : 'left';

    if (this.enemyType === 'turret' && distToPlayer < 300) {
      this.attackCooldown = Math.max(this.attackCooldown, 500);
    }
  }

  attack(player: Player): void {
    if (this.attackCooldown > 0) return;

    if (rectCollision(this, player)) {
      this.attackCooldown = 1000;
    }
  }

  takeDamage(amount: number): void {
    if (!this.active) return;

    this.health -= amount;
    this.velocity.x = this.facing === 'right' ? -3 : 3;
    this.velocity.y = -3;

    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
    }
  }

  setGravityMultiplier(multiplier: number): void {
    this.gravityMultiplier = multiplier;
  }

  getScoreValue(): number {
    const scoreMap: Record<string, number> = {
      wolf: 50,
      bee: 30,
      vine: 40,
      slime: 25,
      lavaworm: 60,
      dragon: 100,
      snowball: 35,
      bat: 30,
      giant: 150,
      robot: 80,
      turret: 70,
      blackhole: 500
    };
    return scoreMap[this.enemyType] || 50;
  }

  canShoot(): boolean {
    return (this.enemyType === 'turret' || this.enemyType === 'dragon') && this.attackCooldown <= 0;
  }

  getShootDirection(player: Player): Vector2 {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return normalize({ x: dx, y: dy });
  }
}
