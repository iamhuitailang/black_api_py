const STORAGE_KEY = 'balance_ball_game_state';

export class StorageManager {
    saveGame(gameState) {
        try {
            const data = JSON.stringify(gameState);
            localStorage.setItem(STORAGE_KEY, data);
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    loadGame() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        return null;
    }

    clearGame() {
        localStorage.removeItem(STORAGE_KEY);
    }

    saveProgress(levelId, stars, time) {
        const progress = this.loadProgress();
        if (!progress[levelId] || progress[levelId].stars < stars) {
            progress[levelId] = { stars, bestTime: time };
        }
        try {
            localStorage.setItem('balance_ball_progress', JSON.stringify(progress));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
    }

    loadProgress() {
        try {
            const data = localStorage.getItem('balance_ball_progress');
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load progress:', e);
        }
        return {};
    }
}
