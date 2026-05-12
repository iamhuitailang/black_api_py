class StorageManager {
    constructor() {
        this.key = CONFIG.STORAGE_KEY;
    }

    save(gameState) {
        try {
            const data = {
                timestamp: Date.now(),
                player: {
                    x: gameState.player.x,
                    y: gameState.player.y,
                    health: gameState.player.health,
                    soul: gameState.player.soul,
                    attack: gameState.player.attack,
                    speed: gameState.player.speed,
                    jumpPower: gameState.player.jumpPower,
                    facingRight: gameState.player.facingRight,
                    abilities: gameState.player.abilities
                },
                currentScene: gameState.currentScene,
                dreamEssence: gameState.dreamEssence,
                defeatedBosses: gameState.defeatedBosses,
                lastCheckpoint: gameState.lastCheckpoint,
                unlockedAreas: gameState.unlockedAreas,
                collectedItems: gameState.collectedItems || {},
                collectedAbilities: gameState.collectedAbilities || []
            };
            localStorage.setItem(this.key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    }

    hasSave() {
        return localStorage.getItem(this.key) !== null;
    }

    clear() {
        localStorage.removeItem(this.key);
    }

    getDefaultState() {
        return {
            player: {
                x: 100,
                y: 300,
                health: CONFIG.PLAYER.INITIAL_HEALTH,
                soul: CONFIG.PLAYER.INITIAL_SOUL,
                attack: CONFIG.PLAYER.INITIAL_ATTACK,
                speed: CONFIG.PLAYER.INITIAL_SPEED,
                jumpPower: CONFIG.PLAYER.INITIAL_JUMP,
                facingRight: true,
                abilities: {
                    nail: true,
                    spell: false,
                    dash: false,
                    wallClimb: false,
                    shadowDash: false
                }
            },
            currentScene: 'nest_entrance',
            dreamEssence: 0,
            defeatedBosses: [],
            lastCheckpoint: { scene: 'nest_entrance', x: 100, y: 300 },
            unlockedAreas: ['nest_entrance'],
            collectedItems: {},
            collectedAbilities: []
        };
    }
}