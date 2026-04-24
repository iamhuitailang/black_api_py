const Storage = {
    STORAGE_KEY: 'starShooter_gameState',
    
    save(game) {
        const state = {
            score: game.score,
            lives: game.lives,
            level: game.level,
            wave: game.wave,
            isPlaying: game.isPlaying,
            isPaused: game.isPaused,
            playerX: game.player ? game.player.x : null,
            playerY: game.player ? game.player.y : null,
            hasShield: game.player ? game.player.hasShield : false,
            shieldTimer: game.player ? game.player.shieldTimer : 0,
            hasDoubleBullet: game.player ? game.player.hasDoubleBullet : false,
            doubleBulletTimer: game.player ? game.player.doubleBulletTimer : 0,
            enemies: game.enemies && game.enemies.enemies ? game.enemies.enemies.map(e => ({
                x: e.x,
                y: e.y,
                type: e.type,
                health: e.health,
                maxHealth: e.maxHealth,
                angle: e.angle,
                isBoss: e.isBoss
            })) : [],
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save game state:', e);
        }
    },
    
    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const state = JSON.parse(data);
                if (state.isPlaying && !state.isPaused) {
                    return state;
                }
            }
        } catch (e) {
            console.warn('Failed to load game state:', e);
        }
        return null;
    },
    
    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear game state:', e);
        }
    },
    
    hasSavedGame() {
        const state = this.load();
        return state !== null;
    }
};
