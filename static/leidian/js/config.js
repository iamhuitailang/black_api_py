const Config = (() => {
    const CANVAS_WIDTH = 480;
    const CANVAS_HEIGHT = 800;
    
    const PLAYER = {
        WIDTH: 40,
        HEIGHT: 50,
        INITIAL_LIVES: 3,
        MAX_LIVES: 5,
        SPEED: 6,
        SHOOT_INTERVAL: 150,
        INVINCIBLE_TIME: 1000,
        BULLET_DAMAGE: 1,
        BULLET_SPEED: 12
    };
    
    const ENEMY_TYPES = {
        SCOUT: {
            name: '侦察机',
            width: 30,
            height: 30,
            hp: 1,
            speed: 3,
            score: 100,
            color: '#ff4444',
            pattern: 'straight'
        },
        FIGHTER: {
            name: '战斗机',
            width: 35,
            height: 35,
            hp: 2,
            speed: 2.5,
            score: 150,
            color: '#4444ff',
            pattern: 'zigzag'
        },
        GUNBOAT: {
            name: '炮艇',
            width: 45,
            height: 40,
            hp: 3,
            speed: 2,
            score: 300,
            color: '#44ff44',
            pattern: 'shooter',
            shootInterval: 2000
        },
        HEAVY: {
            name: '重型机',
            width: 55,
            height: 50,
            hp: 5,
            speed: 1.5,
            score: 500,
            color: '#aa44ff',
            pattern: 'heavy',
            hasEscort: true
        },
        KAMIKAZE: {
            name: '自爆机',
            width: 32,
            height: 32,
            hp: 1,
            speed: 5,
            score: 200,
            color: '#ffff44',
            pattern: 'chase'
        }
    };
    
    const BOSS = {
        WIDTH: 120,
        HEIGHT: 100,
        HP: 100,
        SPEED: 1,
        SCORE: 5000,
        COLOR: '#ff00ff',
        SHOOT_INTERVAL: 500
    };
    
    const LEVELS = [
        {
            id: 1,
            name: '第一关：星域边缘',
            bgColor: '#050520',
            waves: 8,
            enemyTypes: ['SCOUT', 'FIGHTER'],
            bossHP: 80
        },
        {
            id: 2,
            name: '第二关：小行星带',
            bgColor: '#100520',
            waves: 10,
            enemyTypes: ['SCOUT', 'FIGHTER', 'GUNBOAT'],
            bossHP: 120
        },
        {
            id: 3,
            name: '第三关：母舰核心',
            bgColor: '#200515',
            waves: 12,
            enemyTypes: ['SCOUT', 'FIGHTER', 'GUNBOAT', 'HEAVY', 'KAMIKAZE'],
            bossHP: 180
        }
    ];
    
    const POWERUP_TYPES = {
        HEALTH: {
            name: '生命恢复',
            color: '#ff4444',
            effect: 'health'
        },
        DOUBLE_SHOT: {
            name: '双发射击',
            color: '#44ffff',
            effect: 'doubleShot'
        },
        SPEED: {
            name: '速度提升',
            color: '#44ff44',
            effect: 'speed'
        },
        DAMAGE: {
            name: '伤害提升',
            color: '#ffaa00',
            effect: 'damage'
        },
        SCORE: {
            name: '分数奖励',
            color: '#ffff44',
            effect: 'score',
            value: 500
        }
    };
    
    const GAME = {
        WAVE_INTERVAL: 2000,
        ENEMIES_PER_WAVE_START: 2,
        ENEMIES_PER_WAVE_MAX: 6,
        STAR_COUNT: 100,
        POWERUP_DROP_CHANCE: 0.15
    };
    
    return {
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        PLAYER,
        ENEMY_TYPES,
        BOSS,
        LEVELS,
        POWERUP_TYPES,
        GAME
    };
})();
