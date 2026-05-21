const CharacterData = {
    clown: {
        id: 'clown',
        name: '欢乐小丑',
        emoji: '🤡',
        type: '全能均衡型',
        maxHealth: 100,
        attack: 11,
        defense: 5,
        moveSpeed: 'medium',
        specialScore: 24,
        color: '#ff6b6b',
        specialMove: 'ballThrow',
        specialMove2: 'flipAttack'
    },
    tamer: {
        id: 'tamer',
        name: '猎兽师',
        emoji: '🦁',
        type: '力量爆发型',
        maxHealth: 92,
        attack: 15,
        defense: 3,
        moveSpeed: 'slow',
        specialScore: 29,
        color: '#f39c12',
        specialMove: 'beastRoar',
        specialMove2: 'tamerStrike'
    },
    dancer: {
        id: 'dancer',
        name: '杂技舞者',
        emoji: '💃',
        type: '灵动敏捷型',
        maxHealth: 88,
        attack: 9,
        defense: 7,
        moveSpeed: 'veryFast',
        specialScore: 21,
        color: '#9b59b6',
        specialMove: 'ribbonDance',
        specialMove2: 'spinKick'
    }
};

const AttackMoves = {
    lightJuggle: {
        id: 'lightJuggle',
        name: '轻杂耍击',
        baseDamage: 7,
        startupTime: 0.04,
        recoveryTime: 0.14,
        range: 'close',
        type: 'punch',
        key: 'a'
    },
    heavyStage: {
        id: 'heavyStage',
        name: '重舞台击',
        baseDamage: 13,
        startupTime: 0.11,
        recoveryTime: 0.24,
        range: 'medium',
        type: 'punch',
        key: 's'
    },
    lightKick: {
        id: 'lightKick',
        name: '轻花式踢',
        baseDamage: 6,
        startupTime: 0.06,
        recoveryTime: 0.17,
        range: 'medium',
        type: 'kick',
        key: 'd'
    },
    heavyAirKick: {
        id: 'heavyAirKick',
        name: '重腾空踢',
        baseDamage: 14,
        startupTime: 0.14,
        recoveryTime: 0.27,
        range: 'far',
        type: 'kick',
        airborne: true,
        key: 'f'
    }
};

const SpecialMoves = {
    ballThrow: {
        id: 'ballThrow',
        name: '彩球飞掷',
        baseDamage: 17,
        startupTime: 0.2,
        recoveryTime: 0.3,
        range: 'ranged',
        type: 'projectile',
        description: '远程抛掷道具攻击',
        key: 'g'
    },
    flipAttack: {
        id: 'flipAttack',
        name: '空翻突袭',
        baseDamage: 24,
        startupTime: 0.15,
        recoveryTime: 0.35,
        range: 'medium',
        type: 'special',
        iframe: true,
        description: '腾空突进，自带短暂空档免伤',
        key: 'g'
    },
    beastRoar: {
        id: 'beastRoar',
        name: '猛兽震慑',
        baseDamage: 19,
        startupTime: 0.25,
        recoveryTime: 0.4,
        range: 'medium',
        type: 'special',
        stun: true,
        description: '震慑对手，造成短暂硬直',
        key: 'g'
    },
    tamerStrike: {
        id: 'tamerStrike',
        name: '驯兽重击',
        baseDamage: 29,
        startupTime: 0.3,
        recoveryTime: 0.5,
        range: 'close',
        type: 'special',
        description: '蓄力重击，伤害极高',
        key: 'g'
    },
    ribbonDance: {
        id: 'ribbonDance',
        name: '彩带旋舞',
        baseDamage: 19,
        startupTime: 0.12,
        recoveryTime: 0.35,
        range: 'medium',
        type: 'special',
        multiHit: 3,
        description: '多段连贯缠绕攻击',
        key: 'g'
    },
    spinKick: {
        id: 'spinKick',
        name: '连环旋踢',
        baseDamage: 21,
        startupTime: 0.1,
        recoveryTime: 0.3,
        range: 'medium',
        type: 'special',
        multiHit: 2,
        description: '连环旋转踢击',
        key: 'g'
    }
};

const DefenseMoves = {
    standBlock: {
        id: 'standBlock',
        name: '站立挡演',
        damageReduction: 0.5,
        cost: 0
    },
    crouchBlock: {
        id: 'crouchBlock',
        name: '弯腰避挡',
        damageReduction: 0.5,
        cost: 0
    },
    perfectBlock: {
        id: 'perfectBlock',
        name: '完美临场格挡',
        damageReduction: 1,
        cost: 30
    }
};
