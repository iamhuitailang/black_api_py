const STORAGE_KEY = 'truth_or_dare_game';

const defaultGameState = {
    theme: 'classic',
    mode: 'mix',
    difficulty: 'light',
    drawMethod: 'card',
    currentCard: null,
    isFlipped: false,
    players: [
        { name: '玩家1', score: 0 },
        { name: '玩家2', score: 0 }
    ],
    customTruth: {
        light: [],
        normal: [],
        hard: [],
        adult: []
    },
    customDare: {
        light: [],
        normal: [],
        hard: [],
        adult: []
    },
    currentPlayerIndex: 0,
    gameHistory: []
};

function saveGameState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (e) {
        console.error('保存游戏状态失败:', e);
        return false;
    }
}

function loadGameState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...defaultGameState, ...parsed };
        }
    } catch (e) {
        console.error('加载游戏状态失败:', e);
    }
    return { ...defaultGameState };
}

function clearGameState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (e) {
        console.error('清除游戏状态失败:', e);
        return false;
    }
}

function addCustomQuestion(type, difficulty, content) {
    const state = loadGameState();
    const key = type === 'truth' ? 'customTruth' : 'customDare';
    
    if (!state[key][difficulty]) {
        state[key][difficulty] = [];
    }
    
    state[key][difficulty].push({
        id: Date.now(),
        content: content,
        createdAt: new Date().toISOString()
    });
    
    saveGameState(state);
    return state;
}

function deleteCustomQuestion(type, difficulty, id) {
    const state = loadGameState();
    const key = type === 'truth' ? 'customTruth' : 'customDare';
    
    if (state[key][difficulty]) {
        state[key][difficulty] = state[key][difficulty].filter(q => q.id !== id);
        saveGameState(state);
    }
    return state;
}

function getQuestions(type, difficulty) {
    const state = loadGameState();
    const defaultKey = type === 'truth' ? 'defaultTruthQuestions' : 'defaultDareChallenges';
    const customKey = type === 'truth' ? 'customTruth' : 'customDare';
    
    const defaults = window[defaultKey][difficulty] || [];
    const customs = state[customKey][difficulty] || [];
    
    return [
        ...defaults.map(content => ({ type, difficulty, content, isCustom: false })),
        ...customs.map(q => ({ type, difficulty, content: q.content, isCustom: true, id: q.id }))
    ];
}

function addPlayer(name) {
    const state = loadGameState();
    state.players.push({ name, score: 0 });
    saveGameState(state);
    return state;
}

function updatePlayerScore(index, score) {
    const state = loadGameState();
    if (state.players[index]) {
        state.players[index].score = score;
        saveGameState(state);
    }
    return state;
}

function addScoreToPlayer(index, points) {
    const state = loadGameState();
    if (state.players[index]) {
        state.players[index].score += points;
        saveGameState(state);
    }
    return state;
}

function getSortedPlayers() {
    const state = loadGameState();
    return [...state.players].sort((a, b) => b.score - a.score);
}