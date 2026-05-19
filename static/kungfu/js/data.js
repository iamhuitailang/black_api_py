const GameData = {
    characters: {
        monk: {
            id: 'monk',
            name: '少林武僧',
            icon: '👋',
            maxHealth: 100,
            attack: 11,
            defense: 6,
            speed: 4,
            jumpPower: 12,
            ultDamage: 24,
            skills: ['罗汉拳', '金刚冲击波'],
            colors: {
                body: '#d4a574',
                clothes: '#c41e3a',
                head: '#f5deb3'
            }
        },
        boxer: {
            id: 'boxer',
            name: '街头拳王',
            icon: '🥊',
            maxHealth: 92,
            attack: 15,
            defense: 4,
            speed: 3,
            jumpPower: 10,
            ultDamage: 30,
            skills: ['猛虎冲拳', '裂地重击'],
            colors: {
                body: '#d4a574',
                clothes: '#2c3e50',
                head: '#d4a574'
            }
        },
        swallow: {
            id: 'swallow',
            name: '女侠飞燕',
            icon: '👊',
            maxHealth: 88,
            attack: 9,
            defense: 5,
            speed: 6,
            jumpPower: 14,
            ultDamage: 21,
            skills: ['连环腿', '清风气功'],
            colors: {
                body: '#f5deb3',
                clothes: '#9b59b6',
                head: '#2c1810'
            }
        }
    },

    attacks: {
        lightPunch: {
            name: '轻拳',
            damage: 7,
            startup: 50,
            recovery: 150,
            range: 60,
            energyCost: 0,
            key: 'j'
        },
        heavyPunch: {
            name: '重拳',
            damage: 13,
            startup: 120,
            recovery: 250,
            range: 80,
            energyCost: 0,
            key: 'k'
        },
        lightKick: {
            name: '轻脚',
            damage: 6,
            startup: 70,
            recovery: 180,
            range: 85,
            energyCost: 0,
            key: 'u'
        },
        heavyKick: {
            name: '重脚',
            damage: 14,
            startup: 150,
            recovery: 280,
            range: 100,
            energyCost: 0,
            key: 'i'
        },
        ultimate: {
            name: '绝学',
            damage: 0,
            startup: 200,
            recovery: 400,
            range: 120,
            energyCost: 100,
            key: 'l'
        }
    },

    gameConfig: {
        canvasWidth: 960,
        canvasHeight: 540,
        groundY: 450,
        gravity: 0.6,
        roundTime: 99,
        maxEnergy: 100,
        energyOnHit: 15,
        energyOnBlock: 8,
        energyOnGetHit: 10
    },

    states: {
        IDLE: 'idle',
        WALKING: 'walking',
        JUMPING: 'jumping',
        CROUCHING: 'crouching',
        BLOCKING: 'blocking',
        ATTACKING: 'attacking',
        HURT: 'hurt',
        KNOCKDOWN: 'knockdown',
        DEAD: 'dead'
    }
};
