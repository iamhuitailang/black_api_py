var TiaoyuanUI = {
  game: null,
  _overlay: null,
  _hud: null,
  _toast: null,

  init: function(game) {
    this.game = game;
    this._overlay = document.getElementById('overlay-layer');
    this._hud = document.getElementById('hud');
    this._toast = document.getElementById('toast-container');
  },

  _html: function(html) {
    this._overlay.innerHTML = html;
    this._overlay.style.display = 'flex';
  },

  _hide: function() {
    this._overlay.innerHTML = '';
    this._overlay.style.display = 'none';
  },

  showModeSelect: function() {
    var data = TiaoyuanStorage.load();
    var bestScore = data.bestScore || 0;
    var bestDist = data.bestDistance || 0;
    var wr = TiaoyuanStorage.get('worldRecord') || TiaoyuanConfig.WORLD_RECORD;

    var html = '<div class="screen main-screen">';
    html += '<div class="title-wrap">';
    html += '<h1 class="game-title">跳远·我能行</h1>';
    html += '<p class="game-subtitle">LONG JUMP · GO FOR IT</p>';
    html += '</div>';

    html += '<div class="mode-grid">';
    for (var i = 0; i < TiaoyuanConfig.MODES.length; i++) {
      var mode = TiaoyuanConfig.MODES[i];
      var locked = bestScore < mode.unlockScore;
      html += '<button class="mode-card' + (locked ? ' locked' : '') + '" data-mode="' + mode.id + '"' + (locked ? ' disabled' : '') + '>';
      html += '<div class="mode-name">' + mode.name + '</div>';
      html += '<div class="mode-desc">' + mode.desc + '</div>';
      if (locked) {
        html += '<div class="mode-lock">🔒 需最佳分数 ' + mode.unlockScore + '</div>';
      }
      html += '</button>';
    }
    html += '</div>';

    html += '<div class="stats-bar">';
    html += '<div class="stat-item"><span class="stat-label">最佳成绩</span><span class="stat-value gold">' + bestDist.toFixed(2) + 'm</span></div>';
    html += '<div class="stat-item"><span class="stat-label">最佳分数</span><span class="stat-value gold">' + bestScore + '</span></div>';
    html += '<div class="stat-item"><span class="stat-label">世界纪录</span><span class="stat-value">' + wr.toFixed(2) + 'm</span></div>';
    html += '</div>';

    html += '<div class="btn-row">';
    html += '<button class="btn btn-ghost" id="btn-reset">清除记录</button>';
    html += '</div>';
    html += '</div>';

    this._html(html);
    this._bindModeCards();
  },

  _bindModeCards: function() {
    var self = this;
    var cards = this._overlay.querySelectorAll('.mode-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', function() {
        var modeId = this.getAttribute('data-mode');
        var mode = TiaoyuanConfig.getMode(modeId);
        var data = TiaoyuanStorage.load();
        if ((data.bestScore || 0) < mode.unlockScore) {
          self.showToast('需要最佳分数 ' + mode.unlockScore + ' 解锁此模式', 'error');
          return;
        }
        self._hide();
        self.game.startGame(modeId);
      });
    }
    var resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (confirm('确定清除所有记录？')) {
          TiaoyuanStorage.reset();
          self.showModeSelect();
          self.showToast('记录已清除', 'success');
        }
      });
    }
  },

  showPause: function() {
    var self = this;
    var html = '<div class="screen pause-screen">';
    html += '<h2 class="screen-title">游戏暂停</h2>';
    html += '<div class="btn-row">';
    html += '<button class="btn btn-primary" id="btn-resume">继续</button>';
    html += '<button class="btn" id="btn-restart">重新开始</button>';
    html += '<button class="btn btn-ghost" id="btn-exit">返回菜单</button>';
    html += '</div>';
    html += '</div>';

    this._html(html);
    document.getElementById('btn-resume').addEventListener('click', function() { self._hide(); self.game.resume(); });
    document.getElementById('btn-restart').addEventListener('click', function() { self._hide(); self.game.restart(); });
    document.getElementById('btn-exit').addEventListener('click', function() { self._hide(); self.game.exitToMenu(); });
  },

  showResult: function(result, gs) {
    var self = this;
    var html = '<div class="screen result-screen">';

    if (result.foul) {
      html += '<div class="foul-banner">🚩 犯规！踩过起跳板</div>';
      html += '<div class="foul-sub">本次试跳无效</div>';
    } else {
      var scoreInfo = TiaoyuanConfig.getScore(result.distance);
      var wr = TiaoyuanStorage.get('worldRecord') || TiaoyuanConfig.WORLD_RECORD;
      var isWR = result.distance > wr;
      var total = scoreInfo.score + (isWR ? TiaoyuanConfig.RECORD_BONUS : 0);

      html += '<div class="result-distance">' + result.distance.toFixed(2) + '<span class="unit">m</span></div>';
      html += '<div class="result-rating ' + (scoreInfo.rating === '世界级' ? 'rating-world' : '') + '">' + scoreInfo.rating + '</div>';
      html += '<div class="result-score">得分 ' + total;
      if (isWR) html += ' <span class="wr-bonus">+' + TiaoyuanConfig.RECORD_BONUS + ' 破纪录!</span>';
      html += '</div>';
    }

    if (gs) {
      html += '<div class="mini-stats">';
      html += '<div><span class="ms-label">试跳</span><span class="ms-value">' + gs.currentAttempt + '/' + (gs.maxAttempts >= 9999 ? '∞' : gs.maxAttempts) + '</span></div>';
      html += '<div><span class="ms-label">最佳</span><span class="ms-value">' + (gs.bestDistance > 0 ? gs.bestDistance.toFixed(2) + 'm' : '-') + '</span></div>';
      html += '<div><span class="ms-label">有效</span><span class="ms-value">' + gs.validAttempts + '次</span></div>';
      if (gs.rankings && gs.rankings.length > 1) {
        var pr = '-';
        for (var i = 0; i < gs.rankings.length; i++) {
          if (gs.rankings[i].isPlayer) { pr = gs.rankings[i].rank; break; }
        }
        html += '<div><span class="ms-label">排名</span><span class="ms-value gold">第' + pr + '名</span></div>';
      }
      html += '</div>';
    }

    html += '<div class="btn-row">';
    if (gs && gs.currentAttempt < gs.maxAttempts) {
      html += '<button class="btn btn-primary" id="btn-next">下一次试跳</button>';
    }
    html += '<button class="btn btn-ghost" id="btn-menu">返回菜单</button>';
    html += '</div>';
    html += '</div>';

    this._html(html);
    var nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.addEventListener('click', function() { self._hide(); self.game.nextAttempt(); });
    document.getElementById('btn-menu').addEventListener('click', function() { self._hide(); self.game.exitToMenu(); });
  },

  showFinalResult: function(gs) {
    var self = this;
    var html = '<div class="screen result-screen">';
    html += '<h2 class="screen-title">比赛结束</h2>';

    var playerBest = gs.bestDistance || 0;
    html += '<div class="result-distance">' + playerBest.toFixed(2) + '<span class="unit">m</span></div>';

    var playerRank = '-';
    if (gs.rankings && gs.rankings.length > 0) {
      for (var i = 0; i < gs.rankings.length; i++) {
        if (gs.rankings[i].isPlayer) { playerRank = gs.rankings[i].rank; break; }
      }
    }
    html += '<div class="final-rank">第 <span class="gold">' + playerRank + '</span> 名</div>';

    if (gs.rankings && gs.rankings.length > 0) {
      html += '<div class="ranking-list">';
      html += '<div class="ranking-header">最终排名</div>';
      var topN = Math.min(gs.rankings.length, 12);
      for (var j = 0; j < topN; j++) {
        var r = gs.rankings[j];
        html += '<div class="ranking-row' + (r.isPlayer ? ' player-row' : '') + '">';
        html += '<span class="rank-num">' + r.rank + '</span>';
        html += '<span class="rank-name' + (r.isPlayer ? ' player-name' : '') + '">' + r.name + (r.isPlayer ? ' (你)' : '') + '</span>';
        html += '<span class="rank-dist">' + (r.best > 0 ? r.best.toFixed(2) + 'm' : '犯规') + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }

    html += '<div class="btn-row">';
    html += '<button class="btn btn-primary" id="btn-again">再来一局</button>';
    html += '<button class="btn btn-ghost" id="btn-menu2">返回菜单</button>';
    html += '</div>';
    html += '</div>';

    this._html(html);
    document.getElementById('btn-again').addEventListener('click', function() { self._hide(); self.game.restart(); });
    document.getElementById('btn-menu2').addEventListener('click', function() { self._hide(); self.game.exitToMenu(); });
  },

  updateHUD: function(gs) {
    if (!gs || !gs.mode) { this._hud.innerHTML = ''; return; }

    var mode = TiaoyuanConfig.getMode(gs.mode);
    var weather = TiaoyuanWeather.get();
    var attemptText = gs.maxAttempts >= 9999 ? (gs.currentAttempt + '/∞') : (gs.currentAttempt + '/' + gs.maxAttempts);

    var html = '';
    html += '<div class="hud-top-left">';
    html += '<div class="hud-mode">' + mode.name + '</div>';
    html += '<div class="hud-attempt">试跳 ' + attemptText + '</div>';
    html += '</div>';

    html += '<div class="hud-top-right">';
    html += '<div class="hud-best">最佳 ' + (gs.bestDistance > 0 ? gs.bestDistance.toFixed(2) + 'm' : '-') + '</div>';
    html += '<div class="hud-valid">有效 ' + gs.validAttempts + '次</div>';
    if (gs.rankings && gs.rankings.length > 1) {
      var pr = '-';
      for (var i = 0; i < gs.rankings.length; i++) {
        if (gs.rankings[i].isPlayer) { pr = gs.rankings[i].rank; break; }
      }
      html += '<div class="hud-rank">排名 第' + pr + '名</div>';
    }
    html += '</div>';

    if (gs.phase === 'countdown') {
      html += '<div class="countdown-overlay">' + gs.countdown + '</div>';
    } else if (gs.phase === 'ready') {
      html += '<div class="ready-hint">按 空格键 开始助跑</div>';
    }

    html += '<button class="pause-btn" id="pause-btn">暂停</button>';

    this._hud.innerHTML = html;

    var pb = document.getElementById('pause-btn');
    if (pb) {
      var g = this.game;
      pb.addEventListener('click', function() { g.pause(); });
    }
  },

  showToast: function(msg, type) {
    if (!this._toast) return;
    var t = document.createElement('div');
    t.className = 'toast' + (type ? ' toast-' + type : '');
    t.textContent = msg;
    this._toast.appendChild(t);
    var parent = this._toast;
    setTimeout(function() { if (t.parentNode) parent.removeChild(t); }, 2300);
  }
};
