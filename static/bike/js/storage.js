import { CONFIG } from './config.js';

export class StorageManager {
    constructor() {
        this.key = CONFIG.STORAGE_KEY;
    }

    save(gameState) {
        try {
            const data = {
                timestamp: Date.now(),
                player: {
                    x: gameState.player.x,
                    y: gameState.player.y,
                    vx: gameState.player.vx,
                    vy: gameState.player.vy,
                    angle: gameState.player.angle,
                    angularVelocity: gameState.player.angularVelocity,
                    isGrounded: gameState.player.isGrounded,
                    isFalling: gameState.player.isFalling,
                    fallTimer: gameState.player.fallTimer
                },
                score: gameState.score,
                time: gameState.time,
                tricksCompleted: gameState.tricksCompleted,
                currentBike: gameState.currentBike,
                cameraX: gameState.cameraX,
                level: gameState.level,
                totalScore: gameState.totalScore,
                totalTricks: gameState.totalTricks
            };
            localStorage.setItem(this.key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            const age = Date.now() - parsed.timestamp;
            
            if (age > 24 * 60 * 60 * 1000) {
                this.clear();
                return null;
            }
            
            return parsed;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    }

    hasSave() {
        return localStorage.getItem(this.key) !== null;
    }

    clear() {
        localStorage.removeItem(this.key);
    }

    saveHighScore(score) {
        try {
            const current = this.getHighScore();
            if (score > current) {
                localStorage.setItem('bike_high_score', score.toString());
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    getHighScore() {
        try {
            const score = localStorage.getItem('bike_high_score');
            return score ? parseInt(score) : 0;
        } catch (e) {
            return 0;
        }
    }
}
