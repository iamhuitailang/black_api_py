export const catSounds = [
    {
        id: 'short_meow',
        name: '短促"喵"',
        description: '一声短暂',
        emoji: '🐱',
        soundText: '喵',
        translation: '你好呀！',
        audioType: 'short'
    },
    {
        id: 'long_meow',
        name: '长音"喵～"',
        description: '拖长音',
        emoji: '😺',
        soundText: '喵～',
        translation: '我好想你～',
        audioType: 'long'
    },
    {
        id: 'low_meow',
        name: '低沉"呜喵"',
        description: '低沉短促',
        emoji: '😿',
        soundText: '呜喵',
        translation: '我有点不开心',
        audioType: 'low'
    },
    {
        id: 'rapid_meows',
        name: '急促"喵喵喵"',
        description: '连续短促',
        emoji: '😸',
        soundText: '喵喵喵',
        translation: '快喂我！饿啦！',
        audioType: 'rapid'
    },
    {
        id: 'high_pitched',
        name: '高音"喵呜！"',
        description: '尖锐',
        emoji: '🙀',
        soundText: '喵呜！',
        translation: '别烦我！走开！',
        audioType: 'high'
    },
    {
        id: 'purr',
        name: '呼噜声',
        description: '低频震动',
        emoji: '😻',
        soundText: '呼噜呼噜',
        translation: '好舒服～继续摸',
        audioType: 'purr'
    },
    {
        id: 'hiss',
        name: '嘶嘶嘶声',
        description: '警告声',
        emoji: '😾',
        soundText: '嘶嘶嘶',
        translation: '别靠近！我要打架了',
        audioType: 'hiss'
    }
];

export const humanPhrases = [
    {
        id: 'love_you',
        phrase: '我爱你',
        catTranslation: '呼噜呼噜～喵～',
        audioType: 'purr'
    },
    {
        id: 'hungry',
        phrase: '我饿了',
        catTranslation: '喵喵喵喵喵！（急促）',
        audioType: 'rapid'
    },
    {
        id: 'play_with_me',
        phrase: '陪我玩',
        catTranslation: '喵～呜～喵～（跳跃音）',
        audioType: 'playful'
    },
    {
        id: 'dont_bother',
        phrase: '别吵我',
        catTranslation: '嘶……（低沉）',
        audioType: 'hiss'
    },
    {
        id: 'comfortable',
        phrase: '好舒服',
        catTranslation: '咕噜咕噜～',
        audioType: 'purr'
    },
    {
        id: 'sad',
        phrase: '我好伤心',
        catTranslation: '呜……喵……（低沉长音）',
        audioType: 'sad'
    }
];

export const learnCommands = [
    {
        id: 'sit',
        emoji: '🪑',
        command: '坐下',
        catResponse: '喵～（乖乖坐下）',
        description: '教猫咪坐下'
    },
    {
        id: 'hand',
        emoji: '🤝',
        command: '握手',
        catResponse: '喵～（伸出爪子）',
        description: '教猫咪握手'
    },
    {
        id: 'come',
        emoji: '👋',
        command: '过来',
        catResponse: '喵～喵～（跑过来）',
        description: '教猫咪过来'
    },
    {
        id: 'stay',
        emoji: '🛑',
        command: '别动',
        catResponse: '喵？（歪头看着你）',
        description: '教猫咪别动'
    },
    {
        id: 'high_five',
        emoji: '🖐️',
        command: '击掌',
        catResponse: '喵～（开心击掌）',
        description: '教猫咪击掌'
    }
];

export const chatResponses = {
    greetings: [
        '喵～你好呀！今天心情怎么样？',
        '喵呜～你来啦！要不要陪我玩？',
        '喵～欢迎回来！你去哪里了？'
    ],
    hungry: [
        '喵喵喵！我知道你懂我的！快给我小鱼干！',
        '喵～呜～肚子空空的，需要填满！',
        '喵！喵！喵！（着急地蹭你腿）'
    ],
    playful: [
        '喵～～我们来玩逗猫棒吧！',
        '喵呜！（扑向你的手假装攻击）',
        '喵～（叼来小球放在你面前）'
    ],
    sleepy: [
        '呼噜呼噜～好困，让我睡一会儿...',
        '喵～（打哈欠）今天已经玩够了',
        'Zzz...（已经睡着了）'
    ],
    affectionate: [
        '喵～（蹭蹭你）最喜欢你了！',
        '呼噜呼噜～（在你腿上踩奶）',
        '喵呜～（舔舔你的手）'
    ],
    angry: [
        '嘶！别碰我！',
        '喵呜！（耳朵向后）我生气了！',
        '嘶嘶！（尾巴甩动）走开！'
    ],
    confused: [
        '喵？（歪头）你在说什么？',
        '喵呜？（疑惑地看着你）',
        '喵？喵？（到处闻闻）'
    ],
    default: [
        '喵～（悠闲地舔毛）',
        '喵呜～（看向窗外）',
        '呼噜呼噜～（满足地闭上眼睛）',
        '喵～（伸个懒腰）',
        '喵呜？（好奇地歪头）'
    ]
};

export const randomCatQuotes = [
    '喵星人每天最重要的三件事：吃饭、睡觉、发呆',
    '据说每只猫体内都住着一个傲娇的小公主',
    '喵：人类，你成功引起了我的注意',
    '猫咪的哲学：如果 fits，我 sits',
    '喵星人守则：主人的手就是我的猎物',
    '据说猫咪会在你睡着的时候监视你',
    '喵：这盆草看起来很好吃的样子',
    '猫咪的一天：23小时睡觉，1小时吃饭发呆'
];

export const catTypes = [
    {
        id: 'ragdoll',
        name: '布偶猫',
        emoji: '🐱',
        description: '温柔优雅的仙女猫',
        personality: '温柔、粘人、安静',
        theme: {
            primary: '#87CEEB',
            secondary: '#E6F3FF',
            accent: '#4B9CD3',
            bg: '#F0F8FF',
            cardBg: '#FFFFFF',
            text: '#2C5282'
        },
        colors: {
            body: '#FFFFFF',
            bodyDark: '#E6E6E6',
            bodyLight: '#F5F5F5',
            ears: '#D4A574',
            earsInner: '#E8C9A0',
            nose: '#FFB6C1',
            cheeks: '#FFE4E1',
            eyes: '#6495ED',
            tail: '#D4A574',
            tailTip: '#B8956A'
        }
    },
    {
        id: 'siamese',
        name: '暹罗猫',
        emoji: '😺',
        description: '优雅高贵的贵族猫',
        personality: '聪明、好奇、话痨',
        theme: {
            primary: '#6B4423',
            secondary: '#F5E6D3',
            accent: '#8B4513',
            bg: '#FAF5EF',
            cardBg: '#FFFFFF',
            text: '#4A3728'
        },
        colors: {
            body: '#F5E6D3',
            bodyDark: '#E8D4B8',
            bodyLight: '#FAF0E6',
            ears: '#2C1810',
            earsInner: '#4A3728',
            nose: '#8B7355',
            cheeks: '#D4C4A8',
            eyes: '#0066CC',
            tail: '#2C1810',
            tailTip: '#1A0F0A',
            mask: '#4A3728',
            paws: '#4A3728'
        }
    },
    {
        id: 'orange_tabby',
        name: '橘猫',
        emoji: '😸',
        description: '活泼可爱的胖橘',
        personality: '贪吃、活泼、亲人',
        theme: {
            primary: '#FF8C00',
            secondary: '#FFF3E0',
            accent: '#E65100',
            bg: '#FFF8E1',
            cardBg: '#FFFFFF',
            text: '#5D4037'
        },
        colors: {
            body: '#FFA726',
            bodyDark: '#FF9800',
            bodyLight: '#FFCC80',
            ears: '#EF6C00',
            earsInner: '#FFB74D',
            nose: '#FF7043',
            cheeks: '#FFCC80',
            eyes: '#4CAF50',
            tail: '#EF6C00',
            tailTip: '#E65100',
            stripes: '#E65100'
        }
    }
];

export const catTypeThemes = {
    ragdoll: {
        name: '布偶猫',
        cssVars: {
            '--primary-color': '#87CEEB',
            '--secondary-color': '#E6F3FF',
            '--accent-color': '#4B9CD3',
            '--bg-color': '#F0F8FF',
            '--card-bg': '#FFFFFF',
            '--text-color': '#2C5282',
            '--shadow': '0 4px 15px rgba(75, 156, 211, 0.3)'
        }
    },
    siamese: {
        name: '暹罗猫',
        cssVars: {
            '--primary-color': '#6B4423',
            '--secondary-color': '#F5E6D3',
            '--accent-color': '#8B4513',
            '--bg-color': '#FAF5EF',
            '--card-bg': '#FFFFFF',
            '--text-color': '#4A3728',
            '--shadow': '0 4px 15px rgba(107, 68, 35, 0.3)'
        }
    },
    orange_tabby: {
        name: '橘猫',
        cssVars: {
            '--primary-color': '#FF8C00',
            '--secondary-color': '#FFF3E0',
            '--accent-color': '#E65100',
            '--bg-color': '#FFF8E1',
            '--card-bg': '#FFFFFF',
            '--text-color': '#5D4037',
            '--shadow': '0 4px 15px rgba(255, 140, 0, 0.3)'
        }
    }
};

export default {
    catSounds,
    humanPhrases,
    learnCommands,
    chatResponses,
    randomCatQuotes,
    catTypes,
    catTypeThemes
};
