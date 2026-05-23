const BattleUI = {
    buttons: [],
    skillButtons: [],
    actionButtons: [],
    itemButtons: [],
    monsterButtons: [],
    selectedAction: null,
    selectedItem: null,
    battleEndCallback: null,

    init() {
        this.buttons = [];
        this.skillButtons = [];
        this.actionButtons = [];
        this.itemButtons = [];
        this.monsterButtons = [];
        this.selectedAction = null;
        this.selectedItem = null;
    },

    render() {
        const battle = GameState.state.battle;
        if (!battle.active) {
            return;
        }

        CanvasUtils.clear();
        this.drawBattleBackground();

        const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];
        const enemy = battle.enemies[battle.currentEnemyIndex];

        this.drawMonster(enemy, true);
        this.drawMonster(playerMonster, false);

        this.drawMonsterInfo(enemy, true);
        this.drawMonsterInfo(playerMonster, false);

        this.drawBattleLog();

        if (battle.phase === 'select_action') {
            this.drawActionMenu();
        } else if (battle.phase === 'select_skill') {
            this.drawSkillMenu(playerMonster);
        } else if (battle.phase === 'select_item') {
            this.drawItemMenu();
        } else if (battle.phase === 'select_switch') {
            this.drawSwitchMenu();
        } else if (battle.phase === 'confirm_catch') {
            this.drawCatchMenu();
        }

        this.drawTurnIndicator();
    },

    drawBattleBackground() {
        const width = CanvasUtils.width;
        const height = CanvasUtils.height;

        const skyGradient = CanvasUtils.ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#E3F2FD');
        skyGradient.addColorStop(0.4, '#BBDEFB');
        skyGradient.addColorStop(0.7, '#C8E6C9');
        skyGradient.addColorStop(1, '#A5D6A7');
        CanvasUtils.ctx.fillStyle = skyGradient;
        CanvasUtils.ctx.fillRect(0, 0, width, height);

        const time = Date.now() / 3000;
        this.drawCloud(100 + Math.sin(time) * 10, 80, 60);
        this.drawCloud(400 + Math.sin(time + 1) * 15, 60, 50);
        this.drawCloud(700 + Math.sin(time + 2) * 12, 90, 55);
        this.drawCloud(1000 + Math.sin(time + 0.5) * 8, 70, 45);

        const hillGradient = CanvasUtils.ctx.createLinearGradient(0, height - 250, 0, height);
        hillGradient.addColorStop(0, '#A5D6A7');
        hillGradient.addColorStop(0.5, '#81C784');
        hillGradient.addColorStop(1, '#66BB6A');
        
        CanvasUtils.ctx.fillStyle = hillGradient;
        CanvasUtils.ctx.beginPath();
        CanvasUtils.ctx.moveTo(0, height - 200);
        CanvasUtils.ctx.quadraticCurveTo(width * 0.2, height - 280, width * 0.4, height - 220);
        CanvasUtils.ctx.quadraticCurveTo(width * 0.6, height - 170, width * 0.8, height - 230);
        CanvasUtils.ctx.quadraticCurveTo(width * 0.9, height - 250, width, height - 200);
        CanvasUtils.ctx.lineTo(width, height);
        CanvasUtils.ctx.lineTo(0, height);
        CanvasUtils.ctx.closePath();
        CanvasUtils.ctx.fill();

        const groundGradient = CanvasUtils.ctx.createLinearGradient(0, height - 180, 0, height);
        groundGradient.addColorStop(0, '#8BC34A');
        groundGradient.addColorStop(0.3, '#7CB342');
        groundGradient.addColorStop(1, '#689F38');
        
        CanvasUtils.ctx.fillStyle = groundGradient;
        CanvasUtils.ctx.fillRect(0, height - 180, width, 180);

        this.drawGrassDetails(width, height);
        this.drawFlowers(width, height);
        this.drawDecorativeElements(width, height);
    },

    drawCloud(x, y, size) {
        const ctx = CanvasUtils.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.15, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.7, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.35, y + size * 0.1, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    drawGrassDetails(width, height) {
        const ctx = CanvasUtils.ctx;
        ctx.save();
        ctx.strokeStyle = '#558B2F';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        for (let i = 0; i < 20; i++) {
            const x = 50 + i * 60 + Math.sin(i * 0.5) * 20;
            const y = height - 160 + Math.sin(i * 0.8) * 10;
            
            ctx.beginPath();
            ctx.moveTo(x, y + 10);
            ctx.quadraticCurveTo(x - 3, y - 5, x - 5, y - 15);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x, y + 10);
            ctx.quadraticCurveTo(x + 2, y - 8, x + 4, y - 18);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x, y + 10);
            ctx.quadraticCurveTo(x + 5, y - 3, x + 8, y - 12);
            ctx.stroke();
        }
        ctx.restore();
    },

    drawFlowers(width, height) {
        const ctx = CanvasUtils.ctx;
        const flowers = [
            { x: 100, y: height - 150, color: '#FFB6C1', center: '#FFD93D' },
            { x: 250, y: height - 140, color: '#CE93D8', center: '#FFF176' },
            { x: 450, y: height - 155, color: '#FFFFFF', center: '#FFD93D' },
            { x: 650, y: height - 145, color: '#FFB6C1', center: '#FFA500' },
            { x: 850, y: height - 150, color: '#90CAF9', center: '#FFD93D' },
            { x: 1050, y: height - 142, color: '#FFCDD2', center: '#FFE082' },
            { x: 1150, y: height - 148, color: '#C5E1A5', center: '#FFD93D' }
        ];

        ctx.save();
        flowers.forEach(flower => {
            for (let j = 0; j < 5; j++) {
                const angle = (j * Math.PI * 2) / 5;
                ctx.fillStyle = flower.color;
                ctx.beginPath();
                ctx.ellipse(
                    flower.x + Math.cos(angle) * 6,
                    flower.y + Math.sin(angle) * 6,
                    4, 6, angle, 0, Math.PI * 2
                );
                ctx.fill();
            }
            ctx.fillStyle = flower.center;
            ctx.beginPath();
            ctx.arc(flower.x, flower.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    },

    drawDecorativeElements(width, height) {
        const ctx = CanvasUtils.ctx;
        ctx.save();

        ctx.font = '28px Arial';
        ctx.fillText('\u{1F338}', 80, height - 165);
        ctx.fillText('\u{1F340}', 350, height - 170);
        ctx.fillText('\u{1F33F}', 550, height - 168);
        ctx.fillText('\u{1F344}', 750, height - 165);
        ctx.fillText('\u{1F33B}', 950, height - 170);
        ctx.fillText('\u{1F33C}', 1100, height - 165);

        const time = Date.now() / 1000;
        const butterflyX = 500 + Math.sin(time) * 100;
        const butterflyY = 300 + Math.cos(time * 1.5) * 30;
        ctx.font = '22px Arial';
        ctx.fillText('\u{1F98B}', butterflyX, butterflyY);

        const ladybugX = 800 + Math.sin(time * 0.7) * 50;
        ctx.font = '18px Arial';
        ctx.fillText('\u{1F41E}', ladybugX, height - 160);

        ctx.restore();
    },

    drawMonster(monster, isEnemy) {
        const x = isEnemy ? 850 : 250;
        const y = 350;
        const size = 120;

        MonsterRenderer.drawMonster(monster, x, y, size);
    },

    drawMonsterInfo(monster, isEnemy) {
        const width = 260;
        const height = 80;
        const y = 15;
        const x = isEnemy ? CanvasUtils.width - width - 15 : 15;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.95)', 12);
        CanvasUtils.drawStrokeRect(x, y, width, height, 'rgba(255, 193, 7, 0.6)', 2, 12);

        const rarityColor = MonsterData.rarities[monster.rarity.toUpperCase()].color;
        CanvasUtils.drawRect(x, y, width, 6, rarityColor, [12, 12, 0, 0]);

        CanvasUtils.drawText(monster.name, x + 10, y + 16, {
            fontSize: 14,
            bold: true
        });

        CanvasUtils.drawText(`Lv.${monster.level}`, x + 10, y + 36, {
            fontSize: 11,
            color: '#666'
        });

        const typeColor = MonsterData.typeColors[monster.type];
        CanvasUtils.drawRect(x + 85, y + 30, 50, 18, typeColor, 4);
        CanvasUtils.drawText(MonsterData.typeNames[monster.type], x + 110, y + 40, {
            fontSize: 10,
            color: '#fff',
            align: 'center',
            bold: true
        });

        CanvasUtils.drawHPBar(x + 10, y + 52, width - 20, 12, monster.currentHp, monster.maxHp);

        if (!isEnemy) {
            CanvasUtils.drawUltimateBar(x + 10, y + 68, width - 20, 5, monster.ultimateCharge, monster.ultimateMax);
        }
    },

    drawBattleLog() {
        const battle = GameState.state.battle;
        const x = 50;
        const y = 520;
        const width = 500;
        const height = 150;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.92)', 15);
        CanvasUtils.drawStrokeRect(x, y, width, height, 'rgba(100, 181, 246, 0.5)', 2, 15);

        CanvasUtils.drawText('📜 战斗记录', x + 15, y + 12, {
            fontSize: 15,
            color: '#1976d2',
            bold: true
        });

        const logs = battle.battleLog.slice(-5);
        logs.forEach((log, index) => {
            CanvasUtils.drawText(log, x + 15, y + 38 + index * 22, {
                fontSize: 13,
                color: '#555'
            });
        });
    },

    drawActionMenu() {
        const x = 600;
        const y = 520;
        const width = 550;
        const height = 150;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.95)', 15);
        CanvasUtils.drawStrokeRect(x, y, width, height, 'rgba(255, 183, 77, 0.5)', 2, 15);

        CanvasUtils.drawText('🎮 选择行动', x + 20, y + 18, {
            fontSize: 16,
            bold: true,
            color: '#e65100'
        });

        this.actionButtons = [];
        const buttonWidth = 120;
        const buttonHeight = 40;

        this.actionButtons.push(
            CanvasUtils.drawButton(x + 20, y + 50, buttonWidth, buttonHeight, '⚔️ 技能', {
                bgColor: '#F44336'
            })
        );

        this.actionButtons.push(
            CanvasUtils.drawButton(x + 150, y + 50, buttonWidth, buttonHeight, '🎒 道具', {
                bgColor: '#FF9800'
            })
        );

        this.actionButtons.push(
            CanvasUtils.drawButton(x + 280, y + 50, buttonWidth, buttonHeight, '🔄 换人', {
                bgColor: '#2196F3'
            })
        );

        const battle = GameState.state.battle;
        const canFlee = battle.canFlee;
        this.actionButtons.push(
            CanvasUtils.drawButton(x + 410, y + 50, buttonWidth, buttonHeight, '🏃 逃跑', {
                bgColor: canFlee ? '#9C27B0' : '#999',
                disabled: !canFlee
            })
        );

        const canCatch = battle.canCatch && battle.type === 'wild';
        this.actionButtons.push(
            CanvasUtils.drawButton(x + 20, y + 100, buttonWidth * 2 + 10, buttonHeight, '🔮 捕捉', {
                bgColor: canCatch ? '#4CAF50' : '#999',
                disabled: !canCatch
            })
        );
    },

    drawSkillMenu(monster) {
        const x = 600;
        const y = 520;
        const width = 550;
        const height = 150;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.9)', 10);

        CanvasUtils.drawText('选择技能', x + 20, y + 15, {
            fontSize: 16,
            bold: true
        });

        this.skillButtons = [];
        const buttonWidth = 120;
        const buttonHeight = 40;

        monster.skills.forEach((skillId, index) => {
            const skill = SkillData.getSkillById(skillId);
            if (skill) {
                const col = index % 4;
                const row = Math.floor(index / 4);
                this.skillButtons.push(
                    CanvasUtils.drawButton(x + 20 + col * (buttonWidth + 10), y + 45 + row * (buttonHeight + 10), buttonWidth, buttonHeight, skill.name, {
                        bgColor: MonsterData.typeColors[skill.type] || '#F44336'
                    })
                );
            }
        });

        if (monster.ultimate) {
            const ultimateSkill = SkillData.getSkillById(monster.ultimate);
            if (ultimateSkill) {
                const canUse = monster.ultimateCharge >= monster.ultimateMax;
                this.skillButtons.push(
                    CanvasUtils.drawButton(x + 20, y + 105, buttonWidth * 2 + 10, buttonHeight, `✨ ${ultimateSkill.name}`, {
                        bgColor: canUse ? '#FF9800' : '#999',
                        disabled: !canUse
                    })
                );
            }
        }

        this.skillButtons.push(
            CanvasUtils.drawButton(x + 420, y + 45, 100, buttonHeight, '返回', {
                bgColor: '#607D8B'
            })
        );
    },

    drawItemMenu() {
        const x = 600;
        const y = 520;
        const width = 550;
        const height = 150;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.9)', 10);

        CanvasUtils.drawText('选择道具', x + 20, y + 15, {
            fontSize: 16,
            bold: true
        });

        this.itemButtons = [];
        const items = GameState.state.player.items;
        const usableItems = ['potion', 'super_potion', 'hyper_potion', 'max_potion'];
        const buttonWidth = 120;
        const buttonHeight = 40;

        let itemIndex = 0;
        usableItems.forEach((itemId) => {
            if (items[itemId] > 0) {
                const item = LevelData.getItemById(itemId);
                const col = itemIndex % 4;
                const row = Math.floor(itemIndex / 4);
                this.itemButtons.push(
                    CanvasUtils.drawButton(x + 20 + col * (buttonWidth + 10), y + 45 + row * (buttonHeight + 10), buttonWidth, buttonHeight, `${item.name} x${items[itemId]}`, {
                        bgColor: '#4CAF50'
                    })
                );
                itemIndex++;
            }
        });

        this.itemButtons.push(
            CanvasUtils.drawButton(x + 420, y + 45, 100, buttonHeight, '返回', {
                bgColor: '#607D8B'
            })
        );
    },

    drawSwitchMenu() {
        const x = 600;
        const y = 520;
        const width = 550;
        const height = 150;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.9)', 10);

        CanvasUtils.drawText('选择异兽', x + 20, y + 15, {
            fontSize: 16,
            bold: true
        });

        this.monsterButtons = [];
        const battle = GameState.state.battle;
        const buttonWidth = 120;
        const buttonHeight = 50;

        battle.playerMonsters.forEach((monster, index) => {
            const col = index % 4;
            const canSwitch = monster.currentHp > 0 && index !== battle.currentMonsterIndex;
            const hpText = `${monster.currentHp}/${monster.maxHp}`;
            
            this.monsterButtons.push(
                CanvasUtils.drawButton(x + 20 + col * (buttonWidth + 10), y + 40, buttonWidth, buttonHeight, `${monster.name}\n${hpText}`, {
                    bgColor: canSwitch ? MonsterData.typeColors[monster.type] : '#999',
                    disabled: !canSwitch
                })
            );
        });

        this.monsterButtons.push(
            CanvasUtils.drawButton(x + 420, y + 95, 100, 40, '返回', {
                bgColor: '#607D8B'
            })
        );
    },

    drawCatchMenu() {
        const x = 600;
        const y = 520;
        const width = 550;
        const height = 150;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.9)', 10);

        CanvasUtils.drawText('选择捕捉球', x + 20, y + 15, {
            fontSize: 16,
            bold: true
        });

        this.itemButtons = [];
        const items = GameState.state.player.items;
        const balls = ['poke_ball', 'great_ball', 'ultra_ball', 'master_ball'];
        const buttonWidth = 120;
        const buttonHeight = 40;

        balls.forEach((ballId, index) => {
            if (items[ballId] > 0) {
                const ball = LevelData.getItemById(ballId);
                this.itemButtons.push(
                    CanvasUtils.drawButton(x + 20 + index * (buttonWidth + 10), y + 45, buttonWidth, buttonHeight, `${ball.name} x${items[ballId]}`, {
                        bgColor: '#4CAF50'
                    })
                );
            }
        });

        this.itemButtons.push(
            CanvasUtils.drawButton(x + 420, y + 95, 100, 40, '返回', {
                bgColor: '#607D8B'
            })
        );
    },

    drawTurnIndicator() {
        const battle = GameState.state.battle;
        const x = CanvasUtils.width / 2;
        const y = 110;

        if (battle.phase === 'select_action' || battle.phase === 'select_skill' || battle.phase === 'select_item' || battle.phase === 'select_switch' || battle.phase === 'confirm_catch') {
            CanvasUtils.drawRect(x - 60, y - 15, 120, 30, 'rgba(76, 175, 80, 0.95)', 15);
            CanvasUtils.drawText('你的回合', x, y, {
                fontSize: 14,
                color: '#fff',
                align: 'center',
                baseline: 'middle',
                bold: true
            });
        } else if (battle.phase === 'enemy_turn') {
            CanvasUtils.drawRect(x - 60, y - 15, 120, 30, 'rgba(244, 67, 54, 0.95)', 15);
            CanvasUtils.drawText('敌方回合', x, y, {
                fontSize: 14,
                color: '#fff',
                align: 'center',
                baseline: 'middle',
                bold: true
            });
        }
    },

    handleClick(x, y) {
        const battle = GameState.state.battle;

        if (battle.phase === 'select_action') {
            for (let i = 0; i < this.actionButtons.length; i++) {
                if (this.actionButtons[i] && this.actionButtons[i].contains(x, y)) {
                    switch (i) {
                        case 0:
                            battle.phase = 'select_skill';
                            break;
                        case 1:
                            battle.phase = 'select_item';
                            break;
                        case 2:
                            battle.phase = 'select_switch';
                            break;
                        case 3:
                            if (battle.canFlee) {
                                BattleSystem.tryFlee();
                            } else {
                                GameState.showNotification('无法逃跑!');
                            }
                            break;
                        case 4:
                            if (battle.canCatch) {
                                battle.phase = 'confirm_catch';
                            } else {
                                GameState.showNotification('无法捕捉!');
                            }
                            break;
                    }
                    return true;
                }
            }
        } else if (battle.phase === 'select_skill') {
            const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];
            const skillCount = playerMonster.skills.length;
            
            for (let i = 0; i < this.skillButtons.length; i++) {
                if (this.skillButtons[i] && this.skillButtons[i].contains(x, y)) {
                    if (i < skillCount) {
                        if (BattleSystem.selectSkill(playerMonster.skills[i])) {
                            BattleSystem.executePlayerAction();
                        }
                    } else if (i === skillCount && playerMonster.ultimate) {
                        if (playerMonster.ultimateCharge >= playerMonster.ultimateMax) {
                            if (BattleSystem.selectSkill(playerMonster.ultimate)) {
                                BattleSystem.executePlayerAction();
                            }
                        } else {
                            GameState.showNotification('奥义能量不足!');
                        }
                    } else if (i === this.skillButtons.length - 1) {
                        battle.phase = 'select_action';
                    }
                    return true;
                }
            }
        } else if (battle.phase === 'select_item') {
            for (let i = 0; i < this.itemButtons.length; i++) {
                if (this.itemButtons[i] && this.itemButtons[i].contains(x, y)) {
                    if (i === this.itemButtons.length - 1) {
                        battle.phase = 'select_action';
                    } else {
                        const items = GameState.state.player.items;
                        const usableItems = ['potion', 'super_potion', 'hyper_potion', 'max_potion'];
                        const availableItems = usableItems.filter(id => items[id] > 0);
                        if (availableItems[i]) {
                            const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];
                            GameState.useItem(availableItems[i], playerMonster);
                            battle.battleLog.push(`使用了 ${LevelData.getItemById(availableItems[i]).name}!`);
                            BattleSystem.nextTurn();
                        }
                    }
                    return true;
                }
            }
        } else if (battle.phase === 'select_switch') {
            for (let i = 0; i < this.monsterButtons.length; i++) {
                if (this.monsterButtons[i] && this.monsterButtons[i].contains(x, y)) {
                    if (i === this.monsterButtons.length - 1) {
                        battle.phase = 'select_action';
                    } else if (i < battle.playerMonsters.length) {
                        if (BattleSystem.switchMonster(i)) {
                            BattleSystem.nextTurn();
                        }
                    }
                    return true;
                }
            }
        } else if (battle.phase === 'confirm_catch') {
            for (let i = 0; i < this.itemButtons.length; i++) {
                if (this.itemButtons[i] && this.itemButtons[i].contains(x, y)) {
                    if (i === this.itemButtons.length - 1) {
                        battle.phase = 'select_action';
                    } else {
                        const items = GameState.state.player.items;
                        const balls = ['poke_ball', 'great_ball', 'ultra_ball', 'master_ball'];
                        const availableBalls = balls.filter(id => items[id] > 0);
                        if (availableBalls[i]) {
                            BattleSystem.tryCatch(availableBalls[i]);
                        }
                    }
                    return true;
                }
            }
        }

        return false;
    },

    handleMouseMove(x, y) {
        const allButtons = [...this.actionButtons, ...this.skillButtons, ...this.itemButtons, ...this.monsterButtons];
        for (const button of allButtons) {
            if (button && button.contains(x, y)) {
                CanvasUtils.canvas.style.cursor = 'pointer';
                return;
            }
        }
        CanvasUtils.canvas.style.cursor = 'default';
    }
};
