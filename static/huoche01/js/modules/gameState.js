/**
 * 游戏状态管理模块
 * 管理游戏的整体状态和流程
 */

// 游戏状态枚举
const GameStatus = {
    IDLE: 'idle',           // 空闲状态
    PLAYING: 'playing',     // 游戏中
    PAUSED: 'paused',       // 已暂停
    GAME_OVER: 'gameOver',  // 游戏结束
    VICTORY: 'victory'      // 胜利
};

/**
 * GameState类 - 游戏状态管理器
 */
class GameState {
    /**
     * 构造函数
     */
    constructor() {
        // 当前游戏状态
        this.status = GameStatus.IDLE;
        
        // 当前关卡
        this.currentLevel = 1;
        
        // 最大关卡
        this.maxLevel = 5;
        
        // 游戏时间
        this.gameTime = 0;
        
        // 分数
        this.score = 0;
        
        // 火车列表
        this.trains = [];
        
        // 道岔列表
        this.switches = [];
        
        // 信号灯列表
        this.signals = [];
        
        // 站台列表
        this.platforms = [];
        
        // 入口列表
        this.entrances = [];
        
        // 轨道地图
        this.trackMap = [];
        
        // 地图尺寸
        this.mapWidth = 0;
        this.mapHeight = 0;
        
        // 碰撞信息
        this.lastCollision = null;
        
        // 胜利信息
        this.victoryInfo = null;
    }

    /**
     * 重置游戏状态
     */
    reset() {
        this.status = GameStatus.IDLE;
        this.gameTime = 0;
        this.score = 0;
        this.trains = [];
        this.switches = [];
        this.signals = [];
        this.platforms = [];
        this.entrances = [];
        this.trackMap = [];
        this.lastCollision = null;
        this.victoryInfo = null;
    }

    /**
     * 开始游戏
     */
    start() {
        this.status = GameStatus.PLAYING;
        this.gameTime = 0;
        
        // 启动所有火车
        this.trains.forEach(train => {
            if (train.status === 'waiting') {
                train.start();
            }
        });
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (this.status === GameStatus.PLAYING) {
            this.status = GameStatus.PAUSED;
        }
    }

    /**
     * 继续游戏
     */
    resume() {
        if (this.status === GameStatus.PAUSED) {
            this.status = GameStatus.PLAYING;
        }
    }

    /**
     * 游戏结束
     * @param {Object} collision - 碰撞信息
     */
    gameOver(collision) {
        this.status = GameStatus.GAME_OVER;
        this.lastCollision = collision;
    }

    /**
     * 胜利
     * @param {Object} info - 胜利信息
     */
    victory(info = {}) {
        this.status = GameStatus.VICTORY;
        this.victoryInfo = {
            time: this.gameTime,
            score: this.score,
            trainsArrived: this.getArrivedTrainCount(),
            ...info
        };
    }

    /**
     * 下一关
     * @returns {boolean} 是否成功进入下一关
     */
    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.reset();
            return true;
        }
        return false;
    }

    /**
     * 检查游戏是否正在进行
     * @returns {boolean}
     */
    isPlaying() {
        return this.status === GameStatus.PLAYING;
    }

    /**
     * 检查游戏是否已暂停
     * @returns {boolean}
     */
    isPaused() {
        return this.status === GameStatus.PAUSED;
    }

    /**
     * 检查游戏是否结束
     * @returns {boolean}
     */
    isGameOver() {
        return this.status === GameStatus.GAME_OVER;
    }

    /**
     * 检查是否胜利
     * @returns {boolean}
     */
    isVictory() {
        return this.status === GameStatus.VICTORY;
    }

    /**
     * 获取已到达站台的火车数量
     * @returns {number}
     */
    getArrivedTrainCount() {
        return this.trains.filter(train => train.status === 'arrived').length;
    }

    /**
     * 获取存活的火车数量
     * @returns {number}
     */
    getActiveTrainCount() {
        return this.trains.filter(train => 
            train.status === 'waiting' || train.status === 'moving'
        ).length;
    }

    /**
     * 检查所有火车是否都已到达
     * @returns {boolean}
     */
    allTrainsArrived() {
        return this.trains.every(train => train.status === 'arrived');
    }

    /**
     * 更新游戏时间
     * @param {number} deltaTime - 时间增量（秒）
     */
    updateTime(deltaTime) {
        if (this.isPlaying()) {
            this.gameTime += deltaTime;
        }
    }

    /**
     * 获取轨道
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null}
     */
    getTrack(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return null;
        }
        
        if (!this.trackMap[y] || !this.trackMap[y][x]) {
            return null;
        }
        
        return this.trackMap[y][x];
    }

    /**
     * 根据类型获取道岔
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null}
     */
    getSwitch(x, y) {
        return this.switches.find(s => s.x === x && s.y === y);
    }

    /**
     * 根据类型获取信号灯
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null}
     */
    getSignal(x, y) {
        return this.signals.find(s => s.x === x && s.y === y);
    }

    /**
     * 序列化游戏状态
     * @returns {Object}
     */
    serialize() {
        return {
            status: this.status,
            currentLevel: this.currentLevel,
            maxLevel: this.maxLevel,
            gameTime: this.gameTime,
            score: this.score,
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight,
            trains: this.trains.map(train => train.serialize ? train.serialize() : train),
            switches: this.switches.map(sw => sw.serialize ? sw.serialize() : sw),
            signals: this.signals.map(sig => sig.serialize ? sig.serialize() : sig),
            platforms: this.platforms,
            entrances: this.entrances,
            trackMap: this.trackMap,
            lastCollision: this.lastCollision,
            victoryInfo: this.victoryInfo
        };
    }

    /**
     * 从序列化数据恢复游戏状态
     * @param {Object} data - 序列化数据
     * @param {Object} TrainClass - 火车类
     * @param {Object} SwitchClass - 道岔类
     * @param {Object} SignalClass - 信号灯类
     */
    deserialize(data, TrainClass, SwitchClass, SignalClass) {
        this.status = data.status || GameStatus.IDLE;
        this.currentLevel = data.currentLevel || 1;
        this.maxLevel = data.maxLevel || 5;
        this.gameTime = data.gameTime || 0;
        this.score = data.score || 0;
        this.mapWidth = data.mapWidth || 0;
        this.mapHeight = data.mapHeight || 0;
        this.platforms = data.platforms || [];
        this.entrances = data.entrances || [];
        this.trackMap = data.trackMap || [];
        this.lastCollision = data.lastCollision || null;
        this.victoryInfo = data.victoryInfo || null;
        
        // 恢复火车
        if (data.trains && TrainClass) {
            this.trains = data.trains.map(trainData => {
                if (TrainClass.deserialize) {
                    return TrainClass.deserialize(trainData);
                }
                return trainData;
            });
        }
        
        // 恢复道岔
        if (data.switches && SwitchClass) {
            this.switches = data.switches.map(switchData => {
                if (SwitchClass.deserialize) {
                    return SwitchClass.deserialize(switchData);
                }
                return switchData;
            });
        }
        
        // 恢复信号灯
        if (data.signals && SignalClass) {
            this.signals = data.signals.map(signalData => {
                if (SignalClass.deserialize) {
                    return SignalClass.deserialize(signalData);
                }
                return signalData;
            });
        }
    }
}

export { GameState, GameStatus };
