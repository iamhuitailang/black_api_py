const InputManager = {
    keys: {},
    keyPressTime: {},
    paddlePressed: false,
    game: null,

    init(game) {
        this.game = game;
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    },

    handleKeyDown(e) {
        if (!this.game || this.game.state !== GameState.PLAYING) {
            if (e.key === 'Escape' && this.game && this.game.state === GameState.PAUSED) {
                this.game.resume();
            }
            return;
        }

        if (e.repeat) return;

        this.keys[e.key] = true;
        this.keyPressTime[e.key] = Date.now();

        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.game.player.changeLane(-1);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.game.player.changeLane(1);
                break;
            case ' ':
                e.preventDefault();
                this.paddlePressed = true;
                break;
            case 'Shift':
                e.preventDefault();
                const sprintUsed = this.game.player.activateSprint();
                if (sprintUsed) {
                    Renderer.drawSplash(this.game.player.x, this.game.player.y);
                    SkillSystem.showComboEffect('sprint', 0);
                }
                break;
            case 'e':
            case 'E':
                e.preventDefault();
                const shieldUsed = this.game.player.activateShield();
                if (shieldUsed) {
                    Renderer.drawSplash(this.game.player.x, this.game.player.y);
                    SkillSystem.showComboEffect('shield', 0);
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.game.pause();
                break;
        }
    },

    handleKeyUp(e) {
        if (!this.game || this.game.state !== GameState.PLAYING) return;

        this.keys[e.key] = false;

        if (e.key === ' ' && this.paddlePressed) {
            e.preventDefault();
            this.paddlePressed = false;
            
            const pressDuration = Date.now() - (this.keyPressTime[e.key] || 0);
            let paddleType;
            
            if (pressDuration < 200) {
                paddleType = GameConfig.PADDLE_TYPES.LIGHT;
            } else if (pressDuration < 400) {
                paddleType = GameConfig.PADDLE_TYPES.MEDIUM;
            } else {
                paddleType = GameConfig.PADDLE_TYPES.HEAVY;
            }

            const quality = this.game.player.getRhythmQuality();
            const result = this.game.player.paddle(paddleType, quality);
            
            SkillSystem.showComboEffect(quality, result.combo);
        }
    },

    isKeyPressed(key) {
        return !!this.keys[key];
    },

    reset() {
        this.keys = {};
        this.keyPressTime = {};
        this.paddlePressed = false;
    }
};
