const GameStorage = {
    saveState(gameState) {
        try {
            const stateToSave = {
                playerGold: gameState.player.gold,
                playerHp: gameState.player.baseHp,
                enemyGold: gameState.enemy.gold,
                enemyHp: gameState.enemy.baseHp,
                towerOwner: gameState.tower.owner,
                towerHp: gameState.tower.hp,
                units: this.serializeUnits(gameState.units),
                gameTime: gameState.gameTime,
                isPaused: gameState.isPaused,
                isGameOver: gameState.isGameOver,
                winner: gameState.winner,
                timestamp: Date.now()
            };
            localStorage.setItem(GameData.STORAGE_KEY, JSON.stringify(stateToSave));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    loadState() {
        try {
            const saved = localStorage.getItem(GameData.STORAGE_KEY);
            if (!saved) return null;
            
            const state = JSON.parse(saved);
            
            if (!state.timestamp || Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
                this.clearState();
                return null;
            }
            
            return state;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },

    hasSavedState() {
        return this.loadState() !== null;
    },

    clearState() {
        localStorage.removeItem(GameData.STORAGE_KEY);
    },

    serializeUnits(units) {
        return units.map(unit => ({
            type: unit.type,
            team: unit.team,
            x: unit.x,
            y: unit.y,
            hp: unit.hp,
            maxHp: unit.maxHp,
            targetX: unit.targetX,
            attackCooldown: unit.attackCooldown
        }));
    },

    deserializeUnits(serializedUnits) {
        if (!serializedUnits || serializedUnits.length === 0) return [];
        return serializedUnits.map(data => {
            const unit = new Unit(data.type, data.team, data.x, data.y);
            unit.hp = data.hp;
            unit.maxHp = data.maxHp;
            unit.targetX = data.targetX;
            unit.attackCooldown = data.attackCooldown || 0;
            return unit;
        });
    }
};