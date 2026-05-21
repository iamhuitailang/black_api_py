class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.keys = {};
        
        this.state = 'menu';
        this.paused = false;
        this.currentTheme = 'countryside';
        
        this.track = null;
        this.player = null;
        this.aiPlayers = [];
        this.itemManager = null;
        this.obstacleManager = null;
        
        this.cameraDistance = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.lastSaveTime = 0;
        
        this.aiNames = ['小明', '小红', '小刚', '小美', '阿强'];
        this.aiColors = ['#4FC3F7', '#AB47BC', '#FFB74D', '#66BB6A'];
        
        this.setupInput();
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.renderer.setTheme(theme);
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Escape' && this.state === 'playing') {
                this.togglePause();
            }
            
            if (e.code === 'Space' && this.state === 'playing' && !this.paused) {
                this.usePlayerItem();
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('beforeunload', () => {
            if (this.state === 'playing') {
                this.saveGame();
            }
        });
    }

    init() {
        this.track = new Track(this.currentTheme);
        this.itemManager = new ItemManager();
        this.obstacleManager = new ObstacleManager();
        
        this.player = new Player({
            id: 'player',
            name: '少年骑手',
            lane: 1
        });
        
        this.aiPlayers = [];
        const skillLevels = [Utils.random(0.85, 1.0), Utils.random(0.8, 0.95), Utils.random(0.75, 0.9)];
        for (let i = 0; i < CONFIG.GAME.AI_COUNT; i++) {
            const ai = new AIPlayer({
                id: `ai_${i}`,
                name: this.aiNames[i % this.aiNames.length],
                lane: i === 0 ? 0 : (i === 1 ? 2 : 0),
                color: this.aiColors[i % this.aiColors.length],
                skillLevel: skillLevels[i]
            });
            this.aiPlayers.push(ai);
        }
        
        this.cameraDistance = 0;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.state = 'playing';
        this.paused = false;
    }

    loadSavedGame() {
        const savedState = Storage.loadState();
        if (!savedState) return false;

        try {
            const theme = savedState.theme || 'countryside';
            this.currentTheme = theme;
            this.renderer.setTheme(theme);
            
            this.track = new Track(theme);
            this.track.loadState(savedState.track);
            
            this.itemManager = new ItemManager();
            this.itemManager.loadState(savedState.items);
            
            this.obstacleManager = new ObstacleManager();
            this.obstacleManager.loadState(savedState.obstacles);
            
            this.player = new Player();
            this.player.loadState(savedState.player);
            
            this.aiPlayers = savedState.aiPlayers.map(aiState => {
                const ai = new AIPlayer({});
                ai.loadState(aiState);
                return ai;
            });
            
            this.cameraDistance = savedState.cameraDistance;
            this.elapsedTime = savedState.elapsedTime;
            this.startTime = Date.now() - this.elapsedTime;
            this.state = 'playing';
            this.paused = false;
            
            return true;
        } catch (e) {
            console.error('加载存档失败:', e);
            return false;
        }
    }

    saveGame() {
        if (this.state !== 'playing') return;
        
        const state = {
            track: this.track.getState(),
            items: this.itemManager.getState(),
            obstacles: this.obstacleManager.getState(),
            player: this.player.getState(),
            aiPlayers: this.aiPlayers.map(ai => ai.getState()),
            cameraDistance: this.cameraDistance,
            elapsedTime: this.elapsedTime,
            theme: this.currentTheme,
            timestamp: Date.now()
        };
        
        Storage.saveState(state);
    }

    start() {
        this.loopRunning = false;
        Storage.clearState();
        this.init();
        this.gameLoop();
    }

    resume() {
        if (this.loadSavedGame()) {
            this.gameLoop();
            return true;
        }
        return false;
    }

    gameLoop() {
        if (this.state !== 'playing') return;
        
        this.loopRunning = true;
        requestAnimationFrame(() => this.gameLoop());
        
        if (this.paused) return;
        
        const deltaTime = 1000 / CONFIG.GAME.FPS;
        this.update(deltaTime);
        this.render();
        
        this.elapsedTime = Date.now() - this.startTime;
        
        if (Date.now() - this.lastSaveTime > 5000) {
            this.saveGame();
            this.lastSaveTime = Date.now();
        }
    }

    update(deltaTime) {
        this.track.update(deltaTime);
        
        const allPlayers = [this.player, ...this.aiPlayers];
        
        this.player.update(deltaTime, this, this.keys);
        
        for (const ai of this.aiPlayers) {
            ai.update(deltaTime, this, null, allPlayers);
        }
        
        this.itemManager.update(deltaTime, allPlayers, this.cameraDistance);
        this.obstacleManager.update(deltaTime, allPlayers, this.cameraDistance);
        
        this.updateCamera();
        this.checkGameEnd();
        this.updateUI();
    }

    updateCamera() {
        const targetDistance = this.player.distance - 150;
        this.cameraDistance = Utils.lerp(this.cameraDistance, Math.max(0, targetDistance), 0.1);
    }

    usePlayerItem() {
        const item = this.player.useItem();
        if (!item) return;

        switch (item) {
            case 'boost':
                this.player.applyEffect('boost', CONFIG.ITEMS.BOOST_DURATION);
                break;
            case 'shield':
                this.player.applyEffect('shield', CONFIG.ITEMS.SHIELD_DURATION);
                break;
            case 'bomb':
                this.itemManager.useBomb(this.player, [this.player, ...this.aiPlayers]);
                break;
            case 'trap':
                this.itemManager.placeTrap(this.player);
                break;
        }
    }

    checkGameEnd() {
        const allPlayers = [this.player, ...this.aiPlayers];
        const finishedCount = allPlayers.filter(p => p.finished).length;
        
        if (finishedCount >= allPlayers.length || this.player.finished) {
            this.endGame();
        }
    }

    endGame() {
        this.state = 'finished';
        Storage.clearState();
        
        const allPlayers = [this.player, ...this.aiPlayers];
        const sortedPlayers = [...allPlayers].sort((a, b) => {
            if (a.finished && b.finished) {
                return a.finishTime - b.finishTime;
            }
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.distance - a.distance;
        });
        
        window.dispatchEvent(new CustomEvent('gameFinished', {
            detail: {
                playerRank: sortedPlayers.indexOf(this.player) + 1,
                playerTime: this.player.finished ? this.player.finishTime - this.startTime : this.elapsedTime,
                rankings: sortedPlayers.map((p, i) => ({
                    rank: i + 1,
                    name: p.name,
                    isPlayer: p === this.player,
                    time: p.finished ? p.finishTime - this.startTime : null
                }))
            }
        }));
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground(this.track, this.cameraDistance);
        this.renderer.drawDecorations(this.track, this.cameraDistance);
        this.renderer.drawTrack(this.track, this.obstacleManager.obstacles, this.cameraDistance);
        this.renderer.drawItems(this.itemManager.items, this.itemManager.placedTraps, this.cameraDistance);
        
        const allPlayers = [this.player, ...this.aiPlayers];
        const sortedPlayers = [...allPlayers].sort((a, b) => a.distance - b.distance);
        
        for (const player of sortedPlayers) {
            this.renderer.drawPlayer(player, this.cameraDistance, player === this.player);
        }
    }

    updateUI() {
        window.dispatchEvent(new CustomEvent('gameUIUpdate', {
            detail: {
                time: this.elapsedTime,
                speed: Math.round(this.player.speed * 10),
                progress: (this.player.distance / CONFIG.GAME.TRACK_LENGTH) * 100,
                rank: this.getPlayerRank(),
                totalPlayers: CONFIG.GAME.AI_COUNT + 1,
                item: this.player.item
            }
        }));
    }

    getPlayerRank() {
        const allPlayers = [this.player, ...this.aiPlayers];
        const sorted = [...allPlayers].sort((a, b) => b.distance - a.distance);
        return sorted.indexOf(this.player) + 1;
    }

    togglePause() {
        this.paused = !this.paused;
        window.dispatchEvent(new CustomEvent('gamePauseToggled', {
            detail: { paused: this.paused }
        }));
        
        if (this.paused) {
            this.saveGame();
        }
    }

    restart() {
        Storage.clearState();
        this.init();
        this.gameLoop();
    }

    quit() {
        if (this.state === 'playing') {
            this.saveGame();
        }
        this.state = 'menu';
    }
}
