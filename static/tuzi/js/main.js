(function() {
  var canvas;
  var lastTime = 0;
  var rafId = null;
  var pausedByVisibility = false;

  function init() {
    canvas = document.getElementById('game-canvas');
    Renderer.init(canvas);
    Effects.init(Renderer.getWidth(), Renderer.getHeight());
    UI.init();

    bindEvents();

    var savedState = Storage.loadGameState();
    if (savedState && savedState.timeLeft > 0 && savedState.hp > 0) {
      Game.continueGame(savedState);
    }

    startLoop();
  }

  function bindEvents() {
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });

    window.addEventListener('resize', onResize);

    document.addEventListener('visibilitychange', function() {
      var s = Game.getState();
      if (document.hidden) {
        if (s.current === GameConfig.GAME_STATES.PLAYING) {
          pausedByVisibility = true;
          Game.pause();
        }
      } else {
        if (pausedByVisibility && s.current === GameConfig.GAME_STATES.PAUSED) {
          UI.hideAllScreens();
          Game.resume();
          pausedByVisibility = false;
        }
      }
    });

    window.addEventListener('keydown', function(e) {
      var s = Game.getState();
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (s.current === GameConfig.GAME_STATES.PLAYING) {
          Game.pause();
        } else if (s.current === GameConfig.GAME_STATES.PAUSED) {
          UI.hideAllScreens();
          Game.resume();
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        if (s.current === GameConfig.GAME_STATES.PLAYING ||
            s.current === GameConfig.GAME_STATES.PAUSED) {
          Game.resetLevel();
        }
      }
    });
  }

  function onPointerDown(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    handleTap(x, y);
  }

  function onTouchStart(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      var x = t.clientX - rect.left;
      var y = t.clientY - rect.top;
      handleTap(x, y);
    }
  }

  function handleTap(x, y) {
    var s = Game.getState();
    if (s.current === GameConfig.GAME_STATES.PLAYING) {
      Game.handleTap(x, y);
    }
  }

  function onResize() {
    Renderer.resize();
    Effects.init(Renderer.getWidth(), Renderer.getHeight());
  }

  function startLoop() {
    lastTime = performance.now();
    loop();
  }

  function loop() {
    var now = performance.now();
    var dt = Math.min(now - lastTime, 100);
    lastTime = now;

    Game.update(dt, now);

    render(now);

    rafId = requestAnimationFrame(loop);
  }

  function render(now) {
    Renderer.clear();
    Renderer.drawBackground();
    Effects.drawClouds(canvas.getContext('2d'));
    Effects.drawSparkles(canvas.getContext('2d'));
    Renderer.drawStage();

    var s = Game.getState();

    if (s.current !== GameConfig.GAME_STATES.MENU) {
      var hats = s.hats;
      for (var i = 0; i < hats.length; i++) {
        Renderer.drawHat(hats[i], now);
      }

      Effects.drawParticles(canvas.getContext('2d'));

      Effects.drawFog(canvas.getContext('2d'), Renderer.getWidth(), Renderer.getHeight());

      Renderer.drawHUD(
        s.level,
        s.score,
        s.hp,
        s.maxHp,
        s.timeLeft,
        s.totalTime,
        s.rabbitsFound,
        s.totalRabbits
      );

      if (s.showIntro) {
        Renderer.drawLevelIntro(s.level);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
