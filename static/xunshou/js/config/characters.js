const CHARACTERS = {
    lion: {
        id: 'lion',
        name: '小萌狮',
        emoji: '🦁',
        desc: '均衡百搭',
        specialSkill: '短距轻盈跳',
        maxHealth: 5,
        moveSpeed: 5,
        jumpHeight: 12,
        doubleJumpCooldown: 0.3,
        scoreMultiplier: 1.0,
        colors: {
            body: '#FFA500',
            mane: '#FF6B35',
            face: '#FFE4B5'
        }
    },
    fox: {
        id: 'fox',
        name: '灵狐',
        emoji: '🦊',
        desc: '敏捷速度型',
        specialSkill: '低空滑翔',
        maxHealth: 4,
        moveSpeed: 7,
        jumpHeight: 10,
        doubleJumpCooldown: 0.2,
        scoreMultiplier: 1.2,
        colors: {
            body: '#FF7F50',
            belly: '#FFE4B5',
            ears: '#8B4513'
        }
    },
    deer: {
        id: 'deer',
        name: '幻小鹿',
        emoji: '🦌',
        desc: '稳重型',
        specialSkill: '高空滞空跳',
        maxHealth: 6,
        moveSpeed: 4,
        jumpHeight: 12,
        doubleJumpCooldown: 0.4,
        scoreMultiplier: 0.9,
        colors: {
            body: '#D2691E',
            spots: '#8B4513',
            antlers: '#F5DEB3'
        }
    }
};

const CHARACTER_LIST = ['lion', 'fox', 'deer'];
