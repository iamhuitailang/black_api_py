var Game = (function() {
  var state = {
    current: GameConfig.GAME_STATES.MENU,
    level: 1,
    score: 0,
    hp: GameConfig.BASE.maxHp,
    maxHp: GameConfig.BASE.maxHp,
    timeLeft: 60,
    totalTime: 60,
    hats: [],
    rabbitsFound: 0,
    totalRabbits: 2,
    levelCfg: null,
    lastSwapTime: 0,
    lastFogTime: 0,
    lastTime: 0,
    countdown: 3,
    countdownStart: 0,
    introStart: 0,
    showIntro: false,
    hatAnimatingCount: 0
  };

  var listeners = {};

  function on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  }

  function emit(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(function(cb) { cb(data); });
    }
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function generateTypes(cfg) {
    var types = [];
    for (var i = 0; i < cfg.rabbitCount; i++) {
      types.push(GameConfig.HAT_TYPES.RABBIT);
    }
    for (var j = 0; j < cfg.fakeCount; j++) {
      types.push(GameConfig.HAT_TYPES.FAKE);
    }
    var emptyCount = cfg.hatCount - cfg.rabbitCount - cfg.fakeCount;
    for (var k = 0; k < emptyCount; k++) {
      types.push(GameConfig.HAT_TYPES.EMPTY);
    }
    shuffle(types);
    return types;
  }

  function startGame(fromLevel) {
    Storage.clearGameState();
    state.level = fromLevel || 1;
    state.score = 0;
    state.hp = GameConfig.BASE.maxHp;
    state.maxHp = GameConfig.BASE.maxHp;
    state.rabbitsFound = 0;
    state.current = GameConfig.GAME_STATES.PLAYING;
    setupLevel();
    state.showIntro = true;
    state.introStart = performance.now();
    emit('stateChange', state.current);
  }

  function continueGame(savedState) {
    if (!savedState) return;
    state.level = savedState.level;
    state.score = savedState.score;
    state.hp = savedState.hp;
    state.rabbitsFound = savedState.rabbitFound || 0;
    state.maxHp = GameConfig.BASE.maxHp;
    state.current = GameConfig.GAME_STATES.PLAYING;
    setupLevel(savedState.timeLeft, savedState.hatTypes);
    state.rabbitsFound = savedState.rabbitFound || 0;
    state.showIntro = false;
    emit('stateChange', state.current);
  }

  function setupLevel(timeLeftOverride, hatTypes) {
    state.levelCfg = GameConfig.getLevelConfig(state.level);
    state.totalTime = state.levelCfg.timeLimit;
    if (timeLeftOverride == null) {
      state.timeLeft = state.totalTime;
      state.rabbitsFound = 0;
    } else {
      state.timeLeft = timeLeftOverride;
    }
    state.totalRabbits = state.levelCfg.rabbitCount;
    state.lastSwapTime = performance.now();
    state.lastFogTime = performance.now();

    generateHats(hatTypes);
    saveProgress();
  }

  function generateHats(hatTypes) {
    var cfg = state.levelCfg;
    var canvasW = Renderer.getWidth();
    var canvasH = Renderer.getHeight();
    var types = hatTypes && hatTypes.length === cfg.hatCount ? hatTypes : generateTypes(cfg);

    state.hats = [];
    for (var idx = 0; idx < cfg.hatCount; idx++) {
      state.hats.push(Hat.create(idx, cfg.hatCount, canvasW, canvasH, types[idx]));
    }
    state.hatAnimatingCount = 0;
  }

  function getHatTypes() {
    var types = [];
    for (var i = 0; i < state.hats.length; i++) {
      types.push(state.hats[i].type);
    }
    return types;
  }

  function nextLevel() {
    state.level++;
    state.hp = Math.min(state.hp + 1, state.maxHp);
    state.current = GameConfig.GAME_STATES.PLAYING;
    setupLevel();
    state.showIntro = true;
    state.introStart = performance.now();
    emit('levelChange', state.level);
    emit('stateChange', state.current);
  }

  function resetLevel() {
    state.rabbitsFound = 0;
    state.hp = GameConfig.BASE.maxHp;
    setupLevel();
    state.showIntro = true;
    state.introStart = performance.now();
  }

  function gameOver() {
    state.current = GameConfig.GAME_STATES.GAME_OVER;
    Storage.setHighScore(state.score);
    Storage.setHighLevel(state.level);
    Storage.clearGameState();
    emit('gameOver', { level: state.level, score: state.score });
    emit('stateChange', state.current);
  }

  function levelClear() {
    state.current = GameConfig.GAME_STATES.LEVEL_CLEAR;
    var timeBonus = Math.floor(state.timeLeft * (state.levelCfg.timeBonus / state.totalTime));
    var levelBonus = state.levelCfg.levelBonus;
    state.score += timeBonus + levelBonus;
    Storage.setHighScore(state.score);
    Storage.setHighLevel(state.level);
    Storage.clearGameState();
    emit('levelClear', { level: state.level, score: state.score, timeBonus: timeBonus, levelBonus: levelBonus });
    emit('stateChange', state.current);
  }

  function pause() {
    if (state.current === GameConfig.GAME_STATES.PLAYING) {
      state.current = GameConfig.GAME_STATES.PAUSED;
      saveProgress();
      emit('stateChange', state.current);
    }
  }

  function resume() {
    if (state.current === GameConfig.GAME_STATES.PAUSED) {
      state.current = GameConfig.GAME_STATES.PLAYING;
      state.lastSwapTime = performance.now();
      state.lastFogTime = performance.now();
      emit('stateChange', state.current);
    }
  }

  function goToMenu() {
    state.current = GameConfig.GAME_STATES.MENU;
    Storage.clearGameState();
    emit('stateChange', state.current);
  }

  function handleTap(x, y) {
    if (state.current !== GameConfig.GAME_STATES.PLAYING) return;
    if (state.showIntro) return;
    if (Effects.isFogActive()) return;

    for (var i = 0; i < state.hats.length; i++) {
      var h = state.hats[i];
      if (Hat.isInside(h, x, y)) {
        if (h.opened) {
          if (h.state === GameConfig.HAT_STATES.OPEN) {
            Hat.close(h);
          }
          return;
        }

        if (h.state === GameConfig.HAT_STATES.CLOSED && !h.animating) {
          Hat.open(h);
          state.hatAnimatingCount++;
          onHatOpened(h);
        }
        return;
      }
    }
  }

  function onHatOpened(h) {
    setTimeout(function() {
      if (h.type === GameConfig.HAT_TYPES.RABBIT) {
        if (!h.found) {
          h.found = true;
          state.rabbitsFound++;
          state.score += state.levelCfg.scorePerRabbit;
          Effects.spawnParticles(h.x, h.y - h.size * 0.3, '#fff', 15);
          Effects.spawnParticles(h.x, h.y - h.size * 0.3, '#f8bbd0', 10);
          emit('rabbitFound', { total: state.rabbitsFound, goal: state.totalRabbits });

          if (state.rabbitsFound >= state.totalRabbits) {
            setTimeout(levelClear, 600);
          }
        }
      } else if (h.type === GameConfig.HAT_TYPES.FAKE) {
        state.hp = Math.max(0, state.hp - state.levelCfg.wrongDeduct);
        Effects.spawnParticles(h.x, h.y - h.size * 0.3, '#ff5252', 12);
        emit('wrongChoice', { hp: state.hp, maxHp: state.maxHp });
        Effects.addSparkleAt(h.x, h.y - h.size * 0.3);

        if (state.hp <= 0) {
          setTimeout(gameOver, 400);
        }
      } else {
        Effects.addSparkleAt(h.x, h.y - h.size * 0.3);
      }
      state.hatAnimatingCount--;
      saveProgress();
    }, GameConfig.ANIM.hatOpenDuration);
  }

  function doSwap() {
    if (state.hats.length < 2) return;
    var indices = [];
    for (var i = 0; i < state.hats.length; i++) {
      indices.push(i);
    }
    shuffle(indices);

    var swapCount = Math.min(Math.ceil(state.hats.length * 0.4), 6);
    for (var s = 0; s < swapCount - 1; s += 2) {
      var i1 = indices[s];
      var i2 = indices[s + 1];
      if (i1 === undefined || i2 === undefined) break;

      var h1 = state.hats[i1];
      var h2 = state.hats[i2];

      Effects.spawnParticles(h1.x, h1.y, '#ce93d8', 6);
      Effects.spawnParticles(h2.x, h2.y, '#ce93d8', 6);

      var tmpX = h1.targetX;
      var tmpY = h1.targetY;
      Hat.setTarget(h1, h2.targetX, h2.targetY);
      Hat.setTarget(h2, tmpX, tmpY);
    }
  }

  function update(dt, now) {
    if (state.current !== GameConfig.GAME_STATES.PLAYING) return;

    if (state.showIntro) {
      if (now - state.introStart > 1500) {
        state.showIntro = false;
      }
      return;
    }

    state.timeLeft -= dt / 1000;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      gameOver();
      return;
    }

    var cfg = state.levelCfg;
    if (cfg.swapInterval > 0) {
      if (now - state.lastSwapTime > cfg.swapInterval) {
        doSwap();
        state.lastSwapTime = now;
      }
    }

    if (cfg.fogEnabled && cfg.fogInterval > 0) {
      if (now - state.lastFogTime > cfg.fogInterval) {
        Effects.triggerFog();
        state.lastFogTime = now;
      }
    }

    for (var i = 0; i < state.hats.length; i++) {
      Hat.update(state.hats[i], dt, now);
    }

    Effects.update(dt, now, Renderer.getWidth(), Renderer.getHeight());
  }

  function saveProgress() {
    Storage.saveGameState({
      level: state.level,
      score: state.score,
      hp: state.hp,
      timeLeft: state.timeLeft,
      rabbitFound: state.rabbitsFound,
      hatTypes: getHatTypes()
    });
  }

  function getState() { return state; }

  return {
    on: on,
    startGame: startGame,
    continueGame: continueGame,
    nextLevel: nextLevel,
    resetLevel: resetLevel,
    pause: pause,
    resume: resume,
    goToMenu: goToMenu,
    handleTap: handleTap,
    update: update,
    getState: getState
  };
})();
