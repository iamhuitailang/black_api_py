const TrainingSystem = {
    onLevelUp: null,
    onEvolution: null,

    levelUp(monster) {
        monster.level++;
        this.recalculateStats(monster);
        
        if (this.onLevelUp) {
            this.onLevelUp(monster);
        }
        
        GameState.save();
        return true;
    },

    recalculateStats(monster) {
        const template = MonsterData.getMonsterById(monster.monsterId);
        const rarity = MonsterData.rarities[monster.rarity.toUpperCase()];
        const multiplier = rarity.multiplier;
        
        const hpDiff = monster.maxHp - monster.currentHp;
        
        monster.maxHp = Math.floor(template.baseStats.hp * multiplier * (1 + (monster.level - 1) * 0.1));
        monster.atk = Math.floor(template.baseStats.atk * multiplier * (1 + (monster.level - 1) * 0.08));
        monster.def = Math.floor(template.baseStats.def * multiplier * (1 + (monster.level - 1) * 0.06));
        monster.spd = Math.floor(template.baseStats.spd * multiplier * (1 + (monster.level - 1) * 0.05));
        
        monster.currentHp = Math.max(1, monster.maxHp - hpDiff);
        monster.expToNextLevel = monster.level * 100;
    },

    checkEvolution(monster) {
        const template = MonsterData.getMonsterById(monster.monsterId);
        if (!template.evolution) return false;
        
        if (monster.level >= template.evolution.level) {
            return this.evolve(monster, template.evolution.to);
        }
        return false;
    },

    evolve(monster, evolutionId) {
        const newTemplate = MonsterData.getMonsterById(evolutionId);
        if (!newTemplate) return false;
        
        monster.monsterId = evolutionId;
        monster.name = newTemplate.name;
        monster.type = newTemplate.type;
        monster.rarity = newTemplate.rarity;
        monster.skills = [...newTemplate.skills];
        monster.ultimate = newTemplate.ultimate;
        monster.emoji = newTemplate.emoji;
        monster.isEvolution = true;
        
        this.recalculateStats(monster);
        monster.currentHp = monster.maxHp;
        
        if (this.onEvolution) {
            this.onEvolution(monster);
        }
        
        GameState.showNotification(`${monster.name} 进化了!`);
        GameState.save();
        return true;
    },

    addExp(monster, amount) {
        monster.exp += amount;
        
        while (monster.exp >= monster.expToNextLevel) {
            monster.exp -= monster.expToNextLevel;
            this.levelUp(monster);
            this.checkEvolution(monster);
        }
        
        GameState.save();
        return true;
    },

    healMonster(monster) {
        monster.currentHp = monster.maxHp;
        monster.statusEffects = [];
        monster.ultimateCharge = 0;
        GameState.save();
    },

    healAllMonsters() {
        GameState.getTeamMonsters().forEach(monster => {
            this.healMonster(monster);
        });
        GameState.save();
    },

    getTrainingCost(monster) {
        const baseCost = monster.level * 50;
        return {
            coins: baseCost,
            items: { rare_candy: 1 }
        };
    },

    trainMonster(monster, useCoins = true) {
        const cost = this.getTrainingCost(monster);
        
        if (useCoins) {
            if (!GameState.spendCoins(cost.coins)) {
                return false;
            }
        } else {
            if (GameState.state.player.items.rare_candy <= 0) {
                GameState.showNotification('神奇糖果不足!');
                return false;
            }
            GameState.state.player.items.rare_candy--;
        }
        
        this.levelUp(monster);
        this.checkEvolution(monster);
        
        GameState.save();
        return true;
    },

    getEvolutionPreview(monster) {
        const template = MonsterData.getMonsterById(monster.monsterId);
        if (!template.evolution) return null;
        
        const evolutionTemplate = MonsterData.getMonsterById(template.evolution.to);
        return {
            name: evolutionTemplate.name,
            level: template.evolution.level,
            emoji: evolutionTemplate.emoji,
            type: evolutionTemplate.type,
            rarity: evolutionTemplate.rarity
        };
    }
};
