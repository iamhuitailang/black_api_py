/**
 * 碰撞检测模块
 * 检测火车之间的碰撞
 */

// 碰撞类型枚举
const CollisionType = {
    NONE: 'none',                // 无碰撞
    HEAD_ON: 'head_on',           // 正面碰撞
    REAR_END: 'rear_end',         // 追尾碰撞
    SIDE: 'side',                 // 侧面碰撞
    DERAIL: 'derail'              // 脱轨
};

/**
 * CollisionDetector类 - 碰撞检测器
 */
class CollisionDetector {
    /**
     * 构造函数
     */
    constructor() {
        this.lastCollision = null;
    }

    /**
     * 检测所有火车之间的碰撞
     * @param {Array} trains - 火车数组
     * @param {Object} trackSystem - 轨道系统
     * @returns {Object|null} 碰撞信息，如果没有碰撞则返回null
     */
    detectAll(trains, trackSystem) {
        // 检查每一对火车
        for (let i = 0; i < trains.length; i++) {
            const trainA = trains[i];
            
            // 跳过已到达或已相撞的火车
            if (trainA.status === 'arrived' || trainA.status === 'crashed') {
                continue;
            }
            
            // 检查脱轨
            const derailInfo = this.checkDerail(trainA, trackSystem);
            if (derailInfo) {
                return derailInfo;
            }
            
            // 检查与其他火车的碰撞
            for (let j = i + 1; j < trains.length; j++) {
                const trainB = trains[j];
                
                // 跳过已到达或已相撞的火车
                if (trainB.status === 'arrived' || trainB.status === 'crashed') {
                    continue;
                }
                
                const collision = this.detectPair(trainA, trainB);
                if (collision) {
                    this.lastCollision = collision;
                    return collision;
                }
            }
        }
        
        return null;
    }

    /**
     * 检测两列火车之间的碰撞
     * @param {Object} trainA - 火车A
     * @param {Object} trainB - 火车B
     * @returns {Object|null} 碰撞信息
     */
    detectPair(trainA, trainB) {
        // 获取两列火车的所有占据位置
        const positionsA = trainA.getOccupiedPositions ? 
            trainA.getOccupiedPositions() : 
            this.getTrainPositions(trainA);
        const positionsB = trainB.getOccupiedPositions ? 
            trainB.getOccupiedPositions() : 
            this.getTrainPositions(trainB);
        
        // 检查位置重叠
        for (const posA of positionsA) {
            for (const posB of positionsB) {
                if (this.positionsOverlap(posA, posB)) {
                    // 确定碰撞类型
                    const collisionType = this.determineCollisionType(
                        trainA, trainB, posA, posB
                    );
                    
                    return {
                        type: collisionType,
                        trainA: trainA,
                        trainB: trainB,
                        position: { x: posA.x, y: posA.y },
                        timestamp: Date.now()
                    };
                }
            }
        }
        
        return null;
    }

    /**
     * 获取火车的所有占据位置
     * @param {Object} train - 火车对象
     * @returns {Array}
     */
    getTrainPositions(train) {
        const positions = [
            { x: train.x, y: train.y }
        ];
        
        if (train.cars) {
            for (const car of train.cars) {
                positions.push({ x: car.x, y: car.y });
            }
        }
        
        return positions;
    }

    /**
     * 检查两个位置是否重叠
     * @param {Object} posA - 位置A
     * @param {Object} posB - 位置B
     * @returns {boolean}
     */
    positionsOverlap(posA, posB) {
        // 使用较小的容差来检测碰撞
        const tolerance = 0.3;
        return Math.abs(posA.x - posB.x) < tolerance && 
               Math.abs(posA.y - posB.y) < tolerance;
    }

    /**
     * 确定碰撞类型
     * @param {Object} trainA - 火车A
     * @param {Object} trainB - 火车B
     * @param {Object} posA - 碰撞位置A
     * @param {Object} posB - 碰撞位置B
     * @returns {string} 碰撞类型
     */
    determineCollisionType(trainA, trainB, posA, posB) {
        // 检查是否是车头与车头碰撞（正面碰撞）
        const isHeadA = Math.abs(posA.x - trainA.x) < 0.1 && Math.abs(posA.y - trainA.y) < 0.1;
        const isHeadB = Math.abs(posB.x - trainB.x) < 0.1 && Math.abs(posB.y - trainB.y) < 0.1;
        
        if (isHeadA && isHeadB) {
            // 检查方向是否相对
            if (this.areDirectionsOpposite(trainA.direction, trainB.direction)) {
                return CollisionType.HEAD_ON;
            }
        }
        
        // 检查是否是追尾
        if (isHeadA || isHeadB) {
            const headTrain = isHeadA ? trainA : trainB;
            const otherTrain = isHeadA ? trainB : trainA;
            
            // 检查后车速度是否大于前车
            if (headTrain.speed > otherTrain.speed) {
                return CollisionType.REAR_END;
            }
        }
        
        // 默认是侧面碰撞
        return CollisionType.SIDE;
    }

    /**
     * 检查两个方向是否相反
     * @param {string} dirA - 方向A
     * @param {string} dirB - 方向B
     * @returns {boolean}
     */
    areDirectionsOpposite(dirA, dirB) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        return opposites[dirA] === dirB;
    }

    /**
     * 检查火车是否脱轨
     * @param {Object} train - 火车对象
     * @param {Object} trackSystem - 轨道系统
     * @returns {Object|null} 脱轨信息
     */
    checkDerail(train, trackSystem) {
        // 检查车头位置是否有轨道
        if (!trackSystem || !trackSystem.getTrack) {
            return null;
        }
        
        const track = trackSystem.getTrack(train.x, train.y);
        
        // 如果没有轨道或轨道为空，则脱轨
        if (!track || track.type === ' ') {
            return {
                type: CollisionType.DERAIL,
                train: train,
                position: { x: train.x, y: train.y },
                timestamp: Date.now()
            };
        }
        
        return null;
    }

    /**
     * 获取碰撞的描述信息
     * @param {Object} collision - 碰撞信息
     * @returns {string}
     */
    getCollisionDescription(collision) {
        if (!collision) {
            return '无碰撞';
        }
        
        const descriptions = {
            [CollisionType.NONE]: '无碰撞',
            [CollisionType.HEAD_ON]: '正面碰撞！两列火车迎面相撞',
            [CollisionType.REAR_END]: '追尾碰撞！后车速度过快撞上前车',
            [CollisionType.SIDE]: '侧面碰撞！两列火车在道岔处交汇',
            [CollisionType.DERAIL]: '脱轨！火车驶出了轨道'
        };
        
        return descriptions[collision.type] || '未知碰撞类型';
    }

    /**
     * 检查是否有碰撞风险（预测性检测）
     * @param {Array} trains - 火车数组
     * @param {number} stepsAhead - 预测步数
     * @returns {Array} 风险列表
     */
    predictCollisions(trains, stepsAhead = 3) {
        const risks = [];
        
        // 简单的预测：检查每对火车的距离
        for (let i = 0; i < trains.length; i++) {
            const trainA = trains[i];
            if (trainA.status === 'arrived' || trainA.status === 'crashed') {
                continue;
            }
            
            for (let j = i + 1; j < trains.length; j++) {
                const trainB = trains[j];
                if (trainB.status === 'arrived' || trainB.status === 'crashed') {
                    continue;
                }
                
                const distance = Math.sqrt(
                    Math.pow(trainA.x - trainB.x, 2) + 
                    Math.pow(trainA.y - trainB.y, 2)
                );
                
                // 如果距离小于预测步数，则有风险
                if (distance < stepsAhead) {
                    risks.push({
                        trainA: trainA,
                        trainB: trainB,
                        distance: distance,
                        riskLevel: distance < 2 ? 'high' : 'medium'
                    });
                }
            }
        }
        
        return risks;
    }
}

export { CollisionDetector, CollisionType };
