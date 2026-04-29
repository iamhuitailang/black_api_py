class UltramanGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = GAME_STATE.MENU;
        this.turnState = TURN_STATE.PLAYER;
        this.selectedCharacter = 'tiga';
        
        this.player = null;
        this.monster = null;
        this.currentLevel = 1;
        this.gold = 0;
        
        this.isDefending = false;
        this.battleLog = [];
        this.animations = [];
        
        this.dpr = window.devicePixelRatio || 1;
        this.canvasWidth = 800;
        this.canvasHeight = 400;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.loadGameData();
        this.bindEvents();
        this.updateUI();
        this.gameLoop();
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.player) {
                const width = this.canvasWidth;
                const height = this.canvasHeight;
                this.player.x = width * 0.18;
                this.player.y = height * 0.7;
                this.player.targetX = width * 0.18;
                this.player.targetY = height * 0.7;
            }
            if (this.monster) {
                const width = this.canvasWidth;
                const height = this.canvasHeight;
                this.monster.x = width * 0.75;
                this.monster.y = height * 0.7;
                this.monster.targetX = width * 0.75;
                this.monster.targetY = height * 0.7;
            }
        });
    }
    
    setupCanvas() {
        const canvas = this.canvas;
        const dpr = this.dpr;
        
        const cssWidth = canvas.offsetWidth || 800;
        const cssHeight = canvas.offsetHeight || 400;
        
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        
        this.canvasWidth = cssWidth;
        this.canvasHeight = cssHeight;
    }
    
    loadGameData() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEYS.GAME_DATA);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.gameState = data.gameState || GAME_STATE.MENU;
                this.currentLevel = data.currentLevel || 1;
                this.gold = data.gold || 0;
                this.selectedCharacter = data.selectedCharacter || 'tiga';
                this.player = data.player;
                this.monster = data.monster;
                this.isDefending = data.isDefending || false;
                
                if (this.player) {
                    const width = this.canvasWidth;
                    const height = this.canvasHeight;
                    this.player.x = width * 0.18;
                    this.player.y = height * 0.7;
                    this.player.targetX = width * 0.18;
                    this.player.targetY = height * 0.7;
                }
                
                if (this.monster) {
                    const width = this.canvasWidth;
                    const height = this.canvasHeight;
                    this.monster.x = width * 0.75;
                    this.monster.y = height * 0.7;
                    this.monster.targetX = width * 0.75;
                    this.monster.targetY = height * 0.7;
                }
                
                const savedLog = localStorage.getItem(STORAGE_KEYS.BATTLE_LOG);
                if (savedLog) {
                    this.battleLog = JSON.parse(savedLog);
                }
                
                if (this.gameState === GAME_STATE.BATTLE && this.player && this.monster) {
                    document.getElementById('continue-btn').style.display = 'inline-block';
                }
            }
        } catch (e) {
            console.error('加载存档失败:', e);
            this.resetGameData();
        }
    }
    
    saveGameData() {
        try {
            const data = {
                gameState: this.gameState,
                currentLevel: this.currentLevel,
                gold: this.gold,
                selectedCharacter: this.selectedCharacter,
                player: this.player,
                monster: this.monster,
                isDefending: this.isDefending
            };
            localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(data));
            localStorage.setItem(STORAGE_KEYS.BATTLE_LOG, JSON.stringify(this.battleLog));
        } catch (e) {
            console.error('保存存档失败:', e);
        }
    }
    
    resetGameData() {
        localStorage.removeItem(STORAGE_KEYS.GAME_DATA);
        localStorage.removeItem(STORAGE_KEYS.BATTLE_LOG);
        this.currentLevel = 1;
        this.gold = 0;
        this.player = null;
        this.monster = null;
        this.isDefending = false;
        this.battleLog = [];
    }
    
    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('continue-btn').addEventListener('click', () => {
            this.continueGame();
        });
        
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skill = e.currentTarget.dataset.skill;
                if (skill && this.turnState === TURN_STATE.PLAYER) {
                    this.useSkill(skill);
                }
            });
        });
    }
    
    startNewGame() {
        this.resetGameData();
        this.currentLevel = 1;
        this.gold = 0;
        this.initPlayer();
        this.initMonster();
        this.battleLog = ['⚔️ 战斗开始！'];
        this.gameState = GAME_STATE.BATTLE;
        this.turnState = TURN_STATE.PLAYER;
        this.isDefending = false;
        this.saveGameData();
        this.showScreen('battle-screen');
        this.updateUI();
        this.updateBattleLog();
    }
    
    continueGame() {
        this.showScreen('battle-screen');
        this.updateUI();
        this.updateBattleLog();
    }
    
    initPlayer() {
        const charData = ULTRAMAN_DATA[this.selectedCharacter];
        const width = this.canvasWidth || 800;
        const height = this.canvasHeight || 400;
        
        this.player = {
            id: this.selectedCharacter,
            name: charData.name,
            emoji: charData.emoji,
            maxHp: charData.maxHp,
            hp: charData.maxHp,
            atk: charData.baseAtk,
            def: charData.baseDef,
            maxEnergy: charData.maxEnergy,
            energy: 0,
            color: charData.color,
            x: width * 0.18,
            y: height * 0.7,
            targetX: width * 0.18,
            targetY: height * 0.7
        };
    }
    
    initMonster() {
        const monsterData = MONSTER_DATA[this.currentLevel - 1];
        const width = this.canvasWidth || 800;
        const height = this.canvasHeight || 400;
        
        if (monsterData) {
            this.monster = {
                level: monsterData.level,
                name: monsterData.name,
                emoji: monsterData.emoji,
                maxHp: monsterData.maxHp,
                hp: monsterData.maxHp,
                atk: monsterData.atk,
                specialAbility: monsterData.specialAbility,
                reward: monsterData.reward,
                color: monsterData.color,
                isBoss: monsterData.isBoss || false,
                x: width * 0.75,
                y: height * 0.7,
                targetX: width * 0.75,
                targetY: height * 0.7
            };
        }
    }
    
    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel > MONSTER_DATA.length) {
            this.gameState = GAME_STATE.COMPLETE;
            this.saveGameData();
            this.showScreen('complete-screen');
            document.getElementById('complete-gold').textContent = this.gold;
            return;
        }
        
        if (this.player) {
            this.player.energy = Math.min(this.player.energy + 30, this.player.maxEnergy);
        }
        
        this.initMonster();
        this.isDefending = false;
        this.battleLog = [`⚔️ 第 ${this.currentLevel} 关开始！`];
        this.gameState = GAME_STATE.BATTLE;
        this.turnState = TURN_STATE.PLAYER;
        this.saveGameData();
        this.showScreen('battle-screen');
        this.updateUI();
        this.updateBattleLog();
    }
    
    useSkill(skillId) {
        if (this.turnState !== TURN_STATE.PLAYER || !this.player || !this.monster) return;
        
        const skill = SKILL_DATA[skillId];
        if (!skill) return;
        
        if (skill.energyCost > 0 && this.player.energy < skill.energyCost) {
            this.addLog(`⚠️ 能量不足！需要 ${skill.energyCost} 能量`);
            return;
        }
        
        this.turnState = TURN_STATE.ANIMATING;
        this.isDefending = false;
        this.disableSkillButtons();
        
        this.player.energy -= skill.energyCost;
        this.player.energy = Math.max(0, this.player.energy);
        
        if (skill.energyGain > 0) {
            this.player.energy = Math.min(this.player.energy + skill.energyGain, this.player.maxEnergy);
        }
        
        if (skill.isDefend) {
            this.isDefending = true;
            this.addLog(`🛡️ ${this.player.name} 进入防御姿态！本回合伤害减半`);
            this.playDefendAnimation();
        } else {
            this.executeAttack(skill);
        }
    }
    
    executeAttack(skill) {
        let damage = skill.damage;
        let blocked = false;
        let isCrit = false;
        
        if (skill.isBasic && this.monster.specialAbility && this.monster.specialAbility.type === 'block') {
            if (Math.random() < this.monster.specialAbility.chance) {
                blocked = true;
                damage = 0;
                this.addLog(`🛡️ ${this.monster.name} 格挡了攻击！`);
            }
        }
        
        if (!blocked && damage > 0) {
            this.monster.hp -= damage;
            this.monster.hp = Math.max(0, this.monster.hp);
            
            if (skill.isSpecial && skill.healAmount) {
                this.player.hp = Math.min(this.player.hp + skill.healAmount, this.player.maxHp);
                this.addLog(`✨ ${this.player.name} 使用 ${skill.name}！造成 ${damage} 点伤害，回复 ${skill.healAmount} 点生命！`);
            } else {
                this.addLog(`${skill.emoji} ${this.player.name} 使用 ${skill.name}！造成 ${damage} 点伤害！`);
            }
        }
        
        this.playAttackAnimation(skill, blocked);
        this.saveGameData();
        this.updateUI();
        
        setTimeout(() => {
            if (this.monster.hp <= 0) {
                this.monsterDefeated();
            } else {
                this.checkMonsterRegen();
                setTimeout(() => {
                    this.monsterTurn();
                }, 500);
            }
        }, 1000);
    }
    
    checkMonsterRegen() {
        if (this.monster.specialAbility && this.monster.specialAbility.type === 'regen') {
            const regenAmount = this.monster.specialAbility.amount;
            this.monster.hp = Math.min(this.monster.hp + regenAmount, this.monster.maxHp);
            this.addLog(`💚 ${this.monster.name} 回复了 ${regenAmount} 点生命！`);
            this.updateUI();
            this.saveGameData();
        }
    }
    
    monsterTurn() {
        if (!this.player || !this.monster) return;
        
        this.turnState = TURN_STATE.MONSTER;
        document.getElementById('turn-text').textContent = `👾 ${this.monster.name} 的回合...`;
        
        setTimeout(() => {
            let damage = this.monster.atk;
            let isCrit = false;
            
            if (this.monster.specialAbility) {
                const ability = this.monster.specialAbility;
                
                if (ability.type === 'crit' || ability.type === 'boss') {
                    const critChance = ability.type === 'boss' ? ability.critChance : ability.chance;
                    const critMultiplier = ability.type === 'boss' ? ability.critMultiplier : ability.multiplier;
                    
                    if (Math.random() < critChance) {
                        isCrit = true;
                        damage = Math.floor(damage * critMultiplier);
                    }
                }
            }
            
            let finalDamage = damage - this.player.def;
            finalDamage = Math.max(1, finalDamage);
            
            if (this.isDefending) {
                finalDamage = Math.floor(finalDamage * 0.5);
                this.addLog(`🛡️ 防御生效！伤害减半！`);
            }
            
            this.player.hp -= finalDamage;
            this.player.hp = Math.max(0, this.player.hp);
            
            if (isCrit) {
                this.addLog(`💥 ${this.monster.name} 暴击！造成 ${finalDamage} 点伤害！`);
            } else {
                this.addLog(`👾 ${this.monster.name} 攻击！造成 ${finalDamage} 点伤害！`);
            }
            
            this.playMonsterAttackAnimation();
            this.saveGameData();
            this.updateUI();
            
            setTimeout(() => {
                if (this.player.hp <= 0) {
                    this.gameOver();
                } else {
                    this.endTurn();
                }
            }, 800);
        }, 800);
    }
    
    endTurn() {
        this.isDefending = false;
        this.turnState = TURN_STATE.PLAYER;
        document.getElementById('turn-text').textContent = '⚔️ 你的回合 - 选择行动';
        this.enableSkillButtons();
        this.saveGameData();
    }
    
    monsterDefeated() {
        const reward = this.monster.reward;
        this.gold += reward.gold;
        
        this.addLog(`🎉 ${this.monster.name} 被击败了！`);
        this.addLog(`💰 获得 ${reward.gold} 金币，⚡ 获得 ${reward.energy} 能量`);
        
        this.gameState = GAME_STATE.VICTORY;
        this.saveGameData();
        
        setTimeout(() => {
            this.showScreen('victory-screen');
            document.getElementById('victory-message').textContent = `你击败了 ${this.monster.name}！`;
            document.getElementById('reward-gold').textContent = reward.gold;
            document.getElementById('reward-energy').textContent = reward.energy;
        }, 1500);
    }
    
    gameOver() {
        this.gameState = GAME_STATE.GAMEOVER;
        this.saveGameData();
        
        setTimeout(() => {
            this.showScreen('gameover-screen');
            document.getElementById('final-level').textContent = this.currentLevel;
            document.getElementById('final-gold').textContent = this.gold;
        }, 1000);
    }
    
    playAttackAnimation(skill, blocked) {
        const width = this.canvasWidth || 800;
        const height = this.canvasHeight || 400;
        const fontSize = Math.min(width, height) * 0.2;
        
        const startX = this.player.x + fontSize * 0.6;
        const startY = this.player.y;
        const endX = this.monster.x;
        const endY = this.monster.y;
        
        this.animations.push({
            type: skill.isSpecial ? 'beam' : 'punch',
            startX,
            startY,
            endX,
            endY,
            progress: 0,
            color: skill.isSpecial ? '#a855f7' : '#ef4444'
        });
        
        const moveAmount = width * 0.04;
        const originalX = this.player.x;
        
        this.player.targetX = this.player.x + moveAmount;
        setTimeout(() => {
            this.player.targetX = this.player.x - moveAmount;
        }, 200);
        setTimeout(() => {
            this.player.targetX = width * 0.18;
        }, 400);
    }
    
    playDefendAnimation() {
        const width = this.canvasWidth || 800;
        const height = this.canvasHeight || 400;
        const fontSize = Math.min(width, height) * 0.2;
        
        this.animations.push({
            type: 'shield',
            x: this.player.x + fontSize * 0.5,
            y: this.player.y - fontSize * 0.25,
            progress: 0,
            duration: 30
        });
        
        setTimeout(() => {
            this.endTurn();
        }, 800);
    }
    
    playMonsterAttackAnimation() {
        const width = this.canvasWidth || 800;
        const height = this.canvasHeight || 400;
        const fontSize = Math.min(width, height) * 0.2;
        
        const moveAmount = width * 0.04;
        
        this.animations.push({
            type: 'monster_attack',
            startX: this.monster.x - moveAmount,
            startY: this.monster.y,
            endX: this.player.x + fontSize,
            endY: this.player.y,
            progress: 0,
            color: '#dc2626'
        });
        
        this.monster.targetX = this.monster.x - moveAmount;
        setTimeout(() => {
            this.monster.targetX = width * 0.75;
        }, 300);
    }
    
    addLog(message) {
        this.battleLog.push(message);
        if (this.battleLog.length > 50) {
            this.battleLog.shift();
        }
        this.updateBattleLog();
    }
    
    updateBattleLog() {
        const logContent = document.getElementById('log-content');
        logContent.innerHTML = this.battleLog.map(msg => `<p>${msg}</p>`).join('');
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    updateUI() {
        if (this.player) {
            document.getElementById('player-hp').textContent = this.player.hp;
            document.getElementById('player-energy').textContent = this.player.energy;
            
            const hpPercent = (this.player.hp / this.player.maxHp) * 100;
            const energyPercent = (this.player.energy / this.player.maxEnergy) * 100;
            
            document.getElementById('player-hp-bar').style.width = `${hpPercent}%`;
            document.getElementById('player-energy-bar').style.width = `${energyPercent}%`;
        }
        
        if (this.monster) {
            document.getElementById('monster-name').textContent = `${this.monster.emoji} ${this.monster.name}`;
            document.getElementById('monster-display-name').textContent = `${this.monster.emoji} ${this.monster.name}`;
            document.getElementById('monster-hp').textContent = this.monster.hp;
            document.getElementById('monster-max-hp').textContent = this.monster.maxHp;
            document.getElementById('monster-atk').textContent = this.monster.atk;
            
            const hpPercent = (this.monster.hp / this.monster.maxHp) * 100;
            document.getElementById('monster-hp-bar').style.width = `${hpPercent}%`;
        }
        
        document.getElementById('current-level').textContent = `第 ${this.currentLevel} 关`;
        document.getElementById('gold').textContent = this.gold;
        
        this.updateSkillButtons();
    }
    
    updateSkillButtons() {
        const beamBtn = document.getElementById('skill-beam');
        if (this.player && this.player.energy < 50) {
            beamBtn.disabled = true;
        } else {
            beamBtn.disabled = false;
        }
    }
    
    disableSkillButtons() {
        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.disabled = true;
        });
    }
    
    enableSkillButtons() {
        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.disabled = false;
        });
        this.updateSkillButtons();
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.player) {
            this.player.x += (this.player.targetX - this.player.x) * 0.1;
            this.player.y += (this.player.targetY - this.player.y) * 0.1;
        }
        
        if (this.monster) {
            this.monster.x += (this.monster.targetX - this.monster.x) * 0.1;
            this.monster.y += (this.monster.targetY - this.monster.y) * 0.1;
        }
        
        this.animations = this.animations.filter(anim => {
            anim.progress += 0.03;
            return anim.progress < 1;
        });
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvasWidth || 800;
        const height = this.canvasHeight || 400;
        
        ctx.clearRect(0, 0, width, height);
        
        this.drawBackground();
        
        if (this.gameState === GAME_STATE.BATTLE || 
            this.gameState === GAME_STATE.VICTORY ||
            this.gameState === GAME_STATE.GAMEOVER) {
            this.drawCharacters();
            this.drawAnimations();
        }
    }
    
    drawBackground() {
        const ctx = this.ctx;
        const width = this.canvasWidth || 800;
        const height = this.canvasHeight || 400;
        
        const baseSize = Math.min(width, height);
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F7FA');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height * 0.6);
        
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(0, height * 0.6, width, height * 0.4);
        
        ctx.fillStyle = '#7CB342';
        ctx.fillRect(0, height * 0.65, width, height * 0.02);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(width * 0.12, height * 0.2, baseSize * 0.1);
        this.drawCloud(width * 0.35, height * 0.12, baseSize * 0.12);
        this.drawCloud(width * 0.68, height * 0.25, baseSize * 0.09);
        this.drawCloud(width * 0.87, height * 0.15, baseSize * 0.11);
    }
    
    drawCloud(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 1.5, y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawCharacters() {
        if (this.player) {
            this.drawCharacter(this.player, true);
        }
        if (this.monster) {
            this.drawCharacter(this.monster, false);
        }
    }
    
    drawCharacter(character, isPlayer) {
        const ctx = this.ctx;
        const width = this.canvasWidth || 800;
        const height = this.canvasHeight || 400;
        const x = character.x;
        const y = character.y;
        
        const baseSize = Math.min(width, height);
        const fontSize = baseSize * 0.2;
        const nameFontSize = baseSize * 0.04;
        const shieldFontSize = baseSize * 0.06;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(x + fontSize * 0.5, y + fontSize * 0.75, fontSize * 0.45, fontSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", Arial, sans-serif`;
        ctx.fillText(character.emoji, x + fontSize * 0.5, y);
        
        ctx.font = `bold ${nameFontSize}px "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Source Han Sans CN", sans-serif`;
        const nameY = y - fontSize * 0.7;
        const nameX = x + fontSize * 0.5;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.strokeText(character.name, nameX, nameY);
        
        ctx.fillStyle = isPlayer ? '#3b82f6' : '#ef4444';
        ctx.fillText(character.name, nameX, nameY);
        
        if (isPlayer && this.isDefending) {
            ctx.font = `${shieldFontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial`;
            ctx.fillText('🛡️', x + fontSize * 0.5, y + fontSize * 0.9);
        }
    }
    
    drawAnimations() {
        const ctx = this.ctx;
        const width = this.canvasWidth || 800;
        const height = this.canvasHeight || 400;
        const baseSize = Math.min(width, height);
        
        this.animations.forEach(anim => {
            if (anim.type === 'punch' || anim.type === 'monster_attack') {
                const x = anim.startX + (anim.endX - anim.startX) * anim.progress;
                const y = anim.startY + (anim.endY - anim.startY) * Math.sin(anim.progress * Math.PI);
                
                const radius = baseSize * 0.025 * (1 - anim.progress * 0.5);
                
                ctx.fillStyle = anim.color;
                ctx.globalAlpha = 1 - anim.progress;
                
                ctx.shadowColor = anim.color;
                ctx.shadowBlur = radius * 0.5;
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
                
            } else if (anim.type === 'beam') {
                const x1 = anim.startX;
                const y1 = anim.startY;
                const x2 = anim.startX + (anim.endX - anim.startX) * anim.progress;
                const y2 = anim.endY;
                
                const lineWidth = baseSize * 0.015 * (1 - anim.progress * 0.5);
                
                ctx.strokeStyle = anim.color;
                ctx.lineWidth = lineWidth;
                ctx.globalAlpha = 1 - anim.progress * 0.5;
                ctx.lineCap = 'round';
                
                ctx.shadowColor = anim.color;
                ctx.shadowBlur = lineWidth * 2;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                ctx.shadowBlur = 0;
                
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = lineWidth * 0.4;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                ctx.globalAlpha = 1;
                
            } else if (anim.type === 'shield') {
                const alpha = anim.progress < 0.5 ? anim.progress * 2 : 2 - anim.progress * 2;
                const radius = baseSize * 0.12 + anim.progress * baseSize * 0.04;
                
                ctx.globalAlpha = alpha * 0.6;
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = baseSize * 0.01;
                
                ctx.shadowColor = '#3b82f6';
                ctx.shadowBlur = radius * 0.3;
                
                ctx.beginPath();
                ctx.arc(anim.x, anim.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
                ctx.fill();
                
                ctx.globalAlpha = 1;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UltramanGame();
});
