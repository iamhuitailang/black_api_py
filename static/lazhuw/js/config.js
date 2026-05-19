const CANDLE_TYPES = {
    classic: {
        id: 'classic',
        name: '经典白蜡',
        icon: '🕯️',
        description: '白色圆柱蜡烛',
        color: '#f8f4ef',
        gradient: ['#ffffff', '#f8f4ef', '#e8e0d5'],
        flameColor: '#ff9500',
        flameGradient: ['#64b5f6', '#ff9500', '#ffcc00', '#fff3e0'],
        maxTime: 120,
        minTime: 1,
        condition: '初始解锁',
        unlocked: true
    },
    purple: {
        id: 'purple',
        name: '香氛紫蜡',
        icon: '🪻',
        description: '淡紫色香氛蜡烛',
        color: '#e8d5f0',
        gradient: ['#f3e5f5', '#e8d5f0', '#d1b3e0'],
        flameColor: '#ba68c8',
        flameGradient: ['#90caf9', '#ba68c8', '#e1bee7', '#f3e5f5'],
        maxTime: 120,
        minTime: 1,
        condition: '完成10次计时',
        unlocked: false
    },
    festival: {
        id: 'festival',
        name: '庆典彩蜡',
        icon: '🎉',
        description: '彩色条纹庆典蜡烛',
        color: 'rainbow',
        gradient: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6'],
        flameColor: '#ff7043',
        flameGradient: ['#64b5f6', '#ff7043', '#ffcc00', '#fce4ec'],
        maxTime: 120,
        minTime: 1,
        condition: '完成50次计时',
        unlocked: false
    },
    forest: {
        id: 'forest',
        name: '森林绿蜡',
        icon: '🌲',
        description: '墨绿色森林蜡烛',
        color: '#2e7d32',
        gradient: ['#4caf50', '#2e7d32', '#1b5e20'],
        flameColor: '#66bb6a',
        flameGradient: ['#81c784', '#66bb6a', '#a5d6a7', '#c8e6c9'],
        maxTime: 120,
        minTime: 1,
        condition: '连续7天使用',
        unlocked: false
    },
    pumpkin: {
        id: 'pumpkin',
        name: '南瓜蜡烛',
        icon: '🎃',
        description: '南瓜形节日蜡烛',
        color: '#ff8f00',
        gradient: ['#ffb74d', '#ff8f00', '#ef6c00'],
        flameColor: '#ff5722',
        flameGradient: ['#64b5f6', '#ff5722', '#ff8a65', '#ffccbc'],
        maxTime: 60,
        minTime: 1,
        condition: '万圣节限定',
        unlocked: false
    }
};

const TAGS = {
    work: {
        id: 'work',
        name: '专注工作',
        icon: '💼',
        defaultTime: 25,
        description: '番茄钟工作时段'
    },
    break: {
        id: 'break',
        name: '短休',
        icon: '☕',
        defaultTime: 5,
        description: '番茄钟休息时段'
    },
    meditation: {
        id: 'meditation',
        name: '冥想',
        icon: '🧘',
        defaultTime: 10,
        description: '冥想/呼吸练习'
    },
    cooking: {
        id: 'cooking',
        name: '烹饪',
        icon: '🍳',
        defaultTime: 15,
        description: '厨房计时'
    },
    study: {
        id: 'study',
        name: '学习',
        icon: '📚',
        defaultTime: 45,
        description: '课堂/自习时段'
    },
    custom: {
        id: 'custom',
        name: '自定义',
        icon: '✏️',
        defaultTime: 25,
        description: '用户自由设定'
    }
};

const PRESET_TIMES = [5, 10, 15, 25, 30, 60];

const FLICKER_SPEEDS = {
    slow: { min: 0.3, max: 0.8, interval: 200 },
    normal: { min: 0.5, max: 1.0, interval: 100 },
    fast: { min: 0.7, max: 1.2, interval: 50 }
};

const BURN_SPEEDS = {
    slow: 0.5,
    normal: 1.0,
    fast: 1.5
};

const CANDLE_STATE = {
    IDLE: 'idle',
    BURNING: 'burning',
    EXTINGUISHED: 'extinguished',
    COMPLETED: 'completed'
};

const MAX_CANDLES = 4;

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatMinutes = (minutes) => {
    if (minutes < 60) {
        return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export {
    CANDLE_TYPES,
    TAGS,
    PRESET_TIMES,
    FLICKER_SPEEDS,
    BURN_SPEEDS,
    CANDLE_STATE,
    MAX_CANDLES,
    formatTime,
    formatMinutes,
    formatDate,
    generateId
};
