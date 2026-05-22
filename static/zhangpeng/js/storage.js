const Storage = {
  KEY: 'zhangpeng_game_save',

  save(state) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('Storage save failed:', e);
      return false;
    }
  },

  load() {
    try {
      const data = localStorage.getItem(this.KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage load failed:', e);
      return null;
    }
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },

  buildSave(game) {
    return {
      version: 1,
      timestamp: Date.now(),
      player: {
        characterType: game.player.characterType,
        x: game.player.x,
        y: game.player.y,
        vx: game.player.vx,
        vy: game.player.vy,
        hp: game.player.hp,
        maxHp: game.player.maxHp,
        facing: game.player.facing,
        isCrouching: game.player.isCrouching,
        isSprinting: game.player.isSprinting,
        activeEffects: { ...game.player.activeEffects },
        score: game.player.score
      },
      obstacles: game.obstacles.map(o => ({
        type: o.type,
        x: o.x,
        y: o.y,
        vx: o.vx,
        vy: o.vy,
        width: o.width,
        height: o.height,
        rotation: o.rotation || 0,
        rotationSpeed: o.rotationSpeed || 0
      })),
      powerups: game.powerups.map(p => ({
        type: p.type,
        x: p.x,
        y: p.y,
        collected: p.collected
      })),
      camera: { x: game.camera.x },
      gameState: game.gameState,
      stageIndex: game.stageIndex,
      lastObstacleSpawn: game.lastObstacleSpawn,
      lastPowerupSpawn: game.lastPowerupSpawn,
      frame: game.frame,
      spawnedObstacleIds: [...(game.spawnedObstacleIds || [])]
    };
  }
};
