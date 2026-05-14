const CONFIG = {
    STORAGE_KEY: 'guangdeng_defense_save',
    
    GAME: {
        STARTING_GOLD: 200,
        STARTING_LIVES: 20,
        TOTAL_WAVES: 10,
        TICK_RATE: 60,
        PATH_WIDTH: 40
    },

    TOWERS: {
        arrow: {
            name: '箭塔',
            icon: '🏹',
            levels: [
                {
                    name: '游侠箭塔',
                    damage: { min: 6, max: 10 },
                    attackSpeed: 1.5,
                    range: 120,
                    cost: 70,
                    color: '#8B4513'
                },
                {
                    name: '神射手塔',
                    damage: { min: 12, max: 18 },
                    attackSpeed: 1.8,
                    range: 140,
                    cost: 160,
                    critChance: 0.2,
                    color: '#A0522D'
                },
                {
                    name: '狙击塔',
                    damage: { min: 25, max: 40 },
                    attackSpeed: 1.0,
                    range: 180,
                    cost: 300,
                    guaranteedHit: true,
                    color: '#CD853F'
                },
                {
                    name: '猎手哨站',
                    damage: { min: 40, max: 60 },
                    attackSpeed: 1.5,
                    range: 200,
                    cost: 500,
                    skill: 'piercing',
                    color: '#DAA520'
                }
            ]
        },
        barracks: {
            name: '兵营',
            icon: '⚔️',
            levels: [
                {
                    name: '民兵营',
                    soldierCount: 2,
                    soldierHP: 40,
                    soldierDamage: { min: 2, max: 4 },
                    cost: 70,
                    color: '#556B2F'
                },
                {
                    name: '步兵营',
                    soldierCount: 2,
                    soldierHP: 80,
                    soldierDamage: { min: 5, max: 8 },
                    armor: 5,
                    cost: 180,
                    color: '#6B8E23'
                },
                {
                    name: '骑士营',
                    soldierCount: 2,
                    soldierHP: 150,
                    soldierDamage: { min: 12, max: 18 },
                    charge: true,
                    cost: 320,
                    color: '#808000'
                },
                {
                    name: '皇家军营',
                    soldierCount: 3,
                    soldierHP: 200,
                    soldierDamage: { min: 20, max: 30 },
                    skill: 'shieldWall',
                    cost: 550,
                    color: '#9ACD32'
                }
            ]
        },
        magic: {
            name: '魔法塔',
            icon: '🔮',
            levels: [
                {
                    name: '巫师塔',
                    damage: { min: 12, max: 18 },
                    attackSpeed: 0.8,
                    range: 150,
                    cost: 100,
                    ignoreArmor: false,
                    color: '#4B0082'
                },
                {
                    name: '法师塔',
                    damage: { min: 25, max: 35 },
                    attackSpeed: 0.8,
                    range: 160,
                    cost: 220,
                    ignoreArmor: true,
                    color: '#6A5ACD'
                },
                {
                    name: '大法师塔',
                    damage: { min: 45, max: 60 },
                    attackSpeed: 0.8,
                    range: 180,
                    cost: 380,
                    chainLightning: 3,
                    color: '#7B68EE'
                },
                {
                    name: '奥术学院',
                    damage: { min: 70, max: 90 },
                    attackSpeed: 1.0,
                    range: 200,
                    cost: 620,
                    skill: 'teleport',
                    color: '#9370DB'
                }
            ]
        },
        cannon: {
            name: '炮塔',
            icon: '💣',
            levels: [
                {
                    name: '投石车',
                    damage: { min: 20, max: 30 },
                    attackSpeed: 0.6,
                    range: 140,
                    splashRadius: 50,
                    cost: 120,
                    color: '#696969'
                },
                {
                    name: '迫击炮',
                    damage: { min: 35, max: 50 },
                    attackSpeed: 0.6,
                    range: 150,
                    splashRadius: 60,
                    cost: 260,
                    color: '#808080'
                },
                {
                    name: '榴弹炮',
                    damage: { min: 60, max: 80 },
                    attackSpeed: 0.6,
                    range: 160,
                    splashRadius: 70,
                    burnDamage: 5,
                    cost: 420,
                    color: '#A9A9A9'
                },
                {
                    name: '巨炮工坊',
                    damage: { min: 90, max: 120 },
                    attackSpeed: 0.8,
                    range: 180,
                    splashRadius: 80,
                    skill: 'orbital',
                    cost: 700,
                    color: '#C0C0C0'
                }
            ]
        }
    },

    ENEMIES: {
        goblin: {
            name: '哥布林',
            hp: 15,
            armor: 0,
            speed: 2.5,
            reward: 10,
            color: '#32CD32',
            size: 15
        },
        orc: {
            name: '兽人战士',
            hp: 80,
            armor: 5,
            speed: 1.5,
            reward: 25,
            color: '#8B0000',
            size: 20
        },
        troll: {
            name: '巨魔',
            hp: 200,
            armor: 2,
            speed: 1.0,
            reward: 50,
            color: '#556B2F',
            size: 25
        },
        skeleton: {
            name: '亡灵',
            hp: 40,
            armor: 0,
            speed: 1.8,
            reward: 15,
            canRevive: true,
            color: '#F5F5DC',
            size: 16
        },
        gargoyle: {
            name: '石像鬼',
            hp: 60,
            armor: 8,
            speed: 2.0,
            reward: 30,
            flying: true,
            color: '#708090',
            size: 18
        },
        wolfRider: {
            name: '狼骑兵',
            hp: 100,
            armor: 4,
            speed: 3.0,
            reward: 40,
            color: '#4B0082',
            size: 22
        },
        shaman: {
            name: '萨满',
            hp: 70,
            armor: 0,
            speed: 1.5,
            reward: 35,
            healAura: 3,
            healRadius: 80,
            color: '#800080',
            size: 18
        },
        trollChief: {
            name: '巨魔酋长',
            hp: 800,
            armor: 10,
            speed: 0.8,
            reward: 200,
            isBoss: true,
            stunAttack: true,
            color: '#8B4513',
            size: 35
        },
        necromancer: {
            name: '亡灵巫师',
            hp: 500,
            armor: 5,
            speed: 1.0,
            reward: 250,
            isBoss: true,
            summonSkeletons: true,
            rangedAttack: true,
            color: '#2F4F4F',
            size: 30
        },
        dragon: {
            name: '黑龙',
            hp: 1200,
            armor: 15,
            speed: 1.2,
            reward: 400,
            isBoss: true,
            flying: true,
            fireBreath: true,
            color: '#1a1a2e',
            size: 40
        },
        rockGiant: {
            name: '岩石巨人',
            hp: 1500,
            armor: 30,
            speed: 0.6,
            reward: 500,
            isBoss: true,
            magicImmune: true,
            color: '#4a4a4a',
            size: 45
        }
    },

    HEROES: {
        gerard: {
            name: '杰拉德爵士',
            type: 'knight',
            hp: 200,
            maxHp: 200,
            damage: { min: 15, max: 25 },
            attackSpeed: 1.0,
            speed: 2.0,
            range: 40,
            skill: {
                name: '英勇冲锋',
                cooldown: 15,
                damage: 50,
                knockback: 50
            },
            color: '#4169E1',
            unlocked: true
        },
        alleria: {
            name: '艾莉瑞亚',
            type: 'ranger',
            hp: 150,
            maxHp: 150,
            damage: { min: 20, max: 30 },
            attackSpeed: 1.5,
            speed: 2.5,
            range: 150,
            skill: {
                name: '箭雨',
                cooldown: 12,
                damage: 80,
                radius: 100
            },
            color: '#228B22',
            unlocked: false,
            unlockWave: 2
        },
        magnus: {
            name: '马格努斯',
            type: 'mage',
            hp: 120,
            maxHp: 120,
            damage: { min: 30, max: 45 },
            attackSpeed: 0.8,
            speed: 1.8,
            range: 140,
            skill: {
                name: '火球术',
                cooldown: 10,
                damage: 150,
                radius: 60
            },
            color: '#FF4500',
            unlocked: false,
            unlockWave: 5
        },
        ingvar: {
            name: '英格瓦',
            type: 'berserker',
            hp: 250,
            maxHp: 250,
            damage: { min: 20, max: 35 },
            attackSpeed: 1.2,
            speed: 2.2,
            range: 45,
            skill: {
                name: '旋风斩',
                cooldown: 14,
                damagePerTick: 30,
                duration: 3,
                radius: 60
            },
            color: '#B22222',
            unlocked: false,
            unlockWave: 8
        },
        orlok: {
            name: '奥洛克',
            type: 'necromancer',
            hp: 180,
            maxHp: 180,
            damage: { min: 25, max: 40 },
            attackSpeed: 1.0,
            speed: 2.0,
            range: 120,
            skill: {
                name: '召唤骷髅',
                cooldown: 20,
                skeletonCount: 3,
                skeletonHP: 50,
                skeletonDamage: { min: 8, max: 12 }
            },
            color: '#4B0082',
            unlocked: false,
            hidden: true
        }
    },

    WAVES: [
        { enemies: [{ type: 'goblin', count: 8 }], delay: 1000 },
        { enemies: [{ type: 'goblin', count: 10 }, { type: 'orc', count: 3 }], delay: 900 },
        { enemies: [{ type: 'goblin', count: 8 }, { type: 'orc', count: 5 }, { type: 'wolfRider', count: 2 }], delay: 850 },
        { enemies: [{ type: 'orc', count: 8 }, { type: 'skeleton', count: 5 }], delay: 800 },
        { enemies: [{ type: 'troll', count: 2 }, { type: 'orc', count: 6 }, { type: 'gargoyle', count: 3 }], delay: 750, boss: 'trollChief' },
        { enemies: [{ type: 'gargoyle', count: 6 }, { type: 'shaman', count: 2 }, { type: 'wolfRider', count: 4 }], delay: 700 },
        { enemies: [{ type: 'troll', count: 4 }, { type: 'skeleton', count: 8 }, { type: 'shaman', count: 3 }], delay: 650 },
        { enemies: [{ type: 'gargoyle', count: 8 }, { type: 'wolfRider', count: 6 }, { type: 'orc', count: 5 }], delay: 600, boss: 'necromancer' },
        { enemies: [{ type: 'troll', count: 6 }, { type: 'gargoyle', count: 8 }, { type: 'shaman', count: 4 }, { type: 'wolfRider', count: 5 }], delay: 550 },
        { enemies: [{ type: 'troll', count: 8 }, { type: 'gargoyle', count: 10 }, { type: 'shaman', count: 5 }], delay: 500, boss: 'dragon', boss2: 'rockGiant' }
    ]
};
