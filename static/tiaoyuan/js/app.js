(function() {
  function resizeCanvas() {
    var canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    var logicalW = TiaoyuanConfig.CANVAS.logicalWidth;
    var logicalH = TiaoyuanConfig.CANVAS.logicalHeight;
    var aspect = logicalW / logicalH;

    var availW = window.innerWidth - 24;
    var availH = window.innerHeight - 24;
    var availAspect = availW / availH;

    var w, h;
    if (availAspect > aspect) {
      h = Math.min(availH, logicalH);
      w = h * aspect;
    } else {
      w = Math.min(availW, logicalW);
      h = w / aspect;
    }
    if (w < 320) { w = 320; h = w / aspect; }
    if (h < 180) { h = 180; w = h * aspect; }

    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      if (TiaoyuanGame && TiaoyuanGame.phase &&
          TiaoyuanGame.phase !== 'menu' &&
          TiaoyuanGame.phase !== 'gameover' &&
          TiaoyuanGame.phase !== 'result' &&
          !TiaoyuanGame.paused) {
        TiaoyuanGame.pause();
      }
    }
  });

  window.addEventListener('beforeunload', function() {
    if (TiaoyuanGame && TiaoyuanGame._saveGame) {
      TiaoyuanGame._saveGame();
    }
  });

  window.addEventListener('load', function() {
    resizeCanvas();
    TiaoyuanGame.init();
  });
})();
