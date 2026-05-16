const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    GRAVITY: 0.8,
    GROUND_Y: 550,
    MAX_HEALTH: 100,
    
    ATTACKS: {
        lightPunch: { damage: 7, startup: 50, duration: 150, range: 80, name: '轻拍' },
        heavyPunch: { damage: 13, startup: 120, duration: 250, range: 120, name: '重拍' },
        lightKick: { damage: 6, startup: 70, duration: 180, range: 100, name: '轻踢' },
        heavyKick: { damage: 14, startup: 150, duration: 280, range: 150, name: '重踢' }
    },
    
    SPECIALS: {
        laughWave: { damage: 18, name: '狂笑冲击', type: 'projectile' },
        headSpin: { damage: 25, name: '魔性甩头', type: 'antiAir', invincible: true },
        funnySpin: { damage: 20, name: '搞怪旋风', type: 'multiHit', hits: 5 }
    },
    
    CHARACTER_TYPES: {
        laugh: { name: '笑哭脸', emoji: '😂', type: '均衡型', speed: 5, jumpPower: 15, defense: 1 },
        clown: { name: '小丑脸', emoji: '🤡', type: '攻击型', speed: 5, jumpPower: 14, defense: 0.8, attackBonus: 1.2 },
        devil: { name: '恶魔笑', emoji: '😈', type: '速度型', speed: 7, jumpPower: 16, defense: 0.9 },
        dog: { name: '修勾笑', emoji: '🐶', type: '防御型', speed: 4, jumpPower: 13, defense: 1.3 }
    },
    
    INPUT_COMMANDS: {
        laughWave: ['down', 'downRight', 'right', 'punch'],
        headSpin: ['right', 'down', 'downRight', 'punch'],
        funnySpin: ['down', 'downLeft', 'left', 'kick']
    },
    
    STORAGE_KEY: 'biaoqing_game_state',
    
    COLORS: {
        background: '#f5f5f5',
        chatBubble: '#ffffff',
        chatBubbleRight: '#95ec69',
        ground: '#e0e0e0',
        groundLine: '#ccc'
    }
};