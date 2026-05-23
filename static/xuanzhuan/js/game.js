var Game = (function () {

  var state = {
    running: false,
    paused: false,
    timeLeft: 60,
    platformAngle: 0,
    platformAngularVel: 0,
    characters: [],
    player: null,
    difficulty: null,
    theme: null,
    totalCount: 0,
    aliveCount: 0,
    playerRank: 1,
    gameOver: false,
    result: null
  };

  var saveInterval = null;
  var hudDirty = false;
  var lastAliveCount = -1;
  var lastRank = -1;
  var lastTimeLeft = -1;
  var aliveList = [];

  function startNew(settings) {
    resetState();

    state.difficulty = CONFIG.getDifficulty(settings.difficulty);
    state.theme = CONFIG.getTheme(settings.themeId);
    state.timeLeft = state.difficulty.duration;

    var playerChar = CONFIG.getCharacter(settings.characterId);
    state.player = Character.create(playerChar, {
      isPlayer: true,
      angle: -Math.PI / 2
    });
    state.characters.push(state.player);

    var aiCount = settings.aiCount || CONFIG.GAME.defaultAiCount;
    var aiCharConfigs = getAICharacters(aiCount, settings.characterId);
    for (var i = 0; i < aiCharConfigs.length; i++) {
      var angle = -Math.PI / 2 + ((i + 1) * Math.PI * 2 / (aiCharConfigs.length + 1));
      var aiChar = Character.create(aiCharConfigs[i].config, {
        isAI: true,
        isPlayer: false,
        angle: angle
      });
      aiChar.name = aiCharConfigs[i].config.name;
      state.characters.push(aiChar);
    }

    state.totalCount = state.characters.length;
    state.aliveCount = state.totalCount;

    Effects.init(onEffectTrigger);
    Effects.scheduleFirst(state.difficulty, performance.now());

    Scene.init(document.getElementById('gameCanvas'), state.theme);
    Input.reset();

    state.running = true;
    state.paused = false;
    state.gameOver = false;
    state.result = null;
    state.lastTime = performance.now();

    Storage.saveSettings(settings);
    Storage.clearLastGame();

    UI.showHUD();
    hudDirty = true;

    startSaveInterval();
    requestAnimationFrame(loop);
  }

  function getAICharacters(count, excludeId) {
    var available = CONFIG.CHARACTERS.filter(function (c) { return c.id !== excludeId; });
    var result = [];
    var aiNames = ['小明', '小红', '小刚', '阿强', '小美', '大壮'];

    for (var i = 0; i < count; i++) {
      var config = available[i % available.length];
      result.push({
        config: config,
        displayName: aiNames[i % aiNames.length]
      });
    }
    return result;
  }

  function resetState() {
    state.running = false;
    state.paused = false;
    state.platformAngle = 0;
    state.platformAngularVel = 0;
    state.characters = [];
    state.player = null;
    state.gameOver = false;
    state.result = null;
    hudDirty = false;
    lastAliveCount = -1;
    lastRank = -1;
    lastTimeLeft = -1;
    aliveList = [];
    if (saveInterval) {
      clearInterval(saveInterval);
      saveInterval = null;
    }
  }

  function loop(timestamp) {
    if (!state.running) return;

    if (state.paused) {
      state.lastTime = timestamp;
      requestAnimationFrame(loop);
      return;
    }

    var dt = Math.min(40, timestamp - state.lastTime);
    state.lastTime = timestamp;

    update(dt, timestamp);
    render(dt);

    if (state.running) {
      requestAnimationFrame(loop);
    }
  }

  function refreshAliveList() {
    aliveList.length = 0;
    for (var i = 0; i < state.characters.length; i++) {
      if (state.characters[i].alive) {
        aliveList.push(state.characters[i]);
      }
    }
    return aliveList;
  }

  function update(dt, now) {
    state.timeLeft -= dt / 1000;

    var diff = state.difficulty;
    state.platformAngularVel = diff.rotationSpeed;
    state.platformAngle += state.platformAngularVel * dt / 1000 * 0.5;

    Effects.update(now, dt, diff, state);

    if (state.player && state.player.alive) {
      handlePlayerInput(dt);
    }

    for (var i = 0; i < state.characters.length; i++) {
      var ch = state.characters[i];
      if (ch.isAI) {
        AI.update(ch, dt, state);
      }
      Character.update(ch, dt, state.platformAngle, diff);
      Character.handlePlatformRotation(ch, state.platformAngularVel, dt);
    }

    var newAlive = countAlive();
    if (newAlive !== state.aliveCount) {
      state.aliveCount = newAlive;
      updateRanks();
      hudDirty = true;
    }

    var tl = Math.ceil(state.timeLeft);
    if (tl !== lastTimeLeft) {
      lastTimeLeft = tl;
      hudDirty = true;
    }

    if (state.player && state.player.rank !== lastRank) {
      lastRank = state.player.rank;
      hudDirty = true;
    }

    if (state.timeLeft <= 0 || state.aliveCount <= 1 || (state.player && !state.player.alive)) {
      endGame();
    }
  }

  function handlePlayerInput(dt) {
    var keys = Input.isDown();
    var pressed = Input.consumePressed();
    var p = state.player;

    if (!p.alive) return;

    if (keys.left) {
      Character.move(p, -1, dt);
    }
    if (keys.right) {
      Character.move(p, 1, dt);
    }

    Character.setCrouch(p, keys.down);

    if (pressed.space) {
      Character.activateSkill(p);
    }
  }

  function render(dt) {
    var tilt = Effects.getCurrentTilt();
    var effects = Effects.getActiveEffects();
    Scene.render(state.platformAngle, state.characters, tilt, effects, dt);

    if (hudDirty) {
      UI.updateHUD({
        timeLeft: state.timeLeft,
        aliveCount: state.aliveCount,
        totalCount: state.totalCount,
        playerRank: state.playerRank,
        player: state.player,
        characters: state.characters
      });
      hudDirty = false;
    }

    UI.updatePlayerBars(state.player, state.characters);
  }

  function countAlive() {
    var count = 0;
    for (var i = 0; i < state.characters.length; i++) {
      if (state.characters[i].alive) count++;
    }
    return count;
  }

  function getAliveCharacters() {
    return refreshAliveList();
  }

  function updateRanks() {
    var sorted = state.characters.slice().sort(function (a, b) {
      if (a.alive && !b.alive) return -1;
      if (!a.alive && b.alive) return 1;
      if (a.alive && b.alive) {
        return b.stability - a.stability;
      }
      return b.surviveTime - a.surviveTime;
    });

    for (var i = 0; i < sorted.length; i++) {
      sorted[i].rank = i + 1;
    }

    if (state.player) {
      state.playerRank = state.player.rank;
    }
  }

  function endGame() {
    if (state.gameOver) return;
    state.gameOver = true;
    state.running = false;

    var sorted = state.characters.slice().sort(function (a, b) {
      if (a.alive && !b.alive) return -1;
      if (!a.alive && b.alive) return 1;
      if (a.alive && b.alive) {
        return b.stability - a.stability;
      }
      return b.surviveTime - a.surviveTime;
    });

    var player = state.player;
    var win = player.alive && state.aliveCount > 0 && (state.timeLeft <= 0 || state.aliveCount === 1);
    var duration = Math.floor(player.surviveTime / 1000);
    var score = calculateScore(player, duration, win);

    state.result = {
      win: win,
      duration: duration,
      rank: player.rank,
      aliveCount: state.aliveCount,
      totalCount: state.totalCount,
      score: score
    };

    var record = {
      score: score,
      duration: duration,
      rank: player.rank,
      characterId: getPlayerCharacterId(),
      themeId: state.theme ? state.theme.id : 'kids',
      difficulty: getDifficultyId(),
      timestamp: Date.now()
    };
    Storage.addRecord(record);
    Storage.clearLastGame();

    if (saveInterval) {
      clearInterval(saveInterval);
      saveInterval = null;
    }

    setTimeout(function () {
      UI.showResult(state.result);
    }, 1500);
  }

  function getPlayerCharacterId() {
    if (!state.player) return CONFIG.GAME.defaultCharacter;
    for (var i = 0; i < CONFIG.CHARACTERS.length; i++) {
      if (CONFIG.CHARACTERS[i].name === state.player.name) {
        return CONFIG.CHARACTERS[i].id;
      }
    }
    return CONFIG.GAME.defaultCharacter;
  }

  function calculateScore(player, duration, win) {
    var base = duration * 10;
    var rankBonus = (state.totalCount - player.rank + 1) * 50;
    var winBonus = win ? 500 : 0;
    var diffMultiplier = 1;
    if (state.difficulty === CONFIG.DIFFICULTY.hard) diffMultiplier = 2;
    else if (state.difficulty === CONFIG.DIFFICULTY.normal) diffMultiplier = 1.5;
    return Math.floor((base + rankBonus + winBonus) * diffMultiplier);
  }

  function pause() {
    if (!state.running || state.gameOver) return;
    state.paused = true;
    saveGameState();
    UI.showPause();
  }

  function resumeFromPause() {
    if (!state.running) return;
    state.paused = false;
    state.lastTime = performance.now();
    UI.showHUD();
  }

  function resume() {
    var lastGame = Storage.getLastGame();
    if (!lastGame) {
      startNew(UI.getMenuSettings());
      return;
    }
    restoreGameState(lastGame);
  }

  function saveGameState() {
    if (!state.running || state.gameOver) return;
    try {
      var snapshot = {
        state: 'playing',
        timeLeft: state.timeLeft,
        platformAngle: state.platformAngle,
        platformAngularVel: state.platformAngularVel,
        player: serializeCharacter(state.player),
        characters: state.characters.map(serializeCharacter),
        difficulty: getDifficultyId(),
        themeId: state.theme ? state.theme.id : 'kids',
        totalCount: state.totalCount,
        aliveCount: state.aliveCount,
        playerRank: state.playerRank,
        savedAt: Date.now()
      };
      Storage.saveLastGame(snapshot);
    } catch (e) {
      // ignore save errors
    }
  }

  function serializeCharacter(ch) {
    if (!ch) return null;
    return {
      id: ch.id,
      name: ch.name,
      emoji: ch.emoji,
      color: ch.color,
      stability: ch.stability,
      maxStability: ch.maxStability,
      moveSpeed: ch.moveSpeed,
      resistPower: ch.resistPower,
      recoverSpeed: ch.recoverSpeed,
      skillName: ch.skillName,
      skillDuration: ch.skillDuration,
      skillCooldown: ch.skillCooldown,
      isPlayer: ch.isPlayer,
      isAI: ch.isAI,
      angle: ch.angle,
      angularVel: ch.angularVel,
      crouching: ch.crouching,
      crouchAmount: ch.crouchAmount,
      skillActive: ch.skillActive,
      skillTimer: ch.skillTimer,
      skillCooldownTimer: ch.skillCooldownTimer,
      alive: ch.alive,
      fallTimer: ch.fallTimer,
      wobble: ch.wobble,
      wobbleSpeed: ch.wobbleSpeed,
      bobPhase: ch.bobPhase,
      rank: ch.rank,
      surviveTime: ch.surviveTime,
      aiState: ch.aiState
    };
  }

  function restoreCharacter(data) {
    if (!data) return null;
    var ch = {
      id: data.id,
      name: data.name,
      emoji: data.emoji,
      color: data.color,
      stability: data.stability,
      maxStability: data.maxStability,
      moveSpeed: data.moveSpeed,
      resistPower: data.resistPower,
      recoverSpeed: data.recoverSpeed,
      skillName: data.skillName,
      skillDuration: data.skillDuration,
      skillCooldown: data.skillCooldown,
      isPlayer: data.isPlayer,
      isAI: data.isAI,
      angle: data.angle,
      angularVel: data.angularVel,
      x: 0,
      y: 0,
      crouching: data.crouching,
      crouchAmount: data.crouchAmount,
      skillActive: data.skillActive,
      skillTimer: data.skillTimer,
      skillCooldownTimer: data.skillCooldownTimer,
      alive: data.alive,
      fallTimer: data.fallTimer,
      wobble: data.wobble,
      wobbleSpeed: data.wobbleSpeed,
      bobPhase: data.bobPhase,
      rank: data.rank,
      surviveTime: data.surviveTime,
      aiState: data.aiState,
      aiTargetAngle: data.angle,
      aiReactionTimer: 0,
      aiSkillTimer: 0
    };
    Character.updatePosition(ch);
    return ch;
  }

  function restoreGameState(snapshot) {
    resetState();

    state.difficulty = CONFIG.getDifficulty(snapshot.difficulty);
    state.theme = CONFIG.getTheme(snapshot.themeId);
    state.timeLeft = snapshot.timeLeft;
    state.platformAngle = snapshot.platformAngle;
    state.platformAngularVel = snapshot.platformAngularVel;
    state.totalCount = snapshot.totalCount;
    state.aliveCount = snapshot.aliveCount;
    state.playerRank = snapshot.playerRank;

    state.characters = snapshot.characters.map(restoreCharacter);
    state.player = state.characters.find(function (c) { return c.isPlayer; });

    Effects.init(onEffectTrigger);
    Effects.scheduleFirst(state.difficulty, performance.now());

    Scene.init(document.getElementById('gameCanvas'), state.theme);
    Input.reset();

    state.running = true;
    state.paused = false;
    state.gameOver = false;
    state.result = null;
    state.lastTime = performance.now();

    UI.showHUD();
    hudDirty = true;
    startSaveInterval();
    requestAnimationFrame(loop);
  }

  function getDifficultyId() {
    if (!state.difficulty) return 'normal';
    var keys = Object.keys(CONFIG.DIFFICULTY);
    for (var i = 0; i < keys.length; i++) {
      if (CONFIG.DIFFICULTY[keys[i]] === state.difficulty) return keys[i];
    }
    return 'normal';
  }

  function startSaveInterval() {
    if (saveInterval) clearInterval(saveInterval);
    saveInterval = setInterval(function () {
      saveGameState();
    }, 12000);
  }

  function onEffectTrigger(effect) {
    UI.showEffectAlert(effect);
    if (state.player && state.player.alive) {
      if (effect.type === 'bump') {
        Scene.spawnParticles(state.player.x, state.player.y - 20, 12, 'rgb(255,180,80)');
      }
    }
  }

  function backToMenu() {
    state.running = false;
    state.paused = false;
    if (saveInterval) {
      clearInterval(saveInterval);
      saveInterval = null;
    }
    Storage.clearLastGame();
    UI.showMenu();
  }

  function isRunning() {
    return state.running && !state.paused;
  }

  return {
    startNew: startNew,
    resume: resume,
    resumeFromPause: resumeFromPause,
    pause: pause,
    backToMenu: backToMenu,
    isRunning: isRunning,
    getAliveCharacters: getAliveCharacters
  };

})();
