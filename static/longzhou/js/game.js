class Game {
    constructor() {
        this.state = GameState.MENU;
        this.player = null;
        this.aiBoats = [];
        this.obstacleManager = null;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.pausedTime = 0;
        this.lastFrameTime = 0;
        this.animationId = null;
        this.rankings = [];
        this.isNewRecord = false;
        this.finalScore = 0;
    }

    init(boatType) {
        this.state = GameState.PLAYING;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.pausedTime = 0;
        this.lastFrameTime = performance.now();
        this.rankings = [];
        this.isNewRecord = false;
        this.finalScore = 0;

        this.player = new Boat(boatType, 0, '玩家', true);
        this.player.y = this.getBoatY(this.player.progress);

        this.aiBoats = [
            new Boat('green', 1, '青龙队', false),
            new Boat('red', 2, '烈焰队', false),
            new Boat('black', 3, '玄墨队', false)
        ];

        this.aiBoats.forEach(boat => {
            boat.y = this.getBoatY(boat.progress);
        });

        this.obstacleManager = new ObstacleManager();

        this.saveState();
    }

    getBoatY(progress) {
        const waterStartY = GameConfig.CANVAS_HEIGHT * 0.3;
        const waterHeight = GameConfig.CANVAS_HEIGHT - waterStartY;
        const playerScreenY = waterStartY + waterHeight * 0.65;
        const pixelsPerProgress = 1.5;
        const relativeProgress = progress - this.player.progress;
        return playerScreenY - relativeProgress * pixelsPerProgress;
    }

    gameLoop(currentTime) {
        if (this.state !== GameState.PLAYING) {
            if (this.state === GameState.PAUSED) {
                this.lastFrameTime = currentTime;
                this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
            }
            return;
        }

        const deltaTime = Math.min(currentTime - this.lastFrameTime, 50);
        this.lastFrameTime = currentTime;

        this.elapsedTime = Date.now() - this.startTime - this.pausedTime;

        this.update(deltaTime);
        this.render();
        this.updateHUD();

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        this.player.update(deltaTime, this);
        this.player.y = this.getBoatY(this.player.progress);

        this.aiBoats.forEach(boat => {
            boat.update(deltaTime, this);
            boat.updateAI(deltaTime, this.obstacleManager.obstacles, [this.player, ...this.aiBoats]);
            boat.y = this.getBoatY(boat.progress);
        });

        this.obstacleManager.update(deltaTime, this.player.progress, GameConfig.CANVAS_HEIGHT);

        const collisions = this.obstacleManager.checkCollisions(this.player);
        collisions.forEach(obstacle => {
            const result = this.player.hitObstacle(obstacle.config);
            if (!result.blocked) {
                Renderer.drawSplash(this.player.x, this.player.y);
            }
        });

        this.aiBoats.forEach(boat => {
            const aiCollisions = this.obstacleManager.checkCollisions(boat);
            aiCollisions.forEach(obstacle => {
                boat.hitObstacle(obstacle.config);
            });
        });

        this.updateRankings();

        if (this.player.finished) {
            this.endGame();
        }

        if (Math.random() < 0.1) {
            this.saveState();
        }
    }

    updateRankings() {
        const allBoats = [this.player, ...this.aiBoats];
        allBoats.sort((a, b) => b.progress - a.progress);
        this.rankings = allBoats.map((boat, index) => ({
            boat,
            rank: index + 1
        }));
    }

    render() {
        Renderer.clear();
        Renderer.drawBackground(this.player.progress);

        this.obstacleManager.obstacles.forEach(obstacle => {
            if (obstacle.active) {
                Renderer.drawObstacle(obstacle);
            }
        });

        const sortedBoats = [...this.aiBoats, this.player].sort((a, b) => b.progress - a.progress);
        sortedBoats.forEach(boat => {
            Renderer.drawBoat(boat, boat === this.player);
        });

        Renderer.updateParticles();
    }

    updateHUD() {
        const timeEl = document.getElementById('hud-time');
        const speedEl = document.getElementById('hud-speed');
        const rankEl = document.getElementById('hud-rank');

        if (timeEl) {
            timeEl.textContent = Storage.formatTime(this.elapsedTime);
        }
        if (speedEl) {
            speedEl.textContent = this.player.getSpeedKmh() + ' km/h';
        }
        if (rankEl) {
            const playerRank = this.rankings.find(r => r.boat === this.player)?.rank || 1;
            rankEl.textContent = `${playerRank}/4`;
        }

        SkillSystem.updateSkillUI(this.player);
        SkillSystem.updateRhythmIndicator(this.player);
    }

    pause() {
        if (this.state !== GameState.PLAYING) return;
        this.state = GameState.PAUSED;
        this.pauseStartTime = Date.now();
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        UI.showPauseMenu();
        this.saveState();
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    resume() {
        if (this.state !== GameState.PAUSED) return;
        this.state = GameState.PLAYING;
        this.pausedTime += Date.now() - this.pauseStartTime;
        this.lastFrameTime = performance.now();
        UI.hidePauseMenu();
    }

    restart() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        InputManager.reset();
        const boatType = Storage.getSelectedBoat();
        this.init(boatType);
        UI.hidePauseMenu();
        UI.hideGameOver();
        UI.showHUD();
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    endGame() {
        this.state = GameState.GAME_OVER;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const playerRank = this.rankings.find(r => r.boat === this.player)?.rank || 4;
        this.finalScore = Math.max(0, (5 - playerRank) * 100 + Math.round(100000 / Math.max(1, this.elapsedTime / 1000)));

        Storage.addScore(this.finalScore);
        this.isNewRecord = Storage.updateBestTime(this.elapsedTime);

        Storage.clearGameState();

        UI.showGameOver({
            rank: playerRank,
            time: this.elapsedTime,
            score: this.finalScore,
            isNewRecord: this.isNewRecord,
            bestTime: Storage.getBestTime()
        });
    }

    quit() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        InputManager.reset();
        this.state = GameState.MENU;
        Storage.clearGameState();
        UI.hidePauseMenu();
        UI.hideGameOver();
        UI.hideHUD();
        UI.showMainMenu();
    }

    saveState() {
        const state = {
            state: this.state,
            player: this.player?.toJSON(),
            aiBoats: this.aiBoats?.map(b => b.toJSON()),
            obstacleManager: this.obstacleManager?.toJSON(),
            startTime: this.startTime,
            elapsedTime: this.elapsedTime,
            pausedTime: this.pausedTime,
            rankings: this.rankings.map(r => ({
                rank: r.rank,
                boat: r.boat.toJSON()
            }))
        };
        Storage.saveGameState(state);
    }

    loadState() {
        const savedState = Storage.loadGameState();
        if (!savedState || savedState.state !== GameState.PLAYING) return false;

        try {
            this.state = savedState.state;
            this.player = Boat.fromJSON(savedState.player);
            this.aiBoats = savedState.aiBoats.map(b => Boat.fromJSON(b));
            this.obstacleManager = ObstacleManager.fromJSON(savedState.obstacleManager);
            this.startTime = savedState.startTime;
            this.elapsedTime = savedState.elapsedTime;
            this.pausedTime = savedState.pausedTime;
            this.lastFrameTime = performance.now();

            this.rankings = savedState.rankings.map(r => ({
                rank: r.rank,
                boat: r.boat.isPlayer ? this.player : this.aiBoats.find(b => b.name === r.boat.name)
            })).filter(r => r.boat);

            this.player.y = this.getBoatY(this.player.progress);
            this.aiBoats.forEach(boat => {
                boat.y = this.getBoatY(boat.progress);
            });

            return true;
        } catch (e) {
            console.error('恢复游戏状态失败:', e);
            return false;
        }
    }

    startFromSavedState() {
        if (this.loadState()) {
            UI.hideMainMenu();
            UI.showHUD();
            this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
            return true;
        }
        return false;
    }
}
