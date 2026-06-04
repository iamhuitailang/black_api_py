import type { Player, Enemy, Boss, Item, Platform, Obstacle, Projectile, LevelData, KeyboardState, Vector2, Rect } from '@/types/game';
import { GRAVITY, FRICTION, ICE_FRICTION, BOUNCE_FORCE, JUMP_FORCE, MOVE_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, ATTACK_COOLDOWN, INVINCIBLE_DURATION, BOOST_DURATION, ENEMY_STATS, CHARACTERS } from '@/utils/constants';
import { clamp, lerp, rectIntersects, getCollisionSide, generateId, randomRange } from '@/utils/helpers';

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'dust' | 'hit' | 'coin' | 'damage' | 'death' | 'jump';
}

export interface GameEngineOptions {
  onPlayerDamage?: (damage: number) => void;
  onPlayerDeath?: () => void;
  onEnemyDeath?: (enemy: Enemy) => void;
  onBossDeath?: (boss: Boss) => void;
  onItemCollected?: (item: Item) => void;
  onVictory?: () => void;
  onGameOver?: () => void;
  onCameraUpdate?: (x: number, y: number) => void;
}

export class GameEngine {
  private level: LevelData | null = null;
  private player: Player | null = null;
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private items: Item[] = [];
  private platforms: Platform[] = [];
  private obstacles: Obstacle[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private keys: KeyboardState;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private gameTime: number = 0;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private isVictory: boolean = false;
  private options: GameEngineOptions;

  constructor(keys: KeyboardState, options: GameEngineOptions = {}) {
    this.keys = keys;
    this.options = options;
  }

  loadLevel(level: LevelData, characterId: string): void {
    this.level = level;
    this.platforms = JSON.parse(JSON.stringify(level.platforms));
    this.enemies = JSON.parse(JSON.stringify(level.enemies));
    this.items = JSON.parse(JSON.stringify(level.items));
    this.obstacles = JSON.parse(JSON.stringify(level.obstacles));
    this.boss = level.boss ? JSON.parse(JSON.stringify(level.boss)) : null;
    this.projectiles = [];
    this.particles = [];
    this.cameraX = 0;
    this.cameraY = 0;
    this.gameTime = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.isPaused = false;

    const charStats = CHARACTERS[characterId] || CHARACTERS.hero;
    this.player = {
      id: 'player',
      type: 'player',
      x: level.spawnPoint.x,
      y: level.spawnPoint.y,
      width: 28,
      height: 36,
      velocity: { x: 0, y: 0 },
      active: true,
      facing: 'right',
      characterId,
      health: charStats.health,
      maxHealth: charStats.health,
      speed: charStats.speed,
      attackPower: charStats.attack,
      isGrounded: false,
      isJumping: false,
      isAttacking: false,
      attackCooldown: 0,
      invincible: false,
      invincibleTimer: 0,
      hasShield: false,
      speedBoost: false,
      powerBoost: false,
      boostTimer: 0,
      coins: 0,
      score: 0
    };

    this.options.onCameraUpdate?.(this.cameraX, this.cameraY);
  }

  start(): void {
    this.isPaused = false;
    this.gameTime = 0;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.isPaused = true;
  }

  update(delta: number): void {
    if (!this.player || !this.level) return;

    this.gameTime += delta;

    this.updatePlayer(delta);
    this.updateEnemies(delta);
    this.updateBoss(delta);
    this.updateProjectiles(delta);
    this.updateItems(delta);
    this.updatePlatforms(delta);
    this.updateObstacles(delta);
    this.updateParticles(delta);
    this.checkCollisions();
    this.updateCamera();

    if (this.boss && this.boss.health <= 0 && !this.isVictory) {
      this.isVictory = true;
      this.options.onBossDeath?.(this.boss);
      this.options.onVictory?.();
    }

    if (this.player.health <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.options.onPlayerDeath?.();
      this.options.onGameOver?.();
    }
  }

  private updatePlayer(delta: number): void {
    if (!this.player) return;

    const dt = delta / 16.67;
    let speed = this.player.speedBoost ? MOVE_SPEED * 1.3 : MOVE_SPEED;
    speed *= (this.player.speed / 5);

    if (this.keys.left) {
      this.player.velocity.x = -speed;
      this.player.facing = 'left';
    } else if (this.keys.right) {
      this.player.velocity.x = speed;
      this.player.facing = 'right';
    } else {
      this.player.velocity.x *= FRICTION;
      if (Math.abs(this.player.velocity.x) < 0.1) {
        this.player.velocity.x = 0;
      }
    }

    if (this.keys.jump && this.player.isGrounded && !this.player.isJumping) {
      this.player.velocity.y = JUMP_FORCE;
      this.player.isGrounded = false;
      this.player.isJumping = true;
      this.spawnJumpParticles();
    }

    if (!this.keys.jump && this.player.isJumping) {
      this.player.isJumping = false;
    }

    if (this.keys.attack && this.player.attackCooldown <= 0) {
      this.player.isAttacking = true;
      this.player.attackCooldown = ATTACK_COOLDOWN;
      this.performAttack();
    }

    if (this.player.attackCooldown > 0) {
      this.player.attackCooldown -= delta;
      if (this.player.attackCooldown <= ATTACK_COOLDOWN * 0.7) {
        this.player.isAttacking = false;
      }
    }

    if (this.player.invincible) {
      this.player.invincibleTimer -= delta;
      if (this.player.invincibleTimer <= 0) {
        this.player.invincible = false;
      }
    }

    if (this.player.speedBoost || this.player.powerBoost) {
      this.player.boostTimer -= delta;
      if (this.player.boostTimer <= 0) {
        this.player.speedBoost = false;
        this.player.powerBoost = false;
      }
    }

    this.player.velocity.y += GRAVITY * dt;
    this.player.velocity.y = clamp(this.player.velocity.y, -20, 20);

    this.player.x += this.player.velocity.x * dt;
    this.player.y += this.player.velocity.y * dt;

    this.player.isGrounded = false;

    if (this.level) {
      this.player.x = clamp(this.player.x, 0, this.level.width - this.player.width);
      if (this.player.y > this.level.height + 100) {
        this.damagePlayer(999);
      }
    }
  }

  private updateEnemies(delta: number): void {
    const dt = delta / 16.67;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const stats = ENEMY_STATS[enemy.enemyType];
      if (!stats) continue;

      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= delta;
      }

      switch (enemy.behavior) {
        case 'patrol':
          this.updatePatrolEnemy(enemy, dt, stats);
          break;
        case 'chase':
          this.updateChaseEnemy(enemy, dt, stats);
          break;
        case 'fly':
          this.updateFlyEnemy(enemy, dt, stats);
          break;
        case 'stationary':
          this.updateStationaryEnemy(enemy, dt, stats);
          break;
      }

      enemy.velocity.y += GRAVITY * dt * 0.5;
      enemy.x += enemy.velocity.x * dt;
      enemy.y += enemy.velocity.y * dt;
    }

    this.enemies = this.enemies.filter(e => e.active && e.health > 0);
  }

  private updatePatrolEnemy(enemy: Enemy, dt: number, stats: { speed: number }): void {
    if (enemy.patrolPoints && enemy.patrolPoints.length > 1) {
      const currentTarget = enemy.patrolPoints[enemy.currentPatrolIndex || 0];
      const dx = currentTarget.x - enemy.x;

      if (Math.abs(dx) < 5) {
        enemy.currentPatrolIndex = ((enemy.currentPatrolIndex || 0) + 1) % enemy.patrolPoints.length;
      } else {
        enemy.velocity.x = Math.sign(dx) * stats.speed;
        enemy.facing = dx > 0 ? 'right' : 'left';
      }
    } else {
      enemy.velocity.x *= 0.9;
    }
  }

  private updateChaseEnemy(enemy: Enemy, dt: number, stats: { speed: number }): void {
    if (!this.player) return;

    const dx = this.player.x - enemy.x;
    const dist = Math.abs(dx);

    if (dist < 300 && dist > 5) {
      enemy.velocity.x = Math.sign(dx) * stats.speed;
      enemy.facing = dx > 0 ? 'right' : 'left';
    } else {
      enemy.velocity.x *= 0.9;
    }
  }

  private updateFlyEnemy(enemy: Enemy, dt: number, stats: { speed: number }): void {
    if (!this.player) return;

    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 400 && dist > 10) {
      enemy.velocity.x = (dx / dist) * stats.speed;
      enemy.velocity.y = (dy / dist) * stats.speed;
      enemy.facing = dx > 0 ? 'right' : 'left';
    } else {
      enemy.velocity.x *= 0.95;
      enemy.velocity.y *= 0.95;
    }

    if (enemy.attackCooldown <= 0 && dist < 250) {
      this.enemyShoot(enemy);
      enemy.attackCooldown = 2000;
    }
  }

  private updateStationaryEnemy(enemy: Enemy, dt: number, stats: { speed: number }): void {
    if (!this.player) return;

    enemy.velocity.x = 0;
    enemy.velocity.y = 0;

    const dx = this.player.x - enemy.x;
    enemy.facing = dx > 0 ? 'right' : 'left';

    if (enemy.enemyType === 'turret' && enemy.attackCooldown <= 0 && Math.abs(dx) < 400) {
      this.enemyShoot(enemy);
      enemy.attackCooldown = 1500;
    }
  }

  private updateBoss(delta: number): void {
    if (!this.boss || !this.player) return;

    const dt = delta / 16.67;
    this.boss.attackTimer -= delta;

    const dx = this.player.x - this.boss.x;
    this.boss.facing = dx > 0 ? 'right' : 'left';

    if (this.boss.health < this.boss.maxHealth * 0.5 && this.boss.phase === 1) {
      this.boss.phase = 2;
    }

    if (this.boss.attackTimer <= 0) {
      this.boss.attackPattern = (this.boss.attackPattern + 1) % this.boss.patterns.length;
      const pattern = this.boss.patterns[this.boss.attackPattern];
      this.boss.attackTimer = pattern.duration;

      if (pattern.projectile) {
        this.bossShoot();
      }
    }

    const speed = this.boss.phase === 2 ? 2 : 1.2;
    if (Math.abs(dx) > 100) {
      this.boss.velocity.x = Math.sign(dx) * speed;
    } else {
      this.boss.velocity.x *= 0.9;
    }

    this.boss.velocity.y += GRAVITY * dt * 0.3;
    this.boss.x += this.boss.velocity.x * dt;
    this.boss.y += this.boss.velocity.y * dt;
  }

  private updateProjectiles(delta: number): void {
    const dt = delta / 16.67;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.lifetime -= delta;

      if (proj.lifetime <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      proj.x += proj.velocity.x * dt;
      proj.y += proj.velocity.y * dt;

      if (this.level && (proj.x < -50 || proj.x > this.level.width + 50 || proj.y > this.level.height + 100)) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateItems(delta: number): void {
    for (const item of this.items) {
      if (item.collected) continue;
      item.bobOffset = Math.sin(this.gameTime * 0.003 + item.x * 0.1) * 3;
    }
    this.items = this.items.filter(i => !i.collected);
  }

  private updatePlatforms(delta: number): void {
    const dt = delta / 16.67;

    for (const platform of this.platforms) {
      if (!platform.active) continue;

      if (platform.platformType === 'moving' && platform.moveDirection && platform.moveRange && platform.originalPosition) {
        platform.x += platform.moveDirection.x * platform.moveRange * 0.02 * dt;
        platform.y += platform.moveDirection.y * platform.moveRange * 0.02 * dt;

        const dist = Math.sqrt(
          Math.pow(platform.x - platform.originalPosition.x, 2) +
          Math.pow(platform.y - platform.originalPosition.y, 2)
        );

        if (dist >= platform.moveRange) {
          platform.moveDirection.x *= -1;
          platform.moveDirection.y *= -1;
        }
      }

      if (platform.platformType === 'breakable' && platform.breakTimer !== undefined && platform.breakTimer > 0) {
        platform.breakTimer -= delta;
        if (platform.breakTimer <= 0) {
          platform.active = false;
        }
      }
    }
  }

  private updateObstacles(delta: number): void {
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;

      if (obstacle.timer !== undefined && obstacle.interval) {
        obstacle.timer -= delta;
        if (obstacle.timer <= 0) {
          obstacle.active = !obstacle.active;
          obstacle.timer = obstacle.interval;
        }
      }
    }
  }

  private updateParticles(delta: number): void {
    const dt = delta / 16.67;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.2 * dt;
    }
  }

  private checkCollisions(): void {
    if (!this.player || !this.level) return;

    this.checkPlatformCollisions(this.player);

    for (const platform of this.platforms) {
      if (!platform.active) continue;
      this.checkPlatformCollision(this.player, platform);
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      this.checkPlatformCollisions(enemy);
      for (const platform of this.platforms) {
        if (!platform.active) continue;
        this.checkPlatformCollision(enemy, platform);
      }
    }

    if (this.boss) {
      this.checkPlatformCollisions(this.boss);
      for (const platform of this.platforms) {
        if (!platform.active) continue;
        this.checkPlatformCollision(this.boss, platform);
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (rectIntersects(this.player, enemy)) {
        this.damagePlayer(enemy.damage);
        this.knockbackPlayer(enemy.x < this.player.x ? 1 : -1);
      }
    }

    if (this.boss && rectIntersects(this.player, this.boss)) {
      this.damagePlayer(this.boss.damage);
      this.knockbackPlayer(this.boss.x < this.player.x ? 1 : -1);
    }

    for (const item of this.items) {
      if (item.collected) continue;
      const itemRect = { ...item, y: item.y + item.bobOffset };
      if (rectIntersects(this.player, itemRect)) {
        this.collectItem(item);
      }
    }

    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;
      if (rectIntersects(this.player, obstacle)) {
        this.damagePlayer(obstacle.damage);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      if (proj.owner === 'player') {
        for (const enemy of this.enemies) {
          if (!enemy.active) continue;
          if (rectIntersects(proj, enemy)) {
            this.damageEnemy(enemy, proj.damage);
            this.projectiles.splice(i, 1);
            break;
          }
        }
        if (this.boss && rectIntersects(proj, this.boss)) {
          this.damageBoss(proj.damage);
          this.projectiles.splice(i, 1);
        }
      } else {
        if (rectIntersects(proj, this.player)) {
          this.damagePlayer(proj.damage);
          this.projectiles.splice(i, 1);
        }
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (this.player.isAttacking && this.isInAttackRange(this.player, enemy)) {
        const damage = this.player.attackPower * (this.player.powerBoost ? 2 : 1);
        this.damageEnemy(enemy, damage);
        this.spawnHitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
      }
    }

    if (this.boss && this.player.isAttacking && this.isInAttackRange(this.player, this.boss)) {
      const damage = this.player.attackPower * (this.player.powerBoost ? 2 : 1);
      this.damageBoss(damage);
      this.spawnHitParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2);
    }
  }

  private checkPlatformCollisions(entity: Player | Enemy | Boss): void {
    if (!this.level) return;
    const groundY = this.level.height - TILE_SIZE;

    if (entity.y + entity.height >= groundY && entity.velocity.y >= 0) {
      entity.y = groundY - entity.height;
      entity.velocity.y = 0;
      if (entity.type === 'player') {
        entity.isGrounded = true;
      }
    }
  }

  private checkPlatformCollision(entity: Player | Enemy | Boss, platform: Platform): void {
    if (!rectIntersects(entity, platform)) return;

    const side = getCollisionSide(entity, platform, entity.velocity.y);

    switch (side) {
      case 'top':
        if (entity.velocity.y > 0) {
          entity.y = platform.y - entity.height;
          entity.velocity.y = 0;
          if (entity.type === 'player') {
            entity.isGrounded = true;
            if (platform.platformType === 'breakable' && platform.breakTimer === undefined) {
              platform.breakTimer = 500;
            }
            if (platform.platformType === 'bounce') {
              entity.velocity.y = BOUNCE_FORCE;
              entity.isGrounded = false;
              this.spawnJumpParticles();
            }
            if (platform.platformType === 'ice') {
              entity.velocity.x *= ICE_FRICTION;
            }
          }
        }
        break;
      case 'bottom':
        if (entity.velocity.y < 0) {
          entity.y = platform.y + platform.height;
          entity.velocity.y = 0;
        }
        break;
      case 'left':
        entity.x = platform.x - entity.width;
        entity.velocity.x = 0;
        break;
      case 'right':
        entity.x = platform.x + platform.width;
        entity.velocity.x = 0;
        break;
    }
  }

  private isInAttackRange(player: Player, target: Rect): boolean {
    const attackX = player.facing === 'right' ? player.x + player.width : player.x - 40;
    const attackRect = {
      x: attackX,
      y: player.y,
      width: 40,
      height: player.height
    };
    return rectIntersects(attackRect, target);
  }

  private performAttack(): void {
    if (!this.player) return;

    if (CHARACTERS[this.player.characterId]?.ranged) {
      const proj: Projectile = {
        id: generateId(),
        type: 'projectile',
        x: this.player.facing === 'right' ? this.player.x + this.player.width : this.player.x - 8,
        y: this.player.y + this.player.height / 2 - 4,
        width: 12,
        height: 8,
        velocity: { x: this.player.facing === 'right' ? 10 : -10, y: 0 },
        active: true,
        facing: this.player.facing,
        damage: this.player.attackPower * (this.player.powerBoost ? 2 : 1),
        owner: 'player',
        lifetime: 3000
      };
      this.projectiles.push(proj);
    }
  }

  private enemyShoot(enemy: Enemy): void {
    if (!this.player) return;

    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const proj: Projectile = {
      id: generateId(),
      type: 'projectile',
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
      width: 10,
      height: 10,
      velocity: { x: (dx / dist) * 6, y: (dy / dist) * 6 },
      active: true,
      facing: dx > 0 ? 'right' : 'left',
      damage: enemy.damage,
      owner: 'enemy',
      lifetime: 5000
    };
    this.projectiles.push(proj);
  }

  private bossShoot(): void {
    if (!this.boss || !this.player) return;

    const angles = this.boss.phase === 2 ? [-0.3, -0.15, 0, 0.15, 0.3] : [-0.2, 0, 0.2];

    for (const angleOffset of angles) {
      const dx = this.player.x - this.boss.x;
      const dy = this.player.y - this.boss.y;
      const angle = Math.atan2(dy, dx) + angleOffset;

      const proj: Projectile = {
        id: generateId(),
        type: 'projectile',
        x: this.boss.x + this.boss.width / 2,
        y: this.boss.y + this.boss.height / 2,
        width: 16,
        height: 16,
        velocity: { x: Math.cos(angle) * 5, y: Math.sin(angle) * 5 },
        active: true,
        facing: dx > 0 ? 'right' : 'left',
        damage: this.boss.damage,
        owner: 'boss',
        lifetime: 6000
      };
      this.projectiles.push(proj);
    }
  }

  private damagePlayer(damage: number): void {
    if (!this.player || this.player.invincible) return;

    if (this.player.hasShield) {
      this.player.hasShield = false;
      this.player.invincible = true;
      this.player.invincibleTimer = INVINCIBLE_DURATION * 0.5;
      return;
    }

    this.player.health -= damage;
    this.player.invincible = true;
    this.player.invincibleTimer = INVINCIBLE_DURATION;
    this.options.onPlayerDamage?.(damage);

    this.spawnDamageParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
  }

  private damageEnemy(enemy: Enemy, damage: number): void {
    enemy.health -= damage;
    if (enemy.health <= 0) {
      enemy.active = false;
      this.player!.score += 100;
      this.options.onEnemyDeath?.(enemy);
      this.spawnDeathParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    }
  }

  private damageBoss(damage: number): void {
    if (!this.boss) return;
    this.boss.health -= damage;
    this.player!.score += 50;
  }

  private knockbackPlayer(direction: number): void {
    if (!this.player) return;
    this.player.velocity.x = direction * 8;
    this.player.velocity.y = -6;
    this.player.isGrounded = false;
  }

  private collectItem(item: Item): void {
    if (!this.player) return;

    item.collected = true;

    switch (item.itemType) {
      case 'coin':
        this.player.coins += item.value;
        this.player.score += item.value * 10;
        this.spawnCoinParticles(item.x + item.width / 2, item.y + item.height / 2);
        break;
      case 'health':
        this.player.health = Math.min(this.player.health + item.value, this.player.maxHealth);
        break;
      case 'invincible':
        this.player.invincible = true;
        this.player.invincibleTimer = INVINCIBLE_DURATION;
        break;
      case 'speed':
        this.player.speedBoost = true;
        this.player.boostTimer = BOOST_DURATION;
        break;
      case 'power':
        this.player.powerBoost = true;
        this.player.boostTimer = BOOST_DURATION;
        break;
      case 'shield':
        this.player.hasShield = true;
        break;
    }

    this.options.onItemCollected?.(item);
  }

  private updateCamera(): void {
    if (!this.player || !this.level) return;

    const targetX = this.player.x + this.player.width / 2 - CANVAS_WIDTH / 2;
    const targetY = this.player.y + this.player.height / 2 - CANVAS_HEIGHT / 2;

    this.cameraX = lerp(this.cameraX, targetX, 0.1);
    this.cameraY = lerp(this.cameraY, targetY, 0.1);

    this.cameraX = clamp(this.cameraX, 0, Math.max(0, this.level.width - CANVAS_WIDTH));
    this.cameraY = clamp(this.cameraY, 0, Math.max(0, this.level.height - CANVAS_HEIGHT));

    this.options.onCameraUpdate?.(this.cameraX, this.cameraY);
  }

  private spawnJumpParticles(): void {
    if (!this.player) return;
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        id: generateId(),
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height,
        vx: randomRange(-2, 2),
        vy: randomRange(-1, 1),
        life: 300,
        maxLife: 300,
        color: '#8b7355',
        size: randomRange(2, 4),
        type: 'dust'
      });
    }
  }

  private spawnHitParticles(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        id: generateId(),
        x,
        y,
        vx: randomRange(-4, 4),
        vy: randomRange(-4, 4),
        life: 400,
        maxLife: 400,
        color: '#ffcc00',
        size: randomRange(3, 6),
        type: 'hit'
      });
    }
  }

  private spawnCoinParticles(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        id: generateId(),
        x,
        y,
        vx: randomRange(-3, 3),
        vy: randomRange(-5, -2),
        life: 500,
        maxLife: 500,
        color: '#ffd700',
        size: randomRange(2, 4),
        type: 'coin'
      });
    }
  }

  private spawnDamageParticles(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        id: generateId(),
        x,
        y,
        vx: randomRange(-5, 5),
        vy: randomRange(-5, 5),
        life: 600,
        maxLife: 600,
        color: '#ff0000',
        size: randomRange(3, 6),
        type: 'damage'
      });
    }
  }

  private spawnDeathParticles(x: number, y: number): void {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        id: generateId(),
        x,
        y,
        vx: randomRange(-6, 6),
        vy: randomRange(-8, -2),
        life: 800,
        maxLife: 800,
        color: ['#ff4444', '#ff8844', '#ffcc44'][Math.floor(Math.random() * 3)],
        size: randomRange(4, 8),
        type: 'death'
      });
    }
  }

  getState() {
    return {
      player: this.player,
      enemies: this.enemies,
      boss: this.boss,
      items: this.items,
      platforms: this.platforms,
      obstacles: this.obstacles,
      projectiles: this.projectiles,
      particles: this.particles,
      cameraX: this.cameraX,
      cameraY: this.cameraY,
      gameTime: this.gameTime,
      level: this.level,
      isPaused: this.isPaused
    };
  }

  getPlayer(): Player | null {
    return this.player;
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getGameTime(): number {
    return this.gameTime;
  }
}
