/**
 * 关卡系统模块
 * 定义游戏的各个关卡数据
 */

import { TrainType } from './train.js';

// 关卡数据定义
const Levels = [
    // 关卡1：简单入门
    {
        id: 1,
        name: '新手训练',
        description: '学习基本的火车调度',
        mapWidth: 12,
        mapHeight: 8,
        
        // 轨道地图定义
        // 符号说明：
        // ─ │ 直轨
        // ┌ ┐ └ ┘ 弯轨
        // ┬ ┴ ├ ┤ 道岔
        // ⚪ 信号灯
        // 🚉 站台
        // 🟢 入口
        // 空格 无轨道
        trackMap: [
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['🟢', '─', '─', '─', '┬', '─', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', '└', '─', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
        ],
        
        // 火车配置
        trains: [
            {
                id: 'train_1',
                type: TrainType.FREIGHT,
                startX: 0,
                startY: 1,
                direction: 'right',
                targetPlatform: { x: 10, y: 1 }
            }
        ],
        
        // 道岔配置
        switches: [
            {
                id: 'switch_1',
                x: 4,
                y: 1,
                type: '┬',
                state: 0  // 0=向左, 1=向右 (实际是向上/向下)
            }
        ],
        
        // 信号灯配置
        signals: [],
        
        // 站台配置
        platforms: [
            { id: 1, x: 10, y: 1 },
            { id: 2, x: 10, y: 5 }
        ],
        
        // 入口配置
        entrances: [
            { id: 1, x: 0, y: 1 }
        ]
    },
    
    // 关卡2：两道岔
    {
        id: 2,
        name: '双轨挑战',
        description: '管理两列火车的调度',
        mapWidth: 14,
        mapHeight: 10,
        
        trackMap: [
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['🟢', '─', '─', '┬', '─', '─', '─', '─', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['🟢', '─', '─', '┴', '─', '─', '┬', '─', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', '└', '─', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
        ],
        
        trains: [
            {
                id: 'train_1',
                type: TrainType.FREIGHT,
                startX: 0,
                startY: 1,
                direction: 'right',
                targetPlatform: { x: 12, y: 1 }
            },
            {
                id: 'train_2',
                type: TrainType.SUBWAY,
                startX: 0,
                startY: 4,
                direction: 'right',
                targetPlatform: { x: 12, y: 7 },
                delay: 2  // 延迟2秒出发
            }
        ],
        
        switches: [
            { id: 'switch_1', x: 3, y: 1, type: '┬', state: 0 },
            { id: 'switch_2', x: 3, y: 4, type: '┴', state: 1 },
            { id: 'switch_3', x: 6, y: 4, type: '┬', state: 0 }
        ],
        
        signals: [
            { id: 'signal_1', x: 3, y: 1, isRed: false },
            { id: 'signal_2', x: 6, y: 4, isRed: false }
        ],
        
        platforms: [
            { id: 1, x: 12, y: 1 },
            { id: 2, x: 12, y: 4 },
            { id: 3, x: 12, y: 7 }
        ],
        
        entrances: [
            { id: 1, x: 0, y: 1 },
            { id: 2, x: 0, y: 4 }
        ]
    },
    
    // 关卡3：信号灯控制
    {
        id: 3,
        name: '信号灯控制',
        description: '使用信号灯控制火车通行',
        mapWidth: 14,
        mapHeight: 10,
        
        trackMap: [
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['🟢', '─', '─', '─', '⚪', '─', '─', '┬', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' '],
            ['🟢', '─', '─', '─', '⚪', '─', '─', '┴', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
        ],
        
        trains: [
            {
                id: 'train_1',
                type: TrainType.HIGH_SPEED,
                startX: 0,
                startY: 1,
                direction: 'right',
                targetPlatform: { x: 12, y: 1 }
            },
            {
                id: 'train_2',
                type: TrainType.FREIGHT,
                startX: 0,
                startY: 4,
                direction: 'right',
                targetPlatform: { x: 12, y: 4 },
                delay: 1
            }
        ],
        
        switches: [
            { id: 'switch_1', x: 7, y: 1, type: '┬', state: 0 },
            { id: 'switch_2', x: 7, y: 4, type: '┴', state: 1 }
        ],
        
        signals: [
            { id: 'signal_1', x: 4, y: 1, isRed: false },
            { id: 'signal_2', x: 4, y: 4, isRed: true }
        ],
        
        platforms: [
            { id: 1, x: 12, y: 1 },
            { id: 2, x: 12, y: 4 }
        ],
        
        entrances: [
            { id: 1, x: 0, y: 1 },
            { id: 2, x: 0, y: 4 }
        ]
    },
    
    // 关卡4：复杂调度
    {
        id: 4,
        name: '复杂调度',
        description: '管理多列火车的复杂调度',
        mapWidth: 16,
        mapHeight: 12,
        
        trackMap: [
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['🟢', '─', '─', '┬', '─', '─', '─', '⚪', '─', '─', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', '│', ' ', ' ', ' ', '┬', '─', '─', '─', '─', '─', '─', '🚉', ' '],
            ['🟢', '─', '─', '┴', '─', '─', '─', '┤', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['🟢', '─', '─', '─', '─', '─', '─', '┴', '─', '─', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
        ],
        
        trains: [
            {
                id: 'train_1',
                type: TrainType.HIGH_SPEED,
                startX: 0,
                startY: 1,
                direction: 'right',
                targetPlatform: { x: 14, y: 3 }
            },
            {
                id: 'train_2',
                type: TrainType.FREIGHT,
                startX: 0,
                startY: 4,
                direction: 'right',
                targetPlatform: { x: 14, y: 1 },
                delay: 2
            },
            {
                id: 'train_3',
                type: TrainType.SUBWAY,
                startX: 0,
                startY: 7,
                direction: 'right',
                targetPlatform: { x: 14, y: 7 },
                delay: 4
            }
        ],
        
        switches: [
            { id: 'switch_1', x: 3, y: 1, type: '┬', state: 1 },
            { id: 'switch_2', x: 3, y: 4, type: '┴', state: 0 },
            { id: 'switch_3', x: 7, y: 3, type: '┬', state: 0 },
            { id: 'switch_4', x: 7, y: 4, type: '┤', state: 0 },
            { id: 'switch_5', x: 7, y: 7, type: '┴', state: 1 }
        ],
        
        signals: [
            { id: 'signal_1', x: 7, y: 1, isRed: false }
        ],
        
        platforms: [
            { id: 1, x: 14, y: 1 },
            { id: 2, x: 14, y: 3 },
            { id: 3, x: 14, y: 7 }
        ],
        
        entrances: [
            { id: 1, x: 0, y: 1 },
            { id: 2, x: 0, y: 4 },
            { id: 3, x: 0, y: 7 }
        ]
    },
    
    // 关卡5：终极挑战
    {
        id: 5,
        name: '终极挑战',
        description: '成为真正的火车调度大师',
        mapWidth: 18,
        mapHeight: 14,
        
        trackMap: [
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['🟢', '─', '─', '┬', '─', '─', '─', '⚪', '─', '─', '┬', '─', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', '│', ' ', ' ', ' ', '┬', '─', '─', '┤', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['🟢', '─', '─', '┴', '─', '─', '─', '┤', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', '│', ' ', ' ', '│', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', '│', ' ', ' ', '┴', '─', '─', '─', '─', '─', '🚉', ' '],
            ['🟢', '─', '─', '─', '─', '─', '─', '┴', '─', '─', '─', '⚪', '─', '─', '─', '─', '🚉', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
        ],
        
        trains: [
            {
                id: 'train_1',
                type: TrainType.HIGH_SPEED,
                startX: 0,
                startY: 1,
                direction: 'right',
                targetPlatform: { x: 16, y: 3 }
            },
            {
                id: 'train_2',
                type: TrainType.FREIGHT,
                startX: 0,
                startY: 4,
                direction: 'right',
                targetPlatform: { x: 16, y: 1 },
                delay: 2
            },
            {
                id: 'train_3',
                type: TrainType.SUBWAY,
                startX: 0,
                startY: 7,
                direction: 'right',
                targetPlatform: { x: 16, y: 6 },
                delay: 4
            },
            {
                id: 'train_4',
                type: TrainType.HIGH_SPEED,
                startX: 0,
                startY: 1,
                direction: 'right',
                targetPlatform: { x: 16, y: 7 },
                delay: 6
            }
        ],
        
        switches: [
            { id: 'switch_1', x: 3, y: 1, type: '┬', state: 1 },
            { id: 'switch_2', x: 3, y: 4, type: '┴', state: 0 },
            { id: 'switch_3', x: 7, y: 3, type: '┬', state: 0 },
            { id: 'switch_4', x: 7, y: 4, type: '┤', state: 0 },
            { id: 'switch_5', x: 7, y: 7, type: '┴', state: 1 },
            { id: 'switch_6', x: 10, y: 1, type: '┬', state: 1 },
            { id: 'switch_7', x: 10, y: 3, type: '┤', state: 0 },
            { id: 'switch_8', x: 10, y: 6, type: '┴', state: 0 }
        ],
        
        signals: [
            { id: 'signal_1', x: 7, y: 1, isRed: false },
            { id: 'signal_2', x: 11, y: 7, isRed: false }
        ],
        
        platforms: [
            { id: 1, x: 16, y: 1 },
            { id: 2, x: 16, y: 3 },
            { id: 3, x: 16, y: 6 },
            { id: 4, x: 16, y: 7 }
        ],
        
        entrances: [
            { id: 1, x: 0, y: 1 },
            { id: 2, x: 0, y: 4 },
            { id: 3, x: 0, y: 7 }
        ]
    }
];

/**
 * LevelManager类 - 关卡管理器
 */
class LevelManager {
    /**
     * 构造函数
     */
    constructor() {
        this.currentLevelIndex = 0;
        this.maxLevel = Levels.length;
    }

    /**
     * 获取关卡数据
     * @param {number} levelId - 关卡ID
     * @returns {Object|null} 关卡数据
     */
    getLevel(levelId) {
        return Levels.find(level => level.id === levelId) || null;
    }

    /**
     * 获取当前关卡数据
     * @returns {Object}
     */
    getCurrentLevel() {
        return Levels[this.currentLevelIndex] || Levels[0];
    }

    /**
     * 设置当前关卡
     * @param {number} levelId - 关卡ID
     * @returns {boolean} 是否成功
     */
    setCurrentLevel(levelId) {
        const index = Levels.findIndex(level => level.id === levelId);
        if (index !== -1) {
            this.currentLevelIndex = index;
            return true;
        }
        return false;
    }

    /**
     * 下一关
     * @returns {boolean} 是否有下一关
     */
    nextLevel() {
        if (this.currentLevelIndex < Levels.length - 1) {
            this.currentLevelIndex++;
            return true;
        }
        return false;
    }

    /**
     * 上一关
     * @returns {boolean} 是否有上一关
     */
    previousLevel() {
        if (this.currentLevelIndex > 0) {
            this.currentLevelIndex--;
            return true;
        }
        return false;
    }

    /**
     * 获取所有关卡
     * @returns {Array}
     */
    getAllLevels() {
        return [...Levels];
    }

    /**
     * 获取关卡数量
     * @returns {number}
     */
    getLevelCount() {
        return Levels.length;
    }

    /**
     * 检查是否是最后一关
     * @returns {boolean}
     */
    isLastLevel() {
        return this.currentLevelIndex >= Levels.length - 1;
    }

    /**
     * 解析轨道地图
     * @param {Array} trackMap - 轨道地图数组
     * @returns {Array} 解析后的轨道地图
     */
    parseTrackMap(trackMap) {
        const parsedMap = [];
        
        for (let y = 0; y < trackMap.length; y++) {
            const row = [];
            const mapRow = trackMap[y];
            
            for (let x = 0; x < mapRow.length; x++) {
                const type = mapRow[x];
                row.push({
                    x: x,
                    y: y,
                    type: type
                });
            }
            
            parsedMap.push(row);
        }
        
        return parsedMap;
    }
}

export { Levels, LevelManager };
