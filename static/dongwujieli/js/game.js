const Game = {
    state: {
        status: 'menu',
        level: 1,
        score: 0,
        elapsedTime: 0,
        startTime: 0,
        paused: false,
        itemsCollected: 0,
        currentSegment: 0
    },

    lastTime: 0,
    animationId: null,
    collisionCooldown: 0,

    init() {
        this.bindEvents();
        this.loadProgress();
        Input.on('useItem', () => this.useItem());
        Input.on('switchCharacter', () => this.switchCharacter());
    },

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartLevel();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitToMenu();
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.nextLevel();
        });

        document.getElementById('replay-btn').addEventListener('click', () => {
            this.restartLevel();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.quitToMenu();
        });

        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.state.level = parseInt(btn.dataset.level);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.state.status === 'playing') {
                    this.pauseGame();
                } else if (this.state.status === 'paused') {
                    this.resumeGame();
                }
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.status === 'playing') {
                this.pauseGame();
            }
        });
    },

    loadProgress() {
        const progress = Storage.loadAllLevelProgress();
        Object.keys(progress).forEach(level => {
            const starsElement = document.getElementById(`stars-${level}`);
            if (starsElement && progress[level].stars > 0) {
                starsElement.textContent = '⭐'.repeat(progress[level].stars);
            }
        });

        const selectedLevel = document.querySelector('.level-btn.selected');
        if (!selectedLevel) {
            const firstBtn = document.querySelector('.level-btn');
            if (firstBtn) firstBtn.classList.add('selected');
        }
    },

    startGame() {
        const selectedBtn = document.querySelector('.level-btn.selected');
        if (selectedBtn) {
            this.state.level = parseInt(selectedBtn.dataset.level);
        }

        this.showScreen('game-screen');
        this.initLevel();
        this.state.status = 'playing';
        this.state.startTime = Date.now();
        this.state.elapsedTime = 0;
        this.lastTime = performance.now();
        this.saveGameState();
        this.gameLoop();
    },

    initLevel() {
        const levelConfig = GameConfig.LEVELS[this.state.level];

        LevelSystem.init(this.state.level);
        CharacterSystem.init(GameConfig.TEAM_ORDER);
        ObstacleSystem.init(levelConfig);
        ItemSystem.init(levelConfig);

        CharacterSystem.setPosition(
            GameConfig.CANVAS.TRACK_WIDTH / 2,
            100
        );

        this.state.score = 0;
        this.state.itemsCollected = 0;
        this.state.currentSegment = 0;
        this.collisionCooldown = 0;

        Renderer.cameraY = 0;
    },

    gameLoop() {
        if (this.state.status !== 'playing') return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!this.state.paused) {
            this.update(deltaTime);
            this.render();
            this.saveGameState();
        }

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },

    update(deltaTime) {
        this.state.elapsedTime = Date.now() - this.state.startTime;

        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= deltaTime;
        }

        const direction = Input.getDirection();
        CharacterSystem.updateCurrent(deltaTime, direction);

        CharacterSystem.moveCharacter(
            CharacterSystem.getCurrent().vx,
            CharacterSystem.getCurrent().vy
        );

        ObstacleSystem.update(deltaTime, CharacterSystem);
        ItemSystem.update(deltaTime, CharacterSystem);

        const pickedItem = ItemSystem.checkPickup(CharacterSystem);
        if (pickedItem) {
            const result = ItemSystem.pickUpItem(pickedItem);
            if (result.score) {
                this.state.score += result.score;
                Renderer.addFloatingText(pickedItem.x, pickedItem.y, `+${result.score}`);
            }
            if (result.held) {
                Renderer.addFloatingText(pickedItem.x, pickedItem.y, '道具!');
            }
            if (result.stamina) {
                Renderer.addFloatingText(pickedItem.x, pickedItem.y, `+${result.stamina}耐力`);
            }
            Renderer.addParticles(pickedItem.x, pickedItem.y, pickedItem.config.color);
            this.state.itemsCollected++;
        }

        ItemSystem.clearCollected();

        const collision = ObstacleSystem.checkCollision(CharacterSystem);
        if (collision && this.collisionCooldown <= 0) {
            this.handleCollision(collision);
        }

        const relayPoint = ObstacleSystem.checkRelayPoint(CharacterSystem);
        if (relayPoint) {
            this.handleRelay(relayPoint);
        }

        const char = CharacterSystem.getCurrent();
        if (char && char.y >= GameConfig.GAME.FINISH_LINE) {
            this.handleFinish();
        }

        Renderer.updateCamera(CharacterSystem);
    },

    render() {
        Renderer.render(
            LevelSystem.getLevelConfig(),
            CharacterSystem,
            ObstacleSystem,
            ItemSystem,
            this.state
        );
    },

    handleCollision(collision) {
        const char = CharacterSystem.getCurrent();
        if (!char) return;

        if (CharacterSystem.hasEffect('shield')) {
            CharacterSystem.removeEffect('shield');
            Renderer.addFloatingText(collision.x, collision.y, '护盾破碎!');
            this.collisionCooldown = 1000;
            return;
        }

        if (CharacterSystem.canPenetrate(collision.config)) {
            Renderer.addFloatingText(collision.x, collision.y, '穿越!');
            this.collisionCooldown = 500;
            return;
        }

        const damage = collision.config.damage;
        const slowFactor = collision.config.slowFactor;

        CharacterSystem.consumeStamina(damage);
        this.state.score = Math.max(0, this.state.score - damage * 2);

        Renderer.addFloatingText(collision.x, collision.y, `-${damage}`);
        Renderer.addParticles(collision.x, collision.y, collision.config.color);

        const dist = Math.hypot(char.x - collision.x, char.y - collision.y);
        if (dist > 0) {
            const pushX = (char.x - collision.x) / dist * 20;
            const pushY = (char.y - collision.y) / dist * 20;
            CharacterSystem.moveCharacter(pushX, pushY);
        }

        CharacterSystem.addEffect({
            type: 'speedMultiplier',
            value: slowFactor,
            duration: 1500
        });

        if (collision.config.type === 'hidden' && collision.config.effect === 'stun') {
            CharacterSystem.addEffect({
                type: 'speedMultiplier',
                value: 0.1,
                duration: collision.config.effectDuration
            });
            Renderer.addFloatingText(collision.x, collision.y - 30, '眩晕!');
        }

        this.collisionCooldown = 500;

        if (char.stamina <= 0) {
            CharacterSystem.restoreStamina(char.maxStamina * 0.3);
            Renderer.addFloatingText(char.x, char.y - 40, '队友接力!');
            this.switchCharacter();
        }
    },

    handleRelay(relayPoint) {
        const char = CharacterSystem.getCurrent();
        if (!char) return;

        if (CharacterSystem.characters.length > 1) {
            Renderer.addFloatingText(relayPoint.x, relayPoint.y, '接力!');
            Renderer.addParticles(relayPoint.x, relayPoint.y, 'rgb(255, 200, 100)', 20);

            const nextIndex = CharacterSystem.findNextAvailable();
            if (nextIndex !== -1 && nextIndex !== CharacterSystem.currentIndex) {
                CharacterSystem.characters[CharacterSystem.currentIndex].active = false;
                CharacterSystem.currentIndex = nextIndex;
                CharacterSystem.characters[nextIndex].active = true;
                CharacterSystem.setPosition(relayPoint.x, relayPoint.y + 30);
            }
        }

        this.state.currentSegment++;
    },

    handleFinish() {
        const hasMore = CharacterSystem.finishCurrent();

        if (!hasMore || CharacterSystem.isAllFinished()) {
            this.completeLevel();
        } else {
            Renderer.addFloatingText(
                CharacterSystem.getCurrent().x,
                CharacterSystem.getCurrent().y,
                '下一位!'
            );
        }
    },

    completeLevel() {
        this.state.status = 'finished';
        cancelAnimationFrame(this.animationId);

        const time = this.state.elapsedTime;
        const stars = LevelSystem.calculateStars(time);
        const score = LevelSystem.calculateScore(time, stars, this.state.itemsCollected);

        this.state.score = score;

        Storage.saveLevelProgress(this.state.level, stars, time, score);
        Storage.saveBestTime(this.state.level, time);
        Storage.clearGameState();

        this.showResultScreen(time, score, stars);
    },

    showResultScreen(time, score, stars) {
        this.showScreen('result-screen');

        document.getElementById('result-time').textContent = Renderer.formatTime(time);
        document.getElementById('result-score').textContent = score;

        const bestTime = Storage.loadBestTime(this.state.level);
        document.getElementById('best-time').textContent = bestTime ? Renderer.formatTime(bestTime) : '--';

        const starsContainer = document.getElementById('stars-display');
        const starElements = starsContainer.querySelectorAll('.star');
        starElements.forEach((star, i) => {
            setTimeout(() => {
                if (i < stars) {
                    star.classList.add('active');
                }
            }, i * 300);
        });

        document.getElementById('next-level-btn').style.display =
            LevelSystem.isLastLevel() ? 'none' : 'block';

        this.loadProgress();
    },

    useItem() {
        if (this.state.status !== 'playing') return;
        if (ItemSystem.useHeldItem()) {
            const char = CharacterSystem.getCurrent();
            Renderer.addFloatingText(char.x, char.y - 30, '使用道具!');
            Renderer.addParticles(char.x, char.y, 'rgb(255, 200, 100)', 15);
        }
    },

    switchCharacter() {
        if (this.state.status !== 'playing') return;
        if (CharacterSystem.switchCharacter(true)) {
            const char = CharacterSystem.getCurrent();
            Renderer.addFloatingText(char.x, char.y - 30, '切换!');
        }
    },

    pauseGame() {
        if (this.state.status !== 'playing') return;
        this.state.paused = true;
        this.state.status = 'paused';
        this.showScreen('pause-screen');
    },

    resumeGame() {
        this.state.paused = false;
        this.state.status = 'playing';
        this.hideScreen('pause-screen');
        this.lastTime = performance.now();
        this.gameLoop();
    },

    restartLevel() {
        cancelAnimationFrame(this.animationId);
        this.hideScreen('pause-screen');
        this.hideScreen('result-screen');
        this.showScreen('game-screen');
        this.initLevel();
        this.state.status = 'playing';
        this.state.paused = false;
        this.state.startTime = Date.now();
        this.state.elapsedTime = 0;
        this.lastTime = performance.now();
        this.gameLoop();
        this.saveGameState();
    },

    nextLevel() {
        if (!LevelSystem.isLastLevel()) {
            cancelAnimationFrame(this.animationId);
            LevelSystem.nextLevel();
            this.state.level = LevelSystem.getCurrentLevel();
            this.hideScreen('result-screen');
            this.initLevel();
            this.state.status = 'playing';
            this.state.startTime = Date.now();
            this.state.elapsedTime = 0;
            this.lastTime = performance.now();
            this.gameLoop();
            this.saveGameState();
        }
    },

    quitToMenu() {
        cancelAnimationFrame(this.animationId);
        this.state.status = 'menu';
        this.hideScreen('pause-screen');
        this.hideScreen('game-screen');
        this.hideScreen('result-screen');
        this.showScreen('start-screen');
        Storage.clearGameState();
    },

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');

        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            if (id === 'game-screen') {
                mobileControls.style.display = 'flex';
            } else {
                mobileControls.style.display = 'none';
            }
        }
    },

    hideScreen(id) {
        document.getElementById(id).classList.remove('active');
    },

    saveGameState() {
        const state = {
            level: this.state.level,
            score: this.state.score,
            elapsedTime: this.state.elapsedTime,
            startTime: this.state.startTime,
            characters: CharacterSystem.getAll().map(c => ({
                id: c.id,
                x: c.x,
                y: c.y,
                stamina: c.stamina,
                finished: c.finished,
                active: c.active
            })),
            currentIndex: CharacterSystem.currentIndex,
            heldItem: ItemSystem.heldItem ? ItemSystem.heldItem.type : null
        };
        Storage.saveGameState(state);
    },

    loadGameState() {
        const state = Storage.loadGameState();
        if (!state) return false;

        this.state.level = state.level;
        this.state.score = state.score;
        this.state.elapsedTime = state.elapsedTime;
        this.state.startTime = state.startTime;

        LevelSystem.init(state.level);
        CharacterSystem.init(GameConfig.TEAM_ORDER);

        state.characters.forEach((savedChar, index) => {
            if (CharacterSystem.characters[index]) {
                CharacterSystem.characters[index].x = savedChar.x;
                CharacterSystem.characters[index].y = savedChar.y;
                CharacterSystem.characters[index].stamina = savedChar.stamina;
                CharacterSystem.characters[index].finished = savedChar.finished;
                CharacterSystem.characters[index].active = savedChar.active;
            }
        });
        CharacterSystem.currentIndex = state.currentIndex;

        ObstacleSystem.init(LevelSystem.getLevelConfig());
        ItemSystem.init(LevelSystem.getLevelConfig());

        if (state.heldItem) {
            const config = GameConfig.ITEMS[state.heldItem];
            if (config) {
                ItemSystem.heldItem = {
                    id: 'saved_item',
                    type: state.heldItem,
                    config
                };
            }
        }

        return true;
    },

    resumeSavedGame() {
        if (this.loadGameState()) {
            const now = Date.now();
            if (this.state.startTime > 0) {
                const elapsed = now - this.state.startTime;
                if (elapsed > this.state.elapsedTime) {
                    this.state.startTime = now - this.state.elapsedTime;
                }
            } else {
                this.state.startTime = now - this.state.elapsedTime;
            }
            this.showScreen('game-screen');
            this.state.status = 'playing';
            this.lastTime = performance.now();
            this.gameLoop();
            return true;
        }
        return false;
    }
};