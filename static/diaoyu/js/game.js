const FISH_DATA = [
    { id: 1, name: '小鲫鱼', emoji: '🐟', rarity: 'common', baseScore: 10, waitMin: 3, waitMax: 5, difficulty: 'easy' },
    { id: 2, name: '小鲤鱼', emoji: '🐟', rarity: 'common', baseScore: 15, waitMin: 3, waitMax: 5, difficulty: 'easy' },
    { id: 3, name: '小鲈鱼', emoji: '🐟', rarity: 'common', baseScore: 20, waitMin: 4, waitMax: 6, difficulty: 'easy' },
    { id: 4, name: '金鱼', emoji: '🐠', rarity: 'rare', baseScore: 40, waitMin: 5, waitMax: 7, difficulty: 'medium' },
    { id: 5, name: '锦鲤', emoji: '🐠', rarity: 'rare', baseScore: 50, waitMin: 6, waitMax: 8, difficulty: 'medium' },
    { id: 6, name: '河豚', emoji: '🐡', rarity: 'rare', baseScore: 60, waitMin: 5, waitMax: 7, difficulty: 'medium' },
    { id: 7, name: '鲑鱼', emoji: '🐟', rarity: 'rare', baseScore: 70, waitMin: 7, waitMax: 9, difficulty: 'medium' },
    { id: 8, name: '鳟鱼', emoji: '🐟', rarity: 'epic', baseScore: 100, waitMin: 8, waitMax: 10, difficulty: 'hard' },
    { id: 9, name: '鲟鱼', emoji: '🐟', rarity: 'epic', baseScore: 120, waitMin: 9, waitMax: 11, difficulty: 'hard' },
    { id: 10, name: '龙鱼', emoji: '🐉', rarity: 'legend', baseScore: 200, waitMin: 12, waitMax: 15, difficulty: 'hard' },
    { id: 11, name: '章鱼', emoji: '🦑', rarity: 'legend', baseScore: 250, waitMin: 10, waitMax: 12, difficulty: 'hard' },
    { id: 12, name: '鲸鱼', emoji: '🐋', rarity: 'mythic', baseScore: 500, waitMin: 15, waitMax: 18, difficulty: 'extreme' }
];

const RARITY_CONFIG = {
    common: { name: '普通', probability: 0.50, color: '#4CAF50' },
    rare: { name: '稀有', probability: 0.30, color: '#9C27B0' },
    epic: { name: '史诗', probability: 0.15, color: '#FF5722' },
    legend: { name: '传说', probability: 0.04, color: '#FFD700' },
    mythic: { name: '神话', probability: 0.01, color: '#E91E63' }
};

const RARITY_CLASS_MAP = {
    common: 'rarity-common',
    rare: 'rarity-rare',
    epic: 'rarity-epic',
    legend: 'rarity-legend',
    mythic: 'rarity-mythic'
};

const GAME_STATE = {
    IDLE: 'idle',
    CASTING: 'casting',
    WAITING: 'waiting',
    BITING: 'biting',
    REELING: 'reeling',
    SHOW_RESULT: 'show_result',
    PAUSED: 'paused'
};

const TIMING_RESULT = {
    PERFECT: 'perfect',
    GOOD: 'good',
    BARELY: 'barely',
    FAIL: 'fail',
    TOO_EARLY: 'too_early'
};

const STORAGE_KEY = 'fishingGameData_final';

console.log('========================================');
console.log('🎣 治愈系钓鱼游戏 - 脚本开始加载');
console.log('========================================');
console.log('📅 当前时间:', new Date().toLocaleString());
console.log('📄 文档状态:', document.readyState);
console.log('💾 Storage Key:', STORAGE_KEY);
console.log('========================================');

function directSave(score, catches, unlockedArray) {
    console.log('');
    console.log('📦 直接保存数据到 localStorage');
    console.log('  - totalScore:', score);
    console.log('  - totalCatches:', catches);
    console.log('  - unlockedFish:', unlockedArray);
    
    try {
        const data = {
            totalScore: score,
            totalCatches: catches,
            unlockedFish: unlockedArray,
            savedAt: Date.now()
        };
        
        const jsonString = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, jsonString);
        
        console.log('✅ 保存成功!');
        console.log('💾 原始数据:', jsonString);
        
        return true;
    } catch (error) {
        console.error('❌ 保存失败:', error);
        return false;
    }
}

function directLoad() {
    console.log('');
    console.log('📂 直接从 localStorage 加载数据');
    console.log('🔑 查找 key:', STORAGE_KEY);
    
    try {
        const jsonString = localStorage.getItem(STORAGE_KEY);
        
        console.log('📋 localStorage 全部内容:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`  [${i}] "${key}":`, value);
        }
        
        if (jsonString === null) {
            console.log('ℹ️ 没有找到存档数据，返回默认值');
            return {
                totalScore: 0,
                totalCatches: 0,
                unlockedFish: []
            };
        }
        
        console.log('✅ 找到存档数据:', jsonString);
        
        const data = JSON.parse(jsonString);
        
        console.log('📊 解析后的数据:');
        console.log('  - totalScore:', data.totalScore);
        console.log('  - totalCatches:', data.totalCatches);
        console.log('  - unlockedFish:', data.unlockedFish);
        
        return {
            totalScore: data.totalScore || 0,
            totalCatches: data.totalCatches || 0,
            unlockedFish: data.unlockedFish || []
        };
        
    } catch (error) {
        console.error('❌ 加载失败:', error);
        console.log('ℹ️ 返回默认值');
        return {
            totalScore: 0,
            totalCatches: 0,
            unlockedFish: []
        };
    }
}

function getElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn('⚠️ 未找到元素:', id);
    }
    return el;
}

class SimpleGameData {
    constructor() {
        console.log('');
        console.log('🎮 创建 SimpleGameData 实例');
        
        this._totalScore = 0;
        this._totalCatches = 0;
        this._unlockedFish = [];
        
        console.log('  - 初始值:');
        console.log('    * totalScore:', this._totalScore);
        console.log('    * totalCatches:', this._totalCatches);
        console.log('    * unlockedFish:', this._unlockedFish);
    }
    
    loadFromStorage() {
        console.log('');
        console.log('📂 SimpleGameData.loadFromStorage() 调用');
        
        const data = directLoad();
        
        this._totalScore = data.totalScore;
        this._totalCatches = data.totalCatches;
        this._unlockedFish = [...data.unlockedFish];
        
        console.log('✅ 加载完成后的数据:');
        console.log('  - totalScore:', this._totalScore);
        console.log('  - totalCatches:', this._totalCatches);
        console.log('  - unlockedFish:', this._unlockedFish);
        
        return data;
    }
    
    get totalScore() {
        return this._totalScore;
    }
    
    get totalCatches() {
        return this._totalCatches;
    }
    
    get unlockedFish() {
        return this._unlockedFish;
    }
    
    addScore(points) {
        this._totalScore += points;
        console.log('➕ 添加分数:', points, '-> 新总分:', this._totalScore);
        this.saveNow();
        return this._totalScore;
    }
    
    addCatch() {
        this._totalCatches++;
        console.log('🎣 钓获数 +1 -> 新总数:', this._totalCatches);
        this.saveNow();
        return this._totalCatches;
    }
    
    unlockFish(fishId) {
        if (!this._unlockedFish.includes(fishId)) {
            this._unlockedFish.push(fishId);
            console.log('🔓 解锁鱼类 id:', fishId, '-> 已解锁:', this._unlockedFish);
            this.saveNow();
            return true;
        }
        console.log('ℹ️ 鱼类已解锁 id:', fishId);
        return false;
    }
    
    isFishUnlocked(fishId) {
        return this._unlockedFish.includes(fishId);
    }
    
    getUnlockedCount() {
        return this._unlockedFish.length;
    }
    
    saveNow() {
        console.log('');
        console.log('💾 SimpleGameData.saveNow() 调用');
        console.log('  即将保存的数据:');
        console.log('    - totalScore:', this._totalScore);
        console.log('    - totalCatches:', this._totalCatches);
        console.log('    - unlockedFish:', this._unlockedFish);
        
        return directSave(
            this._totalScore,
            this._totalCatches,
            this._unlockedFish
        );
    }
}

class FishingGame {
    constructor() {
        console.log('');
        console.log('🎣 FishingGame 构造函数开始');
        
        this.canvas = null;
        this.ctx = null;
        this.state = GAME_STATE.IDLE;
        
        this.gameData = new SimpleGameData();
        
        this.currentFish = null;
        this.biteStartTime = 0;
        this.waitStartTime = 0;
        this.waitDuration = 0;
        
        this.animationFrameId = null;
        this.waitTimeoutId = null;
        this.biteTimeoutId = null;
        this.resultTimeoutId = null;
        
        this.bobberY = 0;
        this.bobberTargetY = 0;
        this.waterWaves = [];
        this.lastTime = 0;
        
        this.btnCast = null;
        this.btnReel = null;
        this.btnRestart = null;
        this.btnCodex = null;
        this.btnPause = null;
        this.btnCloseCodex = null;
        
        this.statusText = null;
        this.totalScoreEl = null;
        this.totalCatchesEl = null;
        this.fishCountEl = null;
        
        this.resultModal = null;
        this.codexModal = null;
        
        console.log('🎣 FishingGame 构造函数结束');
    }

    init() {
        console.log('');
        console.log('🚀 FishingGame.init() 开始');
        console.log('========================================');
        
        console.log('');
        console.log('📂 步骤1: 从 localStorage 加载数据');
        const loadedData = this.gameData.loadFromStorage();
        
        console.log('');
        console.log('🎨 步骤2: 设置 Canvas');
        this.canvas = getElement('game-canvas');
        if (!this.canvas) {
            console.error('❌ Canvas 未找到!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        console.log('✅ Canvas 设置完成');
        
        console.log('');
        console.log('🔘 步骤3: 缓存 DOM 元素');
        this.cacheDOMElements();
        
        console.log('');
        console.log('📐 步骤4: 设置 Canvas 尺寸');
        this.setupCanvas();
        
        console.log('');
        console.log('🎧 步骤5: 绑定事件监听');
        this.setupEventListeners();
        
        console.log('');
        console.log('🖼️ 步骤6: 更新 UI 显示');
        this.updateUI();
        
        console.log('');
        console.log('🔘 步骤7: 更新按钮状态');
        this.updateButtons();
        
        console.log('');
        console.log('🎬 步骤8: 启动渲染循环');
        this.startRenderLoop();
        
        console.log('');
        console.log('🌊 步骤9: 启动水波动画');
        this.startWaterWaves();
        
        console.log('');
        console.log('========================================');
        console.log('✅ FishingGame.init() 完成');
        console.log('========================================');
        console.log('📊 当前游戏状态:');
        console.log('  - state:', this.state);
        console.log('  - totalScore:', this.gameData.totalScore);
        console.log('  - totalCatches:', this.gameData.totalCatches);
        console.log('  - unlockedFish:', this.gameData.unlockedFish);
        console.log('========================================');
        
        console.log('');
        console.log('📋 测试说明:');
        console.log('   1. 现在 UI 应该显示加载的数据');
        console.log('   2. 如果是第一次玩，应该显示 0 分 0 钓获');
        console.log('   3. 钓几条鱼后，检查 Console 中的保存日志');
        console.log('   4. 刷新页面后，检查数据是否保持');
        console.log('');
    }

    cacheDOMElements() {
        console.log('📦 缓存 DOM 元素...');
        
        this.btnCast = getElement('btn-cast');
        this.btnReel = getElement('btn-reel');
        this.btnRestart = getElement('btn-restart');
        this.btnCodex = getElement('btn-codex');
        this.btnPause = getElement('btn-pause');
        this.btnCloseCodex = getElement('btn-close-codex');
        
        this.statusText = getElement('game-status');
        this.totalScoreEl = getElement('total-score');
        this.totalCatchesEl = getElement('total-catches');
        this.fishCountEl = getElement('fish-count');
        
        this.resultModal = getElement('result-modal');
        this.codexModal = getElement('codex-modal');
        
        console.log('✅ DOM 元素缓存完成');
        console.log('  - btnCast:', !!this.btnCast);
        console.log('  - btnReel:', !!this.btnReel);
        console.log('  - btnRestart:', !!this.btnRestart);
        console.log('  - totalScoreEl:', !!this.totalScoreEl);
        console.log('  - totalCatchesEl:', !!this.totalCatchesEl);
        console.log('  - fishCountEl:', !!this.fishCountEl);
    }

    setupCanvas() {
        const resize = () => {
            if (!this.canvas) return;
            const container = this.canvas.parentElement;
            if (container) {
                this.canvas.width = container.clientWidth;
                this.canvas.height = container.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);
    }

    setupEventListeners() {
        console.log('🎧 设置事件监听...');
        
        if (this.btnCast) {
            this.btnCast.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('👆 抛竿按钮点击');
                this.handleCast();
            });
        }
        
        if (this.btnReel) {
            this.btnReel.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('👆 收杆按钮点击');
                this.handleReel();
            });
        }
        
        if (this.btnRestart) {
            this.btnRestart.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('👆 重新开始按钮点击');
                this.handleRestart();
            });
        }
        
        if (this.btnCodex) {
            this.btnCodex.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showCodex();
            });
        }
        
        if (this.btnCloseCodex) {
            this.btnCloseCodex.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideCodex();
            });
        }
        
        if (this.codexModal) {
            this.codexModal.addEventListener('click', (e) => {
                if (e.target === this.codexModal) {
                    this.hideCodex();
                }
            });
        }
        
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => {
                console.log('👆 Canvas 点击, state:', this.state);
                
                if (this.state === GAME_STATE.WAITING || this.state === GAME_STATE.BITING) {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const bobberX = this.canvas.width / 2;
                    const bobberY = this.bobberY;
                    const distance = Math.sqrt(Math.pow(x - bobberX, 2) + Math.pow(y - bobberY, 2));
                    
                    console.log('📍 点击位置距离浮漂:', distance);
                    
                    if (distance < 60) {
                        console.log('👆 点击到浮漂，触发收杆');
                        this.handleReel();
                    }
                }
            });
        }
        
        window.addEventListener('beforeunload', () => {
            console.log('');
            console.log('🚪 页面即将卸载，强制保存数据');
            this.gameData.saveNow();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('');
                console.log('👁️ 页面隐藏，保存数据');
                this.gameData.saveNow();
            }
        });
        
        console.log('✅ 事件监听设置完成');
    }

    updateUI() {
        console.log('');
        console.log('🖼️ 更新 UI 显示...');
        console.log('  数据:');
        console.log('    - totalScore:', this.gameData.totalScore);
        console.log('    - totalCatches:', this.gameData.totalCatches);
        console.log('    - unlockedCount:', this.gameData.getUnlockedCount());
        
        if (this.totalScoreEl) {
            this.totalScoreEl.textContent = this.gameData.totalScore;
            console.log('✅ 更新 totalScore 显示:', this.gameData.totalScore);
        } else {
            console.log('❌ totalScoreEl 不存在!');
        }
        
        if (this.totalCatchesEl) {
            this.totalCatchesEl.textContent = this.gameData.totalCatches;
            console.log('✅ 更新 totalCatches 显示:', this.gameData.totalCatches);
        } else {
            console.log('❌ totalCatchesEl 不存在!');
        }
        
        if (this.fishCountEl) {
            const count = `${this.gameData.getUnlockedCount()}/12`;
            this.fishCountEl.textContent = count;
            console.log('✅ 更新 fishCount 显示:', count);
        } else {
            console.log('❌ fishCountEl 不存在!');
        }
        
        console.log('✅ UI 更新完成');
    }

    updateButtons() {
        console.log('🔘 更新按钮状态, current state:', this.state);
        
        if (this.state === GAME_STATE.IDLE || this.state === GAME_STATE.SHOW_RESULT) {
            if (this.btnCast) {
                this.btnCast.style.display = 'inline-flex';
                console.log('✅ 显示抛竿按钮');
            }
            if (this.btnReel) {
                this.btnReel.style.display = 'none';
            }
            if (this.btnPause) {
                this.btnPause.style.display = 'none';
            }
        } else if (this.state === GAME_STATE.WAITING) {
            if (this.btnCast) {
                this.btnCast.style.display = 'none';
            }
            if (this.btnReel) {
                this.btnReel.style.display = 'none';
            }
            if (this.btnPause) {
                this.btnPause.style.display = 'inline-flex';
            }
        } else if (this.state === GAME_STATE.BITING) {
            if (this.btnCast) {
                this.btnCast.style.display = 'none';
            }
            if (this.btnReel) {
                this.btnReel.style.display = 'inline-flex';
                console.log('✅ 显示收杆按钮');
            }
            if (this.btnPause) {
                this.btnPause.style.display = 'inline-flex';
            }
        }
    }

    setStatus(text) {
        console.log('📝 设置状态文字:', text);
        if (this.statusText) {
            this.statusText.textContent = text;
        }
    }

    clearAllTimeouts() {
        console.log('🧹 清除所有定时器');
        
        if (this.waitTimeoutId) {
            clearTimeout(this.waitTimeoutId);
            this.waitTimeoutId = null;
            console.log('  - 清除 waitTimeoutId');
        }
        if (this.biteTimeoutId) {
            clearTimeout(this.biteTimeoutId);
            this.biteTimeoutId = null;
            console.log('  - 清除 biteTimeoutId');
        }
        if (this.resultTimeoutId) {
            clearTimeout(this.resultTimeoutId);
            this.resultTimeoutId = null;
            console.log('  - 清除 resultTimeoutId');
        }
    }

    handleCast() {
        console.log('');
        console.log('🎣 handleCast() 调用, current state:', this.state);
        
        if (this.state !== GAME_STATE.IDLE && this.state !== GAME_STATE.SHOW_RESULT) {
            console.log('⚠️ 无法抛竿，状态不允许');
            return;
        }
        
        this.clearAllTimeouts();
        this.state = GAME_STATE.CASTING;
        this.setStatus('抛竿中...');
        this.updateButtons();
        
        const centerX = this.canvas.width / 2;
        const waterY = this.canvas.height * 0.35;
        
        this.bobberY = -20;
        this.bobberTargetY = waterY;
        
        const castDuration = 800;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / castDuration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            
            this.bobberY = -20 + (waterY + 20) * ease;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.createSplash(centerX, waterY);
                this.startWaiting();
            }
        };
        
        animate();
    }

    startWaiting() {
        console.log('');
        console.log('⏳ startWaiting() 调用');
        
        this.state = GAME_STATE.WAITING;
        this.currentFish = this.selectFish();
        
        console.log('🐟 选中鱼类:', this.currentFish.name);
        
        const waitTime = this.randomRange(
            this.currentFish.waitMin * 1000,
            this.currentFish.waitMax * 1000
        );
        
        this.waitStartTime = Date.now();
        this.waitDuration = waitTime;
        
        console.log('⏱️ 等待时间:', waitTime, 'ms');
        
        this.setStatus('鱼钩已入水，静静等待...');
        this.updateButtons();
        
        this.waitTimeoutId = setTimeout(() => {
            if (this.state === GAME_STATE.WAITING) {
                console.log('🐟 鱼开始咬钩!');
                this.startBiting();
            }
        }, waitTime);
    }

    startBiting() {
        console.log('');
        console.log('🎣 startBiting() 调用');
        
        this.state = GAME_STATE.BITING;
        this.biteStartTime = Date.now();
        
        this.setStatus('鱼咬钩了! 快点击收杆!');
        this.updateButtons();
        
        if (this.statusText) {
            this.statusText.classList.add('biting');
        }
        
        this.biteTimeoutId = setTimeout(() => {
            if (this.state === GAME_STATE.BITING) {
                console.log('⏰ 超时，鱼逃跑了');
                this.handleFail('超时');
            }
        }, 1500);
    }

    handleReel() {
        console.log('');
        console.log('🎣 handleReel() 调用, state:', this.state);
        
        this.clearAllTimeouts();
        
        if (this.statusText) {
            this.statusText.classList.remove('biting');
        }
        
        if (this.state === GAME_STATE.WAITING) {
            console.log('⚠️ 收杆太早!');
            this.handleTooEarly();
        } else if (this.state === GAME_STATE.BITING) {
            console.log('✅ 时机正确，处理收杆');
            this.processReel();
        } else {
            console.log('⚠️ 无效状态:', this.state);
        }
    }

    handleTooEarly() {
        console.log('');
        console.log('❌ handleTooEarly() 调用');
        
        this.state = GAME_STATE.SHOW_RESULT;
        this.showResult({
            success: false,
            timing: TIMING_RESULT.TOO_EARLY,
            fish: null,
            score: 0,
            message: '还没咬钩就收杆了...'
        });
        this.updateButtons();
    }

    processReel() {
        console.log('');
        console.log('🎣 processReel() 调用');
        
        this.state = GAME_STATE.REELING;
        
        const reactionTime = Date.now() - this.biteStartTime;
        console.log('⏱️ 反应时间:', reactionTime, 'ms');
        
        let timing;
        let scoreMultiplier;
        let isCritical = false;
        
        if (reactionTime <= 300) {
            timing = TIMING_RESULT.PERFECT;
            scoreMultiplier = 2;
            isCritical = true;
            console.log('⭐ 完美时机! 双倍得分');
        } else if (reactionTime <= 1000) {
            timing = TIMING_RESULT.GOOD;
            scoreMultiplier = 1;
            console.log('✅ 时机不错!');
        } else if (reactionTime <= 1500) {
            timing = TIMING_RESULT.BARELY;
            scoreMultiplier = 0.5;
            console.log('😅 勉强钓到...');
        } else {
            timing = TIMING_RESULT.FAIL;
            scoreMultiplier = 0;
            console.log('❌ 时机太晚');
        }
        
        const success = scoreMultiplier > 0;
        const earnedScore = Math.floor(this.currentFish.baseScore * scoreMultiplier);
        
        console.log('');
        console.log('📊 结果:');
        console.log('  - success:', success);
        console.log('  - earnedScore:', earnedScore);
        console.log('  - fish:', this.currentFish.name);
        
        this.state = GAME_STATE.SHOW_RESULT;
        
        if (success) {
            console.log('');
            console.log('🎉 成功钓到鱼! 更新数据并保存...');
            
            this.gameData.addScore(earnedScore);
            this.gameData.addCatch();
            this.gameData.unlockFish(this.currentFish.id);
            
            console.log('');
            console.log('📊 更新后的数据:');
            console.log('  - totalScore:', this.gameData.totalScore);
            console.log('  - totalCatches:', this.gameData.totalCatches);
            console.log('  - unlockedFish:', this.gameData.unlockedFish);
            
            this.showResult({
                success: true,
                timing: timing,
                fish: this.currentFish,
                score: earnedScore,
                isCritical: isCritical,
                message: this.getTimingMessage(timing)
            });
            
            console.log('');
            console.log('🖼️ 更新 UI 显示...');
            this.updateUI();
            
        } else {
            this.handleFail('时机太晚');
        }
        
        this.updateButtons();
    }

    handleFail(reason) {
        console.log('');
        console.log('❌ handleFail() 调用, reason:', reason);
        
        this.state = GAME_STATE.SHOW_RESULT;
        
        if (this.statusText) {
            this.statusText.classList.remove('biting');
        }
        
        this.showResult({
            success: false,
            timing: TIMING_RESULT.FAIL,
            fish: null,
            score: 0,
            message: reason === '超时' ? '鱼逃跑了...' : '时机不对...'
        });
        
        this.updateButtons();
    }

    showResult(result) {
        console.log('');
        console.log('📊 showResult() 调用, success:', result.success);
        
        if (!this.resultModal) return;
        
        const icon = getElement('result-icon');
        const title = getElement('result-title');
        const fishName = getElement('result-fish-name');
        const score = getElement('result-score');
        const timing = getElement('result-timing');
        
        if (result.success) {
            if (icon) icon.textContent = result.fish.emoji;
            if (title) title.textContent = result.isCritical ? '✨ 暴击! ✨' : '钓到鱼了!';
            if (fishName) fishName.textContent = result.fish.name;
            if (score) {
                score.textContent = `+${result.score}分`;
                score.style.color = this.getRarityColor(result.fish.rarity);
            }
            if (timing) {
                timing.textContent = result.message;
                timing.className = 'timing-text ' + this.getTimingClass(result.timing);
                timing.style.display = 'inline-block';
            }
        } else {
            if (icon) icon.textContent = '💨';
            if (title) title.textContent = result.timing === TIMING_RESULT.TOO_EARLY ? '收杆太早!' : '鱼逃跑了...';
            if (fishName) fishName.textContent = result.message;
            if (score) {
                score.textContent = '+0分';
                score.style.color = '#F44336';
            }
            if (timing) timing.style.display = 'none';
        }
        
        this.resultModal.style.display = 'flex';
        
        this.resultTimeoutId = setTimeout(() => {
            this.resultModal.style.display = 'none';
            this.continueGame();
        }, 2000);
    }

    continueGame() {
        console.log('');
        console.log('🔄 continueGame() 调用');
        
        this.state = GAME_STATE.IDLE;
        this.currentFish = null;
        this.bobberY = 0;
        
        this.setStatus('点击「抛竿」继续钓鱼');
        this.updateButtons();
    }

    handleRestart() {
        console.log('');
        console.log('🔄 handleRestart() 调用');
        console.log('⚠️ 注意: 重新开始不会清除存档数据，只会重置当前钓鱼状态');
        
        this.clearAllTimeouts();
        
        this.state = GAME_STATE.IDLE;
        this.currentFish = null;
        this.bobberY = 0;
        this.waterWaves = [];
        
        if (this.statusText) {
            this.statusText.classList.remove('biting');
        }
        
        if (this.resultModal) {
            this.resultModal.style.display = 'none';
        }
        
        this.setStatus('点击「抛竿」开始钓鱼');
        
        console.log('');
        console.log('📊 当前存档数据:');
        console.log('  - totalScore:', this.gameData.totalScore);
        console.log('  - totalCatches:', this.gameData.totalCatches);
        console.log('  - unlockedFish:', this.gameData.unlockedFish);
        
        console.log('');
        console.log('🖼️ 重新更新 UI 显示...');
        this.updateUI();
        this.updateButtons();
        
        console.log('✅ 重新开始完成');
    }

    selectFish() {
        const rand = Math.random();
        let cumulative = 0;
        let selectedRarity = 'common';
        
        for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
            cumulative += config.probability;
            if (rand <= cumulative) {
                selectedRarity = rarity;
                break;
            }
        }
        
        const fishOfRarity = FISH_DATA.filter(f => f.rarity === selectedRarity);
        return fishOfRarity[Math.floor(Math.random() * fishOfRarity.length)];
    }

    getTimingMessage(timing) {
        switch (timing) {
            case TIMING_RESULT.PERFECT: return '完美时机! 双倍得分!';
            case TIMING_RESULT.GOOD: return '时机不错!';
            case TIMING_RESULT.BARELY: return '勉强钓到...';
            default: return '';
        }
    }

    getTimingClass(timing) {
        switch (timing) {
            case TIMING_RESULT.PERFECT: return 'timing-perfect';
            case TIMING_RESULT.GOOD: return 'timing-good';
            case TIMING_RESULT.BARELY: return 'timing-barely';
            default: return 'timing-fail';
        }
    }

    getRarityColor(rarity) {
        return RARITY_CONFIG[rarity]?.color || '#4CAF50';
    }

    createSplash(x, y) {
        for (let i = 0; i < 8; i++) {
            this.waterWaves.push({
                x: x,
                y: y,
                radius: 5,
                maxRadius: 40 + Math.random() * 20,
                alpha: 0.8,
                speed: 1 + Math.random()
            });
        }
    }

    startWaterWaves() {
        const createWave = () => {
            if (this.state === GAME_STATE.WAITING || this.state === GAME_STATE.BITING) {
                this.waterWaves.push({
                    x: this.canvas.width / 2 + (Math.random() - 0.5) * 100,
                    y: this.bobberY + 10 + Math.random() * 50,
                    radius: 2,
                    maxRadius: 30 + Math.random() * 20,
                    alpha: 0.5,
                    speed: 0.5 + Math.random() * 0.5
                });
            }
            setTimeout(createWave, 2000 + Math.random() * 3000);
        };
        createWave();
    }

    startRenderLoop() {
        const render = () => {
            this.draw();
            this.animationFrameId = requestAnimationFrame(render);
        };
        render();
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        
        const now = Date.now();
        this.lastTime = now;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawWater();
        
        if (this.bobberY > 0 || this.state !== GAME_STATE.IDLE) {
            this.drawBobber();
        }
        
        this.drawFishingRod();
    }

    drawBackground() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, height * 0.6);
        skyGradient.addColorStop(0, '#FF9B7B');
        skyGradient.addColorStop(0.3, '#FFDE7D');
        skyGradient.addColorStop(0.6, '#87CEEB');
        skyGradient.addColorStop(1, '#B0E0E6');
        
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, width, height * 0.6);
        
        const sunX = width * 0.2;
        const sunY = height * 0.2;
        const sunRadius = Math.min(width, height) * 0.08;
        
        const sunGlow = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3);
        sunGlow.addColorStop(0, 'rgba(255, 217, 61, 0.4)');
        sunGlow.addColorStop(0.5, 'rgba(255, 217, 61, 0.2)');
        sunGlow.addColorStop(1, 'rgba(255, 217, 61, 0)');
        
        this.ctx.fillStyle = sunGlow;
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, sunRadius * 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#6B8E6B';
        this.ctx.beginPath();
        this.ctx.moveTo(0, height * 0.55);
        this.ctx.quadraticCurveTo(width * 0.25, height * 0.45, width * 0.5, height * 0.5);
        this.ctx.quadraticCurveTo(width * 0.75, height * 0.55, width, height * 0.48);
        this.ctx.lineTo(width, height * 0.6);
        this.ctx.lineTo(0, height * 0.6);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#5D7B5D';
        this.ctx.beginPath();
        this.ctx.moveTo(0, height * 0.58);
        this.ctx.quadraticCurveTo(width * 0.3, height * 0.52, width * 0.6, height * 0.55);
        this.ctx.quadraticCurveTo(width * 0.8, height * 0.58, width, height * 0.52);
        this.ctx.lineTo(width, height * 0.6);
        this.ctx.lineTo(0, height * 0.6);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawWater() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const waterTop = height * 0.35;
        
        const waterGradient = this.ctx.createLinearGradient(0, waterTop, 0, height);
        waterGradient.addColorStop(0, 'rgba(78, 205, 196, 0.9)');
        waterGradient.addColorStop(0.3, 'rgba(68, 160, 141, 0.9)');
        waterGradient.addColorStop(0.7, 'rgba(44, 95, 111, 0.95)');
        waterGradient.addColorStop(1, 'rgba(30, 60, 80, 1)');
        
        this.ctx.fillStyle = waterGradient;
        this.ctx.fillRect(0, waterTop, width, height - waterTop);
        
        const time = Date.now() / 1000;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            const y = waterTop + 20 + i * 30;
            for (let x = 0; x <= width; x += 5) {
                const waveY = y + Math.sin(x / 50 + time + i) * 3;
                if (x === 0) {
                    this.ctx.moveTo(x, waveY);
                } else {
                    this.ctx.lineTo(x, waveY);
                }
            }
            this.ctx.stroke();
        }
        
        const wavesToRemove = [];
        for (let i = 0; i < this.waterWaves.length; i++) {
            const wave = this.waterWaves[i];
            wave.radius += wave.speed;
            wave.alpha -= 0.01 * wave.speed;
            
            if (wave.alpha <= 0 || wave.radius >= wave.maxRadius) {
                wavesToRemove.push(i);
                continue;
            }
            
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${wave.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.ellipse(wave.x, wave.y, wave.radius, wave.radius * 0.3, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        for (let i = wavesToRemove.length - 1; i >= 0; i--) {
            this.waterWaves.splice(wavesToRemove[i], 1);
        }
    }

    drawBobber() {
        const x = this.canvas.width / 2;
        let y = this.bobberY;
        
        if (this.state === GAME_STATE.WAITING && this.bobberTargetY > 0) {
            const time = Date.now() / 1000;
            y = this.bobberTargetY + Math.sin(time * 2) * 5;
        }
        
        if (this.state === GAME_STATE.BITING) {
            const vibration = Math.sin(Date.now() / 50) * 8;
            y += vibration;
        }
        
        this.bobberY = y;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 15, 20, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, y - 20);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 12, 18, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#CC5555';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 12, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#555555';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 22, 4, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (this.state === GAME_STATE.BITING) {
            const glowRadius = 30 + Math.sin(Date.now() / 100) * 10;
            const glow = this.ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
            glow.addColorStop(0, 'rgba(255, 107, 107, 0.4)');
            glow.addColorStop(1, 'rgba(255, 107, 107, 0)');
            
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawFishingRod() {
        const width = this.canvas.width;
        
        const rodStartX = width * 0.15;
        const rodStartY = this.canvas.height * 0.4;
        const rodEndX = width * 0.35;
        const rodEndY = this.canvas.height * 0.15;
        
        const gradient = this.ctx.createLinearGradient(rodStartX, rodStartY, rodEndX, rodEndY);
        gradient.addColorStop(0, '#8B5A2B');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#654321');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(rodStartX, rodStartY);
        this.ctx.quadraticCurveTo(
            (rodStartX + rodEndX) / 2 + 10,
            (rodStartY + rodEndY) / 2 - 20,
            rodEndX,
            rodEndY
        );
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.ellipse(rodStartX, rodStartY, 8, 15, Math.PI / 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([5, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(rodEndX, rodEndY);
        this.ctx.lineTo(this.canvas.width / 2, this.bobberY > 0 ? this.bobberY - 20 : 0);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    showCodex() {
        this.renderCodexGrid();
        if (this.codexModal) {
            this.codexModal.style.display = 'flex';
        }
    }

    hideCodex() {
        if (this.codexModal) {
            this.codexModal.style.display = 'none';
        }
    }

    renderCodexGrid() {
        const grid = getElement('codex-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        FISH_DATA.forEach(fish => {
            const isUnlocked = this.gameData.isFishUnlocked(fish.id);
            const item = document.createElement('div');
            item.className = `codex-item ${isUnlocked ? '' : 'locked'}`;
            
            item.innerHTML = `
                <div class="codex-icon">${isUnlocked ? fish.emoji : '❓'}</div>
                <div class="codex-name">${isUnlocked ? fish.name : '???'}</div>
                <div class="codex-rarity ${RARITY_CLASS_MAP[fish.rarity]}">
                    ${RARITY_CONFIG[fish.rarity].name}
                </div>
                <div class="codex-score">${isUnlocked ? `基础分: ${fish.baseScore}` : '未解锁'}</div>
            `;
            
            grid.appendChild(item);
        });
    }

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }
}

console.log('');
console.log('========================================');
console.log('📦 脚本定义完成，等待页面加载...');
console.log('========================================');

function startGame() {
    console.log('');
    console.log('🚀 startGame() 被调用');
    console.log('========================================');
    
    if (window.fishingGameInstance) {
        console.log('⚠️ 游戏实例已存在，跳过');
        return;
    }
    
    console.log('🎮 创建 FishingGame 实例...');
    window.fishingGameInstance = new FishingGame();
    
    console.log('🚀 调用 init() 方法...');
    window.fishingGameInstance.init();
}

console.log('');
console.log('📋 检查文档状态...');
console.log('  - document.readyState:', document.readyState);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('✅ 文档已准备就绪，延迟 100ms 启动游戏');
    setTimeout(startGame, 100);
} else {
    console.log('⏳ 等待 DOMContentLoaded 事件...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded 事件触发，启动游戏');
        startGame();
    });
}

window.addEventListener('load', () => {
    console.log('');
    console.log('✅ window.load 事件触发');
    if (!window.fishingGameInstance) {
        console.log('⚠️ 游戏未启动，从 window.load 启动');
        startGame();
    } else {
        console.log('✅ 游戏已在运行');
    }
});

console.log('');
console.log('========================================');
console.log('📋 调试命令:');
console.log('========================================');
console.log('');
console.log('  1. 查看当前游戏数据:');
console.log('     window.fishingGameInstance.gameData');
console.log('');
console.log('  2. 手动保存数据:');
console.log('     window.fishingGameInstance.gameData.saveNow()');
console.log('');
console.log('  3. 查看 localStorage 全部内容:');
console.log('     for (let i=0; i<localStorage.length; i++) {');
console.log('       console.log(localStorage.key(i), localStorage.getItem(localStorage.key(i)));');
console.log('     }');
console.log('');
console.log('  4. 清除所有存档 (测试用):');
console.log('     localStorage.clear();');
console.log('     location.reload();');
console.log('');
console.log('========================================');
