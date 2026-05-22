const GameData = {
    events: {
        floor: {
            name: '自由操',
            icon: '🤸',
            color: '#FF6B6B',
            actions: ['前手翻', '后空翻', '侧空翻', '旋子', '托马斯全旋', '劈叉跳', '交换腿跳', '踺子', '小翻', '直体后空翻', '屈体后空翻', '团身后空翻两周转体360']
        },
        vault: {
            name: '跳马',
            icon: '🦘',
            color: '#4ECDC4',
            actions: ['前手翻', '前空翻', '侧手翻', '冢原跳', '笠松跳', '尤尔钦科', '直体前空翻', '团身前空翻', '屈体前空翻', '前手翻转体180', '后手翻', '直体后空翻两周转体720']
        },
        bars: {
            name: '双杠',
            icon: '💪',
            color: '#45B7D1',
            actions: ['支撑摆动', '前摆上', '后摆上', '屈伸上', '挂臂摆动', '大回环', '后空翻下', '前空翻下', '侧空翻下', '双杠大回环', '后摆上转体180', '后摆上成支撑']
        },
        horizontal: {
            name: '单杠',
            icon: '🌟',
            color: '#96CEB4',
            actions: ['摆动', '腾身回环', '后摆上', '大回环', '扭臂大回环', '团身后空翻两周转体360下', '直体后空翻两周转体540下', '分腿前空翻抓杠', '后摆上前空翻', '大回环转体360', '大回环转体540', '直体后空翻三周下']
        }
    },

    actionDifficulty: {
        A: 0.1, B: 0.2, C: 0.4, D: 0.6, E: 0.8, F: 1.0, G: 1.2
    },

    actionDatabase: {
        floor: [
            { name: '前手翻', difficulty: 'A', baseScore: 1.0, qteCount: 3, keys: ['D', 'F', 'J'] },
            { name: '后空翻', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['F', 'J', 'K', 'L'] },
            { name: '侧空翻', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['A', 'S', 'K', 'L'] },
            { name: '旋子', difficulty: 'C', baseScore: 2.0, qteCount: 5, keys: ['A', 'D', 'F', 'J', 'L'] },
            { name: '托马斯全旋', difficulty: 'D', baseScore: 3.0, qteCount: 6, keys: ['A', 'S', 'D', 'J', 'K', 'L'] },
            { name: '劈叉跳', difficulty: 'A', baseScore: 1.0, qteCount: 3, keys: ['F', 'J', 'K'] },
            { name: '交换腿跳', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['A', 'F', 'J', 'L'] },
            { name: '踺子', difficulty: 'A', baseScore: 1.0, qteCount: 3, keys: ['S', 'D', 'J'] },
            { name: '小翻', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['D', 'F', 'K', 'L'] },
            { name: '直体后空翻', difficulty: 'C', baseScore: 2.0, qteCount: 5, keys: ['F', 'J', 'K', 'L', 'F'] },
            { name: '屈体后空翻', difficulty: 'D', baseScore: 3.0, qteCount: 6, keys: ['A', 'F', 'J', 'K', 'L', 'F'] },
            { name: '团身后空翻两周转体360', difficulty: 'F', baseScore: 5.5, qteCount: 8, keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'F'] }
        ],
        vault: [
            { name: '前手翻', difficulty: 'A', baseScore: 1.0, qteCount: 3, keys: ['D', 'F', 'J'] },
            { name: '前空翻', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['F', 'J', 'K', 'L'] },
            { name: '侧手翻', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['A', 'S', 'K', 'L'] },
            { name: '冢原跳', difficulty: 'C', baseScore: 2.0, qteCount: 5, keys: ['D', 'F', 'J', 'K', 'L'] },
            { name: '笠松跳', difficulty: 'D', baseScore: 3.0, qteCount: 6, keys: ['A', 'S', 'F', 'J', 'K', 'L'] },
            { name: '尤尔钦科', difficulty: 'C', baseScore: 2.5, qteCount: 5, keys: ['D', 'F', 'J', 'K', 'F'] },
            { name: '直体前空翻', difficulty: 'C', baseScore: 2.0, qteCount: 5, keys: ['F', 'J', 'K', 'L', 'F'] },
            { name: '团身前空翻', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['F', 'J', 'K', 'L'] },
            { name: '屈体前空翻', difficulty: 'C', baseScore: 2.0, qteCount: 5, keys: ['A', 'F', 'J', 'K', 'L'] },
            { name: '前手翻转体180', difficulty: 'D', baseScore: 3.0, qteCount: 6, keys: ['A', 'S', 'D', 'J', 'K', 'L'] },
            { name: '后手翻', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['A', 'D', 'J', 'K'] },
            { name: '直体后空翻两周转体720', difficulty: 'G', baseScore: 6.4, qteCount: 8, keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'D'] }
        ],
        bars: [
            { name: '支撑摆动', difficulty: 'A', baseScore: 1.0, qteCount: 3, keys: ['F', 'J', 'K'] },
            { name: '前摆上', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['A', 'F', 'J', 'L'] },
            { name: '后摆上', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['D', 'F', 'K', 'L'] },
            { name: '屈伸上', difficulty: 'C', baseScore: 2.0, qteCount: 5, keys: ['A', 'S', 'D', 'J', 'K'] },
            { name: '挂臂摆动', difficulty: 'A', baseScore: 1.0, qteCount: 3, keys: ['F', 'J', 'K'] },
            { name: '大回环', difficulty: 'C', baseScore: 2.0, qteCount: 5, keys: ['A', 'D', 'F', 'J', 'L'] },
            { name: '后空翻下', difficulty: 'D', baseScore: 3.0, qteCount: 6, keys: ['A', 'F', 'J', 'K', 'L', 'F'] },
            { name: '前空翻下', difficulty: 'C', baseScore: 2.0, qteCount: 5, keys: ['D', 'F', 'J', 'K', 'L'] },
            { name: '侧空翻下', difficulty: 'C', baseScore: 2.5, qteCount: 5, keys: ['A', 'S', 'K', 'L', 'F'] },
            { name: '双杠大回环', difficulty: 'E', baseScore: 4.0, qteCount: 6, keys: ['A', 'D', 'F', 'J', 'K', 'L'] },
            { name: '后摆上转体180', difficulty: 'D', baseScore: 3.0, qteCount: 6, keys: ['A', 'D', 'J', 'K', 'L', 'F'] },
            { name: '后摆上成支撑', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['D', 'F', 'K', 'L'] }
        ],
        horizontal: [
            { name: '摆动', difficulty: 'A', baseScore: 1.0, qteCount: 3, keys: ['F', 'J', 'K'] },
            { name: '腾身回环', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['A', 'F', 'J', 'L'] },
            { name: '后摆上', difficulty: 'B', baseScore: 1.5, qteCount: 4, keys: ['D', 'F', 'K', 'L'] },
            { name: '大回环', difficulty: 'C', baseScore: 2.0, qteCount: 5, keys: ['A', 'D', 'F', 'J', 'L'] },
            { name: '扭臂大回环', difficulty: 'D', baseScore: 3.0, qteCount: 6, keys: ['A', 'S', 'D', 'F', 'J', 'K'] },
            { name: '团身后空翻两周转体360下', difficulty: 'E', baseScore: 4.0, qteCount: 6, keys: ['A', 'F', 'J', 'K', 'L', 'F'] },
            { name: '直体后空翻两周转体540下', difficulty: 'F', baseScore: 5.0, qteCount: 7, keys: ['A', 'D', 'F', 'J', 'K', 'L', 'F'] },
            { name: '分腿前空翻抓杠', difficulty: 'D', baseScore: 3.0, qteCount: 6, keys: ['A', 'S', 'F', 'J', 'K', 'L'] },
            { name: '后摆上前空翻', difficulty: 'C', baseScore: 2.5, qteCount: 5, keys: ['D', 'F', 'J', 'K', 'L'] },
            { name: '大回环转体360', difficulty: 'D', baseScore: 3.0, qteCount: 6, keys: ['A', 'D', 'F', 'J', 'K', 'L'] },
            { name: '大回环转体540', difficulty: 'E', baseScore: 4.0, qteCount: 7, keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L'] },
            { name: '直体后空翻三周下', difficulty: 'G', baseScore: 6.4, qteCount: 8, keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'F'] }
        ]
    },

    opponents: {
        club: {
            name: '俱乐部队',
            avgScore: 12.5,
            difficultyMultiplier: 0.7,
            color: '#90EE90'
        },
        province: {
            name: '省级队',
            avgScore: 13.8,
            difficultyMultiplier: 0.85,
            color: '#87CEEB'
        },
        national: {
            name: '国家队',
            avgScore: 14.8,
            difficultyMultiplier: 1.0,
            color: '#DDA0DD'
        },
        olympic: {
            name: '奥运冠军',
            avgScore: 15.5,
            difficultyMultiplier: 1.3,
            color: '#FFD700'
        }
    },

    environments: {
        indoor: {
            name: '室内',
            effect: '无影响',
            probability: 0.9,
            errorBonus: 0
        },
        pressure: {
            name: '观众压力',
            effect: '失误率+5%',
            probability: 0.1,
            errorBonus: 0.05
        }
    },

    scoreRatings: [
        { min: 15.5, score: 1000, rank: '传奇', icon: '🏆', color: '#FFD700' },
        { min: 14.5, score: 900, rank: '大师', icon: '🥇', color: '#FFA500' },
        { min: 13.5, score: 800, rank: '专业', icon: '🥈', color: '#C0C0C0' },
        { min: 12.5, score: 700, rank: '业余', icon: '🥉', color: '#CD7F32' },
        { min: 0, score: 600, rank: '新手', icon: '🎖️', color: '#888' }
    ],

    modes: {
        training: {
            name: '训练模式',
            events: 1,
            hasOpponent: false
        },
        allaround: {
            name: '全能赛',
            events: ['floor', 'vault', 'bars', 'horizontal'],
            hasOpponent: true
        },
        final: {
            name: '单项决赛',
            events: 1,
            hasOpponent: true
        }
    },

    getRating(totalScore) {
        for (const rating of this.scoreRatings) {
            if (totalScore >= rating.min) {
                return rating;
            }
        }
        return this.scoreRatings[this.scoreRatings.length - 1];
    },

    getRandomActions(eventType, count = 4) {
        const actions = this.actionDatabase[eventType] || [];
        const shuffled = [...actions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    },

    getActionDifficultyValue(level) {
        return this.actionDifficulty[level] || 0.1;
    }
};
