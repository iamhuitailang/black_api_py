export class AI {
    constructor(character, difficulty = 'normal') {
        this.character = character;
        this.difficulty = difficulty;
        this.reactionTime = this.getReactionTime();
        this.lastDecision = 0;
        this.currentAction = {
            left: false,
            right: false,
            up: false,
            down: false,
            light: false,
            heavy: false,
            cone: false,
            ultimate: false,
            jumpAttack: false
        };
        this.actionTimer = 0;
    }

    getReactionTime() {
        switch (this.difficulty) {
            case 'easy': return 300;
            case 'hard': return 80;
            default: return 150;
        }
    }

    update(deltaTime, opponent) {
        this.lastDecision += deltaTime;
        
        if (this.lastDecision >= this.reactionTime) {
            this.makeDecision(opponent);
            this.lastDecision = 0;
        }

        this.actionTimer -= deltaTime;
        if (this.actionTimer <= 0) {
            this.resetAttackButtons();
        }

        return this.currentAction;
    }

    makeDecision(opponent) {
        const char = this.character;
        const distance = Math.abs(opponent.x - char.x);
        const direction = opponent.x > char.x ? 1 : -1;
        const shouldFace = opponent.x > char.x ? 1 : -1;
        char.facing = shouldFace;

        const random = Math.random();
        const aggression = this.getAggressionLevel();
        
        if (char.energy >= 50 && distance < 300 && random < 0.3 * aggression) {
            this.currentAction.ultimate = true;
            this.actionTimer = 200;
            return;
        }

        if (distance > 250) {
            this.currentAction.left = direction < 0;
            this.currentAction.right = direction > 0;
            
            if (random < 0.2 * aggression) {
                this.currentAction.cone = true;
                this.actionTimer = 150;
            }
        } else if (distance > 100) {
            if (random < 0.4 * aggression) {
                this.currentAction.right = direction > 0;
                this.currentAction.left = direction < 0;
            }
            
            if (random < 0.5 * aggression) {
                if (random < 0.3) {
                    this.currentAction.heavy = true;
                } else {
                    this.currentAction.light = true;
                }
                this.actionTimer = 200;
            } else if (random < 0.6) {
                this.currentAction.cone = true;
                this.actionTimer = 150;
            }
        } else {
            if (random < 0.6 * aggression) {
                if (char.isGrounded && random < 0.3) {
                    this.currentAction.up = true;
                    setTimeout(() => {
                        this.currentAction.jumpAttack = true;
                        this.actionTimer = 100;
                    }, 200);
                } else if (random < 0.5) {
                    this.currentAction.heavy = true;
                } else {
                    this.currentAction.light = true;
                }
                this.actionTimer = 200;
            }
            
            if (random < 0.2) {
                this.currentAction.left = direction > 0;
                this.currentAction.right = direction < 0;
            }
        }

        if (opponent.isAttacking && opponent.attackPhase === 'active') {
            if (random < 0.4) {
                this.currentAction.left = direction > 0;
                this.currentAction.right = direction < 0;
            }
            if (random < 0.2 && char.isGrounded) {
                this.currentAction.up = true;
            }
        }
    }

    resetAttackButtons() {
        this.currentAction.light = false;
        this.currentAction.heavy = false;
        this.currentAction.cone = false;
        this.currentAction.ultimate = false;
        this.currentAction.jumpAttack = false;
    }

    getAggressionLevel() {
        switch (this.difficulty) {
            case 'easy': return 0.5;
            case 'hard': return 1.2;
            default: return 0.8;
        }
    }

    getUltimateForCharacter() {
        switch (this.character.type) {
            case 'emperor': return 'polarWave';
            case 'little': return 'iceStorm';
            case 'fat': return 'whaleRush';
            default: return 'polarWave';
        }
    }
}