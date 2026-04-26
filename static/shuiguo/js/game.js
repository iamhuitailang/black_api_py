/**
 * 水果小忍者 - 星球大战版
 * 核心游戏逻辑
 */

class Game {
    constructor() {
        // 游戏状态
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;
        
        // 游戏数据
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lives = 3;
        this.timeRemaining = 60;
        this.highScore = 0;
        
        // 难度设置
        this.difficulty = 'normal';
        this.gravity = 500; // 降低重力,让水果抛得更高
        
        // 生成设置
        this.spawnInterval = 1.5;
        this.spawnTimer = 0;
        this.minSpawnVelocity = 500; // 增加最小速度
        this.maxSpawnVelocity = 700; // 增加最大速度
        
        // 连击计时器
        this.comboTimer = 0;
        this.comboTimeout = 1.0; // 1秒内没有切割则重置连击
        
        // Canvas相关
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        
        // 游戏对象
        this.fruits = [];
        this.fruitSlices = [];
        this.bombs = [];
        
        // 特效
        this.juiceParticles = [];
        this.scoreFloats = [];
        this.explosions = [];
        
        // 光剑和切割轨迹
        this.lightsaber = null;
        this.sliceTrail = null;
        this.comboEffect = null;
        
        // 背景
        this.background = null;
        
        // 输入状态
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.prevMouseX = 0;
        this.prevMouseY = 0;
        
        // 游戏循环
        this.lastTime = 0;
        this.animationFrameId = null;
        
        // UI元素
        this.uiElements = {
            score: null,
            combo: null,
            timer: null,
            highScore: null,
            lives: null,
            pauseBtn: null,
            resumeBtn: null,
            restartBtn: null,
            startScreen: null,
            gameOverScreen: null,
            pauseScreen: null,
            finalScore: null,
            maxCombo: null,
            newHighScore: null
        };
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        // 获取Canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置Canvas尺寸
        this.resizeCanvas();
        
        // 初始化音效
        AudioManager.init();
        
        // 读取最高分
        this.highScore = Storage.getHighScore();
        
        // 初始化游戏对象
        this.lightsaber = new Lightsaber();
        this.sliceTrail = new SliceTrail();
        this.comboEffect = new ComboEffect();
        this.background = new BackgroundManager(this.width, this.height);
        
        // 获取UI元素
        this.getUIElements();
        
        // 绑定事件
        this.bindEvents();
        
        // 检查是否有保存的游戏状态
        this.checkSavedState();
        
        // 更新UI显示
        this.updateUI();
    }
    
    /**
     * 调整Canvas尺寸
     */
    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        const dpr = Utils.getDevicePixelRatio();
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        // 更新背景
        if (this.background) {
            this.background.width = this.width;
            this.background.height = this.height;
        }
    }
    
    /**
     * 获取UI元素
     */
    getUIElements() {
        this.uiElements = {
            score: document.getElementById('score'),
            combo: document.getElementById('combo'),
            timer: document.getElementById('timer'),
            highScore: document.getElementById('highScore'),
            lives: document.getElementById('lives'),
            pauseBtn: document.getElementById('pauseBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            restartBtn: document.getElementById('restartBtn'),
            startScreen: document.getElementById('start-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            finalScore: document.getElementById('finalScore'),
            maxCombo: document.getElementById('maxCombo'),
            newHighScore: document.getElementById('newHighScore')
        };
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 窗口大小改变
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', (e) => this.onPointerUp(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseleave', (e) => this.onPointerUp(e.clientX, e.clientY));
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onPointerDown(touch.clientX, touch.clientY);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onPointerMove(touch.clientX, touch.clientY);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.onPointerUp(touch.clientX, touch.clientY);
            }
        });
        
        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => {
            AudioManager.playButtonSound();
            AudioManager.resume();
            this.startGame();
        });
        
        this.uiElements.pauseBtn.addEventListener('click', () => {
            AudioManager.playButtonSound();
            this.pauseGame();
        });
        
        this.uiElements.resumeBtn.addEventListener('click', () => {
            AudioManager.playButtonSound();
            this.resumeGame();
        });
        
        this.uiElements.restartBtn.addEventListener('click', () => {
            AudioManager.playButtonSound();
            this.restartGame();
        });
        
        document.getElementById('resumeFromPauseBtn').addEventListener('click', () => {
            AudioManager.playButtonSound();
            this.resumeGame();
        });
        
        document.getElementById('quitBtn').addEventListener('click', () => {
            AudioManager.playButtonSound();
            this.quitGame();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            AudioManager.playButtonSound();
            this.restartGame();
        });
        
        // 页面可见性变化(后台/前台)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying && !this.isPaused) {
                // 页面隐藏时自动暂停
                this.pauseGame();
            }
        });
        
        // 页面关闭前保存状态
        window.addEventListener('beforeunload', () => {
            if (this.isPlaying || this.isPaused) {
                this.saveGameState();
            }
        });
    }
    
    /**
     * 指针按下事件
     */
    onPointerDown(x, y) {
        this.isMouseDown = true;
        this.prevMouseX = x;
        this.prevMouseY = y;
        this.mouseX = x;
        this.mouseY = y;
        
        // 激活光剑
        this.lightsaber.activate();
        this.lightsaber.setPosition(x, y);
        
        // 清除轨迹
        this.sliceTrail.clear();
    }
    
    /**
     * 指针移动事件
     */
    onPointerMove(x, y) {
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;
        this.mouseX = x;
        this.mouseY = y;
        
        // 更新光剑位置
        this.lightsaber.setPosition(x, y);
        
        // 添加切割轨迹点
        if (this.isMouseDown) {
            this.sliceTrail.addPoint(x, y);
        }
        
        // 检测切割
        if (this.isPlaying && !this.isPaused && this.isMouseDown) {
            this.checkSlices();
        }
    }
    
    /**
     * 指针抬起事件
     */
    onPointerUp(x, y) {
        this.isMouseDown = false;
        
        // 停用光剑
        this.lightsaber.deactivate();
    }
    
    /**
     * 检测切割
     */
    checkSlices() {
        // 检测水果切割
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            
            // 检查线段是否与水果相交
            if (Utils.lineCircleIntersect(
                this.prevMouseX, this.prevMouseY,
                this.mouseX, this.mouseY,
                fruit.x, fruit.y, fruit.radius
            )) {
                // 切割水果
                this.sliceFruit(fruit, i);
            }
        }
        
        // 检测炸弹切割
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            
            if (Utils.lineCircleIntersect(
                this.prevMouseX, this.prevMouseY,
                this.mouseX, this.mouseY,
                bomb.x, bomb.y, bomb.radius
            )) {
                // 切割炸弹
                this.sliceBomb(bomb, i);
            }
        }
    }
    
    /**
     * 切割水果
     */
    sliceFruit(fruit, index) {
        // 计算切割角度
        const sliceAngle = Utils.angle(this.prevMouseX, this.prevMouseY, this.mouseX, this.mouseY);
        fruit.sliceAngle = sliceAngle;
        fruit.sliced = true;
        
        // 播放切割音效
        AudioManager.playSliceSound();
        
        // 创建水果切片
        const leftSlice = new FruitSlice(fruit, true);
        const rightSlice = new FruitSlice(fruit, false);
        
        this.fruitSlices.push(leftSlice);
        this.fruitSlices.push(rightSlice);
        
        // 创建果汁粒子
        this.createJuiceParticles(fruit.x, fruit.y, sliceAngle, fruit.innerColor);
        
        // 更新分数和连击
        this.combo++;
        this.comboTimer = this.comboTimeout;
        
        let pointsEarned = fruit.score;
        
        // 连击加分
        if (this.combo >= 3) {
            const comboBonus = this.combo * 5;
            pointsEarned += comboBonus;
            
            // 触发连击特效
            this.comboEffect.trigger(this.combo);
            
            // 播放连击音效
            AudioManager.playComboSound(this.combo);
        }
        
        this.score += pointsEarned;
        
        // 更新最大连击
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // 创建分数飘字
        this.scoreFloats.push(new ScoreFloat(fruit.x, fruit.y, pointsEarned, this.combo));
        
        // 从数组中移除
        this.fruits.splice(index, 1);
        
        // 更新UI
        this.updateUI();
    }
    
    /**
     * 切割炸弹
     */
    sliceBomb(bomb, index) {
        // 播放爆炸音效
        AudioManager.playExplosionSound();
        
        // 创建爆炸效果
        this.explosions.push(new ExplosionEffect(bomb.x, bomb.y));
        
        // 扣除生命
        this.lives--;
        
        // 重置连击
        this.combo = 0;
        this.comboTimer = 0;
        
        // 从数组中移除
        this.bombs.splice(index, 1);
        
        // 更新UI
        this.updateUI();
        
        // 检查游戏是否结束
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    /**
     * 创建果汁粒子
     */
    createJuiceParticles(x, y, angle, color) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            this.juiceParticles.push(new JuiceParticle(x, y, angle, color));
        }
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        // 重置游戏状态
        this.resetGame();
        
        // 开始游戏
        this.isPlaying = true;
        this.isPaused = false;
        this.isGameOver = false;
        
        // 隐藏开始界面
        this.uiElements.startScreen.style.display = 'none';
        this.uiElements.gameOverScreen.style.display = 'none';
        this.uiElements.pauseScreen.style.display = 'none';
        
        // 显示控制按钮
        this.uiElements.pauseBtn.style.display = 'block';
        this.uiElements.resumeBtn.style.display = 'none';
        this.uiElements.restartBtn.style.display = 'block';
        
        // 重置背景
        this.background.reset();
        
        // 开始游戏循环
        this.lastTime = performance.now();
        this.gameLoop();
        
        // 保存初始状态
        this.saveGameState();
    }
    
    /**
     * 暂停游戏
     */
    pauseGame() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.isPaused = true;
        
        // 显示暂停界面
        this.uiElements.pauseScreen.style.display = 'flex';
        
        // 更新按钮状态
        this.uiElements.pauseBtn.style.display = 'none';
        this.uiElements.resumeBtn.style.display = 'block';
        
        // 保存游戏状态
        this.saveGameState();
    }
    
    /**
     * 继续游戏
     */
    resumeGame() {
        if (!this.isPlaying || !this.isPaused) return;
        
        this.isPaused = false;
        
        // 隐藏暂停界面
        this.uiElements.pauseScreen.style.display = 'none';
        
        // 更新按钮状态
        this.uiElements.pauseBtn.style.display = 'block';
        this.uiElements.resumeBtn.style.display = 'none';
        
        // 重置计时器
        this.lastTime = performance.now();
        
        // 继续游戏循环
        this.gameLoop();
    }
    
    /**
     * 重新开始游戏
     */
    restartGame() {
        // 停止当前游戏循环
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 清除保存的状态
        Storage.clearGameState();
        
        // 开始新游戏
        this.startGame();
    }
    
    /**
     * 退出游戏
     */
    quitGame() {
        // 停止游戏循环
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 清除保存的状态
        Storage.clearGameState();
        
        // 重置游戏状态
        this.isPlaying = false;
        this.isPaused = false;
        
        // 隐藏暂停界面
        this.uiElements.pauseScreen.style.display = 'none';
        
        // 显示开始界面
        this.uiElements.startScreen.style.display = 'flex';
        
        // 隐藏控制按钮
        this.uiElements.pauseBtn.style.display = 'none';
        this.uiElements.resumeBtn.style.display = 'none';
        this.uiElements.restartBtn.style.display = 'none';
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;
        
        // 播放游戏结束音效
        AudioManager.playGameOverSound();
        
        // 检查是否为新纪录
        const isNewHighScore = Storage.setHighScore(this.score);
        if (isNewHighScore) {
            this.highScore = this.score;
            AudioManager.playNewHighScoreSound();
        }
        
        // 停止游戏循环
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 清除保存的状态
        Storage.clearGameState();
        
        // 显示游戏结束界面
        this.uiElements.gameOverScreen.style.display = 'flex';
        this.uiElements.finalScore.textContent = this.score;
        this.uiElements.maxCombo.textContent = this.maxCombo;
        
        if (isNewHighScore) {
            this.uiElements.newHighScore.style.display = 'block';
        } else {
            this.uiElements.newHighScore.style.display = 'none';
        }
        
        // 隐藏控制按钮
        this.uiElements.pauseBtn.style.display = 'none';
        this.uiElements.resumeBtn.style.display = 'none';
        this.uiElements.restartBtn.style.display = 'none';
    }
    
    /**
     * 重置游戏状态
     */
    resetGame() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lives = 3;
        this.timeRemaining = 60;
        this.comboTimer = 0;
        this.spawnTimer = this.spawnInterval; // 让游戏开始后立即生成第一个水果
        
        // 清空游戏对象
        this.fruits = [];
        this.fruitSlices = [];
        this.bombs = [];
        this.juiceParticles = [];
        this.scoreFloats = [];
        this.explosions = [];
        
        // 清除轨迹
        this.sliceTrail.clear();
    }
    
    /**
     * 生成游戏对象
     */
    spawnObjects() {
        this.spawnTimer += this.deltaTime;
        
        console.log('spawnTimer:', this.spawnTimer, 'spawnInterval:', this.spawnInterval);
        
        if (this.spawnTimer >= this.spawnInterval) {
            console.log('=== 准备生成水果/炸弹 ===');
            this.spawnTimer = 0;
            
            // 随机生成数量(1-3个)
            const count = Utils.randomInt(1, 3);
            console.log('生成数量:', count);
            
            for (let i = 0; i < count; i++) {
                // 延迟一点时间生成
                setTimeout(() => {
                    console.log('setTimeout回调, isPlaying:', this.isPlaying, 'isPaused:', this.isPaused);
                    if (this.isPlaying && !this.isPaused) {
                        this.spawnSingleObject();
                    }
                }, i * 200);
            }
        }
    }
    
    /**
     * 生成单个对象
     */
    spawnSingleObject() {
        console.log('=== spawnSingleObject 被调用 ===');
        console.log('当前屏幕尺寸: width=', this.width, 'height=', this.height);
        
        // 决定生成水果还是炸弹(20%概率是炸弹)
        const isBomb = Math.random() < 0.2;
        console.log('生成类型:', isBomb ? '炸弹' : '水果');
        
        // 生成位置(屏幕底部)
        const x = Utils.randomFloat(this.width * 0.1, this.width * 0.9);
        const y = this.height + 50;
        console.log('生成位置: x=', x, 'y=', y);
        
        // 计算速度(向上抛出)
        // 在Canvas中,0度向右,π/2向下,-π/2向上
        // 角度范围: -2π/3 (-120度,向左上方) 到 -π/3 (-60度,向右上方)
        // 这样sin值在 -√3/2 ≈ -0.866 到 -1 之间,向上速度更高
        const angle = Utils.randomFloat(-Math.PI * 2 / 3, -Math.PI / 3);
        const speed = Utils.randomFloat(this.minSpawnVelocity, this.maxSpawnVelocity);
        console.log('角度:', angle, '速度:', speed);
        
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        console.log('速度分量: vx=', vx, 'vy=', vy);
        
        if (isBomb) {
            // 生成炸弹
            this.bombs.push(new Bomb(x, y, vx, vy));
            console.log('炸弹已添加到数组,当前炸弹数量:', this.bombs.length);
        } else {
            // 生成水果
            const fruitTypes = Object.keys(FRUIT_TYPES);
            const fruitType = Utils.randomChoice(fruitTypes);
            console.log('水果类型:', fruitType);
            const fruit = new Fruit(x, y, vx, vy, fruitType);
            this.fruits.push(fruit);
            console.log('水果已添加到数组,当前水果数量:', this.fruits.length);
            console.log('水果属性: x=', fruit.x, 'y=', fruit.y, 'radius=', fruit.radius);
        }
    }
    
    /**
     * 更新游戏
     */
    update() {
        // 更新计时器
        this.timeRemaining -= this.deltaTime;
        
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.gameOver();
            return;
        }
        
        // 更新连击计时器
        if (this.comboTimer > 0) {
            this.comboTimer -= this.deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.comboTimer = 0;
                this.updateUI();
            }
        }
        
        // 生成对象
        this.spawnObjects();
        
        // 更新背景
        this.background.update(this.deltaTime);
        
        // 更新水果
        console.log('更新水果前,水果数量:', this.fruits.length);
        this.fruits.forEach(fruit => {
            fruit.update(this.gravity, this.deltaTime, this.width, this.height);
        });
        this.fruits = this.fruits.filter(fruit => {
            const shouldRemove = fruit.shouldBeRemoved(this.width, this.height);
            if (shouldRemove) {
                console.log('水果被移除,位置: x=', fruit.x, 'y=', fruit.y);
            }
            return !shouldRemove;
        });
        console.log('更新水果后,水果数量:', this.fruits.length);
        
        // 更新水果切片
        this.fruitSlices.forEach(slice => {
            slice.update(this.gravity, this.deltaTime, this.width, this.height);
        });
        this.fruitSlices = this.fruitSlices.filter(slice => {
            return !slice.shouldBeRemoved(this.width, this.height);
        });
        
        // 更新炸弹
        this.bombs.forEach(bomb => {
            bomb.update(this.gravity, this.deltaTime, this.width, this.height);
        });
        this.bombs = this.bombs.filter(bomb => {
            return !bomb.shouldBeRemoved(this.width, this.height);
        });
        
        // 更新果汁粒子
        this.juiceParticles = this.juiceParticles.filter(p => p.isAlive());
        this.juiceParticles.forEach(p => p.update(this.deltaTime));
        
        // 更新分数飘字
        this.scoreFloats = this.scoreFloats.filter(f => f.isAlive());
        this.scoreFloats.forEach(f => f.update(this.deltaTime));
        
        // 更新爆炸效果
        this.explosions = this.explosions.filter(e => e.isAlive());
        this.explosions.forEach(e => e.update(this.deltaTime));
        
        // 更新光剑
        this.lightsaber.update(this.deltaTime);
        
        // 更新切割轨迹
        this.sliceTrail.update(this.deltaTime);
        
        // 更新连击特效
        this.comboEffect.update(this.deltaTime);
        
        // 定期保存游戏状态
        this.autoSaveTimer = (this.autoSaveTimer || 0) + this.deltaTime;
        if (this.autoSaveTimer >= 5.0) {
            this.autoSaveTimer = 0;
            this.saveGameState();
        }
    }
    
    /**
     * 渲染游戏
     */
    render() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制背景
        this.background.draw(this.ctx);
        
        // 绘制连击特效
        this.comboEffect.draw(this.ctx, this.width, this.height);
        
        // 绘制水果切片
        this.fruitSlices.forEach(slice => slice.draw(this.ctx));
        
        // 绘制水果
        this.fruits.forEach(fruit => fruit.draw(this.ctx));
        
        // 绘制炸弹
        this.bombs.forEach(bomb => bomb.draw(this.ctx));
        
        // 绘制爆炸效果
        this.explosions.forEach(e => e.draw(this.ctx));
        
        // 绘制果汁粒子
        this.juiceParticles.forEach(p => p.draw(this.ctx));
        
        // 绘制分数飘字
        this.scoreFloats.forEach(f => f.draw(this.ctx));
        
        // 绘制切割轨迹
        this.sliceTrail.draw(this.ctx);
        
        // 绘制光剑
        this.lightsaber.draw(this.ctx);
    }
    
    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.isPlaying || this.isPaused || this.isGameOver) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 限制最大deltaTime,防止跳帧
        if (this.deltaTime > 0.1) {
            this.deltaTime = 0.1;
        }
        
        // 更新游戏
        this.update();
        
        // 更新UI显示(每一帧都更新,确保倒计时实时)
        this.updateUI();
        
        // 渲染游戏
        this.render();
        
        // 下一帧
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * 更新UI显示
     */
    updateUI() {
        this.uiElements.score.textContent = this.score;
        this.uiElements.combo.textContent = this.combo;
        this.uiElements.timer.textContent = Math.ceil(this.timeRemaining);
        this.uiElements.highScore.textContent = this.highScore;
        
        // 更新生命值显示
        const lifeIcons = this.uiElements.lives.querySelectorAll('.life-icon');
        lifeIcons.forEach((icon, index) => {
            if (index < this.lives) {
                icon.classList.add('active');
            } else {
                icon.classList.remove('active');
            }
        });
    }
    
    /**
     * 保存游戏状态
     */
    saveGameState() {
        if (!this.isPlaying && !this.isPaused) return;
        
        const state = Storage.createSaveState(this);
        Storage.saveGameState(state);
    }
    
    /**
     * 检查是否有保存的游戏状态
     */
    checkSavedState() {
        const savedState = Storage.getGameState();
        
        if (savedState && !Storage.isStateExpired(savedState)) {
            // 询问是否恢复游戏
            if (confirm('检测到未完成的游戏,是否恢复?')) {
                this.restoreGameState(savedState);
            } else {
                Storage.clearGameState();
            }
        }
    }
    
    /**
     * 恢复游戏状态
     */
    restoreGameState(state) {
        this.score = state.score || 0;
        this.combo = state.combo || 0;
        this.maxCombo = state.maxCombo || 0;
        this.lives = state.lives || 3;
        this.timeRemaining = state.timeRemaining || 60;
        this.difficulty = state.difficulty || 'normal';
        
        // 开始游戏
        this.isPlaying = true;
        this.isPaused = state.isPaused || false;
        this.isGameOver = false;
        
        // 隐藏开始界面
        this.uiElements.startScreen.style.display = 'none';
        
        if (this.isPaused) {
            // 显示暂停界面
            this.uiElements.pauseScreen.style.display = 'flex';
            this.uiElements.pauseBtn.style.display = 'none';
            this.uiElements.resumeBtn.style.display = 'block';
            this.uiElements.restartBtn.style.display = 'block';
        } else {
            // 显示控制按钮
            this.uiElements.pauseBtn.style.display = 'block';
            this.uiElements.resumeBtn.style.display = 'none';
            this.uiElements.restartBtn.style.display = 'block';
            
            // 开始游戏循环
            this.lastTime = performance.now();
            this.gameLoop();
        }
        
        // 更新UI
        this.updateUI();
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    window.game = new Game();
});
