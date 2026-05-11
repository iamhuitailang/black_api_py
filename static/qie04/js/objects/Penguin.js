export class Penguin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 25;
        this.maxLives = 3;
        this.lives = this.maxLives;
        this.hasShield = false;
        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.items = {
            magnet: 0,
            claw: 0,
            shield: 0,
            rocket: 0
        };
        this.isBoosted = false;
        this.boostTimer = 0;
        this.lastCheckpoint = { x, y };
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hasShield = false;
        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.isBoosted = false;
        this.boostTimer = 0;
        this.lastCheckpoint = { x, y };
    }

    setCheckpoint(x, y) {
        this.lastCheckpoint = { x, y };
    }

    respawnAtCheckpoint() {
        this.x = this.lastCheckpoint.x;
        this.y = this.lastCheckpoint.y;
        this.vx = 0;
        this.vy = 0;
        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.isBoosted = false;
        this.boostTimer = 0;
    }

    loseLife() {
        if (this.hasShield) {
            this.hasShield = false;
            this.respawnAtCheckpoint();
            return false;
        }
        
        this.lives--;
        this.respawnAtCheckpoint();
        return this.lives <= 0;
    }

    addLife() {
        if (this.lives < this.maxLives) {
            this.lives++;
        }
    }

    addItem(type) {
        this.items[type]++;
    }

    useItem(type) {
        if (this.items[type] <= 0) return false;
        
        switch(type) {
            case 'magnet':
                if (!this.hasMagnet) {
                    this.hasMagnet = true;
                    this.magnetTimer = 5000;
                    this.items[type]--;
                    return true;
                }
                return false;
            case 'claw':
                this.vx = 0;
                this.vy = 0;
                this.items[type]--;
                return true;
            case 'shield':
                if (!this.hasShield) {
                    this.hasShield = true;
                    this.items[type]--;
                    return true;
                }
                return false;
            case 'rocket':
                this.isBoosted = true;
                this.boostTimer = 500;
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > 0.1) {
                    this.vx = (this.vx / speed) * 10;
                    this.vy = (this.vy / speed) * 10;
                } else {
                    this.vx = 0;
                    this.vy = -10;
                }
                this.items[type]--;
                return true;
        }
        return false;
    }

    update(deltaTime) {
        if (this.hasMagnet) {
            this.magnetTimer -= deltaTime;
            if (this.magnetTimer <= 0) {
                this.hasMagnet = false;
            }
        }
        
        if (this.isBoosted) {
            this.boostTimer -= deltaTime;
            if (this.boostTimer <= 0) {
                this.isBoosted = false;
            }
        }
    }

    getState() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            lives: this.lives,
            hasShield: this.hasShield,
            hasMagnet: this.hasMagnet,
            magnetTimer: this.magnetTimer,
            items: { ...this.items },
            isBoosted: this.isBoosted,
            boostTimer: this.boostTimer,
            lastCheckpoint: { ...this.lastCheckpoint }
        };
    }

    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.vx = state.vx;
        this.vy = state.vy;
        this.lives = state.lives;
        this.hasShield = state.hasShield;
        this.hasMagnet = state.hasMagnet;
        this.magnetTimer = state.magnetTimer;
        this.items = { ...state.items };
        this.isBoosted = state.isBoosted;
        this.boostTimer = state.boostTimer;
        this.lastCheckpoint = { ...state.lastCheckpoint };
    }
}
