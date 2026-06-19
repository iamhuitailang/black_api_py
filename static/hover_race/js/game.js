class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        this.seed = (this.seed * 16807 + 0) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}

class HoverRaceGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.keys = {};
        this.setupInput();
        this.setupUI();

        this.gameState = 'menu';
        this.difficulty = 'easy';
        this.playerName = '';

        this.trackLength = 0;
        this.segments = [];
        this.trackWidth = 2000;
        this.lanes = 3;
        this.cameraHeight = 1000;
        this.cameraDepth = 0.36;
        this.shipRefDistance = 150;

        this.player = null;
        this.opponents = [];
        this.powerups = [];
        this.electricArcs = [];

        this.totalTime = 0;
        this.lapTime = 0;
        this.bestLap = null;
        this.currentLap = 1;
        this.totalLaps = 3;

        this.position = 1;
        this.isNewRecord = false;

        this.roadSegments = [];
        this.boostParticles = [];
        this.speedLines = [];

        this.lastTime = 0;
        this.animationId = null;
        this.rng = null;
        this.trackSeed = 0;
        this.autoSaveCounter = 0;

        const restored = this.tryRestoreState();
        if (!restored) {
            this.initTrack();
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.keys[e.code] = true;

            if (e.key === 'Escape' && this.gameState === 'racing') {
                this.pauseGame();
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.keys[e.code] = false;
        });

        window.addEventListener('beforeunload', () => {
            if (this.gameState === 'racing' || this.gameState === 'paused' || this.gameState === 'countdown') {
                this.saveState();
            }
        });
    }

    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('showLeaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('closeLeaderboardBtn').addEventListener('click', () => this.hideLeaderboard());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('quitBtn').addEventListener('click', () => this.showMenu());

        document.getElementById('playerName').addEventListener('input', () => {
            document.getElementById('nameError').classList.add('hidden');
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.diff;
            });
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadLeaderboard(btn.dataset.tab);
            });
        });
    }

    saveState() {
        if (!this.player) return;

        const collectedPowerups = [];
        this.segments.forEach((seg, idx) => {
            if (seg.hasPowerup && seg.powerupCollected) {
                collectedPowerups.push(idx);
            }
        });

        const state = {
            playerName: this.playerName,
            difficulty: this.difficulty,
            trackSeed: this.trackSeed,
            totalTime: this.totalTime,
            lapTime: this.lapTime,
            bestLap: this.bestLap,
            currentLap: this.currentLap,
            position: this.position,
            gameState: this.gameState === 'countdown' ? 'racing' : this.gameState,
            player: {
                z: this.player.z,
                x: this.player.x,
                speed: this.player.speed,
                lane: this.player.lane,
                targetLane: this.player.targetLane,
                shield: this.player.shield,
                boost: this.player.boost,
                isFlipped: this.player.isFlipped,
                lap: this.player.lap
            },
            opponents: this.opponents.map(opp => ({
                z: opp.z,
                x: opp.x,
                speed: opp.speed,
                maxSpeed: opp.maxSpeed,
                acceleration: opp.acceleration,
                lane: opp.lane,
                targetLane: opp.targetLane,
                color: opp.color,
                lap: opp.lap,
                aiLevel: opp.aiLevel
            })),
            collectedPowerups: collectedPowerups
        };

        try {
            sessionStorage.setItem('hoverRaceState', JSON.stringify(state));
        } catch (e) {
        }
    }

    tryRestoreState() {
        try {
            const saved = sessionStorage.getItem('hoverRaceState');
            if (!saved) return false;

            const state = JSON.parse(saved);
            if (!state || !state.player || state.gameState === 'finished') {
                this.clearState();
                return false;
            }

            this.playerName = state.playerName;
            this.difficulty = state.difficulty;
            this.trackSeed = state.trackSeed;
            this.totalTime = state.totalTime;
            this.lapTime = state.lapTime;
            this.bestLap = state.bestLap;
            this.currentLap = state.currentLap;
            this.position = state.position;

            this.initTrack();

            const sp = state.player;
            this.player = {
                z: sp.z,
                x: sp.x,
                y: 0,
                speed: sp.speed,
                maxSpeed: 4000,
                acceleration: 2000,
                deceleration: 3000,
                braking: 5000,
                lane: sp.lane,
                targetLane: sp.targetLane,
                laneChangeSpeed: 0,
                shield: sp.shield,
                boost: sp.boost,
                boostActive: false,
                isFlipped: sp.isFlipped,
                isInAir: false,
                position: state.position,
                lap: sp.lap,
                lapStartTime: 0
            };

            this.opponents = state.opponents.map(opp => ({
                z: opp.z,
                x: opp.x,
                y: 0,
                speed: opp.speed,
                maxSpeed: opp.maxSpeed,
                acceleration: opp.acceleration,
                lane: opp.lane,
                targetLane: opp.targetLane,
                laneChangeTimer: 0,
                color: opp.color,
                lap: opp.lap,
                aiLevel: opp.aiLevel
            }));

            this.boostParticles = [];
            this.speedLines = [];
            this.electricArcs = [];
            this.isNewRecord = false;

            state.collectedPowerups.forEach(idx => {
                if (this.segments[idx]) {
                    this.segments[idx].powerupCollected = true;
                }
            });

            this.hideAllScreens();

            if (state.gameState === 'paused') {
                this.gameState = 'paused';
                document.getElementById('pauseScreen').classList.remove('hidden');
            } else {
                this.gameState = 'racing';
                this.lastTime = performance.now();
                this.render();
                this.updateHUD();
                this.gameLoop();
            }

            return true;
        } catch (e) {
            this.clearState();
            return false;
        }
    }

    clearState() {
        try {
            sessionStorage.removeItem('hoverRaceState');
        } catch (e) {
        }
    }

    hideAllScreens() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('countdownScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('leaderboardScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('newRecord').classList.add('hidden');
    }

    initTrack() {
        this.segments = [];
        const difficultyConfig = {
            easy: { curves: 0.3, hills: 0.2, gaps: 1, flips: 0, length: 300 },
            normal: { curves: 0.5, hills: 0.4, gaps: 2, flips: 1, length: 400 },
            hard: { curves: 0.7, hills: 0.6, gaps: 3, flips: 2, length: 500 }
        };
        const config = difficultyConfig[this.difficulty];

        if (this.trackSeed === 0) {
            this.trackSeed = Math.floor(Math.random() * 2147483646) + 1;
        }
        this.rng = new SeededRandom(this.trackSeed);

        let z = 0;
        const segLength = 200;

        let curveDirection = 0;
        let curveTimer = 0;
        let hillDirection = 0;
        let hillTimer = 0;
        let gapTimer = 0;
        let flipTimer = 0;
        let inFlip = false;
        let inGap = false;

        for (let i = 0; i < config.length; i++) {
            curveTimer--;
            if (curveTimer <= 0) {
                curveTimer = 30 + this.rng.next() * 60;
                if (this.rng.next() < config.curves) {
                    curveDirection = (this.rng.next() - 0.5) * 2;
                } else {
                    curveDirection = 0;
                }
            }

            hillTimer--;
            if (hillTimer <= 0) {
                hillTimer = 40 + this.rng.next() * 80;
                if (this.rng.next() < config.hills) {
                    hillDirection = (this.rng.next() - 0.5) * 2;
                } else {
                    hillDirection = 0;
                }
            }

            gapTimer--;
            if (gapTimer <= 0 && i > 50 && i < config.length - 50) {
                gapTimer = 80 + this.rng.next() * 120;
                if (this.rng.next() < config.gaps / 10) {
                    inGap = true;
                    inGap = false;
                }
            }

            flipTimer--;
            if (flipTimer <= 0 && i > 80 && i < config.length - 80) {
                flipTimer = 100 + this.rng.next() * 150;
                if (this.rng.next() < config.flips / 10) {
                    inFlip = !inFlip;
                }
            }

            const isGap = inGap && i % 5 >= 2 && i % 5 <= 3;
            const curve = curveDirection * 2;
            const y = hillDirection * 100;

            this.segments.push({
                index: i,
                p1: { world: { z: z, y: y }, camera: {}, screen: {} },
                p2: { world: { z: z + segLength, y: y + hillDirection * 50 }, camera: {}, screen: {} },
                curve: curve,
                isGap: isGap,
                isFlip: inFlip,
                color: Math.floor(i / 3) % 2 ? 'dark' : 'light',
                hasPowerup: false,
                powerupType: null
            });

            z += segLength;
        }

        this.trackLength = this.segments.length * 200;

        this.generatePowerups();
    }

    generatePowerups() {
        const powerupTypes = ['boost', 'shield'];
        const numPowerups = Math.floor(this.segments.length / 30);

        for (let i = 0; i < numPowerups; i++) {
            const segIndex = Math.floor(50 + this.rng.next() * (this.segments.length - 100));
            const lane = Math.floor(this.rng.next() * this.lanes);
            const type = powerupTypes[Math.floor(this.rng.next() * powerupTypes.length)];

            this.segments[segIndex].hasPowerup = true;
            this.segments[segIndex].powerupType = type;
            this.segments[segIndex].powerupLane = lane;
        }
    }

    startGame() {
        const nameInput = document.getElementById('playerName');
        const nameError = document.getElementById('nameError');
        const name = (nameInput.value || '').trim();

        if (!name) {
            nameError.classList.remove('hidden');
            nameInput.focus();
            return;
        }
        nameError.classList.add('hidden');

        this.playerName = name;
        this.trackSeed = 0;
        this.initTrack();

        this.hideAllScreens();

        this.player = {
            z: 0,
            x: 0,
            y: 0,
            speed: 0,
            maxSpeed: 4000,
            acceleration: 2000,
            deceleration: 3000,
            braking: 5000,
            lane: 1,
            targetLane: 1,
            laneChangeSpeed: 0,
            shield: 0,
            boost: 100,
            boostActive: false,
            isFlipped: false,
            isInAir: false,
            position: 1,
            lap: 1,
            lapStartTime: 0
        };

        this.opponents = [];
        const opponentColors = ['#ff0066', '#00ff66', '#ffcc00'];
        for (let i = 0; i < 3; i++) {
            this.opponents.push({
                z: -(i + 1) * 500,
                x: 0,
                y: 0,
                speed: 3000 + this.rng.next() * 500,
                maxSpeed: 3200 + this.rng.next() * 600,
                acceleration: 1500 + this.rng.next() * 500,
                lane: i % 3,
                targetLane: i % 3,
                laneChangeTimer: 0,
                color: opponentColors[i],
                lap: 1,
                aiLevel: 0.7 + this.rng.next() * 0.3
            });
        }

        this.totalTime = 0;
        this.lapTime = 0;
        this.bestLap = null;
        this.currentLap = 1;
        this.position = 1;
        this.isNewRecord = false;
        this.boostParticles = [];
        this.speedLines = [];

        this.showCountdown();
    }

    showCountdown() {
        this.gameState = 'countdown';
        const countdownScreen = document.getElementById('countdownScreen');
        const countdownNumber = document.getElementById('countdownNumber');
        countdownScreen.classList.remove('hidden');

        let count = 3;
        countdownNumber.textContent = count;

        this.saveState();

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
                this.saveState();
            } else if (count === 0) {
                countdownNumber.textContent = 'GO!';
            } else {
                clearInterval(countdownInterval);
                countdownScreen.classList.add('hidden');
                this.gameState = 'racing';
                this.player.lapStartTime = performance.now();
                this.lastTime = performance.now();
                this.saveState();
                this.gameLoop();
            }
        }, 1000);
    }

    pauseGame() {
        if (this.gameState !== 'racing') return;
        this.gameState = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.saveState();
    }

    resumeGame() {
        if (this.gameState !== 'paused') return;
        this.gameState = 'racing';
        document.getElementById('pauseScreen').classList.add('hidden');
        this.lastTime = performance.now();
        this.gameLoop();
    }

    showMenu() {
        this.gameState = 'menu';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.clearState();
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('countdownScreen').classList.add('hidden');
    }

    showLeaderboard() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('leaderboardScreen').classList.remove('hidden');
        this.loadLeaderboard('lap');
    }

    hideLeaderboard() {
        document.getElementById('leaderboardScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
    }

    async loadLeaderboard(type) {
        const listEl = document.getElementById('leaderboardList');
        listEl.innerHTML = '<div class="loading">加载中...</div>';

        try {
            const endpoint = type === 'lap'
                ? '/api/hover/race/lap/top/get?limit=10'
                : '/api/hover/race/race/top/get?limit=10';

            const response = await fetch(endpoint);
            const data = await response.json();

            if (data.code === 0 && data.data && data.data.items) {
                this.renderLeaderboard(data.data.items, type);
            } else {
                listEl.innerHTML = '<div class="loading">暂无记录</div>';
            }
        } catch (e) {
            listEl.innerHTML = '<div class="loading">加载失败，暂无数据</div>';
        }
    }

    renderLeaderboard(items, type) {
        const listEl = document.getElementById('leaderboardList');

        if (items.length === 0) {
            listEl.innerHTML = '<div class="loading">暂无记录</div>';
            return;
        }

        let html = '';
        items.forEach((item, index) => {
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            const time = type === 'lap' ? item.lap_time : item.total_time;
            const timeStr = this.formatTime(time);

            html += `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank ${rankClass}">${index + 1}</span>
                    <span class="leaderboard-name">${item.player_name}</span>
                    <span class="leaderboard-time">${timeStr}</span>
                </div>
            `;
        });

        listEl.innerHTML = html;
    }

    gameLoop() {
        if (this.gameState !== 'racing') return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        this.update(dt);
        this.render();
        this.updateHUD();

        this.autoSaveCounter++;
        if (this.autoSaveCounter >= 60) {
            this.autoSaveCounter = 0;
            this.saveState();
        }

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update(dt) {
        this.totalTime += dt;
        this.lapTime += dt;

        this.updatePlayer(dt);
        this.updateOpponents(dt);
        this.updatePowerups();
        this.updatePosition();
        this.updateBoostParticles(dt);
        this.updateSpeedLines(dt);
        this.updateElectricArcs(dt);

        if (this.player.z >= this.trackLength) {
            this.completeLap();
        }
    }

    updatePlayer(dt) {
        const p = this.player;

        const currentSeg = this.getSegment(p.z);
        if (currentSeg && currentSeg.isFlip) {
            p.isFlipped = true;
        } else {
            p.isFlipped = false;
        }

        const accel = p.boostActive ? p.acceleration * 1.5 : p.acceleration;
        const maxSpd = p.boostActive ? p.maxSpeed * 1.5 : p.maxSpeed;

        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            p.speed += accel * dt;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            p.speed -= p.braking * dt;
        }

        if (this.keys[' '] && p.boost > 0) {
            p.boostActive = true;
            p.boost -= 50 * dt;
            if (p.boost <= 0) {
                p.boost = 0;
                p.boostActive = false;
            }
        } else {
            p.boostActive = false;
            p.boost = Math.min(100, p.boost + 10 * dt);
        }

        p.speed -= p.deceleration * dt * 0.3;
        p.speed = Math.max(500, Math.min(maxSpd, p.speed));

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            if (p.targetLane > 0) {
                p.targetLane = 0;
            }
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            if (p.targetLane < this.lanes - 1) {
                p.targetLane = this.lanes - 1;
            }
        }

        const laneWidth = this.trackWidth / this.lanes;
        const targetX = (p.targetLane - (this.lanes - 1) / 2) * laneWidth;
        p.x += (targetX - p.x) * 8 * dt;

        p.z += p.speed * dt;

        if (currentSeg && currentSeg.isGap && p.speed < 3500) {
            p.speed *= 0.95;
            if (p.shield > 0) {
                p.shield--;
            }
        }

        if (currentSeg && currentSeg.hasPowerup && !currentSeg.powerupCollected) {
            const powerupLaneX = (currentSeg.powerupLane - (this.lanes - 1) / 2) * laneWidth;
            if (Math.abs(p.x - powerupLaneX) < laneWidth * 0.6) {
                currentSeg.powerupCollected = true;
                if (currentSeg.powerupType === 'boost') {
                    p.boost = Math.min(100, p.boost + 50);
                } else if (currentSeg.powerupType === 'shield') {
                    p.shield++;
                }
            }
        }

        if (p.boostActive) {
            this.spawnBoostParticles();
        }
    }

    updateOpponents(dt) {
        this.opponents.forEach(opp => {
            const currentSeg = this.getSegment(opp.z);

            opp.speed += opp.acceleration * dt * opp.aiLevel;
            opp.speed = Math.min(opp.maxSpeed, opp.speed);

            opp.laneChangeTimer -= dt;
            if (opp.laneChangeTimer <= 0) {
                opp.laneChangeTimer = 1 + Math.random() * 3;
                if (Math.random() < 0.3) {
                    const newLane = opp.targetLane + (Math.random() < 0.5 ? -1 : 1);
                    if (newLane >= 0 && newLane < this.lanes) {
                        opp.targetLane = newLane;
                    }
                }
            }

            if (currentSeg && currentSeg.isFlip) {
                opp.speed *= 0.98;
            }

            if (currentSeg && currentSeg.isGap && opp.speed < 3200) {
                opp.speed *= 0.9;
            }

            const laneWidth = this.trackWidth / this.lanes;
            const targetX = (opp.targetLane - (this.lanes - 1) / 2) * laneWidth;
            opp.x += (targetX - opp.x) * 6 * dt;

            opp.z += opp.speed * dt;

            if (opp.z >= this.trackLength) {
                opp.z -= this.trackLength;
                opp.lap++;
            }
        });
    }

    updatePowerups() {
    }

    updatePosition() {
        let pos = 1;

        this.opponents.forEach(opp => {
            const playerProgress = (this.player.lap - 1) * this.trackLength + this.player.z;
            const oppProgress = (opp.lap - 1) * this.trackLength + opp.z;

            if (oppProgress > playerProgress) {
                pos++;
            }
        });

        this.position = pos;
    }

    updateBoostParticles(dt) {
        for (let i = this.boostParticles.length - 1; i >= 0; i--) {
            const p = this.boostParticles[i];
            p.life -= dt;
            p.size *= 0.95;

            if (p.life <= 0) {
                this.boostParticles.splice(i, 1);
            }
        }
    }

    updateSpeedLines(dt) {
        const speedRatio = this.player.speed / this.player.maxSpeed;

        if (Math.random() < speedRatio * 0.5) {
            this.speedLines.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.6 + this.canvas.height * 0.2,
                length: 20 + Math.random() * 40 * speedRatio,
                speed: 500 + Math.random() * 500,
                opacity: 0.3 + Math.random() * 0.3
            });
        }

        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            const line = this.speedLines[i];
            line.x -= line.speed * dt;

            if (line.x < -line.length) {
                this.speedLines.splice(i, 1);
            }
        }
    }

    updateElectricArcs(dt) {
        if (Math.random() < 0.1) {
            this.electricArcs.push({
                z: this.player.z + 1000 + Math.random() * 3000,
                side: Math.random() < 0.5 ? 'left' : 'right',
                life: 0.1 + Math.random() * 0.2,
                segments: 5 + Math.floor(Math.random() * 5)
            });
        }

        for (let i = this.electricArcs.length - 1; i >= 0; i--) {
            const arc = this.electricArcs[i];
            arc.life -= dt;

            if (arc.life <= 0) {
                this.electricArcs.splice(i, 1);
            }
        }
    }

    spawnBoostParticles() {
        for (let i = 0; i < 3; i++) {
            this.boostParticles.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 30,
                y: this.canvas.height * 0.85 + Math.random() * 20,
                vx: (Math.random() - 0.5) * 200,
                vy: 100 + Math.random() * 100,
                size: 10 + Math.random() * 15,
                life: 0.3 + Math.random() * 0.3
            });
        }
    }

    getSegment(z) {
        z = z % this.trackLength;
        if (z < 0) z += this.trackLength;
        const index = Math.floor(z / 200);
        return this.segments[index];
    }

    completeLap() {
        if (this.currentLap >= this.totalLaps) {
            this.endRace();
            return;
        }

        if (!this.bestLap || this.lapTime < this.bestLap) {
            this.bestLap = this.lapTime;
        }

        this.player.z -= this.trackLength;
        this.currentLap++;
        this.lapTime = 0;

        this.segments.forEach(seg => {
            if (seg.hasPowerup) {
                seg.powerupCollected = false;
            }
        });

        this.saveLapRecord(this.currentLap - 1, this.lapTime);
    }

    async saveLapRecord(lapNumber, lapTime) {
        try {
            await fetch('/api/hover/race/lap_record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_name: this.playerName,
                    lap_time: lapTime,
                    track_name: `Neon Circuit - ${this.difficulty}`,
                    lap_number: lapNumber
                })
            });
        } catch (e) {
        }
    }

    endRace() {
        this.gameState = 'finished';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (!this.bestLap) {
            this.bestLap = this.lapTime;
        }

        this.clearState();
        this.saveRaceRecord();

        document.getElementById('finalPosition').textContent = this.getPositionOrdinal(this.position);
        document.getElementById('finalTime').textContent = this.formatTime(this.totalTime);
        document.getElementById('finalBestLap').textContent = this.formatTime(this.bestLap);

        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    async saveRaceRecord() {
        try {
            const response = await fetch('/api/hover/race/player/best/get?player_name=' +
                encodeURIComponent(this.playerName) +
                '&track_name=' + encodeURIComponent(`Neon Circuit - ${this.difficulty}`));
            const data = await response.json();

            if (data.code !== 0 || !data.data || this.totalTime < data.data.lap_time) {
                this.isNewRecord = true;
                document.getElementById('newRecord').classList.remove('hidden');
            }
        } catch (e) {
        }

        try {
            await fetch('/api/hover/race/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_name: this.playerName,
                    total_time: this.totalTime,
                    best_lap: this.bestLap,
                    position: this.position,
                    total_laps: this.totalLaps,
                    track_name: `Neon Circuit - ${this.difficulty}`,
                    opponents: this.opponents.length
                })
            });
        } catch (e) {
        }
    }

    getPositionOrdinal(pos) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = pos % 100;
        return pos + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }

    updateHUD() {
        document.getElementById('speedValue').textContent = Math.floor(this.player.speed / 10);
        document.getElementById('lapValue').textContent = this.currentLap;
        document.getElementById('positionValue').textContent = this.position;
        document.getElementById('timer').textContent = this.formatTime(this.totalTime);
        document.getElementById('lapTimer').textContent = `LAP: ${this.formatTime(this.lapTime)}`;
        document.getElementById('bestLapValue').textContent = this.bestLap ? this.formatTime(this.bestLap) : '--:--.---';
        document.getElementById('shieldCount').textContent = this.player.shield;
        document.getElementById('boostFill').style.width = `${this.player.boost}%`;
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);

        this.drawSky();
        this.drawMountains();

        const baseY = h * 0.65;
        const maxD = 300;

        ctx.save();

        const drawSegments = [];
        for (let i = 0; i < maxD; i++) {
            const segZ = this.player.z + i * 200;
            const seg = this.getSegment(segZ);
            if (seg) {
                drawSegments.push({ seg, z: segZ, index: i });
            }
        }

        drawSegments.reverse();

        let curveXAccum = 0;
        for (let i = 0; i < drawSegments.length; i++) {
            curveXAccum += drawSegments[i].seg.curve * 3;
            drawSegments[i].curveX = curveXAccum;
        }

        const roadY = baseY;
        const horizonY = h * 0.4;

        let playerCurveX = 0;
        const playerRefDistance = this.shipRefDistance;
        for (let i = drawSegments.length - 1; i >= 0; i--) {
            const ds = drawSegments[i];
            const d = ds.z - this.player.z;
            if (d <= playerRefDistance) {
                playerCurveX = ds.curveX;
                break;
            }
        }

        const shipScale = this.cameraDepth / (playerRefDistance / 100 + 0.01);
        const shipY = horizonY + (roadY - horizonY) * shipScale;
        const shipX = w / 2 + (this.player.x + playerCurveX) * shipScale * (w / 800);

        for (let i = 0; i < drawSegments.length; i++) {
            const { seg, z, curveX } = drawSegments[i];
            const distance = z - this.player.z;
            const scale = this.cameraDepth / (distance / 100 + 0.01);

            const y = horizonY + (roadY - horizonY) * scale;
            const width = this.trackWidth * scale * (w / 800);
            const centerOffset = curveX * scale * (w / 800);
            const trackCenterX = w / 2 + centerOffset;
            const x = trackCenterX - width / 2;

            if (y < 0 || y > h) continue;

            const isDark = seg.color === 'dark';

            if (!seg.isGap) {
                const roadGradient = ctx.createLinearGradient(x, y, x + width, y);
                roadGradient.addColorStop(0, isDark ? '#1a1a3a' : '#252550');
                roadGradient.addColorStop(0.5, isDark ? '#0f0f2a' : '#1a1a3a');
                roadGradient.addColorStop(1, isDark ? '#1a1a3a' : '#252550');

                ctx.fillStyle = roadGradient;
                ctx.fillRect(x, y - 2, width, 4);

                if (seg.curve !== 0) {
                    ctx.fillStyle = `rgba(0, 255, 255, ${0.1 * Math.abs(seg.curve)})`;
                    ctx.fillRect(x, y - 3, width, 6);
                }
            }

            const guardH = Math.max(2, 15 * scale);
            ctx.fillStyle = seg.isFlip ? '#ff00ff' : '#00ffff';
            ctx.shadowColor = seg.isFlip ? '#ff00ff' : '#00ffff';
            ctx.shadowBlur = 20 * scale;

            if (!seg.isGap) {
                ctx.fillRect(x - 3, y - guardH / 2, 6, guardH);
                ctx.fillRect(x + width - 3, y - guardH / 2, 6, guardH);
            }

            ctx.shadowBlur = 0;

            const laneWidth = width / this.lanes;
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            for (let l = 1; l < this.lanes; l++) {
                const lx = x + laneWidth * l;
                ctx.beginPath();
                ctx.moveTo(lx, y);
                ctx.lineTo(lx, y - 2);
                ctx.stroke();
            }

            if (seg.hasPowerup && !seg.powerupCollected) {
                const px = x + laneWidth * (seg.powerupLane + 0.5);
                const py = y - 5;

                ctx.save();
                ctx.shadowColor = seg.powerupType === 'boost' ? '#ff6600' : '#00ccff';
                ctx.shadowBlur = 15;

                ctx.fillStyle = seg.powerupType === 'boost' ? '#ff9900' : '#00ffff';
                ctx.beginPath();
                ctx.arc(px, py, Math.max(3, 10 * scale), 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        }

        this.drawElectricArcsOnRoad(drawSegments, w, horizonY, roadY);

        ctx.restore();

        this.drawOpponents(drawSegments, w, horizonY, roadY);

        this.drawPlayerShip(shipX, shipY, shipScale);

        this.drawSpeedLines();

        this.drawBoostParticles();

        if (this.player.isFlipped) {
            ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
            ctx.fillRect(0, 0, w, h);
        }
    }

    drawSky() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const gradient = ctx.createLinearGradient(0, 0, 0, h * 0.5);
        gradient.addColorStop(0, '#050510');
        gradient.addColorStop(0.5, '#0a0a2a');
        gradient.addColorStop(1, '#1a0a2a');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h * 0.6);

        for (let i = 0; i < 100; i++) {
            const sx = (i * 137 + this.player.z * 0.01) % w;
            const sy = (i * 83) % (h * 0.5);
            const size = (i % 3) + 1;

            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (i % 5) * 0.1})`;
            ctx.fillRect(sx, sy, size, size);
        }

        const sunX = w * 0.8;
        const sunY = h * 0.3;
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150);
        sunGradient.addColorStop(0, 'rgba(255, 0, 255, 0.3)');
        sunGradient.addColorStop(0.5, 'rgba(255, 0, 100, 0.1)');
        sunGradient.addColorStop(1, 'rgba(255, 0, 100, 0)');

        ctx.fillStyle = sunGradient;
        ctx.fillRect(0, 0, w, h * 0.6);
    }

    drawMountains() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#150a25';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.5);

        for (let x = 0; x <= w; x += 50) {
            const offset = (this.player.z * 0.005 + x * 0.02) % 1;
            const y = h * 0.4 + Math.sin(x * 0.01 + this.player.z * 0.0001) * 30 + offset * 20;
            ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h * 0.6);
        ctx.lineTo(0, h * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1a0f30';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.55);

        for (let x = 0; x <= w; x += 30) {
            const y = h * 0.45 + Math.sin(x * 0.02 + this.player.z * 0.0002) * 25;
            ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h * 0.6);
        ctx.lineTo(0, h * 0.6);
        ctx.closePath();
        ctx.fill();
    }

    drawPlayerShip(shipX, shipY, shipScale) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();
        ctx.translate(shipX, shipY);

        const scale = Math.max(0.6, Math.min(2, shipScale * 3));
        ctx.scale(scale, scale);

        if (this.player.isFlipped) {
            ctx.scale(1, -1);
        }

        const speedRatio = this.player.speed / this.player.maxSpeed;

        if (this.player.boostActive || speedRatio > 0.5) {
            const flameLength = 30 + speedRatio * 50 + (this.player.boostActive ? 40 : 0);
            const flameGradient = ctx.createLinearGradient(0, 10, 0, 10 + flameLength);
            flameGradient.addColorStop(0, 'rgba(0, 200, 255, 0.9)');
            flameGradient.addColorStop(0.3, 'rgba(0, 150, 255, 0.7)');
            flameGradient.addColorStop(0.6, 'rgba(100, 0, 255, 0.4)');
            flameGradient.addColorStop(1, 'rgba(100, 0, 255, 0)');

            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.moveTo(-15, 10);
            ctx.quadraticCurveTo(0, 10 + flameLength * 1.5, 15, 10);
            ctx.fill();

            ctx.shadowColor = '#00aaff';
            ctx.shadowBlur = 30;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = '#1a1a3a';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(20, -10);
        ctx.lineTo(25, 10);
        ctx.lineTo(15, 20);
        ctx.lineTo(-15, 20);
        ctx.lineTo(-25, 10);
        ctx.lineTo(-20, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00aaff';
        ctx.beginPath();
        ctx.ellipse(0, -10, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#003366';
        ctx.beginPath();
        ctx.ellipse(0, -12, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-30, 5, 12, 4);
        ctx.fillRect(18, 5, 12, 4);

        if (this.player.shield > 0) {
            ctx.strokeStyle = `rgba(0, 200, 255, ${0.3 + Math.sin(Date.now() * 0.005) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00ccff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.ellipse(0, -5, 40, 35, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawOpponents(drawSegments, w, horizonY, roadY) {
        const ctx = this.ctx;

        this.opponents.forEach(opp => {
            let oppZ = opp.z;
            if (opp.lap < this.player.lap) {
                oppZ += this.trackLength;
            } else if (opp.lap > this.player.lap) {
                oppZ -= this.trackLength;
            }

            const distance = oppZ - this.player.z;
            if (distance < 0 || distance > 300 * 200) return;

            let oppCurveX = 0;
            for (let i = 0; i < drawSegments.length; i++) {
                if (drawSegments[i].z >= oppZ) {
                    oppCurveX = drawSegments[i].curveX;
                    break;
                }
            }

            const scale = this.cameraDepth / (distance / 100 + 0.01);
            const y = horizonY + (roadY - horizonY) * scale;
            const trackWidth = this.trackWidth * scale * (w / 800);

            const x = w / 2 + (opp.x + oppCurveX) * scale * (w / 800);

            const shipSize = Math.max(5, 40 * scale);

            ctx.save();
            ctx.translate(x, y - shipSize * 0.3);
            ctx.scale(scale * 0.8, scale * 0.8);

            ctx.fillStyle = opp.color;
            ctx.shadowColor = opp.color;
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.lineTo(15, -5);
            ctx.lineTo(18, 10);
            ctx.lineTo(12, 15);
            ctx.lineTo(-12, 15);
            ctx.lineTo(-18, 10);
            ctx.lineTo(-15, -5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(0, -8, 6, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.restore();
        });
    }

    drawSpeedLines() {
        const ctx = this.ctx;

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        this.speedLines.forEach(line => {
            ctx.globalAlpha = line.opacity;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x - line.length, line.y + 5);
            ctx.stroke();
        });

        ctx.globalAlpha = 1;
    }

    drawBoostParticles() {
        const ctx = this.ctx;

        this.boostParticles.forEach(p => {
            const alpha = p.life / 0.5;
            ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
            ctx.shadowColor = '#00aaff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.shadowBlur = 0;
    }

    drawElectricArcsOnRoad(drawSegments, w, horizonY, roadY) {
        const ctx = this.ctx;

        this.electricArcs.forEach(arc => {
            const distance = arc.z - this.player.z;
            if (distance < 0 || distance > 300 * 200) return;

            let arcCurveX = 0;
            for (let i = 0; i < drawSegments.length; i++) {
                if (drawSegments[i].z >= arc.z) {
                    arcCurveX = drawSegments[i].curveX;
                    break;
                }
            }

            const scale = this.cameraDepth / (distance / 100 + 0.01);
            const y = horizonY + (roadY - horizonY) * scale;
            const trackWidth = this.trackWidth * scale * (w / 800);
            const centerOffset = arcCurveX * scale * (w / 800);
            const trackCenterX = w / 2 + centerOffset;
            const trackX = trackCenterX - trackWidth / 2;

            const sideX = arc.side === 'left' ? trackX : trackX + trackWidth;
            const height = 30 * scale;

            ctx.strokeStyle = `rgba(0, 255, 255, ${arc.life * 3})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.moveTo(sideX, y);

            for (let i = 0; i < arc.segments; i++) {
                const t = (i + 1) / arc.segments;
                const sx = sideX + (Math.random() - 0.5) * 20 * scale * (arc.side === 'left' ? -1 : 1);
                const sy = y - height * t;
                ctx.lineTo(sx, sy);
            }

            ctx.stroke();
            ctx.shadowBlur = 0;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new HoverRaceGame();
});
