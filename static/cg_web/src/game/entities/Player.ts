import type { Player, KeyboardState, Vector2, Platform, Enemy, Item, Obstacle, Boss } from '@/types/game';
import {
  JUMP_FORCE,
  MOVE_SPEED,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  ATTACK_RANGE,
  ATTACK_COOLDOWN,
  INVINCIBLE_DURATION,
  BOOST_DURATION,
  CHARACTERS,
  BOUNCE_FORCE
} from '@/utils/constants';
import { generateId, applyGravity, applyFriction, checkPlatformCollision, checkBounds, rectCollision, clamp } from '../utils';

export class PlayerEntity implements Player {
  id: string;
  type: 'player' = 'player';
  x: number;
  y: number;
  width: number = PLAYER_WIDTH;
  height: number = PLAYER_HEIGHT;
  velocity: Vector2 = { x: 0, y: 0 };
  active: boolean = true;
  facing: 'left' | 'right' | 'up' | 'down' = 'right';

  characterId: string;
  health: number;
  maxHealth: number;
  speed: number;
  attackPower: number;
  isGrounded: boolean = false;
  isJumping: boolean = false;
  isAttacking: boolean = false;
  attackCooldown: number = 0;
  invincible: boolean = false;
  invincibleTimer: number = 0;
  hasShield: boolean = false;
  speedBoost: boolean = false;
  powerBoost: boolean = false;
  boostTimer: number = 0;
  coins: number = 0;
  score: number = 0;

  private lastAttackTime: number = 0;
  private jumpCount: number = 0;
  private maxJumps: number = 2;
  private isIce: boolean = false;
  private gravityMultiplier: number = 1;

  constructor(x: number, y: number, characterId: string = 'hero') {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.characterId = characterId;

    const charStats = CHARACTERS[characterId] || CHARACTERS.hero;
    this.health = charStats.health;
    this.maxHealth = charStats.health;
    this.speed = charStats.speed;
    this.attackPower = charStats.attack;
  }

  update(
    deltaTime: number,
    input: KeyboardState,
    platforms: Platform[],
    enemies: Enemy[],
    items: Item[],
    obstacles: Obstacle[],
    levelWidth: number,
    levelHeight: number
  ): void {
    if (!this.active) return;

    const now = Date.now();
    const moveSpeed = this.speed * (this.speedBoost ? 1.3 : 1);

    if (input.left) {
      this.velocity.x = -moveSpeed;
      this.facing = 'left';
    } else if (input.right) {
      this.velocity.x = moveSpeed;
      this.facing = 'right';
    }

    if (input.jump && this.jumpCount < this.maxJumps) {
      this.jump();
      input.jump = false;
    }

    if (input.attack && now - this.lastAttackTime > ATTACK_COOLDOWN) {
      this.attack();
      this.lastAttackTime = now;
      input.attack = false;
    }

    applyGravity(this.velocity, this.isIce, this.gravityMultiplier);
    applyFriction(this.velocity, this.isIce);

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.isGrounded = false;
    for (const platform of platforms) {
      if (!platform.active) continue;

      const collision = checkPlatformCollision(this, platform, this.isIce);
      if (collision.fromTop) {
        this.isGrounded = true;
        this.isJumping = false;
        this.jumpCount = 0;

        if (platform.platformType === 'bounce') {
          this.velocity.y = BOUNCE_FORCE;
          this.isGrounded = false;
          this.isJumping = true;
        }

        if (platform.platformType === 'breakable' && platform.breakTimer === undefined) {
          platform.breakTimer = 30;
        }
      }
    }

    checkBounds(this, levelWidth, levelHeight);

    if (this.y > levelHeight) {
      this.takeDamage(1);
      this.respawn(100, 100);
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
      if (this.attackCooldown <= 0) {
        this.isAttacking = false;
      }
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= deltaTime;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    if (this.boostTimer > 0) {
      this.boostTimer -= deltaTime;
      if (this.boostTimer <= 0) {
        this.speedBoost = false;
        this.powerBoost = false;
      }
    }

    this.checkItemCollisions(items);
    this.checkObstacleCollisions(obstacles);
  }

  jump(): void {
    if (this.jumpCount < this.maxJumps) {
      this.velocity.y = JUMP_FORCE * (this.gravityMultiplier < 1 ? 0.6 : 1);
      this.isJumping = true;
      this.isGrounded = false;
      this.jumpCount++;
    }
  }

  attack(): void {
    this.isAttacking = true;
    this.attackCooldown = ATTACK_COOLDOWN;
  }

  getAttackHitbox(): { x: number; y: number; width: number; height: number } {
    const attackX = this.facing === 'right'
      ? this.x + this.width
      : this.x - ATTACK_RANGE;

    return {
      x: attackX,
      y: this.y + this.height / 4,
      width: ATTACK_RANGE,
      height: this.height / 2
    };
  }

  takeDamage(amount: number): void {
    if (this.invincible || !this.active) return;

    if (this.hasShield) {
      this.hasShield = false;
      this.invincible = true;
      this.invincibleTimer = 1000;
      return;
    }

    this.health -= amount;
    this.invincible = true;
    this.invincibleTimer = INVINCIBLE_DURATION;

    this.velocity.x = this.facing === 'right' ? -5 : 5;
    this.velocity.y = -5;

    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
    }
  }

  heal(amount: number): void {
    this.health = clamp(this.health + amount, 0, this.maxHealth);
  }

  collectCoin(amount: number = 1): void {
    this.coins += amount;
    this.score += amount * 10;
  }

  addScore(amount: number): void {
    this.score += amount;
  }

  applyPowerUp(type: 'invincible' | 'speed' | 'power' | 'shield'): void {
    switch (type) {
      case 'invincible':
        this.invincible = true;
        this.invincibleTimer = BOOST_DURATION;
        break;
      case 'speed':
        this.speedBoost = true;
        this.boostTimer = BOOST_DURATION;
        break;
      case 'power':
        this.powerBoost = true;
        this.boostTimer = BOOST_DURATION;
        break;
      case 'shield':
        this.hasShield = true;
        break;
    }
  }

  respawn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.active = true;
  }

  setEnvironment(isIce: boolean = false, gravityMultiplier: number = 1): void {
    this.isIce = isIce;
    this.gravityMultiplier = gravityMultiplier;
  }

  private checkItemCollisions(items: Item[]): void {
    for (const item of items) {
      if (item.collected || !item.active) continue;

      if (rectCollision(this, item)) {
        this.collectItem(item);
      }
    }
  }

  private checkObstacleCollisions(obstacles: Obstacle[]): void {
    for (const obstacle of obstacles) {
      if (!obstacle.active) continue;

      if (rectCollision(this, obstacle)) {
        this.takeDamage(obstacle.damage);
      }
    }
  }

  private collectItem(item: Item): void {
    item.collected = true;
    item.active = false;

    switch (item.itemType) {
      case 'coin':
        this.collectCoin(item.value);
        break;
      case 'health':
        this.heal(item.value);
        break;
      case 'invincible':
      case 'speed':
      case 'power':
      case 'shield':
        this.applyPowerUp(item.itemType);
        break;
    }
  }

  getCurrentAttackPower(): number {
    return this.attackPower * (this.powerBoost ? 2 : 1);
  }

  isRanged(): boolean {
    return CHARACTERS[this.characterId]?.ranged ?? false;
  }
}
