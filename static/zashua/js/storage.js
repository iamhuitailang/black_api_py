const StorageManager = {
    saveState(state) {
        try {
            const serialized = JSON.stringify(state);
            localStorage.setItem(GameConfig.STORAGE_KEY, serialized);
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },
    
    loadState() {
        try {
            const serialized = localStorage.getItem(GameConfig.STORAGE_KEY);
            if (!serialized) return null;
            return JSON.parse(serialized);
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },
    
    clearState() {
        try {
            localStorage.removeItem(GameConfig.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },
    
    hasSavedState() {
        try {
            return localStorage.getItem(GameConfig.STORAGE_KEY) !== null;
        } catch (e) {
            return false;
        }
    },
    
    buildGameState(game) {
        return {
            version: 1,
            timestamp: Date.now(),
            players: game.players.map(p => this.serializePlayer(p)),
            items: game.items.map(item => this.serializeItem(item)).filter(i => i),
            buffs: game.buffs || [],
            score: game.score || {},
            round: game.round || 1,
            elapsedTime: game.elapsedTime || 0,
            isPaused: false,
            isGameOver: false,
            theme: game.theme || 'hell',
            currentTurn: game.currentTurn || 0,
            currentThrower: game.currentThrower || null,
            itemSpeedMultiplier: game.itemSpeedMultiplier || 1,
            isInvincible: game.isInvincible || false,
            particles: []
        };
    },
    
    serializePlayer(player) {
        return {
            id: player.id,
            name: player.name,
            type: player.type,
            isAI: player.isAI,
            hp: player.hp,
            maxHp: player.maxHp,
            score: player.score,
            x: player.x,
            y: player.y,
            isStunned: player.isStunned,
            stunEndTime: player.stunEndTime,
            isEliminated: player.isEliminated,
            skillCooldownEnd: player.skillCooldownEnd,
            hasShield: player.hasShield,
            position: player.position,
            targetX: player.targetX,
            throwSpeed: player.throwSpeed,
            catchTolerance: player.catchTolerance,
            skillCooldown: player.skillCooldown,
            errorResistance: player.errorResistance,
            emoji: player.emoji,
            skillName: player.skillName,
            skillDesc: player.skillDesc
        };
    },
    
    serializeItem(item) {
        if (!item || !item.isActive) return null;
        return {
            id: item.id,
            configId: item.config.id,
            x: item.x,
            y: item.y,
            vx: item.vx,
            vy: item.vy,
            fromPlayer: item.fromPlayer,
            toPlayer: item.toPlayer,
            isActive: item.isActive,
            rotation: item.rotation || 0
        };
    },
    
    restoreGameState(state, game) {
        if (!state || state.version !== 1) return false;
        
        try {
            game.players = state.players.map(p => this.deserializePlayer(p));
            game.items = (state.items || []).map(i => this.deserializeItem(i)).filter(i => i);
            game.buffs = state.buffs || [];
            game.score = state.score || {};
            game.round = state.round || 1;
            game.elapsedTime = state.elapsedTime || 0;
            game.isPaused = false;
            game.isGameOver = false;
            game.theme = state.theme || 'hell';
            game.currentTurn = state.currentTurn || 0;
            game.currentThrower = state.currentThrower || null;
            game.itemSpeedMultiplier = state.itemSpeedMultiplier || 1;
            game.isInvincible = state.isInvincible || false;
            game.throwCooldown = 0;
            game.hasShield = false;
            
            if (!game.currentThrower) {
                const firstAlive = game.players.find(p => !p.isEliminated);
                if (firstAlive) {
                    game.currentThrower = firstAlive.id;
                }
            }
            
            game.players.forEach(p => {
                p.zoneWidth = game.canvas.width / game.players.length;
            });
            
            return true;
        } catch (e) {
            console.error('恢复游戏状态失败:', e);
            return false;
        }
    },
    
    deserializePlayer(data) {
        const config = GameConfig.CHARACTERS[data.type];
        if (!config) return null;
        
        const player = new Player(data.type, data.isAI);
        player.id = data.id;
        player.name = data.name;
        player.hp = data.hp;
        player.maxHp = data.maxHp;
        player.score = data.score;
        player.x = data.x;
        player.y = data.y;
        player.isStunned = data.isStunned;
        player.stunEndTime = data.stunEndTime;
        player.isEliminated = data.isEliminated;
        player.skillCooldownEnd = data.skillCooldownEnd || 0;
        player.hasShield = data.hasShield || false;
        player.position = data.position;
        player.targetX = data.targetX || data.x;
        player.throwSpeed = data.throwSpeed || config.throwSpeed;
        player.catchTolerance = data.catchTolerance || config.catchTolerance;
        player.skillCooldown = data.skillCooldown || config.skillCooldown;
        player.errorResistance = data.errorResistance || config.errorResistance;
        player.emoji = data.emoji || config.emoji;
        player.skillName = data.skillName || config.skillName;
        player.skillDesc = data.skillDesc || config.skillDesc;
        
        return player;
    },
    
    deserializeItem(data) {
        if (!data || !data.isActive) return null;
        
        const allItems = [
            ...GameConfig.NORMAL_ITEMS,
            ...GameConfig.DANGER_ITEMS,
            ...GameConfig.BUFF_ITEMS
        ];
        const config = allItems.find(i => i.id === data.configId);
        if (!config) return null;
        
        const item = new Item(config);
        item.id = data.id;
        item.x = data.x;
        item.y = data.y;
        item.vx = data.vx;
        item.vy = data.vy;
        item.fromPlayer = data.fromPlayer;
        item.toPlayer = data.toPlayer;
        item.isActive = data.isActive;
        item.rotation = data.rotation || 0;
        return item;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}