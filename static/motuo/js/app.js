(function () {
  var canvas = document.getElementById('game-canvas');
  var startScreen = document.getElementById('start-screen');
  var gameoverScreen = document.getElementById('gameover-screen');
  var pauseScreen = document.getElementById('pause-screen');
  var startBtn = document.getElementById('start-btn');
  var continueBtn = document.getElementById('continue-btn');
  var retryBtn = document.getElementById('retry-btn');
  var menuBtn = document.getElementById('menu-btn');
  var resumeBtn = document.getElementById('resume-btn');
  var quitBtn = document.getElementById('quit-btn');

  var selectedBike = 'light';
  var selectedTheme = 'city';
  var selectedLevel = 'level1';
  var trickIndicator = document.getElementById('trick-indicator');

  Renderer.init(canvas, CONFIG.getTheme('city'));
  Game.init();

  buildBikeOptions();
  buildThemeOptions();
  buildLevelOptions();

  var savedGame = Game.loadState();
  if (savedGame) {
    continueBtn.classList.remove('hidden');
    selectedBike = savedGame.bikeId;
    selectedTheme = savedGame.themeId;
    selectedLevel = savedGame.levelId;
    updateSelectedOptions();
  }

  var savedSettings = Storage.getSettings();
  if (savedSettings) {
    if (!savedGame) {
      selectedBike = savedSettings.bikeId || selectedBike;
      selectedTheme = savedSettings.themeId || selectedTheme;
      selectedLevel = savedSettings.levelId || selectedLevel;
      updateSelectedOptions();
    }
  }

  updateBestStats();

  startBtn.addEventListener('click', function () {
    hideScreen(startScreen);
    Game.start(selectedBike, selectedTheme, selectedLevel);
  });

  continueBtn.addEventListener('click', function () {
    hideScreen(startScreen);
    Game.restoreFromSave(savedGame);
  });

  retryBtn.addEventListener('click', function () {
    hideScreen(gameoverScreen);
    Game.start(selectedBike, selectedTheme, selectedLevel);
  });

  menuBtn.addEventListener('click', function () {
    hideScreen(gameoverScreen);
    Game.goToMenu();
    showScreen(startScreen);
    updateBestStats();
    savedGame = Game.loadState();
    if (savedGame) {
      continueBtn.classList.remove('hidden');
    } else {
      continueBtn.classList.add('hidden');
    }
  });

  resumeBtn.addEventListener('click', function () {
    hideScreen(pauseScreen);
    Game.resume();
  });

  quitBtn.addEventListener('click', function () {
    hideScreen(pauseScreen);
    Game.goToMenu();
    showScreen(startScreen);
    updateBestStats();
    savedGame = Game.loadState();
    if (savedGame) {
      continueBtn.classList.remove('hidden');
    } else {
      continueBtn.classList.add('hidden');
    }
  });

  Game.on('start', function () {
    hideScreen(startScreen);
    hideScreen(gameoverScreen);
    hideScreen(pauseScreen);
  });

  Game.on('gameover', function (data) {
    document.getElementById('result-distance').textContent = data.distance + ' m';
    document.getElementById('result-score').textContent = data.score;
    document.getElementById('new-record').style.display =
      data.newScoreRecord || data.newDistRecord ? 'flex' : 'none';
    showScreen(gameoverScreen);
  });

  Game.on('pause', function () {
    showScreen(pauseScreen);
  });

  Game.on('trick', function (trickData) {
    showTrickIndicator(Tricks.getTrickName(trickData.trick) + ' +' + trickData.score);
    Renderer.spawnParticles(
      canvas.width / 2,
      canvas.height / 3,
      CONFIG.getTheme(selectedTheme).neonColors[0] || '#ffd700',
      15,
      { speed: 6, size: 5 }
    );
  });

  setInterval(updateHUD, 100);

  function buildBikeOptions() {
    var container = document.getElementById('bike-options');
    container.innerHTML = '';
    CONFIG.BIKES.forEach(function (bike) {
      var item = document.createElement('div');
      item.className = 'option-item' + (bike.id === selectedBike ? ' selected' : '');
      item.dataset.bike = bike.id;
      item.innerHTML = '<span class="emoji">' + bike.emoji + '</span>' + bike.name;
      item.addEventListener('click', function () {
        selectedBike = bike.id;
        updateSelectedOptions();
      });
      container.appendChild(item);
    });
  }

  function buildThemeOptions() {
    var container = document.getElementById('theme-options');
    container.innerHTML = '';
    CONFIG.THEMES.forEach(function (theme) {
      var item = document.createElement('div');
      item.className = 'option-item' + (theme.id === selectedTheme ? ' selected' : '');
      item.dataset.theme = theme.id;
      item.innerHTML = '<span class="emoji">' + theme.emoji + '</span>' + theme.name;
      item.addEventListener('click', function () {
        selectedTheme = theme.id;
        updateSelectedOptions();
      });
      container.appendChild(item);
    });
  }

  function buildLevelOptions() {
    var container = document.getElementById('level-options');
    container.innerHTML = '';
    CONFIG.LEVELS.forEach(function (level) {
      var item = document.createElement('div');
      item.className = 'option-item' + (level.id === selectedLevel ? ' selected' : '');
      item.dataset.level = level.id;
      var stars = '⭐'.repeat(level.difficulty);
      item.innerHTML = '<span class="emoji">' + stars + '</span>' + level.name;
      item.addEventListener('click', function () {
        selectedLevel = level.id;
        updateSelectedOptions();
      });
      container.appendChild(item);
    });
  }

  function updateSelectedOptions() {
    var bikeItems = document.querySelectorAll('#bike-options .option-item');
    bikeItems.forEach(function (item) {
      item.classList.toggle('selected', item.dataset.bike === selectedBike);
    });

    var themeItems = document.querySelectorAll('#theme-options .option-item');
    themeItems.forEach(function (item) {
      item.classList.toggle('selected', item.dataset.theme === selectedTheme);
    });

    var levelItems = document.querySelectorAll('#level-options .option-item');
    levelItems.forEach(function (item) {
      item.classList.toggle('selected', item.dataset.level === selectedLevel);
    });
  }

  function updateHUD() {
    document.getElementById('hud-distance').textContent = Game.getDistance();
    document.getElementById('hud-score').textContent = Game.getScore();
    document.getElementById('hud-speed').textContent = Game.getSpeed();
    document.getElementById('hud-best-distance').textContent = Storage.getBestDistance();
    document.getElementById('hud-best-score').textContent = Storage.getBestScore();

    var levelInfo = document.getElementById('hud-level-info');
    if (levelInfo && Game.getState() === 'playing') {
      var level = CONFIG.getLevel(selectedLevel);
      if (level && level.physics) {
        var p = level.physics;
        levelInfo.textContent = level.name + ' | 重力:' + p.gravityMul.toFixed(2) + 'x 摩擦:' + p.frictionMul.toFixed(2) + 'x 速度:' + p.maxSpeedMul.toFixed(2) + 'x 加速:' + (p.accelMul || 1.0).toFixed(2) + 'x';
      }
    } else if (levelInfo) {
      levelInfo.textContent = '';
    }
  }

  function updateBestStats() {
    document.getElementById('hud-best-distance').textContent = Storage.getBestDistance();
    document.getElementById('hud-best-score').textContent = Storage.getBestScore();
  }

  function showScreen(screen) {
    screen.classList.remove('hidden');
  }

  function hideScreen(screen) {
    screen.classList.add('hidden');
  }

  function showTrickIndicator(text) {
    trickIndicator.textContent = text;
    trickIndicator.classList.remove('hidden');
    trickIndicator.style.animation = 'none';
    void trickIndicator.offsetWidth;
    trickIndicator.style.animation = 'trick-pop 0.4s ease-out';
    setTimeout(function () {
      trickIndicator.classList.add('hidden');
    }, 1200);
  }

  showScreen(startScreen);
})();
