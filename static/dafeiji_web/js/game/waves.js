class DafeijiWaveController {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.currentWave = 1;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.totalEnemiesInWave = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1200;
    this.waveActive = false;
    this.waveComplete = false;
    this.pauseBetweenWaves = false;
    this.pauseTimer = 0;
    this.pauseDuration = 120;
    this.difficultyMultiplier = 1.0;
    this.waveConfigs = null;
    this.onStateChange = null;
    this.waveNames = [
      'First Contact', 'Scout Patrol', 'Drone Swarm', 'Fighter Wing',
      'Boss: Mech Overlord', 'Reinforced Fleet', 'Heavy Assault', 'Iron Rain',
      'Siege Formation', 'Boss: War Titan', 'Doom Fleet', 'Steel Tempest',
      'Mech Barrage', 'Crimson Wave', 'Boss: Apocalypse Engine',
      'Endless Horde', 'Dark Armada', 'Final Protocol', 'Last Stand',
      'Boss: Omega Destroyer'
    ];
  }

  loadWaveConfigs(configs) {
    this.waveConfigs = configs;
  }

  getWaveName(waveNumber) {
    let idx = (waveNumber - 1) % this.waveNames.length;
    return this.waveNames[idx];
  }

  getWaveConfig(waveNumber) {
    if (this.waveConfigs && this.waveConfigs[waveNumber]) {
      return this.waveConfigs[waveNumber];
    }
    return this._generateWave(waveNumber);
  }

  _generateWave(waveNumber) {
    let n = waveNumber;
    let isBoss = n % 5 === 0;
    let enemyCount = isBoss ? 5 + n : 5 + n * 3;
    let interval = Math.max(300, 1200 - n * 50);
    this.difficultyMultiplier = 1.0 + (n - 1) * 0.2;

    let enemies = [];
    if (isBoss) {
      let bossX = this.canvasWidth / 2 - 50;
      enemies.push({
        type: 'boss',
        x: bossX,
        y: -80,
        spawnOrder: enemyCount
      });
      for (let i = 0; i < Math.min(enemyCount - 1, 8); i++) {
        let type = this._getRandomEnemyType(n, true);
        enemies.push({
          type: type,
          x: 30 + Math.random() * (this.canvasWidth - 80),
          y: -30 - Math.random() * 200,
          spawnOrder: i + 1
        });
      }
      enemyCount = enemies.length;
    } else {
      for (let i = 0; i < enemyCount; i++) {
        let type = this._getRandomEnemyType(n, false);
        enemies.push({
          type: type,
          x: 30 + Math.random() * (this.canvasWidth - 80),
          y: -30 - Math.random() * 100,
          spawnOrder: i + 1
        });
      }
    }

    return {
      wave: n,
      name: this.getWaveName(n),
      enemy_count: enemyCount,
      spawn_interval: interval,
      difficulty: this.difficultyMultiplier,
      enemies: enemies,
      isBoss: isBoss
    };
  }

  _getRandomEnemyType(waveNumber, isBossWave) {
    let roll = Math.random();
    let n = waveNumber;

    if (n <= 2) {
      return 'scout';
    }
    if (n <= 4) {
      return roll < 0.6 ? 'scout' : 'fighter';
    }
    if (n <= 7) {
      if (roll < 0.35) return 'scout';
      if (roll < 0.7) return 'fighter';
      return 'bomber';
    }
    if (n <= 10) {
      if (roll < 0.2) return 'scout';
      if (roll < 0.5) return 'fighter';
      if (roll < 0.8) return 'bomber';
      return 'heavy';
    }
    if (roll < 0.15) return 'scout';
    if (roll < 0.4) return 'fighter';
    if (roll < 0.7) return 'bomber';
    return 'heavy';
  }

  startWave(waveNumber) {
    this.currentWave = waveNumber || 1;
    let config = this.getWaveConfig(this.currentWave);
    this.totalEnemiesInWave = config.enemy_count;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.spawnInterval = config.spawn_interval;
    this.spawnTimer = 0;
    this.waveActive = true;
    this.waveComplete = false;
    this.pauseBetweenWaves = false;
    this.difficultyMultiplier = config.difficulty;

    if (this.onStateChange) {
      this.onStateChange({ wave: this.currentWave, waveName: config.name });
    }

    return config;
  }

  update(dt, enemyManager) {
    if (!this.waveActive) return;

    if (this.pauseBetweenWaves) {
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) {
        this.pauseBetweenWaves = false;
        this.startWave(this.currentWave + 1);
      }
      return;
    }

    let config = this.getWaveConfig(this.currentWave);

    this.spawnTimer += 16.67 * dt;
    if (this.spawnTimer >= this.spawnInterval && this.enemiesSpawned < this.totalEnemiesInWave) {
      this.spawnTimer = 0;
      let enemyData = null;
      if (config.enemies) {
        for (let i = 0; i < config.enemies.length; i++) {
          if (config.enemies[i].spawnOrder === this.enemiesSpawned + 1) {
            enemyData = config.enemies[i];
            break;
          }
        }
        if (!enemyData && config.enemies.length > this.enemiesSpawned) {
          enemyData = config.enemies[this.enemiesSpawned];
        }
      }

      if (enemyData) {
        let enemy = enemyManager.spawnEnemy(enemyData.type, enemyData.x, enemyData.y, this.difficultyMultiplier);
        enemyManager.enemies.push(enemy);
      } else {
        let type = this._getRandomEnemyType(this.currentWave, false);
        let x = 30 + Math.random() * (this.canvasWidth - 80);
        let enemy = enemyManager.spawnEnemy(type, x, -30, this.difficultyMultiplier);
        enemyManager.enemies.push(enemy);
      }
      this.enemiesSpawned++;
    }

    if (this.enemiesSpawned >= this.totalEnemiesInWave && enemyManager.getAliveCount() === 0) {
      this.waveComplete = true;
      this.waveActive = false;
      this.pauseBetweenWaves = true;
      this.pauseTimer = this.pauseDuration;
    }
  }

  onEnemyKilled() {
    this.enemiesKilled++;
  }

  isWaveComplete() {
    return this.waveComplete;
  }

  getProgress() {
    if (this.totalEnemiesInWave === 0) return 0;
    return this.enemiesKilled / this.totalEnemiesInWave;
  }

  getCurrentWave() {
    return this.currentWave;
  }

  getDifficulty() {
    return this.difficultyMultiplier;
  }

  reset() {
    this.currentWave = 1;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.totalEnemiesInWave = 0;
    this.spawnTimer = 0;
    this.waveActive = false;
    this.waveComplete = false;
    this.pauseBetweenWaves = false;
    this.difficultyMultiplier = 1.0;
  }
}

window.DafeijiWaveController = DafeijiWaveController;
