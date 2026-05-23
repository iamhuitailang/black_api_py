(function () {

  function init() {
    Input.init();
    UI.init();

    Input.on('skillPress', function () {
      if (Game.isRunning()) {
        // skill handled in game loop via Input.consumePressed
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (Game.isRunning()) {
          Game.pause();
        }
      }
    });

    window.addEventListener('keydown', function (e) {
      if (e.code === 'Escape') {
        if (Game.isRunning()) {
          Game.pause();
        }
      }
    });

    UI.showMenu();

    console.log('%c🎠 旋转木马站立挑战', 'font-size:20px;color:#ffb450;font-weight:bold;');
    console.log('%c使用 ← → 调整站位，↓ 下蹲，空格释放技能', 'color:#78b4ff;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
