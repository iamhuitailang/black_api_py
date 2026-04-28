// 海盗来了 · 宝藏争夺战 - 游戏主逻辑

class PirateGame {
    constructor() {
        this.gameState = null;
        this.characters = {};
        this.wheelCanvas = null;
        this.wheelContext = null;
        this.currentRotation = 0;
        this.isSpinning = false;
        
        this.init();
    }

    async init() {
        this.loadGame();
        this.setupDOM();
        this.setupCanvas();
        this.setupEventListeners();
        
        // 检查是否有待处理的转盘结果
        let hasPendingSpin = false;
        let pendingResult = null;
        
        // 更严格地检查待处理状态
        if (typeof this.gameState.hasPendingSpin === 'boolean' && 
            this.gameState.hasPendingSpin === true &&
            typeof this.gameState.pendingResultId === 'string' &&
            this.gameState.pendingResultId.length > 0 &&
            typeof this.gameState.pendingCharacterId === 'string' &&
            this.gameState.pendingCharacterId.length > 0 &&
            typeof this.gameState.pendingTargetRotation === 'number') {
            
            hasPendingSpin = true;
            
            // 根据 ID 获取完整的 result 对象
            pendingResult = GameData.wheel.segments.find(s => s.id === this.gameState.pendingResultId);
            
            if (pendingResult) {
                // 恢复到最终的旋转角度
                this.currentRotation = this.gameState.pendingTargetRotation;
            } else {
                // 如果没有找到 result，清除无效的待处理状态
                this.clearPendingSpinState();
                hasPendingSpin = false;
            }
        }
        
        this.renderWheel();
        
        // 检查游戏是否已开始
        const isGameActive = this.gameState.isStarted === true && 
                            this.gameState.isGameOver !== true;
        
        if (isGameActive) {
            this.showGameScreen();
            this.updateAllUI();
            
            // 如果有待处理的转盘结果，处理它
            if (hasPendingSpin && pendingResult) {
                // 禁用按钮，直到处理完成
                if (this.spinBtn) {
                    this.spinBtn.disabled = true;
                }
                this.disableShopButtons();
                
                await this.handlePendingSpin(pendingResult);
            }
        } else {
            // 如果有待处理状态但游戏没有开始，清除无效状态
            if (hasPendingSpin) {
                this.clearPendingSpinState();
            }
            this.showStartScreen();
        }
    }

    clearPendingSpinState() {
        this.gameState.hasPendingSpin = false;
        this.gameState.pendingTargetRotation = 0;
        this.gameState.pendingResultId = null;
        this.gameState.pendingCharacterId = null;
        this.saveGame();
    }

    loadGame() {
        const savedState = Utils.loadFromStorage(GameData.storageKeys.gameState, null);
        
        if (savedState) {
            this.gameState = savedState.gameState;
            this.characters = savedState.characters;
            if (savedState.currentRotation !== undefined) {
                this.currentRotation = savedState.currentRotation;
            }
            this.isSpinning = false;
        } else {
            this.initNewGame();
        }
    }

    async handlePendingSpin(result) {
        const characterId = this.gameState.pendingCharacterId;
        
        // 清除待处理状态
        this.clearPendingSpinState();
        
        // 添加日志说明
        this.addLog('📋 恢复上次的转盘结果...', 'player-action');
        
        // 处理结果
        await this.handleSpinResult(result, characterId);
    }

    initNewGame() {
        this.gameState = Utils.deepClone(GameData.initialGameState);
        this.characters = {};
        
        Object.keys(GameData.characters).forEach(key => {
            const charConfig = GameData.characters[key];
            this.characters[key] = {
                ...Utils.deepClone(GameData.initialCharacterState),
                ...charConfig,
                hp: charConfig.maxHp,
                maxHp: charConfig.maxHp,
                gold: charConfig.baseGold,
                baseAttack: charConfig.baseAttack
            };
        });
    }

    saveGame() {
        const saveData = {
            gameState: this.gameState,
            characters: this.characters,
            currentRotation: this.currentRotation
        };
        Utils.saveToStorage(GameData.storageKeys.gameState, saveData);
    }

    setupDOM() {
        // 屏幕元素
        this.startScreen = Utils.$('#start-screen');
        this.gameScreen = Utils.$('#game-screen');
        this.resultScreen = Utils.$('#result-screen');
        
        // 按钮元素
        this.startBtn = Utils.$('#start-btn');
        this.pauseBtn = Utils.$('#pause-btn');
        this.restartBtn = Utils.$('#restart-btn');
        this.spinBtn = Utils.$('#spin-btn');
        this.playAgainBtn = Utils.$('#play-again-btn');
        
        // 商店按钮
        this.buyAttackBtn = Utils.$('#buy-attack');
        this.buyShieldBtn = Utils.$('#buy-shield');
        this.buyPotionBtn = Utils.$('#buy-potion');
        
        // 结果元素
        this.resultTitle = Utils.$('#result-title');
        this.resultMessage = Utils.$('#result-message');
        this.resultStats = Utils.$('#result-stats');
        
        // 日志容器
        this.logContainer = Utils.$('#log-container');
    }

    setupCanvas() {
        this.wheelCanvas = Utils.$('#wheel-canvas');
        this.wheelContext = this.wheelCanvas.getContext('2d');
    }

    setupEventListeners() {
        Utils.on(this.startBtn, 'click', () => this.startGame());
        Utils.on(this.pauseBtn, 'click', () => this.togglePause());
        Utils.on(this.restartBtn, 'click', () => this.restartGame());
        Utils.on(this.spinBtn, 'click', () => this.spinWheel());
        Utils.on(this.playAgainBtn, 'click', () => this.restartGame());
        
        // 商店按钮
        Utils.on(this.buyAttackBtn, 'click', () => this.buyItem('forceAttack'));
        Utils.on(this.buyShieldBtn, 'click', () => this.buyItem('shield'));
        Utils.on(this.buyPotionBtn, 'click', () => this.buyItem('potion'));
    }

    showStartScreen() {
        Utils.hide(this.gameScreen);
        Utils.hide(this.resultScreen);
        Utils.show(this.startScreen);
    }

    showGameScreen() {
        Utils.hide(this.startScreen);
        Utils.hide(this.resultScreen);
        Utils.show(this.gameScreen);
    }

    showResultScreen(isWin) {
        Utils.hide(this.startScreen);
        Utils.hide(this.gameScreen);
        Utils.show(this.resultScreen);
        
        if (isWin) {
            this.resultTitle.textContent = '🏆 胜利！🏆';
            this.resultTitle.className = 'win';
            this.resultMessage.textContent = '恭喜你成为了海盗王！所有敌人都被你击败了！';
        } else {
            this.resultTitle.textContent = '💀 失败 💀';
            this.resultTitle.className = 'lose';
            this.resultMessage.textContent = '你被击败了...但海盗的精神永不放弃！';
        }
        
        this.updateResultStats();
    }

    updateResultStats() {
        let statsHtml = '';
        statsHtml += `<p>🎯 回合数: ${this.gameState.turnCount}</p>`;
        statsHtml += `<p>💰 最终金币: ${this.characters.player.gold}</p>`;
        statsHtml += `<p>❤️ 最终生命值: ${Math.max(0, this.characters.player.hp)}</p>`;
        
        const aliveEnemies = Object.values(this.characters).filter(c => c.type === 'enemy' && !c.isDead).length;
        statsHtml += `<p>⚔️ 剩余敌人: ${aliveEnemies}</p>`;
        
        this.resultStats.innerHTML = statsHtml;
    }

    startGame() {
        this.initNewGame();
        this.gameState.isStarted = true;
        this.gameState.logs = ['游戏开始！准备战斗！'];
        
        this.showGameScreen();
        this.updateAllUI();
        this.saveGame();
        
        this.addLog('🎮 海盗船长，轮到你了！转动转盘开始战斗吧！', 'player-action');
    }

    togglePause() {
        if (this.isSpinning) return;
        
        this.gameState.isPaused = !this.gameState.isPaused;
        
        if (this.gameState.isPaused) {
            this.pauseBtn.textContent = '▶️ 继续';
            this.spinBtn.disabled = true;
            this.disableShopButtons();
            this.addLog('⏸️ 游戏暂停', 'player-action');
        } else {
            this.pauseBtn.textContent = '⏸️ 暂停';
            this.spinBtn.disabled = false;
            this.updateShopButtons();
            this.addLog('▶️ 游戏继续', 'player-action');
        }
        
        this.saveGame();
    }

    restartGame() {
        this.initNewGame();
        this.gameState.isStarted = true;
        this.gameState.logs = ['游戏重新开始！准备战斗！'];
        
        this.pauseBtn.textContent = '⏸️ 暂停';
        this.spinBtn.disabled = false;
        
        this.showGameScreen();
        this.updateAllUI();
        this.saveGame();
        
        this.addLog('🎮 新的战斗开始！海盗船长，轮到你了！', 'player-action');
    }

    // 转盘相关方法
    renderWheel() {
        const ctx = this.wheelContext;
        const canvas = this.wheelCanvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const pointerHeight = 35;
        const radius = Math.min(centerX, centerY) - pointerHeight - 15;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制转盘背景
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF8DC';
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 5;
        ctx.stroke();
        
        // 绘制转盘扇区
        const segments = GameData.wheel.segments;
        const segmentAngle = (Math.PI * 2) / segments.length;
        
        segments.forEach((segment, index) => {
            const startAngle = index * segmentAngle + this.currentRotation;
            const endAngle = (index + 1) * segmentAngle + this.currentRotation;
            
            // 绘制扇区
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius - 5, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制图标
            const iconAngle = startAngle + segmentAngle / 2;
            const iconRadius = radius * 0.6;
            const iconX = centerX + Math.cos(iconAngle) * iconRadius;
            const iconY = centerY + Math.sin(iconAngle) * iconRadius;
            
            ctx.save();
            ctx.translate(iconX, iconY);
            ctx.rotate(iconAngle + Math.PI / 2);
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFF';
            ctx.fillText(segment.icon, 0, 0);
            ctx.restore();
        });
        
        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 绘制指针（指向转盘，顶点在转盘边缘）
        const pointerTopY = centerY - radius - pointerHeight;  // 上方，远离转盘（底边位置）
        const pointerBottomY = centerY - radius + 5;           // 下方，靠近转盘边缘（顶点位置）
        
        // 确保指针不超出 canvas 顶部
        const adjustedTopY = Math.max(10, pointerTopY);
        
        ctx.beginPath();
        ctx.moveTo(centerX, pointerBottomY);       // 顶点：下方，靠近转盘边缘（指向转盘）
        ctx.lineTo(centerX - 12, adjustedTopY);    // 左下：上方，远离转盘
        ctx.lineTo(centerX + 12, adjustedTopY);    // 右下：上方，远离转盘
        ctx.closePath();
        ctx.fillStyle = '#FF6B6B';
        ctx.fill();
        ctx.strokeStyle = '#C0392B';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制指针顶部的小圆点（靠近转盘的位置）
        ctx.beginPath();
        ctx.arc(centerX, pointerBottomY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#C0392B';
        ctx.fill();
    }

    spinWheel() {
        if (this.isSpinning || this.gameState.isPaused || this.gameState.isGameOver) return;
        if (this.gameState.currentTurn !== 'player') return;
        
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.disableShopButtons();
        
        // 随机选择转盘结果
        const segments = GameData.wheel.segments;
        const weights = segments.map(s => s.weight);
        const resultIndex = Utils.weightedRandom(weights);
        const result = segments[resultIndex];
        
        // 计算旋转角度
        const segmentAngle = (Math.PI * 2) / segments.length;
        const targetAngle = -(resultIndex * segmentAngle + segmentAngle / 2);
        const fullRotations = 5; // 5圈
        const totalRotation = this.currentRotation + (fullRotations * Math.PI * 2) + targetAngle;
        
        // 保存待处理状态（用于刷新页面后恢复）
        // 只保存 result.id，不保存整个对象，更可靠
        this.gameState.hasPendingSpin = true;
        this.gameState.pendingTargetRotation = totalRotation;
        this.gameState.pendingResultId = result.id;
        this.gameState.pendingCharacterId = 'player';
        this.saveGame();
        
        // 动画旋转
        const startTime = Date.now();
        const duration = GameData.rules.spinDuration;
        const startRotation = this.currentRotation;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);
            this.currentRotation = startRotation + (totalRotation - startRotation) * easeOut;
            
            this.renderWheel();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.currentRotation = totalRotation;
                this.isSpinning = false;
                
                // 清除待处理状态
                this.gameState.hasPendingSpin = false;
                this.gameState.pendingTargetRotation = 0;
                this.gameState.pendingResultId = null;
                this.gameState.pendingCharacterId = null;
                this.saveGame();
                
                this.handleSpinResult(result, 'player');
            }
        };
        
        animate();
    }

    async handleSpinResult(result, characterId) {
        const character = this.characters[characterId];
        const isPlayer = characterId === 'player';
        
        this.addLog(`${character.icon} ${character.name} 转动转盘: ${result.icon} ${result.name}`, 
            isPlayer ? 'player-action' : 'enemy-action');
        
        switch (result.id) {
            case 'attack':
            case 'critical':
                await this.handleAttack(characterId, result);
                break;
                
            case 'gold':
            case 'treasure':
                this.handleGold(characterId, result);
                break;
                
            case 'heal':
                this.handleHeal(characterId, result);
                break;
                
            case 'defense':
                this.handleDefense(characterId);
                break;
                
            case 'doom':
                this.handleDoom(characterId, result);
                break;
                
            case 'spin':
                this.handleExtraSpin(characterId);
                return; // 不结束回合
        }
        
        this.saveGame();
        
        // 检查游戏是否结束
        if (await this.checkGameOver()) {
            return;
        }
        
        // 如果是玩家回合，且没有额外转动机会，则轮到敌人
        if (isPlayer && this.gameState.extraSpins <= 0) {
            this.spinBtn.disabled = true;
            this.disableShopButtons();
            await Utils.delay(GameData.rules.turnDelay);
            await this.enemyTurn();
        } else if (isPlayer) {
            this.gameState.extraSpins--;
            this.spinBtn.disabled = false;
            this.updateShopButtons();
        }
    }

    async handleAttack(attackerId, result) {
        const attacker = this.characters[attackerId];
        const isPlayer = attackerId === 'player';
        
        // 选择目标
        let targetId;
        
        if (isPlayer) {
            // 玩家攻击生命值最低的敌人
            const aliveEnemies = Object.keys(this.characters).filter(key => {
                const char = this.characters[key];
                return char.type === 'enemy' && !char.isDead;
            });
            
            if (aliveEnemies.length === 0) return;
            
            // 找到生命值最低的敌人
            targetId = aliveEnemies.reduce((lowest, key) => {
                return this.characters[key].hp < this.characters[lowest].hp ? key : lowest;
            });
        } else {
            // AI 攻击逻辑
            targetId = this.chooseEnemyTarget(attackerId);
        }
        
        if (!targetId) return;
        
        const target = this.characters[targetId];
        let damage = result.damage;
        
        // 攻击动画
        const attackerPanel = Utils.$(`#${attacker.panelId}`);
        Utils.addAnimation(attackerPanel, 'attack-animation', GameData.rules.attackAnimationDuration);
        
        await Utils.delay(GameData.rules.attackAnimationDuration);
        
        // 计算伤害
        if (target.isDefending) {
            damage = Math.floor(damage * 0.5);
            target.isDefending = false;
            this.addLog(`${target.icon} ${target.name} 的护盾抵挡了部分伤害！`, 'enemy-action');
        }
        
        target.hp = Math.max(0, target.hp - damage);
        
        // 伤害动画
        const targetPanel = Utils.$(`#${target.panelId}`);
        Utils.addAnimation(targetPanel, 'damage-animation', GameData.rules.damageAnimationDuration);
        
        this.addLog(`${attacker.icon} ${attacker.name} 对 ${target.icon} ${target.name} 造成了 ${damage} 点伤害！`,
            isPlayer ? 'player-action' : 'enemy-action');
        
        // 检查目标是否死亡
        if (target.hp <= 0 && !target.isDead) {
            target.isDead = true;
            this.addLog(`💀 ${target.icon} ${target.name} 被击败了！`, 'battle-result');
        }
        
        this.updateCharacterUI(targetId);
        this.updateCharacterUI(attackerId);
    }

    chooseEnemyTarget(attackerId) {
        const attacker = this.characters[attackerId];
        const player = this.characters.player;
        
        // 如果玩家生命值 <= 30，70% 概率攻击玩家
        if (player.hp <= GameData.rules.lowHpThreshold && !player.isDead) {
            if (Math.random() < GameData.rules.lowHpAttackProbability) {
                return 'player';
            }
        }
        
        // 否则，找到生命值最低的目标（包括其他敌人）
        const aliveTargets = Object.keys(this.characters).filter(key => {
            const char = this.characters[key];
            return key !== attackerId && !char.isDead;
        });
        
        if (aliveTargets.length === 0) return null;
        
        // 找到生命值最低的目标
        return aliveTargets.reduce((lowest, key) => {
            return this.characters[key].hp < this.characters[lowest].hp ? key : lowest;
        });
    }

    handleGold(characterId, result) {
        const character = this.characters[characterId];
        const gold = result.gold;
        
        character.gold += gold;
        
        this.addLog(`${character.icon} ${character.name} 获得了 ${gold} 金币！`,
            characterId === 'player' ? 'player-action' : 'enemy-action');
        
        this.updateCharacterUI(characterId);
    }

    handleHeal(characterId, result) {
        const character = this.characters[characterId];
        const healAmount = result.heal;
        const oldHp = character.hp;
        
        character.hp = Math.min(character.maxHp, character.hp + healAmount);
        const actualHeal = character.hp - oldHp;
        
        if (actualHeal > 0) {
            this.addLog(`${character.icon} ${character.name} 恢复了 ${actualHeal} 点生命值！`,
                characterId === 'player' ? 'player-action' : 'enemy-action');
        } else {
            this.addLog(`${character.icon} ${character.name} 生命值已满！`,
                characterId === 'player' ? 'player-action' : 'enemy-action');
        }
        
        this.updateCharacterUI(characterId);
    }

    handleDefense(characterId) {
        const character = this.characters[characterId];
        character.isDefending = true;
        
        this.addLog(`${character.icon} ${character.name} 进入防御状态，下次受伤减半！`,
            characterId === 'player' ? 'player-action' : 'enemy-action');
        
        this.updateCharacterUI(characterId);
    }

    handleDoom(characterId, result) {
        const character = this.characters[characterId];
        let damage = result.damage;
        
        // 防御状态下减半
        if (character.isDefending) {
            damage = Math.floor(damage * 0.5);
            character.isDefending = false;
        }
        
        character.hp = Math.max(0, character.hp - damage);
        
        this.addLog(`💀 厄运降临！${character.icon} ${character.name} 受到了 ${damage} 点伤害！`,
            characterId === 'player' ? 'player-action' : 'enemy-action');
        
        // 检查是否死亡
        if (character.hp <= 0 && !character.isDead) {
            character.isDead = true;
            this.addLog(`💀 ${character.icon} ${character.name} 被厄运击败了！`, 'battle-result');
        }
        
        this.updateCharacterUI(characterId);
    }

    handleExtraSpin(characterId) {
        const character = this.characters[characterId];
        this.gameState.extraSpins++;
        
        this.addLog(`${character.icon} ${character.name} 获得了额外的转动机会！`,
            characterId === 'player' ? 'player-action' : 'enemy-action');
    }

    // 敌人回合
    async enemyTurn() {
        this.gameState.currentTurn = 'enemy';
        
        const aliveEnemies = Object.keys(this.characters).filter(key => {
            const char = this.characters[key];
            return char.type === 'enemy' && !char.isDead;
        });
        
        for (const enemyId of aliveEnemies) {
            if (this.gameState.isGameOver) break;
            
            const enemy = this.characters[enemyId];
            this.addLog(`⚔️ ${enemy.icon} ${enemy.name} 的回合开始！`, 'enemy-action');
            
            await Utils.delay(GameData.rules.turnDelay);
            
            // AI 转动转盘
            await this.aiSpin(enemyId);
            
            if (await this.checkGameOver()) {
                return;
            }
            
            await Utils.delay(GameData.rules.turnDelay);
        }
        
        // 所有敌人行动完毕，回到玩家回合
        this.gameState.turnCount++;
        this.gameState.currentTurn = 'player';
        this.spinBtn.disabled = false;
        this.updateShopButtons();
        
        this.addLog('🎮 海盗船长，轮到你了！', 'player-action');
        this.saveGame();
    }

    async aiSpin(enemyId) {
        const enemy = this.characters[enemyId];
        const aiType = GameData.aiTypes[enemy.aiType];
        
        // 根据 AI 类型调整权重
        const segments = GameData.wheel.segments;
        const weights = segments.map(segment => {
            return aiType.weights[segment.id] || segment.weight;
        });
        
        const resultIndex = Utils.weightedRandom(weights);
        const result = segments[resultIndex];
        
        // 模拟转盘动画（简化）
        this.addLog(`${enemy.icon} ${enemy.name} 转动转盘...`, 'enemy-action');
        await Utils.delay(500);
        
        await this.handleSpinResult(result, enemyId);
    }

    // 商店相关方法
    buyItem(itemId) {
        if (this.gameState.isPaused || this.gameState.isGameOver) return;
        if (this.isSpinning) return;
        if (this.gameState.currentTurn !== 'player') return;
        
        const item = GameData.shop.items.find(i => i.id === itemId);
        if (!item) return;
        
        const player = this.characters.player;
        
        if (player.gold < item.cost) {
            this.addLog(`❌ 金币不足！需要 ${item.cost} 金币`, 'player-action');
            return;
        }
        
        // 扣除金币
        player.gold -= item.cost;
        
        // 应用物品效果
        this.applyItemEffect(item);
        
        this.addLog(`🛒 购买了 ${item.icon} ${item.name}！`, 'player-action');
        
        this.updateCharacterUI('player');
        this.updateShopButtons();
        this.saveGame();
    }

    applyItemEffect(item) {
        const player = this.characters.player;
        
        switch (item.effect.type) {
            case 'attack':
                // 找到生命值最低的敌人
                const aliveEnemies = Object.keys(this.characters).filter(key => {
                    const char = this.characters[key];
                    return char.type === 'enemy' && !char.isDead;
                });
                
                if (aliveEnemies.length === 0) {
                    this.addLog('❌ 没有可攻击的目标！', 'player-action');
                    player.gold += item.cost; // 退还金币
                    return;
                }
                
                const targetId = aliveEnemies.reduce((lowest, key) => {
                    return this.characters[key].hp < this.characters[lowest].hp ? key : lowest;
                });
                
                const target = this.characters[targetId];
                let damage = item.effect.damage;
                
                if (target.isDefending) {
                    damage = Math.floor(damage * 0.5);
                    target.isDefending = false;
                }
                
                target.hp = Math.max(0, target.hp - damage);
                
                this.addLog(`⚔️ 强制攻击！对 ${target.icon} ${target.name} 造成了 ${damage} 点伤害！`, 'player-action');
                
                if (target.hp <= 0 && !target.isDead) {
                    target.isDead = true;
                    this.addLog(`💀 ${target.icon} ${target.name} 被击败了！`, 'battle-result');
                }
                
                this.updateCharacterUI(targetId);
                break;
                
            case 'defense':
                player.isDefending = true;
                this.addLog('🛡️ 获得护盾！下次受伤减半！', 'player-action');
                break;
                
            case 'heal':
                const oldHp = player.hp;
                player.hp = Math.min(player.maxHp, player.hp + item.effect.amount);
                const actualHeal = player.hp - oldHp;
                
                if (actualHeal > 0) {
                    this.addLog(`❤️ 使用大药水！恢复了 ${actualHeal} 点生命值！`, 'player-action');
                } else {
                    this.addLog('❤️ 生命值已满！', 'player-action');
                }
                break;
        }
        
        this.checkGameOver();
    }

    updateShopButtons() {
        const player = this.characters.player;
        
        GameData.shop.items.forEach(item => {
            const button = Utils.$(`#${item.buttonId}`);
            if (button) {
                button.disabled = player.gold < item.cost || 
                                   this.gameState.currentTurn !== 'player' ||
                                   this.gameState.isPaused ||
                                   this.gameState.isGameOver;
            }
        });
    }

    disableShopButtons() {
        GameData.shop.items.forEach(item => {
            const button = Utils.$(`#${item.buttonId}`);
            if (button) {
                button.disabled = true;
            }
        });
    }

    // 游戏结束检查
    async checkGameOver() {
        const player = this.characters.player;
        
        // 检查玩家是否死亡
        if (player.hp <= 0 && !player.isDead) {
            player.isDead = true;
        }
        
        if (player.isDead) {
            this.gameState.isGameOver = true;
            this.gameState.winner = 'enemies';
            
            this.addLog('💀 游戏结束！你被击败了...', 'battle-result');
            this.saveGame();
            
            await Utils.delay(1000);
            this.showResultScreen(false);
            return true;
        }
        
        // 检查所有敌人是否死亡
        const aliveEnemies = Object.values(this.characters).filter(c => c.type === 'enemy' && !c.isDead);
        
        if (aliveEnemies.length === 0) {
            this.gameState.isGameOver = true;
            this.gameState.winner = 'player';
            
            this.addLog('🏆 胜利！所有敌人都被击败了！', 'battle-result');
            this.saveGame();
            
            await Utils.delay(1000);
            this.showResultScreen(true);
            return true;
        }
        
        return false;
    }

    // UI 更新方法
    updateAllUI() {
        Object.keys(this.characters).forEach(key => {
            this.updateCharacterUI(key);
        });
        this.updateLogDisplay();
        this.updateShopButtons();
        this.updateSpinButton();
    }

    updateSpinButton() {
        if (!this.spinBtn) return;
        
        // 检查是否有待处理的转盘结果
        const hasPendingSpin = this.gameState.hasPendingSpin && 
                              this.gameState.pendingResultId && 
                              this.gameState.pendingCharacterId;
        
        // 如果有：禁用按钮
        // 如果没有：检查是否是玩家回合、是否暂停、是否游戏结束
        this.spinBtn.disabled = hasPendingSpin ||
                                this.isSpinning ||
                                this.gameState.isPaused ||
                                this.gameState.isGameOver ||
                                this.gameState.currentTurn !== 'player';
    }

    updateCharacterUI(characterId) {
        const character = this.characters[characterId];
        const config = GameData.characters[characterId];
        
        // 更新生命值
        const hpElement = Utils.$(`#${config.hpId}`);
        if (hpElement) {
            hpElement.textContent = Math.max(0, character.hp);
        }
        
        // 更新金币
        const goldElement = Utils.$(`#${config.goldId}`);
        if (goldElement) {
            goldElement.textContent = character.gold;
        }
        
        // 更新生命值条
        const healthBar = Utils.$(`#${config.healthBarId}`);
        if (healthBar) {
            const hpPercent = Math.max(0, (character.hp / character.maxHp) * 100);
            healthBar.style.width = `${hpPercent}%`;
            
            // 根据生命值改变颜色
            if (hpPercent > 50) {
                healthBar.style.background = 'linear-gradient(90deg, #A8E6CF, #88D8B0)';
            } else if (hpPercent > 25) {
                healthBar.style.background = 'linear-gradient(90deg, #FFD93D, #FFC107)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #FF6B6B, #FF5252)';
            }
        }
        
        // 更新防御状态
        const defenseStatus = Utils.$(`#${config.defenseStatusId}`);
        if (defenseStatus) {
            if (character.isDefending) {
                Utils.show(defenseStatus);
            } else {
                Utils.hide(defenseStatus);
            }
        }
        
        // 更新面板样式（死亡状态）
        const panel = Utils.$(`#${config.panelId}`);
        if (panel) {
            if (character.isDead) {
                panel.style.opacity = '0.5';
                panel.style.filter = 'grayscale(100%)';
            } else {
                panel.style.opacity = '1';
                panel.style.filter = 'none';
            }
        }
    }

    addLog(message, type = 'default') {
        const log = {
            message,
            type,
            timestamp: Date.now()
        };
        
        this.gameState.logs.push(log);
        
        // 限制日志数量
        if (this.gameState.logs.length > GameData.rules.maxLogEntries) {
            this.gameState.logs = this.gameState.logs.slice(-GameData.rules.maxLogEntries);
        }
        
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        if (!this.logContainer) return;
        
        this.logContainer.innerHTML = '';
        
        this.gameState.logs.forEach((log, index) => {
            const logElement = document.createElement('div');
            logElement.className = 'log-entry';
            
            if (log.type === 'player-action') {
                logElement.classList.add('player-action');
            } else if (log.type === 'enemy-action') {
                logElement.classList.add('enemy-action');
            } else if (log.type === 'battle-result') {
                logElement.classList.add('battle-result');
            }
            
            logElement.textContent = log.message;
            logElement.id = `log-${index + 1}`;
            
            this.logContainer.appendChild(logElement);
        });
        
        // 滚动到底部
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new PirateGame();
});
