export const PIECE_TYPES = {
    CAOCAO: 'caocao',
    GUANYU: 'guanyu',
    GENERAL_V: 'general_v',
    SOLDIER: 'soldier',
    WALL: 'wall'
};

export const PIECE_CONFIG = {
    [PIECE_TYPES.CAOCAO]: {
        name: '曹操',
        symbol: '曹',
        width: 2,
        height: 2,
        color: '#e74c3c',
        textColor: '#fff'
    },
    [PIECE_TYPES.GUANYU]: {
        name: '关羽',
        symbol: '关',
        width: 2,
        height: 1,
        color: '#27ae60',
        textColor: '#fff'
    },
    [PIECE_TYPES.GENERAL_V]: {
        name: '将军',
        symbol: '',
        width: 1,
        height: 2,
        color: '#27ae60',
        textColor: '#fff'
    },
    [PIECE_TYPES.SOLDIER]: {
        name: '小兵',
        symbol: '兵',
        width: 1,
        height: 1,
        color: '#f39c12',
        textColor: '#fff'
    },
    [PIECE_TYPES.WALL]: {
        name: '墙壁',
        symbol: '🧱',
        width: 1,
        height: 1,
        color: '#7f8c8d',
        textColor: '#fff',
        movable: false
    }
};

export const LAYOUTS = {
    hengdaolima: {
        name: '横刀立马',
        difficulty: '★★★★',
        minSteps: 81,
        pieces: [
            { id: 'caocao', type: PIECE_TYPES.CAOCAO, x: 1, y: 0 },
            { id: 'guanyu', type: PIECE_TYPES.GUANYU, x: 1, y: 2, symbol: '关' },
            { id: 'zhangfei', type: PIECE_TYPES.GENERAL_V, x: 0, y: 0, symbol: '张' },
            { id: 'zhaoyun', type: PIECE_TYPES.GENERAL_V, x: 3, y: 0, symbol: '赵' },
            { id: 'machao', type: PIECE_TYPES.GENERAL_V, x: 0, y: 2, symbol: '马' },
            { id: 'huangzhong', type: PIECE_TYPES.GENERAL_V, x: 3, y: 2, symbol: '黄' },
            { id: 'soldier1', type: PIECE_TYPES.SOLDIER, x: 0, y: 4 },
            { id: 'soldier2', type: PIECE_TYPES.SOLDIER, x: 1, y: 3 },
            { id: 'soldier3', type: PIECE_TYPES.SOLDIER, x: 2, y: 3 },
            { id: 'soldier4', type: PIECE_TYPES.SOLDIER, x: 3, y: 4 }
        ]
    },
    cengcengshefang: {
        name: '层层设防',
        difficulty: '★★★',
        minSteps: 55,
        pieces: [
            { id: 'caocao', type: PIECE_TYPES.CAOCAO, x: 1, y: 0 },
            { id: 'guanyu', type: PIECE_TYPES.GUANYU, x: 1, y: 2, symbol: '关' },
            { id: 'zhangfei', type: PIECE_TYPES.GUANYU, x: 1, y: 3, symbol: '张' },
            { id: 'zhaoyun', type: PIECE_TYPES.GENERAL_V, x: 0, y: 0, symbol: '赵' },
            { id: 'machao', type: PIECE_TYPES.GENERAL_V, x: 3, y: 0, symbol: '马' },
            { id: 'huangzhong', type: PIECE_TYPES.GENERAL_V, x: 0, y: 2, symbol: '黄' },
            { id: 'general1', type: PIECE_TYPES.GENERAL_V, x: 3, y: 2, symbol: '将' },
            { id: 'soldier1', type: PIECE_TYPES.SOLDIER, x: 0, y: 4 },
            { id: 'soldier2', type: PIECE_TYPES.SOLDIER, x: 1, y: 4 },
            { id: 'soldier3', type: PIECE_TYPES.SOLDIER, x: 2, y: 4 },
            { id: 'soldier4', type: PIECE_TYPES.SOLDIER, x: 3, y: 4 }
        ]
    },
    binglinchengxia: {
        name: '兵临城下',
        difficulty: '★★★★',
        minSteps: 70,
        pieces: [
            { id: 'caocao', type: PIECE_TYPES.CAOCAO, x: 1, y: 0 },
            { id: 'zhangfei', type: PIECE_TYPES.GENERAL_V, x: 0, y: 0, symbol: '张' },
            { id: 'zhaoyun', type: PIECE_TYPES.GENERAL_V, x: 3, y: 0, symbol: '赵' },
            { id: 'machao', type: PIECE_TYPES.GENERAL_V, x: 0, y: 2, symbol: '马' },
            { id: 'huangzhong', type: PIECE_TYPES.GENERAL_V, x: 3, y: 2, symbol: '黄' },
            { id: 'guanyu', type: PIECE_TYPES.GUANYU, x: 0, y: 4, symbol: '关' },
            { id: 'general1', type: PIECE_TYPES.GENERAL_V, x: 1, y: 2, symbol: '将' },
            { id: 'soldier1', type: PIECE_TYPES.SOLDIER, x: 2, y: 2 },
            { id: 'soldier2', type: PIECE_TYPES.SOLDIER, x: 2, y: 3 },
            { id: 'soldier3', type: PIECE_TYPES.SOLDIER, x: 2, y: 4 },
            { id: 'soldier4', type: PIECE_TYPES.SOLDIER, x: 3, y: 4 }
        ]
    },
    qiandanghouzu: {
        name: '前挡后阻',
        difficulty: '★★★★★',
        minSteps: 98,
        pieces: [
            { id: 'caocao', type: PIECE_TYPES.CAOCAO, x: 1, y: 0 },
            { id: 'guanyu', type: PIECE_TYPES.GUANYU, x: 1, y: 3, symbol: '关' },
            { id: 'zhangfei', type: PIECE_TYPES.GENERAL_V, x: 0, y: 0, symbol: '张' },
            { id: 'zhaoyun', type: PIECE_TYPES.GENERAL_V, x: 3, y: 0, symbol: '赵' },
            { id: 'machao', type: PIECE_TYPES.GENERAL_V, x: 0, y: 2, symbol: '马' },
            { id: 'huangzhong', type: PIECE_TYPES.GENERAL_V, x: 3, y: 2, symbol: '黄' },
            { id: 'general1', type: PIECE_TYPES.GENERAL_V, x: 1, y: 2, symbol: '将' },
            { id: 'soldier1', type: PIECE_TYPES.SOLDIER, x: 0, y: 4 },
            { id: 'soldier2', type: PIECE_TYPES.SOLDIER, x: 2, y: 2 },
            { id: 'soldier3', type: PIECE_TYPES.SOLDIER, x: 2, y: 4 },
            { id: 'soldier4', type: PIECE_TYPES.SOLDIER, x: 3, y: 4 }
        ]
    },
    yilujinjun: {
        name: '一路进军',
        difficulty: '★★',
        minSteps: 38,
        pieces: [
            { id: 'caocao', type: PIECE_TYPES.CAOCAO, x: 1, y: 0 },
            { id: 'guanyu', type: PIECE_TYPES.GUANYU, x: 1, y: 2, symbol: '关' },
            { id: 'zhangfei', type: PIECE_TYPES.GENERAL_V, x: 0, y: 0, symbol: '张' },
            { id: 'zhaoyun', type: PIECE_TYPES.GENERAL_V, x: 3, y: 0, symbol: '赵' },
            { id: 'soldier1', type: PIECE_TYPES.SOLDIER, x: 0, y: 2 },
            { id: 'soldier2', type: PIECE_TYPES.SOLDIER, x: 0, y: 3 },
            { id: 'soldier3', type: PIECE_TYPES.SOLDIER, x: 3, y: 2 },
            { id: 'soldier4', type: PIECE_TYPES.SOLDIER, x: 3, y: 3 }
        ]
    },
    qitoubingjin: {
        name: '齐头并进',
        difficulty: '★★★',
        minSteps: 62,
        pieces: [
            { id: 'caocao', type: PIECE_TYPES.CAOCAO, x: 1, y: 0 },
            { id: 'guanyu', type: PIECE_TYPES.GUANYU, x: 0, y: 2, symbol: '关' },
            { id: 'zhangfei', type: PIECE_TYPES.GUANYU, x: 2, y: 2, symbol: '张' },
            { id: 'zhaoyun', type: PIECE_TYPES.GENERAL_V, x: 0, y: 0, symbol: '赵' },
            { id: 'machao', type: PIECE_TYPES.GENERAL_V, x: 3, y: 0, symbol: '马' },
            { id: 'huangzhong', type: PIECE_TYPES.GENERAL_V, x: 0, y: 3, symbol: '黄' },
            { id: 'general1', type: PIECE_TYPES.GENERAL_V, x: 3, y: 3, symbol: '将' },
            { id: 'soldier1', type: PIECE_TYPES.SOLDIER, x: 1, y: 2 },
            { id: 'soldier2', type: PIECE_TYPES.SOLDIER, x: 2, y: 3 },
            { id: 'soldier3', type: PIECE_TYPES.SOLDIER, x: 1, y: 4 },
            { id: 'soldier4', type: PIECE_TYPES.SOLDIER, x: 2, y: 4 }
        ]
    },
    jiangyongcaoying: {
        name: '将拥曹营',
        difficulty: '★★★★',
        minSteps: 85,
        pieces: [
            { id: 'caocao', type: PIECE_TYPES.CAOCAO, x: 1, y: 0 },
            { id: 'zhangfei', type: PIECE_TYPES.GENERAL_V, x: 0, y: 0, symbol: '张' },
            { id: 'zhaoyun', type: PIECE_TYPES.GENERAL_V, x: 3, y: 0, symbol: '赵' },
            { id: 'machao', type: PIECE_TYPES.GENERAL_V, x: 0, y: 2, symbol: '马' },
            { id: 'huangzhong', type: PIECE_TYPES.GENERAL_V, x: 3, y: 2, symbol: '黄' },
            { id: 'guanyu', type: PIECE_TYPES.GENERAL_V, x: 1, y: 2, symbol: '关' },
            { id: 'general1', type: PIECE_TYPES.GENERAL_V, x: 2, y: 2, symbol: '将' },
            { id: 'soldier1', type: PIECE_TYPES.SOLDIER, x: 0, y: 4 },
            { id: 'soldier2', type: PIECE_TYPES.SOLDIER, x: 1, y: 4 },
            { id: 'soldier3', type: PIECE_TYPES.SOLDIER, x: 2, y: 4 },
            { id: 'soldier4', type: PIECE_TYPES.SOLDIER, x: 3, y: 4 }
        ]
    },
    wuhushangjiang: {
        name: '五虎上将',
        difficulty: '★★★★★',
        minSteps: 110,
        pieces: [
            { id: 'caocao', type: PIECE_TYPES.CAOCAO, x: 1, y: 0 },
            { id: 'guanyu', type: PIECE_TYPES.GUANYU, x: 1, y: 4, symbol: '关' },
            { id: 'zhangfei', type: PIECE_TYPES.GENERAL_V, x: 0, y: 0, symbol: '张' },
            { id: 'zhaoyun', type: PIECE_TYPES.GENERAL_V, x: 3, y: 0, symbol: '赵' },
            { id: 'machao', type: PIECE_TYPES.GENERAL_V, x: 0, y: 2, symbol: '马' },
            { id: 'huangzhong', type: PIECE_TYPES.GENERAL_V, x: 3, y: 2, symbol: '黄' },
            { id: 'general1', type: PIECE_TYPES.GENERAL_V, x: 1, y: 2, symbol: '将' },
            { id: 'general2', type: PIECE_TYPES.GENERAL_V, x: 2, y: 2, symbol: '军' },
            { id: 'soldier1', type: PIECE_TYPES.SOLDIER, x: 0, y: 4 },
            { id: 'soldier2', type: PIECE_TYPES.SOLDIER, x: 0, y: 3 },
            { id: 'soldier3', type: PIECE_TYPES.SOLDIER, x: 3, y: 3 },
            { id: 'soldier4', type: PIECE_TYPES.SOLDIER, x: 3, y: 4 }
        ]
    }
};

export const BOARD_CONFIG = {
    cols: 4,
    rows: 5,
    cellSize: 60,
    exitX: 1,
    exitY: 3,
    exitWidth: 2,
    exitHeight: 2
};

export const GAME_STATE = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    WON: 'won'
};
