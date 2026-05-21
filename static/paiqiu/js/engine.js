const GameEngine = {
    state: null,
    isRunning: false,
    isPaused: false,
    animationId: null,
    lastSaveTime: 0,
    lastUIUpdateTime: 0,
    UI_UPDATE_INTERVAL: 100,

    init() {
        this.state = this.createInitialState();
    },

    createInitialState() {
        const court = CONFIG.COURT;
        const groundY = court.Y + court.HEIGHT - CONFIG.PLAYER.HEIGHT;
        
        return {
            mode: null,
            opponentConfig: null,
            environment: null,
            
            player: new Player(
                court.X + 120,
                groundY,
                false
            ),
            enemy: new Player(
                court.X + court.WIDTH - 160,
                groundY,
                true
            ),
            ball: new Ball(),
            aiController: null,
            effectsManager: new EffectsManager(),
            
            playerScore: 0,
            enemyScore: 0,
            playerSets: 0,
            enemySets: 0,
            combo: 0,
            lastScorer: null,
            
            stats: {
                spikes: 0,
                blocks: 0,
                aces: 0
            },
            
            isServing: true,
            server: 'player',
            rallyCount: 0,
            
            gameStartTime: Date.now()
        };
    },

    startGame(mode, opponent) {
        this.state = this.createInitialState();
        this.state.mode = CONFIG.GAME_MODES[mode];
        this.state.modeKey = mode;
        
        if (opponent) {
            this.state.opponentConfig = CONFIG.OPPONENTS[opponent];
            this.state.aiController = new AIController(
                this.state.enemy,
                this.state.ball,
                this.state.opponentConfig
            );
        }
        
        this.state.environment = this.selectEnvironment();
        
        this.resetRally();
        this.isRunning = true;
        this.isPaused = false;
        
        UI.showGameHud();
        UI.updateScoreboard(this.state);
        
        this.gameLoop();
    },

    selectEnvironment() {
        const rand = Math.random();
        let cumulative = 0;
        for (const env of CONFIG.ENVIRONMENTS) {
            cumulative += env.probability;
            if (rand <= cumulative) {
                return env;
            }
        }
        return CONFIG.ENVIRONMENTS[0];
    },

    resetRally() {
        const court = CONFIG.COURT;
        const net = CONFIG.NET;
        
        this.state.player.x = court.X + 120;
        this.state.enemy.x = court.X + court.WIDTH - 160;
        this.state.player.y = this.state.player.groundY;
        this.state.enemy.y = this.state.enemy.groundY;
        this.state.player.isJumping = false;
        this.state.enemy.isJumping = false;
        
        if (this.state.server === 'player') {
            this.state.ball.reset(
                court.X + 150,
                net.TOP + 60
            );
        } else {
            this.state.ball.reset(
                court.X + court.WIDTH - 150,
                net.TOP + 60
            );
        }
        
        this.state.rallyCount = 0;
        this.state.isServing = true;
    },

    gameLoop() {
        if (!this.isRunning) return;
        
        if (!this.isPaused) {
            this.update();
            this.render();
            this.autoSave();
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },

    update() {
        const state = this.state;
        const { player, enemy, ball, mode } = state;
        
        this.handleInput();
        
        player.update();
        
        if (state.aiController && !mode.hasWall) {
            state.aiController.update();
            enemy.update();
        }
        
        ball.update(state.environment);
        
        this.checkCollisions();
        this.checkScore();
        
        state.effectsManager.update();
        
        const now = Date.now();
        if (now - this.lastUIUpdateTime >= this.UI_UPDATE_INTERVAL) {
            UI.updateScoreboard(state);
            this.lastUIUpdateTime = now;
        }
    },

    handleInput() {
        const { player, ball } = this.state;
        const movement = Input.getMovement();
        
        if (movement.dx !== 0) {
            if (movement.dx < 0) {
                player.moveLeft(CONFIG.PLAYER.SPEED * Math.abs(movement.dx));
            } else {
                player.moveRight(CONFIG.PLAYER.SPEED * movement.dx);
            }
        } else {
            player.stop();
        }
        
        if (movement.dy < -0.5 && !player.isJumping) {
            player.jump();
        }
    },

    playerReceive() {
        const { player, ball } = this.state;
        if (player.canReachBall(ball) && ball.lastHitBy !== 'player') {
            player.receive();
            const angle = -Math.PI / 2.5 + Math.random() * 0.4;
            const power = 8;
            ball.hit(angle, power, false, 'player');
            this.state.effectsManager.addNetShake();
        }
    },

    playerSpike() {
        const state = this.state;
        const { player, ball } = state;
        
        if (state.isServing && state.server === 'player') {
            state.isServing = false;
            player.spike();
            const angle = -Math.PI / 3 + Math.random() * 0.3;
            const power = 11;
            ball.hit(angle, power, false, 'player');
            state.stats.aces++;
            Storage.addStat('aces');
            state.effectsManager.addSpikeEffect(ball.x, ball.y);
            return;
        }
        
        if (player.canReachBall(ball) && ball.lastHitBy !== 'player' && ball.vx >= 0) {
            player.jump();
            player.spike();
            const angle = -Math.PI / 4 + Math.random() * 0.4;
            const power = 14;
            ball.hit(angle, power, true, 'player');
            state.stats.spikes++;
            Storage.addStat('spikes');
            state.effectsManager.addSpikeEffect(ball.x, ball.y);
        }
    },

    playerBlock() {
        const state = this.state;
        const { player, ball } = state;
        player.block();
        
        if (player.canReachBall(ball) && ball.vx > 0) {
            const angle = -Math.PI / 2.5 + (Math.random() - 0.5) * 0.6;
            const power = 10;
            ball.hit(angle, power, false, 'player');
            state.stats.blocks++;
            Storage.addStat('blocks');
            state.effectsManager.addNetShake();
        }
    },

    checkCollisions() {
        const state = this.state;
        const { ball, player, enemy } = state;
        const net = CONFIG.NET;
        
        if (Math.abs(ball.x - net.X) < ball.radius + net.WIDTH / 2 &&
            ball.y > net.TOP && ball.y < net.TOP + net.HEIGHT) {
            ball.vx = -ball.vx * 0.8;
            ball.x = net.X + (ball.x < net.X ? -ball.radius - 5 : ball.radius + 5);
            state.effectsManager.addNetShake();
        }
        
        if (state.mode.hasWall && ball.x > CONFIG.COURT.X + CONFIG.COURT.WIDTH - 30) {
            ball.vx = -ball.vx * 0.9;
            ball.x = CONFIG.COURT.X + CONFIG.COURT.WIDTH - 30 - ball.radius;
        }
    },

    checkScore() {
        const state = this.state;
        const { ball, mode } = state;
        const court = CONFIG.COURT;
        const net = CONFIG.NET;
        const groundY = court.Y + court.HEIGHT;
        
        if (ball.y + ball.radius >= groundY - 5 && Math.abs(ball.vy) < 2) {
            const isPlayerSide = ball.x < net.X;
            
            if (isPlayerSide) {
                this.scorePoint('enemy');
            } else {
                this.scorePoint('player');
            }
        }
    },

    scorePoint(scorer) {
        const state = this.state;
        
        if (scorer === state.lastScorer) {
            state.combo++;
        } else {
            state.combo = 1;
        }
        state.lastScorer = scorer;
        
        if (scorer === 'player') {
            state.playerScore++;
            state.server = 'player';
            state.effectsManager.addScoreFlash(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        } else {
            state.enemyScore++;
            state.server = 'enemy';
        }
        
        if (this.checkSetWin()) {
            return;
        }
        
        setTimeout(() => {
            if (this.isRunning) {
                this.resetRally();
            }
        }, 1000);
    },

    checkSetWin() {
        const state = this.state;
        const mode = state.mode;
        
        const playerWinsSet = state.playerScore >= mode.pointsToWin &&
            (!mode.winByTwo || state.playerScore - state.enemyScore >= 2);
        
        const enemyWinsSet = state.enemyScore >= mode.pointsToWin &&
            (!mode.winByTwo || state.enemyScore - state.playerScore >= 2);
        
        if (playerWinsSet) {
            state.playerSets++;
        } else if (enemyWinsSet) {
            state.enemySets++;
        } else {
            return false;
        }
        
        state.playerScore = 0;
        state.enemyScore = 0;
        state.combo = 0;
        
        if (this.checkMatchWin()) {
            return true;
        }
        
        setTimeout(() => {
            if (this.isRunning) {
                this.resetRally();
            }
        }, 1500);
        
        return true;
    },

    checkMatchWin() {
        const state = this.state;
        const mode = state.mode;
        
        const setsToWin = Math.ceil(mode.maxSets / 2);
        const playerWins = state.playerSets >= setsToWin;
        const enemyWins = state.enemySets >= setsToWin;
        
        if (playerWins || enemyWins) {
            this.endGame(playerWins);
            return true;
        }
        
        return false;
    },

    endGame(playerWon) {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        let points = 0;
        if (playerWon) {
            const setDiff = this.state.playerSets - this.state.enemySets;
            if (setDiff >= 3) {
                points = CONFIG.POINTS.win_3_0;
            } else if (setDiff === 2) {
                points = CONFIG.POINTS.win_3_1;
            } else {
                points = CONFIG.POINTS.win_3_2;
            }
            points += this.state.stats.aces * CONFIG.POINTS.ace;
            points += this.state.stats.blocks * CONFIG.POINTS.block;
            
            Storage.addWin();
            Storage.addScore(points);
        } else {
            Storage.addLoss();
        }
        
        Storage.clearCurrentGame();
        
        UI.showGameOver({
            playerScore: this.state.playerScore,
            enemyScore: this.state.enemyScore,
            playerSets: this.state.playerSets,
            enemySets: this.state.enemySets,
            spikes: this.state.stats.spikes,
            blocks: this.state.stats.blocks,
            aces: this.state.stats.aces,
            points
        });
    },

    render() {
        Renderer.render(this.state);
    },

    pause() {
        this.isPaused = true;
    },

    resume() {
        this.isPaused = false;
    },

    restart() {
        this.startGame(this.state.modeKey, UI.selectedOpponent);
    },

    quit() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        Storage.clearCurrentGame();
    },

    autoSave() {
        const now = Date.now();
        if (now - this.lastSaveTime < 5000) return;
        this.lastSaveTime = now;
        
        const saveState = this.serialize();
        Storage.saveCurrentGame(saveState);
    },

    serialize() {
        return {
            modeKey: this.state.modeKey,
            opponent: this.state.opponentConfig ? Object.keys(CONFIG.OPPONENTS).find(
                key => CONFIG.OPPONENTS[key] === this.state.opponentConfig
            ) : null,
            environment: this.state.environment,
            player: this.state.player.serialize(),
            enemy: this.state.enemy.serialize(),
            ball: this.state.ball.serialize(),
            aiController: this.state.aiController?.serialize(),
            effectsManager: this.state.effectsManager.serialize(),
            playerScore: this.state.playerScore,
            enemyScore: this.state.enemyScore,
            playerSets: this.state.playerSets,
            enemySets: this.state.enemySets,
            combo: this.state.combo,
            lastScorer: this.state.lastScorer,
            stats: this.state.stats,
            isServing: this.state.isServing,
            server: this.state.server,
            uiState: UI.serialize()
        };
    },

    deserialize(data) {
        if (!data) return false;
        
        try {
            this.state = this.createInitialState();
            this.state.modeKey = data.modeKey;
            this.state.mode = CONFIG.GAME_MODES[data.modeKey];
            this.state.environment = data.environment;
            
            this.state.player = Player.deserialize(data.player);
            this.state.enemy = Player.deserialize(data.enemy);
            this.state.ball = Ball.deserialize(data.ball);
            
            if (data.opponent) {
                this.state.opponentConfig = CONFIG.OPPONENTS[data.opponent];
                this.state.aiController = new AIController(
                    this.state.enemy,
                    this.state.ball,
                    this.state.opponentConfig
                );
                if (data.aiController) {
                    this.state.aiController.deserialize(data.aiController);
                }
            }
            
            this.state.effectsManager.deserialize(data.effectsManager || {});
            
            this.state.playerScore = data.playerScore;
            this.state.enemyScore = data.enemyScore;
            this.state.playerSets = data.playerSets;
            this.state.enemySets = data.enemySets;
            this.state.combo = data.combo;
            this.state.lastScorer = data.lastScorer;
            this.state.stats = data.stats;
            this.state.isServing = data.isServing;
            this.state.server = data.server;
            
            UI.deserialize(data.uiState);
            
            return true;
        } catch (e) {
            console.error('Error deserializing game state:', e);
            return false;
        }
    },

    loadSavedGame() {
        const saved = Storage.getCurrentGame();
        if (saved && this.deserialize(saved)) {
            this.isRunning = true;
            this.isPaused = false;
            UI.showGameHud();
            UI.updateScoreboard(this.state);
            this.gameLoop();
            return true;
        }
        return false;
    }
};
