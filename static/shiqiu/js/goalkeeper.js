window.SIQIU = window.SIQIU || {};

SIQIU.Goalkeeper = {
  create(stadium) {
    const cfg = SIQIU.GAME_CONFIG;
    const cx = (cfg.goalLeft + cfg.goalRight) / 2;
    return {
      x: cx,
      y: cfg.goalY + 30,
      w: 46,
      h: 70,
      baseX: cx,
      vx: 0,
      state: 'idle',
      diveTarget: null,
      diveProgress: 0,
      diveDuration: 0,
      diveDirection: 0,
      jumpZ: 0,
      jumpVz: 0,
      reactionCooldown: 0,
      speed: 2.2 * (stadium.gkSpeed || 1),
      reaction: (stadium.gkReaction || 1),
      difficultyRound: 1,
      hasReacted: false
    };
  },

  reset(gk) {
    gk.x = gk.baseX;
    gk.vx = 0;
    gk.state = 'idle';
    gk.diveTarget = null;
    gk.diveProgress = 0;
    gk.diveDirection = 0;
    gk.jumpZ = 0;
    gk.jumpVz = 0;
    gk.reactionCooldown = 0;
    gk.hasReacted = false;
  },

  update(gk, ball, roundIndex) {
    const cfg = SIQIU.GAME_CONFIG;
    if (ball.state !== 'flying') {
      if (gk.state !== 'idle') this.reset(gk);
      return;
    }

    const ballScreen = SIQIU.Physics.getScreenPos(ball);
    const distToGoal = Math.max(0, ball.y - cfg.goalY);
    const timeToGoal = distToGoal / Math.max(0.1, Math.abs(ball.vy));

    const roundBoost = 1 + roundIndex * 0.06;

    if (gk.state === 'idle' && !gk.hasReacted) {
      const proximity = SIQIU.Utils.clamp(1 - distToGoal / 450, 0, 1);
      const reactChance = 0.08 * gk.reaction * roundBoost + proximity * 0.35;
      if (Math.random() < reactChance) {
        gk.hasReacted = true;
        const predictX = ballScreen.x + ball.vx * timeToGoal * 0.55;
        const clampedX = SIQIU.Utils.clamp(predictX, cfg.goalLeft + 15, cfg.goalRight - 15);
        const shouldJump = ball.z > 18 && Math.random() < 0.55 * gk.reaction;
        if (shouldJump) {
          gk.state = 'jumping';
          gk.jumpVz = 6 * gk.reaction;
          gk.diveTarget = clampedX;
          gk.diveDuration = Math.max(24, 36 / gk.reaction);
          gk.diveProgress = 0;
          gk.diveDirection = clampedX > gk.x ? 1 : -1;
        } else {
          gk.state = 'diving';
          gk.diveTarget = clampedX;
          gk.diveProgress = 0;
          gk.diveDuration = Math.max(16, 26 / gk.reaction);
          gk.diveDirection = clampedX > gk.x ? 1 : -1;
        }
      }
    }

    if (gk.state === 'diving' && gk.diveTarget != null) {
      gk.diveProgress++;
      const t = SIQIU.Utils.clamp(gk.diveProgress / gk.diveDuration, 0, 1);
      const eased = SIQIU.Utils.easeInOutQuad(t);
      gk.x = SIQIU.Utils.lerp(gk.baseX, gk.diveTarget, eased);
      if (t >= 1) {
        gk.state = 'recovering';
        gk.reactionCooldown = 20;
      }
    } else if (gk.state === 'jumping' && gk.diveTarget != null) {
      gk.diveProgress++;
      const t = SIQIU.Utils.clamp(gk.diveProgress / gk.diveDuration, 0, 1);
      gk.jumpZ = Math.sin(t * Math.PI) * 70;
      gk.x = SIQIU.Utils.lerp(gk.baseX, gk.diveTarget, t);
      if (t >= 1) {
        gk.state = 'recovering';
        gk.jumpZ = 0;
        gk.reactionCooldown = 24;
      }
    } else if (gk.state === 'recovering') {
      gk.x = SIQIU.Utils.lerp(gk.x, gk.baseX, 0.15);
      gk.reactionCooldown--;
      if (gk.reactionCooldown <= 0) {
        gk.state = 'idle';
      }
    }

    gk.x = SIQIU.Utils.clamp(gk.x, cfg.goalLeft + 8, cfg.goalRight - 8);
  },

  checkSave(gk, ball) {
    if (ball.state !== 'flying') return false;
    const cfg = SIQIU.GAME_CONFIG;
    const ballScreen = SIQIU.Physics.getScreenPos(ball);
    const gkScreen = { x: gk.x, y: gk.y - gk.jumpZ, w: gk.w, h: gk.h };

    if (ballScreen.y > gkScreen.y + gkScreen.h * 0.55) return false;
    if (ballScreen.y < gkScreen.y - gkScreen.h * 0.55) return false;

    const reach = gk.state === 'diving' ? gkScreen.w * 1.35 :
                  gk.state === 'jumping' ? gkScreen.w * 1.15 :
                  gk.state === 'recovering' ? gkScreen.w * 0.9 :
                  gkScreen.w * 0.75;

    const dx = Math.abs(ballScreen.x - gkScreen.x);
    const dy = Math.abs(ballScreen.y - gkScreen.y);

    if (dx < reach && dy < gkScreen.h * 0.65) {
      return true;
    }
    if (gk.state === 'jumping' && gk.jumpZ > 15 && ball.z < 35 && dx < reach * 0.85) {
      return true;
    }
    return false;
  }
};
