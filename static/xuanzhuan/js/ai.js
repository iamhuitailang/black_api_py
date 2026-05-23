var AI = (function () {

  var AI_STATES = {
    STANDING: 'standing',
    ADJUSTING: 'adjusting',
    WOBBLING: 'wobbling',
    CROUCHING: 'crouching',
    FALLEN: 'fallen'
  };

  function forEachAliveAI(game, fn) {
    var chars = game.characters;
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (ch.isAI && ch.alive) {
        fn(ch);
      }
    }
  }

  function update(char, dt, game) {
    if (!char.alive || !char.isAI) return;

    char.aiReactionTimer -= dt;
    if (char.aiSkillTimer > 0) char.aiSkillTimer -= dt;

    var stabilityPercent = Character.getStabilityPercent(char);
    var skill = game.difficulty.aiSkill;

    if (stabilityPercent < 0.15) {
      char.aiState = AI_STATES.FALLEN;
    } else if (stabilityPercent < 0.3) {
      char.aiState = AI_STATES.WOBBLING;
    } else if (stabilityPercent < 0.55) {
      char.aiState = AI_STATES.CROUCHING;
    } else if (Math.abs(char.angularVel) > 0.02) {
      char.aiState = AI_STATES.ADJUSTING;
    } else {
      char.aiState = AI_STATES.STANDING;
    }

    switch (char.aiState) {
      case AI_STATES.STANDING:
        handleStanding(char, dt, game, skill);
        break;
      case AI_STATES.ADJUSTING:
        handleAdjusting(char, dt, game, skill);
        break;
      case AI_STATES.WOBBLING:
        handleWobbling(char, dt, game, skill);
        break;
      case AI_STATES.CROUCHING:
        handleCrouching(char, dt, game, skill);
        break;
      case AI_STATES.FALLEN:
        handleFallen(char, dt, game);
        break;
    }
  }

  function handleStanding(char, dt, game, skill) {
    Character.setCrouch(char, false);

    if (char.aiReactionTimer <= 0) {
      if (Math.random() < 0.3 * skill) {
        var dir = Math.random() < 0.5 ? -1 : 1;
        Character.move(char, dir, dt);
      }
      char.aiReactionTimer = 1000 + Math.random() * 2000 / skill;
    }

    if (char.angularVel > 0.005) {
      Character.move(char, -1, dt);
    } else if (char.angularVel < -0.005) {
      Character.move(char, 1, dt);
    }
  }

  function handleAdjusting(char, dt, game, skill) {
    Character.setCrouch(char, false);

    if (char.angularVel > 0.01) {
      Character.move(char, -1, dt);
      Character.move(char, -1, dt);
    } else if (char.angularVel < -0.01) {
      Character.move(char, 1, dt);
      Character.move(char, 1, dt);
    }

    if (char.aiSkillTimer <= 0 && Math.random() < 0.01 * skill) {
      if (Character.activateSkill(char)) {
        char.aiSkillTimer = 5000;
      }
    }
  }

  function handleWobbling(char, dt, game, skill) {
    Character.setCrouch(char, true);

    var correctDir = char.angularVel > 0 ? -1 : 1;
    Character.move(char, correctDir, dt);
    Character.move(char, correctDir, dt);

    if (char.aiSkillTimer <= 0 && Math.random() < 0.03 * skill) {
      if (Character.activateSkill(char)) {
        char.aiSkillTimer = 4000;
      }
    }
  }

  function handleCrouching(char, dt, game, skill) {
    Character.setCrouch(char, true);

    var correctDir = char.angularVel > 0 ? -1 : 1;
    if (Math.abs(char.angularVel) > 0.015) {
      Character.move(char, correctDir, dt);
    }

    if (char.aiSkillTimer <= 0 && Math.random() < 0.02 * skill) {
      if (Character.activateSkill(char)) {
        char.aiSkillTimer = 6000;
      }
    }

    if (char.aiReactionTimer <= 0) {
      if (Character.getStabilityPercent(char) > 0.7 && Math.random() < 0.3) {
        Character.setCrouch(char, false);
      }
      char.aiReactionTimer = 500 + Math.random() * 1000;
    }
  }

  function handleFallen(char, dt, game) {
    Character.setCrouch(char, true);
    var correctDir = char.angularVel > 0 ? -1 : 1;
    Character.move(char, correctDir, dt);

    if (char.aiSkillTimer <= 0) {
      Character.activateSkill(char);
      char.aiSkillTimer = 3000;
    }
  }

  function applyEffectResponse(char, effect, game) {
    if (!char.isAI || !char.alive) return;
    var skill = game.difficulty.aiSkill;
    var reactChance = 0.6 * skill;

    if (Math.random() < reactChance) {
      switch (effect.type) {
        case 'bump':
          Character.setCrouch(char, true);
          char.aiState = AI_STATES.WOBBLING;
          break;
        case 'wind':
          Character.move(char, effect.direction > 0 ? -1 : 1, 16);
          char.aiState = AI_STATES.ADJUSTING;
          break;
        case 'tilt':
          Character.setCrouch(char, true);
          char.aiState = AI_STATES.CROUCHING;
          break;
      }
    }

    if (Math.random() < 0.15 * skill && char.aiSkillTimer <= 0) {
      Character.activateSkill(char);
      char.aiSkillTimer = 3000;
    }
  }

  return {
    update: update,
    applyEffectResponse: applyEffectResponse,
    STATES: AI_STATES
  };

})();
