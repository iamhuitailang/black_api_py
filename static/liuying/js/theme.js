const ThemeManager = (function() {
    let currentTheme = 'laundry';
    let unlockedThemes = ['laundry', 'sakura', 'industrial', 'christmas'];

    const themes = {
        laundry: {
            name: '清新洗衣房',
            icon: '🧼'
        },
        sakura: {
            name: '樱花洗衣店',
            icon: '🌸'
        },
        industrial: {
            name: '工业洗衣坊',
            icon: '🏭'
        },
        christmas: {
            name: '圣诞特别',
            icon: '🎄'
        }
    };

    function init() {
        const savedSettings = Storage.loadSettings();
        unlockedThemes = savedSettings.unlockedThemes || ['laundry', 'sakura', 'industrial', 'christmas'];
        currentTheme = savedSettings.theme || 'laundry';
        applyTheme(currentTheme);
    }

    function setTheme(themeName) {
        if (!themes[themeName]) {
            console.warn('主题不存在:', themeName);
            return false;
        }
        if (!unlockedThemes.includes(themeName)) {
            console.warn('主题未解锁:', themeName);
            return false;
        }
        
        currentTheme = themeName;
        applyTheme(themeName);
        
        const savedSettings = Storage.loadSettings();
        savedSettings.theme = themeName;
        Storage.saveSettings(savedSettings);
        
        console.log('主题已切换为:', themeName);
        return true;
    }

    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        console.log('应用主题CSS类:', `theme-${themeName}`);
    }

    function unlockTheme(themeName) {
        if (!unlockedThemes.includes(themeName)) {
            unlockedThemes.push(themeName);
            const savedSettings = Storage.loadSettings();
            savedSettings.unlockedThemes = unlockedThemes;
            Storage.saveSettings(savedSettings);
            return true;
        }
        return false;
    }

    function isThemeUnlocked(themeName) {
        return unlockedThemes.includes(themeName);
    }

    function getCurrentTheme() {
        return currentTheme;
    }

    function getAllThemes() {
        return Object.entries(themes).map(([key, value]) => ({
            ...value,
            key,
            unlocked: unlockedThemes.includes(key)
        }));
    }

    function getUnlockCondition(themeName) {
        const conditions = {
            sakura: '正确分类100件衣物解锁',
            industrial: '达到第5关解锁',
            christmas: '圣诞节期间自动解锁'
        };
        return conditions[themeName] || '';
    }

    return {
        init,
        setTheme,
        unlockTheme,
        isThemeUnlocked,
        getCurrentTheme,
        getAllThemes,
        getUnlockCondition
    };
})();
