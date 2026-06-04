export const bugParts = {
    bodies: [
        { id: 'body1', name: '钢铁甲壳', icon: '🪲', hp: 100, defense: 20, attack: 10 },
        { id: 'body2', name: '钛合金躯干', icon: '🐞', hp: 150, defense: 30, attack: 5 },
        { id: 'body3', name: '纳米虫壳', icon: '🦗', hp: 80, defense: 10, attack: 25 }
    ],
    heads: [
        { id: 'head1', name: '侦察复眼', icon: '👁️', attack: 15, speed: 20, hp: 20 },
        { id: 'head2', name: '战斗颚部', icon: '🦷', attack: 30, speed: 5, defense: 10 },
        { id: 'head3', name: '智能核心', icon: '🧠', attack: 10, speed: 15, hp: 50 }
    ],
    legs: [
        { id: 'leg1', name: '高速节足', icon: '🦵', speed: 30, attack: 10, defense: 5 },
        { id: 'leg2', name: '重型支撑腿', icon: '🦿', speed: 10, attack: 15, defense: 25 },
        { id: 'leg3', name: '跳跃肢', icon: '🦘', speed: 25, attack: 20, hp: 10 }
    ],
    weapons: [
        { id: 'weapon1', name: '激光镰刀', icon: '⚔️', attack: 40, speed: 15, cooldown: 0 },
        { id: 'weapon2', name: '等离子炮', icon: '🔫', attack: 60, speed: 5, cooldown: 2 },
        { id: 'weapon3', name: '毒刺注射器', icon: '💉', attack: 25, speed: 20, cooldown: 1 }
    ]
};

export const skills = [
    { id: 'slash', name: '利刃斩击', damage: 30, cooldown: 2, type: 'damage', description: '快速挥舞武器造成伤害' },
    { id: 'shield', name: '能量护盾', defense: 30, cooldown: 3, type: 'defense', duration: 2, description: '激活护盾减少受到的伤害' },
    { id: 'heal', name: '纳米修复', heal: 40, cooldown: 4, type: 'heal', description: '修复机械部件恢复生命' },
    { id: 'rage', name: '狂暴模式', attackBoost: 50, cooldown: 5, type: 'buff', duration: 3, description: '大幅提升攻击力' }
];

export const enemies = [
    { id: 'ant', name: '机械蚂蚁', icon: '🐜', hp: 60, attack: 15, defense: 5, speed: 20, skill: '群体攻击' },
    { id: 'spider', name: '数据蜘蛛', icon: '🕷️', hp: 80, attack: 20, defense: 10, speed: 15, skill: '蛛网束缚' },
    { id: 'scorpion', name: '毒刺蝎子', icon: '🦂', hp: 100, attack: 30, defense: 15, speed: 10, skill: '剧毒尾刺' },
    { id: 'fly', name: '高速飞虫', icon: '🪰', hp: 40, attack: 10, defense: 3, speed: 35, skill: '俯冲攻击' },
    { id: 'bee', name: '武装蜜蜂', icon: '🐝', hp: 70, attack: 25, defense: 8, speed: 25, skill: '蜂群突袭' },
    { id: 'beetle', name: '重甲甲虫', icon: '🪲', hp: 150, attack: 20, defense: 30, speed: 5, skill: '铁壁防御' },
    { id: 'worm', name: '地下蠕虫', icon: '🪱', hp: 90, attack: 22, defense: 12, speed: 12, skill: '地底突袭' },
    { id: 'snail', name: '装甲蜗牛', icon: '🐌', hp: 120, attack: 15, defense: 40, speed: 3, skill: '酸液喷射' },
    { id: 'ladybug', name: '炸弹瓢虫', icon: '🐞', hp: 50, attack: 40, defense: 5, speed: 18, skill: '自爆攻击' },
    { id: 'cricket', name: '声波蟋蟀', icon: '🦗', hp: 55, attack: 35, defense: 8, speed: 22, skill: '超声波攻击' },
    { id: 'dragonfly', name: '激光蜻蜓', icon: '🪰', hp: 65, attack: 28, defense: 6, speed: 30, skill: '激光扫射' },
    { id: 'centipede', name: '百足机甲', icon: '🐛', hp: 110, attack: 24, defense: 14, speed: 16, skill: '连续攻击' },
    { id: 'mantis', name: '双刀螳螂', icon: '🦗', hp: 95, attack: 38, defense: 12, speed: 22, skill: '双刀斩' }
];

export const versusOpponents = [
    {
        id: 'mantis',
        name: '双刀螳螂',
        icon: '🦗',
        hp: 200,
        maxHp: 200,
        attack: 35,
        defense: 15,
        speed: 25,
        skill: {
            name: '双刃旋风斩',
            damage: 50,
            cooldown: 3,
            description: '挥舞双刀造成毁灭性伤害'
        },
        skills: [
            { id: 'slash', name: '普通斩击', damage: 25, cooldown: 1 },
            { id: 'special', name: '双刃旋风斩', damage: 50, cooldown: 3 }
        ]
    },
    {
        id: 'bee',
        name: '蜂群女王',
        icon: '🐝',
        hp: 150,
        maxHp: 150,
        attack: 30,
        defense: 10,
        speed: 35,
        skill: {
            name: '蜂群轰炸',
            damage: 40,
            cooldown: 2,
            description: '召唤蜂群进行连续攻击'
        },
        skills: [
            { id: 'sting', name: '毒刺攻击', damage: 20, cooldown: 1 },
            { id: 'swarm', name: '蜂群轰炸', damage: 40, cooldown: 2 }
        ]
    },
    {
        id: 'beetle',
        name: '钢铁巨甲虫',
        icon: '🪲',
        hp: 300,
        maxHp: 300,
        attack: 25,
        defense: 30,
        speed: 10,
        skill: {
            name: '地震冲撞',
            damage: 60,
            cooldown: 4,
            description: '全身冲撞造成地震般的冲击'
        },
        skills: [
            { id: 'bash', name: '重型撞击', damage: 30, cooldown: 2 },
            { id: 'quake', name: '地震冲撞', damage: 60, cooldown: 4 }
        ]
    }
];

export const levels = [
    {
        id: 1,
        name: '沙漠战场',
        icon: '🏜️',
        theme: 'desert',
        description: '在炽热的沙漠中对抗机械蚁群',
        waves: 3,
        enemies: ['ant', 'scorpion', 'beetle'],
        obstacles: [
            { icon: '🌵', x: 200, y: 250 },
            { icon: '🏔️', x: 500, y: 300 },
            { icon: '💀', x: 700, y: 200 }
        ],
        powerups: [
            { type: 'heal', icon: '💚', x: 400, y: 150 },
            { type: 'attack', icon: '⚡', x: 600, y: 350 }
        ]
    },
    {
        id: 2,
        name: '草原战场',
        icon: '🌿',
        theme: 'grassland',
        description: '在茂密的草原上对抗各种昆虫',
        waves: 3,
        enemies: ['spider', 'cricket', 'ladybug', 'worm'],
        obstacles: [
            { icon: '🌳', x: 150, y: 200 },
            { icon: '🌲', x: 450, y: 280 },
            { icon: '🪨', x: 650, y: 180 }
        ],
        powerups: [
            { type: 'heal', icon: '💚', x: 300, y: 320 },
            { type: 'defense', icon: '🛡️', x: 550, y: 250 }
        ]
    },
    {
        id: 3,
        name: '月球战场',
        icon: '🌙',
        theme: 'moon',
        description: '在月球表面对抗外星虫族',
        waves: 4,
        enemies: ['fly', 'dragonfly', 'centipede', 'snail'],
        obstacles: [
            { icon: '🌑', x: 200, y: 220 },
            { icon: '☄️', x: 500, y: 300 },
            { icon: '🚀', x: 750, y: 180 }
        ],
        powerups: [
            { type: 'heal', icon: '💚', x: 350, y: 150 },
            { type: 'attack', icon: '⚡', x: 600, y: 350 }
        ]
    },
    {
        id: 4,
        name: '火星战场',
        icon: '🔴',
        theme: 'mars',
        description: '在火星上对抗最强的虫族首领',
        waves: 5,
        enemies: ['mantis', 'bee', 'beetle', 'scorpion', 'centipede'],
        obstacles: [
            { icon: '🪐', x: 180, y: 250 },
            { icon: '🌋', x: 480, y: 200 },
            { icon: '🛸', x: 720, y: 280 }
        ],
        powerups: [
            { type: 'heal', icon: '💚', x: 320, y: 320 },
            { type: 'attack', icon: '⚡', x: 580, y: 150 },
            { type: 'defense', icon: '🛡️', x: 400, y: 250 }
        ]
    }
];

export const powerupEffects = {
    heal: { type: 'heal', value: 50, name: '生命恢复' },
    attack: { type: 'attack', value: 20, duration: 3, name: '攻击增强' },
    defense: { type: 'defense', value: 20, duration: 3, name: '防御增强' }
};
