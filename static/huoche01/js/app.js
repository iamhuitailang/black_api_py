/**
 * 火车调度游戏 - 主入口文件
 * 整合所有模块，实现游戏核心逻辑
 */

// 导入所有模块
import Storage from './modules/storage.js';
import { Train, TrainType, TrainStatus } from './modules/train.js';
import { Switch, SwitchType } from './modules/switch.js';
import { Signal, SignalState } from './modules/signal.js';
import { CollisionDetector, CollisionType } from './modules/collision.js';
import { GameState, GameStatus } from './modules/gameState.js';
import Renderer from './modules/renderer.js';
import { Levels, LevelManager } from './modules/levels.js';
import UI from './modules/ui.js';

/**
 * Game类 - 游戏主控制器
 */
class Game {
    /**
     * 构造函数
     */
    constructor() {
        // 模块实例
        this.ui = new UI();
        this.gameState = new GameState();
        this.renderer = null;
        this.levelManager = new LevelManager();
        this.collisionDetector = new CollisionDetector();
        
        // 游戏循环
        this.lastTime = 0;
        this.animationFrameId = null;
        this.isRunning = false;
        
        // 自动保存间隔
        this.autoSaveInterval = 5000; // 5秒
        this.lastSaveTime = 0;
        
        // 火车延迟出发计时器
        this.trainDelayTimers = [];
    }

    /**
     * 初始化游戏
     */
    async init() {
        // 初始化UI
        this.ui.init();
        
        // 设置UI回调
        this.ui.setCallback('onStart', () => this.start());
        this.ui.setCallback('onPause', () => this.togglePause());
        this.ui.setCallback('onRestart', () => this.restart());
        this.ui.setCallback('onNextLevel', () => this.nextLevel());
        this.ui.setCallback('onCanvasClick', (x, y) => this.handleCanvasClick(x, y));
        
        // 初始化渲染器
        const canvas = this.ui.getCanvas();
        if (canvas) {
            this.renderer = new Renderer(canvas);
            this.renderer.setSize(800, 600);
        }
        
        // 尝试加载保存的游戏状态
        const hasLoaded = await this.tryLoadSavedGame();
        
        if (!hasLoaded) {
            // 如果没有保存的游戏，加载第一关
            this.loadLevel(1);
        }
        
        // 更新UI显示
        this.updateUI();
    }

    /**
     * 尝试加载保存的游戏状态
     * @returns {boolean} 是否成功加载
     */
    async tryLoadSavedGame() {
        const savedState = Storage.loadGameState();
        
        if (savedState) {
            try {
                // 恢复游戏状态
                this.gameState.deserialize(
                    savedState,
                    Train,
                    Switch,
                    Signal
                );
                
                // 恢复关卡管理器
                if (savedState.currentLevel) {
                    this.levelManager.setCurrentLevel(savedState.currentLevel);
                }
                
                console.log('成功加载保存的游戏状态');
                return true;
            } catch (error) {
                console.error('加载保存的游戏状态失败:', error);
                Storage.clearGameState();
            }
        }
        
        return false;
    }

    /**
     * 加载关卡
     * @param {number} levelId - 关卡ID
     */
    loadLevel(levelId) {
        const levelData = this.levelManager.getLevel(levelId);
        
        if (!levelData) {
            console.error(`找不到关卡 ${levelId}`);
            return;
        }
        
        // 重置游戏状态
        this.gameState.reset();
        this.gameState.currentLevel = levelId;
        this.gameState.mapWidth = levelData.mapWidth;
        this.gameState.mapHeight = levelData.mapHeight;
        
        // 解析轨道地图
        this.gameState.trackMap = this.levelManager.parseTrackMap(levelData.trackMap);
        
        // 创建道岔
        this.gameState.switches = levelData.switches.map(swData => 
            new Switch({
                id: swData.id,
                x: swData.x,
                y: swData.y,
                type: swData.type,
                state: swData.state
            })
        );
        
        // 创建信号灯
        this.gameState.signals = levelData.signals.map(sigData =>
            new Signal({
                id: sigData.id,
                x: sigData.x,
                y: sigData.y,
                isRed: sigData.isRed
            })
        );
        
        // 设置站台和入口
        this.gameState.platforms = [...levelData.platforms];
        this.gameState.entrances = [...levelData.entrances];
        
        // 创建火车（延迟启动）
        this.gameState.trains = [];
        this.trainDelayTimers = [];
        
        levelData.trains.forEach((trainData, index) => {
            const train = new Train({
                id: trainData.id,
                type: trainData.type,
                x: trainData.startX,
                y: trainData.startY,
                direction: trainData.direction,
                targetPlatform: trainData.targetPlatform
            });
            
            this.gameState.trains.push(train);
            
            // 如果有延迟，设置延迟计时器
            if (trainData.delay && trainData.delay > 0) {
                this.trainDelayTimers.push({
                    train: train,
                    delay: trainData.delay,
                    elapsed: 0
                });
            }
        });
        
        // 更新UI
        this.ui.setCurrentLevel(levelId);
        this.updateUI();
        
        console.log(`已加载关卡 ${levelId}: ${levelData.name}`);
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.gameState.status === 'playing') {
            return;
        }
        
        // 开始游戏状态
        this.gameState.start();
        
        // 启动没有延迟的火车
        this.gameState.trains.forEach(train => {
            const hasDelay = this.trainDelayTimers.some(timer => timer.train.id === train.id);
            if (!hasDelay && train.status === 'waiting') {
                train.start();
            }
        });
        
        // 开始游戏循环
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
        }
        
        this.updateUI();
        console.log('游戏开始');
    }

    /**
     * 暂停/继续游戏
     */
    togglePause() {
        if (this.gameState.isPlaying()) {
            this.gameState.pause();
        } else if (this.gameState.isPaused()) {
            this.gameState.resume();
        }
        
        this.updateUI();
    }

    /**
     * 重新开始当前关卡
     */
    restart() {
        // 停止游戏循环
        this.stopGameLoop();
        
        // 清除延迟计时器
        this.trainDelayTimers = [];
        
        // 重新加载当前关卡
        this.loadLevel(this.gameState.currentLevel);
        
        // 清除保存的状态
        Storage.clearGameState();
        
        // 重新启动游戏循环（用于渲染）
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('游戏已重新开始');
    }

    /**
     * 下一关
     */
    nextLevel() {
        if (this.levelManager.isLastLevel()) {
            console.log('已经是最后一关了');
            return;
        }
        
        // 停止游戏循环
        this.stopGameLoop();
        
        // 清除保存的状态
        Storage.clearGameState();
        
        // 进入下一关
        this.levelManager.nextLevel();
        const nextLevelId = this.levelManager.getCurrentLevel().id;
        this.loadLevel(nextLevelId);
        
        console.log(`进入下一关: ${nextLevelId}`);
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.isRunning) {
            return;
        }
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
        this.lastTime = currentTime;
        
        // 更新游戏逻辑
        if (this.gameState.isPlaying()) {
            this.update(deltaTime);
        }
        
        // 渲染
        this.render();
        
        // 自动保存
        this.autoSave(currentTime);
        
        // 继续下一帧
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 更新游戏逻辑
     * @param {number} deltaTime - 时间增量（秒）
     */
    update(deltaTime) {
        // 更新游戏时间
        this.gameState.updateTime(deltaTime);
        
        // 更新延迟火车计时器
        this.updateTrainDelays(deltaTime);
        
        // 准备信号灯状态映射
        const signalStates = {};
        this.gameState.signals.forEach(sig => {
            signalStates[`${sig.x},${sig.y}`] = sig;
        });
        
        // 准备道岔状态映射
        const switchStates = {};
        this.gameState.switches.forEach(sw => {
            switchStates[`${sw.x},${sw.y}`] = sw.state;
        });
        
        // 更新火车
        this.gameState.trains.forEach(train => {
            if (train.status === 'moving') {
                train.update(deltaTime, this.gameState, signalStates, switchStates);
            }
            train.updateAnimation(deltaTime);
        });
        
        // 更新道岔动画
        this.gameState.switches.forEach(sw => {
            sw.updateAnimation(deltaTime);
        });
        
        // 更新信号灯动画
        this.gameState.signals.forEach(sig => {
            sig.updateAnimation(deltaTime);
        });
        
        // 检查碰撞
        const collision = this.collisionDetector.detectAll(
            this.gameState.trains,
            this.gameState
        );
        
        if (collision) {
            this.handleCollision(collision);
            return;
        }
        
        // 检查火车是否到达站台
        this.checkTrainArrivals();
        
        // 检查是否所有火车都已到达
        if (this.gameState.allTrainsArrived()) {
            this.handleVictory();
        }
        
        // 更新渲染器特效
        if (this.renderer) {
            this.renderer.update(deltaTime);
        }
    }

    /**
     * 更新火车延迟计时器
     * @param {number} deltaTime - 时间增量
     */
    updateTrainDelays(deltaTime) {
        this.trainDelayTimers = this.trainDelayTimers.filter(timer => {
            timer.elapsed += deltaTime;
            
            if (timer.elapsed >= timer.delay) {
                // 延迟时间到，启动火车
                if (timer.train.status === 'waiting') {
                    timer.train.start();
                    console.log(`火车 ${timer.train.id} 延迟启动`);
                }
                return false;
            }
            
            return true;
        });
    }

    /**
     * 检查火车是否到达站台
     */
    checkTrainArrivals() {
        this.gameState.trains.forEach(train => {
            if (train.status === 'moving' || train.status === 'waiting') {
                // 检查是否到达目标站台
                if (train.targetPlatform) {
                    const arrived = (train.x === train.targetPlatform.x && 
                                    train.y === train.targetPlatform.y);
                    
                    if (arrived) {
                        train.arrive();
                        console.log(`火车 ${train.id} 已到达站台`);
                    }
                }
            }
        });
    }

    /**
     * 处理碰撞
     * @param {Object} collision - 碰撞信息
     */
    handleCollision(collision) {
        // 停止游戏循环
        this.stopGameLoop();
        
        // 设置游戏状态
        this.gameState.gameOver(collision);
        
        // 添加爆炸特效
        if (this.renderer && collision.position) {
            this.renderer.addExplosionEffect(
                collision.position.x,
                collision.position.y
            );
        }
        
        // 震动屏幕
        this.ui.shakeScreen();
        
        // 显示游戏结束模态框
        const message = this.collisionDetector.getCollisionDescription(collision);
        this.ui.showGameOverModal(message);
        
        // 清除保存的状态
        Storage.clearGameState();
        
        // 更新UI
        this.updateUI();
        
        console.error('游戏结束 - 碰撞:', collision);
    }

    /**
     * 处理胜利
     */
    handleVictory() {
        // 停止游戏循环
        this.stopGameLoop();
        
        // 设置游戏状态
        this.gameState.victory();
        
        // 添加烟花特效
        if (this.renderer) {
            this.renderer.addFireworkEffect();
        }
        
        // 显示胜利模态框
        const isLastLevel = this.levelManager.isLastLevel();
        this.ui.showVictoryModal(this.gameState.victoryInfo, isLastLevel);
        
        // 保存关卡进度
        Storage.saveLevelProgress(this.gameState.currentLevel);
        
        // 清除游戏状态（因为已经通关）
        Storage.clearGameState();
        
        // 更新UI
        this.updateUI();
        
        console.log('关卡完成!');
    }

    /**
     * 渲染游戏
     */
    render() {
        if (this.renderer) {
            this.renderer.render(this.gameState);
        }
    }

    /**
     * 自动保存
     * @param {number} currentTime - 当前时间
     */
    autoSave(currentTime) {
        // 只在游戏进行中保存
        if (!this.gameState.isPlaying()) {
            return;
        }
        
        if (currentTime - this.lastSaveTime >= this.autoSaveInterval) {
            this.saveGame();
            this.lastSaveTime = currentTime;
        }
    }

    /**
     * 保存游戏状态
     */
    saveGame() {
        const stateToSave = this.gameState.serialize();
        Storage.saveGameState(stateToSave);
        console.log('游戏状态已保存');
    }

    /**
     * 停止游戏循环
     */
    stopGameLoop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * 处理画布点击
     * @param {number} x - 点击X坐标
     * @param {number} y - 点击Y坐标
     */
    handleCanvasClick(x, y) {
        const gridSize = this.renderer ? this.renderer.gridSize : 40;
        const offsetX = this.renderer ? this.renderer.offsetX : 0;
        const offsetY = this.renderer ? this.renderer.offsetY : 0;
        
        // 检查是否点击了道岔
        let clickedSwitch = null;
        for (const sw of this.gameState.switches) {
            if (sw.isPointInSwitch(x, y, gridSize, offsetX, offsetY)) {
                clickedSwitch = sw;
                break;
            }
        }
        
        if (clickedSwitch) {
            clickedSwitch.toggle();
            console.log(`道岔 ${clickedSwitch.id} 切换到状态 ${clickedSwitch.state}`);
            return;
        }
        
        // 检查是否点击了信号灯
        let clickedSignal = null;
        for (const sig of this.gameState.signals) {
            if (sig.isPointInSignal(x, y, gridSize, offsetX, offsetY)) {
                clickedSignal = sig;
                break;
            }
        }
        
        if (clickedSignal) {
            clickedSignal.toggle();
            console.log(`信号灯 ${clickedSignal.id} 切换到 ${clickedSignal.isRed ? '红灯' : '绿灯'}`);
            return;
        }
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        const status = this.gameState.status;
        
        // 更新状态文本
        let statusText = '准备开始';
        switch (status) {
            case 'idle':
                statusText = '准备开始';
                break;
            case 'playing':
                statusText = '游戏中';
                break;
            case 'paused':
                statusText = '已暂停';
                break;
            case 'gameOver':
                statusText = '游戏结束';
                break;
            case 'victory':
                statusText = '通关！';
                break;
        }
        
        this.ui.setGameStatus(statusText);
        this.ui.updateButtonStates(status);
        
        // 显示/隐藏下一关按钮
        const showNextLevel = (status === 'victory' && !this.levelManager.isLastLevel());
        this.ui.showNextLevelButton(showNextLevel);
    }

    /**
     * 销毁游戏
     */
    destroy() {
        this.stopGameLoop();
        Storage.clearGameState();
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', async () => {
    console.log('火车调度游戏正在初始化...');
    
    const game = new Game();
    await game.init();
    
    // 开始游戏循环（用于渲染）
    game.isRunning = true;
    game.lastTime = performance.now();
    game.gameLoop();
    
    console.log('火车调度游戏初始化完成！');
    
    // 页面卸载时保存游戏
    window.addEventListener('beforeunload', () => {
        if (game.gameState.isPlaying()) {
            game.saveGame();
        }
    });
});
