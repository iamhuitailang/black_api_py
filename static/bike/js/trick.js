import { CONFIG } from './config.js';

export class TrickManager {
    constructor() {
        this.currentTrick = null;
        this.trickStartTime = 0;
        this.tricksCompleted = [];
        this.activeTricks = new Set();
    }

    reset() {
        this.currentTrick = null;
        this.trickStartTime = 0;
        this.tricksCompleted = [];
        this.activeTricks.clear();
    }

    checkTrick(input, player, currentTime) {
        if (!player.canDoTrick()) return null;

        let trickType = null;

        if (input.isDoubleLeft()) {
            trickType = 'BACKFLIP';
        } else if (input.isDoubleRight()) {
            trickType = 'FRONTFLIP';
        } else if (input.isTrick()) {
            if (player.airTime > 500) {
                trickType = 'SUPERMAN';
            } else {
                trickType = 'TABLETOP';
            }
        }

        if (trickType && !this.activeTricks.has(trickType)) {
            const trickConfig = CONFIG.TRICKS[trickType];
            if (player.airTime >= trickConfig.minAirTime) {
                this.activeTricks.add(trickType);
                return {
                    type: trickType,
                    name: trickConfig.name,
                    score: Math.floor(trickConfig.score * trickConfig.difficulty),
                    time: currentTime
                };
            }
        }

        return null;
    }

    onLanding() {
        this.activeTricks.clear();
        this.currentTrick = null;
    }

    completeTrick(trick) {
        if (trick) {
            this.tricksCompleted.push(trick);
            return trick.score;
        }
        return 0;
    }

    getTrickCount() {
        return this.tricksCompleted.length;
    }

    getTotalScore() {
        return this.tricksCompleted.reduce((sum, t) => sum + t.score, 0);
    }

    renderTrickIndicator(ctx, x, y, trick) {
        if (!trick) return;

        ctx.save();
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        
        ctx.fillText(trick.name, x, y - 60);
        ctx.fillText(`+${trick.score}`, x, y - 35);
        
        ctx.restore();
    }
}
