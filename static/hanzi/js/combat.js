const WordDatabase = {
    singleChars: ['龙', '凤', '儒', '烈', '天', '地', '人', '和', '道', '德', '仁', '义', '礼', '智', '信', '武', '文', '章', '画', '墨'],
    
    words: {
        '龙凤': true, '儒家': true, '烈火': true, '天地': true, '人和': true,
        '道德': true, '仁义': true, '礼仪': true, '智慧': true, '信义': true,
        '文武': true, '文章': true, '水墨': true, '龙凤呈祥': true, '龙飞凤舞': true,
        '凤毛麟角': true, '儒雅风流': true, '烈火真金': true, '天下无双': true
    },
    
    pinyinMap: {
        'long': '龙', 'feng': '凤', 'ru': '儒', 'lie': '烈',
        'tian': '天', 'di': '地', 'ren': '人', 'he': '和',
        'dao': '道', 'de': '德', 'ren2': '仁', 'yi': '义',
        'li': '礼', 'zhi': '智', 'xin': '信', 'wu': '武',
        'wen': '文', 'zhang': '章', 'hua': '画', 'mo': '墨'
    }
};

const AttackTypes = {
    SINGLE_CHAR: {
        name: '单字普攻',
        damage: 8,
        windup: 100,
        cooldown: 200,
        frameCount: 20
    },
    DOUBLE_WORD: {
        name: '双字组词',
        damage: 14,
        windup: 150,
        cooldown: 250,
        frameCount: 25
    },
    PINYIN: {
        name: '拼音攻击',
        damage: 7,
        windup: 80,
        cooldown: 180,
        frameCount: 18
    },
    ULTIMATE: {
        name: '必杀技',
        windup: 300,
        cooldown: 500,
        frameCount: 40
    }
};

const CombatSystem = {
    calculateDamage(attacker, defender, attackType, bonusDamage = 0) {
        const baseDamage = AttackTypes[attackType] ? AttackTypes[attackType].damage : bonusDamage;
        const totalDamage = baseDamage + attacker.attack - defender.defense;
        return Math.max(1, totalDamage);
    },
    
    applyDamage(target, damage) {
        target.health = Math.max(0, target.health - damage);
        target.isHit = true;
        target.hitFrame = 0;
        return target.health <= 0;
    },
    
    applyHeal(target, amount) {
        target.health = Math.min(target.maxHealth, target.health + amount);
    },
    
    checkSingleCharAttack(input) {
        return WordDatabase.singleChars.includes(input);
    },
    
    checkWordAttack(input) {
        return WordDatabase.words[input] || false;
    },
    
    checkPinyinAttack(input) {
        return WordDatabase.pinyinMap[input] || null;
    },
    
    determineAttackType(input) {
        if (input.length === 1 && this.checkSingleCharAttack(input)) {
            return 'SINGLE_CHAR';
        }
        if (input.length >= 2 && this.checkWordAttack(input)) {
            return 'DOUBLE_WORD';
        }
        const pinyinResult = this.checkPinyinAttack(input);
        if (pinyinResult) {
            return 'PINYIN';
        }
        return null;
    },
    
    updateSkillCooldowns(character, deltaTime) {
        for (const skill in character.skillCooldowns) {
            if (character.skillCooldowns[skill] > 0) {
                character.skillCooldowns[skill] = Math.max(0, character.skillCooldowns[skill] - deltaTime);
            }
        }
    },
    
    useSkill(character, skillKey) {
        if (character.skillCooldowns[skillKey] > 0) {
            return false;
        }
        const skill = character.skills[skillKey];
        character.skillCooldowns[skillKey] = skill.cooldown;
        return true;
    },
    
    createAttackEffect(attacker, attackType, text = '') {
        return {
            x: attacker.x,
            y: attacker.y,
            targetX: attacker.isPlayer ? attacker.x + 200 : attacker.x - 200,
            progress: 0,
            type: attackType,
            text: text,
            color: attacker.color,
            isPlayer: attacker.isPlayer
        };
    },
    
    createDamageNumber(x, y, damage, isHeal = false) {
        return {
            x: x,
            y: y,
            damage: damage,
            isHeal: isHeal,
            life: 60,
            velocityY: -2
        };
    }
};
