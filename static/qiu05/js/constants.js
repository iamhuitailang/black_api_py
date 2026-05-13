export const BALL_RADIUS = 15;
export const GRAVITY = 0.15;
export const FRICTION = 0.98;
export const BOUNCE = 0.6;
export const MAX_TILT = 0.8;
export const TILT_SPEED = 0.05;

export const COLORS = {
    ball: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ballStroke: '#5a67d8',
    wall: '#8b5cf6',
    wallStroke: '#7c3aed',
    star: '#fbbf24',
    starGlow: 'rgba(251, 191, 36, 0.4)',
    trap: '#ef4444',
    trapGlow: 'rgba(239, 68, 68, 0.3)',
    end: '#10b981',
    endGlow: 'rgba(16, 185, 129, 0.4)',
    background: '#a8edea',
};

export const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    WIN: 'win',
    COMPLETE: 'complete',
};
