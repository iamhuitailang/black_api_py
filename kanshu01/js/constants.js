const CONSTANTS = {
    STORAGE_KEYS: {
        PLAYER_DATA: 'kanshu_player_data',
        GAME_STATE: 'kanshu_game_state'
    },
    
    DIFFICULTY: {
        BEGINNER: {
            id: 'beginner',
            name: '新手',
            branchEvery: 3,
            speed: 1.0,
            maxSpeed: 1.5,
            obstacles: false,
            fakeAction: false,
            doubleBranch: false
        },
        SKILLED: {
            id: 'skilled',
            name: '熟练',
            branchEvery: 2,
            speed: 1.2,
            maxSpeed: 2.0,
            obstacles: 'sometimes',
            fakeAction: false,
            doubleBranch: false
        },
        EXPERT: {
            id: 'expert',
            name: '高手',
            branchEvery: 1,
            speed: 1.5,
            maxSpeed: 3.0,
            obstacles: 'often',
            fakeAction: false,
            doubleBranch: false
        },
        CRAZY: {
            id: 'crazy',
            name: '疯狂',
            branchEvery: 2,
            speed: 1.8,
            maxSpeed: 3.5,
            obstacles: 'often',
            fakeAction: true,
            doubleBranch: false
        }
    },
    
    AXES: {
        STONE: { id: 'stone', name: '石斧', icon: '🪓', price: 0, speedMultiplier: 1.0, autoCut: false, vibration: false },
        IRON: { id: 'iron', name: '铁斧', icon: '⚒️', price: 100, speedMultiplier: 1.2, autoCut: false, vibration: false },
        GOLD: { id: 'gold', name: '金斧', icon: '🌟', price: 500, speedMultiplier: 1.5, autoCut: false, vibration: true },
        CHAINSAW: { id: 'chainsaw', name: '电锯', icon: '⛏️', price: 1000, speedMultiplier: 2.0, autoCut: true, vibration: true }
    },
    
    TREE_SKINS: {
        OAK: { id: 'oak', name: '橡树', icon: '🌲', price: 0, trunkColor: '#8B4513', leavesColor: '#228B22' },
        CHERRY: { id: 'cherry', name: '樱花树', icon: '🌸', price: 200, trunkColor: '#DEB887', leavesColor: '#FFB6C1' },
        CHRISTMAS: { id: 'christmas', name: '圣诞树', icon: '🎄', price: 300, trunkColor: '#8B4513', leavesColor: '#006400' }
    },
    
    POWERUPS: {
        DOUBLE: { id: 'double', name: '双倍斧', icon: '⚔️', price: 50, duration: 10000, description: '短时间内每砍一次计为2次' },
        SHIELD: { id: 'shield', name: '护手套', icon: '🧤', price: 80, duration: 0, description: '容错1次（砍中树枝不死亡）' },
        AUTO: { id: 'auto', name: '自动砍', icon: '🤖', price: 100, duration: 5000, description: '5秒内自动连续砍伐' }
    },
    
    GAME: {
        INITIAL_TREE_SEGMENTS: 8,
        SEGMENT_HEIGHT: 60,
        TREE_WIDTH: 80,
        BRANCH_LENGTH: 70,
        BRANCH_HEIGHT: 20,
        BASE_SPEED: 1000,
        MIN_SPEED: 200,
        SPEED_DECREASE_RATE: 10,
        VISUAL_SEGMENTS: 6,
        OBSTACLE_CHANCE: 0.15,
        FAKE_ACTION_CHANCE: 0.2
    },
    
    COLORS: {
        background: ['#87CEEB', '#90EE90'],
        ground: '#8B7355',
        axe: {
            stone: '#808080',
            iron: '#4682B4',
            gold: '#FFD700',
            chainsaw: '#FF4500'
        }
    }
};

const SIDE = {
    LEFT: 'left',
    RIGHT: 'right',
    NONE: 'none'
};

const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover'
};

const OBSTACLE_TYPE = {
    BRANCH: 'branch',
    BEEHIVE: 'beehive',
    SQUIRREL: 'squirrel'
};