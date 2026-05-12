class StorageManager {
    constructor() {
        this.saveKey = CONFIG.STORAGE.KEY;
        this.highScoreKey = CONFIG.STORAGE.HIGH_SCORE_KEY;
    }

    saveGame(gameState) {
        try {
            const saveData = {
                timestamp: Date.now(),
                score: gameState.score,
                level: gameState.level,
                lives: gameState.lives,
                highScore: gameState.highScore,
                lastExtraLifeScore: gameState.lastExtraLifeScore,
                player: {
                    x: gameState.player.x,
                    y: gameState.player.y
                },
                invaders: this.serializeInvaders(gameState.invaders),
                bunkers: this.serializeBunkers(gameState.bunkers),
                ufo: gameState.ufo ? this.serializeUFO(gameState.ufo) : null,
                playerBullets: this.serializeBullets(gameState.playerBullets),
                invaderBullets: this.serializeBullets(gameState.invaderBullets)
            };
            
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('保存游戏失败:', error);
            return false;
        }
    }

    loadGame() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) return null;
            
            return JSON.parse(savedData);
        } catch (error) {
            console.error('加载游戏失败:', error);
            return null;
        }
    }

    hasSavedGame() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    clearSave() {
        localStorage.removeItem(this.saveKey);
    }

    getHighScore() {
        try {
            const score = localStorage.getItem(this.highScoreKey);
            return score ? parseInt(score, 10) : 0;
        } catch (error) {
            console.error('获取最高分失败:', error);
            return 0;
        }
    }

    setHighScore(score) {
        try {
            const currentHighScore = this.getHighScore();
            if (score > currentHighScore) {
                localStorage.setItem(this.highScoreKey, score.toString());
                return true;
            }
            return false;
        } catch (error) {
            console.error('保存最高分失败:', error);
            return false;
        }
    }

    serializeInvaders(invaders) {
        if (!invaders || !invaders.invaders) return null;
        return {
            invaders: invaders.invaders.map(row => 
                row.map(inv => inv ? {
                    x: inv.x,
                    y: inv.y,
                    type: inv.type,
                    points: inv.points,
                    color: inv.color,
                    alive: inv.alive
                } : null)
            ),
            direction: invaders.direction,
            speed: invaders.speed,
            shootInterval: invaders.shootInterval,
            lastShot: invaders.lastShot,
            moveTimer: invaders.moveTimer
        };
    }

    deserializeInvaders(data, canvas) {
        if (!data) return null;
        const invaders = new InvaderManager(canvas, 1);
        
        if (data.invaders) {
            invaders.invaders = data.invaders.map(row =>
                row.map(inv => inv ? {
                    x: inv.x,
                    y: inv.y,
                    width: inv.width || CONFIG.INVADERS.WIDTH,
                    height: inv.height || CONFIG.INVADERS.HEIGHT,
                    type: inv.type,
                    points: inv.points,
                    color: inv.color,
                    alive: inv.alive
                } : null)
            );
        }
        
        invaders.direction = data.direction !== undefined ? data.direction : 1;
        invaders.speed = data.speed || CONFIG.INVADERS.BASE_SPEED;
        invaders.shootInterval = data.shootInterval || CONFIG.INVADERS.SHOOT_INTERVAL;
        invaders.lastShot = data.lastShot || Date.now();
        invaders.moveTimer = data.moveTimer || 0;
        invaders.animationFrame = 0;
        invaders.animationTimer = 0;
        
        return invaders;
    }

    serializeBunkers(bunkers) {
        if (!bunkers || !bunkers.bunkers) return null;
        return bunkers.bunkers.map(bunker => ({
            x: bunker.x,
            y: bunker.y,
            width: bunker.width,
            height: bunker.height,
            damage: bunker.damage,
            sections: bunker.sections
        }));
    }

    deserializeBunkers(data, canvas) {
        if (!data) return null;
        const bunkers = new BunkerManager(canvas);
        
        if (data && data.length > 0) {
            bunkers.bunkers = data.map(b => ({
                x: b.x,
                y: b.y,
                width: b.width || CONFIG.BUNKERS.WIDTH,
                height: b.height || CONFIG.BUNKERS.HEIGHT,
                damage: b.damage || 0,
                sections: b.sections || []
            }));
        }
        
        return bunkers;
    }

    serializeUFO(ufo) {
        if (!ufo) return null;
        return {
            x: ufo.x,
            y: ufo.y,
            width: ufo.width,
            height: ufo.height,
            active: ufo.active,
            direction: ufo.direction,
            points: ufo.points,
            spawnTimer: ufo.spawnTimer,
            animationOffset: ufo.animationOffset
        };
    }

    deserializeUFO(data, canvas) {
        if (!data) return null;
        const ufo = new UFO(canvas);
        ufo.x = data.x || 0;
        ufo.y = data.y || 50;
        ufo.width = data.width || CONFIG.UFO.WIDTH;
        ufo.height = data.height || CONFIG.UFO.HEIGHT;
        ufo.active = data.active || false;
        ufo.direction = data.direction !== undefined ? data.direction : 1;
        ufo.points = data.points || 0;
        ufo.spawnTimer = data.spawnTimer || 0;
        ufo.animationOffset = data.animationOffset || 0;
        return ufo;
    }

    serializeBullets(bullets) {
        if (!bullets || !bullets.bullets) return null;
        return bullets.bullets.map(bullet => ({
            x: bullet.x,
            y: bullet.y,
            width: bullet.width,
            height: bullet.height,
            speed: bullet.speed,
            color: bullet.color,
            isPlayer: bullet.isPlayer
        }));
    }

    deserializeBullets(data) {
        if (!data) return null;
        const bullets = new BulletManager();
        bullets.bullets = data.map(b => ({
            x: b.x,
            y: b.y,
            width: b.width || 4,
            height: b.height || 15,
            speed: b.speed,
            color: b.color,
            isPlayer: b.isPlayer !== undefined ? b.isPlayer : true
        }));
        return bullets;
    }
}

const storageManager = new StorageManager();