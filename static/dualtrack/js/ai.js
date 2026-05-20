import { OBSTACLE_TYPES, TRACK_WIDTH } from './config.js';

export class AIController {
    constructor(rider, difficulty = 0.7) {
        this.rider = rider;
        this.difficulty = difficulty;
        this.decisionTimer = 0;
        this.currentDecision = null;
        this.targetLane = 0;
    }

    update(deltaTime, track, itemManager, allRiders) {
        if (this.rider.finished || this.rider.isCrashed) {
            return { left: false, right: false, up: false, down: false, useItem: false };
        }

        this.decisionTimer -= deltaTime;
        if (this.decisionTimer <= 0) {
            this.makeDecision(track, itemManager, allRiders);
            this.decisionTimer = 200 + Math.random() * 300;
        }

        return this.executeDecision(track);
    }

    makeDecision(track, itemManager, allRiders) {
        const myPosition = this.rider.distance;
        const myLane = this.rider.lateralPosition;
        
        const obstacle = track.getObstacleAt(myPosition + 100);
        if (obstacle) {
            this.currentDecision = this.handleObstacle(obstacle, myLane);
            return;
        }
        
        const nearbyItems = itemManager.getItemsInRange(myPosition, myPosition + 200);
        if (nearbyItems.length > 0 && !this.rider.heldItem) {
            const targetItem = nearbyItems[0];
            this.targetLane = targetItem.lateralOffset;
            this.currentDecision = { type: 'collect', target: targetItem };
            return;
        }
        
        if (this.rider.heldItem && Math.random() < 0.3 * this.difficulty) {
            const nearbyOpponents = allRiders.filter(r => 
                r !== this.rider && 
                !r.finished &&
                Math.abs(r.distance - myPosition) < 150
            );
            if (nearbyOpponents.length > 0) {
                this.currentDecision = { type: 'useItem' };
                return;
            }
        }
        
        if (this.rider.balance < 0.3) {
            this.currentDecision = { type: 'recover' };
            return;
        }
        
        const curve = track.getCurveAt(myPosition + 50);
        if (Math.abs(curve) > 40) {
            this.currentDecision = { type: 'corner', curve };
            return;
        }
        
        this.currentDecision = { type: 'speed' };
    }

    handleObstacle(obstacle, myLane) {
        switch (obstacle.type) {
            case OBSTACLE_TYPES.BLOCK:
                if (myLane > 0) {
                    this.targetLane = -TRACK_WIDTH / 4;
                } else {
                    this.targetLane = TRACK_WIDTH / 4;
                }
                return { type: 'evade', obstacle };
                
            case OBSTACLE_TYPES.STEEP:
                return { type: 'slow' };
                
            case OBSTACLE_TYPES.GRAVEL:
                this.targetLane = myLane + (Math.random() - 0.5) * 30;
                return { type: 'gravel' };
                
            case OBSTACLE_TYPES.WINDS:
                this.targetLane = -Math.sin(this.rider.distance * 0.01) * 50;
                return { type: 'wind' };
                
            default:
                return { type: 'speed' };
        }
    }

    executeDecision(track) {
        const input = { left: false, right: false, up: false, down: false, useItem: false };
        
        if (!this.currentDecision) {
            this.currentDecision = { type: 'speed' };
        }
        
        const myLane = this.rider.lateralPosition;
        const laneDiff = this.targetLane - myLane;
        
        switch (this.currentDecision.type) {
            case 'evade':
            case 'collect':
                if (laneDiff > 10) {
                    input.right = true;
                } else if (laneDiff < -10) {
                    input.left = true;
                }
                input.up = this.rider.balance > 0.4;
                break;
                
            case 'slow':
            case 'recover':
                input.down = true;
                if (laneDiff > 5) input.right = true;
                else if (laneDiff < -5) input.left = true;
                break;
                
            case 'corner':
                input.up = this.rider.balance > 0.5;
                const curve = this.currentDecision.curve;
                if (curve > 20) {
                    input.left = true;
                } else if (curve < -20) {
                    input.right = true;
                }
                break;
                
            case 'useItem':
                input.useItem = true;
                input.up = true;
                break;
                
            case 'speed':
            default:
                input.up = this.rider.balance > 0.3;
                if (Math.abs(laneDiff) > 20) {
                    if (laneDiff > 0) input.right = true;
                    else input.left = true;
                }
                break;
        }
        
        return input;
    }

    serialize() {
        return {
            difficulty: this.difficulty,
            targetLane: this.targetLane
        };
    }

    static deserialize(data, rider) {
        const ai = new AIController(rider, data.difficulty || 0.7);
        ai.targetLane = data.targetLane || 0;
        return ai;
    }
}
