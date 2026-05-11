var Config = (function() {
    'use strict';

    var GAME_CONFIG = {
        gameName: '古堡密室',
        storageKey: 'gubaomishi_save',
        
        colors: {
            background: '#0a0505',
            backgroundDark: '#050202',
            accent: '#8b0000',
            accentLight: '#c41e3a',
            accentDark: '#5a0000',
            text: '#d4a574',
            textLight: '#f5deb3',
            textDark: '#8b6914',
            gold: '#ffd700',
            shadow: 'rgba(0, 0, 0, 0.8)',
            highlight: 'rgba(196, 30, 58, 0.3)'
        },
        
        canvas: {
            minWidth: 800,
            minHeight: 600,
            targetWidth: 1200,
            targetHeight: 800
        }
    };

    var SCENES = {
        study: {
            id: 'study',
            name: '古堡书房',
            description: '昏暗的书房，空气中弥漫着古老纸张的气息。墙上挂着一幅神秘的油画，角落里有一个壁炉，旁边是高大的书架。',
            background: 'study',
            areas: [
                {
                    id: 'fireplace',
                    name: '壁炉',
                    x: 0.15, y: 0.55, width: 0.25, height: 0.35,
                    puzzleId: 'fireplace_key',
                    icon: '🔥'
                },
                {
                    id: 'bookshelf',
                    name: '书架',
                    x: 0.6, y: 0.2, width: 0.3, height: 0.6,
                    puzzleId: 'bookshelf_secret',
                    icon: '📚'
                },
                {
                    id: 'painting',
                    name: '油画',
                    x: 0.35, y: 0.15, width: 0.2, height: 0.3,
                    puzzleId: 'painting_poker',
                    icon: '🖼️'
                },
                {
                    id: 'desk',
                    name: '书桌',
                    x: 0.1, y: 0.15, width: 0.2, height: 0.25,
                    puzzleId: 'desk_drawer',
                    icon: '📝'
                },
                {
                    id: 'cabinet',
                    name: '柜子',
                    x: 0.05, y: 0.5, width: 0.12, height: 0.4,
                    puzzleId: 'cabinet_diary',
                    requiresItem: 'rusty_key',
                    icon: '🗄️'
                },
                {
                    id: 'secret_door',
                    name: '暗门',
                    x: 0.88, y: 0.3, width: 0.1, height: 0.5,
                    puzzleId: 'final_escape',
                    hidden: true,
                    icon: '🚪'
                }
            ]
        }
    };

    var ITEMS = {
        poker: {
            id: 'poker',
            name: '拨火棍',
            icon: '🪵',
            description: '一根生锈的拨火棍，可以用来翻动灰烬。',
            scene: 'study',
            area: 'desk'
        },
        rusty_key: {
            id: 'rusty_key',
            name: '生锈的钥匙',
            icon: '🗝️',
            description: '一把生锈的铁钥匙，不知道能打开什么。',
            scene: 'study',
            area: 'fireplace',
            requiresPuzzle: 'fireplace_key'
        },
        diary: {
            id: 'diary',
            name: '日记本',
            icon: '📔',
            description: '一本泛黄的日记本，记录着古堡的秘密...',
            scene: 'study',
            area: 'cabinet',
            requiresPuzzle: 'cabinet_diary'
        },
        dagger: {
            id: 'dagger',
            name: '银质匕首',
            icon: '🗡️',
            description: '一把精致的银质匕首，似乎是某种仪式用品。',
            scene: 'study',
            area: 'bookshelf',
            requiresPuzzle: 'bookshelf_secret'
        },
        candle: {
            id: 'candle',
            name: '神秘蜡烛',
            icon: '🕯️',
            description: '一支散发着淡淡香气的蜡烛，点燃它或许能看到什么。',
            scene: 'study',
            area: 'painting',
            requiresPuzzle: 'painting_poker'
        }
    };

    var PUZZLES = {
        desk_drawer: {
            id: 'desk_drawer',
            name: '书桌抽屉',
            description: '书桌的抽屉',
            steps: [
                {
                    id: 'open_drawer',
                    description: '打开抽屉',
                    message: '你拉开书桌的抽屉，在里面发现了一根拨火棍！',
                    reward: 'poker',
                    action: 'reward'
                }
            ],
            currentStep: 0
        },
        
        fireplace_key: {
            id: 'fireplace_key',
            name: '壁炉里的钥匙',
            description: '壁炉里似乎藏着什么',
            steps: [
                {
                    id: 'click_fireplace',
                    description: '点击壁炉',
                    message: '壁炉里有灰烬，似乎烧过什么东西...也许需要用什么工具翻动一下。',
                    action: 'message'
                },
                {
                    id: 'use_poker',
                    description: '使用拨火棍',
                    message: '你用拨火棍翻动灰烬，在里面找到了一把生锈的钥匙！',
                    requiresItem: 'poker',
                    reward: 'rusty_key',
                    action: 'reward'
                }
            ],
            currentStep: 0
        },
        
        cabinet_diary: {
            id: 'cabinet_diary',
            name: '上锁的柜子',
            description: '一个上锁的柜子',
            steps: [
                {
                    id: 'click_cabinet',
                    description: '点击柜子',
                    message: '柜子上有一把锁，需要钥匙才能打开。',
                    action: 'message'
                },
                {
                    id: 'use_key',
                    description: '使用钥匙',
                    message: '柜子被打开了！里面有一本泛黄的日记！',
                    requiresItem: 'rusty_key',
                    reward: 'diary',
                    consumeItem: 'rusty_key',
                    action: 'reward'
                }
            ],
            currentStep: 0
        },
        
        painting_poker: {
            id: 'painting_poker',
            name: '神秘油画',
            description: '墙上的油画似乎隐藏着秘密',
            steps: [
                {
                    id: 'inspect_painting',
                    description: '检查油画',
                    message: '一幅描绘古堡夜景的油画，画中的月亮格外明亮...你发现油画后面有一个暗格，里面藏着一支神秘的蜡烛！',
                    reward: 'candle',
                    action: 'reward'
                }
            ],
            currentStep: 0
        },
        
        bookshelf_secret: {
            id: 'bookshelf_secret',
            name: '书架机关',
            description: '书架上藏着秘密',
            steps: [
                {
                    id: 'click_bookshelf',
                    description: '查看书架',
                    message: '高大的书架上摆满了古籍，第三层似乎有些特别...也许日记里有线索？',
                    action: 'message'
                },
                {
                    id: 'use_diary',
                    description: '使用日记',
                    message: '你翻开日记，最后一页写着："书架第三层，抽出那本红色的书..."',
                    requiresItem: 'diary',
                    action: 'message'
                },
                {
                    id: 'find_secret',
                    description: '寻找机关',
                    message: '你抽出第三层那本红色的书，书架发出咔嚓声，露出了一个隐藏的按钮！',
                    action: 'message'
                },
                {
                    id: 'press_button',
                    description: '按下按钮',
                    message: '墙壁上缓缓出现了一道暗门！同时你还发现了一把银质匕首！',
                    reward: 'dagger',
                    revealArea: 'secret_door',
                    action: 'reward'
                }
            ],
            currentStep: 0
        },
        
        final_escape: {
            id: 'final_escape',
            name: '最终逃脱',
            description: '逃出密室',
            steps: [
                {
                    id: 'go_through_door',
                    description: '穿过暗门',
                    message: '你走出了古堡密室，呼吸到了新鲜的空气！你成功逃出了！',
                    action: 'victory'
                }
            ],
            currentStep: 0
        }
    };

    var HINTS = {
        desk_drawer: [
            '书桌的抽屉似乎可以拉开...',
            '点击书桌看看里面有什么！',
            '直接点击书桌，拨火棍就在抽屉里！'
        ],
        fireplace_key: [
            '壁炉里似乎藏着什么...',
            '也许需要用什么工具翻动灰烬？',
            '先从书桌拿到拨火棍，再回到壁炉使用它！'
        ],
        cabinet_diary: [
            '那个柜子似乎被锁住了',
            '也许壁炉里能找到打开它的钥匙',
            '用从壁炉拿到的生锈钥匙打开柜子！'
        ],
        bookshelf_secret: [
            '书架看起来很普通，但也许有秘密...',
            '日记里似乎有关于书架的重要线索',
            '拿到日记后，选择日记并点击书架来触发机关！'
        ],
        final_escape: [
            '所有谜题都解开了，寻找出口吧！',
            '书架旁边的暗门应该就是出口',
            '点击暗门逃出密室！'
        ]
    };

    return {
        GAME_CONFIG: GAME_CONFIG,
        SCENES: SCENES,
        ITEMS: ITEMS,
        PUZZLES: PUZZLES,
        HINTS: HINTS
    };
})();
