import type { Boss, BossPattern, Vector2, Player, Platform, Projectile } from '@/types/game';
import { BOSS_STATS, TILE_SIZE } from '@/utils/constants';
import { generateId, applyGravity, checkPlatformCollision, checkBounds, distance, normalize, randomRange } from '../utils';

export class BossEntity implements Boss {
  id: string;
  type: 'boss' = 'boss';
  bossType: Boss['bossType'];
  name: string;
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
  phase: number = 1;
  attackPattern: number = 0;
  attackTimer: number = 0;
  patterns: BossPattern[];

  private baseSpeed: number = 2;
  private moveSpeed: number = 2;
  private phaseThresholds: number[] = [0.66, 0.33];
  private lastPatternChange: number = 0;
  private patternChangeInterval: number = 3000;
  private isEnraged: boolean = false;
  private gravityMultiplier: number = 1;
  private originalX: number;
  private originalY: number;
  private moveDirection: number = 1;
  private projectiles: Projectile[] = [];

  constructor(
    x: number,
    y: number,
    bossType: Boss['bossType']
  ) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.originalY = y;
    this.bossType = bossType;

    const stats = BOSS_STATS[bossType] || { name: 'Boss', health: 30, damage: 2 };
    this.name = stats.name;
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.damage = stats.damage;

    this.width = TILE_SIZE * 2.5;
    this.height = TILE_SIZE * 3;

    if (bossType === 'forest_king') {
      this.patterns = this.createForestKingPatterns();
    } else if (bossType === 'volcano_lord') {
      this.patterns = this.createVolcanoLordPatterns();
    } else if (bossType === 'ice_queen') {
      this.patterns = this.createIceQueenPatterns();
    } else {
      this.patterns = this.createSpaceEmperorPatterns();
    }
  }

  private createForestKingPatterns(): BossPattern[] {
    return [
      { name: 'vine_slam', duration: 1500, damage: 2 },
      { name: 'root_spike', duration: 2000, damage: 1, projectile: true },
      { name: 'summon_vines', duration: 3000, damage: 0 }
    ];
  }

  private createVolcanoLordPatterns(): BossPattern[] {
    return [
      { name: 'fire_breath', duration: 2000, damage: 3, projectile: true },
      { name: 'lava_pools', duration: 2500, damage: 2 },
      { name: 'meteor_shower', duration: 3500, damage: 2, projectile: true }
    ];
  }

  private createIceQueenPatterns(): BossPattern[] {
    return [
      { name: 'ice_spike', duration: 1500, damage: 2, projectile: true },
      { name: 'blizzard', duration: 3000, damage: 1 },
      { name: 'freeze_trap', duration: 2500, damage: 2 }
    ];
  }

  private createSpaceEmperorPatterns(): BossPattern[] {
    return [
      { name: 'laser_beam', duration: 2000, damage: 3, projectile: true },
      { name: 'black_hole', duration: 4000, damage: 1 },
      { name: 'asteroid_rain', duration: 3000, damage: 2, projectile: true },
      { name: 'gravity_flip', duration: 2000, damage: 0 }
    ];
  }

  update(
    deltaTime: number,
    player: Player,
    platforms: Platform[],
    levelWidth: number,
    levelHeight: number
  ): void {
    if (!this.active) return;

    const now = Date.now();
    const distToPlayer = distance(this, player);

    this.updatePhase();

    if (now - this.lastPatternChange > this.patternChangeInterval) {
      this.nextAttackPattern();
      this.lastPatternChange = now;
    }

    this.attackTimer -= deltaTime;

    this.updateMovement(deltaTime, player, distToPlayer);

    applyGravity(this.velocity, false, this.gravityMultiplier);

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    for (const platform of platforms) {
      if (!platform.active) continue;
      checkPlatformCollision(this, platform);
    }

    checkBounds(this, levelWidth, levelHeight);

    this.updateProjectiles(deltaTime, levelWidth, levelHeight);
  }

  private updatePhase(): void {
    const healthPercent = this.health / this.maxHealth;

    if (healthPercent <= this.phaseThresholds[1] && this.phase < 3) {
      this.phase = 3;
      this.isEnraged = true;
      this.moveSpeed = this.baseSpeed * 1.5;
      this.patternChangeInterval = 2000;
    } else if (healthPercent <= this.phaseThresholds[0] && this.phase < 2) {
      this.phase = 2;
      this.moveSpeed = this.baseSpeed * 1.2;
      this.patternChangeInterval = 2500;
    }
  }

  private nextAttackPattern(): void {
    this.attackPattern = (this.attackPattern + 1) % this.patterns.length;
    this.attackTimer = this.patterns[this.attackPattern].duration;
  }

  private updateMovement(deltaTime: number, player: Player, distToPlayer: number): void {
    const currentPattern = this.patterns[this.attackPattern];

    if (currentPattern.name.includes('summon') || currentPattern.name.includes('blizzard') || currentPattern.name.includes('black_hole')) {
      this.velocity.x = 0;
      return;
    }

    const dx = player.x - this.x;
    this.facing = dx > 0 ? 'right' : 'left';

    if (distToPlayer > 150) {
      this.velocity.x = (dx > 0 ? 1 : -1) * this.moveSpeed;
    } else if (distToPlayer < 100) {
      this.velocity.x = (dx > 0 ? -1 : 1) * this.moveSpeed * 0.5;
    } else {
      this.velocity.x *= 0.9;
    }

    if (this.bossType === 'space_emperor' && currentPattern.name === 'gravity_flip') {
      this.velocity.y = -5;
    }
  }

  private updateProjectiles(deltaTime: number, levelWidth: number, levelHeight: number): void {
    this.projectiles = this.projectiles.filter(p => {
      p.x += p.velocity.x;
      p.y += p.velocity.y;
      p.lifetime -= deltaTime;

      if (p.x < 0 || p.x > levelWidth || p.y < 0 || p.y > levelHeight || p.lifetime <= 0) {
        return false;
      }
      return true;
    });
  }

  attack(player: Player): Projectile | null {
    if (this.attackTimer > 0) return null;

    const currentPattern = this.patterns[this.attackPattern];
    this.attackTimer = currentPattern.duration;

    if (currentPattern.projectile) {
      return this.createProjectile(player);
    }

    return null;
  }

  private createProjectile(player: Player): Projectile {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dir = normalize({ x: dx, y: dy });

    const projectile: Projectile = {
      id: generateId(),
      type: 'projectile',
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      width: 16,
      height: 16,
      velocity: { x: dir.x * 6, y: dir.y * 6 },
      active: true,
      facing: this.facing,
      damage: this.patterns[this.attackPattern].damage,
      owner: 'boss',
      lifetime: 5000
    };

    this.projectiles.push(projectile);
    return projectile;
  }

  getProjectiles(): Projectile[] {
    return [...this.projectiles];
  }

  clearProjectiles(): void {
    this.projectiles = [];
  }

  takeDamage(amount: number): void {
    if (!this.active) return;

    this.health -= amount;
    this.velocity.x = this.facing === 'right' ? -3 : 3;
    this.velocity.y = -2;

    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
      this.clearProjectiles();
    }
  }

  setGravityMultiplier(multiplier: number): void {
    this.gravityMultiplier = multiplier;
  }

  getCurrentPattern(): BossPattern {
    return this.patterns[this.attackPattern];
  }

  getPhaseMultiplier(): number {
    return 1 + (this.phase - 1) * 0.2;
  }

  getScoreValue(): number {
    const scoreMap: Record<string, number> = {
      forest_king: 1000,
      volcano_lord: 1500,
      ice_queen: 1500,
      space_emperor: 2000
    };
    return scoreMap[this.bossType] || 1000;
  }

  reset(): void {
    this.x = this.originalX;
    this.y = this.originalY;
    this.health = this.maxHealth;
    this.phase = 1;
    this.attackPattern = 0;
    this.attackTimer = 0;
    this.active = true;
    this.isEnraged = false;
    this.moveSpeed = this.baseSpeed;
    this.patternChangeInterval = 3000;
    this.velocity = { x: 0, y: 0 };
    this.clearProjectiles();
  }

  getSpecialAttackData(): { type: string; position: Vector2; radius?: number } | null {
    const currentPattern = this.patterns[this.attackPattern];

    if (this.attackTimer > currentPattern.duration - 500 && this.attackTimer < currentPattern.duration - 200) {
      if (currentPattern.name === 'root_spike') {
        return {
          type: 'root_spike',
          position: { x: this.x + (this.facing === 'right' ? 100 : -100), y: this.y },
          radius: 50
        };
      }
      if (currentPattern.name === 'lava_pools') {
        return {
          type: 'lava_pools',
          position: { x: this.x + randomRange(-150, 150), y: this.y + 100 },
          radius: 60
        };
      }
      if (currentPattern.name === 'freeze_trap') {
        return {
          type: 'freeze_trap',
          position: { x: this.x + (this.facing === 'right' ? 80 : -80), y: this.y + 50 },
          radius: 40
        };
      }
    }

    return null;
  }
}
