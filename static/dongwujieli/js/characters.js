const CharacterSystem = {
    characters: [],
    currentIndex: 0,
    activeEffects: [],

    init(teamOrder) {
        this.characters = teamOrder.map((charId, index) => {
            const config = GameConfig.CHARACTERS[charId];
            return {
                ...config,
                index,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                stamina: config.stamina,
                maxStamina: config.stamina,
                finished: false,
                active: index === 0,
                effects: [],
                animation: {
                    frame: 0,
                    timer: 0,
                    bouncing: false
                }
            };
        });
        this.currentIndex = 0;
        this.activeEffects = [];
    },

    getCurrent() {
        return this.characters[this.currentIndex];
    },

    getAll() {
        return this.characters;
    },

    getByIndex(index) {
        return this.characters[index];
    },

    updateCurrent(deltaTime, direction) {
        const char = this.getCurrent();
        if (!char || char.finished) return;

        let speed = char.speed;
        let dx = direction.dx;
        let dy = direction.dy;

        for (const effect of this.activeEffects) {
            if (effect.type === 'speedMultiplier') {
                speed *= effect.value;
            }
            if (effect.type === 'reverseControl') {
                dx = -dx;
                dy = -dy;
            }
        }

        if (char.stamina < char.maxStamina * 0.3) {
            speed *= 0.6;
        } else if (char.stamina < char.maxStamina * 0.6) {
            speed *= 0.85;
        }

        char.vx = dx * speed;
        char.vy = dy * speed;

        const moveAmount = Math.abs(dx) + Math.abs(dy);
        if (moveAmount > 0) {
            char.stamina -= moveAmount * 0.05 * (deltaTime / 16);
            char.stamina = Math.max(0, char.stamina);

            char.animation.timer += deltaTime;
            if (char.animation.timer > 100) {
                char.animation.frame = (char.animation.frame + 1) % 4;
                char.animation.timer = 0;
            }
            char.animation.bouncing = true;
        } else {
            char.animation.bouncing = false;
        }

        this.updateEffects(deltaTime);
    },

    moveCharacter(dx, dy) {
        const char = this.getCurrent();
        if (!char || char.finished) return;

        char.x += dx;
        char.y += dy;

        char.x = Math.max(char.size, Math.min(GameConfig.CANVAS.TRACK_WIDTH - char.size, char.x));
        char.y = Math.max(char.size, Math.min(GameConfig.GAME.TRACK_LENGTH - char.size, char.y));
    },

    setPosition(x, y) {
        const char = this.getCurrent();
        if (char) {
            char.x = x;
            char.y = y;
        }
    },

    switchCharacter(manual = false) {
        const nextIndex = this.findNextCharacter();
        if (nextIndex === -1 || nextIndex === this.currentIndex) return false;

        const currentChar = this.characters[this.currentIndex];
        const targetX = currentChar.x;
        const targetY = currentChar.y;

        currentChar.active = false;
        this.currentIndex = nextIndex;
        this.characters[nextIndex].active = true;
        this.characters[nextIndex].x = targetX;
        this.characters[nextIndex].y = targetY;
        this.activeEffects = [];

        if (manual) {
            this.addEffect({
                type: 'speedMultiplier',
                value: 1.5,
                duration: 2000
            });
        }

        return true;
    },

    findNextAvailable() {
        for (let i = 0; i < this.characters.length; i++) {
            if (!this.characters[i].finished) {
                return i;
            }
        }
        return -1;
    },

    findNextCharacter() {
        for (let i = 1; i <= this.characters.length; i++) {
            const index = (this.currentIndex + i) % this.characters.length;
            if (!this.characters[index].finished) {
                return index;
            }
        }
        return -1;
    },

    finishCurrent() {
        const char = this.getCurrent();
        if (char) {
            char.finished = true;
            char.active = false;
        }

        const nextIndex = this.findNextAvailable();
        if (nextIndex !== -1) {
            this.characters[nextIndex].x = char.x;
            this.characters[nextIndex].y = char.y;
            this.currentIndex = nextIndex;
            this.characters[nextIndex].active = true;
            this.activeEffects = [];
            return true;
        }
        return false;
    },

    isAllFinished() {
        return this.characters.every(c => c.finished);
    },

    addEffect(effect) {
        const existingIndex = this.activeEffects.findIndex(e => e.type === effect.type);
        if (existingIndex !== -1) {
            this.activeEffects[existingIndex].duration = effect.duration;
        } else {
            this.activeEffects.push({
                ...effect,
                startTime: Date.now()
            });
        }
    },

    removeEffect(type) {
        this.activeEffects = this.activeEffects.filter(e => e.type !== type);
    },

    hasEffect(type) {
        return this.activeEffects.some(e => e.type === type);
    },

    getEffects() {
        return [...this.activeEffects];
    },

    updateEffects(deltaTime) {
        const now = Date.now();
        this.activeEffects = this.activeEffects.filter(effect => {
            if (effect.duration > 0) {
                return (now - effect.startTime) < effect.duration;
            }
            return true;
        });
    },

    consumeStamina(amount) {
        const char = this.getCurrent();
        if (char) {
            char.stamina = Math.max(0, char.stamina - amount);
        }
    },

    restoreStamina(amount) {
        const char = this.getCurrent();
        if (char) {
            char.stamina = Math.min(char.maxStamina, char.stamina + amount);
        }
    },

    getStaminaPercent() {
        const char = this.getCurrent();
        if (!char) return 0;
        return (char.stamina / char.maxStamina) * 100;
    },

    canPenetrate(obstacle) {
        const char = this.getCurrent();
        if (!char) return false;
        return Math.random() < char.penetration;
    },

    getPickupRange() {
        const char = this.getCurrent();
        return char ? char.pickupRange : 30;
    },

    getMagnetRange() {
        if (this.hasEffect('magnetRange')) {
            const effect = this.activeEffects.find(e => e.type === 'magnetRange');
            return effect.value;
        }
        return 0;
    }
};