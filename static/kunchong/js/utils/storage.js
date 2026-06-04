const STORAGE_KEY = 'mech_bug_battle_save';

export const gameStorage = {
    save(data) {
        try {
            const existing = this.load();
            const merged = { ...existing, ...data };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (e) {
            console.error('加载游戏失败:', e);
            return this.getDefaultData();
        }
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    },

    getDefaultData() {
        return {
            playerBug: null,
            completedLevels: [],
            versusWins: { mantis: 0, bee: 0, beetle: 0 },
            navigation: {
                screen: 'menu',
                mode: null,
                levelId: null,
                opponentId: null
            },
            battleState: null
        };
    },

    saveBattleState(state) {
        return this.save({ battleState: state });
    },

    loadBattleState() {
        return this.load().battleState;
    },

    clearBattleState() {
        const data = this.load();
        data.battleState = null;
        return this.save(data);
    },

    savePlayerBug(bug) {
        return this.save({ playerBug: bug });
    },

    loadPlayerBug() {
        return this.load().playerBug;
    },

    saveCompletedLevel(levelId) {
        const data = this.load();
        if (!data.completedLevels.includes(levelId)) {
            data.completedLevels.push(levelId);
            return this.save({ completedLevels: data.completedLevels });
        }
        return false;
    },

    loadCompletedLevels() {
        return this.load().completedLevels || [];
    },

    saveVersusWin(opponentId) {
        const data = this.load();
        data.versusWins = data.versusWins || { mantis: 0, bee: 0, beetle: 0 };
        data.versusWins[opponentId] = (data.versusWins[opponentId] || 0) + 1;
        return this.save({ versusWins: data.versusWins });
    },

    loadVersusWins() {
        return this.load().versusWins || { mantis: 0, bee: 0, beetle: 0 };
    },

    saveNavigation(nav) {
        return this.save({ navigation: nav });
    },

    loadNavigation() {
        return this.load().navigation || { screen: 'menu', mode: null, levelId: null, opponentId: null };
    }
};
