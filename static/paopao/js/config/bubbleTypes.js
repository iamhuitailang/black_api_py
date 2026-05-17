const BUBBLE_TYPES_CONFIG = {
    normal: {
        name: '普通彩色泡泡',
        baseScore: 8,
        fireDelay: 0.05,
        landDelay: 0.15,
        matchRange: 'close',
        color: null,
        icon: '🫧'
    },
    bomb: {
        name: '重型爆破泡泡',
        baseScore: 14,
        fireDelay: 0.12,
        landDelay: 0.25,
        matchRange: 'medium',
        color: '#FF4500',
        icon: '💣',
        effect: 'explode',
        explosionRadius: 2
    },
    chain: {
        name: '连锁泡泡',
        baseScore: 10,
        fireDelay: 0.08,
        landDelay: 0.2,
        matchRange: 'medium',
        color: '#9932CC',
        icon: '🔗',
        effect: 'chain',
        chainCount: 3
    },
    fire: {
        name: '燃烧泡泡',
        baseScore: 16,
        fireDelay: 0.1,
        landDelay: 0.22,
        matchRange: 'medium',
        color: '#FF6347',
        icon: '🔥',
        effect: 'burn',
        burnRadius: 1
    },
    explosion: {
        name: '范围爆裂泡泡',
        baseScore: 15,
        fireDelay: 0.15,
        landDelay: 0.28,
        matchRange: 'wide',
        color: '#FF8C00',
        icon: '💥',
        effect: 'explode',
        explosionRadius: 3
    },
    pierce: {
        name: '穿透泡泡',
        baseScore: 12,
        fireDelay: 0.06,
        landDelay: 0.18,
        matchRange: 'medium',
        color: '#00CED1',
        icon: '⚡',
        effect: 'pierce',
        pierceCount: 2
    },
    rapid: {
        name: '快速连发泡泡',
        baseScore: 7,
        fireDelay: 0.07,
        landDelay: 0.18,
        matchRange: 'medium',
        color: '#32CD32',
        icon: '💨',
        effect: 'rapid',
        rapidCount: 3
    }
};

const BUBBLE_COLORS = [
    CONSTANTS.COLORS.RED,
    CONSTANTS.COLORS.BLUE,
    CONSTANTS.COLORS.YELLOW,
    CONSTANTS.COLORS.GREEN,
    CONSTANTS.COLORS.PURPLE,
    CONSTANTS.COLORS.ORANGE
];

function getRandomBubbleColor() {
    return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
}

function getRandomBubbleType(availableTypes = ['normal']) {
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
}
