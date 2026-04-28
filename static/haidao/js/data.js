// 游戏数据和配置

const GameData = {
    // 转盘配置
    wheel: {
        segments: [
            {
                id: 'attack',
                name: '普通攻击',
                icon: '⚔️',
                color: '#FF6B6B',
                description: '对目标造成 15 伤害',
                damage: 15,
                probability: 20,
                weight: 20
            },
            {
                id: 'critical',
                name: '暴击攻击',
                icon: '💥',
                color: '#FF8E53',
                description: '造成 30 伤害',
                damage: 30,
                probability: 10,
                weight: 10
            },
            {
                id: 'gold',
                name: '掠夺金币',
                icon: '💰',
                color: '#FFD700',
                description: '获得 20 金币',
                gold: 20,
                probability: 15,
                weight: 15
            },
            {
                id: 'heal',
                name: '恢复',
                icon: '❤️',
                color: '#A8E6CF',
                description: '回复 15 生命',
                heal: 15,
                probability: 15,
                weight: 15
            },
            {
                id: 'defense',
                name: '防御',
                icon: '🛡️',
                color: '#6B73FF',
                description: '下次受伤减半',
                defenseReduction: 0.5,
                probability: 10,
                weight: 10
            },
            {
                id: 'treasure',
                name: '宝藏',
                icon: '👑',
                color: '#9B59B6',
                description: '获得 50 金币',
                gold: 50,
                probability: 5,
                weight: 5
            },
            {
                id: 'doom',
                name: '厄运',
                icon: '💀',
                color: '#95A5A6',
                description: '自己损失 10 生命',
                damage: 10,
                probability: 15,
                weight: 15
            },
            {
                id: 'spin',
                name: '再来一次',
                icon: '🌀',
                color: '#3498DB',
                description: '额外多转一次',
                probability: 10,
                weight: 10
            }
        ]
    },

    // 角色配置
    characters: {
        player: {
            id: 'player',
            name: '海盗船长',
            icon: '🏴‍☠️',
            maxHp: 100,
            baseAttack: 15,
            baseGold: 50,
            type: 'player',
            aiType: null,
            panelId: 'player-panel',
            hpId: 'player-hp',
            goldId: 'player-gold',
            healthBarId: 'player-health-bar',
            defenseStatusId: 'player-defense-status'
        },
        enemy1: {
            id: 'enemy1',
            name: '红胡子',
            icon: '🔴',
            maxHp: 80,
            baseAttack: 12,
            baseGold: 30,
            type: 'enemy',
            aiType: 'aggressive',
            description: '攻击倾向高',
            panelId: 'enemy1-panel',
            hpId: 'enemy1-hp',
            goldId: 'enemy1-gold',
            healthBarId: 'enemy1-health-bar',
            defenseStatusId: 'enemy1-defense-status'
        },
        enemy2: {
            id: 'enemy2',
            name: '黑珍珠',
            icon: '⚫',
            maxHp: 90,
            baseAttack: 10,
            baseGold: 40,
            type: 'enemy',
            aiType: 'defensive',
            description: '防御倾向高',
            panelId: 'enemy2-panel',
            hpId: 'enemy2-hp',
            goldId: 'enemy2-gold',
            healthBarId: 'enemy2-health-bar',
            defenseStatusId: 'enemy2-defense-status'
        },
        enemy3: {
            id: 'enemy3',
            name: '独眼杰克',
            icon: '👁️',
            maxHp: 70,
            baseAttack: 15,
            baseGold: 20,
            type: 'enemy',
            aiType: 'critical',
            description: '暴击倾向高',
            panelId: 'enemy3-panel',
            hpId: 'enemy3-hp',
            goldId: 'enemy3-gold',
            healthBarId: 'enemy3-health-bar',
            defenseStatusId: 'enemy3-defense-status'
        }
    },

    // AI 类型配置
    aiTypes: {
        aggressive: {
            name: '攻击型',
            description: '攻击倾向高',
            weights: {
                attack: 30,
                critical: 20,
                gold: 10,
                heal: 10,
                defense: 10,
                treasure: 5,
                doom: 10,
                spin: 5
            }
        },
        defensive: {
            name: '防御型',
            description: '防御倾向高',
            weights: {
                attack: 15,
                critical: 10,
                gold: 10,
                heal: 20,
                defense: 25,
                treasure: 5,
                doom: 10,
                spin: 5
            }
        },
        critical: {
            name: '暴击型',
            description: '暴击倾向高',
            weights: {
                attack: 20,
                critical: 30,
                gold: 10,
                heal: 10,
                defense: 10,
                treasure: 5,
                doom: 10,
                spin: 5
            }
        }
    },

    // 商店物品配置
    shop: {
        items: [
            {
                id: 'forceAttack',
                name: '强制攻击',
                icon: '⚔️',
                cost: 30,
                description: '直接对生命值最低的敌人造成 15 伤害',
                buttonId: 'buy-attack',
                effect: {
                    type: 'attack',
                    damage: 15,
                    target: 'lowestHp'
                }
            },
            {
                id: 'shield',
                name: '护盾',
                icon: '🛡️',
                cost: 25,
                description: '获得防御状态，下次受伤减半',
                buttonId: 'buy-shield',
                effect: {
                    type: 'defense',
                    duration: 1
                }
            },
            {
                id: 'potion',
                name: '大药水',
                icon: '❤️',
                cost: 20,
                description: '恢复 30 生命值',
                buttonId: 'buy-potion',
                effect: {
                    type: 'heal',
                    amount: 30
                }
            }
        ]
    },

    // 游戏规则配置
    rules: {
        // 玩家生命值 ≤ 30 时，电脑攻击玩家概率提升到 70%
        lowHpAttackProbability: 0.7,
        lowHpThreshold: 30,
        
        // 战斗记录显示条数
        maxLogEntries: 8,
        
        // 转盘动画时间（毫秒）
        spinDuration: 3000,
        
        // 回合延迟时间（毫秒）
        turnDelay: 1000,
        
        // 攻击动画时间（毫秒）
        attackAnimationDuration: 500,
        
        // 伤害动画时间（毫秒）
        damageAnimationDuration: 300
    },

    // 存储键名
    storageKeys: {
        gameState: 'haidao_game_state',
        bestScore: 'haidao_best_score',
        totalGames: 'haidao_total_games',
        wins: 'haidao_wins'
    },

    // 初始游戏状态
    initialGameState: {
        isStarted: false,
        isPaused: false,
        isGameOver: false,
        winner: null,
        currentTurn: 'player',
        turnCount: 0,
        extraSpins: 0,
        logs: [],
        hasPendingSpin: false,
        pendingTargetRotation: 0,
        pendingResultId: null,
        pendingCharacterId: null
    },

    // 初始角色状态
    initialCharacterState: {
        hp: 0,
        maxHp: 0,
        gold: 0,
        baseAttack: 0,
        isDefending: false,
        isDead: false
    }
};

// 导出数据（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameData;
}
