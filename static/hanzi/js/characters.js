const Characters = {
    龙: {
        name: '龙字',
        type: '均衡型',
        maxHealth: 100,
        attack: 12,
        defense: 5,
        wordSpeed: 'medium',
        ultimateDamage: 25,
        skills: {
            ultimate1: { name: '龙腾万里', damage: 25, cooldown: 15000 },
            ultimate2: { name: '一字千钧', damage: 20, cooldown: 10000 }
        },
        color: '#1a5f7a'
    },
    凤: {
        name: '凤字',
        type: '敏捷型',
        maxHealth: 90,
        attack: 10,
        defense: 6,
        wordSpeed: 'fast',
        ultimateDamage: 22,
        skills: {
            ultimate1: { name: '凤舞九天', damage: 22, cooldown: 12000 },
            ultimate2: { name: '双字连击', damage: 18, cooldown: 8000 }
        },
        color: '#c41e3a'
    },
    儒: {
        name: '儒字',
        type: '防御型',
        maxHealth: 110,
        attack: 8,
        defense: 8,
        wordSpeed: 'medium',
        ultimateDamage: 20,
        skills: {
            ultimate1: { name: '儒雅护盾', damage: 10, cooldown: 18000, heal: 15 },
            ultimate2: { name: '组词反击', damage: 20, cooldown: 12000 }
        },
        color: '#2e7d32'
    },
    烈: {
        name: '烈字',
        type: '攻击型',
        maxHealth: 95,
        attack: 15,
        defense: 4,
        wordSpeed: 'slow',
        ultimateDamage: 30,
        skills: {
            ultimate1: { name: '烈火燎原', damage: 30, cooldown: 20000 },
            ultimate2: { name: '多词轰炸', damage: 25, cooldown: 15000 }
        },
        color: '#ff5722'
    }
};

const CharacterFactory = {
    create(charKey, isPlayer = true, canvasWidth) {
        const template = Characters[charKey];
        return {
            char: charKey,
            name: template.name,
            type: template.type,
            maxHealth: template.maxHealth,
            health: template.maxHealth,
            attack: template.attack,
            defense: template.defense,
            wordSpeed: template.wordSpeed,
            ultimateDamage: template.ultimateDamage,
            skills: JSON.parse(JSON.stringify(template.skills)),
            skillCooldowns: { ultimate1: 0, ultimate2: 0 },
            color: template.color,
            x: isPlayer ? canvasWidth * 0.2 : canvasWidth * 0.8,
            y: 0,
            velocityX: 0,
            velocityY: 0,
            isAttacking: false,
            attackType: null,
            attackFrame: 0,
            isHit: false,
            hitFrame: 0,
            isPlayer: isPlayer
        };
    }
};
