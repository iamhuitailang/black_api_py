const BattleSystem = {
    onBattleEnd: null,
    animationQueue: [],
    currentAnimation: null,

    initWildBattle(monster) {
        const playerMonsters = GameState.getAliveTeamMonsters();
        
        GameState.setBattleState({
            active: true,
            type: 'wild',
            wildMonster: monster,
            enemies: [monster],
            playerMonsters: playerMonsters,
            currentMonsterIndex: 0,
            currentTurn: 0,
            turnOrder: this.calculateTurnOrder(playerMonsters[0], monster),
            battleLog: [`野生的 ${monster.name} 出现了!`],
            selectedSkill: null,
            isPlayerTurn: true,
            phase: 'select_action',
            canCatch: true,
            canFlee: true
        });
    },

    initStageBattle(areaId, stageIndex) {
        const enemies = LevelData.getStageMonsters(areaId, stageIndex);
        const playerMonsters = GameState.getAliveTeamMonsters();

        GameState.setBattleState({
            active: true,
            type: 'stage',
            areaId: areaId,
            stageIndex: stageIndex,
            enemies: enemies,
            playerMonsters: playerMonsters,
            currentMonsterIndex: 0,
            currentEnemyIndex: 0,
            currentTurn: 0,
            turnOrder: this.calculateTurnOrder(playerMonsters[0], enemies[0]),
            battleLog: [`关卡战斗开始!`],
            selectedSkill: null,
            isPlayerTurn: true,
            phase: 'select_action',
            canCatch: false,
            canFlee: true
        });
    },

    initBossBattle(areaId) {
        const boss = LevelData.getBossMonster(areaId);
        const playerMonsters = GameState.getAliveTeamMonsters();

        GameState.setBattleState({
            active: true,
            type: 'boss',
            areaId: areaId,
            enemies: [boss],
            playerMonsters: playerMonsters,
            currentMonsterIndex: 0,
            currentEnemyIndex: 0,
            currentTurn: 0,
            turnOrder: this.calculateTurnOrder(playerMonsters[0], boss),
            battleLog: [`BOSS ${boss.name} 出现了!`],
            selectedSkill: null,
            isPlayerTurn: true,
            phase: 'select_action',
            canCatch: false,
            canFlee: false
        });
    },

    calculateTurnOrder(playerMonster, enemy) {
        if (playerMonster.spd >= enemy.spd) {
            return ['player', 'enemy'];
        }
        return ['enemy', 'player'];
    },

    selectSkill(skillId) {
        const battle = GameState.state.battle;
        const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];
        
        if (skillId === playerMonster.ultimate && playerMonster.ultimateCharge < playerMonster.ultimateMax) {
            GameState.showNotification('奥义能量不足!');
            return false;
        }

        battle.selectedSkill = skillId;
        battle.phase = 'confirm_action';
        return true;
    },

    executePlayerAction() {
        const battle = GameState.state.battle;
        const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];
        const enemy = battle.enemies[battle.currentEnemyIndex];
        const skillId = battle.selectedSkill;

        if (!skillId) return;

        const skill = SkillData.getSkillById(skillId);
        if (!skill) return;

        this.executeSkill(playerMonster, enemy, skill, true);

        if (skillId === playerMonster.ultimate) {
            playerMonster.ultimateCharge = 0;
        }

        if (this.checkBattleEnd()) return;

        battle.phase = 'enemy_turn';
    },

    executeEnemyAction() {
        const battle = GameState.state.battle;
        const enemy = battle.enemies[battle.currentEnemyIndex];
        const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];

        if (!enemy || enemy.currentHp <= 0) return;

        const skillId = this.decideEnemyAction(enemy, playerMonster);
        const skill = SkillData.getSkillById(skillId);

        if (skill) {
            this.executeSkill(enemy, playerMonster, skill, false);
        }

        this.checkBattleEnd();
    },

    decideEnemyAction(enemy, playerMonster) {
        const hpRatio = enemy.currentHp / enemy.maxHp;

        if (hpRatio < 0.3 && enemy.skills.includes('heal') && Math.random() < 0.4) {
            return 'heal';
        }

        if (hpRatio < 0.5 && enemy.skills.includes('defense') && Math.random() < 0.25) {
            return 'defense';
        }

        const elementSkills = enemy.skills.filter(s => {
            const skill = SkillData.getSkillById(s);
            return skill && skill.category === 'element';
        });

        if (elementSkills.length > 0) {
            for (const skillId of elementSkills) {
                const skill = SkillData.getSkillById(skillId);
                const advantage = MonsterData.getTypeAdvantage(skill.type, playerMonster.type);
                if (advantage > 1) {
                    return skillId;
                }
            }
        }

        return elementSkills[Math.floor(Math.random() * elementSkills.length)] || enemy.skills[0];
    },

    executeSkill(attacker, defender, skill, isPlayer) {
        const battle = GameState.state.battle;
        let message = `${attacker.name} 使用了 ${skill.name}!`;

        if (skill.category === 'heal') {
            const healAmount = skill.healAmount || 30;
            const actualHeal = Math.min(healAmount, attacker.maxHp - attacker.currentHp);
            attacker.currentHp += actualHeal;
            message += ` 恢复了 ${actualHeal} 点生命!`;
            
            if (skill.effect && skill.effect.status) {
                SkillData.applyStatusEffect(attacker, skill.effect.status);
                message += ` 获得了 ${SkillData.statusEffects[skill.effect.status.toUpperCase()].name} 效果!`;
            }
        } else if (skill.category === 'defense') {
            if (skill.effect && skill.effect.status) {
                SkillData.applyStatusEffect(attacker, skill.effect.status);
                message += ` 防御力提升了!`;
            }
        } else {
            const result = SkillData.calculateDamage(attacker, defender, skill);
            defender.currentHp = Math.max(0, defender.currentHp - result.damage);
            
            message += ` 造成了 ${result.damage} 点伤害!`;
            
            if (result.isCritical) {
                message += ' 属性克制!效果拔群!';
            } else if (result.typeAdvantage < 1) {
                message += ' 效果不佳...';
            }

            if (skill.effect && skill.effect.status && Math.random() < (skill.effect.chance || 1)) {
                SkillData.applyStatusEffect(defender, skill.effect.status);
                message += ` ${defender.name} 陷入了 ${SkillData.statusEffects[skill.effect.status.toUpperCase()].name} 状态!`;
            }

            attacker.ultimateCharge = Math.min(attacker.ultimateMax, attacker.ultimateCharge + 20);
        }

        battle.battleLog.push(message);

        if (defender.currentHp <= 0) {
            battle.battleLog.push(`${defender.name} 倒下了!`);
        }
    },

    processStartOfTurn(monster) {
        const results = SkillData.processStatusEffects(monster);
        const battle = GameState.state.battle;

        if (results.damage > 0) {
            monster.currentHp = Math.max(0, monster.currentHp - results.damage);
        }
        if (results.heal > 0) {
            monster.currentHp = Math.min(monster.maxHp, monster.currentHp + results.heal);
        }

        results.messages.forEach(msg => battle.battleLog.push(msg));

        return results.skipTurn;
    },

    checkBattleEnd() {
        const battle = GameState.state.battle;
        const aliveEnemies = battle.enemies.filter(e => e.currentHp > 0);
        const alivePlayerMonsters = battle.playerMonsters.filter(m => m.currentHp > 0);

        if (aliveEnemies.length === 0) {
            this.endBattle(true);
            return true;
        }

        if (alivePlayerMonsters.length === 0) {
            this.endBattle(false);
            return true;
        }

        return false;
    },

    endBattle(victory) {
        const battle = GameState.state.battle;
        
        if (victory) {
            battle.battleLog.push('你赢了!');
            
            let exp = 20;
            let coins = 50;
            
            if (battle.type === 'stage') {
                exp = 30 + battle.stageIndex * 10;
                coins = 50 + battle.stageIndex * 20;
                GameState.completeStage(battle.areaId, battle.stageIndex);
                
                const area = LevelData.getAreaById(battle.areaId);
                if (battle.stageIndex >= area.stages - 1) {
                    GameState.completeArea(battle.areaId);
                }
            } else if (battle.type === 'boss') {
                const area = LevelData.getAreaById(battle.areaId);
                exp = area.rewards.exp;
                coins = area.rewards.coins;
                GameState.completeArea(battle.areaId);
                
                area.rewards.items.forEach(itemId => {
                    GameState.addItem(itemId, 3);
                });
            } else if (battle.type === 'wild') {
                exp = 15;
                coins = 20;
            }

            GameState.addExp(exp);
            GameState.addCoins(coins);
            
            battle.playerMonsters.forEach(monster => {
                if (monster.currentHp > 0) {
                    monster.ultimateCharge = 0;
                }
            });

            if (this.onBattleEnd) {
                this.onBattleEnd({ victory: true, exp, coins });
            }
        } else {
            battle.battleLog.push('你输了...');
            
            if (this.onBattleEnd) {
                this.onBattleEnd({ victory: false });
            }
        }

        GameState.resetBattleState();
    },

    tryCatch(ballId) {
        const battle = GameState.state.battle;
        if (!battle.canCatch) return false;

        const ball = LevelData.getItemById(ballId);
        if (!ball || ball.type !== 'ball') return false;

        if (GameState.state.player.items[ballId] <= 0) {
            GameState.showNotification('道具不足!');
            return false;
        }

        GameState.state.player.items[ballId]--;

        const catchRate = LevelData.calculateCatchRate(ball, battle.wildMonster);
        const success = Math.random() < catchRate;

        if (success) {
            const monster = battle.wildMonster;
            monster.currentHp = monster.maxHp;
            monster.statusEffects = [];
            
            const added = GameState.addMonsterToTeam(monster);
            if (added) {
                battle.battleLog.push(`成功捕获了 ${monster.name}!`);
                this.endBattle(true);
            } else {
                battle.battleLog.push(`${monster.name} 已加入图鉴!`);
                GameState.addMonsterToCollection(monster);
                this.endBattle(true);
            }
            return true;
        } else {
            battle.battleLog.push('捕获失败...');
            battle.phase = 'enemy_turn';
            return true;
        }
    },

    tryFlee() {
        const battle = GameState.state.battle;
        if (!battle.canFlee) {
            GameState.showNotification('无法逃跑!');
            return false;
        }

        if (battle.type === 'wild') {
            const success = Math.random() < 0.7;
            if (success) {
                battle.battleLog.push('成功逃跑了!');
                this.endBattle(false);
                return true;
            } else {
                battle.battleLog.push('逃跑失败!');
                battle.phase = 'enemy_turn';
                return false;
            }
        } else {
            const success = Math.random() < 0.5;
            if (success) {
                battle.battleLog.push('成功逃跑了!');
                this.endBattle(false);
                return true;
            } else {
                battle.battleLog.push('逃跑失败!');
                battle.phase = 'enemy_turn';
                return false;
            }
        }
    },

    switchMonster(index) {
        const battle = GameState.state.battle;
        if (index < 0 || index >= battle.playerMonsters.length) return false;
        
        const monster = battle.playerMonsters[index];
        if (!monster || monster.currentHp <= 0) {
            GameState.showNotification('该异兽已无法战斗!');
            return false;
        }

        battle.currentMonsterIndex = index;
        battle.turnOrder = this.calculateTurnOrder(monster, battle.enemies[battle.currentEnemyIndex]);
        battle.battleLog.push(`${monster.name} 上场了!`);
        battle.phase = 'enemy_turn';
        return true;
    },

    switchToNextAliveMonster() {
        const battle = GameState.state.battle;
        for (let i = 0; i < battle.playerMonsters.length; i++) {
            if (battle.playerMonsters[i].currentHp > 0) {
                battle.currentMonsterIndex = i;
                battle.turnOrder = this.calculateTurnOrder(battle.playerMonsters[i], battle.enemies[battle.currentEnemyIndex]);
                battle.battleLog.push(`${battle.playerMonsters[i].name} 上场了!`);
                return true;
            }
        }
        return false;
    },

    switchToNextAliveEnemy() {
        const battle = GameState.state.battle;
        for (let i = 0; i < battle.enemies.length; i++) {
            if (battle.enemies[i].currentHp > 0) {
                battle.currentEnemyIndex = i;
                battle.turnOrder = this.calculateTurnOrder(battle.playerMonsters[battle.currentMonsterIndex], battle.enemies[i]);
                return true;
            }
        }
        return false;
    },

    nextTurn() {
        const battle = GameState.state.battle;
        
        const currentPlayerMonster = battle.playerMonsters[battle.currentMonsterIndex];
        if (currentPlayerMonster.currentHp <= 0) {
            if (!this.switchToNextAliveMonster()) {
                this.checkBattleEnd();
                return;
            }
        }

        const currentEnemy = battle.enemies[battle.currentEnemyIndex];
        if (currentEnemy.currentHp <= 0) {
            if (!this.switchToNextAliveEnemy()) {
                this.checkBattleEnd();
                return;
            }
        }

        const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];
        const enemy = battle.enemies[battle.currentEnemyIndex];
        battle.turnOrder = this.calculateTurnOrder(playerMonster, enemy);
        
        battle.currentTurn++;
        battle.selectedSkill = null;
        
        if (battle.turnOrder[0] === 'player') {
            battle.isPlayerTurn = true;
            battle.phase = 'select_action';
        } else {
            battle.isPlayerTurn = false;
            battle.phase = 'enemy_turn';
        }
    }
};
