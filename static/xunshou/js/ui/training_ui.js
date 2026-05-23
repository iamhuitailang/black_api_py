const TrainingUI = {
    buttons: [],
    monsterButtons: [],
    actionButtons: [],
    selectedMonster: null,
    tab: 'team',

    init() {
        this.buttons = [];
        this.monsterButtons = [];
        this.actionButtons = [];
        this.selectedMonster = null;
    },

    render() {
        CanvasUtils.clear();
        this.drawBackground();

        this.drawTabs();

        if (this.tab === 'team') {
            this.renderTeam();
        } else if (this.tab === 'training') {
            this.renderTraining();
        }

        this.drawBackButton();
    },

    drawBackground() {
        const width = CanvasUtils.width;
        const height = CanvasUtils.height;

        CanvasUtils.drawGradientRect(0, 0, width, height, '#E3F2FD', '#BBDEFB');
    },

    drawTabs() {
        const tabs = [
            { id: 'team', label: '🐾 队伍管理', x: 100, y: 20, width: 150, height: 40 },
            { id: 'training', label: '⚡ 养成强化', x: 260, y: 20, width: 150, height: 40 }
        ];

        tabs.forEach(tab => {
            const isActive = this.tab === tab.id;
            CanvasUtils.drawRect(tab.x, tab.y, tab.width, tab.height, isActive ? '#2196F3' : '#90CAF9', 10);
            CanvasUtils.drawText(tab.label, tab.x + tab.width / 2, tab.y + tab.height / 2, {
                fontSize: 14,
                color: '#fff',
                align: 'center',
                baseline: 'middle',
                bold: true
            });

            this.buttons.push({
                ...tab,
                contains: (px, py) => px >= tab.x && px <= tab.x + tab.width && py >= tab.y && py <= tab.y + tab.height
            });
        });
    },

    renderTeam() {
        const team = TeamSystem.getTeam();

        CanvasUtils.drawText('我的队伍', CanvasUtils.width / 2, 90, {
            fontSize: 24,
            align: 'center',
            bold: true
        });

        this.monsterButtons = [];
        const cardWidth = 180;
        const cardHeight = 220;
        const startX = 100;
        const startY = 130;
        const gap = 30;

        for (let i = 0; i < 6; i++) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = startX + col * (cardWidth + gap);
            const y = startY + row * (cardHeight + gap);

            if (team[i]) {
                const monster = team[i];
                CanvasUtils.drawMonsterCard(x, y, cardWidth, cardHeight, monster, {
                    selected: this.selectedMonster && this.selectedMonster.instanceId === monster.instanceId
                });

                this.monsterButtons.push({
                    x, y, width: cardWidth, height: cardHeight,
                    monster: monster,
                    contains: (px, py) => px >= x && px <= x + cardWidth && py >= y && py <= y + cardHeight
                });

                if (this.selectedMonster && this.selectedMonster.instanceId === monster.instanceId) {
                    this.drawMonsterActions(x + cardWidth + 10, y);
                }
            } else {
                CanvasUtils.drawRect(x, y, cardWidth, cardHeight, 'rgba(200, 200, 200, 0.5)', 10);
                CanvasUtils.drawText('+ 添加异兽', x + cardWidth / 2, y + cardHeight / 2, {
                    fontSize: 16,
                    color: '#999',
                    align: 'center',
                    baseline: 'middle'
                });
            }
        }
    },

    drawMonsterActions(x, y) {
        if (!this.selectedMonster) return;

        CanvasUtils.drawRect(x, y, 300, 220, 'rgba(255, 255, 255, 0.9)', 10);

        CanvasUtils.drawText(this.selectedMonster.name, x + 15, y + 15, {
            fontSize: 18,
            bold: true
        });

        const stats = [
            `❤️ 生命: ${this.selectedMonster.currentHp}/${this.selectedMonster.maxHp}`,
            `⚔️ 攻击: ${this.selectedMonster.atk}`,
            `🛡️ 防御: ${this.selectedMonster.def}`,
            `⚡ 速度: ${this.selectedMonster.spd}`,
            `📊 等级: Lv.${this.selectedMonster.level}`,
            `✨ 经验: ${this.selectedMonster.exp}/${this.selectedMonster.expToNextLevel}`
        ];

        stats.forEach((stat, index) => {
            CanvasUtils.drawText(stat, x + 15, y + 45 + index * 22, {
                fontSize: 14
            });
        });

        this.actionButtons = [];
        
        this.actionButtons.push(
            CanvasUtils.drawButton(x + 15, y + 180, 90, 30, '🗑️ 移出', {
                bgColor: '#F44336',
                fontSize: 12
            })
        );

        this.actionButtons.push(
            CanvasUtils.drawButton(x + 115, y + 180, 90, 30, '❤️ 治疗', {
                bgColor: '#4CAF50',
                fontSize: 12
            })
        );

        this.actionButtons.push(
            CanvasUtils.drawButton(x + 215, y + 180, 70, 30, '⬆️ 升级', {
                bgColor: '#FF9800',
                fontSize: 12
            })
        );
    },

    renderTraining() {
        const team = TeamSystem.getTeam();

        CanvasUtils.drawText('养成强化', CanvasUtils.width / 2, 90, {
            fontSize: 24,
            align: 'center',
            bold: true
        });

        this.monsterButtons = [];
        const cardWidth = 150;
        const cardHeight = 180;
        const startX = 50;
        const startY = 130;
        const gap = 20;

        team.forEach((monster, index) => {
            const col = index % 6;
            const x = startX + col * (cardWidth + gap);
            const y = startY;

            CanvasUtils.drawMonsterCard(x, y, cardWidth, cardHeight, monster, {
                selected: this.selectedMonster && this.selectedMonster.instanceId === monster.instanceId
            });

            this.monsterButtons.push({
                x, y, width: cardWidth, height: cardHeight,
                monster: monster,
                contains: (px, py) => px >= x && px <= x + cardWidth && py >= y && py <= y + cardHeight
            });
        });

        if (this.selectedMonster) {
            this.drawTrainingPanel();
        } else {
            CanvasUtils.drawText('选择一只异兽进行养成', CanvasUtils.width / 2, 400, {
                fontSize: 18,
                color: '#666',
                align: 'center'
            });
        }
    },

    drawTrainingPanel() {
        const monster = this.selectedMonster;
        const x = 200;
        const y = 350;
        const width = 800;
        const height = 350;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.95)', 10);

        CanvasUtils.drawText(`${monster.name} - Lv.${monster.level}`, x + 20, y + 20, {
            fontSize: 24,
            bold: true
        });

        const evolutionPreview = TrainingSystem.getEvolutionPreview(monster);
        if (evolutionPreview) {
            CanvasUtils.drawText(`进化预览: ${evolutionPreview.emoji} ${evolutionPreview.name} (Lv.${evolutionPreview.level})`, x + 20, y + 55, {
                fontSize: 14,
                color: '#9C27B0'
            });
        }

        CanvasUtils.drawExpBar(x + 20, y + 85, 300, 20, monster.exp, monster.expToNextLevel);
        CanvasUtils.drawText(`经验: ${monster.exp}/${monster.expToNextLevel}`, x + 20, y + 110, {
            fontSize: 12,
            color: '#666'
        });

        const currentStats = [
            { label: '生命', value: monster.maxHp },
            { label: '攻击', value: monster.atk },
            { label: '防御', value: monster.def },
            { label: '速度', value: monster.spd }
        ];

        currentStats.forEach((stat, index) => {
            CanvasUtils.drawText(`${stat.label}: ${stat.value}`, x + 20 + (index % 2) * 200, y + 140 + Math.floor(index / 2) * 25, {
                fontSize: 14
            });
        });

        this.actionButtons = [];

        const trainCost = TrainingSystem.getTrainingCost(monster);
        this.actionButtons.push(
            CanvasUtils.drawButton(x + 20, y + 200, 200, 50, `⚡ 快速升级 (${trainCost.coins}💰)`, {
                bgColor: '#2196F3',
                fontSize: 14
            })
        );

        const items = GameState.state.player.items;
        const hasCandy = items.rare_candy > 0;
        this.actionButtons.push(
            CanvasUtils.drawButton(x + 240, y + 200, 200, 50, `🍬 神奇糖果 (x${items.rare_candy})`, {
                bgColor: hasCandy ? '#9C27B0' : '#999',
                fontSize: 14,
                disabled: !hasCandy
            })
        );

        this.actionButtons.push(
            CanvasUtils.drawButton(x + 460, y + 200, 150, 50, '❤️ 治疗', {
                bgColor: '#4CAF50',
                fontSize: 14
            })
        );

        const canEvolve = monster.level >= (evolutionPreview ? evolutionPreview.level : 999);
        this.actionButtons.push(
            CanvasUtils.drawButton(x + 630, y + 200, 150, 50, '🌟 进化', {
                bgColor: canEvolve ? '#FF9800' : '#999',
                fontSize: 14,
                disabled: !canEvolve || !evolutionPreview
            })
        );

        CanvasUtils.drawText('技能列表:', x + 20, y + 270, {
            fontSize: 16,
            bold: true
        });

        monster.skills.forEach((skillId, index) => {
            const skill = SkillData.getSkillById(skillId);
            if (skill) {
                const skillX = x + 20 + (index % 3) * 250;
                const skillY = y + 300;
                
                CanvasUtils.drawRect(skillX, skillY, 230, 30, MonsterData.typeColors[skill.type] || '#666', 5);
                CanvasUtils.drawText(`${skill.name} - ${skill.description}`, skillX + 10, skillY + 15, {
                    fontSize: 11,
                    color: '#fff',
                    baseline: 'middle',
                    maxWidth: 220
                });
            }
        });
    },

    drawBackButton() {
        this.backButton = CanvasUtils.drawButton(50, 50, 100, 40, '← 返回', {
            bgColor: '#607D8B'
        });
    },

    handleClick(x, y) {
        if (this.backButton && this.backButton.contains(x, y)) {
            GameState.setCurrentScreen('menu');
            return true;
        }

        for (const button of this.buttons) {
            if (button.contains(x, y)) {
                this.tab = button.id;
                this.selectedMonster = null;
                return true;
            }
        }

        for (const button of this.monsterButtons) {
            if (button.contains(x, y)) {
                this.selectedMonster = button.monster;
                return true;
            }
        }

        if (this.selectedMonster) {
            for (let i = 0; i < this.actionButtons.length; i++) {
                if (this.actionButtons[i] && this.actionButtons[i].contains(x, y)) {
                    if (this.tab === 'team') {
                        switch (i) {
                            case 0:
                                TeamSystem.removeFromTeam(this.selectedMonster);
                                this.selectedMonster = null;
                                break;
                            case 1:
                                TrainingSystem.healMonster(this.selectedMonster);
                                GameState.showNotification(`${this.selectedMonster.name} 已恢复!`);
                                break;
                            case 2:
                                if (TrainingSystem.trainMonster(this.selectedMonster, true)) {
                                    GameState.showNotification(`${this.selectedMonster.name} 升级了!`);
                                }
                                break;
                        }
                    } else if (this.tab === 'training') {
                        switch (i) {
                            case 0:
                                if (TrainingSystem.trainMonster(this.selectedMonster, true)) {
                                    GameState.showNotification(`${this.selectedMonster.name} 升级了!`);
                                }
                                break;
                            case 1:
                                if (TrainingSystem.trainMonster(this.selectedMonster, false)) {
                                    GameState.showNotification(`${this.selectedMonster.name} 升级了!`);
                                }
                                break;
                            case 2:
                                TrainingSystem.healMonster(this.selectedMonster);
                                GameState.showNotification(`${this.selectedMonster.name} 已恢复!`);
                                break;
                            case 3:
                                if (TrainingSystem.checkEvolution(this.selectedMonster)) {
                                    GameState.showNotification(`${this.selectedMonster.name} 进化了!`);
                                }
                                break;
                        }
                    }
                    return true;
                }
            }
        }

        return false;
    },

    handleMouseMove(x, y) {
        const allButtons = [...this.buttons, ...this.monsterButtons, ...this.actionButtons];
        if (this.backButton) allButtons.push(this.backButton);

        for (const button of allButtons) {
            if (button && button.contains && button.contains(x, y)) {
                CanvasUtils.canvas.style.cursor = 'pointer';
                return;
            }
        }
        CanvasUtils.canvas.style.cursor = 'default';
    }
};
