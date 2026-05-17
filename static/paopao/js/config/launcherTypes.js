const LAUNCHER_TYPES = {
    balance: {
        id: 'balance',
        name: '平衡水晶炮',
        icon: '💎',
        description: '均衡型，发射稳定匹配精准',
        baseFirePower: 100,
        scoreMultiplier: 12,
        matchTolerance: 5,
        aimSpeed: 'medium',
        specialBubbleScore: 25,
        specialBubbles: ['bomb', 'chain'],
        color: '#4ECDC4'
    },
    fire: {
        id: 'fire',
        name: '烈焰冲击炮',
        icon: '🔥',
        description: '攻击型，大范围消除能力强',
        baseFirePower: 95,
        scoreMultiplier: 14,
        matchTolerance: 4,
        aimSpeed: 'medium',
        specialBubbleScore: 28,
        specialBubbles: ['fire', 'explosion'],
        color: '#FF6B6B'
    },
    wind: {
        id: 'wind',
        name: '疾风迅捷炮',
        icon: '💨',
        description: '速度型，发射速度快瞄准灵活',
        baseFirePower: 90,
        scoreMultiplier: 10,
        matchTolerance: 6,
        aimSpeed: 'fast',
        specialBubbleScore: 22,
        specialBubbles: ['pierce', 'rapid'],
        color: '#96CEB4'
    }
};

const AIM_SPEEDS = {
    slow: 1.5,
    medium: 2.5,
    fast: 4
};

function getLauncherConfig(launcherId) {
    return LAUNCHER_TYPES[launcherId] || LAUNCHER_TYPES.balance;
}

function getAimSpeed(launcherId) {
    const launcher = getLauncherConfig(launcherId);
    return AIM_SPEEDS[launcher.aimSpeed] || AIM_SPEEDS.medium;
}
