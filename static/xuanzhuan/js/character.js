var Character = (function () {

  function create(config, opts) {
    opts = opts || {};
    var char = {
      id: opts.id || ('char_' + Math.random().toString(36).substr(2, 8)),
      name: config.name,
      emoji: config.emoji,
      color: config.color,
      stability: config.stability,
      maxStability: config.stability,
      moveSpeed: config.moveSpeed,
      resistPower: config.resistPower,
      recoverSpeed: config.recoverSpeed,
      skillName: config.skillName,
      skillDuration: config.skillDuration,
      skillCooldown: config.skillCooldown,
      isPlayer: opts.isPlayer || false,
      isAI: opts.isAI || false,
      angle: opts.angle || 0,
      angularVel: 0,
      x: 0,
      y: 0,
      crouching: false,
      crouchAmount: 0,
      skillActive: false,
      skillTimer: 0,
      skillCooldownTimer: 0,
      alive: true,
      fallTimer: 0,
      wobble: 0,
      wobbleSpeed: 0,
      bobPhase: Math.random() * Math.PI * 2,
      rank: 0,
      surviveTime: 0,
      aiState: opts.isAI ? 'standing' : null,
      aiTargetAngle: opts.angle || 0,
      aiReactionTimer: 0,
      aiSkillTimer: 0
    };
    updatePosition(char);
    return char;
  }

  function updatePosition(char) {
    var plat = CONFIG.PLATFORM;
    var midR = (plat.radius + plat.innerRadius) / 2;
    char.x = plat.cx + Math.cos(char.angle) * midR;
    char.y = plat.cy + Math.sin(char.angle) * midR;
  }

  function update(char, dt, platformAngle, difficulty) {
    if (!char.alive) return;

    char.surviveTime += dt;

    if (char.angularVel !== 0) {
      char.angle += char.angularVel * dt / 1000;
      char.angularVel *= 0.93;
      if (Math.abs(char.angularVel) < 0.0005) char.angularVel = 0;
      var range = Math.PI * 2;
      if (char.angle > range) char.angle -= range;
      if (char.angle < 0) char.angle += range;
      updatePosition(char);
    }

    if (char.skillActive) {
      char.skillTimer -= dt;
      if (char.skillTimer <= 0) {
        char.skillActive = false;
      }
    }
    if (char.skillCooldownTimer > 0) {
      char.skillCooldownTimer -= dt;
      if (char.skillCooldownTimer < 0) char.skillCooldownTimer = 0;
    }

    if (char.crouching) {
      char.crouchAmount = Math.min(1, char.crouchAmount + dt * 0.005);
    } else {
      char.crouchAmount = Math.max(0, char.crouchAmount - dt * 0.004);
    }

    if (!char.skillActive) {
      var recoverRate = char.recoverSpeed * (char.crouching ? 1.5 : 1);
      char.stability = Math.min(char.maxStability, char.stability + recoverRate * dt / 1000);
    }

    if (char.wobbleSpeed !== 0) {
      char.wobble += char.wobbleSpeed * dt / 1000;
      char.wobbleSpeed *= 0.95;
      if (Math.abs(char.wobbleSpeed) < 0.01) char.wobbleSpeed = 0;
    }

    char.bobPhase += dt * 0.003;

    if (char.stability <= 0) {
      char.alive = false;
      char.fallTimer = 1.0;
    }

    if (!char.alive && char.fallTimer > 0) {
      char.fallTimer -= dt / 1000;
    }
  }

  function applyPush(char, force, direction) {
    if (char.skillActive) return;
    var effectiveForce = force / char.resistPower;
    if (char.crouching) effectiveForce *= 0.4;
    char.angularVel += direction * effectiveForce * 0.01;
  }

  function applyStabilityLoss(char, amount) {
    if (char.skillActive) return;
    var effective = amount / char.resistPower;
    if (char.crouching) effective *= (1 / CONFIG.GAME.crouchBoost);
    char.stability = Math.max(0, char.stability - effective);
    char.wobbleSpeed = (Math.random() - 0.5) * (effective * 0.15);
  }

  function move(char, direction, dt) {
    if (!char.alive) return;
    var speed = char.moveSpeed;
    if (char.crouching) speed *= CONFIG.GAME.crouchMovePenalty;
    char.angle += direction * speed * dt / 1000 * 0.04;

    var plat = CONFIG.PLATFORM;
    var range = Math.PI * 2;
    if (char.angle > range) char.angle -= range;
    if (char.angle < 0) char.angle += range;

    if (!char.skillActive) {
      applyStabilityLoss(char, 0.15);
    }

    updatePosition(char);
  }

  function setCrouch(char, crouching) {
    if (!char.alive) return;
    char.crouching = crouching;
  }

  function activateSkill(char) {
    if (!char.alive) return false;
    if (char.skillCooldownTimer > 0) return false;
    if (char.skillActive) return false;
    char.skillActive = true;
    char.skillTimer = char.skillDuration;
    char.skillCooldownTimer = char.skillCooldown;
    char.stability = Math.min(char.maxStability, char.stability + 20);
    char.wobbleSpeed = 0;
    return true;
  }

  function handlePlatformRotation(char, angularVel, dt) {
    if (char.skillActive) return;
    var push = angularVel * 0.3 / char.resistPower;
    if (char.crouching) push *= 0.5;
    char.stability = Math.max(0, char.stability - CONFIG.EFFECTS.rotate.stabilityLoss * dt / 1000 / char.resistPower);
  }

  function getSkillCooldownPercent(char) {
    if (char.skillCooldownTimer <= 0) return 1;
    return 1 - (char.skillCooldownTimer / char.skillCooldown);
  }

  function getStabilityPercent(char) {
    return char.stability / char.maxStability;
  }

  return {
    create: create,
    update: update,
    move: move,
    setCrouch: setCrouch,
    activateSkill: activateSkill,
    applyPush: applyPush,
    applyStabilityLoss: applyStabilityLoss,
    handlePlatformRotation: handlePlatformRotation,
    updatePosition: updatePosition,
    getSkillCooldownPercent: getSkillCooldownPercent,
    getStabilityPercent: getStabilityPercent
  };

})();
