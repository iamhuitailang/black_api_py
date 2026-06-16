export interface Ball {
  x: number;
  y: number;
  vy: number;
  radius: number;
  color: string;
  colorIndex: number;
  trail: { x: number; y: number; alpha: number; color: string }[];
}

export interface RingSegment {
  color: string;
  startAngle: number;
  endAngle: number;
}

export interface Ring {
  y: number;
  radius: number;
  thickness: number;
  segments: RingSegment[];
  star?: Star;
  passed: boolean;
  isDouble: boolean;
  rotation: number;
  rotationSpeed: number;
  render(ctx: CanvasRenderingContext2D): void;
  update(speed: number): void;
  isOffScreen(): boolean;
  collectStar(): void;
}

export interface Star {
  x: number;
  y: number;
  collected: boolean;
  rotation: number;
  particles: Particle[];
  render(ctx: CanvasRenderingContext2D): void;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Skin {
  id: string;
  name: string;
  unlockScore: number;
  color: string;
}

export interface GameState {
  status: 'menu' | 'playing' | 'paused' | 'gameover';
  score: number;
  totalScore: number;
  highScore: number;
  lives: number;
  combo: number;
  maxCombo: number;
  frenzyMode: boolean;
  frenzyTimeLeft: number;
  ringsPassed: number;
  gravity: number;
  baseGravity: number;
  ringSpeed: number;
  selectedSkin: string;
  unlockedSkins: string[];
  starsCollected: number;
}

export interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover';
