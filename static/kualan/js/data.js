const GameData = (function() {
    const MODES = {
        1: { name: '个人计时', desc: '自我挑战', rivals: 0 },
        2: { name: '地区赛', desc: '休闲', rivals: 3 },
        3: { name: '全国赛', desc: '竞争', rivals: 6 },
        4: { name: '世锦赛', desc: '顶级', rivals: 8 }
    };

    const OPPONENT_TYPES = {
        rookie: {
            name: '新手',
            minTime: 17,
            maxTime: 19,
            difficulty: 0.6,
            mistakeRate: 0.35
        },
        amateur: {
            name: '业余',
            minTime: 15.5,
            maxTime: 17,
            difficulty: 0.75,
            mistakeRate: 0.2
        },
        pro: {
            name: '职业',
            minTime: 14,
            maxTime: 15.2,
            difficulty: 0.9,
            mistakeRate: 0.1
        },
        worldRecord: {
            name: '顶尖选手',
            minTime: 13.2,
            maxTime: 14.2,
            difficulty: 1.0,
            mistakeRate: 0.05
        }
    };

    const WEATHER_TYPES = [
        { name: '晴天', emoji: '☀️', effect: 'none', speedMod: 1, hitMod: 0, probability: 0.6 },
        { name: '逆风', emoji: '🌬️', effect: 'slow', speedMod: 0.95, hitMod: 0, probability: 0.2 },
        { name: '顺风', emoji: '💨', effect: 'fast', speedMod: 1.05, hitMod: 0, probability: 0.15 },
        { name: '小雨', emoji: '🌧️', effect: 'rain', speedMod: 1, hitMod: 0.1, probability: 0.05 }
    ];

    const HURDLE_POSITIONS = [
        13.72,
        22.86,
        32.00,
        41.14,
        50.28,
        59.42,
        68.56,
        77.70,
        86.84,
        95.98
    ];

    const RACE_DISTANCE = 110;
    const HURDLE_HEIGHT = 1.067;
    const PERFECT_SCORE_BONUS = 50;

    function getScore(time, perfectCount) {
        let baseScore;
        if (time < 13) {
            baseScore = 1000;
        } else if (time < 14) {
            baseScore = 900;
        } else if (time < 15) {
            baseScore = 800;
        } else if (time < 16) {
            baseScore = 700;
        } else {
            baseScore = 600;
        }
        const bonusScore = perfectCount * PERFECT_SCORE_BONUS;
        return { baseScore, bonusScore, totalScore: baseScore + bonusScore };
    }

    function getRandomWeather() {
        const rand = Math.random();
        let cumulative = 0;
        for (const weather of WEATHER_TYPES) {
            cumulative += weather.probability;
            if (rand <= cumulative) {
                return weather;
            }
        }
        return WEATHER_TYPES[0];
    }

    function getOpponentTypesForMode(mode) {
        const modeData = MODES[mode];
        const count = modeData.rivals;
        const types = [];
        
        for (let i = 0; i < count; i++) {
            if (mode === 2) {
                types.push(i < 2 ? 'rookie' : 'amateur');
            } else if (mode === 3) {
                if (i < 2) types.push('amateur');
                else if (i < 5) types.push('pro');
                else types.push('worldRecord');
            } else if (mode === 4) {
                if (i < 2) types.push('pro');
                else types.push('worldRecord');
            }
        }
        
        return types;
    }

    function getModes() {
        return MODES;
    }

    function getOpponentType(type) {
        return OPPONENT_TYPES[type];
    }

    function getHurdlePositions() {
        return [...HURDLE_POSITIONS];
    }

    function getRaceDistance() {
        return RACE_DISTANCE;
    }

    function getHurdleHeight() {
        return HURDLE_HEIGHT;
    }

    return {
        getModes,
        getOpponentType,
        getOpponentTypesForMode,
        getHurdlePositions,
        getRaceDistance,
        getHurdleHeight,
        getRandomWeather,
        getScore,
        PERFECT_SCORE_BONUS
    };
})();