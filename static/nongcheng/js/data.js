const DataManager = (function() {
    const STORAGE_KEY = 'nongcheng_game_data';
    
    const CROPS = [
        {
            id: 'carrot',
            emoji: '🥕',
            name: '胡萝卜',
            seedPrice: 20,
            growTime: 5 * 60 * 1000,
            sellPrice: 40,
            exp: 5,
            levelRequired: 1
        },
        {
            id: 'lettuce',
            emoji: '🥬',
            name: '生菜',
            seedPrice: 30,
            growTime: 8 * 60 * 1000,
            sellPrice: 60,
            exp: 8,
            levelRequired: 1
        },
        {
            id: 'tomato',
            emoji: '🍅',
            name: '番茄',
            seedPrice: 50,
            growTime: 15 * 60 * 1000,
            sellPrice: 100,
            exp: 12,
            levelRequired: 2
        },
        {
            id: 'corn',
            emoji: '🌽',
            name: '玉米',
            seedPrice: 80,
            growTime: 25 * 60 * 1000,
            sellPrice: 160,
            exp: 18,
            levelRequired: 3
        },
        {
            id: 'potato',
            emoji: '🥔',
            name: '土豆',
            seedPrice: 60,
            growTime: 20 * 60 * 1000,
            sellPrice: 120,
            exp: 15,
            levelRequired: 2
        },
        {
            id: 'strawberry',
            emoji: '🍓',
            name: '草莓',
            seedPrice: 120,
            growTime: 40 * 60 * 1000,
            sellPrice: 240,
            exp: 25,
            levelRequired: 4
        },
        {
            id: 'pumpkin',
            emoji: '🎃',
            name: '南瓜',
            seedPrice: 150,
            growTime: 60 * 60 * 1000,
            sellPrice: 300,
            exp: 30,
            levelRequired: 5
        }
    ];

    const LEVEL_EXP = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

    const FERTILIZER_COST = 50;

    function getDefaultGameData() {
        return {
            player: {
                gold: 500,
                level: 1,
                exp: 0
            },
            plots: Array(6).fill(null).map(() => createDefaultPlot()),
            inventory: {},
            warehouse: {}
        };
    }

    function isValidPlot(plot) {
        return plot && 
               typeof plot === 'object' && 
               !Array.isArray(plot) &&
               ('cropId' in plot || 'plantedAt' in plot);
    }

    function createDefaultPlot() {
        return {
            cropId: null,
            plantedAt: null,
            wateredAt: null,
            fertilizedAt: null
        };
    }

    function migrateGameData(data) {
        if (!data) {
            return getDefaultGameData();
        }

        if (!data.plots || !Array.isArray(data.plots)) {
            data.plots = [];
        }

        const newPlots = [];
        for (let i = 0; i < 6; i++) {
            if (i < data.plots.length && isValidPlot(data.plots[i])) {
                const plot = data.plots[i];
                newPlots.push({
                    cropId: plot.cropId || null,
                    plantedAt: plot.plantedAt || null,
                    wateredAt: plot.wateredAt || null,
                    fertilizedAt: plot.fertilizedAt || null
                });
            } else {
                newPlots.push(createDefaultPlot());
            }
        }
        data.plots = newPlots;

        if (!data.player) {
            data.player = {
                gold: 500,
                level: 1,
                exp: 0
            };
        } else {
            if (typeof data.player.gold !== 'number') {
                data.player.gold = 500;
            }
            if (typeof data.player.level !== 'number') {
                data.player.level = 1;
            }
            if (typeof data.player.exp !== 'number') {
                data.player.exp = 0;
            }
        }

        if (!data.inventory || typeof data.inventory !== 'object') {
            data.inventory = {};
        }

        if (!data.warehouse || typeof data.warehouse !== 'object') {
            data.warehouse = {};
        }

        return data;
    }

    function loadGameData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsedData = JSON.parse(data);
                return migrateGameData(parsedData);
            }
        } catch (e) {
            console.error('加载游戏数据失败:', e);
        }
        return getDefaultGameData();
    }

    function saveGameData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('保存游戏数据失败:', e);
        }
    }

    function getCropById(id) {
        return CROPS.find(crop => crop.id === id);
    }

    function getAllCrops() {
        return [...CROPS];
    }

    function getExpForLevel(level) {
        if (level >= LEVEL_EXP.length) {
            return LEVEL_EXP[LEVEL_EXP.length - 1] + (level - LEVEL_EXP.length + 1) * 1000;
        }
        return LEVEL_EXP[level];
    }

    function getGrowthStage(crop, plantedAt, wateredAt, fertilizedAt) {
        if (!crop || !plantedAt) return null;
        
        const now = Date.now();
        let elapsed = now - plantedAt;
        
        let speedMultiplier = 1;
        
        if (wateredAt && (now - wateredAt < 10 * 60 * 1000)) {
            speedMultiplier *= 1.5;
        }
        
        if (fertilizedAt) {
            speedMultiplier *= 2;
        }
        
        const effectiveElapsed = elapsed * speedMultiplier;
        const progress = Math.min(effectiveElapsed / crop.growTime, 1);
        
        let stage;
        if (progress < 0.25) {
            stage = 'seed';
        } else if (progress < 0.7) {
            stage = 'seedling';
        } else {
            stage = 'mature';
        }
        
        return {
            stage,
            progress,
            isMature: progress >= 1,
            waterBoostActive: wateredAt && (now - wateredAt < 10 * 60 * 1000),
            fertilizerActive: !!fertilizedAt,
            remainingTime: Math.max(0, crop.growTime - effectiveElapsed) / speedMultiplier
        };
    }

    return {
        STORAGE_KEY,
        CROPS,
        LEVEL_EXP,
        FERTILIZER_COST,
        getDefaultGameData,
        loadGameData,
        saveGameData,
        getCropById,
        getAllCrops,
        getExpForLevel,
        getGrowthStage
    };
})();
