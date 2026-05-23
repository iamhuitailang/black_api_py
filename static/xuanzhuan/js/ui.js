var UI = (function () {

  var dom = {};
  var currentScreen = 'menu';
  var chipRefs = {};
  var fillRefs = {};
  var lastTimeLeft = -1;
  var lastAliveCount = -1;
  var lastRank = -1;
  var crouchBarFill = null;
  var lastSkillText = '';

  function init() {
    dom.menuScreen = document.getElementById('menuScreen');
    dom.hud = document.getElementById('hud');
    dom.resultScreen = document.getElementById('resultScreen');
    dom.pauseScreen = document.getElementById('pauseScreen');

    dom.characterSelect = document.getElementById('characterSelect');
    dom.themeSelect = document.getElementById('themeSelect');
    dom.startBtn = document.getElementById('startBtn');
    dom.resumeBtn = document.getElementById('resumeBtn');
    dom.bestRecords = document.getElementById('bestRecords');

    dom.countdown = document.getElementById('countdown');
    dom.survivors = document.getElementById('survivors');
    dom.rank = document.getElementById('rank');
    dom.playersBar = document.getElementById('playersBar');

    dom.skillCooldown = document.getElementById('skillCooldown');
    dom.crouchBar = document.getElementById('crouchBar');
    dom.effectAlert = document.getElementById('effectAlert');
    dom.pauseBtn = document.getElementById('pauseBtn');

    dom.resultTitle = document.getElementById('resultTitle');
    dom.statDuration = document.getElementById('statDuration');
    dom.statRank = document.getElementById('statRank');
    dom.statSurvivors = document.getElementById('statSurvivors');
    dom.statScore = document.getElementById('statScore');
    dom.playAgainBtn = document.getElementById('playAgainBtn');
    dom.backToMenuBtn = document.getElementById('backToMenuBtn');

    dom.resumeFromPauseBtn = document.getElementById('resumeFromPauseBtn');
    dom.quitBtn = document.getElementById('quitBtn');

    renderCharacterSelect();
    renderThemeSelect();
    renderBestRecords();
    checkResume();
    bindMenuEvents();
  }

  function renderCharacterSelect() {
    if (!dom.characterSelect) return;
    var settings = Storage.getSettings();
    var selected = settings.characterId || CONFIG.GAME.defaultCharacter;
    dom.characterSelect.innerHTML = '';

    CONFIG.CHARACTERS.forEach(function (ch) {
      var div = document.createElement('div');
      div.className = 'char-card' + (ch.id === selected ? ' selected' : '');
      div.dataset.id = ch.id;
      div.innerHTML =
        '<div class="char-emoji">' + ch.emoji + '</div>' +
        '<div class="char-name">' + ch.name + '</div>' +
        '<div class="char-trait">' + ch.description + '</div>';
      div.addEventListener('click', function () {
        document.querySelectorAll('.char-card').forEach(function (el) {
          el.classList.remove('selected');
        });
        div.classList.add('selected');
        Storage.saveSettings({ characterId: ch.id });
      });
      dom.characterSelect.appendChild(div);
    });
  }

  function renderThemeSelect() {
    if (!dom.themeSelect) return;
    var settings = Storage.getSettings();
    var selected = settings.themeId || CONFIG.GAME.defaultTheme;
    dom.themeSelect.innerHTML = '';

    CONFIG.THEMES.forEach(function (t) {
      var div = document.createElement('div');
      div.className = 'theme-card' + (t.id === selected ? ' selected' : '');
      div.dataset.id = t.id;
      div.innerHTML =
        '<div class="theme-emoji">' + t.emoji + '</div>' +
        '<div class="theme-name">' + t.name + '</div>';
      div.addEventListener('click', function () {
        document.querySelectorAll('.theme-card').forEach(function (el) {
          el.classList.remove('selected');
        });
        div.classList.add('selected');
        Storage.saveSettings({ themeId: t.id });
      });
      dom.themeSelect.appendChild(div);
    });
  }

  function renderBestRecords() {
    if (!dom.bestRecords) return;
    var records = Storage.getRecords();
    if (!records.length) {
      dom.bestRecords.innerHTML = '<h4>🏆 最佳记录</h4><div class="record-list"><span>暂无记录，快来挑战吧！</span></div>';
      return;
    }
    var html = '<h4>🏆 最佳记录</h4><div class="record-list">';
    records.slice(0, 5).forEach(function (r, i) {
      var ch = CONFIG.getCharacter(r.characterId);
      var th = CONFIG.getTheme(r.themeId);
      html += '<span>' + (i + 1) + '. ' + ch.emoji + ' ' + ch.name +
        ' | ' + th.emoji + ' ' + th.name +
        ' | ' + r.duration + '秒 | ' + r.score + '分</span>';
    });
    html += '</div>';
    dom.bestRecords.innerHTML = html;
  }

  function checkResume() {
    var last = Storage.getLastGame();
    if (last && last.state === 'playing') {
      dom.resumeBtn.style.display = 'inline-block';
    } else {
      dom.resumeBtn.style.display = 'none';
    }
  }

  function bindMenuEvents() {
    dom.startBtn.addEventListener('click', function () {
      var settings = getMenuSettings();
      Game.startNew(settings);
    });

    dom.resumeBtn.addEventListener('click', function () {
      Game.resume();
    });

    dom.playAgainBtn.addEventListener('click', function () {
      var settings = getMenuSettings();
      Game.startNew(settings);
    });

    dom.backToMenuBtn.addEventListener('click', function () {
      Game.backToMenu();
    });

    dom.resumeFromPauseBtn.addEventListener('click', function () {
      Game.resumeFromPause();
    });

    dom.quitBtn.addEventListener('click', function () {
      Game.backToMenu();
    });

    dom.pauseBtn.addEventListener('click', function () {
      Game.pause();
    });
  }

  function getMenuSettings() {
    var settings = Storage.getSettings();
    var diffEl = document.querySelector('input[name="difficulty"]:checked');
    var aiEl = document.querySelector('input[name="aiCount"]:checked');
    return {
      characterId: settings.characterId || CONFIG.GAME.defaultCharacter,
      themeId: settings.themeId || CONFIG.GAME.defaultTheme,
      difficulty: diffEl ? diffEl.value : (settings.difficulty || CONFIG.GAME.defaultDifficulty),
      aiCount: aiEl ? parseInt(aiEl.value) : (settings.aiCount || CONFIG.GAME.defaultAiCount)
    };
  }

  function showScreen(screen) {
    var screens = ['menuScreen', 'hud', 'resultScreen', 'pauseScreen'];
    screens.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    var target = document.getElementById(screen);
    if (target) target.classList.add('active');
    currentScreen = screen;
  }

  function updateHUD(state) {
    if (!state) return;

    var tl = Math.max(0, Math.ceil(state.timeLeft));
    if (tl !== lastTimeLeft && dom.countdown) {
      dom.countdown.textContent = tl;
      lastTimeLeft = tl;
    }

    if (state.aliveCount !== lastAliveCount && dom.survivors) {
      dom.survivors.textContent = state.aliveCount + '/' + state.totalCount;
      lastAliveCount = state.aliveCount;
    }

    if (state.playerRank !== lastRank && dom.rank) {
      dom.rank.textContent = state.playerRank;
      lastRank = state.playerRank;
    }

    if (state.aliveCount !== lastAliveCount || state.characters.length !== Object.keys(chipRefs).length) {
      renderPlayersBar(state.characters);
    }

    if (state.player) {
      updateSkillCooldown(state.player);
      updateCrouchBar(state.player);
    }
  }

  function updatePlayerBars(player, characters) {
    if (!characters) return;
    for (var i = 0; i < characters.length; i++) {
      var ch = characters[i];
      var fill = fillRefs[ch.id];
      var chip = chipRefs[ch.id];
      if (!fill || !chip) continue;

      var stabPct = ch.stability / ch.maxStability;
      var newWidth = Math.round(stabPct * 100);
      if (fill._lastWidth !== newWidth) {
        fill.style.width = newWidth + '%';
        fill._lastWidth = newWidth;
      }

      var newClass = stabPct <= 0.25 ? 'danger' : stabPct <= 0.5 ? 'warn' : '';
      if (fill._lastClass !== newClass) {
        fill.classList.remove('warn', 'danger');
        if (newClass) fill.classList.add(newClass);
        fill._lastClass = newClass;
      }

      var isOut = !ch.alive;
      if (chip._isOut !== isOut) {
        if (isOut) chip.classList.add('out');
        else chip.classList.remove('out');
        chip._isOut = isOut;
      }
    }
  }

  function renderPlayersBar(characters) {
    if (!dom.playersBar) return;
    dom.playersBar.innerHTML = '';
    chipRefs = {};
    fillRefs = {};

    for (var i = 0; i < characters.length; i++) {
      var ch = characters[i];
      var chip = document.createElement('div');
      chip.className = 'player-chip' + (ch.alive ? '' : ' out');
      chip.dataset.id = ch.id;
      chip._isOut = !ch.alive;

      var stabPct = ch.stability / ch.maxStability;
      var barClass = stabPct > 0.5 ? '' : stabPct > 0.25 ? 'warn' : 'danger';

      var barFill = document.createElement('div');
      barFill.className = 'chip-bar-fill ' + barClass;
      barFill.style.width = Math.round(stabPct * 100) + '%';
      barFill._lastWidth = Math.round(stabPct * 100);
      barFill._lastClass = barClass;

      var bar = document.createElement('div');
      bar.className = 'chip-bar';
      bar.appendChild(barFill);

      var emoji = document.createElement('span');
      emoji.className = 'chip-emoji';
      emoji.textContent = ch.emoji;

      var name = document.createElement('span');
      name.className = 'chip-name';
      name.textContent = ch.isPlayer ? '你' : ch.name;

      chip.appendChild(emoji);
      chip.appendChild(name);
      chip.appendChild(bar);

      dom.playersBar.appendChild(chip);
      chipRefs[ch.id] = chip;
      fillRefs[ch.id] = barFill;
    }
  }

  function updateSkillCooldown(player) {
    if (!dom.skillCooldown) return;
    var text;
    var cooling;
    if (player.skillActive) {
      text = '生效中';
      cooling = false;
    } else if (player.skillCooldownTimer > 0) {
      text = Math.ceil(player.skillCooldownTimer / 1000) + 's';
      cooling = true;
    } else {
      text = '就绪';
      cooling = false;
    }
    if (text !== lastSkillText) {
      dom.skillCooldown.textContent = text;
      lastSkillText = text;
    }
    if (cooling) dom.skillCooldown.classList.add('cooling');
    else dom.skillCooldown.classList.remove('cooling');
  }

  function updateCrouchBar(player) {
    if (!dom.crouchBar) return;
    if (!crouchBarFill) {
      crouchBarFill = dom.crouchBar.querySelector('.crouch-bar-fill');
      if (!crouchBarFill) {
        crouchBarFill = document.createElement('div');
        crouchBarFill.className = 'crouch-bar-fill';
        dom.crouchBar.appendChild(crouchBarFill);
      }
    }
    var newW = Math.round(player.crouchAmount * 100);
    if (crouchBarFill._lastW !== newW) {
      crouchBarFill.style.width = newW + '%';
      crouchBarFill._lastW = newW;
    }
  }

  function showEffectAlert(effect) {
    if (!dom.effectAlert) return;
    var cfg = CONFIG.EFFECTS[effect.type];
    if (!cfg) return;

    dom.effectAlert.textContent = cfg.icon + ' ' + cfg.name + '!';
    dom.effectAlert.className = 'effect-alert show ' + (cfg.visualClass || '');
    clearTimeout(dom.effectAlert._timer);
    dom.effectAlert._timer = setTimeout(function () {
      dom.effectAlert.classList.remove('show');
    }, 1200);
  }

  function showResult(result) {
    if (!dom.resultScreen) return;

    if (dom.resultTitle) {
      dom.resultTitle.textContent = result.win ? '🎉 胜利！' : '💀 挑战失败';
      dom.resultTitle.className = 'result-title ' + (result.win ? 'win' : 'lose');
    }
    if (dom.statDuration) dom.statDuration.textContent = result.duration + '秒';
    if (dom.statRank) dom.statRank.textContent = result.rank;
    if (dom.statSurvivors) dom.statSurvivors.textContent = result.aliveCount + '/' + result.totalCount;
    if (dom.statScore) dom.statScore.textContent = result.score;

    showScreen('resultScreen');
  }

  function showMenu() {
    renderBestRecords();
    checkResume();
    showScreen('menuScreen');
  }

  function showHUD() {
    lastTimeLeft = -1;
    lastAliveCount = -1;
    lastRank = -1;
    lastSkillText = '';
    crouchBarFill = null;
    chipRefs = {};
    fillRefs = {};
    showScreen('hud');
  }

  function showPause() {
    showScreen('pauseScreen');
  }

  return {
    init: init,
    showScreen: showScreen,
    updateHUD: updateHUD,
    updatePlayerBars: updatePlayerBars,
    showEffectAlert: showEffectAlert,
    showResult: showResult,
    showMenu: showMenu,
    showHUD: showHUD,
    showPause: showPause,
    getMenuSettings: getMenuSettings
  };

})();
