window.SIQIU = window.SIQIU || {};

SIQIU.Physics = {
  createBall(config) {
    return {
      x: config.x,
      y: config.y,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      r: config.r,
      state: 'idle',
      angle: 0,
      power: 1,
      curveAmount: 0,
      type: 'flat',
      spin: 0,
      trail: []
    };
  },

  shoot(ball, shotType, character, angleDeg, power, stadium) {
    const cfg = SIQIU.GAME_CONFIG;
    const stats = character.stats;
    const angle = SIQIU.Utils.deg2rad(angleDeg);
    const baseSpeed = shotType.baseSpeed * stats.power * power;
    const dirX = Math.sin(angle);
    const dirY = -Math.abs(Math.cos(angle));
    ball.vx = dirX * baseSpeed;
    ball.vy = dirY * baseSpeed;
    ball.vz = shotType.lift * 8 * power;
    ball.angle = angleDeg;
    ball.power = power;
    ball.curveAmount = shotType.curve * stats.curve * 0.18;
    ball.spin = -dirX * shotType.curve * stats.curve * 0.22;
    ball.type = shotType.id;
    ball.state = 'flying';
    ball.wind = (stadium.wind || 0) * (Math.random() > 0.5 ? 1 : -1);
    ball.friction = stadium.friction || 0.985;
    ball.trail = [];
  },

  update(ball, dt) {
    if (ball.state !== 'flying') return;
    const step = dt || 1;
    for (let i = 0; i < step; i++) {
      ball.vy *= ball.friction;
      if (ball.type === 'lob') {
        ball.vx += ball.spin * 0.15;
      } else if (ball.type === 'volley') {
        ball.vx += ball.spin * 0.06;
      } else {
        ball.vx += ball.spin * 0.02;
      }
      if (ball.wind) ball.vx += ball.wind * 0.02;
      ball.vz -= 0.4;
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.z += ball.vz;
      if (ball.z < 0) {
        ball.z = 0;
        ball.vz = Math.abs(ball.vz) * 0.4;
        if (Math.abs(ball.vz) < 0.8) ball.vz = 0;
      }
      ball.trail.push({ x: ball.x, y: ball.y, z: ball.z });
      if (ball.trail.length > 20) ball.trail.shift();
    }
  },

  projectZ(z) {
    return 1 + z * 0.012;
  },

  getScreenPos(ball) {
    const scale = this.projectZ(ball.z);
    const cfg = SIQIU.GAME_CONFIG;
    const cx = cfg.canvasW / 2;
    const cy = cfg.canvasH / 2;
    const sx = cx + (ball.x - cx) * scale;
    const sy = cy + (ball.y - cy) * scale;
    const sr = ball.r * scale;
    return { x: sx, y: sy - ball.z * 0.8, r: sr };
  }
};
