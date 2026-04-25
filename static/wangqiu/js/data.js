var Data = (function() {
    'use strict';

    var STORAGE_KEY = 'mini_tennis_save';

    var DEFAULT_CONFIG = {
        isStarted: false,
        isPaused: true,
        isGameOver: false,
        startTime: 0,
        elapsedTime: 0,
        playerScore: 0,
        opponentScore: 0,
        playerGames: 0,
        opponentGames: 0,
        playerSets: 0,
        opponentSets: 0,
        currentServer: 'player',
        rallyCount: 0,
        lastHitBy: null,
        ball: {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 12,
            isActive: false,
            expression: 'normal',
            lastNetTouch: 0
        },
        player: {
            x: 0,
            y: 0,
            radius: 25,
            racketSize: 45,
            targetX: 0,
            isCharging: false,
            chargeTime: 0,
            maxChargeTime: 1000,
            lastHitTime: 0,
            swingAnim: 0,
            isSwinging: false
        },
        opponent: {
            x: 0,
            y: 0,
            radius: 25,
            racketSize: 45,
            type: 'robot',
            targetX: 0,
            reactionTime: 300,
            lastHitTime: 0,
            swingAnim: 0,
            isSwinging: false
        },
        effects: {
            smashes: [],
            netWarnings: [],
            perfectHits: []
        }
    };

    var OPPONENT_TYPES = {
        robot: {
            name: '机器人',
            emoji: '🤖',
            speed: 3,
            accuracy: 0.6,
            reactionTime: 300,
            color: '#667eea'
        },
        cat: {
            name: '新手猫咪',
            emoji: '🐱',
            speed: 2.5,
            accuracy: 0.4,
            reactionTime: 500,
            color: '#f093fb'
        },
        dog: {
            name: '狗狗教练',
            emoji: '🐕',
            speed: 3.5,
            accuracy: 0.8,
            reactionTime: 200,
            color: '#4facfe'
        }
    };

    var COURT_CONFIG = {
        width: 600,
        height: 400,
        netHeight: 8,
        netY: 200,
        playerAreaStart: 200,
        playerAreaEnd: 400,
        opponentAreaStart: 0,
        opponentAreaEnd: 200,
        leftBoundary: 80,
        rightBoundary: 520,
        topBoundary: 20,
        bottomBoundary: 380
    };

    var GAME_RULES = {
        pointsToWinGame: 4,
        gamesToWinSet: 2,
        ballSpeed: 5,
        maxBallSpeed: 12,
        perfectHitSpeedMultiplier: 1.5,
        smashSpeedMultiplier: 2,
        hitWindow: 30,
        perfectHitWindow: 10,
        gravity: 0.15
    };

    var COLORS = {
        court: '#1B5E20',
        courtLight: '#2E7D32',
        courtLine: '#FFFFFF',
        net: '#FFFFFF',
        netPost: '#424242',
        ball: '#FFEB3B',
        ballOutline: '#F9A825',
        player: '#FF7043',
        playerOutline: '#E64A19',
        opponent: '#42A5F5',
        opponentOutline: '#1E88E5',
        racket: '#9E9E9E',
        racketString: '#FAFAFA',
        background: '#1A237E',
        text: '#FFFFFF'
    };

    function getDefaultSaveData() {
        return Utils.deepClone(DEFAULT_CONFIG);
    }

    function saveGame(data) {
        try {
            var saveData = {
                isStarted: data.isStarted || false,
                isPaused: data.isPaused || true,
                isGameOver: data.isGameOver || false,
                startTime: data.startTime || 0,
                elapsedTime: data.elapsedTime || 0,
                playerScore: data.playerScore || 0,
                opponentScore: data.opponentScore || 0,
                playerGames: data.playerGames || 0,
                opponentGames: data.opponentGames || 0,
                playerSets: data.playerSets || 0,
                opponentSets: data.opponentSets || 0,
                currentServer: data.currentServer || 'player',
                rallyCount: data.rallyCount || 0,
                lastHitBy: data.lastHitBy || null,
                ball: data.ball || getDefaultSaveData().ball,
                player: data.player || getDefaultSaveData().player,
                opponent: data.opponent || getDefaultSaveData().opponent,
                effects: data.effects || getDefaultSaveData().effects,
                savedAt: Utils.now()
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
                
                if (saveData.savedAt) {
                    var timeSinceSave = Utils.now() - saveData.savedAt;
                    if (merged.isStarted && !merged.isPaused && timeSinceSave > 5000) {
                        merged.isPaused = true;
                    }
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

    function getOpponentConfig(type) {
        return OPPONENT_TYPES[type] || OPPONENT_TYPES.robot;
    }

    function getRandomOpponentType() {
        var types = ['robot', 'cat', 'dog'];
        return Utils.randomChoice(types);
    }

    return {
        STORAGE_KEY: STORAGE_KEY,
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        OPPONENT_TYPES: OPPONENT_TYPES,
        COURT_CONFIG: COURT_CONFIG,
        GAME_RULES: GAME_RULES,
        COLORS: COLORS,
        getDefaultSaveData: getDefaultSaveData,
        saveGame: saveGame,
        loadGame: loadGame,
        hasSaveData: hasSaveData,
        clearSaveData: clearSaveData,
        getOpponentConfig: getOpponentConfig,
        getRandomOpponentType: getRandomOpponentType
    };
})();
