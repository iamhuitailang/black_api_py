const CONFIG = {
    GRAVITY: 0.6,
    PLAYER_SPEED: 6,
    JUMP_FORCE: 14,
    GLIDE_FALL_SPEED: 1.5,
    GRAPPLE_SPEED: 20,
    SWING_DAMPING: 0.99,
    
    COMBO_TIMEOUT: 2000,
    ATTACK_RANGE: 60,
    ATTACK_DAMAGE: 15,
    
    PLAYER_MAX_HEALTH: 100,
    
    ENEMIES: {
        THUG: { health: 30, damage: 8, speed: 2, name: '小混混' },
        GUNNER: { health: 25, damage: 15, speed: 1.5, name: '持枪匪徒' },
        ELITE: { health: 60, damage: 12, speed: 2.5, name: '精英守卫' }
    },
    
    LEVELS: [
        { name: '第一章：城市起源', unlocked: true, enemies: 3, hasGlide: false, hasBatarang: false, hasFinisher: false },
        { name: '第二章：暗夜降临', unlocked: false, enemies: 5, hasGlide: true, hasBatarang: false, hasFinisher: false },
        { name: '第三章：暗影突袭', unlocked: false, enemies: 7, hasGlide: true, hasBatarang: true, hasFinisher: false },
        { name: '第四章：终极对决', unlocked: false, enemies: 10, hasGlide: true, hasBatarang: true, hasFinisher: true }
    ],
    
    COLORS: {
        BACKGROUND_TOP: '#1a0a2e',
        BACKGROUND_BOTTOM: '#2d1b4e',
        BATMAN: '#000000',
        BATMAN_CAPE: '#1a1a2e',
        ENEMY: '#8b008b',
        ENEMY_HIGHLIGHT: '#da70d6',
        BUILDING: '#0d0d1a',
        BUILDING_WINDOW: '#f0e68c',
        GRAPPLE: '#c0c0c0'
    }
};