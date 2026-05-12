const Storage = {
    STORAGE_KEY: 'element_duel_save',

    getDefaultSave: function() {
        return {
            version: 1,
            player: {
                gold: 0,
                level: 1,
                exp: 0,
                selectedMage: null,
                unlockedMages: ['fire_mage', 'water_mage'],
                spellLevels: {
                    fireball: 1,
                    flame_storm: 1,
                    water_arrow: 1,
                    healing_rain: 1,
                    lightning_chain: 1,
                    thunder_storm: 1,
                    rock_throw: 1,
                    earth_shield: 1
                }
            },
            battle: null,
            currentScreen: 'main_menu',
            battleLog: []
        };
    },

    save: function(gameState) {
        try {
            const saveData = JSON.stringify(gameState);
            localStorage.setItem(this.STORAGE_KEY, saveData);
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    },

    load: function() {
        try {
            const saveData = localStorage.getItem(this.STORAGE_KEY);
            if (saveData) {
                const parsed = JSON.parse(saveData);
                return this.migrateSave(parsed);
            }
        } catch (e) {
            console.error('加载游戏失败:', e);
        }
        return this.getDefaultSave();
    },

    migrateSave: function(saveData) {
        const defaultSave = this.getDefaultSave();
        
        if (!saveData.version || saveData.version < defaultSave.version) {
            saveData = this.deepMerge(defaultSave, saveData);
            saveData.version = defaultSave.version;
        }
        
        return saveData;
    },

    deepMerge: function(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    },

    clear: function() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    savePlayer: function(playerData) {
        const save = this.load();
        save.player = { ...save.player, ...playerData };
        return this.save(save);
    },

    saveBattle: function(battleData) {
        const save = this.load();
        save.battle = battleData;
        return this.save(save);
    },

    saveScreen: function(screenName) {
        const save = this.load();
        save.currentScreen = screenName;
        return this.save(save);
    },

    saveBattleLog: function(log) {
        const save = this.load();
        save.battleLog = log;
        return this.save(save);
    }
};