class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputSystem();
        this.state = new GameState();
        this.lastTime = 0;
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.renderer.resize();
        this.input.init();
        this.bindUI();
        this.bindInputEvents();
        this.updateHighScore();
        this.populateCharacters();
        this.populateScenes();
        
        const savedState = Storage.loadGameState();
        if (savedState) {
            this.state.selectedCharacterId = savedState.characterId || this.state.selectedCharacterId;
            this.state.selectedSceneId = savedState.sceneId || this.state.selectedSceneId;
        }
        
        this.state.showScreen('main-menu');
        
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });

        window.addEventListener('beforeunload', () => {
            if (this.state.character && !this.state.isGameOver && !this.state.isPaused) {
                this.state.saveProgress();
            }
        });

        this.startGameLoop();
    }

    bindUI() {
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-characters').addEventListener('click', () => this.state.showScreen('character-select'));
        document.getElementById('btn-scenes').addEventListener('click', () => this.state.showScreen('scene-select'));
        document.getElementById('btn-help').addEventListener('click', () => this.state.showScreen('help-screen'));
        
        document.getElementById('btn-back-char').addEventListener('click', () => this.state.showScreen('main-menu'));
        document.getElementById('btn-back-scene').addEventListener('click', () => this.state.showScreen('main-menu'));
        document.getElementById('btn-back-help').addEventListener('click', () => this.state.showScreen('main-menu'));
        
        document.getElementById('btn-pause').addEventListener('click', () => this.state.togglePause());
        document.getElementById('btn-resume').addEventListener('click', () => this.state.togglePause());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-quit').addEventListener('click', () => this.quitToMenu());
        
        document.getElementById('btn-retry').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-menu').addEventListener('click', () => this.quitToMenu());
    }

    bindInputEvents() {
        this.input.on('tiltLeft', (size) => {
            if (!this.state.balanceSystem || this.state.isPaused || this.state.isGameOver) return;
            const amount = size === 'big' ? GameConfig.INPUT.TILT_BIG : GameConfig.INPUT.TILT_SMALL;
            this.state.balanceSystem.tiltLeft(amount);
        });

        this.input.on('tiltRight', (size) => {
            if (!this.state.balanceSystem || this.state.isPaused || this.state.isGameOver) return;
            const amount = size === 'big' ? GameConfig.INPUT.TILT_BIG : GameConfig.INPUT.TILT_SMALL;
            this.state.balanceSystem.tiltRight(amount);
        });

        this.input.on('calm', () => {
            if (!this.state.balanceSystem || this.state.isPaused || this.state.isGameOver) return;
            this.state.balanceSystem.calm();
        });

        this.input.on('useItem', (index) => {
            if (!this.state.itemSystem || this.state.isPaused || this.state.isGameOver) return;
            const items = GameConfig.ITEMS;
            if (index >= 0 && index < items.length) {
                this.state.itemSystem.useItem(items[index].id, this.state.character, this.state.balanceSystem);
                this.updateItemBar();
            }
        });

        this.input.on('pause', () => {
            if (this.state.currentScreen === 'game-hud') {
                this.state.togglePause();
            } else if (this.state.currentScreen === 'pause-screen') {
                this.state.togglePause();
            }
        });
    }

    populateCharacters() {
        const container = document.getElementById('character-list');
        container.innerHTML = '';
        
        GameConfig.CHARACTERS.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card' + (this.state.selectedCharacterId === char.id ? ' selected' : '');
            card.innerHTML = `
                <div class="character-name">${char.name}</div>
                <div class="character-desc">${char.desc}</div>
                <div class="character-stats">
                    <span>被动: ${char.passive}</span>
                    <span>平衡: ${char.stats.balanceMax}</span>
                    <span>抗风: ${Math.floor(char.stats.windResist * 100)}%</span>
                </div>
            `;
            card.addEventListener('click', () => {
                this.state.selectedCharacterId = char.id;
                Storage.setSelectedCharacter(char.id);
                this.populateCharacters();
            });
            container.appendChild(card);
        });
    }

    populateScenes() {
        const container = document.getElementById('scene-list');
        container.innerHTML = '';
        
        GameConfig.SCENES.forEach(scene => {
            const card = document.createElement('div');
            card.className = 'scene-card' + (this.state.selectedSceneId === scene.id ? ' selected' : '');
            const stars = '⭐'.repeat(scene.difficulty);
            card.innerHTML = `
                <div class="scene-name">${scene.name} ${stars}</div>
                <div class="scene-desc">${scene.desc}</div>
            `;
            card.addEventListener('click', () => {
                this.state.selectedSceneId = scene.id;
                Storage.setSelectedScene(scene.id);
                this.populateScenes();
            });
            container.appendChild(card);
        });
    }

    startGame() {
        this.state.initGame();
        this.state.showScreen('game-hud');
        this.updateItemBar();
    }

    restartGame() {
        this.state.reset();
        this.state.initGame();
        this.state.showScreen('game-hud');
        this.updateItemBar();
    }

    quitToMenu() {
        this.state.reset();
        this.updateHighScore();
        this.populateCharacters();
        this.populateScenes();
        this.state.isPaused = false;
        this.state.isGameOver = false;
        this.state.showScreen('main-menu');
    }

    updateHighScore() {
        document.getElementById('high-score').textContent = Storage.getHighScore();
    }

    updateItemBar() {
        const container = document.getElementById('item-bar');
        container.innerHTML = '';
        const inventory = Storage.getInventory();
        
        GameConfig.ITEMS.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'item-slot';
            const count = inventory[item.id] || 0;
            slot.innerHTML = `
                <span>${item.emoji}</span>
                <span class="item-key">${index + 1}</span>
                <span class="item-count">${count}</span>
            `;
            slot.title = `${item.name}: ${item.desc}`;
            slot.addEventListener('click', () => {
                if (!this.state.itemSystem || this.state.isPaused || this.state.isGameOver) return;
                this.state.itemSystem.useItem(item.id, this.state.character, this.state.balanceSystem);
                this.updateItemBar();
            });
            container.appendChild(slot);
        });
    }

    updateHUD() {
        if (!this.state.balanceSystem) return;
        
        const balancePercent = this.state.balanceSystem.getBalancePercent();
        const indicator = document.getElementById('balance-indicator');
        const leftPercent = 50 + balancePercent * 0.5;
        indicator.style.left = `${Math.max(5, Math.min(95, leftPercent))}%`;
        
        if (Math.abs(balancePercent) > 75) {
            indicator.style.background = '#ef4444';
            indicator.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.8)';
        } else if (Math.abs(balancePercent) > 50) {
            indicator.style.background = '#f59e0b';
            indicator.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.8)';
        } else {
            indicator.style.background = '#4ade80';
            indicator.style.boxShadow = '0 0 10px rgba(74, 222, 128, 0.8)';
        }

        document.getElementById('current-score').textContent = this.state.score;
        document.getElementById('distance').textContent = Math.floor(this.state.distance);
    }

    startGameLoop() {
        const loop = (timestamp) => {
            const dt = Math.min(timestamp - this.lastTime, 50);
            this.lastTime = timestamp;

            if (this.state.character && this.state.scene) {
                this.state.update(dt);
                this.renderer.render(
                    this.state.scene,
                    this.state.character,
                    this.state.balanceSystem,
                    this.state.obstacleSystem,
                    this.state
                );
                
                if (this.state.character.x + 500 >= GameConfig.WIRE_LENGTH) {
                    this.renderer.drawEndPoint(GameConfig.WIRE_LENGTH, this.renderer.height * this.state.scene.wireHeight);
                }

                if (this.state.currentScreen === 'game-hud') {
                    this.updateHUD();
                }
            }

            this.animationId = requestAnimationFrame(loop);
        };

        this.animationId = requestAnimationFrame(loop);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
