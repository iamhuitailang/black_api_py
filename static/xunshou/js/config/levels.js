const LEVELS = {
    1: {
        id: 1,
        name: '新手训练场',
        emoji: '🎪',
        desc: '霜外驯兽场',
        speed: 3.5,
        obstacleFrequency: 0.028,
        fireHoopFrequency: 0.02,
        minObstacleGap: 150,
        length: 2500,
        background: {
            skyTop: '#87CEEB',
            skyBottom: '#E0F6FF',
            ground: '#90EE90',
            tentColor: '#FF6B6B'
        }
    },
    2: {
        id: 2,
        name: '热闹马戏团',
        emoji: '🎠',
        desc: '彩色表演大棚',
        speed: 4.5,
        obstacleFrequency: 0.035,
        fireHoopFrequency: 0.025,
        minObstacleGap: 130,
        length: 3500,
        background: {
            skyTop: '#FFB6C1',
            skyBottom: '#FFE4E1',
            ground: '#98FB98',
            tentColor: '#FFD700'
        }
    },
    3: {
        id: 3,
        name: '暗夜竞技场',
        emoji: '🎭',
        desc: '灯光舞台赛场',
        speed: 5.5,
        obstacleFrequency: 0.042,
        fireHoopFrequency: 0.03,
        minObstacleGap: 110,
        length: 4500,
        background: {
            skyTop: '#483D8B',
            skyBottom: '#9370DB',
            ground: '#2F4F4F',
            tentColor: '#FF1493'
        }
    }
};

const LEVEL_LIST = [1, 2, 3];

const OBSTACLE_TYPES = {
    log: {
        id: 'log',
        name: '平地木桩',
        damage: 1,
        width: 60,
        height: 40,
        color: '#8B4513',
        strategy: 'jump'
    },
    spike: {
        id: 'spike',
        name: '空中尖刺',
        damage: 2,
        width: 50,
        height: 30,
        color: '#708090',
        strategy: 'duck'
    },
    fireball: {
        id: 'fireball',
        name: '摇摆火球',
        damage: 1.5,
        width: 40,
        height: 40,
        color: '#FF4500',
        strategy: 'avoid'
    }
};
