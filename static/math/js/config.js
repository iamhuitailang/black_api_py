const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 650,
    TARGET_QUESTIONS: 10,
    
    DIFFICULTIES: {
        easy: {
            name: '简单',
            emoji: '🟢',
            maxNumber: 20,
            operators: ['+', '-'],
            hasNegative: false,
            hasCarry: false,
            color: '#4CAF50'
        },
        medium: {
            name: '中等',
            emoji: '🟡',
            maxNumber: 100,
            operators: ['+', '-', '×'],
            hasNegative: false,
            hasCarry: true,
            color: '#FFC107'
        },
        hard: {
            name: '困难',
            emoji: '🔴',
            maxNumber: 1000,
            operators: ['+', '-', '×', '÷'],
            hasNegative: true,
            hasCarry: true,
            color: '#F44336'
        }
    },

    THEMES: {
        candy: {
            name: '糖果',
            emoji: '🍬',
            primary: '#FF6B9D',
            secondary: '#FFB6C1',
            background: '#FFF5F7',
            accent: '#FF1493',
            correct: '#7CFC00',
            wrong: '#FF6347'
        },
        ocean: {
            name: '海洋',
            emoji: '🌊',
            primary: '#4A90D9',
            secondary: '#87CEEB',
            background: '#F0F8FF',
            accent: '#1E90FF',
            correct: '#00FA9A',
            wrong: '#FF6B6B'
        },
        forest: {
            name: '森林',
            emoji: '🌲',
            primary: '#6B8E23',
            secondary: '#98FB98',
            background: '#F5FFFA',
            accent: '#32CD32',
            correct: '#ADFF2F',
            wrong: '#FF7F50'
        }
    },

    BUTTONS: {
        padding: 15,
        borderRadius: 12,
        fontSize: 20
    }
};

const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    RESULT: 'result'
};