const GameConfig = {
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600,
        TRACK_WIDTH: 600,
        TRACK_HEIGHT: 800
    },
    
    GAME: {
        FPS: 60,
        TRACK_LENGTH: 3000,
        RELAY_POINTS: 3,
        FINISH_LINE: 2800
    },
    
    CHARACTERS: {
        rabbit: {
            id: 'rabbit',
            name: '兔子',
            emoji: '🐰',
            speed: 6,
            size: 25,
            penetration: 0.3,
            pickupRange: 30,
            stamina: 80,
            color: '#FFF5E6',
            description: '极速敏捷型'
        },
        bear: {
            id: 'bear',
            name: '小熊',
            emoji: '🐻',
            speed: 3,
            size: 40,
            penetration: 0.8,
            pickupRange: 50,
            stamina: 200,
            color: '#D4A574',
            description: '力量稳重型'
        },
        fox: {
            id: 'fox',
            name: '狐狸',
            emoji: '🐹',
            speed: 4.5,
            size: 30,
            penetration: 0.5,
            pickupRange: 40,
            stamina: 120,
            color: '#FF8C00',
            description: '灵巧智慧型'
        },
        turtle: {
            id: 'turtle',
            name: '乌龟',
            emoji: '🐢',
            speed: 2,
            size: 35,
            penetration: 0.95,
            pickupRange: 40,
            stamina: 300,
            color: '#7CB342',
            description: '续航防御型'
        }
    },
    
    TEAM_ORDER: ['rabbit', 'bear', 'fox', 'turtle'],
    
    ITEMS: {
        speed_boost: {
            id: 'speed_boost',
            name: '疾风之羽',
            emoji: '🪶',
            type: 'buff',
            duration: 3000,
            effect: { speedMultiplier: 1.8 },
            color: '#00BCD4',
            description: '移动速度提升80%'
        },
        shield: {
            id: 'shield',
            name: '护盾',
            emoji: '🛡️',
            type: 'buff',
            duration: 5000,
            effect: { shield: true },
            color: '#2196F3',
            description: '免疫一次障碍伤害'
        },
        magnet: {
            id: 'magnet',
            name: '磁铁',
            emoji: '🧲',
            type: 'buff',
            duration: 4000,
            effect: { magnetRange: 150 },
            color: '#E91E63',
            description: '自动吸附附近道具'
        },
        slow_trap: {
            id: 'slow_trap',
            name: '减速陷阱',
            emoji: '🕸️',
            type: 'debuff',
            duration: 2000,
            effect: { speedMultiplier: 0.4 },
            color: '#9E9E9E',
            description: '移动速度降低60%'
        },
        stamina_potion: {
            id: 'stamina_potion',
            name: '耐力药水',
            emoji: '🧪',
            type: 'buff',
            duration: 0,
            effect: { staminaRestore: 50 },
            color: '#4CAF50',
            description: '恢复50点耐力'
        },
        coin: {
            id: 'coin',
            name: '金币',
            emoji: '🪙',
            type: 'score',
            duration: 0,
            effect: { score: 100 },
            color: '#FFD700',
            description: '+100分'
        },
        star: {
            id: 'star',
            name: '星星',
            emoji: '⭐',
            type: 'score',
            duration: 0,
            effect: { score: 200 },
            color: '#FFC107',
            description: '+200分'
        },
        reverse_control: {
            id: 'reverse_control',
            name: '迷惑蘑菇',
            emoji: '🍄',
            type: 'debuff',
            duration: 3000,
            effect: { reverseControl: true },
            color: '#9C27B0',
            description: '方向控制反转'
        }
    },
    
    OBSTACLES: {
        rock: {
            id: 'rock',
            name: '石块',
            emoji: '🪨',
            type: 'static',
            size: 35,
            damage: 20,
            slowFactor: 0.5,
            color: '#795548'
        },
        tree: {
            id: 'tree',
            name: '矮树',
            emoji: '🌳',
            type: 'static',
            size: 40,
            damage: 15,
            slowFactor: 0.6,
            color: '#388E3C'
        },
        pit: {
            id: 'pit',
            name: '沟壑',
            emoji: '🕳️',
            type: 'static',
            size: 45,
            damage: 30,
            slowFactor: 0.3,
            color: '#424242'
        },
        bridge_broken: {
            id: 'bridge_broken',
            name: '断桥',
            emoji: '🌉',
            type: 'static',
            size: 50,
            damage: 25,
            slowFactor: 0.4,
            color: '#607D8B'
        },
        moving_ball: {
            id: 'moving_ball',
            name: '滚动石球',
            emoji: '⚽',
            type: 'dynamic_slow',
            size: 30,
            damage: 25,
            slowFactor: 0.4,
            speed: 1.5,
            range: 100,
            color: '#5D4037'
        },
        fast_saw: {
            id: 'fast_saw',
            name: '飞旋锯片',
            emoji: '🌀',
            type: 'dynamic_fast',
            size: 25,
            damage: 35,
            slowFactor: 0.3,
            speed: 4,
            range: 80,
            color: '#F44336'
        },
        hidden_trap: {
            id: 'hidden_trap',
            name: '隐形陷阱',
            emoji: '❓',
            type: 'hidden',
            size: 30,
            damage: 15,
            slowFactor: 0.5,
            effect: 'stun',
            effectDuration: 1500,
            color: '#FF5722'
        }
    },
    
    LEVELS: {
        1: {
            id: 1,
            name: '沙漠戈壁',
            emoji: '🏜️',
            bgColor: '#E8D4A8',
            trackColor: '#D4B896',
            obstacleColor: '#8B7355',
            accentColor: '#C4A574',
            obstacleCount: 15,
            dynamicCount: 3,
            hiddenCount: 2,
            itemCount: 12,
            targetTime: 60000,
            threeStarTime: 45000,
            twoStarTime: 60000
        },
        2: {
            id: 2,
            name: '峡谷山路',
            emoji: '🏔️',
            bgColor: '#A8B8C4',
            trackColor: '#8B9AAB',
            obstacleColor: '#5D6D7E',
            accentColor: '#7D8C9D',
            obstacleCount: 20,
            dynamicCount: 5,
            hiddenCount: 3,
            itemCount: 15,
            targetTime: 75000,
            threeStarTime: 55000,
            twoStarTime: 75000
        },
        3: {
            id: 3,
            name: '荒野石林',
            emoji: '🪨',
            bgColor: '#B8A89C',
            trackColor: '#A09080',
            obstacleColor: '#6B5D52',
            accentColor: '#8B7D72',
            obstacleCount: 25,
            dynamicCount: 7,
            hiddenCount: 4,
            itemCount: 18,
            targetTime: 90000,
            threeStarTime: 70000,
            twoStarTime: 90000
        }
    },
    
    SCORE: {
        baseScore: 1000,
        timeBonus: 10,
        itemBonus: 50,
        perfectBonus: 500
    }
};