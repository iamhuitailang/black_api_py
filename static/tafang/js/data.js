var Data = (function() {
    'use strict';

    var STORAGE_KEY = 'tafang_game_save';

    var DEFAULT_CONFIG = {
        level: 1,
        gold: 50,
        hp: 10,
        wave: 1,
        totalKills: 0,
        totalGoldEarned: 0,
        towers: [],
        monsters: [],
        monstersToSpawn: 0,
        spawnIndex: 0,
        isWaitingNextWave: false,
        isPaused: true,
        isStarted: false
    };

    var TOWER_CONFIG = {
        basePrice: 50,
        upgradePrice: 100,
        sellRatio: 0.5,
        level1: {
            damage: 20,
            range: 2,
            attackSpeed: 1000,
            icon: '🏰'
        },
        level2: {
            damage: 40,
            range: 3,
            attackSpeed: 800,
            icon: '🏯'
        }
    };

    var MONSTER_CONFIG = {
        baseHp: 50,
        baseSpeed: 0.8,
        goldReward: 10,
        types: {
            normal: {
                hpMultiplier: 1,
                speedMultiplier: 1,
                icon: '👾'
            },
            fast: {
                hpMultiplier: 0.8,
                speedMultiplier: 1.4,
                icon: '🦇'
            },
            tank: {
                hpMultiplier: 2,
                speedMultiplier: 0.6,
                icon: '🐢'
            }
        }
    };

    var WAVE_CONFIG = {
        minMonsters: 5,
        maxMonsters: 10,
        interval: 10000,
        spawnInterval: 800
    };

    var GAME_CONFIG = {
        gridRows: 8,
        gridCols: 12,
        path: [
            {row: 0, col: 0},
            {row: 0, col: 1},
            {row: 0, col: 2},
            {row: 0, col: 3},
            {row: 1, col: 3},
            {row: 2, col: 3},
            {row: 3, col: 3},
            {row: 3, col: 4},
            {row: 3, col: 5},
            {row: 3, col: 6},
            {row: 3, col: 7},
            {row: 4, col: 7},
            {row: 5, col: 7},
            {row: 5, col: 8},
            {row: 5, col: 9},
            {row: 5, col: 10},
            {row: 6, col: 10},
            {row: 7, col: 10},
            {row: 7, col: 11}
        ]
    };

    function getDefaultSaveData() {
        return Utils.deepClone(DEFAULT_CONFIG);
    }

    function saveGame(data) {
        try {
            var saveData = {
                level: data.level || 1,
                gold: data.gold || 50,
                hp: data.hp || 10,
                wave: data.wave || 1,
                totalKills: data.totalKills || 0,
                totalGoldEarned: data.totalGoldEarned || 0,
                towers: data.towers || [],
                monsters: data.monsters || [],
                monstersToSpawn: data.monstersToSpawn || 0,
                spawnIndex: data.spawnIndex || 0,
                isWaitingNextWave: data.isWaitingNextWave || false,
                isStarted: data.isStarted || false,
                isPaused: data.isPaused || true,
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    }

    function loadGame() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                var saveData = JSON.parse(saved);
                var merged = Utils.mergeObjects(DEFAULT_CONFIG, saveData);
                merged.isPaused = true;
                
                if (typeof saveData.isStarted !== 'undefined') {
                    merged.isStarted = saveData.isStarted;
                } else {
                    var hasGameProgress = 
                        (merged.towers && merged.towers.length > 0) || 
                        merged.wave > 1 || 
                        merged.gold !== 50 || 
                        merged.totalKills > 0 ||
                        (merged.monsters && merged.monsters.length > 0);
                    merged.isStarted = hasGameProgress;
                }
                
                return merged;
            }
        } catch (e) {
            console.error('加载游戏失败:', e);
        }
        return null;
    }

    function hasSaveData() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }

    function clearSaveData() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    }

    function getTowerConfig(level) {
        return level === 2 ? TOWER_CONFIG.level2 : TOWER_CONFIG.level1;
    }

    function getMonsterConfig(type) {
        var typeConfig = MONSTER_CONFIG.types[type] || MONSTER_CONFIG.types.normal;
        return {
            hp: Math.floor(MONSTER_CONFIG.baseHp * typeConfig.hpMultiplier),
            maxHp: Math.floor(MONSTER_CONFIG.baseHp * typeConfig.hpMultiplier),
            speed: MONSTER_CONFIG.baseSpeed * typeConfig.speedMultiplier,
            icon: typeConfig.icon,
            goldReward: MONSTER_CONFIG.goldReward
        };
    }

    function isPathCell(row, col) {
        return GAME_CONFIG.path.some(function(cell) {
            return cell.row === row && cell.col === col;
        });
    }

    function isStartCell(row, col) {
        var start = GAME_CONFIG.path[0];
        return row === start.row && col === start.col;
    }

    function isEndCell(row, col) {
        var end = GAME_CONFIG.path[GAME_CONFIG.path.length - 1];
        return row === end.row && col === end.col;
    }

    function getCellType(row, col) {
        if (isStartCell(row, col)) return 'start';
        if (isEndCell(row, col)) return 'end';
        if (isPathCell(row, col)) return 'path';
        return 'grass';
    }

    function getPathIndex(row, col) {
        for (var i = 0; i < GAME_CONFIG.path.length; i++) {
            if (GAME_CONFIG.path[i].row === row && GAME_CONFIG.path[i].col === col) {
                return i;
            }
        }
        return -1;
    }

    function getPathCell(index) {
        if (index >= 0 && index < GAME_CONFIG.path.length) {
            return GAME_CONFIG.path[index];
        }
        return null;
    }

    return {
        STORAGE_KEY: STORAGE_KEY,
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        TOWER_CONFIG: TOWER_CONFIG,
        MONSTER_CONFIG: MONSTER_CONFIG,
        WAVE_CONFIG: WAVE_CONFIG,
        GAME_CONFIG: GAME_CONFIG,
        getDefaultSaveData: getDefaultSaveData,
        saveGame: saveGame,
        loadGame: loadGame,
        hasSaveData: hasSaveData,
        clearSaveData: clearSaveData,
        getTowerConfig: getTowerConfig,
        getMonsterConfig: getMonsterConfig,
        isPathCell: isPathCell,
        isStartCell: isStartCell,
        isEndCell: isEndCell,
        getCellType: getCellType,
        getPathIndex: getPathIndex,
        getPathCell: getPathCell
    };
})();
