import { SKILL_DATA } from './config.js';

export class AIController {
    constructor(character, player) {
        this.character = character;
        this.player = player;
        this.actionTimer = 0;
        this.nextActionDelay = 500 + Math.random() * 1000;
        this.currentAction = null;
        this.actionDuration = 0;
        this.difficulty = 1;
    }

    update(deltaTime) {
        if (this.character.state === 'dead') return;
        
        this.actionTimer += deltaTime;
        
        const distance = Math.abs(this.character.x - this.player.x);
        const playerDirection = this.player.x > this.character.x ? 1 : -1;
        
        if (distance < 60) {
            this.character.move(-playerDirection);
            return;
        }
        
        if (this.actionTimer >= this.nextActionDelay) {
            this.actionTimer = 0;
            this.decideAction(distance, playerDirection);
        }
        
        this.executeAction(deltaTime, distance, playerDirection);
    }

    decideAction(distance, playerDirection) {
        const rand = Math.random();
        const hpRatio = this.character.hp / this.character.maxHp;
        
        if (hpRatio < 0.3 && rand < 0.3) {
            this.currentAction = 'retreat';
            this.nextActionDelay = 300 + Math.random() * 500;
            return;
        }
        
        if (distance < 100) {
            if (rand < 0.4) {
                this.currentAction = 'attack';
                this.nextActionDelay = 600 + Math.random() * 400;
            } else if (rand < 0.7) {
                this.currentAction = 'heavy';
                this.nextActionDelay = 800 + Math.random() * 600;
            } else if (rand < 0.85 && this.character.energy >= 30) {
                this.currentAction = 'skill';
                this.nextActionDelay = 1000 + Math.random() * 500;
            } else {
                this.currentAction = 'block';
                this.nextActionDelay = 400 + Math.random() * 600;
            }
        } else if (distance < 200) {
            if (rand < 0.5) {
                this.currentAction = 'approach';
                this.nextActionDelay = 200 + Math.random() * 300;
            } else if (rand < 0.7 && this.character.energy >= 30) {
                this.currentAction = 'skill';
                this.nextActionDelay = 800 + Math.random() * 400;
            } else {
                this.currentAction = 'jump';
                this.nextActionDelay = 600 + Math.random() * 800;
            }
        } else {
            if (rand < 0.7) {
                this.currentAction = 'approach';
                this.nextActionDelay = 150 + Math.random() * 200;
            } else if (this.character.energy >= this.character.maxEnergy && rand < 0.4) {
                this.currentAction = 'ultimate';
                this.nextActionDelay = 1000 + Math.random() * 500;
            } else {
                this.currentAction = 'skill';
                this.nextActionDelay = 800 + Math.random() * 600;
            }
        }
        
        if (this.character.energy >= this.character.maxEnergy && rand < 0.25) {
            this.currentAction = 'ultimate';
            this.nextActionDelay = 500 + Math.random() * 500;
        }
    }

    executeAction(deltaTime, distance, playerDirection) {
        if (!this.currentAction || this.character.isAttacking() || this.character.state === 'hurt') {
            this.character.move(0);
            this.character.block(false);
            return;
        }
        
        switch (this.currentAction) {
            case 'approach':
                this.character.move(playerDirection);
                this.character.block(false);
                break;
                
            case 'retreat':
                this.character.move(-playerDirection);
                this.character.block(false);
                break;
                
            case 'attack':
                this.character.move(0);
                this.character.block(false);
                if (!this.character.isAttacking()) {
                    if (!this.character.isGrounded) {
                        this.character.attack('airLight');
                    } else {
                        this.character.attack('light');
                    }
                }
                break;
                
            case 'heavy':
                this.character.move(0);
                this.character.block(false);
                if (!this.character.isAttacking()) {
                    if (!this.character.isGrounded) {
                        this.character.attack('airHeavy');
                    } else {
                        this.character.attack('heavy');
                    }
                }
                break;
                
            case 'jump':
                this.character.move(playerDirection * 0.5);
                this.character.block(false);
                if (this.character.isGrounded) {
                    this.character.jump();
                }
                break;
                
            case 'block':
                this.character.move(0);
                this.character.block(true);
                break;
                
            case 'skill':
                this.character.move(0);
                this.character.block(false);
                if (!this.character.isAttacking()) {
                    this.useSkill();
                }
                break;
                
            case 'ultimate':
                this.character.move(0);
                this.character.block(false);
                if (!this.character.isAttacking() && this.character.energy >= this.character.maxEnergy) {
                    this.useUltimate();
                }
                break;
                
            default:
                this.character.move(0);
                this.character.block(false);
                break;
        }
    }

    useSkill() {
        const skills = this.getAvailableSkills();
        if (skills.length > 0) {
            const skill = skills[Math.floor(Math.random() * skills.length)];
            this.character.useSkill(skill);
        }
    }

    useUltimate() {
        const ultimates = this.getAvailableUltimates();
        if (ultimates.length > 0) {
            const ultimate = ultimates[Math.floor(Math.random() * ultimates.length)];
            this.character.useUltimate(ultimate);
        }
    }

    getAvailableSkills() {
        const charType = this.character.type;
        if (charType === 'water') {
            return ['waterWave', 'dragonRush'];
        } else if (charType === 'fire') {
            return ['flameSpin'];
        } else if (charType === 'earth') {
            return ['stoneShield', 'quake'];
        }
        return [];
    }

    getAvailableUltimates() {
        const charType = this.character.type;
        if (charType === 'water') {
            return ['dragonRush'];
        } else if (charType === 'fire') {
            return ['flameSpin'];
        } else if (charType === 'earth') {
            return ['quake'];
        }
        return [];
    }

    reset() {
        this.actionTimer = 0;
        this.nextActionDelay = 500 + Math.random() * 1000;
        this.currentAction = null;
    }
}
