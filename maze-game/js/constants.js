const GameConstants = {
  MAZE_WIDTH: 20,
  MAZE_HEIGHT: 20,
  CELL_SIZE: 32,
  TOTAL_FLOORS: 10,
  PLAYER_LIVES: 3,
  KEYS_PER_FLOOR: 3,
  KEY_COLORS: ['red', 'blue', 'green'],
  VIEW_RADIUS: 2,
  MOVE_ANIMATION_MS: 100,
  GUARD_PATROL_SPEED: 800,
  GUARD_CHASE_SPEED: 400,
  GUARD_CHASE_DURATION: 5000,
  GUARD_VIEW_DISTANCE: 3,
  GUARD_VIEW_ANGLE: Math.PI / 3,
  MAX_GUARDS: 4,
  STORAGE_KEY: 'maze_game_save',
};

const Direction = {
  UP: { x: 0, y: -1, angle: -Math.PI / 2 },
  DOWN: { x: 0, y: 1, angle: Math.PI / 2 },
  LEFT: { x: -1, y: 0, angle: Math.PI },
  RIGHT: { x: 1, y: 0, angle: 0 },
};

const CellType = {
  WALL: 0,
  FLOOR: 1,
  START: 2,
  EXIT: 3,
};

if (typeof window !== 'undefined') {
  window.GameConstants = GameConstants;
  window.Direction = Direction;
  window.CellType = CellType;
}
