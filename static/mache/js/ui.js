var UI = (function() {

  var menuEl, pauseEl, gameoverEl, tutorialEl;

  function init() {
    menuEl = document.getElementById('menu-overlay');
    pauseEl = document.getElementById('pause-overlay');
    gameoverEl = document.getElementById('gameover-overlay');
    tutorialEl = document.getElementById('tutorial-overlay');
  }

  function showMenu() {
    hideAll();
    var selected = Storage.getSelectedCarriage();

    var html = '<div class="title">沙漠马车大冒险</div>';
    html += '<div class="subtitle">黄沙戈壁 落日余晖 驾驭马车 驰骋千里</div>';

    html += '<div class="carriage-select">';
    var types = CONFIG.CARRIAGE_TYPES;
    for (var key in types) {
      if (!types.hasOwnProperty(key)) continue;
      var t = types[key];
      var selClass = (key === selected) ? ' selected' : '';
      html += '<div class="carriage-card' + selClass + '" data-carriage="' + key + '">';
      html += '<div class="carriage-name">' + t.name + '</div>';
      html += '<div class="carriage-desc">' + t.desc.replace(/\n/g, '<br>') + '</div>';
      html += '<div class="carriage-stats">';
      html += '血量: ' + t.hp + '<br>';
      html += '速度: ' + (t.speed > 1 ? '快' : t.speed < 1 ? '慢' : '中') + '<br>';
      html += '跳跃: ' + (t.jumpPower > 1 ? '强' : t.jumpPower < 1 ? '弱' : '标准') + '<br>';
      html += '得分: x' + t.scoreMultiplier;
      html += '</div></div>';
    }
    html += '</div>';

    html += '<button class="menu-btn" id="btn-start">开始游戏</button>';
    html += '<button class="menu-btn" id="btn-tutorial">操作说明</button>';

    var highScore = Storage.getHighScore();
    var highDist = Storage.getHighDistance();
    if (highScore > 0 || highDist > 0) {
      html += '<div class="record-display">历史最高: ' + highScore + ' 分 / ' + highDist + ' 米</div>';
    }

    menuEl.innerHTML = html;
    menuEl.classList.remove('hidden');

    var cards = menuEl.querySelectorAll('.carriage-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', function() {
        var cards2 = menuEl.querySelectorAll('.carriage-card');
        for (var j = 0; j < cards2.length; j++) {
          cards2[j].classList.remove('selected');
        }
        this.classList.add('selected');
        Storage.setSelectedCarriage(this.dataset.carriage);
      });
    }

    document.getElementById('btn-start').addEventListener('click', function() {
      var sel = Storage.getSelectedCarriage();
      Game.startGame(sel);
    });

    document.getElementById('btn-tutorial').addEventListener('click', function() {
      showTutorial();
    });
  }

  function showTutorial() {
    hideAll();
    var html = '<div class="tutorial-content">';
    html += '<h3>操作说明</h3>';
    html += '<p>';
    html += '<span class="key-hint">←</span> / <span class="key-hint">→</span> 或 <span class="key-hint">A</span> / <span class="key-hint">D</span> : 左右移动<br>';
    html += '<span class="key-hint">空格</span> : 跳跃 (长按蓄力高跳)<br>';
    html += '<span class="key-hint">ESC</span> 或 <span class="key-hint">P</span> : 暂停游戏';
    html += '</p>';
    html += '<h3 style="margin-top:20px">游戏目标</h3>';
    html += '<p>';
    html += '躲避石块、深坑、木桩、野兽等障碍<br>';
    html += '收集金币获得分数，拾取道具增强能力<br>';
    html += '尽可能行进更远的距离，刷新最高记录！';
    html += '</p>';
    html += '<h3 style="margin-top:20px">道具说明</h3>';
    html += '<p>';
    html += '<span style="color:#FFD700">●</span> 金币: +10 分<br>';
    html += '<span style="color:#4169E1">●</span> 护盾: 抵挡一次伤害<br>';
    html += '<span style="color:#FF4500">●</span> 加速: 短暂提速<br>';
    html += '<span style="color:#FF1493">●</span> 回血: 恢复 1 点生命';
    html += '</p>';
    html += '</div>';
    html += '<button class="menu-btn" style="margin-top:20px" id="btn-back">返回</button>';
    html += '<button class="menu-btn" id="btn-start2">开始游戏</button>';

    tutorialEl.innerHTML = html;
    tutorialEl.classList.remove('hidden');

    document.getElementById('btn-back').addEventListener('click', function() {
      showMenu();
    });

    document.getElementById('btn-start2').addEventListener('click', function() {
      var sel = Storage.getSelectedCarriage();
      Game.startGame(sel);
    });
  }

  function showPause() {
    hideAll();
    var html = '<div class="pause-text">游戏暂停</div>';
    html += '<button class="menu-btn" id="btn-resume">继续游戏</button>';
    html += '<button class="menu-btn" id="btn-restart">重新开始</button>';
    html += '<button class="menu-btn" id="btn-menu">返回主菜单</button>';
    pauseEl.innerHTML = html;
    pauseEl.classList.remove('hidden');

    document.getElementById('btn-resume').addEventListener('click', function() {
      Game.resumeGame();
    });
    document.getElementById('btn-restart').addEventListener('click', function() {
      Game.startGame(Storage.getSelectedCarriage());
    });
    document.getElementById('btn-menu').addEventListener('click', function() {
      Game.backToMenu();
    });
  }

  function showGameOver() {
    hideAll();

    var gameState = Game.getState();
    var score = gameState.score;
    var distance = Math.floor(gameState.distance);

    var isNewScore = Storage.setHighScore(score);
    var isNewDist = Storage.setHighDistance(distance);

    var html = '<div class="gameover-title">游戏结束</div>';
    html += '<div class="score-panel">本局分数: <span>' + score + '</span></div>';
    html += '<div class="score-panel">行进距离: <span>' + distance + ' 米</span></div>';

    if (isNewScore) {
      html += '<div class="record-display new-record">★ 新纪录! 最高分数 ★</div>';
    }
    if (isNewDist) {
      html += '<div class="record-display new-record">★ 新纪录! 最远距离 ★</div>';
    }

    html += '<div class="record-display">历史最高: ' + Storage.getHighScore() + ' 分 / ' + Storage.getHighDistance() + ' 米</div>';
    html += '<button class="menu-btn" style="margin-top:20px" id="btn-retry">再来一局</button>';
    html += '<button class="menu-btn" id="btn-menu2">返回主菜单</button>';

    gameoverEl.innerHTML = html;
    gameoverEl.classList.remove('hidden');

    document.getElementById('btn-retry').addEventListener('click', function() {
      Game.startGame(Storage.getSelectedCarriage());
    });
    document.getElementById('btn-menu2').addEventListener('click', function() {
      Game.backToMenu();
    });
  }

  function hideAll() {
    menuEl.classList.add('hidden');
    pauseEl.classList.add('hidden');
    gameoverEl.classList.add('hidden');
    tutorialEl.classList.add('hidden');
  }

  return {
    init: init,
    showMenu: showMenu,
    showTutorial: showTutorial,
    showPause: showPause,
    showGameOver: showGameOver,
    hideAll: hideAll
  };
})();
