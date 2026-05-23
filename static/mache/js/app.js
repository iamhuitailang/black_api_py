(function() {
  window.addEventListener('load', function() {
    Game.init();
  });

  window.addEventListener('beforeunload', function() {
    try {
      var state = Game.getState();
      if (state && (state.state === 'playing' || state.state === 'paused')) {
        if (state.state === 'playing') {
          var saved = Game.getState();
          saved.state = 'paused';
        }
        Game.saveNow();
      }
    } catch (e) {
      console.warn('Error saving state on unload:', e);
    }
  });
})();
