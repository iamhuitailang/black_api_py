const Levels = (function() {
    const levels = {
        1: {
            id: 1,
            name: '初级 · 魔术暗箱',
            description: '密闭木箱、暗格夹层',
            timeLimit: 240,
            background: '#2d1f14',
            accentColor: '#8b6914',
            objects: [
                {
                    id: 'wooden_box',
                    name: '密闭木箱',
                    x: 200,
                    y: 150,
                    width: 400,
                    height: 300,
                    type: 'interactive',
                    locked: false,
                    description: '一个古老的木质魔术箱，表面有精美的雕花。',
                    color: '#5c4a0a',
                    children: [
                        {
                            id: 'top_drawer',
                            name: '上层抽屉',
                            x: 50,
                            y: 40,
                            width: 300,
                            height: 60,
                            type: 'drawer',
                            locked: true,
                            requiredItem: null,
                            puzzle: 'drawer_puzzle_1',
                            color: '#8b6914'
                        },
                        {
                            id: 'middle_compartment',
                            name: '中间暗格',
                            x: 50,
                            y: 120,
                            width: 300,
                            height: 80,
                            type: 'compartment',
                            locked: true,
                            requiredItem: 'brassKey',
                            contains: ['passwordNote'],
                            color: '#6b5a14'
                        },
                        {
                            id: 'bottom_lock',
                            name: '数字密码锁',
                            x: 120,
                            y: 220,
                            width: 160,
                            height: 60,
                            type: 'lock',
                            locked: true,
                            puzzle: 'number_puzzle_1',
                            color: '#4a3728'
                        }
                    ]
                },
                {
                    id: 'hidden_clue_1',
                    name: '墙角暗纹',
                    x: 50,
                    y: 400,
                    width: 80,
                    height: 60,
                    type: 'clue',
                    hidden: true,
                    revealed: false,
                    hint: '仔细观察木箱的左下角...',
                    color: 'rgba(139, 105, 20, 0.3)',
                    content: '密码第一位是 3'
                },
                {
                    id: 'hidden_clue_2',
                    name: '天花板倒影',
                    x: 550,
                    y: 50,
                    width: 100,
                    height: 50,
                    type: 'clue',
                    hidden: true,
                    revealed: false,
                    hint: '抬头看看上方...',
                    color: 'rgba(139, 105, 20, 0.2)',
                    content: '密码第二位是 7，最后一位是 7'
                },
                {
                    id: 'hidden_clue_3',
                    name: '木箱刻痕',
                    x: 350,
                    y: 100,
                    width: 70,
                    height: 40,
                    type: 'clue',
                    hidden: true,
                    revealed: false,
                    hint: '仔细观察木箱顶部的刻痕...',
                    color: 'rgba(139, 105, 20, 0.25)',
                    content: '密码第三位是 4'
                },
                {
                    id: 'trap_spring',
                    name: '弹簧陷阱',
                    x: 480,
                    y: 380,
                    width: 70,
                    height: 50,
                    type: 'trap',
                    triggered: false,
                    timePenalty: 20,
                    color: '#8b0000',
                    message: '💥 触发了弹簧陷阱！扣除20秒！'
                },
                {
                    id: 'small_key_hidden',
                    name: '黄铜钥匙',
                    x: 500,
                    y: 200,
                    width: 40,
                    height: 30,
                    type: 'item',
                    itemId: 'brassKey',
                    hidden: false,
                    color: '#ffd700'
                },
                {
                    id: 'exit_door',
                    name: '出口大门',
                    x: 650,
                    y: 100,
                    width: 120,
                    height: 350,
                    type: 'exit',
                    locked: true,
                    requiredPuzzles: ['number_puzzle_1', 'drawer_puzzle_1'],
                    color: '#4a3728'
                }
            ],
            puzzles: {
                number_puzzle_1: {
                    type: 'number',
                    title: '木箱密码锁',
                    answer: [3, 7, 4, 7],
                    hint: '找到所有隐藏的线索，拼凑出完整的密码。',
                    unlocks: ['exit_door']
                },
                drawer_puzzle_1: {
                    type: 'drawer',
                    title: '抽屉机关',
                    sequence: [2, 0, 1, 3],
                    drawers: ['壹', '贰', '叁', '肆'],
                    hint: '按照魔术表演的顺序拉开抽屉：三、一、二、四',
                    reward: 'magicGear',
                    unlocks: []
                }
            },
            startMessage: '你被困在一个古老的魔术暗箱中...找到所有线索，在时间耗尽前逃脱！',
            victoryMessage: '恭喜！你成功打开了魔术暗箱！'
        },
        2: {
            id: 2,
            name: '中级 · 幻术镜屋',
            description: '镜面迷宫、光影魔术',
            timeLimit: 240,
            background: '#1a1a3e',
            accentColor: '#6366f1',
            objects: [
                {
                    id: 'mirror_maze',
                    name: '镜面迷宫',
                    x: 100,
                    y: 100,
                    width: 500,
                    height: 350,
                    type: 'area',
                    description: '四周都是镜子，让人分不清方向...',
                    color: '#2a2a5a'
                },
                {
                    id: 'light_puzzle_panel',
                    name: '光影控制台',
                    x: 150,
                    y: 150,
                    width: 150,
                    height: 100,
                    type: 'puzzle_trigger',
                    puzzle: 'light_puzzle_1',
                    color: '#4a4a8a',
                    description: '一个可以调节光线角度的控制台。'
                },
                {
                    id: 'pattern_puzzle_wall',
                    name: '镜像图案墙',
                    x: 400,
                    y: 150,
                    width: 180,
                    height: 150,
                    type: 'puzzle_trigger',
                    puzzle: 'pattern_puzzle_1',
                    locked: true,
                    requiredItem: 'mirrorCrystal',
                    color: '#5a5a9a',
                    description: '墙上有四个凹槽，似乎需要放入什么...'
                },
                {
                    id: 'crystal_pedestal',
                    name: '水晶台座',
                    x: 280,
                    y: 320,
                    width: 80,
                    height: 60,
                    type: 'item',
                    itemId: 'mirrorCrystal',
                    hidden: false,
                    color: '#a855f7'
                },
                {
                    id: 'lens_on_mirror',
                    name: '光影透镜',
                    x: 550,
                    y: 280,
                    width: 50,
                    height: 50,
                    type: 'item',
                    itemId: 'lightLens',
                    hidden: true,
                    revealCondition: 'light_puzzle_1_solved',
                    color: '#60a5fa'
                },
                {
                    id: 'hidden_clue_1',
                    name: '镜中残影',
                    x: 600,
                    y: 420,
                    width: 100,
                    height: 50,
                    type: 'clue',
                    hidden: true,
                    revealed: false,
                    hint: '仔细观察最右侧的镜子...',
                    color: 'rgba(99, 102, 241, 0.3)',
                    content: '图案顺序：🎩 🐇 🌹 ✨'
                },
                {
                    id: 'hidden_clue_2',
                    name: '地板密文',
                    x: 50,
                    y: 420,
                    width: 80,
                    height: 50,
                    type: 'clue',
                    hidden: true,
                    revealed: false,
                    hint: '低头看看脚下...',
                    color: 'rgba(99, 102, 241, 0.2)',
                    content: '光线角度调整到 60 度'
                },
                {
                    id: 'trap_reflection',
                    name: '镜像陷阱',
                    x: 320,
                    y: 200,
                    width: 60,
                    height: 60,
                    type: 'trap',
                    triggered: false,
                    timePenalty: 25,
                    color: '#7c3aed',
                    message: '🌀 被镜像幻象迷惑！扣除25秒！'
                },
                {
                    id: 'magic_card_hidden',
                    name: '魔术卡牌',
                    x: 180,
                    y: 380,
                    width: 45,
                    height: 60,
                    type: 'item',
                    itemId: 'magicCard',
                    hidden: true,
                    revealCondition: 'pattern_puzzle_1_solved',
                    color: '#f472b6'
                },
                {
                    id: 'mirror_exit',
                    name: '幻影之门',
                    x: 650,
                    y: 80,
                    width: 120,
                    height: 380,
                    type: 'exit',
                    locked: true,
                    requiredItem: 'lensGearCombo',
                    color: '#6366f1'
                }
            ],
            puzzles: {
                light_puzzle_1: {
                    type: 'light',
                    title: '光影调节',
                    targetAngle: 60,
                    hint: '找到地板上的密文，获取正确角度。',
                    unlocks: []
                },
                pattern_puzzle_1: {
                    type: 'pattern',
                    title: '镜像图案排序',
                    slots: 4,
                    patterns: ['🎩', '🐇', '🌹', '✨'],
                    answer: ['🎩', '🐇', '🌹', '✨'],
                    hint: '镜中残影显示了魔术表演的经典顺序...',
                    unlocks: []
                }
            },
            startMessage: '欢迎来到幻术镜屋...利用光影和镜像的力量找到出路！',
            victoryMessage: '你破解了镜屋的幻象！通往最终密室的大门已经打开！'
        },
        3: {
            id: 3,
            name: '高级 · 魔术师密室',
            description: '复古魔术台、机关牢笼',
            timeLimit: 240,
            background: '#1a0a1a',
            accentColor: '#ec4899',
            objects: [
                {
                    id: 'magic_stage',
                    name: '复古魔术台',
                    x: 150,
                    y: 200,
                    width: 500,
                    height: 250,
                    type: 'interactive',
                    description: '魔术师曾经表演的舞台，上面布满了机关。',
                    color: '#4a1a3a',
                    children: [
                        {
                            id: 'stage_lock',
                            name: '舞台机关锁',
                            x: 180,
                            y: 80,
                            width: 140,
                            height: 70,
                            type: 'lock',
                            locked: true,
                            puzzle: 'final_number_puzzle',
                            color: '#6b2a5a'
                        },
                        {
                            id: 'scepter_case',
                            name: '权杖展示柜',
                            x: 50,
                            y: 100,
                            width: 100,
                            height: 120,
                            type: 'compartment',
                            locked: true,
                            requiredItem: 'keyCardCombo',
                            contains: ['escapeScepter'],
                            color: '#5a1a4a'
                        }
                    ]
                },
                {
                    id: 'gear_mechanism',
                    name: '齿轮机关',
                    x: 80,
                    y: 120,
                    width: 100,
                    height: 100,
                    type: 'puzzle_trigger',
                    puzzle: 'drawer_puzzle_2',
                    color: '#8b5cf6',
                    description: '一个复杂的齿轮组合装置。'
                },
                {
                    id: 'hidden_clue_1',
                    name: '幕布后密信',
                    x: 600,
                    y: 150,
                    width: 80,
                    height: 80,
                    type: 'clue',
                    hidden: true,
                    revealed: false,
                    hint: '拉开红色幕布看看...',
                    color: 'rgba(236, 72, 153, 0.3)',
                    content: '最终密码：2 8 4 6'
                },
                {
                    id: 'hidden_clue_2',
                    name: '帽子里纸条',
                    x: 300,
                    y: 150,
                    width: 60,
                    height: 60,
                    type: 'clue',
                    hidden: true,
                    revealed: false,
                    hint: '魔术师的帽子里有什么？',
                    color: 'rgba(236, 72, 153, 0.2)',
                    content: '别忘了组合你的道具！'
                },
                {
                    id: 'trap_dove',
                    name: '白鸽陷阱',
                    x: 450,
                    y: 150,
                    width: 70,
                    height: 70,
                    type: 'trap',
                    triggered: false,
                    timePenalty: 30,
                    color: '#f472b6',
                    message: '🕊️ 被魔术陷阱困住！扣除30秒！'
                },
                {
                    id: 'stage_key',
                    name: '舞台钥匙',
                    x: 200,
                    y: 350,
                    width: 45,
                    height: 35,
                    type: 'item',
                    itemId: 'brassKey',
                    hidden: false,
                    color: '#ffd700'
                },
                {
                    id: 'card_on_table',
                    name: '魔术卡牌',
                    x: 550,
                    y: 350,
                    width: 45,
                    height: 60,
                    type: 'item',
                    itemId: 'magicCard',
                    hidden: false,
                    color: '#f472b6'
                },
                {
                    id: 'final_exit',
                    name: '自由之门',
                    x: 680,
                    y: 60,
                    width: 100,
                    height: 400,
                    type: 'exit',
                    locked: true,
                    requiredItem: 'escapeScepter',
                    color: '#ec4899'
                }
            ],
            puzzles: {
                drawer_puzzle_2: {
                    type: 'drawer',
                    title: '齿轮机关',
                    sequence: [1, 3, 0, 2, 4],
                    drawers: ['①', '②', '③', '④', '⑤'],
                    hint: '按照时钟上的点数顺序：二、四、一、三、五',
                    reward: 'magicGear',
                    unlocks: []
                },
                final_number_puzzle: {
                    type: 'number',
                    title: '最终密码锁',
                    answer: [2, 8, 4, 6],
                    hint: '幕布后隐藏着最终的秘密...',
                    unlocks: []
                }
            },
            startMessage: '这是魔术师的终极密室...集合所有智慧，赢得自由！',
            victoryMessage: '🎊 难以置信！你成功逃脱了所有魔术密室！你是真正的逃脱大师！'
        }
    };
    
    function getLevel(levelId) {
        return Utils.deepClone(levels[levelId]);
    }
    
    function getTotalLevels() {
        return Object.keys(levels).length;
    }
    
    function getLevelInfo(levelId) {
        const level = levels[levelId];
        if (!level) return null;
        return {
            id: level.id,
            name: level.name,
            description: level.description,
            timeLimit: level.timeLimit
        };
    }
    
    function getAllLevels() {
        return Object.keys(levels).map(id => getLevelInfo(parseInt(id)));
    }
    
    return {
        getLevel,
        getTotalLevels,
        getLevelInfo,
        getAllLevels
    };
})();
