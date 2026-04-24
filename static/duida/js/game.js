// 游戏配置
const GAME_CONFIG = {
    GRAVITY: 0.8,
    JUMP_FORCE: 15,
    MOVE_SPEED: 8,
    ATTACK_RANGE: 150,
    HIT_DURATION: 200,
    ATTACK_DURATION: 300
};

// 角色数据定义
const CHARACTERS = {
    qinglong: {
        name: '青龙',
        maxHealth: 1200,
        attack: 80,
        defense: 60,
        skills: {
            attack: {
                name: '青鳞龙爪',
                cd: 0.3,
                damage: 240,
                description: '三连爪击，水墨拖影'
            },
            small: {
                name: '长风裂空',
                cd: 5,
                damage: 200,
                description: '龙形剑气，击退+减速'
            },
            ultimate: {
                name: '四海龙吟',
                cd: 12,
                damage: 450,
                heal: 120,
                description: '水墨青龙虚影，全屏龙气，回血'
            }
        }
    },
    luosha: {
        name: '罗刹',
        maxHealth: 900,
        attack: 120,
        defense: 40,
        skills: {
            attack: {
                name: '魔影斩',
                cd: 0.2,
                damage: 240,
                description: '快速二连斩，带暴击'
            },
            small: {
                name: '业火突刺',
                cd: 4,
                damage: 250,
                dotDamage: 60,
                dotDuration: 3,
                description: '突进灼烧，持续掉血'
            },
            ultimate: {
                name: '焚天炼狱',
                cd: 10,
                damage: 500,
                dotDamage: 90,
                dotDuration: 4,
                description: '魔焰浪潮，巨额伤害+持续伤害'
            }
        }
    },
    xuannv: {
        name: '玄女',
        maxHealth: 1500,
        attack: 60,
        defense: 80,
        skills: {
            attack: {
                name: '山河碎',
                cd: 0.4,
                damage: 120,
                reflect: 10,
                description: '掌重击，自带小反伤'
            },
            small: {
                name: '万山结界',
                cd: 6,
                damage: 80,
                shield: true,
                reflect: 20,
                shieldDuration: 5,
                description: '护盾减伤+反弹伤害'
            },
            ultimate: {
                name: '大地归墟',
                cd: 15,
                damage: 300,
                heal: 200,
                dotHeal: 50,
                dotHealDuration: 4,
                description: '大范围阵法，持续回血+伤害'
            }
        }
    }
};

// 音效系统
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.log('AudioContext not supported');
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) {
            this.init();
            if (!this.audioContext) return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playAttack() {
        this.playTone(800, 0.1, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(600, 0.08, 'sawtooth', 0.15), 50);
    }

    playSkill() {
        this.playTone(400, 0.2, 'square', 0.2);
        this.playTone(600, 0.15, 'square', 0.15);
    }

    playUltimate() {
        this.playTone(200, 0.3, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(300, 0.2, 'sawtooth', 0.25), 100);
        setTimeout(() => this.playTone(400, 0.25, 'sawtooth', 0.2), 200);
    }

    playHit() {
        this.playTone(150, 0.15, 'square', 0.25);
    }

    playHeal() {
        this.playTone(600, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(800, 0.1, 'sine', 0.15), 100);
    }

    playVictory() {
        this.playTone(523, 0.3, 'sine', 0.3);
        setTimeout(() => this.playTone(659, 0.3, 'sine', 0.3), 200);
        setTimeout(() => this.playTone(784, 0.4, 'sine', 0.3), 400);
    }

    playDefeat() {
        this.playTone(300, 0.3, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.25), 200);
        setTimeout(() => this.playTone(150, 0.5, 'sawtooth', 0.2), 400);
    }

    playKeyPress() {
        this.playTone(1000, 0.05, 'sine', 0.1);
    }
}

// 存储系统
class StorageSystem {
    constructor() {
        this.STORAGE_KEY = 'ink_battle_save';
    }

    saveGameState(gameState) {
        try {
            const state = {
                p1Character: gameState.p1.characterType,
                p2Character: gameState.p2.characterType,
                p1Health: gameState.p1.health,
                p2Health: gameState.p2.health,
                p1SkillCDs: gameState.p1.skillCDs,
                p2SkillCDs: gameState.p2.skillCDs,
                gamePhase: gameState.phase,
                timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) return null;
            const state = JSON.parse(saved);
            // 检查是否在24小时内
            if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(this.STORAGE_KEY);
                return null;
            }
            return state;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    }

    clearGameState() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear game state:', e);
        }
    }
}

// 玩家类
class Player {
    constructor(id, characterType) {
        this.id = id;
        this.characterType = characterType;
        this.character = CHARACTERS[characterType];
        this.name = this.character.name;
        this.maxHealth = this.character.maxHealth;
        this.health = this.maxHealth;
        this.attack = this.character.attack;
        this.defense = this.character.defense;
        
        // 状态
        this.isJumping = false;
        this.isCrouching = false;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isHit = false;
        this.isAttacking = false;
        this.isDead = false;
        
        // 位置
        this.x = 0;
        this.y = 0;
        this.velocityY = 0;
        
        // 技能CD
        this.skillCDs = {
            attack: 0,
            small: 0,
            ultimate: 0
        };
        
        // 持续效果
        this.dotEffects = [];
        this.hotEffects = [];
        this.shieldActive = false;
        this.shieldEndTime = 0;
        
        // 元素引用
        this.element = null;
        this.healthFill = null;
        this.healthText = null;
        this.skillButtons = {};
        this.skillCDElements = {};
    }

    initElements() {
        const prefix = this.id === 1 ? 'p1' : 'p2';
        // 使用 sprite-container 元素来应用状态类和位置
        this.element = document.getElementById(`${prefix}-sprite-container`);
        this.spriteElement = document.getElementById(`${prefix}-sprite`);
        this.healthFill = document.getElementById(`${prefix}-health-fill`);
        this.healthText = {
            current: document.getElementById(`${prefix}-health`),
            max: document.getElementById(`${prefix}-max-health`)
        };
        
        // 更新角色名字（只更新 UI 上的）
        document.getElementById(`${prefix}-char-name`).textContent = this.name;
        
        // 更新技能图标
        this.updateSkillIcons();
        
        // 技能按钮和CD元素
        this.skillButtons = {
            attack: document.getElementById(`${prefix}-skill-attack`),
            small: document.getElementById(`${prefix}-skill-small`),
            ultimate: document.getElementById(`${prefix}-skill-ultimate`)
        };
        this.skillCDElements = {
            attack: document.getElementById(`${prefix}-cd-attack`),
            small: document.getElementById(`${prefix}-cd-small`),
            ultimate: document.getElementById(`${prefix}-cd-ultimate`)
        };
        
        // 更新角色样式
        this.updateCharacterStyle();
    }

    updateSkillIcons() {
        const prefix = this.id === 1 ? 'p1' : 'p2';
        const skillIcons = {
            qinglong: { attack: '爪', small: '裂', ultimate: '龙' },
            luosha: { attack: '斩', small: '刺', ultimate: '焚' },
            xuannv: { attack: '掌', small: '界', ultimate: '墟' }
        };
        const icons = skillIcons[this.characterType];
        
        document.querySelector(`#${prefix}-skill-attack .skill-icon`).textContent = icons.attack;
        document.querySelector(`#${prefix}-skill-small .skill-icon`).textContent = icons.small;
        document.querySelector(`#${prefix}-skill-ultimate .skill-icon`).textContent = icons.ultimate;
    }

    updateCharacterStyle() {
        if (!this.spriteElement) return;
        this.spriteElement.className = 'character ' + this.characterType;
    }

    updateHealthUI() {
        if (!this.healthFill || !this.healthText) return;
        
        const healthPercent = (this.health / this.maxHealth) * 100;
        this.healthFill.style.width = healthPercent + '%';
        this.healthText.current.textContent = Math.max(0, Math.floor(this.health));
        this.healthText.max.textContent = this.maxHealth;
        
        // 更新血条颜色
        this.healthFill.classList.remove('low', 'medium');
        if (healthPercent <= 20) {
            this.healthFill.classList.add('low');
        } else if (healthPercent <= 50) {
            this.healthFill.classList.add('medium');
        }
    }

    updateSkillCDUI() {
        const now = Date.now();
        for (const skillType in this.skillCDs) {
            const remaining = Math.max(0, this.skillCDs[skillType] - now);
            const cdElement = this.skillCDElements[skillType];
            const btnElement = this.skillButtons[skillType];
            
            if (remaining > 0) {
                cdElement.textContent = Math.ceil(remaining / 1000);
                cdElement.classList.add('active');
                btnElement.classList.remove('active');
            } else {
                cdElement.classList.remove('active');
                btnElement.classList.add('active');
            }
        }
    }

    canUseSkill(skillType) {
        const now = Date.now();
        return this.skillCDs[skillType] <= now && !this.isDead;
    }

    useSkill(skillType) {
        if (!this.canUseSkill(skillType)) return false;
        
        const skill = this.character.skills[skillType];
        const now = Date.now();
        this.skillCDs[skillType] = now + (skill.cd * 1000);
        
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;
        }, GAME_CONFIG.ATTACK_DURATION);
        
        return true;
    }

    takeDamage(amount, ignoreShield = false) {
        if (this.isDead) return;
        
        let actualDamage = amount;
        
        // 护盾减伤
        if (this.shieldActive && !ignoreShield) {
            actualDamage = Math.floor(actualDamage * 0.5);
        }
        
        // 防御减伤
        actualDamage = Math.max(1, actualDamage - this.defense);
        
        this.health -= actualDamage;
        
        // 受击状态
        this.isHit = true;
        setTimeout(() => {
            this.isHit = false;
        }, GAME_CONFIG.HIT_DURATION);
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
        
        return actualDamage;
    }

    heal(amount) {
        if (this.isDead) return;
        
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    updatePosition(deltaTime) {
        // 重力
        this.velocityY += GAME_CONFIG.GRAVITY;
        this.y += this.velocityY;
        
        // 地面检测
        if (this.y >= 0) {
            this.y = 0;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        // 移动
        if (this.isMovingLeft) {
            this.x -= GAME_CONFIG.MOVE_SPEED;
        }
        if (this.isMovingRight) {
            this.x += GAME_CONFIG.MOVE_SPEED;
        }
        
        // 扩大边界限制 - 允许更多移动空间
        // 玩家1：可以在左半屏更自由地移动
        // 玩家2：可以在右半屏更自由地移动
        const minX = this.id === 1 ? -300 : -100;
        const maxX = this.id === 1 ? 100 : 300;
        this.x = Math.max(minX, Math.min(maxX, this.x));
    }

    updateVisualState() {
        if (!this.element) return;
        
        // 清除所有状态类
        this.element.classList.remove('jumping', 'crouching', 'moving-left', 'moving-right', 'hit', 'attacking');
        
        // 重新添加状态类
        if (this.isJumping) this.element.classList.add('jumping');
        if (this.isCrouching) this.element.classList.add('crouching');
        if (this.isMovingLeft) this.element.classList.add('moving-left');
        if (this.isMovingRight) this.element.classList.add('moving-right');
        if (this.isHit) this.element.classList.add('hit');
        if (this.isAttacking) this.element.classList.add('attacking');
        
        // 更新位置 - 关键修复：将 this.x 和 this.y 应用到 DOM 元素
        // 注意：this.y 是负数表示向上（跳跃）
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
        
        // 如果有翻转，需要保留翻转效果
        if (this.id === 2) {
            this.element.style.transform = `translate(${this.x}px, ${this.y}px) scaleX(-1)`;
        }
    }

    updateEffects(now) {
        // 更新持续伤害
        this.dotEffects = this.dotEffects.filter(effect => {
            if (now >= effect.nextTick) {
                this.takeDamage(effect.damage, true);
                effect.nextTick = now + 1000;
                effect.ticks--;
                return effect.ticks > 0;
            }
            return true;
        });
        
        // 更新持续治疗
        this.hotEffects = this.hotEffects.filter(effect => {
            if (now >= effect.nextTick) {
                this.heal(effect.healAmount);
                effect.nextTick = now + 1000;
                effect.ticks--;
                return effect.ticks > 0;
            }
            return true;
        });
        
        // 更新护盾
        if (this.shieldActive && now >= this.shieldEndTime) {
            this.shieldActive = false;
        }
    }

    addDotEffect(damage, duration) {
        this.dotEffects.push({
            damage: damage,
            ticks: duration,
            nextTick: Date.now() + 1000
        });
    }

    addHotEffect(healAmount, duration) {
        this.hotEffects.push({
            healAmount: healAmount,
            ticks: duration,
            nextTick: Date.now() + 1000
        });
    }

    activateShield(duration) {
        this.shieldActive = true;
        this.shieldEndTime = Date.now() + (duration * 1000);
    }

    jump() {
        if (!this.isJumping && !this.isCrouching) {
            this.isJumping = true;
            this.velocityY = -GAME_CONFIG.JUMP_FORCE;
        }
    }

    crouch(active) {
        if (!this.isJumping) {
            this.isCrouching = active;
        }
    }
}

// 游戏主类
class Game {
    constructor() {
        this.phase = 'select'; // select, battle, result
        this.p1 = null;
        this.p2 = null;
        this.selectedP1 = null;
        this.selectedP2 = null;
        this.confirmedP1 = null;
        this.confirmedP2 = null;
        
        this.soundSystem = new SoundSystem();
        this.storageSystem = new StorageSystem();
        
        this.keys = {};
        this.lastUpdate = Date.now();
        this.gameLoop = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkSavedState();
    }

    checkSavedState() {
        const saved = this.storageSystem.loadGameState();
        if (saved && saved.gamePhase === 'battle') {
            // 询问是否恢复存档
            const shouldRestore = confirm('检测到未完成的战斗记录，是否恢复？');
            if (shouldRestore) {
                this.restoreGame(saved);
            } else {
                this.storageSystem.clearGameState();
            }
        }
    }

    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyDown(e.code);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.handleKeyUp(e.code);
        });
        
        // 角色卡片点击
        document.querySelectorAll('#player1-select .character-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacter(1, card.dataset.character);
            });
        });
        
        document.querySelectorAll('#player2-select .character-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacter(2, card.dataset.character);
            });
        });
        
        // 开始按钮
        document.getElementById('start-battle').addEventListener('click', () => {
            this.startBattle();
        });
        
        // 重新开始和返回选择
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartBattle();
        });
        
        document.getElementById('back-to-select-btn').addEventListener('click', () => {
            this.backToSelect();
        });
    }

    selectCharacter(playerId, characterType) {
        const prefix = playerId === 1 ? 'player1' : 'player2';
        
        // 更新UI
        document.querySelectorAll(`#${prefix}-select .character-card`).forEach(card => {
            card.classList.remove('selected', 'confirmed');
            if (card.dataset.character === characterType) {
                card.classList.add('selected');
            }
        });
        
        // 记录选择
        if (playerId === 1) {
            this.selectedP1 = characterType;
        } else {
            this.selectedP2 = characterType;
        }
        
        this.updateStartButton();
    }

    confirmSelection(playerId) {
        const prefix = playerId === 1 ? 'player1' : 'player2';
        const selected = playerId === 1 ? this.selectedP1 : this.selectedP2;
        
        if (!selected) return;
        
        // 标记已确认
        document.querySelectorAll(`#${prefix}-select .character-card`).forEach(card => {
            if (card.dataset.character === selected) {
                card.classList.add('confirmed');
            }
        });
        
        if (playerId === 1) {
            this.confirmedP1 = selected;
        } else {
            this.confirmedP2 = selected;
        }
        
        this.soundSystem.playKeyPress();
        this.updateStartButton();
    }

    updateStartButton() {
        const btn = document.getElementById('start-battle');
        const canStart = this.selectedP1 && this.selectedP2;
        
        btn.disabled = !canStart;
        btn.textContent = canStart ? '开始战斗' : '选择角色后开始';
    }

    handleKeyDown(code) {
        this.soundSystem.init();
        
        if (this.phase === 'select') {
            // 玩家1选择控制
            if (code === 'KeyA' || code === 'KeyD') {
                this.handleSelectNavigation(1, code === 'KeyA' ? -1 : 1);
            } else if (code === 'KeyF') {
                if (this.selectedP1) {
                    this.confirmSelection(1);
                }
            }
            
            // 玩家2选择控制
            if (code === 'ArrowLeft' || code === 'ArrowRight') {
                this.handleSelectNavigation(2, code === 'ArrowLeft' ? -1 : 1);
            } else if (code === 'Numpad8' || code === 'Digit8') {
                if (this.selectedP2) {
                    this.confirmSelection(2);
                }
            }
            
            // 如果双方都确认，直接开始
            if (this.confirmedP1 && this.confirmedP2) {
                this.startBattle();
            }
        } else if (this.phase === 'battle') {
            // 玩家1战斗控制
            if (code === 'KeyW') {
                this.p1.jump();
            } else if (code === 'KeyS') {
                this.p1.crouch(true);
            } else if (code === 'KeyA') {
                this.p1.isMovingLeft = true;
            } else if (code === 'KeyD') {
                this.p1.isMovingRight = true;
            } else if (code === 'KeyF') {
                this.executeSkill(1, 'attack');
            } else if (code === 'KeyG') {
                this.executeSkill(1, 'small');
            } else if (code === 'KeyH') {
                this.executeSkill(1, 'ultimate');
            }
            
            // 玩家2战斗控制
            if (code === 'ArrowUp') {
                this.p2.jump();
            } else if (code === 'ArrowDown') {
                this.p2.crouch(true);
            } else if (code === 'ArrowLeft') {
                this.p2.isMovingLeft = true;
            } else if (code === 'ArrowRight') {
                this.p2.isMovingRight = true;
            } else if (code === 'Numpad8' || code === 'Digit8') {
                this.executeSkill(2, 'attack');
            } else if (code === 'Numpad9' || code === 'Digit9') {
                this.executeSkill(2, 'small');
            } else if (code === 'Numpad0' || code === 'Digit0') {
                this.executeSkill(2, 'ultimate');
            }
        }
    }

    handleKeyUp(code) {
        if (this.phase !== 'battle') return;
        
        // 玩家1
        if (code === 'KeyS') {
            this.p1.crouch(false);
        } else if (code === 'KeyA') {
            this.p1.isMovingLeft = false;
        } else if (code === 'KeyD') {
            this.p1.isMovingRight = false;
        }
        
        // 玩家2
        if (code === 'ArrowDown') {
            this.p2.crouch(false);
        } else if (code === 'ArrowLeft') {
            this.p2.isMovingLeft = false;
        } else if (code === 'ArrowRight') {
            this.p2.isMovingRight = false;
        }
    }

    handleSelectNavigation(playerId, direction) {
        const prefix = playerId === 1 ? 'player1' : 'player2';
        const cards = Array.from(document.querySelectorAll(`#${prefix}-select .character-card`));
        const characters = ['qinglong', 'luosha', 'xuannv'];
        const current = playerId === 1 ? this.selectedP1 : this.selectedP2;
        
        let currentIndex = characters.indexOf(current);
        if (currentIndex === -1) currentIndex = 0;
        
        currentIndex = (currentIndex + direction + characters.length) % characters.length;
        this.selectCharacter(playerId, characters[currentIndex]);
    }

    executeSkill(playerId, skillType) {
        const attacker = playerId === 1 ? this.p1 : this.p2;
        const defender = playerId === 1 ? this.p2 : this.p1;
        
        if (!attacker.useSkill(skillType)) {
            return;
        }
        
        const skill = attacker.character.skills[skillType];
        
        // 播放音效
        if (skillType === 'attack') {
            this.soundSystem.playAttack();
        } else if (skillType === 'small') {
            this.soundSystem.playSkill();
        } else if (skillType === 'ultimate') {
            this.soundSystem.playUltimate();
        }
        
        // 显示招式名称
        this.showSkillName(skill.name);
        
        // 创建攻击特效
        this.createAttackEffect(playerId, skillType);
        
        // 计算伤害（简单的范围检测，假设总是命中）
        // 实际游戏中应该基于位置和距离判断
        let actualDamage = attacker.takeDamage === defender.takeDamage ? 0 : 0;
        
        // 计算伤害
        let damage = skill.damage;
        
        // 罗刹普攻有暴击几率
        if (skillType === 'attack' && attacker.characterType === 'luosha') {
            if (Math.random() < 0.3) {
                damage = Math.floor(damage * 1.5);
                this.showFloatText(playerId === 1 ? 2 : 1, '暴击!', false);
            }
        }
        
        // 应用伤害
        actualDamage = defender.takeDamage(damage);
        this.soundSystem.playHit();
        
        // 显示伤害飘字
        this.showFloatText(playerId === 1 ? 2 : 1, actualDamage, false);
        
        // 处理特殊效果
        if (skill.heal) {
            attacker.heal(skill.heal);
            this.showFloatText(playerId, '+' + skill.heal, true);
            this.soundSystem.playHeal();
        }
        
        if (skill.dotDamage) {
            defender.addDotEffect(skill.dotDamage, skill.dotDuration);
        }
        
        if (skill.dotHeal) {
            attacker.addHotEffect(skill.dotHeal, skill.dotHealDuration);
        }
        
        if (skill.shield) {
            attacker.activateShield(skill.shieldDuration);
        }
        
        // 检查胜负
        this.checkBattleEnd();
    }

    showSkillName(name) {
        const layer = document.getElementById('skill-name-layer');
        const text = document.createElement('div');
        text.className = 'skill-name-text';
        text.textContent = name;
        layer.appendChild(text);
        
        setTimeout(() => {
            text.remove();
        }, 1000);
    }

    showFloatText(playerId, text, isHeal) {
        const layer = document.getElementById('float-text-layer');
        const floatText = document.createElement('div');
        floatText.className = 'float-text' + (isHeal ? ' heal' : '');
        floatText.textContent = isHeal ? text : '-' + text;
        
        // 计算位置
        const area = playerId === 1 ? 'player1-area' : 'player2-area';
        const areaElement = document.querySelector('.' + area);
        const rect = areaElement.getBoundingClientRect();
        
        floatText.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 100) + 'px';
        floatText.style.top = (rect.top + rect.height / 2) + 'px';
        
        layer.appendChild(floatText);
        
        setTimeout(() => {
            floatText.remove();
        }, 1500);
    }

    createAttackEffect(playerId, skillType) {
        const layer = document.getElementById('effects-layer');
        const attacker = playerId === 1 ? this.p1 : this.p2;
        
        // 全屏特效（大招）
        if (skillType === 'ultimate') {
            const fullEffect = document.createElement('div');
            fullEffect.className = 'fullscreen-effect ' + attacker.characterType;
            layer.appendChild(fullEffect);
            
            setTimeout(() => {
                fullEffect.remove();
            }, 1000);
        }
        
        // 普通攻击特效
        const effect = document.createElement('div');
        effect.className = 'attack-effect ' + attacker.characterType;
        
        // 计算位置
        const area = playerId === 1 ? 'player1-area' : 'player2-area';
        const areaElement = document.querySelector('.' + area);
        const rect = areaElement.getBoundingClientRect();
        
        effect.style.left = (rect.left + rect.width / 2) + 'px';
        effect.style.top = (rect.top + rect.height / 2) + 'px';
        
        layer.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 400);
    }

    checkBattleEnd() {
        if (this.p1.isDead || this.p2.isDead) {
            this.endBattle();
        }
    }

    startBattle() {
        if (!this.selectedP1 || !this.selectedP2) return;
        
        // 清除存档
        this.storageSystem.clearGameState();
        
        // 创建玩家
        this.p1 = new Player(1, this.selectedP1);
        this.p2 = new Player(2, this.selectedP2);
        
        // 切换界面
        document.getElementById('character-select').classList.remove('active');
        document.getElementById('battle-screen').classList.add('active');
        
        // 初始化元素
        this.p1.initElements();
        this.p2.initElements();
        
        // 更新UI
        this.p1.updateHealthUI();
        this.p2.updateHealthUI();
        
        // 开始游戏循环
        this.phase = 'battle';
        this.lastUpdate = Date.now();
        this.startGameLoop();
        
        this.soundSystem.playKeyPress();
    }

    restoreGame(saved) {
        // 创建玩家
        this.p1 = new Player(1, saved.p1Character);
        this.p2 = new Player(2, saved.p2Character);
        
        // 恢复状态
        this.p1.health = saved.p1Health;
        this.p2.health = saved.p2Health;
        this.p1.skillCDs = saved.p1SkillCDs;
        this.p2.skillCDs = saved.p2SkillCDs;
        
        // 切换界面
        document.getElementById('character-select').classList.remove('active');
        document.getElementById('battle-screen').classList.add('active');
        
        // 初始化元素
        this.p1.initElements();
        this.p2.initElements();
        
        // 更新UI
        this.p1.updateHealthUI();
        this.p2.updateHealthUI();
        
        // 开始游戏循环
        this.phase = 'battle';
        this.lastUpdate = Date.now();
        this.startGameLoop();
    }

    startGameLoop() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        const loop = () => {
            const now = Date.now();
            const deltaTime = now - this.lastUpdate;
            this.lastUpdate = now;
            
            this.update(deltaTime, now);
            
            if (this.phase === 'battle') {
                this.gameLoop = requestAnimationFrame(loop);
            }
        };
        
        this.gameLoop = requestAnimationFrame(loop);
    }

    update(deltaTime, now) {
        // 更新玩家位置
        this.p1.updatePosition(deltaTime);
        this.p2.updatePosition(deltaTime);
        
        // 更新持续效果
        this.p1.updateEffects(now);
        this.p2.updateEffects(now);
        
        // 更新视觉状态
        this.p1.updateVisualState();
        this.p2.updateVisualState();
        
        // 更新UI
        this.p1.updateHealthUI();
        this.p2.updateHealthUI();
        this.p1.updateSkillCDUI();
        this.p2.updateSkillCDUI();
        
        // 保存游戏状态
        this.storageSystem.saveGameState(this);
        
        // 检查战斗结束
        this.checkBattleEnd();
    }

    endBattle() {
        this.phase = 'result';
        
        // 停止游戏循环
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        // 清除存档
        this.storageSystem.clearGameState();
        
        // 显示结果
        const resultModal = document.getElementById('result-modal');
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');
        
        if (this.p1.isDead && this.p2.isDead) {
            resultTitle.textContent = '平局！';
            resultMessage.textContent = '双方同归于尽';
            this.soundSystem.playDefeat();
        } else if (this.p1.isDead) {
            resultTitle.textContent = '战斗结束';
            resultMessage.textContent = '玩家二获胜！';
            this.soundSystem.playVictory();
        } else {
            resultTitle.textContent = '战斗结束';
            resultMessage.textContent = '玩家一获胜！';
            this.soundSystem.playVictory();
        }
        
        resultModal.classList.remove('hidden');
    }

    restartBattle() {
        // 隐藏结果
        document.getElementById('result-modal').classList.add('hidden');
        
        // 重置玩家
        this.p1 = new Player(1, this.p1.characterType);
        this.p2 = new Player(2, this.p2.characterType);
        
        // 初始化元素
        this.p1.initElements();
        this.p2.initElements();
        
        // 更新UI
        this.p1.updateHealthUI();
        this.p2.updateHealthUI();
        
        // 开始战斗
        this.phase = 'battle';
        this.lastUpdate = Date.now();
        this.startGameLoop();
        
        this.soundSystem.playKeyPress();
    }

    backToSelect() {
        // 隐藏结果
        document.getElementById('result-modal').classList.add('hidden');
        
        // 切换界面
        document.getElementById('battle-screen').classList.remove('active');
        document.getElementById('character-select').classList.add('active');
        
        // 重置选择
        this.selectedP1 = null;
        this.selectedP2 = null;
        this.confirmedP1 = null;
        this.confirmedP2 = null;
        
        // 重置卡片样式
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected', 'confirmed');
        });
        
        this.updateStartButton();
        this.phase = 'select';
        
        this.soundSystem.playKeyPress();
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});

// 页面刷新或关闭时保存状态
window.addEventListener('beforeunload', () => {
    // 游戏循环会自动保存，这里不需要额外操作
});