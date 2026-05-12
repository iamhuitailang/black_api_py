const BattleSystem = {
    player: null,
    enemy: null,
    isPlayerTurn: true,
    isPaused: false,
    battleLog: [],
    spellLevels: {},
    onBasicAttack: null,
    onTurnEnd: null,

    init: function(mageData, spellLevels, enemyData) {
        this.spellLevels = spellLevels;
        
        this.player = {
            ...mageData,
            currentHealth: mageData.maxHealth,
            currentMana: mageData.maxMana,
            armor: 0,
            armorDuration: 0
        };

        if (enemyData) {
            this.enemy = {
                ...enemyData,
                currentHealth: enemyData.maxHealth
            };
        } else {
            this.spawnEnemy();
        }

        this.isPlayerTurn = true;
        this.battleLog = [];
        this.addLog('战斗开始！');
        
        if (this.onTurnEnd) {
            this.onTurnEnd();
        }
    },

    spawnEnemy: function() {
        const enemyData = GameData.getRandomEnemy();
        this.enemy = {
            ...enemyData,
            currentHealth: enemyData.maxHealth
        };
    },

    addLog: function(message) {
        this.battleLog.push(message);
        if (this.battleLog.length > 50) {
            this.battleLog.shift();
        }
    },

    getAvailableSpells: function() {
        const availableSpells = [];
        for (const spellId of this.player.spells) {
            const spell = GameData.spells[spellId];
            if (spell && this.player.currentMana >= spell.cost) {
                availableSpells.push(spell);
            }
        }
        return availableSpells;
    },

    castPlayerSpell: function(spellId) {
        if (!this.isPlayerTurn || this.isPaused) return false;

        const spell = GameData.spells[spellId];
        if (!spell || this.player.currentMana < spell.cost) {
            return false;
        }

        this.player.currentMana -= spell.cost;

        const spellLevel = this.spellLevels[spellId] || 1;

        switch (spell.type) {
            case 'single':
            case 'aoe':
                const damage = GameData.getSpellDamage(spellId, spellLevel, this.player.element, this.enemy.element);
                const actualDamage = Math.max(0, damage - this.enemy.armor || 0);
                this.enemy.currentHealth -= actualDamage;
                this.addLog(`${this.player.name} 使用 ${spell.name}，造成 ${actualDamage} 点伤害！`);
                break;

            case 'chain':
                let totalDamage = 0;
                for (let i = 0; i < spell.bounces; i++) {
                    totalDamage += GameData.getSpellDamage(spellId, spellLevel, this.player.element, this.enemy.element);
                }
                const actualChainDamage = Math.max(0, totalDamage - this.enemy.armor || 0);
                this.enemy.currentHealth -= actualChainDamage;
                this.addLog(`${this.player.name} 使用 ${spell.name}，弹射 ${spell.bounces} 次，共造成 ${actualChainDamage} 点伤害！`);
                break;

            case 'heal':
                const healAmount = GameData.getSpellHeal(spellId, spellLevel);
                this.player.currentHealth = Math.min(this.player.maxHealth, this.player.currentHealth + healAmount);
                this.addLog(`${this.player.name} 使用 ${spell.name}，恢复 ${healAmount} 点生命！`);
                break;

            case 'shield':
                this.player.armor = spell.armor;
                this.player.armorDuration = spell.duration;
                this.addLog(`${this.player.name} 使用 ${spell.name}，获得 ${spell.armor} 点护甲，持续 ${spell.duration} 回合！`);
                break;
        }

        if (this.enemy.currentHealth <= 0) {
            this.enemy.currentHealth = 0;
            return 'victory';
        }

        this.isPlayerTurn = false;
        setTimeout(() => this.enemyTurn(), 1000);
        return 'success';
    },

    playerBasicAttack: function() {
        if (!this.isPlayerTurn || this.isPaused) return false;

        const baseDamage = 8 + Math.floor(Math.random() * 5);
        const actualDamage = Math.max(0, baseDamage - (this.enemy.armor || 0));
        this.enemy.currentHealth -= actualDamage;
        this.addLog(`${this.player.name} 使用法杖攻击，造成 ${actualDamage} 点伤害！`);

        if (this.enemy.currentHealth <= 0) {
            this.enemy.currentHealth = 0;
            return 'victory';
        }

        this.isPlayerTurn = false;
        setTimeout(() => this.enemyTurn(), 1000);
        return 'success';
    },

    enemyTurn: function() {
        if (this.isPaused) return;

        if (this.player.armorDuration > 0) {
            this.player.armorDuration--;
            if (this.player.armorDuration === 0) {
                this.player.armor = 0;
                this.addLog('护甲效果消失了');
            }
        }

        const spellId = this.enemy.spells[Math.floor(Math.random() * this.enemy.spells.length)];
        const spell = GameData.spells[spellId];

        if (spell) {
            if (spell.type === 'heal') {
                const healAmount = Math.floor(this.enemy.maxHealth * 0.2);
                this.enemy.currentHealth = Math.min(this.enemy.maxHealth, this.enemy.currentHealth + healAmount);
                this.addLog(`${this.enemy.name} 使用 ${spell.name}，恢复 ${healAmount} 点生命！`);
            } else {
                const damage = GameData.getSpellDamage(spellId, 1, this.enemy.element, this.player.element);
                const actualDamage = Math.max(0, damage - this.player.armor);
                this.player.currentHealth -= actualDamage;
                this.addLog(`${this.enemy.name} 使用 ${spell.name}，造成 ${actualDamage} 点伤害！`);
            }
        } else {
            const damage = this.enemy.attack;
            const actualDamage = Math.max(0, damage - this.player.armor);
            this.player.currentHealth -= actualDamage;
            this.addLog(`${this.enemy.name} 发动攻击，造成 ${actualDamage} 点伤害！`);
        }

        if (this.player.currentHealth <= 0) {
            this.player.currentHealth = 0;
            this.isPlayerTurn = true;
            return 'defeat';
        }

        this.player.currentMana = Math.min(this.player.maxMana, this.player.currentMana + 10);

        this.isPlayerTurn = true;
        
        if (this.onTurnEnd) {
            this.onTurnEnd();
        }
        
        return 'continue';
    },

    getRewards: function() {
        return {
            gold: this.enemy.goldReward,
            exp: this.enemy.expReward
        };
    },

    getBattleState: function() {
        return {
            player: this.player,
            enemy: this.enemy,
            isPlayerTurn: this.isPlayerTurn,
            battleLog: this.battleLog
        };
    },

    pause: function() {
        this.isPaused = true;
    },

    resume: function() {
        this.isPaused = false;
    },

    restoreBattle: function(battleData) {
        this.player = battleData.player;
        this.enemy = battleData.enemy;
        this.isPlayerTurn = battleData.isPlayerTurn;
        this.battleLog = battleData.battleLog || [];
    }
};