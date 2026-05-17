class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.state = 'menu';
        this.mode = 'race';

        this.player = null;
        this.opponents = [];
        this.allPlayers = [];

        this.startTime = 0;
        this.elapsedTime = 0;
        this.lastFrameTime = 0;
        this.lastSaveTime = 0;

        this.cameraX = 0;
        this.cameraY = 0;
        this.zoom = 1;

        this.poolWidth = 0;
        this.poolHeight = 0;
        this.laneHeight = 0;

        this.pendingInput = [];

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.hudTopHeight = 45;
        this.hudBottomHeight = 60;
        this.gameAreaY = this.hudTopHeight;
        this.gameAreaHeight = this.canvas.height - this.hudTopHeight - this.hudBottomHeight;

        this.poolWidth = Config.GAME.POOL_LENGTH * 15;
        this.laneHeight = Math.min(70, Math.max(45, this.gameAreaHeight / Config.GAME.LANES));
        this.poolHeight = this.laneHeight * Config.GAME.LANES;
        this.poolY = this.gameAreaY + Math.max(0, (this.gameAreaHeight - this.poolHeight) / 2);
    }

    startGame(mode = 'race') {
        this.mode = mode;
        this.state = 'playing';

        const settings = Storage.loadSettings() || {};
        const selectedStroke = settings.selectedStroke || 'freestyle';
        const playerData = Storage.loadPlayerData() || this.getDefaultPlayerData();

        const playerLane = Math.floor(Config.GAME.LANES / 2);

        this.player = new Player({
            lane: playerLane,
            name: '你',
            isAI: false,
            color: Config.COLORS.player,
            stroke: selectedStroke,
            stats: playerData.stats
        });

        if (mode === 'training') {
            this.opponents = [AIFactory.createTrainingDummy(playerLane === 0 ? 1 : 0)];
        } else {
            this.opponents = AIFactory.createOpponents(Config.GAME.LANES - 1, playerLane);
        }

        this.allPlayers = [this.player, ...this.opponents];

        const startTime = performance.now() / 1000;
        this.allPlayers.forEach(p => {
            p.startTime = startTime;
            p.reset();
            p.lane = this.allPlayers.indexOf(p);
        });

        this.player.lane = playerLane;

        this.startTime = startTime;
        this.elapsedTime = 0;
        this.lastFrameTime = startTime;

        Storage.clearGameState();
        UI.showGameHUD();

        this.gameLoop();
    }

    getDefaultPlayerData() {
        return {
            stats: {
                speed: Config.PLAYER.baseSpeed,
                maxStamina: Config.PLAYER.baseStamina,
                recovery: Config.PLAYER.baseRecovery,
                turnSpeed: Config.PLAYER.baseTurnSpeed,
                power: Config.PLAYER.basePower
            }
        };
    }

    pauseGame() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        this.saveState();
        UI.showPauseMenu();
    }

    resumeGame() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        this.lastFrameTime = performance.now() / 1000;
        UI.hidePauseMenu();
        this.gameLoop();
    }

    restartGame() {
        this.startGame(this.mode);
    }

    quitGame() {
        this.state = 'menu';
        Storage.clearGameState();
        UI.showMainMenu();
    }

    playerStroke(inputData) {
        if (this.state !== 'playing') return;
        if (this.player.isTurning) {
            this.player.addTurnTap();
            return;
        }
        this.pendingInput.push({ type: 'stroke', ...inputData });
    }

    playerBreathe() {
        if (this.state !== 'playing') return;
        if (this.player.isTurning) return;
        this.player.breathe();
    }

    gameLoop() {
        if (this.state !== 'playing') return;

        const now = performance.now() / 1000;
        const dt = Math.min(0.1, now - this.lastFrameTime);
        this.lastFrameTime = now;
        this.elapsedTime = now - this.startTime;

        this.update(dt);
        this.render();
        this.updateHUD();

        if (now - this.lastSaveTime > Config.GAME.STATE_SAVE_INTERVAL / 1000) {
            this.saveState();
            this.lastSaveTime = now;
        }

        if (this.state === 'playing') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update(dt) {
        while (this.pendingInput.length > 0) {
            const input = this.pendingInput.shift();
            if (input.type === 'stroke') {
                this.player.performStroke(input.rhythm);
            }
        }

        this.player.update(dt, null);

        this.opponents.forEach(opponent => {
            if (opponent.isTurning && opponent.aiController) {
                const turnTaps = opponent.aiController.getTurnTaps(Config.TURN.timeLimit - opponent.turnTimer);
                for (let i = 0; i < Math.min(2, turnTaps - opponent.turnTapCount); i++) {
                    opponent.addTurnTap();
                }
            }
            opponent.update(dt);
        });

        this.checkRaceComplete();
        this.updateCamera();
    }

    checkRaceComplete() {
        const finishedPlayers = this.allPlayers.filter(p => p.finished);

        if (finishedPlayers.length > 0) {
            finishedPlayers.forEach(p => {
                if (p.finishTime === 0) {
                    p.finishTime = this.elapsedTime;
                }
            });
        }

        if (this.player.finished) {
            this.endRace();
        }
    }

    endRace() {
        this.state = 'finished';

        const sortedPlayers = [...this.allPlayers].sort((a, b) => {
            if (a.finished && b.finished) {
                return a.finishTime - b.finishTime;
            }
            return a.finished ? -1 : 1;
        });

        sortedPlayers.forEach((p, index) => {
            p.positionRank = index + 1;
        });

        const playerPosition = sortedPlayers.findIndex(p => p === this.player) + 1;

        const result = {
            position: playerPosition,
            time: this.player.finishTime || this.elapsedTime,
            maxSpeed: this.player.maxSpeed,
            avgSpeed: this.player.avgSpeed,
            turnCount: this.player.turnCount,
            perfectTurnCount: this.player.perfectTurnCount,
            breathCount: this.player.breathCount,
            strokeCount: this.player.strokeCount,
            staminaRemaining: (this.player.stamina / this.player.stats.maxStamina) * 100,
            stroke: this.player.stroke,
            badges: this.calculateBadges(playerPosition)
        };

        Storage.addRecord({
            position: result.position,
            time: result.time,
            stroke: result.stroke
        });

        Storage.clearGameState();
        UI.showResultMenu(result);
    }

    calculateBadges(position) {
        const badges = [];
        const result = {
            position,
            maxSpeed: this.player.maxSpeed,
            breathCount: this.player.breathCount,
            turnCount: this.player.turnCount,
            perfectTurnCount: this.player.perfectTurnCount,
            staminaRemaining: (this.player.stamina / this.player.stats.maxStamina) * 100
        };

        Object.entries(Config.BADGES).forEach(([key, badge]) => {
            if (badge.condition(result)) {
                badges.push({ id: key, ...badge });
            }
        });

        return badges;
    }

    updateCamera() {
        const targetX = this.player.position * 15 - this.canvas.width / 2;
        const maxX = Math.max(0, this.poolWidth - this.canvas.width);
        this.cameraX = Math.max(0, Math.min(maxX, targetX));

        this.cameraY = 0;
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bgGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#0f0f23');
        bgGradient.addColorStop(this.gameAreaY / this.canvas.height, '#1a1a2e');
        bgGradient.addColorStop((this.gameAreaY + this.gameAreaHeight) / this.canvas.height, '#1a1a2e');
        bgGradient.addColorStop(1, '#0f0f23');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.translate(-this.cameraX, this.poolY);

        this.renderPool();
        this.renderLanes();
        this.renderPlayers();

        ctx.restore();
    }

    renderPool() {
        const ctx = this.ctx;

        const gradient = ctx.createLinearGradient(0, 0, 0, this.poolHeight);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#1E90FF');
        gradient.addColorStop(1, '#0066CC');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.poolWidth, this.poolHeight);

        ctx.fillStyle = '#4A90A4';
        ctx.fillRect(-20, 0, 20, this.poolHeight);
        ctx.fillRect(this.poolWidth, 0, 20, this.poolHeight);

        ctx.fillStyle = '#2C5F6E';
        ctx.fillRect(-20, -10, this.poolWidth + 40, 10);
        ctx.fillRect(-20, this.poolHeight, this.poolWidth + 40, 10);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
            const x = (performance.now() / 100 + i * 100) % (this.poolWidth + 200) - 100;
            const y = Math.sin(performance.now() / 500 + i) * 5 + 50 + i * 30;
            ctx.beginPath();
            ctx.ellipse(x, y, 30, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderLanes() {
        const ctx = this.ctx;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;

        for (let i = 0; i <= Config.GAME.LANES; i++) {
            const y = i * this.laneHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);

            for (let x = 0; x < this.poolWidth; x += 20) {
                const waveY = y + Math.sin(x / 30 + performance.now() / 500) * 2;
                ctx.lineTo(x, waveY);
            }
            ctx.stroke();
        }

        ctx.fillStyle = Config.COLORS.laneLine;
        for (let i = 0; i < Config.GAME.LANES; i++) {
            const y = i * this.laneHeight + this.laneHeight / 2;
            for (let x = 5; x < this.poolWidth - 5; x += 15) {
                ctx.fillRect(x, y - 3, 8, 6);
            }
        }
    }

    renderPlayers() {
        this.allPlayers.forEach(player => {
            this.renderPlayer(player);
        });
    }

    renderPlayer(player) {
        const ctx = this.ctx;
        const x = player.position * 15;
        const y = player.lane * this.laneHeight + this.laneHeight / 2;

        ctx.save();
        ctx.translate(x, y);

        if (player.direction < 0) {
            ctx.scale(-1, 1);
        }

        if (player.isTurning) {
            ctx.rotate(Math.sin(performance.now() / 100) * 0.5);
        }

        player.splashParticles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc((p.x - player.position) * 15, p.y - y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.fillStyle = player.color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(18, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (player.isBreathing) {
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.arc(22, -12, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        if (player.isChoking) {
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('😵', 0, -20);
        }

        ctx.fillStyle = player.isAI ? 'rgba(0,0,0,0.7)' : 'rgba(255,107,107,0.9)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, 0, 25);

        const progress = player.getProgress();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-20, 30, 40, 4);
        ctx.fillStyle = player.isAI ? '#4CAF50' : '#FFD700';
        ctx.fillRect(-20, 30, 40 * progress, 4);

        ctx.restore();
    }

    updateHUD() {
        const sortedPlayers = [...this.allPlayers].sort((a, b) => b.getProgress() - a.getProgress());
        const position = sortedPlayers.findIndex(p => p === this.player) + 1;

        UI.updateHUD({
            player: this.player,
            position,
            totalPlayers: this.allPlayers.length,
            elapsedTime: this.elapsedTime
        });
    }

    saveState() {
        if (this.state !== 'playing') return;

        const state = {
            mode: this.mode,
            startTime: this.startTime,
            elapsedTime: this.elapsedTime,
            player: this.player.getState(),
            opponents: this.opponents.map(o => o.getState()),
            cameraX: this.cameraX,
            cameraY: this.cameraY
        };

        Storage.saveGameState(state);
    }

    loadState() {
        const state = Storage.loadGameState();
        if (!state) return false;

        this.mode = state.mode;
        this.startTime = state.startTime;
        this.elapsedTime = state.elapsedTime;

        const playerData = Storage.loadPlayerData() || this.getDefaultPlayerData();
        this.player = new Player({
            lane: state.player.lane,
            name: state.player.name,
            isAI: false,
            color: state.player.color,
            stroke: state.player.stroke,
            stats: playerData.stats
        });
        this.player.loadState(state.player);

        this.opponents = state.opponents.map(oState => {
            const opponent = new Player({
                lane: oState.lane,
                name: oState.name,
                isAI: true,
                color: oState.color,
                stroke: oState.stroke
            });
            opponent.loadState(oState);
            opponent.aiController = new AIController({
                skill: Config.AI.baseSkill + (Math.random() - 0.5) * Config.AI.skillVariance
            });
            return opponent;
        });

        this.allPlayers = [this.player, ...this.opponents];
        this.cameraX = state.cameraX;
        this.cameraY = state.cameraY;
        this.lastFrameTime = performance.now() / 1000;

        return true;
    }
}
