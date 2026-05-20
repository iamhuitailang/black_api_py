const Storage = {
    KEY: 'tiaogao_game_save',

    defaultData() {
        return {
            highScore: 0,
            selectedCharacter: 'walker',
            selectedScene: 'mountain',
            inventory: {
                balance_beam: 3,
                wind_cloak: 2,
                calm_pill: 2,
                safety_rope: 1
            },
            unlockedCharacters: ['walker'],
            gameState: null
        };
    },

    load() {
        try {
            const data = localStorage.getItem(this.KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load game data:', e);
        }
        return this.defaultData();
    },

    save(data) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save game data:', e);
        }
    },

    getHighScore() {
        const data = this.load();
        return data.highScore || 0;
    },

    setHighScore(score) {
        const data = this.load();
        if (score > data.highScore) {
            data.highScore = score;
            this.save(data);
            return true;
        }
        return false;
    },

    getSelectedCharacter() {
        const data = this.load();
        return data.selectedCharacter || 'walker';
    },

    setSelectedCharacter(charId) {
        const data = this.load();
        data.selectedCharacter = charId;
        this.save(data);
    },

    getSelectedScene() {
        const data = this.load();
        return data.selectedScene || 'mountain';
    },

    setSelectedScene(sceneId) {
        const data = this.load();
        data.selectedScene = sceneId;
        this.save(data);
    },

    getInventory() {
        const data = this.load();
        return data.inventory || this.defaultData().inventory;
    },

    updateInventory(itemId, count) {
        const data = this.load();
        if (!data.inventory) {
            data.inventory = this.defaultData().inventory;
        }
        data.inventory[itemId] = Math.max(0, (data.inventory[itemId] || 0) + count);
        this.save(data);
    },

    useItem(itemId) {
        const inventory = this.getInventory();
        if (inventory[itemId] > 0) {
            this.updateInventory(itemId, -1);
            return true;
        }
        return false;
    },

    saveGameState(state) {
        const data = this.load();
        data.gameState = state;
        this.save(data);
    },

    loadGameState() {
        const data = this.load();
        return data.gameState;
    },

    clearGameState() {
        const data = this.load();
        data.gameState = null;
        this.save(data);
    }
};
