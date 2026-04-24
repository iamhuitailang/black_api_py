/**
 * 弹弹球游戏 - 核心逻辑
 */

// 游戏状态
const GAME_STATE = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    WIN: 'win',
    LOSE: 'lose'
};

// 颜色配置 (Google风格)
const COLORS = {
    paddle: '#4285f4',
    ball: '#202124',
    bricks: ['#ea4335', '#fbbc04', '#34a853', '#4285f4', '#9334e6'],
    strongBrick: '#5f6368'
};

// 关卡配置
const LEVELS = [
    {
        // 第1关：简单入门
        rows: 3,
        cols: 6,
        brickWidth: 100,
        brickHeight: 20,
        brickPadding: 15,
        offsetTop: 50,
        offsetLeft: 50,
        ballSpeed: 3,
        strongBricks: []
    },
    {
        // 第2关：砖块变多
        rows: 4,
        cols: 8,
        brickWidth: 80,
        brickHeight: 20,
        brickPadding: 10,
        offsetTop: 50,
        offsetLeft: 50,
        ballSpeed: 4,
        strongBricks: []
    },
    {
        // 第3关：硬砖块
        rows: 5,
        cols: 8,
        brickWidth: 80,
        brickHeight: 20,
        brickPadding: 10,
        offsetTop: 50,
        offsetLeft: 50,
        ballSpeed: 4.5,
        strongBricks: [[0, 2], [0, 5], [2, 3], [2, 4], [4, 1], [4, 6]]
    },
    {
        // 第4关：不规则排列
        rows: 5,
        cols: 9,
        brickWidth: 70,
        brickHeight: 20,
        brickPadding: 8,
        offsetTop: 50,
        offsetLeft: 45,
        ballSpeed: 5,
        strongBricks: [[1, 2], [1, 6], [3, 4]],
        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 1, 0, 1, 1, 1, 0, 1, 1],
            [1, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ]
    },
    {
        // 第5关：最终挑战
        rows: 6,
        cols: 10,
        brickWidth: 64,
        brickHeight: 20,
        brickPadding: 6,
        offsetTop: 40,
        offsetLeft: 35,
        ballSpeed: 6,
        strongBricks: [[0, 1], [0, 8], [2, 3], [2, 6], [4, 2], [4, 7]]
    }
];

// 游戏类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasRect = this.canvas.getBoundingClientRect();
        
        // 获取DOM元素
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.livesEl = document.getElementById('lives');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.overlay = document.getElementById('overlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.overlayContent = this.overlay.querySelector('.overlay-content');
        
        // 游戏状态
        this.state = GAME_STATE.IDLE;
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
        
        // 游戏对象
        this.paddle = null;
        this.ball = null;
        this.bricks = [];
        
        // 控制
        this.keys = { left: false, right: false };
        this.mouseX = this.canvas.width / 2;
        this.mouseMoved = false;
        
        // 动画帧
        this.animationId = null;
        
        // 初始化
        this.init();
    }
    
    init() {
        this.initObjects(); // 先初始化默认值
        const hasSavedState = this.loadGameState(); // 尝试加载保存的状态，如果有就覆盖
        this.bindEvents();
        this.updateUI();
        this.render();
        
        // 如果没有保存的状态，显示开始界面
        if (!hasSavedState) {
            this.showOverlay('弹弹球', '点击"开始游戏"开始挑战！', '');
        }
    }
    
    // 初始化游戏对象
    initObjects() {
        const level = LEVELS[this.currentLevel - 1];
        
        // 挡板
        this.paddle = {
            width: 100,
            height: 15,
            x: (this.canvas.width - 100) / 2,
            y: this.canvas.height - 30,
            speed: 8
        };
        
        // 小球
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            radius: 8,
            dx: level.ballSpeed,
            dy: -level.ballSpeed,
            speed: level.ballSpeed,
            attached: true
        };
        
        // 砖块
        this.createBricks();
    }
    
    // 创建砖块
    createBricks() {
        const level = LEVELS[this.currentLevel - 1];
        this.bricks = [];
        
        for (let row = 0; row < level.rows; row++) {
            for (let col = 0; col < level.cols; col++) {
                // 检查是否有自定义图案
                if (level.pattern && !level.pattern[row][col]) {
                    continue;
                }
                
                // 检查是否是硬砖块
                const isStrong = level.strongBricks.some(
                    ([r, c]) => r === row && c === col
                );
                
                const brick = {
                    x: level.offsetLeft + col * (level.brickWidth + level.brickPadding),
                    y: level.offsetTop + row * (level.brickHeight + level.brickPadding),
                    width: level.brickWidth,
                    height: level.brickHeight,
                    color: isStrong ? COLORS.strongBrick : COLORS.bricks[row % COLORS.bricks.length],
                    strength: isStrong ? 2 : 1,
                    maxStrength: isStrong ? 2 : 1
                };
                
                this.bricks.push(brick);
            }
        }
    }
    
    // 绑定事件
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                this.keys.left = true;
            }
            if (e.key === 'ArrowRight' || e.key === 'd') {
                this.keys.right = true;
            }
            if (e.key === ' ') {
                e.preventDefault();
                if (this.state === GAME_STATE.PLAYING && this.ball.attached) {
                    this.launchBall();
                    this.hideOverlay();
                } else if (this.state === GAME_STATE.PLAYING) {
                    this.pause();
                } else if (this.state === GAME_STATE.PAUSED) {
                    this.resume();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                this.keys.left = false;
            }
            if (e.key === 'ArrowRight' || e.key === 'd') {
                this.keys.right = false;
            }
        });
        
        // 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseMoved = true;
        });

        // 点击发射小球
        this.canvas.addEventListener('click', (e) => {
            if (this.ball.attached && this.state === GAME_STATE.PLAYING) {
                this.launchBall();
                this.hideOverlay();
            }
        });
        
        // 按钮事件
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => {
            if (this.state === GAME_STATE.PLAYING) {
                this.pause();
            } else if (this.state === GAME_STATE.PAUSED) {
                this.resume();
            }
        });
        this.resetBtn.addEventListener('click', () => this.reset());
    }
    
    // 开始游戏
    start() {
        if (this.state === GAME_STATE.WIN || this.state === GAME_STATE.LOSE) {
            // 游戏结束后重新开始
            this.clearGameState();
            this.score = 0;
            this.lives = 3;
            this.currentLevel = 1;
            this.state = GAME_STATE.IDLE;
            this.pauseBtn.textContent = '暂停';
            this.initObjects();
            this.updateUI();
            this.mouseMoved = false;
        }
        
        if (this.state === GAME_STATE.IDLE) {
            this.state = GAME_STATE.PLAYING;
            this.hideOverlay();
            this.ball.attached = true; // 先附着，让用户点击或按空格发射
            this.gameLoop();
        } else if (this.state === GAME_STATE.PAUSED) {
            this.resume();
        } else if (this.state === GAME_STATE.PLAYING && this.ball.attached) {
            this.launchBall();
            this.hideOverlay();
        }
    }
    
    // 发射小球
    launchBall() {
        if (this.ball.attached) {
            this.ball.attached = false;
            const level = LEVELS[this.currentLevel - 1];
            this.ball.dx = level.ballSpeed;
            this.ball.dy = -level.ballSpeed;
        }
    }
    
    // 暂停
    pause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            this.pauseBtn.textContent = '继续';
            this.showOverlay('暂停中', '游戏已暂停，点击继续或按空格键', 'pause');
            this.saveGameState();
        }
    }
    
    // 继续
    resume() {
        if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            this.pauseBtn.textContent = '暂停';
            this.hideOverlay();
            this.gameLoop();
        }
    }
    
    // 重置
    reset() {
        if (confirm('确定要重置游戏吗？所有进度将丢失。')) {
            this.clearGameState();
            this.score = 0;
            this.lives = 3;
            this.currentLevel = 1;
            this.state = GAME_STATE.IDLE;
            this.pauseBtn.textContent = '暂停';
            this.initObjects();
            this.updateUI();
            this.showOverlay('弹弹球', '点击"开始游戏"开始挑战！', '');
            this.render();
        }
    }
    
    // 游戏循环
    gameLoop() {
        if (this.state !== GAME_STATE.PLAYING) {
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
        
        this.update();
        this.render();
        this.saveGameState();
    }
    
    // 更新游戏状态
    update() {
        // 更新挡板位置
        this.updatePaddle();
        
        // 更新小球位置
        this.updateBall();
        
        // 检查碰撞
        this.checkCollisions();
        
        // 检查游戏状态
        this.checkGameStatus();
    }
    
    // 更新挡板
    updatePaddle() {
        let moved = false;
        
        // 键盘控制 - 优先
        if (this.keys.left) {
            this.paddle.x -= this.paddle.speed;
            this.mouseMoved = false;
            moved = true;
        }
        if (this.keys.right) {
            this.paddle.x += this.paddle.speed;
            this.mouseMoved = false;
            moved = true;
        }
        
        // 鼠标控制 - 只有当鼠标移动过且键盘没在用时
        if (!moved && this.mouseMoved) {
            const targetX = this.mouseX - this.paddle.width / 2;
            this.paddle.x += (targetX - this.paddle.x) * 0.15;
        }
        
        // 边界限制 - 严格限制，确保不会超出
        const maxX = this.canvas.width - this.paddle.width;
        if (this.paddle.x < 0) {
            this.paddle.x = 0;
        }
        if (this.paddle.x > maxX) {
            this.paddle.x = maxX;
        }
        
        // 使用整数，避免浮点数精度问题
        this.paddle.x = Math.round(this.paddle.x);
        
        // 如果小球附着在挡板上
        if (this.ball.attached) {
            this.ball.x = this.paddle.x + this.paddle.width / 2;
            this.ball.y = this.paddle.y - this.ball.radius;
        }
    }
    
    // 更新小球
    updateBall() {
        if (this.ball.attached) {
            return;
        }
        
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // 墙壁碰撞
        if (this.ball.x - this.ball.radius < 0 || this.ball.x + this.ball.radius > this.canvas.width) {
            this.ball.dx = -this.ball.dx;
        }
        
        // 顶部碰撞
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
        }
    }
    
    // 检查碰撞
    checkCollisions() {
        // 挡板碰撞
        if (this.checkPaddleCollision()) {
            this.ball.dy = -Math.abs(this.ball.dy);
            this.ball.y = this.paddle.y - this.ball.radius;
        }
        
        // 砖块碰撞
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const brick = this.bricks[i];
            if (this.checkBrickCollision(brick)) {
                this.handleBrickHit(brick, i);
                break;
            }
        }
    }
    
    // 挡板碰撞检测
    checkPaddleCollision() {
        return this.ball.y + this.ball.radius > this.paddle.y &&
               this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
               this.ball.x > this.paddle.x &&
               this.ball.x < this.paddle.x + this.paddle.width &&
               this.ball.dy > 0;
    }
    
    // 砖块碰撞检测
    checkBrickCollision(brick) {
        return this.ball.x + this.ball.radius > brick.x &&
               this.ball.x - this.ball.radius < brick.x + brick.width &&
               this.ball.y + this.ball.radius > brick.y &&
               this.ball.y - this.ball.radius < brick.y + brick.height;
    }
    
    // 处理砖块被击中
    handleBrickHit(brick, index) {
        // 计算碰撞方向
        const fromTop = this.ball.y < brick.y;
        const fromBottom = this.ball.y > brick.y + brick.height;
        const fromLeft = this.ball.x < brick.x;
        const fromRight = this.ball.x > brick.x + brick.width;
        
        // 反弹
        if (fromTop || fromBottom) {
            this.ball.dy = -this.ball.dy;
        }
        if (fromLeft || fromRight) {
            this.ball.dx = -this.ball.dx;
        }
        
        // 减少砖块强度
        brick.strength--;
        
        if (brick.strength <= 0) {
            // 移除砖块
            this.bricks.splice(index, 1);
            // 加分
            this.score += brick.maxStrength === 2 ? 20 : 10;
            this.updateUI();
        } else {
            // 砖块变亮
            brick.color = COLORS.bricks[Math.floor(Math.random() * COLORS.bricks.length)];
        }
    }
    
    // 检查游戏状态
    checkGameStatus() {
        // 小球掉落
        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.lives--;
            this.updateUI();
            
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.resetBall();
            }
        }
        
        // 砖块清空
        if (this.bricks.length === 0) {
            this.levelComplete();
        }
    }
    
    // 重置小球
    resetBall() {
        const level = LEVELS[this.currentLevel - 1];
        this.ball.attached = true;
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radius;
        this.ball.dx = level.ballSpeed;
        this.ball.dy = -level.ballSpeed;
    }
    
    // 游戏结束
    gameOver() {
        this.state = GAME_STATE.LOSE;
        cancelAnimationFrame(this.animationId);
        this.clearGameState();
        this.pauseBtn.textContent = '暂停';
        this.showOverlay('游戏结束', `最终得分: ${this.score}`, 'lose');
    }
    
    // 关卡完成
    levelComplete() {
        if (this.currentLevel >= LEVELS.length) {
            this.state = GAME_STATE.WIN;
            cancelAnimationFrame(this.animationId);
            this.clearGameState();
            this.pauseBtn.textContent = '暂停';
            this.showOverlay('恭喜通关！', `最终得分: ${this.score}`, 'win');
        } else {
            // 下一关
            this.currentLevel++;
            this.score += 100; // 通关奖励
            this.updateUI();
            this.createBricks();
            this.resetBall();
            this.ball.attached = false;
            this.saveGameState();
        }
    }
    
    // 渲染
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制砖块
        this.renderBricks();
        
        // 绘制挡板
        this.renderPaddle();
        
        // 绘制小球
        this.renderBall();
    }
    
    // 绘制挡板
    renderPaddle() {
        const x = this.paddle.x;
        const y = this.paddle.y;
        const w = this.paddle.width;
        const h = this.paddle.height;
        const r = h / 2;
        
        this.ctx.fillStyle = COLORS.paddle;
        
        // 中间矩形部分（去掉圆角区域）
        this.ctx.fillRect(x + r, y, w - r * 2, h);
        
        // 左边圆角（右半圆，填补左边直角）
        this.ctx.beginPath();
        this.ctx.arc(x + r, y + r, r, -Math.PI / 2, Math.PI / 2);
        this.ctx.fill();
        
        // 右边圆角（左半圆，填补右边直角）
        this.ctx.beginPath();
        this.ctx.arc(x + w - r, y + r, r, Math.PI / 2, -Math.PI / 2);
        this.ctx.fill();
    }
    
    // 绘制小球
    renderBall() {
        this.ctx.beginPath();
        this.ctx.arc(
            this.ball.x,
            this.ball.y,
            this.ball.radius,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = COLORS.ball;
        this.ctx.fill();
        this.ctx.closePath();
        
        // 高光效果
        this.ctx.beginPath();
        this.ctx.arc(
            this.ball.x - 2,
            this.ball.y - 2,
            3,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fill();
        this.ctx.closePath();
    }
    
    // 绘制砖块
    renderBricks() {
        this.bricks.forEach(brick => {
            // 背景
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(
                brick.x,
                brick.y,
                brick.width,
                brick.height
            );
            
            // 边框
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                brick.x,
                brick.y,
                brick.width,
                brick.height
            );
            
            // 硬砖块显示剩余次数
            if (brick.maxStrength === 2 && brick.strength === 2) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    '2',
                    brick.x + brick.width / 2,
                    brick.y + brick.height / 2
                );
            }
        });
    }
    
    // 更新UI
    updateUI() {
        this.scoreEl.textContent = this.score;
        this.levelEl.textContent = this.currentLevel;
        this.livesEl.textContent = this.lives;
    }
    
    // 显示遮罩
    showOverlay(title, message, type) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlayContent.className = 'overlay-content';
        
        if (type) {
            this.overlayContent.classList.add(type);
        }
        
        this.overlay.classList.remove('hidden');
    }
    
    // 隐藏遮罩
    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
    
    // 保存游戏状态到localStorage
    saveGameState() {
        const state = {
            score: this.score,
            lives: this.lives,
            currentLevel: this.currentLevel,
            state: this.state,
            paddle: this.paddle,
            ball: this.ball,
            bricks: this.bricks,
            timestamp: Date.now()
        };
        
        localStorage.setItem('tantanqiu_game_state', JSON.stringify(state));
    }
    
    // 从localStorage加载游戏状态
    loadGameState() {
        const saved = localStorage.getItem('tantanqiu_game_state');
        if (!saved) {
            return false;
        }
        
        try {
            const state = JSON.parse(saved);
            
            // 检查是否是24小时内的保存
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            
            if (state.timestamp && now - state.timestamp > oneDay) {
                this.clearGameState();
                return false;
            }
            
            // 恢复状态
            if (state.state === GAME_STATE.PLAYING || state.state === GAME_STATE.PAUSED) {
                this.score = state.score;
                this.lives = state.lives;
                this.currentLevel = state.currentLevel;
                this.state = state.state;
                this.paddle = state.paddle;
                this.ball = state.ball;
                this.bricks = state.bricks;
                
                if (this.state === GAME_STATE.PAUSED) {
                    this.pauseBtn.textContent = '继续';
                    this.showOverlay('暂停中', '游戏已暂停，点击继续或按空格键', 'pause');
                } else if (this.state === GAME_STATE.PLAYING) {
                    // 只要是PLAYING状态，就启动游戏循环
                    this.gameLoop();
                    if (this.ball.attached) {
                        // 如果小球附着，提示用户点击或按空格发射
                        this.showOverlay('准备发射', '点击画布或按空格键发射小球', '');
                    }
                }
                return true;
            }
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            this.clearGameState();
        }
        return false;
    }
    
    // 清除localStorage游戏状态
    clearGameState() {
        localStorage.removeItem('tantanqiu_game_state');
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});