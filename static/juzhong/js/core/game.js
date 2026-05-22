var Game = (function() {
  var lastTime = 0;
  var isRunning = false;
  var deltaTime = 0;

  function init() {
    Render.init();
    HUD.init();
    Input.init();
    Effects.clear();

    Input.on('onPull', function(data) {
      if (GameState.getScreen() === 'lifting') {
        Lift.onPull(data);
      }
    });
    Input.on('onSquat', function() {
      if (GameState.getScreen() === 'lifting') {
        Lift.onSquat();
      }
    });
    Input.on('onJerk', function() {
      if (GameState.getScreen() === 'lifting') {
        Lift.onJerk();
      }
    });
    Input.on('onLock', function() {
      if (GameState.getScreen() === 'lifting') {
        Lift.onLock();
      }
    });
    Input.on('onLockRelease', function() {
      if (GameState.getScreen() === 'lifting') {
        Lift.onLockRelease();
      }
    });

    Input.on('onMenuConfirm', function() {
      handleMenuConfirm();
    });

    var canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.addEventListener('click', function(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        HUD.handleClick(x, y);
      });
      canvas.addEventListener('mousemove', function(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        HUD.handleHover(x, y);
      });
    }

    GameState.init();

    var savedTournament = GameState.getTournament();
    if (savedTournament && savedTournament.active) {
      Tournament.restore(savedTournament);
    }

    var screen = GameState.getScreen();
    if (screen === 'lifting') {
      GameState.setScreen('tournament');
      screen = 'tournament';
    }

    window.addEventListener('beforeunload', function() {
      if (Tournament.isActive()) {
        GameState.setTournament(Tournament.getState());
      }
      GameState.save();
    });

    updateTouchControlsVisibility();
  }

  function updateTouchControlsVisibility() {
    var touchControls = document.getElementById('touch-controls');
    if (!touchControls) return;

    var screen = GameState.getScreen();
    var showTouch = (screen === 'lifting');
    touchControls.style.display = showTouch ? 'flex' : 'none';
  }

  function handleMenuConfirm() {
    var screen = GameState.getScreen();

    if (screen === 'menu') {
      GameState.setScreen('opponent_select');
      updateTouchControlsVisibility();
    } else if (screen === 'opponent_select') {
      startTournament();
    } else if (screen === 'result') {
      Tournament.nextTurn();
      if (Tournament.getCurrentTurn() === 'opponent') {
        startOpponentTurn();
      }
      if (Tournament.isCompleted()) {
        GameState.setScreen('game_over');
      } else {
        GameState.setScreen('tournament');
      }
      updateTouchControlsVisibility();
    } else if (screen === 'game_over') {
      GameState.clearGameState();
      GameState.setScreen('menu');
      updateTouchControlsVisibility();
    }
  }

  function startTournament() {
    var opponent = GameState.getSelectedOpponent();
    if (!opponent) {
      GameState.setScreen('opponent_select');
      updateTouchControlsVisibility();
      return;
    }

    Tournament.init(opponent);
    GameState.setTournament(Tournament.getState());
    GameState.save();

    startNextLift();
  }

  function startNextLift() {
    var liftType = CONFIG.getLiftType(Tournament.getCurrentLiftType());
    var weight = Tournament.getPlayerWeight();

    GameState.setCurrentLift({ typeId: liftType.id, weight: weight });
    GameState.setScreen('lifting');
    GameState.save();
    updateTouchControlsVisibility();

    Lift.start(liftType, weight);
    Effects.clear();
  }

  function startOpponentTurn() {
    var liftType = Tournament.getCurrentLiftType();
    var weight = Tournament.getOpponentWeightForAttempt();
    var attempt = Tournament.getCurrentAttempt();

    OpponentAI.startAttempt(liftType, weight, attempt);
    var result = OpponentAI.simulate();

    Tournament.recordOpponentResult(liftType, result.weight, result.success);
    Tournament.nextTurn();

    GameState.setTournament(Tournament.getState());

    if (Tournament.isCompleted()) {
      GameState.setScreen('game_over');
    }
  }

  function onLiftComplete() {
    var liftState = Lift.getState();
    var liftType = Tournament.getCurrentLiftType();
    var weight = liftState.weight;

    Tournament.recordPlayerResult(liftType, weight, true);

    var cx = Render.getWidth() / 2;
    var cy = Render.getPlatform().y - 100;
    Effects.triggerSuccess(cx, cy);
    Effects.triggerBarBend(cx, cy, 5);

    var records = Storage.loadRecords();
    if (weight > records.bestSnatch && liftType === 'snatch') {
      Effects.triggerRecord(cx, cy);
    }
    if (weight > records.bestCleanJerk && liftType === 'cleanjerk') {
      Effects.triggerRecord(cx, cy);
    }

    GameState.setLiftResult({ success: true, weight: weight });
    GameState.setScreen('result');
    GameState.save();
    updateTouchControlsVisibility();
  }

  function onLiftFailed() {
    var liftState = Lift.getState();
    var liftType = Tournament.getCurrentLiftType();
    var weight = liftState.weight;

    Tournament.recordPlayerResult(liftType, weight, false);

    var cx = Render.getWidth() / 2;
    var cy = Render.getPlatform().y - 100;
    Effects.triggerFail(cx, cy);

    GameState.setLiftResult({ success: false, weight: weight });
    GameState.setScreen('result');
    GameState.save();
    updateTouchControlsVisibility();
  }

  function update(dt) {
    Input.update(dt);
    Effects.update(dt);

    var screen = GameState.getScreen();

    switch (screen) {
      case 'lifting':
        updateLifting(dt);
        break;
    }
  }

  function updateLifting(dt) {
    Lift.update(dt);

    if (Lift.isComplete()) {
      onLiftComplete();
    } else if (Lift.isFailed()) {
      onLiftFailed();
    }
  }

  function render() {
    Render.clear();

    updateTouchControlsVisibility();

    var screen = GameState.getScreen();
    var shake = Effects.getScreenShake();
    var flash = Effects.getScreenFlash();

    var canvas = document.getElementById('game-canvas');
    if (canvas) {
      if (shake > 0) {
        var sx = (Math.random() - 0.5) * shake;
        var sy = (Math.random() - 0.5) * shake;
        canvas.style.transform = 'translate(' + sx + 'px,' + sy + 'px)';
      } else {
        canvas.style.transform = '';
      }
    }

    Render.drawBackground();

    switch (screen) {
      case 'menu':
        renderMenu();
        break;
      case 'opponent_select':
        renderOpponentSelect();
        break;
      case 'tournament':
        renderTournament();
        break;
      case 'lifting':
        renderLifting();
        break;
      case 'result':
        renderResult();
        break;
      case 'game_over':
        renderGameOver();
        break;
    }

    if (flash.alpha > 0) {
      var ctx = canvas.getContext('2d');
      ctx.save();
      ctx.globalAlpha = flash.alpha;
      ctx.fillStyle = flash.color;
      ctx.fillRect(0, 0, Render.getWidth(), Render.getHeight());
      ctx.restore();
    }
  }

  function renderMenu() {
    var w = Render.getWidth();
    var h = Render.getHeight();

    HUD.clear();

    HUD.addText(w / 2, h * 0.15, '重量挙げ', {
      fontSize: 68,
      color: '#fff',
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(233,69,96,0.9)'
    });

    HUD.addText(w / 2, h * 0.25, 'WEIGHTLIFTING', {
      fontSize: 22,
      color: '#e94560',
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(233,69,96,0.5)'
    });

    HUD.addText(w / 2, h * 0.30, 'CHAMPIONSHIP', {
      fontSize: 18,
      color: '#f9ca24',
      align: 'center',
      bold: true
    });

    var records = GameState.getRecords();
    if (records.bestTotal > 0) {
      HUD.addText(w / 2, h * 0.38, 'BEST: ' + records.bestTotal + 'kg', {
        fontSize: 18,
        color: '#f9ca24',
        align: 'center',
        shadow: true,
        shadowColor: 'rgba(249,202,36,0.5)'
      });
    }

    HUD.addButton(w / 2 - 110, h * 0.5, 220, 55, 'START', {
      bgColor: 'rgba(233,69,96,0.9)',
      fontSize: 22,
      onClick: function() {
        GameState.setScreen('opponent_select');
        updateTouchControlsVisibility();
      }
    });

    HUD.addText(w / 2, h * 0.68, 'PRESS ENTER OR TAP START', {
      fontSize: 14,
      color: '#888',
      align: 'center'
    });

    HUD.addText(w / 2, h * 0.78, 'SPACE: PULL   \u2193: SQUAT   \u2191: JERK   HOLD: LOCK', {
      fontSize: 13,
      color: '#555',
      align: 'center'
    });

    HUD.addText(w / 2, h - 30, '\u00a9 IWF CHAMPIONSHIP 2026', {
      fontSize: 10,
      color: '#333',
      align: 'center'
    });

    HUD.render();
  }

  function renderOpponentSelect() {
    var w = Render.getWidth();
    var h = Render.getHeight();

    HUD.clear();

    HUD.addText(w / 2, 50, 'SELECT OPPONENT', {
      fontSize: 32,
      color: '#fff',
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(233,69,96,0.6)'
    });

    var opponents = CONFIG.opponents;
    var records = GameState.getRecords();
    var beaten = records.opponentsBeaten || [];
    var btnW = Math.min(200, (w - 90) / 2);
    var btnH = 75;
    var startX = w / 2 - (btnW * 2 + 30);
    var startY = h * 0.25;

    for (var i = 0; i < opponents.length; i++) {
      var op = opponents[i];
      var col = i % 2;
      var row = Math.floor(i / 2);
      var x = startX + col * (btnW + 30);
      var y = startY + row * (btnH + 18);

      var isBeaten = beaten.indexOf(op.id) !== -1;
      var bgColor = isBeaten ? 'rgba(78,205,196,0.25)' : 'rgba(233,69,96,0.15)';
      var borderColor = isBeaten ? '#4ecdc4' : op.color;

      HUD.addButton(x, y, btnW, btnH, '', {
        bgColor: bgColor,
        onClick: (function(opp) {
          return function() {
            GameState.setSelectedOpponent(opp);
            startTournament();
          };
        })(op)
      });

      HUD.addText(x + btnW / 2, y + 22, op.name, {
        fontSize: 20,
        color: op.color,
        align: 'center',
        bold: true,
        shadow: true,
        shadowColor: 'rgba(0,0,0,0.8)'
      });

      HUD.addText(x + btnW / 2, y + 48, op.best + 'kg  ' + Math.round(op.difficulty * 100) + '%', {
        fontSize: 14,
        color: '#ccc',
        align: 'center'
      });

      if (isBeaten) {
        HUD.addText(x + btnW - 20, y + 12, '\u2605', {
          fontSize: 18,
          color: '#f9ca24',
          align: 'center',
          shadow: true,
          shadowColor: 'rgba(249,202,36,0.8)'
        });
      }
    }

    HUD.addButton(25, h - 60, 90, 38, 'BACK', {
      bgColor: 'rgba(100,100,100,0.5)',
      fontSize: 14,
      onClick: function() {
        GameState.setScreen('menu');
        updateTouchControlsVisibility();
      }
    });

    HUD.render();
  }

  function renderTournament() {
    var w = Render.getWidth();
    var h = Render.getHeight();

    HUD.clear();
    Render.drawPlatform();
    Render.drawOpponentAthlete(null);
    Render.drawScoreBoard(Tournament.getState());

    var liftType = Tournament.getCurrentLiftType();
    var liftName = liftType === 'snatch' ? '\u30b9\u30ca\u30c3\u30c1' : '\u30af\u30ea\u30fc\u30f3';
    var attempt = Tournament.getCurrentAttempt();

    HUD.addText(w / 2, 28, liftName + '  ' + attempt + '/3', {
      fontSize: 26,
      color: '#fff',
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.8)'
    });

    HUD.addText(w / 2, 68, Tournament.getPlayerWeight() + 'kg', {
      fontSize: 52,
      color: '#f9ca24',
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(249,202,36,0.6)'
    });

    HUD.addButton(w / 2 - 75, h * 0.42, 150, 50, 'LIFT', {
      bgColor: 'rgba(233,69,96,0.9)',
      fontSize: 22,
      onClick: function() {
        startNextLift();
      }
    });

    HUD.addButton(w / 2 - 110, h * 0.55, 75, 36, '+2.5', {
      bgColor: 'rgba(78,205,196,0.6)',
      fontSize: 14,
      onClick: function() {
        var nw = Tournament.getPlayerWeight() + CONFIG.weightStep;
        if (nw <= CONFIG.gameConfig.maxWeight) {
          Tournament.setPlayerWeight(nw);
          GameState.setTournament(Tournament.getState());
        }
      }
    });

    HUD.addButton(w / 2 + 35, h * 0.55, 75, 36, '-2.5', {
      bgColor: 'rgba(233,69,96,0.5)',
      fontSize: 14,
      onClick: function() {
        var nw = Tournament.getPlayerWeight() - CONFIG.weightStep;
        if (nw >= CONFIG.gameConfig.minWeight) {
          Tournament.setPlayerWeight(nw);
          GameState.setTournament(Tournament.getState());
        }
      }
    });

    HUD.addButton(20, h - 55, 85, 35, 'QUIT', {
      bgColor: 'rgba(100,100,100,0.5)',
      fontSize: 13,
      onClick: function() {
        GameState.clearGameState();
        GameState.setScreen('menu');
        updateTouchControlsVisibility();
      }
    });

    HUD.render();
  }

  function renderLifting() {
    var w = Render.getWidth();
    var h = Render.getHeight();
    var liftState = Lift.getState();

    HUD.clear();
    Render.drawPlatform();
    Render.drawOpponentAthlete(liftState);
    Render.drawAthlete(liftState, true);
    Render.drawBarbell(liftState, true);
    Render.drawScoreBoard(Tournament.getState());
    Effects.render(document.getElementById('game-canvas').getContext('2d'), 0, 0);

    var phaseCfg = CONFIG.phaseConfig[liftState.phase];
    var phaseLabel = phaseCfg ? phaseCfg.label.toUpperCase() : '';
    var phaseProgress = Math.min(1, liftState.phaseTimer / liftState.phaseDuration);

    HUD.addText(w / 2, 28, phaseLabel, {
      fontSize: 38,
      color: '#e94560',
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(233,69,96,0.6)'
    });

    HUD.addBar(w / 2 - 140, 72, 280, 18, phaseProgress * 100, 100, {
      bgColor: 'rgba(0,0,0,0.6)',
      fillColor: '#e94560',
      borderColor: '#fff',
      borderWidth: 2,
      radius: 9
    });

    var hintText = '';
    var hintColor = '#fff';
    if (liftState.phase === 'pull') {
      hintText = 'TAP SPACE!  x' + liftState.pullCount;
      hintColor = liftState.pullCount > 5 ? '#4ecdc4' : '#f5a623';
    } else if (liftState.phase === 'squat' || liftState.phase === 'dip') {
      hintText = 'PRESS \u2193 TO SQUAT';
      hintColor = '#4ecdc4';
    } else if (liftState.phase === 'stand' || liftState.phase === 'jerk') {
      hintText = 'PRESS \u2191 TO JERK';
      hintColor = '#f9ca24';
    } else if (liftState.phase === 'lock') {
      if (liftState.isLocking) {
        hintText = 'HOLD! ' + liftState.lockHoldTimer.toFixed(1) + 's';
        hintColor = '#4ecdc4';
      } else {
        hintText = 'HOLD SPACE TO LOCK';
        hintColor = '#f5a623';
      }
    }

    HUD.addText(w / 2, 105, hintText, {
      fontSize: 15,
      color: hintColor,
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.8)'
    });

    var powerNeeded = Lift.getThreshold();
    HUD.addBar(w / 2 - 140, h - 75, 280, 14, liftState.phasePower, 100, {
      bgColor: 'rgba(0,0,0,0.5)',
      fillColor: liftState.phasePower >= powerNeeded ? '#4ecdc4' : '#e94560',
      borderColor: '#fff',
      borderWidth: 1,
      radius: 7
    });

    HUD.addText(w / 2, h - 52, 'POWER: ' + Math.floor(liftState.phasePower) + '%  NEED: ' + Math.floor(powerNeeded) + '%', {
      fontSize: 12,
      color: '#aaa',
      align: 'center'
    });

    HUD.addText(w / 2, h - 30, liftState.weight + 'kg', {
      fontSize: 14,
      color: '#f9ca24',
      align: 'center',
      bold: true
    });

    HUD.render();
  }

  function renderResult() {
    var w = Render.getWidth();
    var h = Render.getHeight();
    var result = GameState.getLiftResult();

    HUD.clear();
    Render.drawPlatform();
    Render.drawScoreBoard(Tournament.getState());

    if (result) {
      if (result.success) {
        HUD.addText(w / 2, h * 0.22, 'GOOD LIFT!', {
          fontSize: 56,
          color: '#4ecdc4',
          align: 'center',
          bold: true,
          shadow: true,
          shadowColor: 'rgba(78,205,196,0.8)'
        });

        HUD.addText(w / 2, h * 0.38, result.weight + 'kg', {
          fontSize: 44,
          color: '#f9ca24',
          align: 'center',
          bold: true,
          shadow: true,
          shadowColor: 'rgba(249,202,36,0.6)'
        });

        var scoreInfo = CONFIG.getScoreForWeight(result.weight);
        HUD.addText(w / 2, h * 0.48, scoreInfo.rank + '  ' + scoreInfo.score + 'pts', {
          fontSize: 22,
          color: scoreInfo.color,
          align: 'center',
          bold: true,
          shadow: true,
          shadowColor: 'rgba(0,0,0,0.5)'
        });

        HUD.addText(w / 2, h * 0.55, '\u2605 WHITE LIGHTS \u2605', {
          fontSize: 16,
          color: '#fff',
          align: 'center'
        });
      } else {
        HUD.addText(w / 2, h * 0.25, 'NO LIFT', {
          fontSize: 56,
          color: '#e94560',
          align: 'center',
          bold: true,
          shadow: true,
          shadowColor: 'rgba(233,69,96,0.8)'
        });

        HUD.addText(w / 2, h * 0.42, result.weight + 'kg', {
          fontSize: 32,
          color: '#888',
          align: 'center'
        });

        HUD.addText(w / 2, h * 0.52, 'TRY AGAIN!', {
          fontSize: 18,
          color: '#aaa',
          align: 'center'
        });
      }
    }

    var isLastAttempt = Tournament.getCurrentAttempt() >= CONFIG.gameConfig.maxAttempts &&
                        Tournament.getCurrentLiftType() === 'cleanjerk' &&
                        Tournament.getCurrentTurn() === 'player';

    var btnLabel = isLastAttempt ? 'FINISH' : 'NEXT';

    HUD.addButton(w / 2 - 90, h * 0.68, 180, 50, btnLabel, {
      bgColor: 'rgba(233,69,96,0.9)',
      fontSize: 20,
      onClick: function() {
        Tournament.nextTurn();
        if (Tournament.getCurrentTurn() === 'opponent') {
          startOpponentTurn();
        }
        GameState.setTournament(Tournament.getState());

        if (Tournament.isCompleted()) {
          GameState.setScreen('game_over');
        } else {
          GameState.setScreen('tournament');
        }
        updateTouchControlsVisibility();
      }
    });

    HUD.render();
  }

  function renderGameOver() {
    var w = Render.getWidth();
    var h = Render.getHeight();

    HUD.clear();

    var playerTotal = Tournament.getPlayerTotal();
    var opponentTotal = Tournament.getOpponentTotal();
    var winner = Tournament.getWinner();
    var score = Tournament.getPlayerScore();
    var scoreInfo = CONFIG.getScoreForWeight(playerTotal);

    HUD.addText(w / 2, h * 0.08, 'FINAL RESULT', {
      fontSize: 42,
      color: '#fff',
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(233,69,96,0.7)'
    });

    var resultColor = '#fff';
    var resultText = '';
    if (winner === 'player') {
      resultText = 'VICTORY!';
      resultColor = '#4ecdc4';
    } else if (winner === 'opponent') {
      resultText = 'DEFEAT';
      resultColor = '#e94560';
    } else {
      resultText = 'DRAW';
      resultColor = '#f9ca24';
    }

    HUD.addText(w / 2, h * 0.2, resultText, {
      fontSize: 64,
      color: resultColor,
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.8)'
    });

    HUD.addRect(w / 2 - 170, h * 0.33, 340, 200, {
      color: 'rgba(8,8,18,0.92)',
      borderColor: '#e94560',
      borderWidth: 2,
      radius: 10
    });

    HUD.addText(w / 2 - 85, h * 0.37, 'YOU', {
      fontSize: 18,
      color: '#e94560',
      align: 'center',
      bold: true
    });
    HUD.addText(w / 2 + 85, h * 0.37, 'OPP', {
      fontSize: 18,
      color: '#4a90d9',
      align: 'center',
      bold: true
    });

    var ts = Tournament.getState();
    HUD.addText(w / 2 - 85, h * 0.45, 'SNT: ' + (ts.playerBest.snatch || 0) + 'kg', {
      fontSize: 14,
      color: '#ccc',
      align: 'center'
    });
    HUD.addText(w / 2 + 85, h * 0.45, 'SNT: ' + (ts.opponentBest.snatch || 0) + 'kg', {
      fontSize: 14,
      color: '#ccc',
      align: 'center'
    });

    HUD.addText(w / 2 - 85, h * 0.52, 'CLJ: ' + (ts.playerBest.cleanjerk || 0) + 'kg', {
      fontSize: 14,
      color: '#ccc',
      align: 'center'
    });
    HUD.addText(w / 2 + 85, h * 0.52, 'CLJ: ' + (ts.opponentBest.cleanjerk || 0) + 'kg', {
      fontSize: 14,
      color: '#ccc',
      align: 'center'
    });

    HUD.addText(w / 2 - 85, h * 0.60, 'TOT: ' + playerTotal + 'kg', {
      fontSize: 20,
      color: '#f9ca24',
      align: 'center',
      bold: true
    });
    HUD.addText(w / 2 + 85, h * 0.60, 'TOT: ' + opponentTotal + 'kg', {
      fontSize: 20,
      color: '#f9ca24',
      align: 'center',
      bold: true
    });

    HUD.addText(w / 2, h * 0.72, 'RANK: ' + scoreInfo.rank + '  SCORE: ' + score, {
      fontSize: 20,
      color: scoreInfo.color,
      align: 'center',
      bold: true,
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.5)'
    });

    if (Tournament.isRecordBroken()) {
      HUD.addText(w / 2, h * 0.78, '\u2605 NEW RECORD! +200 \u2605', {
        fontSize: 16,
        color: '#ffd700',
        align: 'center',
        bold: true,
        shadow: true,
        shadowColor: 'rgba(255,215,0,0.8)'
      });
    }

    HUD.addButton(w / 2 - 100, h * 0.85, 200, 50, 'MAIN MENU', {
      bgColor: 'rgba(233,69,96,0.9)',
      fontSize: 20,
      onClick: function() {
        GameState.clearGameState();
        GameState.setScreen('menu');
        updateTouchControlsVisibility();
      }
    });

    HUD.render();
  }

  function loop(currentTime) {
    if (!isRunning) return;

    if (lastTime === 0) lastTime = currentTime;
    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (deltaTime > 0.1) deltaTime = 0.1;

    update(deltaTime);
    render();

    requestAnimationFrame(loop);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    lastTime = 0;
    requestAnimationFrame(loop);
  }

  function stop() {
    isRunning = false;
  }

  function getDeltaTime() {
    return deltaTime;
  }

  return {
    init: init,
    start: start,
    stop: stop,
    getDeltaTime: getDeltaTime
  };
})();
