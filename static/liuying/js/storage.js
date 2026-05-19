const Storage = (function() {
    const STORAGE_KEY = 'liuying_laundry_master_data';
    const SETTINGS_KEY = 'liuying_laundry_master_settings';

    const defaultGameState = {
        score: 0,
        combo: 0,
        maxCombo: 0,
        lives: 3,
        level: 1,
        mode: 'level',
        dimension: 'color',
        currentClothesId: null,
        usedClothesIds: [],
        correctCount: 0,
        wrongCount: 0,
        timeLeft: 60,
        isPlaying: false,
        clothesAnswered: 0,
        levelClothesCount: 10
    };

    const defaultSettings = {
        sound: {
            correct: true,
            wrong: true,
            combo: true,
            bgm: false
        },
        theme: 'laundry',
        unlockedThemes: ['laundry', 'sakura', 'industrial', 'christmas'],
        highestLevel: 5,
        totalCorrect: 0,
        totalWrong: 0,
        totalGames: 0
    };

    function saveGameState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            console.log('游戏状态已保存:', state);
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    }

    function loadGameState() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            console.log('从localStorage加载游戏状态:', data);
            if (data) {
                const parsed = JSON.parse(data);
                console.log('解析后的游戏状态:', parsed);
                return { ...defaultGameState, ...parsed };
            }
            console.log('没有保存的游戏状态，使用默认值');
            return { ...defaultGameState };
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return { ...defaultGameState };
        }
    }

    function clearGameState() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            console.log('设置已保存:', settings);
            return true;
        } catch (e) {
            console.error('保存设置失败:', e);
            return false;
        }
    }

    function loadSettings() {
        try {
            const data = localStorage.getItem(SETTINGS_KEY);
            console.log('从localStorage加载设置:', data);
            if (data) {
                const parsed = JSON.parse(data);
                console.log('解析后的设置:', parsed);
                return { ...defaultSettings, ...parsed };
            }
            console.log('没有保存的设置，使用默认值');
            return { ...defaultSettings };
        } catch (e) {
            console.error('加载设置失败:', e);
            return { ...defaultSettings };
        }
    }

    function updateHighestLevel(level) {
        const settings = loadSettings();
        if (level > settings.highestLevel) {
            settings.highestLevel = level;
            saveSettings(settings);
            return true;
        }
        return false;
    }

    function updateStats(correct, wrong) {
        const settings = loadSettings();
        settings.totalCorrect += correct;
        settings.totalWrong += wrong;
        settings.totalGames += 1;
        saveSettings(settings);
    }

    function unlockTheme(themeName) {
        const settings = loadSettings();
        if (!settings.unlockedThemes.includes(themeName)) {
            settings.unlockedThemes.push(themeName);
            saveSettings(settings);
            return true;
        }
        return false;
    }

    function checkThemeUnlocks() {
        const settings = loadSettings();
        const unlocks = [];

        if (settings.totalCorrect >= 100 && !settings.unlockedThemes.includes('sakura')) {
            unlockTheme('sakura');
            unlocks.push('sakura');
        }

        if (settings.highestLevel >= 5 && !settings.unlockedThemes.includes('industrial')) {
            unlockTheme('industrial');
            unlocks.push('industrial');
        }

        const now = new Date();
        if (now.getMonth() === 11 && now.getDate() >= 20 && !settings.unlockedThemes.includes('christmas')) {
            unlockTheme('christmas');
            unlocks.push('christmas');
        }

        return unlocks;
    }

    function resetAll() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
    }

    return {
        saveGameState,
        loadGameState,
        clearGameState,
        saveSettings,
        loadSettings,
        updateHighestLevel,
        updateStats,
        unlockTheme,
        checkThemeUnlocks,
        resetAll,
        defaultGameState,
        defaultSettings
    };
})();
