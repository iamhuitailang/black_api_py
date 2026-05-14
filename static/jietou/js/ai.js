class AIController {
    constructor(character) {
        this.character = character;
        this.state = GameData.aiStates.IDLE;
        this.stateTimer = 0;
        this.decisionInterval = 500;
        this.nextDecisionTime = 0;
        this.reactionTime = 200;
    }

    update(deltaTime, playerCharacter, inputManager) {
        this.stateTimer += deltaTime;

        const distance = Math.abs(this.character.x - playerCharacter.x);
        const playerAttacking = playerCharacter.state === GameData.states.ATTACK || 
                                 playerCharacter.state === GameData.states.SPECIAL;

        if (Date.now() > this.nextDecisionTime) {
            this.makeDecision(distance, playerAttacking, playerCharacter);
            this.nextDecisionTime = Date.now() + this.decisionInterval;
        }

        this.executeState(distance, playerCharacter);
    }

    makeDecision(distance, playerAttacking, playerCharacter) {
        const healthRatio = this.character.health / this.character.maxHealth;
        
        if (playerAttacking && distance < 150) {
            this.state = GameData.aiStates.DEFEND;
        } else if (healthRatio < 0.3 && distance < 100) {
            this.state = GameData.aiStates.RETREAT;
        } else if (distance > 200) {
            this.state = GameData.aiStates.APPROACH;
        } else if (distance < 120 && Math.random() > 0.4) {
            this.state = GameData.aiStates.ATTACK;
        } else {
            this.state = GameData.aiStates.IDLE;
        }
    }

    executeState(distance, playerCharacter) {
        switch (this.state) {
            case GameData.aiStates.APPROACH:
                this.approach(playerCharacter);
                break;
            case GameData.aiStates.ATTACK:
                this.attack(playerCharacter, distance);
                break;
            case GameData.aiStates.DEFEND:
                this.defend();
                break;
            case GameData.aiStates.RETREAT:
                this.retreat(playerCharacter);
                break;
            case GameData.aiStates.IDLE:
                this.idle();
                break;
        }
    }

    approach(playerCharacter) {
        const minDistance = 100;
        const distance = this.character.x - playerCharacter.x;
        
        if (Math.abs(distance) > minDistance) {
            if (this.character.x < playerCharacter.x) {
                this.character.moveRight();
            } else {
                this.character.moveLeft();
            }
        } else {
            this.character.stopMoving();
        }
    }

    attack(playerCharacter, distance) {
        this.character.stopMoving();

        const attackChoice = Math.random();
        
        if (distance < 80) {
            if (attackChoice < 0.4) {
                this.character.attack('lightPunch');
            } else if (attackChoice < 0.7) {
                this.character.attack('heavyPunch');
            } else if (attackChoice < 0.85) {
                this.character.attack('lightKick');
            } else {
                this.character.attack('heavyKick');
            }
        } else if (distance < 150) {
            if (attackChoice < 0.3 && this.character.moves.includes('hadouken')) {
                this.character.specialMove('hadouken');
            } else if (attackChoice < 0.5 && this.character.moves.includes('kikouken')) {
                this.character.specialMove('kikouken');
            } else {
                this.approach(playerCharacter);
            }
        } else {
            this.approach(playerCharacter);
        }
    }

    defend() {
        if (Math.random() > 0.5) {
            this.character.block();
        } else {
            this.character.jump();
        }
    }

    retreat(playerCharacter) {
        if (this.character.x < playerCharacter.x) {
            this.character.moveLeft();
        } else {
            this.character.moveRight();
        }
    }

    idle() {
        this.character.stopMoving();
    }

    reset() {
        this.state = GameData.aiStates.IDLE;
        this.stateTimer = 0;
    }
}