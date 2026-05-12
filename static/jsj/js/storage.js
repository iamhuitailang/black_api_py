class Storage {
    static save(data) {
        try {
            const saveData = {
                timestamp: Date.now(),
                ...data
            };
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    static load() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (data) {
                const saveData = JSON.parse(data);
                return saveData;
            }
        } catch (e) {
            console.error('Load failed:', e);
        }
        return null;
    }

    static clear() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Clear failed:', e);
            return false;
        }
    }

    static saveGameState(gameState) {
        const data = {
            gameState: {
                score: gameState.score,
                wave: gameState.wave,
                kills: gameState.kills,
                highScore: gameState.highScore,
                comboCount: gameState.comboCount
            },
            player: {
                x: gameState.player.x,
                y: gameState.player.y,
                health: gameState.player.health,
                maxHealth: gameState.player.maxHealth,
                currentWeapon: gameState.player.currentWeapon
            },
            weapons: gameState.player.weapons ? gameState.player.weapons.map(w => ({
                name: w.name,
                ammo: w.ammo,
                isReloading: w.isReloading
            })) : [],
            zombies: gameState.zombies ? gameState.zombies.map(z => ({
                x: z.x,
                y: z.y,
                type: z.type,
                health: z.health,
                maxHealth: z.maxHealth
            })) : [],
            items: gameState.items ? gameState.items.map(i => ({
                x: i.x,
                y: i.y,
                type: i.type
            })) : [],
            bullets: gameState.bullets ? gameState.bullets.map(b => ({
                x: b.x,
                y: b.y,
                vx: b.vx,
                vy: b.vy,
                damage: b.damage
            })) : [],
            buffs: gameState.player.buffs || []
        };
        return this.save(data);
    }

    static loadGameState() {
        const data = this.load();
        if (data && data.gameState) {
            return data;
        }
        return null;
    }

    static hasSavedGame() {
        const data = this.load();
        return data && data.gameState && Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
    }

    static saveHighScore(score) {
        const data = this.load() || {};
        data.highScore = Math.max(data.highScore || 0, score);
        return this.save(data);
    }

    static getHighScore() {
        const data = this.load();
        return data ? (data.highScore || 0) : 0;
    }
}
