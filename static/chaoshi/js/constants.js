const CONSTANTS = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    GAME_DURATION: 180,
    OVERTIME_DURATION: 30,
    GRAVITY: 0.6,
    GROUND_Y: 600,
    
    CHARACTER_TYPES: {
        speed: {
            name: '极速小哥',
            maxLife: 3,
            speed: 8,
            jumpForce: 14,
            pickupRange: 50,
            specialAbility: 'dash',
            dashSpeed: 18,
            icon: '🏃'
        },
        pickup: {
            name: '购物达人',
            maxLife: 4,
            speed: 6,
            jumpForce: 12,
            pickupRange: 70,
            specialAbility: 'doublePickup',
            icon: '🛒'
        },
        shield: {
            name: '家庭主妇',
            maxLife: 5,
            speed: 5,
            jumpForce: 11,
            pickupRange: 55,
            specialAbility: 'shield',
            shieldDuration: 3000,
            icon: '🧺'
        }
    },
    
    CLERK: {
        speed: 3.5,
        patrolRange: 200,
        chaseRange: 250,
        catchRange: 60,
        stunnedTime: 2000
    },
    
    SKILLS: {
        dashCooldown: 1500,
        cartCooldown: 5000,
        shieldCooldown: 8000,
        cartRange: 150,
        cartDuration: 3000
    },
    
    PRODUCT_TYPES: [
        { name: '零食', emoji: '🍪', price: 5, rarity: 0.3 },
        { name: '饮料', emoji: '🥤', price: 8, rarity: 0.25 },
        { name: '水果', emoji: '🍎', price: 12, rarity: 0.2 },
        { name: '蔬菜', emoji: '🥬', price: 6, rarity: 0.25 },
        { name: '肉类', emoji: '🥩', price: 25, rarity: 0.12 },
        { name: '海鲜', emoji: '🦐', price: 35, rarity: 0.08 },
        { name: '日用品', emoji: '🧴', price: 15, rarity: 0.15 },
        { name: '电子产品', emoji: '📱', price: 88, rarity: 0.03 },
        { name: '奢侈品', emoji: '👜', price: 188, rarity: 0.01 }
    ],
    
    COLORS: {
        floor: '#8B7355',
        wall: '#DEB887',
        shelf: '#A0522D',
        light: '#FFE4B5'
    },
    
    STORAGE_KEY: 'chaoshi_game_state'
};