// 青蛙过河 · 极速挑战 - 游戏主逻辑

// ==================== 游戏常量定义 ====================
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 520;
const TILE_SIZE = 40;
const FROG_SIZE = 30;
const FROG_STEP = 40;
const INITIAL_LIVES = 5;

// 游戏区域定义
const AREAS = {
    START: { row: 12, type: 'grass' }, // 底部安全区
    ROAD: { rows: [9, 10, 11], type: 'road' }, // 马路区（3行）
    RIVER: { rows: [4, 5, 6, 7], type: 'river' }, // 河流区（4行）
    GOAL: { row: 3, type: 'goal' }, // 顶部安全区+洞口
    TOP_SAFE: { rows: [0, 1, 2], type: 'topSafe' } // 顶部更多安全区
};

// 车辆类型定义 - 降低初始速度约40%
const VEHICLE_TYPES = {
    CAR: { emoji: '🚗', color: '#ef4444', width: 60, height: 30, speed: 1.2, direction: 'right' },
    SUV: { emoji: '🚙', color: '#3b82f6', width: 70, height: 35, speed: 1.5, direction: 'right' },
    TRUCK: { emoji: '🚛', color: '#6b7280', width: 100, height: 35, speed: 1.0, direction: 'left' },
    BIKE: { emoji: '🚲', color: '#8b5cf6', width: 40, height: 30, speed: 1.1, direction: 'right' }
};

// 河流障碍物定义 - 降低速度并增加木头宽度
const WATER_OBSTACLES = {
    LOG: { emoji: '🪵', color: '#92400e', width: 130, height: 30, speed: 1.3, directions: ['left', 'right'] },
    TURTLE: { emoji: '🐢', color: '#16a34a', width: 80, height: 30, speed: 1.2, direction: 'right' }
};

// 洞口位置
const GOAL_POSITIONS = [
    { x: 40, y: AREAS.GOAL.row * TILE_SIZE + 5 },
    { x: 133, y: AREAS.GOAL.row * TILE_SIZE + 5 },
    { x: 226, y: AREAS.GOAL.row * TILE_SIZE + 5 },
    { x: 319, y: AREAS.GOAL.row * TILE_SIZE + 5 },
    { x: 412, y: AREAS.GOAL.row * TILE_SIZE + 5 }
];

// ==================== 游戏状态管理 ====================
const STORAGE_KEY = 'froggerGameState';

class GameState {
    constructor() {
        this.load();
    }
    
    // 默认游戏状态
    getDefaultState() {
        return {
            score: 0,
            level: 1,
            lives: INITIAL_LIVES,
            gameStatus: 'start', // start, playing, paused, gameOver, levelComplete
            frog: {
                x: CANVAS_WIDTH / 2 - FROG_SIZE / 2,
                y: AREAS.START.row * TILE_SIZE + 5,
                direction: 'up'
            },
            goalsReached: [false, false, false, false, false],
            vehicles: [],
            waterObstacles: [],
            highScore: 0,
            timestamp: Date.now()
        };
    }
    
    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // 检查保存的状态是否过期（超过1小时视为过期）
                const isExpired = Date.now() - parsed.timestamp > 3600000;
                
                if (!isExpired && parsed.gameStatus === 'playing') {
                    Object.assign(this, parsed);
                } else {
                    Object.assign(this, this.getDefaultState());
                    this.highScore = parsed.highScore || 0;
                }
            } else {
                Object.assign(this, this.getDefaultState());
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
            Object.assign(this, this.getDefaultState());
        }
    }
    
    save() {
        try {
            this.timestamp = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this));
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    }
    
    reset() {
        const highScore = this.highScore;
        Object.assign(this, this.getDefaultState());
        this.highScore = highScore;
        this.save();
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.save();
        }
    }
}

// ==================== 游戏主类 ====================
class FroggerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        
        this.animationId = null;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
        
        // 初始化覆盖层显示
        this.initOverlay();
    }
    
    initOverlay() {
        const overlay = document.getElementById('overlay');
        
        // 根据游戏状态显示相应的界面
        if (this.state.gameStatus === 'playing' || this.state.gameStatus === 'paused') {
            // 如果之前是游戏进行中或暂停，显示开始界面让用户选择
            // 这样可以避免自动恢复可能导致的问题
            this.state.gameStatus = 'start';
            this.state.save();
            overlay.classList.remove('hidden');
            document.getElementById('startScreen').classList.remove('hidden');
            document.getElementById('pauseBtn').disabled = true;
        } else if (this.state.gameStatus === 'gameOver') {
            overlay.classList.remove('hidden');
            document.getElementById('gameOverScreen').classList.remove('hidden');
            document.getElementById('pauseBtn').disabled = true;
        } else if (this.state.gameStatus === 'levelComplete') {
            overlay.classList.remove('hidden');
            document.getElementById('levelCompleteScreen').classList.remove('hidden');
            document.getElementById('pauseBtn').disabled = true;
        } else {
            // 默认显示开始界面
            overlay.classList.remove('hidden');
            document.getElementById('startScreen').classList.remove('hidden');
            document.getElementById('pauseBtn').disabled = true;
        }
    }
    
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('restartFromPauseBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('restartGameBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
    }
    
    handleKeyDown(e) {
        if (this.state.gameStatus !== 'playing') return;
        
        const key = e.key;
        let dx = 0, dy = 0;
        
        switch (key) {
            case 'ArrowUp':
                dy = -FROG_STEP;
                this.state.frog.direction = 'up';
                break;
            case 'ArrowDown':
                dy = FROG_STEP;
                this.state.frog.direction = 'down';
                break;
            case 'ArrowLeft':
                dx = -FROG_STEP;
                this.state.frog.direction = 'left';
                break;
            case 'ArrowRight':
                dx = FROG_STEP;
                this.state.frog.direction = 'right';
                break;
            case ' ': // 空格键暂停
                this.pauseGame();
                return;
            default:
                return;
        }
        
        e.preventDefault();
        this.moveFrog(dx, dy);
    }
    
    moveFrog(dx, dy) {
        const newX = this.state.frog.x + dx;
        const newY = this.state.frog.y + dy;
        
        // 边界检查
        if (newX < 0 || newX > CANVAS_WIDTH - FROG_SIZE) return;
        if (newY < 0 || newY > CANVAS_HEIGHT - FROG_SIZE) return;
        
        this.state.frog.x = newX;
        this.state.frog.y = newY;
        
        // 向上移动加分
        if (dy < 0) {
            this.state.score += 10;
            this.updateUI();
        }
        
        this.state.save();
    }
    
    // ==================== 游戏状态控制 ====================
    startGame() {
        // 如果是从暂停恢复或者之前是游戏中，不重置
        if (this.state.gameStatus !== 'playing') {
            if (this.state.gameStatus === 'start' || this.state.gameStatus === 'gameOver') {
                this.state.reset();
                this.generateLevel();
            }
        }
        
        this.state.gameStatus = 'playing';
        this.hideAllOverlays();
        document.getElementById('pauseBtn').disabled = false;
        this.updateUI();
        
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    pauseGame() {
        if (this.state.gameStatus !== 'playing') return;
        
        this.state.gameStatus = 'paused';
        this.state.save();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.showOverlay('pauseScreen');
        document.getElementById('pauseBtn').disabled = true;
    }
    
    resumeGame() {
        if (this.state.gameStatus !== 'paused') return;
        
        this.state.gameStatus = 'playing';
        this.state.save();
        
        this.hideAllOverlays();
        document.getElementById('pauseBtn').disabled = false;
        
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    restartGame() {
        this.state.reset();
        this.generateLevel();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.state.gameStatus = 'start';
        this.showOverlay('startScreen');
        document.getElementById('pauseBtn').disabled = true;
        
        this.updateUI();
        this.state.save();
    }
    
    nextLevel() {
        this.state.level += 1;
        this.state.goalsReached = [false, false, false, false, false];
        this.resetFrogPosition();
        this.generateLevel();
        
        this.state.gameStatus = 'playing';
        this.hideAllOverlays();
        document.getElementById('pauseBtn').disabled = false;
        
        this.updateUI();
        this.state.save();
        
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    hideAllOverlays() {
        const overlay = document.getElementById('overlay');
        overlay.classList.add('hidden');
        document.querySelectorAll('.overlay-screen').forEach(screen => {
            screen.classList.add('hidden');
        });
    }
    
    showOverlay(screenId) {
        const overlay = document.getElementById('overlay');
        this.hideAllOverlays();
        overlay.classList.remove('hidden');
        document.getElementById(screenId).classList.remove('hidden');
    }
    
    // ==================== 关卡生成 ====================
    generateLevel() {
        const levelMultiplier = 1 + (this.state.level - 1) * 0.12;
        
        // 生成车辆 - 减少数量，增加间距
        this.state.vehicles = [];
        
        // 第9行（从底部数第4行）- 汽车右行（从3辆减少到2辆）
        this.addVehiclesToRow(9, ['CAR'], 2, levelMultiplier);
        
        // 第10行 - 自行车右行（保持2辆，但增加间距）
        this.addVehiclesToRow(10, ['BIKE'], 2, levelMultiplier);
        
        // 第11行 - SUV右行（去掉卡车，保持2辆但更慢）
        this.addVehiclesToRow(11, ['SUV'], 2, levelMultiplier);
        
        // 生成河流障碍物 - 增加数量和大小
        this.state.waterObstacles = [];
        
        // 第4行 - 乌龟右行（从3只增加到4只）
        this.addWaterObstaclesToRow(4, ['TURTLE'], 4, levelMultiplier, 'right');
        
        // 第5行 - 木头左行（从2根增加到3根）
        this.addWaterObstaclesToRow(5, ['LOG'], 3, levelMultiplier, 'left');
        
        // 第6行 - 乌龟和木头混合（从2个增加到3个）
        this.addWaterObstaclesToRow(6, ['TURTLE', 'LOG'], 3, levelMultiplier, 'right');
        
        // 第7行 - 木头右行（从2根增加到3根）
        this.addWaterObstaclesToRow(7, ['LOG'], 3, levelMultiplier, 'right');
    }
    
    addVehiclesToRow(row, types, count, multiplier) {
        const y = row * TILE_SIZE + 5;
        const baseSpacing = CANVAS_WIDTH / (count + 1);
        
        for (let i = 0; i < count; i++) {
            const typeKey = types[Math.floor(Math.random() * types.length)];
            const type = VEHICLE_TYPES[typeKey];
            const direction = type.direction;
            
            this.state.vehicles.push({
                type: typeKey,
                x: (i + 1) * baseSpacing + Math.random() * 30 - 15,
                y: y,
                width: type.width,
                height: type.height,
                speed: type.speed * multiplier,
                direction: direction,
                emoji: type.emoji,
                color: type.color
            });
        }
    }
    
    addWaterObstaclesToRow(row, types, count, multiplier, direction) {
        const y = row * TILE_SIZE + 5;
        const baseSpacing = CANVAS_WIDTH / count;
        
        for (let i = 0; i < count; i++) {
            const typeKey = types[Math.floor(Math.random() * types.length)];
            const type = WATER_OBSTACLES[typeKey];
            
            this.state.waterObstacles.push({
                type: typeKey,
                x: i * baseSpacing + Math.random() * 20 - 10,
                y: y,
                width: type.width,
                height: type.height,
                speed: type.speed * multiplier,
                direction: direction,
                emoji: type.emoji,
                color: type.color
            });
        }
    }
    
    // ==================== 青蛙位置重置 ====================
    resetFrogPosition() {
        this.state.frog.x = CANVAS_WIDTH / 2 - FROG_SIZE / 2;
        this.state.frog.y = AREAS.START.row * TILE_SIZE + 5;
        this.state.frog.direction = 'up';
        this.state.save();
    }
    
    // ==================== 碰撞检测 ====================
    checkCollisions() {
        const frogRect = {
            x: this.state.frog.x,
            y: this.state.frog.y,
            width: FROG_SIZE,
            height: FROG_SIZE
        };
        
        // 检查车辆碰撞
        for (const vehicle of this.state.vehicles) {
            if (this.isColliding(frogRect, vehicle)) {
                this.handleDeath('被车撞了！');
                return;
            }
        }
        
        // 检查是否在河流区域
        const frogRow = Math.floor(this.state.frog.y / TILE_SIZE);
        const isInRiver = AREAS.RIVER.rows.includes(frogRow);
        
        if (isInRiver) {
            // 检查是否站在漂浮物上
            let onObstacle = false;
            let carriedBy = null;
            
            for (const obstacle of this.state.waterObstacles) {
                if (this.isColliding(frogRect, obstacle)) {
                    onObstacle = true;
                    carriedBy = obstacle;
                    break;
                }
            }
            
            if (!onObstacle) {
                this.handleDeath('落水了！');
                return;
            } else if (carriedBy) {
                // 跟随漂浮物移动
                const moveAmount = carriedBy.direction === 'right' 
                    ? carriedBy.speed * 0.016 
                    : -carriedBy.speed * 0.016;
                this.state.frog.x += moveAmount;
                
                // 检查是否被带出屏幕
                if (this.state.frog.x < -FROG_SIZE || this.state.frog.x > CANVAS_WIDTH) {
                    this.handleDeath('被水流冲走了！');
                    return;
                }
            }
        }
        
        // 检查是否到达目标区域
        if (frogRow === AREAS.GOAL.row) {
            this.checkGoalReached();
        }
    }
    
    isColliding(rect1, rect2) {
        // 稍微缩小碰撞区域，让游戏更友好
        const padding = 5;
        return rect1.x + padding < rect2.x + rect2.width &&
               rect1.x + rect1.width - padding > rect2.x &&
               rect1.y + padding < rect2.y + rect2.height &&
               rect1.y + rect1.height - padding > rect2.y;
    }
    
    checkGoalReached() {
        const frogCenterX = this.state.frog.x + FROG_SIZE / 2;
        
        for (let i = 0; i < GOAL_POSITIONS.length; i++) {
            if (this.state.goalsReached[i]) continue;
            
            const goal = GOAL_POSITIONS[i];
            const goalWidth = 50;
            
            if (Math.abs(frogCenterX - (goal.x + goalWidth / 2)) < goalWidth / 2) {
                // 成功到达一个洞口
                this.state.goalsReached[i] = true;
                this.state.score += 100;
                this.updateUI();
                this.state.save();
                
                // 检查是否所有洞口都填满了
                if (this.state.goalsReached.every(reached => reached)) {
                    this.levelComplete();
                } else {
                    // 重置青蛙位置，继续填充其他洞口
                    this.resetFrogPosition();
                }
                return;
            }
        }
        
        // 如果到达了目标行但没有到洞口，也算死亡
        this.handleDeath('没有到达洞口！');
    }
    
    handleDeath(reason) {
        this.state.lives -= 1;
        this.updateUI();
        
        if (this.state.lives <= 0) {
            this.gameOver();
        } else {
            this.resetFrogPosition();
        }
    }
    
    levelComplete() {
        this.state.gameStatus = 'levelComplete';
        this.state.updateHighScore();
        this.state.save();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.showOverlay('levelCompleteScreen');
        document.getElementById('pauseBtn').disabled = true;
    }
    
    gameOver() {
        this.state.gameStatus = 'gameOver';
        this.state.updateHighScore();
        this.state.save();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        document.getElementById('finalScore').textContent = this.state.score;
        document.getElementById('highScore').textContent = this.state.highScore;
        this.showOverlay('gameOverScreen');
        document.getElementById('pauseBtn').disabled = true;
    }
    
    // ==================== 游戏循环 ====================
    gameLoop(currentTime = performance.now()) {
        if (this.state.gameStatus !== 'playing') return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // 更新车辆位置
        for (const vehicle of this.state.vehicles) {
            if (vehicle.direction === 'right') {
                vehicle.x += vehicle.speed;
                if (vehicle.x > CANVAS_WIDTH) {
                    vehicle.x = -vehicle.width;
                }
            } else {
                vehicle.x -= vehicle.speed;
                if (vehicle.x < -vehicle.width) {
                    vehicle.x = CANVAS_WIDTH;
                }
            }
        }
        
        // 更新河流障碍物位置
        for (const obstacle of this.state.waterObstacles) {
            if (obstacle.direction === 'right') {
                obstacle.x += obstacle.speed;
                if (obstacle.x > CANVAS_WIDTH) {
                    obstacle.x = -obstacle.width;
                }
            } else {
                obstacle.x -= obstacle.speed;
                if (obstacle.x < -obstacle.width) {
                    obstacle.x = CANVAS_WIDTH;
                }
            }
        }
        
        // 检查碰撞
        this.checkCollisions();
        
        // 保存状态
        this.state.save();
    }
    
    // ==================== 渲染 ====================
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制车辆
        this.drawVehicles();
        
        // 绘制河流障碍物
        this.drawWaterObstacles();
        
        // 绘制洞口
        this.drawGoals();
        
        // 绘制青蛙
        this.drawFrog();
    }
    
    drawBackground() {
        // 底部安全区（草地）- 更亮的绿色
        this.ctx.fillStyle = '#4ade80';
        this.ctx.fillRect(0, AREAS.START.row * TILE_SIZE, CANVAS_WIDTH, TILE_SIZE);
        
        // 添加草地纹理
        this.ctx.fillStyle = '#22c55e';
        for (let x = 0; x < CANVAS_WIDTH; x += 20) {
            for (let y = AREAS.START.row * TILE_SIZE; y < (AREAS.START.row + 1) * TILE_SIZE; y += 10) {
                if ((x + y) % 40 === 0) {
                    this.ctx.fillRect(x, y, 4, 4);
                }
            }
        }
        
        // 马路 - 更亮的灰色
        this.ctx.fillStyle = '#6b7280';
        for (const row of AREAS.ROAD.rows) {
            this.ctx.fillRect(0, row * TILE_SIZE, CANVAS_WIDTH, TILE_SIZE);
            
            // 马路边框
            this.ctx.strokeStyle = '#4b5563';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(0, row * TILE_SIZE, CANVAS_WIDTH, TILE_SIZE);
            
            // 马路中间的虚线 - 更亮的黄色
            this.ctx.strokeStyle = '#fcd34d';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([15, 10]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * TILE_SIZE + TILE_SIZE / 2);
            this.ctx.lineTo(CANVAS_WIDTH, row * TILE_SIZE + TILE_SIZE / 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // 河流 - 更亮的蓝色
        this.ctx.fillStyle = '#60a5fa';
        for (const row of AREAS.RIVER.rows) {
            this.ctx.fillRect(0, row * TILE_SIZE, CANVAS_WIDTH, TILE_SIZE);
            
            // 河流边框
            this.ctx.strokeStyle = '#3b82f6';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, row * TILE_SIZE, CANVAS_WIDTH, TILE_SIZE);
            
            // 水波纹效果 - 更亮的蓝色
            this.ctx.fillStyle = '#93c5fd';
            for (let x = 0; x < CANVAS_WIDTH; x += 30) {
                this.ctx.fillRect(x + 5, row * TILE_SIZE + 12, 25, 4);
                this.ctx.fillRect(x + 20, row * TILE_SIZE + 25, 20, 3);
            }
            this.ctx.fillStyle = '#60a5fa';
        }
        
        // 顶部安全区（草地）- 更亮的绿色
        this.ctx.fillStyle = '#4ade80';
        this.ctx.fillRect(0, AREAS.GOAL.row * TILE_SIZE, CANVAS_WIDTH, TILE_SIZE);
        
        // 添加草地纹理
        this.ctx.fillStyle = '#22c55e';
        for (let x = 0; x < CANVAS_WIDTH; x += 20) {
            for (let y = AREAS.GOAL.row * TILE_SIZE; y < (AREAS.GOAL.row + 1) * TILE_SIZE; y += 10) {
                if ((x + y) % 40 === 0) {
                    this.ctx.fillRect(x, y, 4, 4);
                }
            }
        }
        
        // 顶部更多安全区 - 更亮的绿色
        this.ctx.fillStyle = '#34d399';
        for (const row of AREAS.TOP_SAFE.rows) {
            this.ctx.fillRect(0, row * TILE_SIZE, CANVAS_WIDTH, TILE_SIZE);
        }
    }
    
    drawVehicles() {
        for (const vehicle of this.state.vehicles) {
            // 绘制车辆底色
            this.ctx.fillStyle = vehicle.color;
            this.ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height);
            
            // 绘制emoji
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                vehicle.emoji,
                vehicle.x + vehicle.width / 2,
                vehicle.y + vehicle.height / 2
            );
        }
    }
    
    drawWaterObstacles() {
        for (const obstacle of this.state.waterObstacles) {
            // 绘制底色
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 绘制emoji
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 如果是长木头，绘制多个emoji
            if (obstacle.type === 'LOG' && obstacle.width > 80) {
                const count = Math.floor(obstacle.width / 40);
                for (let i = 0; i < count; i++) {
                    this.ctx.fillText(
                        obstacle.emoji,
                        obstacle.x + 20 + i * 40,
                        obstacle.y + obstacle.height / 2
                    );
                }
            } else {
                this.ctx.fillText(
                    obstacle.emoji,
                    obstacle.x + obstacle.width / 2,
                    obstacle.y + obstacle.height / 2
                );
            }
        }
    }
    
    drawGoals() {
        for (let i = 0; i < GOAL_POSITIONS.length; i++) {
            const goal = GOAL_POSITIONS[i];
            const width = 50;
            const height = 30;
            
            if (this.state.goalsReached[i]) {
                // 已到达的洞口显示青蛙 - 更亮的绿色
                this.ctx.fillStyle = '#22c55e';
                this.ctx.fillRect(goal.x, goal.y, width, height);
                
                // 洞口边框
                this.ctx.strokeStyle = '#15803d';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(goal.x, goal.y, width, height);
                
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🐸', goal.x + width / 2, goal.y + height / 2);
            } else {
                // 空洞口 - 更深的绿色但有亮边框
                this.ctx.fillStyle = '#047857';
                this.ctx.fillRect(goal.x, goal.y, width, height);
                
                // 洞口边框 - 更亮的黄色
                this.ctx.strokeStyle = '#fcd34d';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(goal.x, goal.y, width, height);
                
                // 添加闪烁的指示箭头
                this.ctx.fillStyle = '#fef3c7';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('▼', goal.x + width / 2, goal.y + height / 2 + 2);
            }
        }
    }
    
    drawFrog() {
        const frog = this.state.frog;
        
        // 绘制青蛙
        this.ctx.font = '28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 根据方向旋转青蛙（简单处理，只显示emoji）
        this.ctx.fillText(
            '🐸',
            frog.x + FROG_SIZE / 2,
            frog.y + FROG_SIZE / 2
        );
    }
    
    // ==================== UI更新 ====================
    updateUI() {
        document.getElementById('score').textContent = this.state.score;
        document.getElementById('level').textContent = this.state.level;
        
        // 更新生命显示
        let livesHtml = '';
        for (let i = 0; i < INITIAL_LIVES; i++) {
            if (i < this.state.lives) {
                livesHtml += '❤️';
            } else {
                livesHtml += '🖤';
            }
        }
        document.getElementById('lives').innerHTML = livesHtml;
    }
}

// ==================== 游戏初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 检查画布支持
    const canvas = document.getElementById('gameCanvas');
    if (!canvas.getContext) {
        alert('您的浏览器不支持Canvas，无法运行此游戏！');
        return;
    }
    
    // 启动游戏
    new FroggerGame();
});
