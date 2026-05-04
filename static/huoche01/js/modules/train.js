/**
 * 火车模块
 * 定义火车类型、属性和行为
 */

// 火车类型枚举
const TrainType = {
    FREIGHT: {
        name: '货运',
        emoji: '🚂',
        speed: 1.0,
        minLength: 2,
        maxLength: 4,
        color: '#8B4513'
    },
    HIGH_SPEED: {
        name: '高铁',
        emoji: '🚅',
        speed: 1.5,
        minLength: 2,
        maxLength: 3,
        color: '#1E90FF'
    },
    SUBWAY: {
        name: '地铁',
        emoji: '🚇',
        speed: 1.0,
        minLength: 3,
        maxLength: 4,
        color: '#228B22'
    }
};

// 火车状态枚举
const TrainStatus = {
    WAITING: 'waiting',      // 等待中
    MOVING: 'moving',        // 行驶中
    ARRIVED: 'arrived',      // 已到达
    CRASHED: 'crashed'       // 已相撞
};

/**
 * Train类
 */
class Train {
    /**
     * 构造函数
     * @param {Object} options - 火车配置选项
     */
    constructor(options = {}) {
        this.id = options.id || `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 火车类型
        this.type = options.type || TrainType.FREIGHT;
        
        // 位置信息
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.previousX = this.x;
        this.previousY = this.y;
        
        // 动画位置（用于平滑移动）
        this.animX = this.x;
        this.animY = this.y;
        
        // 方向
        this.direction = options.direction || 'right';
        
        // 速度和移动
        this.speed = this.type.speed;
        this.moveProgress = 0;
        
        // 长度和车厢
        this.length = options.length || this.getRandomLength();
        this.cars = [];
        
        // 状态
        this.status = options.status || TrainStatus.WAITING;
        
        // 目标站台
        this.targetPlatform = options.targetPlatform || null;
        
        // 路径记录
        this.path = [];
        this.currentPathIndex = 0;
        
        // 等待原因
        this.waitReason = null;
        
        // 初始化车厢位置
        this.initCars();
    }

    /**
     * 获取随机长度
     * @returns {number}
     */
    getRandomLength() {
        const min = this.type.minLength;
        const max = this.type.maxLength;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 初始化车厢位置
     */
    initCars() {
        this.cars = [];
        const offset = this.getDirectionOffset(this.direction);
        
        for (let i = 0; i < this.length; i++) {
            this.cars.push({
                x: this.x - offset.x * i,
                y: this.y - offset.y * i,
                animX: this.x - offset.x * i,
                animY: this.y - offset.y * i
            });
        }
    }

    /**
     * 获取方向偏移量
     * @param {string} direction - 方向
     * @returns {Object}
     */
    getDirectionOffset(direction) {
        const offsets = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };
        return offsets[direction] || { x: 0, y: 0 };
    }

    /**
     * 更新火车位置
     * @param {number} deltaTime - 时间增量（秒）
     * @param {Object} trackSystem - 轨道系统
     * @param {Object} signals - 信号灯状态
     * @param {Object} switches - 道岔状态
     */
    update(deltaTime, trackSystem, signals = {}, switches = {}) {
        if (this.status !== TrainStatus.MOVING) {
            return;
        }

        // 更新移动进度
        this.moveProgress += this.speed * deltaTime;

        if (this.moveProgress >= 1.0) {
            // 完成一格移动
            this.moveProgress = 0;
            
            // 保存之前的位置
            this.previousX = this.x;
            this.previousY = this.y;
            
            // 计算下一个位置
            const nextPosition = this.calculateNextPosition(trackSystem, switches);
            
            if (nextPosition) {
                // 检查信号灯
                if (this.checkSignal(nextPosition.x, nextPosition.y, signals)) {
                    this.waitReason = 'signal';
                    this.status = TrainStatus.WAITING;
                    return;
                }
                
                // 移动到新位置
                this.x = nextPosition.x;
                this.y = nextPosition.y;
                this.direction = nextPosition.direction;
                
                // 更新车厢位置
                this.updateCars();
                
                // 记录路径
                this.path.push({ x: this.x, y: this.y, direction: this.direction });
            } else {
                // 脱轨
                this.status = TrainStatus.CRASHED;
            }
        }
    }

    /**
     * 获取轨道可以连接的所有方向
     * @param {string} trackType - 轨道类型
     * @returns {Array} 方向数组
     */
    getTrackConnections(trackType) {
        // 定义每种轨道类型可以连接的方向
        const connections = {
            '─': ['left', 'right'],
            '│': ['up', 'down'],
            '┌': ['up', 'left'],
            '┐': ['up', 'right'],
            '└': ['down', 'left'],
            '┘': ['down', 'right'],
            '┬': ['left', 'right', 'down'],
            '┴': ['left', 'right', 'up'],
            '├': ['up', 'down', 'right'],
            '┤': ['up', 'down', 'left'],
            '⚪': ['left', 'right', 'up', 'down'],
            '🚉': ['left', 'right', 'up', 'down'],
            '🟢': ['left', 'right', 'up', 'down']
        };
        
        return connections[trackType] || [];
    }

    /**
     * 计算下一个位置（修正版）
     * 正确的逻辑：
     * 1. 火车在 (x, y)，方向 D
     * 2. 检查当前轨道是否允许向 D 方向移动
     * 3. 计算下一个位置
     * 4. 检查下一个位置是否有轨道
     * 5. 检查下一个轨道是否允许从 opposite(D) 方向进入
     * 6. 计算新的方向
     * 
     * @param {Object} trackSystem - 轨道系统
     * @param {Object} switches - 道岔状态
     * @returns {Object|null}
     */
    calculateNextPosition(trackSystem, switches = {}) {
        // 1. 获取当前轨道
        if (!trackSystem || !trackSystem.getTrack) {
            return null;
        }
        
        const currentTrack = trackSystem.getTrack(this.x, this.y);
        if (!currentTrack || currentTrack.type === ' ') {
            return null;
        }
        
        // 2. 检查当前轨道是否允许向当前方向移动
        const currentConnections = this.getTrackConnections(currentTrack.type);
        if (!currentConnections.includes(this.direction)) {
            // 当前轨道不允许向这个方向移动
            return null;
        }
        
        // 3. 计算下一个位置
        const offset = this.getDirectionOffset(this.direction);
        const nextX = this.x + offset.x;
        const nextY = this.y + offset.y;
        
        // 4. 检查下一个位置是否有轨道
        const nextTrack = trackSystem.getTrack(nextX, nextY);
        if (!nextTrack || nextTrack.type === ' ') {
            return null;
        }
        
        // 5. 检查下一个轨道是否允许从进入方向进入
        // 进入方向是当前方向的相反方向
        const enterDirection = this.getOppositeDirection(this.direction);
        const nextConnections = this.getTrackConnections(nextTrack.type);
        
        if (!nextConnections.includes(enterDirection)) {
            // 下一个轨道不允许从这个方向进入
            return null;
        }
        
        // 6. 计算新的方向（从下一个轨道的连接中，根据进入方向查找出口方向）
        const newDirection = this.calculateNewDirection(
            currentTrack.type,
            nextTrack.type,
            this.direction,
            enterDirection,
            switches,
            nextX,
            nextY
        );
        
        if (!newDirection) {
            return null;
        }
        
        return {
            x: nextX,
            y: nextY,
            direction: newDirection
        };
    }

    /**
     * 计算新的方向
     * @param {string} currentTrackType - 当前轨道类型
     * @param {string} nextTrackType - 下一个轨道类型
     * @param {string} currentDirection - 当前方向
     * @param {string} enterDirection - 进入下一个轨道的方向
     * @param {Object} switches - 道岔状态
     * @param {number} nextX - 下一个位置X
     * @param {number} nextY - 下一个位置Y
     * @returns {string|null}
     */
    calculateNewDirection(currentTrackType, nextTrackType, currentDirection, enterDirection, switches, nextX, nextY) {
        // 首先检查当前轨道是否是道岔
        // 如果当前轨道是道岔，需要根据道岔状态决定方向
        const isCurrentSwitch = this.isSwitchTrack(currentTrackType);
        
        if (isCurrentSwitch) {
            return this.calculateSwitchDirection(
                currentTrackType,
                currentDirection,
                switches,
                this.x,
                this.y
            );
        }
        
        // 对于直轨，保持当前方向
        if (currentTrackType === '─' && (currentDirection === 'left' || currentDirection === 'right')) {
            return currentDirection;
        }
        if (currentTrackType === '│' && (currentDirection === 'up' || currentDirection === 'down')) {
            return currentDirection;
        }
        
        // 对于信号灯、站台、入口，保持当前方向
        if (currentTrackType === '⚪' || currentTrackType === '🚉' || currentTrackType === '🟢') {
            return currentDirection;
        }
        
        // 对于弯轨，根据弯轨类型计算新方向
        return this.calculateCurveDirection(currentTrackType, currentDirection);
    }

    /**
     * 检查轨道类型是否是道岔
     * @param {string} trackType - 轨道类型
     * @returns {boolean}
     */
    isSwitchTrack(trackType) {
        return trackType === '┬' || trackType === '┴' || 
               trackType === '├' || trackType === '┤';
    }

    /**
     * 计算道岔处的新方向
     * @param {string} switchType - 道岔类型
     * @param {string} currentDirection - 当前方向
     * @param {Object} switches - 道岔状态
     * @param {number} x - 道岔X坐标
     * @param {number} y - 道岔Y坐标
     * @returns {string|null}
     */
    calculateSwitchDirection(switchType, currentDirection, switches, x, y) {
        const switchState = switches[`${x},${y}`] || 0;
        
        // 道岔连接映射
        // 状态 0 = 直行（水平或垂直）
        // 状态 1 = 转弯
        
        const switchConnections = {
            // '┬'：水平直轨 + 向下分支
            // 状态 0：水平通行（left ↔ right）
            // 状态 1：左-下通行（left ↔ down）或 右-下通行（right ↔ down）
            '┬': {
                // 从左边进入
                'left': {
                    0: 'right',   // 状态 0：继续向右
                    1: 'down'     // 状态 1：向下转弯
                },
                // 从右边进入
                'right': {
                    0: 'left',    // 状态 0：继续向左
                    1: 'down'     // 状态 1：向下转弯
                },
                // 从下边进入
                'down': {
                    0: 'left',    // 状态 0：向左
                    1: 'right'    // 状态 1：向右
                }
            },
            
            // '┴'：水平直轨 + 向上分支
            '┴': {
                'left': {
                    0: 'right',
                    1: 'up'
                },
                'right': {
                    0: 'left',
                    1: 'up'
                },
                'up': {
                    0: 'left',
                    1: 'right'
                }
            },
            
            // '├'：垂直直轨 + 向右分支
            '├': {
                'up': {
                    0: 'down',
                    1: 'right'
                },
                'down': {
                    0: 'up',
                    1: 'right'
                },
                'right': {
                    0: 'up',
                    1: 'down'
                }
            },
            
            // '┤'：垂直直轨 + 向左分支
            '┤': {
                'up': {
                    0: 'down',
                    1: 'left'
                },
                'down': {
                    0: 'up',
                    1: 'left'
                },
                'left': {
                    0: 'up',
                    1: 'down'
                }
            }
        };
        
        const connections = switchConnections[switchType];
        if (!connections) {
            return null;
        }
        
        // 进入方向是当前方向的相反方向
        const enterDirection = this.getOppositeDirection(currentDirection);
        
        const directionMap = connections[enterDirection];
        if (!directionMap) {
            return null;
        }
        
        const newDirection = directionMap[switchState];
        return newDirection || null;
    }

    /**
     * 计算弯轨处的新方向
     * @param {string} curveType - 弯轨类型
     * @param {string} currentDirection - 当前方向
     * @returns {string|null}
     */
    calculateCurveDirection(curveType, currentDirection) {
        // 进入方向是当前方向的相反方向
        const enterDirection = this.getOppositeDirection(currentDirection);
        
        // 弯轨连接映射
        const curveConnections = {
            // '┌'：左上弯轨 - 连接 up 和 left
            '┌': {
                'up': 'left',    // 从上方进入，从左方出去
                'left': 'up'     // 从左方进入，从上方出去
            },
            
            // '┐'：右上弯轨 - 连接 up 和 right
            '┐': {
                'up': 'right',
                'right': 'up'
            },
            
            // '└'：左下弯轨 - 连接 down 和 left
            '└': {
                'down': 'left',
                'left': 'down'
            },
            
            // '┘'：右下弯轨 - 连接 down 和 right
            '┘': {
                'down': 'right',
                'right': 'down'
            }
        };
        
        const connections = curveConnections[curveType];
        if (!connections) {
            return null;
        }
        
        return connections[enterDirection] || null;
    }

    /**
     * 获取相反方向
     * @param {string} direction - 方向
     * @returns {string}
     */
    getOppositeDirection(direction) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        return opposites[direction];
    }

    /**
     * 检查信号灯
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} signals - 信号灯状态
     * @returns {boolean} 是否需要等待
     */
    checkSignal(x, y, signals) {
        const signalKey = `${x},${y}`;
        const signal = signals[signalKey];
        
        // 红灯等待
        return signal && signal.isRed;
    }

    /**
     * 更新车厢位置
     */
    updateCars() {
        // 最后一节车厢的位置
        let lastCarX = this.previousX;
        let lastCarY = this.previousY;
        
        // 从后往前更新车厢位置
        for (let i = this.cars.length - 1; i >= 0; i--) {
            const car = this.cars[i];
            const tempX = car.x;
            const tempY = car.y;
            
            car.x = lastCarX;
            car.y = lastCarY;
            
            lastCarX = tempX;
            lastCarY = tempY;
        }
    }

    /**
     * 更新动画位置
     * @param {number} deltaTime - 时间增量
     */
    updateAnimation(deltaTime) {
        const animationSpeed = 5.0;
        
        // 平滑移动车头
        const targetX = this.x + this.getDirectionOffset(this.direction).x * this.moveProgress;
        const targetY = this.y + this.getDirectionOffset(this.direction).y * this.moveProgress;
        
        this.animX += (targetX - this.animX) * animationSpeed * deltaTime;
        this.animY += (targetY - this.animY) * animationSpeed * deltaTime;
        
        // 平滑移动车厢
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            const nextCar = this.cars[i - 1] || { x: this.x, y: this.y };
            
            const carTargetX = nextCar.x - this.getDirectionOffset(this.direction).x * (i + 1) + 
                              this.getDirectionOffset(this.direction).x * this.moveProgress;
            const carTargetY = nextCar.y - this.getDirectionOffset(this.direction).y * (i + 1) + 
                              this.getDirectionOffset(this.direction).y * this.moveProgress;
            
            car.animX += (carTargetX - car.animX) * animationSpeed * deltaTime;
            car.animY += (carTargetY - car.animY) * animationSpeed * deltaTime;
        }
    }

    /**
     * 开始移动
     */
    start() {
        if (this.status === TrainStatus.WAITING) {
            this.status = TrainStatus.MOVING;
            this.waitReason = null;
        }
    }

    /**
     * 停止移动
     * @param {string} reason - 停止原因
     */
    stop(reason = null) {
        this.status = TrainStatus.WAITING;
        this.waitReason = reason;
    }

    /**
     * 标记到达
     */
    arrive() {
        this.status = TrainStatus.ARRIVED;
    }

    /**
     * 标记相撞
     */
    crash() {
        this.status = TrainStatus.CRASHED;
    }

    /**
     * 检查是否与另一列火车相撞
     * @param {Train} otherTrain - 另一列火车
     * @returns {boolean}
     */
    checkCollision(otherTrain) {
        // 检查车头位置
        if (Math.abs(this.x - otherTrain.x) < 0.5 && Math.abs(this.y - otherTrain.y) < 0.5) {
            return true;
        }
        
        // 检查车厢位置
        for (const car of this.cars) {
            if (Math.abs(car.x - otherTrain.x) < 0.5 && Math.abs(car.y - otherTrain.y) < 0.5) {
                return true;
            }
            
            for (const otherCar of otherTrain.cars) {
                if (Math.abs(car.x - otherCar.x) < 0.5 && Math.abs(car.y - otherCar.y) < 0.5) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 检查是否在站台位置
     * @param {Object} platform - 站台信息
     * @returns {boolean}
     */
    checkArrival(platform) {
        if (!platform) {
            return false;
        }
        
        return this.x === platform.x && this.y === platform.y;
    }

    /**
     * 获取火车的所有占据位置
     * @returns {Array}
     */
    getOccupiedPositions() {
        const positions = [
            { x: this.x, y: this.y }
        ];
        
        for (const car of this.cars) {
            positions.push({ x: car.x, y: car.y });
        }
        
        return positions;
    }

    /**
     * 序列化火车状态
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            previousX: this.previousX,
            previousY: this.previousY,
            direction: this.direction,
            speed: this.speed,
            moveProgress: this.moveProgress,
            length: this.length,
            status: this.status,
            targetPlatform: this.targetPlatform,
            path: this.path,
            currentPathIndex: this.currentPathIndex,
            waitReason: this.waitReason,
            cars: this.cars.map(car => ({
                x: car.x,
                y: car.y
            }))
        };
    }

    /**
     * 从序列化数据恢复火车
     * @param {Object} data - 序列化数据
     * @returns {Train}
     */
    static deserialize(data) {
        const train = new Train({
            id: data.id,
            type: data.type,
            x: data.x,
            y: data.y,
            direction: data.direction,
            length: data.length,
            status: data.status,
            targetPlatform: data.targetPlatform
        });
        
        train.previousX = data.previousX;
        train.previousY = data.previousY;
        train.speed = data.speed;
        train.moveProgress = data.moveProgress;
        train.path = data.path || [];
        train.currentPathIndex = data.currentPathIndex || 0;
        train.waitReason = data.waitReason;
        
        if (data.cars) {
            train.cars = data.cars.map(car => ({
                x: car.x,
                y: car.y,
                animX: car.x,
                animY: car.y
            }));
        }
        
        return train;
    }
}

export { Train, TrainType, TrainStatus };
