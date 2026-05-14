import { ATTACK_TYPES } from './constants.js';

export class AIController {
    constructor(character, aiType = 'normal') {
        this.character = character;
        this.aiType = aiType;
        this.decisionTimer = 0;
        this.decisionInterval = 500 + Math.random() * 500;
        this.currentAction = 'idle';
        this.actionDuration = 0;
    }

    update(deltaTime, player) {
        if (this.character.isDead || this.character.isStunned || this.character.isAttacking) {
            return;
        }

        this.decisionTimer += deltaTime;
        this.actionDuration -= deltaTime;

        if (this.decisionTimer >= this.decisionInterval || this.actionDuration <= 0) {
            this.makeDecision(player);
            this.decisionTimer = 0;
            this.decisionInterval = 500 + Math.random() * 500;
        }

        this.executeAction(player);
    }

    makeDecision(player) {
        const dist = Math.abs(this.character.x - player.x);
        const playerAttacking = player.isAttacking;

        switch (this.aiType) {
            case 'aggressive':
                this.aggressiveAI(dist, playerAttacking);
                break;
            case 'defensive':
                this.defensiveAI(dist, playerAttacking);
                break;
            case 'evasive':
                this.evasiveAI(dist, playerAttacking);
                break;
            case 'boss':
                this.bossAI(dist, playerAttacking);
                break;
            default:
                this.normalAI(dist, playerAttacking);
        }
    }

    normalAI(dist, playerAttacking) {
        if (playerAttacking && dist < 150) {
            this.currentAction = Math.random() > 0.5 ? 'block' : 'backward';
            this.actionDuration = 300;
        } else if (dist < 100) {
            const actions = ['light_attack', 'light_attack', 'heavy_attack', 'block'];
            this.currentAction = actions[Math.floor(Math.random() * actions.length)];
            this.actionDuration = 400;
        } else if (dist < 200) {
            this.currentAction = 'forward';
            this.actionDuration = 200;
        } else {
            this.currentAction = 'idle';
            this.actionDuration = 300;
        }
    }

    aggressiveAI(dist, playerAttacking) {
        if (dist > 80) {
            this.currentAction = 'forward';
            this.actionDuration = 150;
        } else {
            const attacks = ['light_attack', 'light_attack', 'heavy_attack', 'heavy_attack'];
            this.currentAction = attacks[Math.floor(Math.random() * attacks.length)];
            this.actionDuration = 350;
        }
    }

    defensiveAI(dist, playerAttacking) {
        if (playerAttacking && dist < 150) {
            this.currentAction = 'block';
            this.actionDuration = 500;
        } else if (dist < 100) {
            this.currentAction = Math.random() > 0.3 ? 'heavy_attack' : 'backward';
            this.actionDuration = 400;
        } else if (dist > 250) {
            this.currentAction = 'forward';
            this.actionDuration = 200;
        } else {
            this.currentAction = 'idle';
            this.actionDuration = 300;
        }
    }

    evasiveAI(dist, playerAttacking) {
        if (playerAttacking && dist < 150) {
            this.currentAction = Math.random() > 0.5 ? 'jump' : 'backward';
            this.actionDuration = 200;
        } else if (dist < 90 && Math.random() > 0.7) {
            this.currentAction = 'light_attack';
            this.actionDuration = 300;
        } else if (dist > 300) {
            this.currentAction = 'forward';
            this.actionDuration = 150;
        } else if (dist < 200) {
            this.currentAction = 'backward';
            this.actionDuration = 150;
        } else {
            this.currentAction = 'idle';
            this.actionDuration = 200;
        }
    }

    bossAI(dist, playerAttacking) {
        if (this.character.energy >= 100 && dist < 200) {
            this.currentAction = 'ultimate';
            this.actionDuration = 500;
            return;
        }

        if (playerAttacking && dist < 150) {
            const actions = ['block', 'backward', 'jump', 'light_attack'];
            this.currentAction = actions[Math.floor(Math.random() * actions.length)];
            this.actionDuration = 250;
        } else if (dist < 100) {
            const attacks = ['light_attack', 'light_attack', 'heavy_attack', 'heavy_attack', 'block'];
            this.currentAction = attacks[Math.floor(Math.random() * attacks.length)];
            this.actionDuration = 300;
        } else if (dist < 300) {
            this.currentAction = 'forward';
            this.actionDuration = 150;
        } else {
            this.currentAction = 'idle';
            this.actionDuration = 200;
        }
    }

    executeAction(player) {
        this.character.facing = player.x > this.character.x ? 1 : -1;
        this.character.isBlocking = false;

        switch (this.currentAction) {
            case 'forward':
                this.character.vx = this.character.facing * this.character.speed;
                this.character.state = 'walk';
                break;
            case 'backward':
                this.character.vx = -this.character.facing * this.character.speed;
                this.character.state = 'walk';
                break;
            case 'jump':
                if (!this.character.isJumping) {
                    this.character.vy = -this.character.jumpPower;
                    this.character.isJumping = true;
                    this.character.state = 'jump';
                }
                break;
            case 'block':
                this.character.isBlocking = true;
                this.character.state = 'block';
                this.character.vx = 0;
                break;
            case 'light_attack':
                this.character.lightAttack();
                break;
            case 'heavy_attack':
                this.character.heavyAttack();
                break;
            case 'ultimate':
                if (this.character.energy >= 100) {
                    this.character.ultimate();
                }
                break;
            default:
                this.character.vx = 0;
                if (!this.character.isJumping) {
                    this.character.state = 'idle';
                }
        }
    }
}
