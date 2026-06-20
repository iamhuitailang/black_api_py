const API_BASE = '/api';

const TRACK_CONFIG = [
    { name: '泥路', index: 0, icon: '🌿', color: '#8B4513', gripMultiplier: 0.6, powerMultiplier: 1.0 },
    { name: '沙地', index: 1, icon: '🏜️', color: '#F4A460', gripMultiplier: 1.0, powerMultiplier: 0.8 },
    { name: '冰面', index: 2, icon: '❄️', color: '#87CEEB', gripMultiplier: 0.3, powerMultiplier: 1.0, rolloverRisk: true },
    { name: '碎石', index: 3, icon: '🪨', color: '#696969', gripMultiplier: 1.0, powerMultiplier: 0.7, tireWearAccel: 2.0, rolloverRisk: true },
    { name: '密林', index: 4, icon: '🌲', color: '#228B22', gripMultiplier: 1.0, powerMultiplier: 1.0, speedLimit: 80, treePenalty: 5 },
    { name: '断桥', index: 5, icon: '🌉', color: '#8B0000', gripMultiplier: 1.0, powerMultiplier: 1.0, jumpRequired: 60, fallPenalty: 10 },
    { name: '火山灰', index: 6, icon: '🌋', color: '#2F4F4F', gripMultiplier: 1.0, powerMultiplier: 0.5 },
    { name: '暴风雨', index: 7, icon: '🌧️', color: '#1E3A5F', gripMultiplier: 0.8, powerMultiplier: 0.9, rainEffect: true }
];

const UPGRADE_CONFIG = {
    engine: { name: '升级引擎', cost: 50, desc: '+10 功率', effect: { engine_power: 10 } },
    soft_tire: { name: '换软胎', cost: 80, desc: '抓地力+2，磨损重置', effect: { tire_grip: 2, tire_type: 'soft', tire_wear: 0 } },
    hard_tire: { name: '换硬胎', cost: 60, desc: '磨损减半，抓地力-1', effect: { tire_type: 'hard', tire_grip: -1, tire_wear: 0 } },
    suspension: { name: '加固悬挂', cost: 40, desc: '悬挂+1硬度', effect: { suspension_hardness: 1 } },
    weight: { name: '减重', cost: 120, desc: '-100kg', effect: { weight: -100 } },
    new_tire: { name: '更换轮胎', cost: 100, desc: '磨损归零', effect: { tire_wear: 0 } }
};

class RacingGame {
    constructor() {
        this.vehicle = null;
        this.currentTrack = 0;
        this.currentRace = null;
        this.gameState = 'menu';
        this.raceStartTime = 0;
        this.lastCheckpointTime = 0;
        this.currentCheckpoint = 0;
        this.checkpoints = [];
        this.shortcutsFound = 0;
        this.rollovers = 0;
        this.totalPenalty = 0;
        this.segmentStartTime = 0;
        this.animationId = null;
        this.isRacing = false;
        this.keys = {};
        this.carX = 50;
        this.carSpeed = 0;
        this.trackLength = 3000;
        this.checkpointPositions = [1000, 2000, 3000];
        this.shortcutPositions = [];
        this.shortcutTaken = [];
        this.bridgeGap = false;
        this.canvas = null;
        this.ctx = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTrackList();
        this.restoreState();
    }

    initCanvas() {
        this.canvas = document.getElementById('track-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            return true;
        }
        return false;
    }

    bindEvents() {
        document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-show-leaderboard').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('btn-back-to-start').addEventListener('click', () => this.showScreen('start-screen'));
        document.getElementById('btn-start-race').addEventListener('click', () => this.startRace());
        document.getElementById('btn-next-track').addEventListener('click', () => this.nextTrack());
        document.getElementById('btn-restart-segment').addEventListener('click', () => this.restartSegment());
        document.getElementById('btn-continue').addEventListener('click', () => this.handleResultContinue());
        document.getElementById('btn-play-again').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-view-leaderboard').addEventListener('click', () => this.showLeaderboard());

        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' && !this.isRacing && this.gameState === 'racing') {
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        if (screenId === 'game-screen') {
            setTimeout(() => {
                this.initCanvas();
                if (this.ctx && this.vehicle) {
                    this.drawTrack();
                }
            }, 50);
        }
    }

    saveState() {
        try {
            const state = {
                vehicle: this.vehicle,
                currentTrack: this.currentTrack,
                gameState: this.gameState,
                currentRace: this.currentRace
            };
            localStorage.setItem('racing_game_state', JSON.stringify(state));
        } catch (e) {
            console.warn('保存状态失败:', e);
        }
    }

    async restoreState() {
        try {
            const saved = localStorage.getItem('racing_game_state');
            if (!saved) return;
            const state = JSON.parse(saved);
            if (state.vehicle) {
                this.vehicle = state.vehicle;
                this.currentTrack = state.currentTrack || 0;
                this.gameState = state.gameState || 'upgrade';
                this.currentRace = state.currentRace;
                this.showScreen('game-screen');
                setTimeout(() => {
                    this.updateVehicleDisplay();
                    this.updateUpgradeOptions();
                    this.updateTerrainDisplay();
                    if (this.ctx) {
                        this.drawTrack();
                    }
                }, 100);
            }
        } catch (e) {
            console.warn('恢复状态失败:', e);
            localStorage.removeItem('racing_game_state');
        }
    }

    clearState() {
        localStorage.removeItem('racing_game_state');
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        return await response.json();
    }

    loadTrackList() {
        const container = document.getElementById('track-list-preview');
        container.innerHTML = TRACK_CONFIG.map(t => `
            <div class="track-item-preview">
                <span>${t.icon}</span>
                <div>${t.name}</div>
            </div>
        `).join('');
    }

    async startNewGame() {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput.value ? nameInput.value.trim() : '';

        if (!playerName) {
            nameInput.style.borderColor = '#ff6b6b';
            this.showMessage('请输入昵称！', 'warning');
            setTimeout(() => {
                nameInput.style.borderColor = '';
            }, 2000);
            return;
        }

        this.clearState();
        const result = await this.apiCall('/racing/new/game', 'POST', { player_name: playerName });
        if (result.code === 0) {
            this.vehicle = result.data;
            this.currentTrack = 0;
            this.gameState = 'upgrade';
            this.showScreen('game-screen');
            setTimeout(() => {
                this.updateVehicleDisplay();
                this.updateUpgradeOptions();
                this.updateTerrainDisplay();
                this.drawTrack();
                this.saveState();
            }, 80);
        }
    }

    updateVehicleDisplay() {
        if (!this.vehicle) return;

        document.getElementById('param-engine').style.width = `${Math.min(100, this.vehicle.engine_power / 150 * 100)}%`;
        document.getElementById('param-engine-value').textContent = this.vehicle.engine_power;

        document.getElementById('param-suspension').style.width = `${this.vehicle.suspension_hardness / 10 * 100}%`;
        document.getElementById('param-suspension-value').textContent = `${this.vehicle.suspension_hardness}/10`;

        document.getElementById('param-grip').style.width = `${this.vehicle.tire_grip / 10 * 100}%`;
        document.getElementById('param-grip-value').textContent = `${this.vehicle.tire_grip}/10`;

        document.getElementById('param-weight').style.width = `${(2000 - this.vehicle.weight) / 1400 * 100}%`;
        document.getElementById('param-weight-value').textContent = `${this.vehicle.weight}kg`;

        const tireTypeNames = { normal: '普通胎', soft: '软胎', hard: '硬胎' };
        document.getElementById('param-tire-type').textContent = tireTypeNames[this.vehicle.tire_type] || '普通胎';

        document.getElementById('gold-amount').textContent = this.vehicle.gold;

        document.getElementById('tire-wear-fill').style.width = `${this.vehicle.tire_wear}%`;
        document.getElementById('tire-wear-text').textContent = `${this.vehicle.tire_wear}%`;
    }

    updateUpgradeOptions() {
        const container = document.getElementById('upgrade-options');
        container.innerHTML = '';

        Object.entries(UPGRADE_CONFIG).forEach(([key, config]) => {
            const canAfford = this.vehicle && this.vehicle.gold >= config.cost;
            const isRacing = this.gameState === 'racing';

            const btn = document.createElement('button');
            btn.className = 'upgrade-btn';
            btn.disabled = !canAfford || isRacing;
            btn.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${config.name}</div>
                    <div class="upgrade-desc">${config.desc}</div>
                </div>
                <div class="upgrade-cost">💰${config.cost}</div>
            `;
            btn.addEventListener('click', () => this.applyUpgrade(key));
            container.appendChild(btn);
        });
    }

    async applyUpgrade(upgradeType) {
        if (!this.vehicle) return;

        const result = await this.apiCall('/racing/upgrade', 'POST', {
            vehicle_id: this.vehicle.id,
            upgrade_type: upgradeType
        });

        if (result.code === 0) {
            this.vehicle = result.data;
            this.updateVehicleDisplay();
            this.updateUpgradeOptions();
            this.saveState();
            this.showMessage('改装成功！', 'success');
        } else {
            this.showMessage(result.message || '改装失败', 'warning');
        }
    }

    updateTerrainDisplay() {
        const track = TRACK_CONFIG[this.currentTrack];
        document.getElementById('terrain-name').textContent = track.name;
        document.getElementById('terrain-icon').textContent = track.icon;

        document.getElementById('checkpoint-text').textContent = '0 / 3';
        document.getElementById('checkpoint-progress').style.width = '0%';
        document.getElementById('race-timer').textContent = '00:00.00';

        document.getElementById('rain-overlay').classList.toggle('active', !!track.rainEffect);
        document.getElementById('fog-overlay').classList.toggle('active', !!track.rainEffect);
    }

    generateShortcuts() {
        this.shortcutPositions = [];
        this.shortcutTaken = [false, false, false];

        const track = TRACK_CONFIG[this.currentTrack];

        if (this.currentTrack % 2 === 0) {
            this.shortcutPositions.push({
                start: 500, end: 700, segment: 0, bonus: 50
            });
        }
        if (this.currentTrack % 3 === 0) {
            this.shortcutPositions.push({
                start: 1500, end: 1700, segment: 1, bonus: 50
            });
        }
    }

    async startRace() {
        if (!this.vehicle) return;

        if (!this.initCanvas()) {
            this.showMessage('游戏初始化失败，请刷新页面重试', 'warning');
            return;
        }

        if (this.vehicle.tire_wear >= 100) {
            this.showMessage('轮胎磨损100%！必须先换胎才能继续！', 'warning');
            return;
        }

        if (this.currentTrack === 4 && this.vehicle.tire_wear >= 60) {
            this.showMessage('碎石后未换胎！抓地力×0.4', 'warning');
        }

        const result = await this.apiCall('/racing/start', 'POST', {
            vehicle_id: this.vehicle.id,
            track_index: this.currentTrack
        });

        if (result.code === 0) {
            this.currentRace = result.data;
            this.gameState = 'racing';
            this.isRacing = true;
            this.raceStartTime = Date.now();
            this.lastCheckpointTime = this.raceStartTime;
            this.segmentStartTime = this.raceStartTime;
            this.currentCheckpoint = 0;
            this.checkpoints = [];
            this.shortcutsFound = 0;
            this.rollovers = 0;
            this.totalPenalty = 0;
            this.carX = 50;
            this.carSpeed = 0;
            this.generateShortcuts();
            this.bridgeGap = false;

            document.getElementById('btn-start-race').style.display = 'none';
            document.querySelectorAll('.upgrade-btn').forEach(btn => btn.disabled = true);

            this.updateUpgradeOptions();
            this.saveState();
            this.gameLoop();

            this.showMessage('开始！按→或D加速', 'success');
        }
    }

    getEffectiveParams() {
        const track = TRACK_CONFIG[this.currentTrack];
        const v = this.vehicle;

        let effectivePower = v.engine_power;
        let effectiveGrip = v.tire_grip;
        let effectiveWeight = v.weight;

        effectivePower *= track.powerMultiplier;

        let gripMult = track.gripMultiplier;
        if (this.currentTrack > 3 && v.tire_wear >= 60 && v.tire_type !== 'hard') {
            gripMult *= 0.4;
        }

        if (v.tire_wear >= 100) {
            effectiveGrip = 0;
        } else {
            effectiveGrip *= gripMult;
        }

        return { effectivePower, effectiveGrip, effectiveWeight };
    }

    gameLoop() {
        if (!this.isRacing) return;
        if (!this.ctx) {
            this.initCanvas();
        }

        const now = Date.now();
        const elapsed = (now - this.raceStartTime) / 1000;
        this.updateTimer(elapsed);

        const track = TRACK_CONFIG[this.currentTrack];
        const params = this.getEffectiveParams();

        this.updateCarPhysics(track, params);
        this.checkEvents(track);
        if (this.ctx) {
            this.drawTrack();
        }

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    updateTimer(elapsed) {
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        const ms = Math.floor((elapsed % 1) * 100);
        document.getElementById('race-timer').textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }

    updateCarPhysics(track, params) {
        const acceleration = params.effectivePower / params.effectiveWeight * 300;
        const maxSpeed = 80 + params.effectivePower * 0.8;

        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.carSpeed += acceleration * 0.016;
        }
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.carSpeed -= acceleration * 0.016 * 0.8;
        }

        let friction = 0.985 - (params.effectiveGrip / 300);
        if (friction < 0.9) friction = 0.9;
        this.carSpeed *= friction;

        if (track.speedLimit && this.carSpeed > track.speedLimit) {
            this.carSpeed = track.speedLimit;
        }

        this.carSpeed = Math.max(0, Math.min(maxSpeed, this.carSpeed));

        this.carX += this.carSpeed * 0.016 * 5;

        document.getElementById('current-speed').textContent = Math.round(this.carSpeed);

        let wearRate = 0.1;
        if (track.tireWearAccel) {
            wearRate *= track.tireWearAccel;
        }
        if (this.vehicle.tire_type === 'hard') {
            wearRate *= 0.5;
        }
        this.vehicle.tire_wear = Math.min(100, this.vehicle.tire_wear + wearRate * 0.016);
        document.getElementById('tire-wear-fill').style.width = `${this.vehicle.tire_wear}%`;
        document.getElementById('tire-wear-text').textContent = `${Math.round(this.vehicle.tire_wear)}%`;
    }

    checkEvents(track) {
        for (let i = 0; i < this.shortcutPositions.length; i++) {
            const sc = this.shortcutPositions[i];
            if (!this.shortcutTaken[sc.segment] &&
                this.carX >= sc.start && this.carX <= sc.end &&
                this.currentCheckpoint === sc.segment) {
                this.shortcutTaken[sc.segment] = true;
                this.shortcutsFound++;
                this.showMessage('发现捷径！+50金币', 'success');
                break;
            }
        }

        if (track.rolloverRisk && this.vehicle.suspension_hardness >= 7) {
            const rolloverChance = 0.0005 * (this.vehicle.suspension_hardness - 6);
            if (Math.random() < rolloverChance) {
                this.handleRollover();
            }
        }

        if (track.speedLimit && this.carSpeed > track.speedLimit) {
            if (Math.random() < 0.002) {
                this.handleTreeCollision();
            }
        }

        if (track.jumpRequired && this.carX > 1400 && this.carX < 1600) {
            if (!this.bridgeGap) {
                this.bridgeGap = true;
                if (this.carSpeed < track.jumpRequired) {
                    this.handleBridgeFall();
                } else {
                    this.showMessage('飞跃断桥！', 'success');
                }
            }
        }

        if (this.currentCheckpoint < 3 && this.carX >= this.checkpointPositions[this.currentCheckpoint]) {
            this.reachCheckpoint();
        }
    }

    async handleRollover() {
        this.rollovers++;
        this.totalPenalty += 15;
        this.carSpeed = 0;
        this.showMessage('翻车了！扣15秒，重跑本段！', 'warning');

        const segmentTime = (Date.now() - this.segmentStartTime) / 1000;
        await this.apiCall('/racing/checkpoint', 'POST', {
            race_id: this.currentRace.id,
            checkpoint_index: this.currentCheckpoint,
            segment_time: segmentTime,
            is_shortcut: this.shortcutTaken[this.currentCheckpoint],
            has_rollover: true,
            penalty_time: 15
        });

        setTimeout(() => {
            this.carX = this.currentCheckpoint === 0 ? 50 : this.checkpointPositions[this.currentCheckpoint - 1] + 50;
            this.segmentStartTime = Date.now();
        }, 1500);
    }

    async handleTreeCollision() {
        this.totalPenalty += 5;
        this.carSpeed *= 0.5;
        this.showMessage('撞树了！扣5秒！', 'warning');
    }

    async handleBridgeFall() {
        this.totalPenalty += 10;
        this.carSpeed = 0;
        this.showMessage('速度不够，掉桥了！扣10秒，重跑！', 'warning');

        setTimeout(() => {
            this.carX = 1200;
        }, 1000);
    }

    async reachCheckpoint() {
        const now = Date.now();
        const segmentTime = (now - this.segmentStartTime) / 1000;
        const isShortcut = this.shortcutTaken[this.currentCheckpoint];

        this.checkpoints.push({
            index: this.currentCheckpoint,
            time: segmentTime,
            shortcut: isShortcut
        });

        await this.apiCall('/racing/checkpoint', 'POST', {
            race_id: this.currentRace.id,
            checkpoint_index: this.currentCheckpoint,
            segment_time: segmentTime,
            is_shortcut: isShortcut,
            has_rollover: false,
            penalty_time: 0
        });

        document.getElementById('checkpoint-text').textContent = `${this.currentCheckpoint + 1} / 3`;
        document.getElementById('checkpoint-progress').style.width = `${(this.currentCheckpoint + 1) / 3 * 100}%`;

        this.showMessage(`检查点 ${this.currentCheckpoint + 1}！用时 ${segmentTime.toFixed(2)}秒`, 'success');

        if (this.currentCheckpoint >= 2) {
            this.finishRace();
        } else {
            this.currentCheckpoint++;
            this.segmentStartTime = now;
        }
    }

    async finishRace() {
        this.isRacing = false;
        cancelAnimationFrame(this.animationId);

        const totalTime = (Date.now() - this.raceStartTime) / 1000;

        const result = await this.apiCall('/racing/finish', 'POST', {
            race_id: this.currentRace.id,
            total_time: totalTime,
            shortcuts_found: this.shortcutsFound,
            rollovers: this.rollovers
        });

        if (result.code === 0) {
            const vehicleResp = await this.apiCall('/racing/vehicle/get');
            this.vehicle = vehicleResp.data;
            this.gameState = 'result';
            this.saveState();
            this.updateVehicleDisplay();

            this.showRaceResult(result.data, totalTime);
        }
    }

    showRaceResult(data, rawTime) {
        const track = TRACK_CONFIG[this.currentTrack];

        document.getElementById('result-track').textContent = track.name;
        document.getElementById('result-time').textContent = this.formatTime(data.total_time);
        document.getElementById('result-position').textContent = data.position;
        document.getElementById('result-gold').textContent = `+${data.gold_earned}`;
        document.getElementById('result-shortcuts').textContent = this.shortcutsFound;
        document.getElementById('result-rollovers').textContent = this.rollovers;

        const cpContainer = document.getElementById('checkpoint-times');
        cpContainer.innerHTML = '<h4>分段用时</h4>';
        this.checkpoints.forEach((cp, i) => {
            cpContainer.innerHTML += `
                <div class="checkpoint-time-item">
                    <span>检查点 ${i + 1}${cp.shortcut ? ' ⚡捷径' : ''}</span>
                    <span>${cp.time.toFixed(2)}秒</span>
                </div>
            `;
        });

        this.showScreen('result-screen');
    }

    async handleResultContinue() {
        const result = await this.apiCall('/racing/vehicle/get');
        this.vehicle = result.data;

        if (this.currentTrack >= 7) {
            this.clearState();
            this.showCompleteScreen();
        } else {
            this.currentTrack++;
            this.gameState = 'upgrade';
            this.saveState();
            this.showScreen('game-screen');
            setTimeout(() => {
                this.updateTerrainDisplay();
                this.updateVehicleDisplay();
                this.updateUpgradeOptions();
                if (this.ctx) this.drawTrack();
                document.getElementById('btn-start-race').style.display = 'block';
                document.getElementById('btn-next-track').style.display = 'none';
            }, 80);
        }
    }

    async nextTrack() {
        this.currentTrack++;
        if (this.currentTrack > 7) {
            this.showCompleteScreen();
            return;
        }

        this.gameState = 'upgrade';
        this.updateTerrainDisplay();
        this.updateVehicleDisplay();
        this.updateUpgradeOptions();
        this.drawTrack();
        document.getElementById('btn-start-race').style.display = 'block';
        document.getElementById('btn-next-track').style.display = 'none';
    }

    restartSegment() {
        this.carX = this.currentCheckpoint === 0 ? 50 : this.checkpointPositions[this.currentCheckpoint - 1] + 50;
        this.carSpeed = 0;
        this.segmentStartTime = Date.now();
        document.getElementById('btn-restart-segment').style.display = 'none';
    }

    async showCompleteScreen() {
        const progress = await this.apiCall(`/racing/progress/get?vehicle_id=${this.vehicle.id}`);
        const races = progress.data.races.filter(r => r.status === 'finished');

        const totalTime = races.reduce((sum, r) => sum + r.total_time, 0);
        document.getElementById('final-total-time').textContent = this.formatTime(totalTime);

        const leaderboard = await this.apiCall('/racing/leaderboard/get');
        const myRank = leaderboard.data.find(l => l.vehicle_id === this.vehicle.id);
        document.getElementById('final-rank').textContent = myRank ? `#${myRank.rank}` : '-';

        const trackResults = document.getElementById('track-results');
        trackResults.innerHTML = '<h3>各赛道成绩</h3>';
        races.forEach(r => {
            trackResults.innerHTML += `
                <div class="track-result-item">
                    <span class="track-name">${TRACK_CONFIG[r.track_index].icon} ${r.track_name}</span>
                    <span class="track-time">${this.formatTime(r.total_time)}</span>
                </div>
            `;
        });

        this.showScreen('complete-screen');
    }

    async showLeaderboard() {
        const result = await this.apiCall('/racing/leaderboard/get');
        const data = result.data;

        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#aaa;">暂无记录</td></tr>';
        } else {
            data.forEach(row => {
                const rankClass = row.rank <= 3 ? `rank-${row.rank}` : '';
                tbody.innerHTML += `
                    <tr>
                        <td class="${rankClass}">#${row.rank}</td>
                        <td>${row.player_name}</td>
                        <td>${this.formatTime(row.total_time)}</td>
                        <td>💰${row.total_gold}</td>
                        <td>⚡${row.total_shortcuts}</td>
                        <td>🔄${row.total_rollovers}</td>
                    </tr>
                `;
            });
        }

        this.showScreen('leaderboard-screen');
    }

    drawTrack() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const track = TRACK_CONFIG[this.currentTrack];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.drawBackground(track);
        this.drawTrackSurface(track);
        this.drawCheckpoints();
        this.drawShortcuts();
        this.drawSpecialFeatures(track);
        this.drawCar();
    }

    drawBackground(track) {
        const ctx = this.ctx;
        const canvas = this.canvas;

        const bgGradients = {
            0: ['#8B7355', '#6B5344'],
            1: ['#F5DEB3', '#DEB887'],
            2: ['#E0FFFF', '#B0E0E6'],
            3: ['#A9A9A9', '#808080'],
            4: ['#228B22', '#006400'],
            5: ['#8B4513', '#654321'],
            6: ['#2F4F4F', '#1C1C1C'],
            7: ['#1E3A5F', '#0D1B2A']
        };

        const colors = bgGradients[this.currentTrack] || ['#87CEEB', '#4682B4'];
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (this.currentTrack === 4) {
            for (let i = 0; i < 15; i++) {
                const x = (i * 80 + (Date.now() * 0.02) % (canvas.width + 100)) - 50;
                this.drawTree(x, 100 + (i % 3) * 50);
            }
        }
    }

    drawTree(x, y) {
        const ctx = this.ctx;
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(x, y - 40);
        ctx.lineTo(x - 20, y);
        ctx.lineTo(x + 20, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 4, y, 8, 20);
    }

    drawTrackSurface(track) {
        const ctx = this.ctx;
        const canvas = this.canvas;

        const trackY = canvas.height * 0.6;
        const trackHeight = 150;

        ctx.fillStyle = track.color;
        ctx.fillRect(0, trackY, canvas.width, trackHeight);

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(0, trackY + trackHeight / 2);
        ctx.lineTo(canvas.width, trackY + trackHeight / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (this.currentTrack === 0) {
            for (let i = 0; i < canvas.width; i += 30) {
                ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
                ctx.beginPath();
                ctx.arc(i, trackY + 30 + Math.sin(i * 0.05) * 20, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.currentTrack === 2) {
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(i, trackY + 30 + Math.sin(i * 0.03) * 30, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.currentTrack === 6) {
            for (let i = 0; i < canvas.width; i += 25) {
                ctx.fillStyle = 'rgba(47, 79, 79, 0.6)';
                ctx.beginPath();
                ctx.arc(i, trackY + 40 + Math.random() * 70, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawCheckpoints() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const trackY = canvas.height * 0.6;

        for (let i = 0; i < 3; i++) {
            const x = (this.checkpointPositions[i] / this.trackLength) * canvas.width;
            const passed = i < this.currentCheckpoint ||
                (i === this.currentCheckpoint && this.carX >= this.checkpointPositions[i]);

            ctx.fillStyle = passed ? '#2ecc71' : '#feca57';
            ctx.fillRect(x - 5, trackY - 20, 10, 190);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`CP${i + 1}`, x, trackY - 30);
        }

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(canvas.width - 10, trackY - 20, 10, 190);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('终点', canvas.width - 30, trackY - 30);
    }

    drawShortcuts() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const trackY = canvas.height * 0.6;

        this.shortcutPositions.forEach((sc, i) => {
            if (!this.shortcutTaken[sc.segment]) {
                const startX = (sc.start / this.trackLength) * canvas.width;
                const endX = (sc.end / this.trackLength) * canvas.width;

                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(startX, trackY + 20);
                ctx.quadraticCurveTo((startX + endX) / 2, trackY - 30, endX, trackY + 20);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚡捷径', (startX + endX) / 2, trackY - 40);
            }
        });
    }

    drawSpecialFeatures(track) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const trackY = canvas.height * 0.6;

        if (track.jumpRequired) {
            const gapStart = (1400 / this.trackLength) * canvas.width;
            const gapEnd = (1600 / this.trackLength) * canvas.width;

            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(gapStart, trackY, gapEnd - gapStart, 190);

            ctx.fillStyle = '#8B4513';
            ctx.fillRect(gapStart - 20, trackY, 20, 190);
            ctx.fillRect(gapEnd, trackY, 20, 190);

            ctx.fillStyle = '#feca57';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ 断桥', (gapStart + gapEnd) / 2, trackY - 10);
            ctx.fillText('>60km/h', (gapStart + gapEnd) / 2, trackY + 100);
        }
    }

    drawCar() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const trackY = canvas.height * 0.6;

        const screenX = Math.max(50, Math.min(canvas.width - 80,
            (this.carX / this.trackLength) * canvas.width));
        const carY = trackY + 70;

        ctx.save();
        ctx.translate(screenX, carY);

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.roundRect(0, 0, 60, 30, 5);
        ctx.fill();

        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.roundRect(15, -15, 35, 18, 3);
        ctx.fill();

        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(15, 32, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(45, 32, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#feca57';
        ctx.fillRect(55, 8, 5, 6);
        ctx.fillRect(55, 18, 5, 6);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(62, 11, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    showMessage(text, type = 'info') {
        const msg = document.getElementById('game-message');
        msg.textContent = text;
        msg.className = `game-message show ${type}`;

        setTimeout(() => {
            msg.classList.remove('show');
        }, 2000);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new RacingGame();
});
