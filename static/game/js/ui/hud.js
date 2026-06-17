class HUD {
  constructor() {
    this.waveEl = document.getElementById('hudWave');
    this.livesEl = document.getElementById('hudLives');
    this.samplesEl = document.getElementById('hudSamples');
    this.stateEl = document.getElementById('hudState');
    this.speedBtns = document.querySelectorAll('.speed-btn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.startWaveBtn = document.getElementById('startWaveBtn');

    this.bindSpeedControls();
  }

  update(data) {
    if (this.waveEl) {
      this.waveEl.textContent = data.wave + '/' + data.totalWaves;
    }
    if (this.livesEl) {
      this.livesEl.textContent = data.lives;
    }
    if (this.samplesEl) {
      this.samplesEl.textContent = data.samples;
    }
    if (this.stateEl) {
      var stateText = {
        'prep': '准备阶段',
        'combat': '战斗中',
        'paused': '已暂停',
        'ended': '已结束'
      };
      this.stateEl.textContent = stateText[data.state] || '';
    }

    if (this.startWaveBtn) {
      this.startWaveBtn.style.display = data.state === 'prep' ? 'block' : 'none';
    }
  }

  bindSpeedControls() {
    var self = this;
    if (this.speedBtns) {
      this.speedBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var speed = parseFloat(this.getAttribute('data-speed'));
          if (self.onSpeedChange) self.onSpeedChange(speed);

          document.querySelectorAll('.speed-btn').forEach(function (b) {
            b.classList.remove('active');
          });
          this.classList.add('active');
        });
      });
    }

    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', function () {
        if (self.onPauseToggle) self.onPauseToggle();
      });
    }

    if (this.startWaveBtn) {
      this.startWaveBtn.addEventListener('click', function () {
        if (self.onStartWave) self.onStartWave();
      });
    }
  }
}
