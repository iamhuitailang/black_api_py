const GameData = (function() {
    const STATS_KEY = 'moto_race_stats';
    const GAME_STATE_KEY = 'moto_race_game_state';
    const SAVE_INTERVAL = 1000;

    let stats = {
        bestRank: null,
        bestTime: null,
        bestOvertakes: 0,
        totalRaces: 0,
        fastestTime: null,
        mostOvertakes: 0
    };

    let currentGameState = null;

    function init() {
        loadStats();
        loadGameState();
    }

    function loadStats() {
        try {
            const saved = localStorage.getItem(STATS_KEY);
            if (saved) {
                stats = { ...stats, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }
    }

    function saveStats() {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save stats:', e);
        }
    }

    function getStats() {
        return { ...stats };
    }

    function updateRaceResult(rank, timeSeconds, overtakes) {
        stats.totalRaces++;
        
        if (stats.bestRank === null || rank < stats.bestRank) {
            stats.bestRank = rank;
        }
        
        if (stats.bestTime === null || timeSeconds < stats.bestTime) {
            stats.bestTime = timeSeconds;
            stats.fastestTime = timeSeconds;
        }
        
        if (overtakes > stats.bestOvertakes) {
            stats.bestOvertakes = overtakes;
            stats.mostOvertakes = overtakes;
        }
        
        saveStats();
        return getStats();
    }

    function formatTime(seconds) {
        if (seconds === null) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function saveGameState(gameState) {
        try {
            currentGameState = {
                ...gameState,
                timestamp: Date.now()
            };
            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(currentGameState));
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    }

    function loadGameState() {
        try {
            const saved = localStorage.getItem(GAME_STATE_KEY);
            if (saved) {
                currentGameState = JSON.parse(saved);
                return currentGameState;
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
        return null;
    }

    function clearGameState() {
        currentGameState = null;
        try {
            localStorage.removeItem(GAME_STATE_KEY);
        } catch (e) {
            console.error('Failed to clear game state:', e);
        }
    }

    function hasSavedGame() {
        const saved = loadGameState();
        if (!saved) return false;
        const age = Date.now() - saved.timestamp;
        return age < 3600000;
    }

    init();

    return {
        getStats,
        updateRaceResult,
        formatTime,
        saveGameState,
        loadGameState,
        clearGameState,
        hasSavedGame
    };
})();
