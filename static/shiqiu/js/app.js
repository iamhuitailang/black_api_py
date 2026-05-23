(function () {
  const canvas = document.getElementById('canvas');
  SIQIU.Renderer.init(canvas);

  let currentScreen = 'menu';
  let save = SIQIU.Storage.load();

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.add('active');
    currentScreen = id;
  }

  function refreshMenuStats() {
    save = SIQIU.Storage.load();
    document.getElementById('menu-best').textContent = save.best;
    document.getElementById('menu-clear').textContent = save.clears;
    const btn = document.getElementById('btn-continue');
    if (btn) btn.disabled = !save.progress;
  }

  function renderCharacterList() {
    const list = document.getElementById('char-list');
    list.innerHTML = '';
    save = SIQIU.Storage.load();
    SIQIU.CHARACTERS.forEach(c => {
      const card = document.createElement('div');
      card.className = 'card' + (c.id === save.character ? ' active' : '');
      card.innerHTML = `
        <div class="avatar" style="background:${c.color}33;">${c.emoji}</div>
        <div class="name">${c.name}</div>
        <div class="desc">${c.desc}</div>
      `;
      card.addEventListener('click', () => {
        SIQIU.Game.setCharacter(c.id);
        renderCharacterList();
      });
      list.appendChild(card);
    });
  }

  function renderStadiumList() {
    const list = document.getElementById('stadium-list');
    list.innerHTML = '';
    save = SIQIU.Storage.load();
    SIQIU.STADIUMS.forEach(s => {
      const card = document.createElement('div');
      card.className = 'card' + (s.id === save.stadium ? ' active' : '');
      card.innerHTML = `
        <div class="avatar" style="background:${s.grass}55;">${'★'.repeat(s.difficulty)}</div>
        <div class="name">${s.name}</div>
        <div class="desc">${s.desc}</div>
      `;
      card.addEventListener('click', () => {
        SIQIU.Game.setStadium(s.id);
        renderStadiumList();
      });
      list.appendChild(card);
    });
  }

  function renderRecords() {
    save = SIQIU.Storage.load();
    document.getElementById('rec-best').textContent = save.best;
    document.getElementById('rec-clear').textContent = save.clears;
    document.getElementById('rec-shots').textContent = save.shots;
    document.getElementById('rec-goals').textContent = save.goals;
    document.getElementById('rec-combo').textContent = save.maxCombo;
  }

  function startGame(useSaved) {
    if (useSaved) SIQIU.Game.loadOrStart();
    else SIQIU.Game.start();
    SIQIU.Input.init(canvas, {
      onPressStart: () => SIQIU.Game.onPressStart(),
      onPressEnd: () => SIQIU.Game.onPressEnd(),
      onDrag: (d) => SIQIU.Game.onDrag(d),
      onShotType: (id) => SIQIU.Game.setShotType(id),
      onEscape: () => {
        if (currentScreen === 'game') {
          SIQIU.Game.quit();
          showScreen('pause');
        }
      }
    });
    showScreen('game');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  let lastTime = 0;
  function loop(now) {
    const dt = Math.min((now - lastTime) / 16.67, 2);
    lastTime = now;
    if (currentScreen !== 'game') return;

    SIQIU.Game.update(dt);
    render();
    updateHUD();

    const st = SIQIU.Game.state;
    if (st.phase === 'done') {
      showResult(st.result);
      return;
    }
    requestAnimationFrame(loop);
  }

  function render() {
    const st = SIQIU.Game.state;
    if (!st) return;
    SIQIU.Renderer.clear();
    SIQIU.Renderer.drawStadium(st.stadium);
    SIQIU.Renderer.drawGoalkeeper(st.goalkeeper);
    SIQIU.Renderer.drawShooter(st.character, st.aimAngle, (st.power - 1) / (SIQIU.GAME_CONFIG.maxPower - 1), st.charging, st.shotType);
    SIQIU.Renderer.drawBall(st.ball);
    SIQIU.Renderer.drawFloatingTexts(st.floatingTexts);
    SIQIU.Renderer.drawHUDOverlay(st.power, st.aimAngle, st.shotType, st.charging);

    if (st.phase === 'aim') {
      SIQIU.Renderer.ctx.fillStyle = 'rgba(255,255,255,0.8)';
      SIQIU.Renderer.ctx.font = '14px sans-serif';
      SIQIU.Renderer.ctx.textAlign = 'center';
      SIQIU.Renderer.ctx.fillText(`第 ${st.round}/10 轮 - 准备射门`, SIQIU.GAME_CONFIG.canvasW / 2, 50);
      SIQIU.Renderer.ctx.textAlign = 'left';
    }
  }

  function updateHUD() {
    const st = SIQIU.Game.state;
    if (!st) return;
    document.getElementById('hud-round').textContent = st.round;
    document.getElementById('hud-score').textContent = st.score;
    document.getElementById('hud-combo').textContent = st.combo;
    document.getElementById('hud-shot-name').textContent = st.shotType.name;
  }

  function showResult(result) {
    document.getElementById('result-title').textContent = result.cleared ? '🎉 挑战成功!' : '挑战结束';
    document.getElementById('result-score').textContent = result.score;
    document.getElementById('result-goals').textContent = result.goals;
    document.getElementById('result-combo').textContent = result.maxCombo;
    SIQIU.Input.destroy();
    showScreen('result');
    refreshMenuStats();
  }

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      handleAction(action);
    });
  });

  document.getElementById('btn-pause').addEventListener('click', () => {
    SIQIU.Game.quit();
    showScreen('pause');
  });

  function handleAction(action) {
    switch (action) {
      case 'start':
        SIQIU.Storage.update({ progress: null });
        startGame(false);
        break;
      case 'continue':
        startGame(true);
        break;
      case 'character':
        renderCharacterList();
        showScreen('character');
        break;
      case 'stadium':
        renderStadiumList();
        showScreen('stadium');
        break;
      case 'records':
        renderRecords();
        showScreen('records');
        break;
      case 'howto':
        showScreen('howto');
        break;
      case 'back-menu':
        refreshMenuStats();
        showScreen('menu');
        break;
      case 'resume':
        showScreen('game');
        lastTime = performance.now();
        requestAnimationFrame(loop);
        break;
      case 'quit':
        SIQIU.Input.destroy();
        SIQIU.Game.quit();
        refreshMenuStats();
        showScreen('menu');
        break;
      case 'retry':
        startGame(false);
        break;
      case 'reset-records':
        if (confirm('确定要清空所有战绩和进度吗？')) {
          SIQIU.Storage.reset();
          renderRecords();
          refreshMenuStats();
        }
        break;
    }
  }

  window.addEventListener('beforeunload', () => {
    if (SIQIU.Game.state) SIQIU.Game.quit();
  });

  refreshMenuStats();
  showScreen('menu');
})();
