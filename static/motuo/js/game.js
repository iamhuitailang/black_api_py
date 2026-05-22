var Game = (function () {
  var STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
  };

  var game = {
    state: STATE.MENU,
    score: 0,
    distance: 0,
    cameraX: 0,
    bike: null,
    theme: null,
    level: null,
    obstacles: [],
    groundY: 0,
    lastTime: 0,
    rafId: null,
    paused: false
  };

  var events = {};

  function on(event, fn) {
    if (!events[event]) events[event] = [];
    events[event].push(fn);
  }

  function emit(event, data) {
    if (events[event]) {
      events[event].forEach(function (fn) {
        try { fn(data); } catch (e) { console.error(e); }
      });
    }
  }

  function init() {
    game.groundY = Renderer.getGroundY();
    Input.init();

    Input.addListener(function (action, type) {
      if (action === 'pause' && type === 'down') {
        if (game.state === STATE.PLAYING) {
          pause();
        } else if (game.state === STATE.PAUSED) {
          resume();
        }
      }
    });
  }

  function start(bikeId, themeId, levelId) {
    game.bike = CONFIG.getBike(bikeId);
    game.theme = CONFIG.getTheme(themeId);
    game.level = CONFIG.getLevel(levelId);
    game.score = 0;
    game.distance = 0;
    game.cameraX = 0;
    game.state = STATE.PLAYING;
    game.paused = false;
    game.obstacles = CONFIG.genObstacles(levelId, themeId);

    game.level.ramps.forEach(function(ramp) {
      ramp.hit = false;
    });

    Renderer.setTheme(game.theme);
    Physics.reset(game.groundY, game.level.physics);
    Tricks.reset();

    Storage.setSettings({
      bikeId: bikeId,
      themeId: themeId,
      levelId: levelId
    });

    saveState();

    emit('start');
    game.lastTime = performance.now();
    loop();
  }

  function pause() {
    if (game.state !== STATE.PLAYING) return;
    game.state = STATE.PAUSED;
    game.paused = true;
    saveState();
    emit('pause');
  }

  function resume() {
    if (game.state !== STATE.PAUSED) return;
    game.state = STATE.PLAYING;
    game.paused = false;
    game.lastTime = performance.now();
    emit('resume');
    loop();
  }

  function gameover() {
    game.state = STATE.GAMEOVER;
    game.paused = true;

    var physState = Physics.getState();
    var crashReason = physState.crashReason;

    var newScoreRecord = Storage.setBestScore(game.score);
    var newDistRecord = Storage.setBestDistance(Math.floor(game.distance));

    Storage.clearGameState();

    emit('gameover', {
      score: game.score,
      distance: Math.floor(game.distance),
      newScoreRecord: newScoreRecord,
      newDistRecord: newDistRecord,
      crashReason: crashReason
    });
  }

  function goToMenu() {
    game.state = STATE.MENU;
    game.paused = true;
    if (game.rafId) {
      cancelAnimationFrame(game.rafId);
      game.rafId = null;
    }
    Storage.clearGameState();
    emit('menu');
  }

  function loop() {
    if (game.state !== STATE.PLAYING) return;

    var now = performance.now();
    var dt = Math.min(now - game.lastTime, 50);
    game.lastTime = now;

    update(dt);
    render(dt);

    saveState();

    game.rafId = requestAnimationFrame(loop);
  }

  function update(dt) {
    var physState = Physics.getState();

    Physics.update(game.groundY, game.level.ramps, game.obstacles, game.cameraX, game.bike, Input, dt);

    Tricks.update(physState, Input, dt, function (trickData) {
      if (trickData.type === 'complete') {
        game.score += trickData.score;
        emit('trick', trickData);
      }
    });

    if (physState.crashed) {
      if (physState.hitObstacle) {
        Renderer.spawnParticles(
          physState.x - game.cameraX,
          physState.y,
          physState.hitObstacle.color || '#ff6b6b',
          30,
          { speed: 10, size: 6 }
        );
      } else {
        Renderer.spawnParticles(
          physState.x - game.cameraX,
          physState.y,
          '#ff6b6b',
          20,
          { speed: 8, size: 5 }
        );
      }
      gameover();
      return;
    }

    if (physState.vx > 0) {
      game.distance += physState.vx * dt * 0.01;
    }

    if (physState.x > 300) {
      game.cameraX = -(physState.x - 300);
    }

    if (physState.x >= game.level.length) {
      game.score += 500;
      gameover();
      return;
    }

    if (physState.y > game.groundY + 200) {
      gameover();
      return;
    }

    Input.clearPressed();
  }

  function render(dt) {
    var physState = Physics.getState();
    var speed = Math.abs(physState.vx);

    Renderer.render(
      game.cameraX,
      physState,
      game.bike,
      game.level.ramps,
      game.obstacles,
      speed,
      game.level.length,
      dt
    );
  }

  function saveState() {
    if (game.state !== STATE.PLAYING) return;
    var physState = Physics.getState();
    Storage.saveGameState({
      score: game.score,
      distance: game.distance,
      cameraX: game.cameraX,
      bikeId: game.bike.id,
      themeId: game.theme.id,
      levelId: game.level.id,
      obstacles: game.obstacles,
      physState: {
        x: physState.x,
        y: physState.y,
        vx: physState.vx,
        vy: physState.vy,
        angle: physState.angle,
        angularVel: physState.angularVel,
        onGround: physState.onGround,
        onRamp: physState.onRamp,
        wheelSpin: physState.wheelSpin,
        crashed: physState.crashed
      },
      trickState: Tricks.getState(),
      timestamp: Date.now()
    });
  }

  function loadState() {
    var saved = Storage.getGameState();
    if (!saved) return null;

    if (Date.now() - saved.timestamp > 86400000) {
      Storage.clearGameState();
      return null;
    }

    return saved;
  }

  function restoreFromSave(saved) {
    game.bike = CONFIG.getBike(saved.bikeId);
    game.theme = CONFIG.getTheme(saved.themeId);
    game.level = CONFIG.getLevel(saved.levelId);
    game.score = saved.score;
    game.distance = saved.distance;
    game.cameraX = saved.cameraX;
    game.state = STATE.PLAYING;
    game.paused = false;
    game.obstacles = saved.obstacles || CONFIG.genObstacles(saved.levelId, saved.themeId);

    game.level.ramps.forEach(function(ramp) {
      ramp.hit = false;
    });

    Renderer.setTheme(game.theme);
    Physics.reset(game.groundY, game.level.physics);

    var ps = saved.physState;
    var physState = Physics.getState();
    physState.x = ps.x;
    physState.y = ps.y;
    physState.vx = ps.vx;
    physState.vy = ps.vy;
    physState.angle = ps.angle;
    physState.angularVel = ps.angularVel;
    physState.onGround = ps.onGround;
    physState.onRamp = ps.onRamp;
    physState.wheelSpin = ps.wheelSpin;
    physState.crashed = ps.crashed;

    Tricks.reset();

    emit('start');
    game.lastTime = performance.now();
    loop();
  }

  function getState() {
    return game.state;
  }

  function getScore() {
    return game.score;
  }

  function getDistance() {
    return Math.floor(game.distance);
  }

  function getSpeed() {
    var physState = Physics.getState();
    return Math.floor(Math.abs(physState.vx) * 12);
  }

  return {
    STATE: STATE,
    init: init,
    start: start,
    pause: pause,
    resume: resume,
    gameover: gameover,
    goToMenu: goToMenu,
    getState: getState,
    getScore: getScore,
    getDistance: getDistance,
    getSpeed: getSpeed,
    loadState: loadState,
    restoreFromSave: restoreFromSave,
    on: on
  };
})();
