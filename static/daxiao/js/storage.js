const STORAGE_KEY = 'blackjack_game_state_v2';

function saveGameState(gameState, extraData = {}) {
    try {
        const stateToSave = {
            chips: gameState.chips,
            bet: gameState.bet,
            debt: gameState.debt,
            maxDebt: gameState.maxDebt,
            state: gameState.state,
            result: gameState.result,
            deck: gameState.deck,
            playerHand: {
                cards: gameState.playerHand.cards,
                isFaceDown: gameState.playerHand.isFaceDown
            },
            dealerHand: {
                cards: gameState.dealerHand.cards,
                isFaceDown: gameState.dealerHand.isFaceDown
            },
            stats: { ...gameState.stats },
            ...extraData
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        return true;
    } catch (error) {
        console.error('保存游戏状态失败:', error);
        return false;
    }
}

function loadGameState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return null;
        }

        const parsed = JSON.parse(saved);
        return parsed;
    } catch (error) {
        console.error('加载游戏状态失败:', error);
        return null;
    }
}

function applySavedState(gameState, savedState) {
    if (!savedState) return;

    if (typeof savedState.chips === 'number') {
        gameState.chips = savedState.chips;
    }

    if (typeof savedState.bet === 'number') {
        gameState.bet = savedState.bet;
    }

    if (typeof savedState.debt === 'number') {
        gameState.debt = savedState.debt;
    }

    if (typeof savedState.maxDebt === 'number') {
        gameState.maxDebt = savedState.maxDebt;
    }

    if (typeof savedState.state === 'string') {
        gameState.state = savedState.state;
    }

    if (typeof savedState.result !== 'undefined') {
        gameState.result = savedState.result;
    }

    if (Array.isArray(savedState.deck)) {
        gameState.deck = savedState.deck;
    }

    if (savedState.playerHand) {
        gameState.playerHand = {
            cards: Array.isArray(savedState.playerHand.cards) ? savedState.playerHand.cards : [],
            isFaceDown: Array.isArray(savedState.playerHand.isFaceDown) ? savedState.playerHand.isFaceDown : []
        };
    }

    if (savedState.dealerHand) {
        gameState.dealerHand = {
            cards: Array.isArray(savedState.dealerHand.cards) ? savedState.dealerHand.cards : [],
            isFaceDown: Array.isArray(savedState.dealerHand.isFaceDown) ? savedState.dealerHand.isFaceDown : []
        };
    }

    if (savedState.stats) {
        const stats = savedState.stats;
        gameState.stats = {
            wins: typeof stats.wins === 'number' ? stats.wins : 0,
            losses: typeof stats.losses === 'number' ? stats.losses : 0,
            pushes: typeof stats.pushes === 'number' ? stats.pushes : 0,
            currentStreak: typeof stats.currentStreak === 'number' ? stats.currentStreak : 0,
            maxStreak: typeof stats.maxStreak === 'number' ? stats.maxStreak : 0,
            totalProfit: typeof stats.totalProfit === 'number' ? stats.totalProfit : 0,
            currentScore: typeof stats.currentScore === 'number' ? stats.currentScore : 0,
            highScore: typeof stats.highScore === 'number' ? stats.highScore : 0
        };
    }
}

function clearGameState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('清除游戏状态失败:', error);
        return false;
    }
}

function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function autoSave(gameState) {
    saveGameState(gameState);
}

function setupAutoSave(gameState, intervalMs = 3000) {
    setInterval(() => {
        autoSave(gameState);
    }, intervalMs);

    window.addEventListener('beforeunload', () => {
        autoSave(gameState);
    });

    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            autoSave(gameState);
        }
    });
}

export {
    STORAGE_KEY,
    saveGameState,
    loadGameState,
    applySavedState,
    clearGameState,
    isStorageAvailable,
    autoSave,
    setupAutoSave
};
