const Storage = (function() {
    const STORAGE_KEY = 'circus_trampoline_battle';

    function getDefaultState() {
        return {
            gameState: GAME_STATES.CHARACTER_SELECT,
            selectedCharacter: null,
            aiCharacter: null,
            player1State: null,
            player2State: null,
            aiState: null,
            winner: null,
            wins: { player: 0, ai: 0 },
            timestamp: Date.now()
        };
    }

    function save(gameState) {
        try {
            const stateToSave = {
                ...gameState,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    }

    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                const now = Date.now();
                if (state.timestamp && (now - state.timestamp) < 24 * 60 * 60 * 1000) {
                    return state;
                }
            }
        } catch (e) {
            console.error('加载游戏状态失败:', e);
        }
        return getDefaultState();
    }

    function clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    }

    function savePlayerState(player, isPlayer1) {
        const currentState = load();
        const key = isPlayer1 ? 'player1State' : 'player2State';
        currentState[key] = player.serialize();
        save(currentState);
    }

    function saveGameProgress(gameState, selectedChar, aiChar, player1, player2, aiController, winner = null) {
        const state = {
            gameState: gameState,
            selectedCharacter: selectedChar,
            aiCharacter: aiChar,
            player1State: player1 ? player1.serialize() : null,
            player2State: player2 ? player2.serialize() : null,
            aiState: aiController ? aiController.serialize() : null,
            winner: winner,
            wins: load().wins || { player: 0, ai: 0 },
            timestamp: Date.now()
        };
        if (winner === 'player') {
            state.wins.player++;
        } else if (winner === 'ai') {
            state.wins.ai++;
        }
        save(state);
    }

    return {
        save,
        load,
        clear,
        savePlayerState,
        saveGameProgress,
        getDefaultState
    };
})();