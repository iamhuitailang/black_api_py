const Constants = (() => {
    const GAME_DURATION = 120;
    const CANVAS_WIDTH = 1200;
    const CANVAS_HEIGHT = 800;
    
    const ELEVATOR = {
        WIDTH: 400,
        HEIGHT: 600,
        X: 400,
        Y: 100,
        SPEED: 0.5,
        MIN_FLOOR: 1,
        MAX_FLOOR: 50,
        TARGET_FLOOR: 50
    };
    
    const CHARACTERS = {
        agent: {
            name: '特工',
            type: '均衡型',
            maxHealth: 100,
            attack: 12,
            defense: 5,
            speed: 4,
            skillDamage: 25,
            skillName: '特工护盾',
            color: '#60a5fa',
            icon: '🕵️'
        },
        runner: {
            name: '跑酷达人',
            type: '速度型',
            maxHealth: 90,
            attack: 10,
            defense: 6,
            speed: 6,
            skillDamage: 22,
            skillName: '极速闪避',
            color: '#34d399',
            icon: '🏃'
        },
        security: {
            name: '安保',
            type: '防御型',
            maxHealth: 110,
            attack: 8,
            defense: 8,
            speed: 3.5,
            skillDamage: 20,
            skillName: '强力击退',
            color: '#f59e0b',
            icon: '👮'
        }
    };
    
    const ENEMY_STATES = {
        IDLE: 'idle',
        APPROACH: 'approach',
        ATTACK: 'attack',
        RETREAT: 'retreat',
        PATROL: 'patrol'
    };
    
    const DECISION_WEIGHTS = {
        far: [0.05, 0.05, 0.8, 0.1],
        medium: [0.4, 0.15, 0.4, 0.05],
        near: [0.7, 0.2, 0, 0.1]
    };
    
    const DISTANCE_THRESHOLDS = {
        far: 250,
        medium: 150,
        near: 80
    };
    
    const TRAP_TYPES = {
        electric: {
            name: '电击地板',
            damage: 5,
            damagePerSecond: true,
            color: '#fbbf24',
            duration: 3000
        },
        falling: {
            name: '高空坠落物',
            damage: 50,
            damagePerSecond: false,
            color: '#6b7280',
            duration: 2000
        },
        laser: {
            name: '激光栅栏',
            damage: 60,
            damagePerSecond: false,
            color: '#ef4444',
            duration: 1500
        },
        malfunction: {
            name: '电梯故障',
            damage: 10,
            damagePerSecond: true,
            color: '#8b5cf6',
            duration: 4000
        }
    };
    
    const ITEM_TYPES = {
        health: {
            name: '医疗包',
            value: 30,
            color: '#ef4444',
            icon: '❤️'
        },
        shield: {
            name: '护盾',
            value: 20,
            color: '#3b82f6',
            icon: '🛡️'
        },
        energy: {
            name: '能量',
            value: 30,
            color: '#f59e0b',
            icon: '⚡'
        }
    };
    
    const ENEMY = {
        maxHealth: 60,
        attack: 8,
        speed: 2,
        color: '#dc2626',
        attackRange: 50,
        attackCooldown: 1000
    };
    
    return {
        GAME_DURATION,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        ELEVATOR,
        CHARACTERS,
        ENEMY_STATES,
        DECISION_WEIGHTS,
        DISTANCE_THRESHOLDS,
        TRAP_TYPES,
        ITEM_TYPES,
        ENEMY
    };
})();