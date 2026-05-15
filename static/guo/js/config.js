const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    GROUND_Y: 600,
    GRAVITY: 0.8,
    FRICTION: 0.85,
    BOUNDARY_LEFT: 50,
    BOUNDARY_RIGHT: 1150,
    KNOCKBACK_FORCE: 15,
    CHARGE_TIME: 1000,
    MAX_CHARGE_MULTIPLIER: 2.5,
    SPECIAL_COST: 100,
    SPECIAL_GAIN_PER_HIT: 15,
    GAME_TIME: 99,
    
    CHARACTERS: {
        soldier: {
            name: '吃鸡特种兵',
            type: '均衡型',
            maxHealth: 100,
            attack: 10,
            defense: 5,
            moveSpeed: 5,
            attackSpeed: 1,
            specialDamage: 22,
            color: '#3498db',
            specialName: '平底锅旋风'
        },
        girl: {
            name: '吃鸡少女',
            type: '速度型',
            maxHealth: 90,
            attack: 8,
            defense: 7,
            moveSpeed: 7,
            attackSpeed: 1.5,
            specialDamage: 20,
            color: '#e91e63',
            specialName: '旋风飞盘'
        },
        warrior: {
            name: '蒙面战士',
            type: '攻击型',
            maxHealth: 110,
            attack: 13,
            defense: 4,
            moveSpeed: 4,
            attackSpeed: 0.7,
            specialDamage: 25,
            color: '#f44336',
            specialName: '震荡冲击波'
        }
    }
};