var WAVE_STATE = {
  WAITING: 'waiting',
  SPAWNING: 'spawning',
  ACTIVE: 'active',
  COMPLETE: 'complete',
  ALL_DONE: 'all_done'
};

class WaveSystem {
  constructor(waveConfig) {
    this.waves = waveConfig || [];
    this.currentWaveIndex = -1;
    this.state = WAVE_STATE.WAITING;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.countdown = 0;
    this.enemiesAlive = 0;
  }

  startNextWave() {
    this.currentWaveIndex++;
    if (this.currentWaveIndex >= this.waves.length) {
      this.state = WAVE_STATE.ALL_DONE;
      return;
    }

    this.state = WAVE_STATE.SPAWNING;
    this.spawnQueue = [];
    var wave = this.waves[this.currentWaveIndex];

    for (var i = 0; i < wave.enemies.length; i++) {
      var group = wave.enemies[i];
      for (var j = 0; j < group.count; j++) {
        this.spawnQueue.push({
          type: group.type,
          entryIndex: group.entry || 0,
          delay: j * (group.interval || 1000)
        });
      }
    }

    this.spawnQueue.sort(function (a, b) { return a.delay - b.delay; });
    this.spawnTimer = 0;
    this.enemiesAlive = this.spawnQueue.length;
  }

  update(dt) {
    var spawned = [];

    if (this.state === WAVE_STATE.SPAWNING || this.state === WAVE_STATE.ACTIVE) {
      this.waveTimer += dt * 1000;

      while (this.spawnQueue.length > 0 && this.spawnQueue[0].delay <= this.waveTimer) {
        var item = this.spawnQueue.shift();
        spawned.push(item);
      }

      if (this.spawnQueue.length === 0 && this.state === WAVE_STATE.SPAWNING) {
        this.state = WAVE_STATE.ACTIVE;
      }
    }

    return spawned;
  }

  onEnemyDied() {
    this.enemiesAlive--;
  }

  onEnemyReachedExit() {
    this.enemiesAlive--;
  }

  checkWaveComplete() {
    if (this.state === WAVE_STATE.ACTIVE && this.spawnQueue.length === 0 && this.enemiesAlive <= 0) {
      this.state = WAVE_STATE.COMPLETE;
      return true;
    }
    return false;
  }

  isWaveComplete() {
    return this.state === WAVE_STATE.COMPLETE;
  }

  isAllWavesComplete() {
    return this.state === WAVE_STATE.ALL_DONE || (this.currentWaveIndex >= this.waves.length - 1 && this.state === WAVE_STATE.COMPLETE);
  }

  getCurrentWave() {
    if (this.currentWaveIndex >= 0 && this.currentWaveIndex < this.waves.length) {
      return this.waves[this.currentWaveIndex];
    }
    return null;
  }

  getCurrentWaveIndex() {
    return this.currentWaveIndex;
  }

  getTotalWaves() {
    return this.waves.length;
  }

  getWaveReward() {
    var wave = this.getCurrentWave();
    return wave ? (wave.reward || 0) : 0;
  }

  reset() {
    this.currentWaveIndex = -1;
    this.state = WAVE_STATE.WAITING;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.enemiesAlive = 0;
  }
}
