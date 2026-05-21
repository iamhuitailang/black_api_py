const AI = (function() {
    const AI_STATE = {
        IDLE: 'idle',
        CHASING: 'chasing',
        RETREATING: 'retreating',
        ATTACKING: 'attacking',
        JUMPING: 'jumping',
        DODGING: 'dodging'
    };

    class AIController {
        constructor(character) {
            this.character = character;
            this.state = AI_STATE.IDLE;
            this.stateTimer = 0;
            this.decisionTimer = 0;
            this.decisionInterval = 500 + Math.random() * 500;
            this.targetX = 0;
            this.jumpCooldown = 0;
            this.difficulty = 1;
        }

        update(deltaTime, playerCharacter) {
            this.stateTimer -= deltaTime;
            this.decisionTimer -= deltaTime;
            this.jumpCooldown -= deltaTime;

            if (this.stateTimer <= 0) {
                this.makeDecision(playerCharacter);
            }

            this.executeState(playerCharacter);
        }

        makeDecision(playerCharacter) {
            const distanceX = playerCharacter.getCenterX() - this.character.getCenterX();
            const distanceY = playerCharacter.getCenterY() - this.character.getCenterY();
            const absDistanceX = Math.abs(distanceX);
            const absDistanceY = Math.abs(distanceY);

            this.decisionTimer = this.decisionInterval;
            this.stateTimer = 300 + Math.random() * 500;

            if (this.character.onEdge) {
                this.state = AI_STATE.RETREATING;
                this.targetX = 500;
                return;
            }

            if (playerCharacter.isAttacking() && absDistanceX < 100) {
                if (Math.random() < 0.6 * this.difficulty) {
                    this.state = AI_STATE.DODGING;
                    return;
                }
            }

            const heightAboveGround = GROUND_Y - this.character.y - this.character.height;

            if (heightAboveGround < 50 && this.character.stamina > 30) {
                if (absDistanceX < 80 && absDistanceY < 100) {
                    this.state = AI_STATE.ATTACKING;
                    return;
                }
            }

            if (heightAboveGround >= 50 && heightAboveGround < 150 && this.character.stamina > 40) {
                if (absDistanceX < 100 && absDistanceY < 150) {
                    this.state = AI_STATE.ATTACKING;
                    return;
                }
            }

            if (heightAboveGround >= 150 && this.character.stamina > 50) {
                if (absDistanceX < 120) {
                    this.state = AI_STATE.ATTACKING;
                    return;
                }
            }

            if (this.character.isGrounded && this.jumpCooldown <= 0) {
                if (Math.random() < 0.4 * this.difficulty) {
                    this.state = AI_STATE.JUMPING;
                    this.jumpCooldown = 1000 + Math.random() * 1000;
                    return;
                }
            }

            if (absDistanceX > 150) {
                this.state = AI_STATE.CHASING;
                this.targetX = playerCharacter.getCenterX() + (Math.random() - 0.5) * 100;
            } else if (absDistanceX < 60 && this.character.stamina < 30) {
                this.state = AI_STATE.RETREATING;
                this.targetX = distanceX > 0 ? this.character.x - 100 : this.character.x + 100;
            } else {
                this.state = AI_STATE.IDLE;
            }
        }

        executeState(playerCharacter) {
            const heightAboveGround = GROUND_Y - this.character.y - this.character.height;

            switch (this.state) {
                case AI_STATE.CHASING:
                    this.chasePlayer();
                    break;
                case AI_STATE.RETREATING:
                    this.retreat();
                    break;
                case AI_STATE.ATTACKING:
                    this.tryAttack(playerCharacter, heightAboveGround);
                    break;
                case AI_STATE.JUMPING:
                    this.jump();
                    break;
                case AI_STATE.DODGING:
                    this.dodge(playerCharacter);
                    break;
                case AI_STATE.IDLE:
                    this.idle(playerCharacter);
                    break;
            }
        }

        chasePlayer() {
            const diff = this.targetX - this.character.getCenterX();
            if (Math.abs(diff) > 20) {
                if (diff > 0) {
                    this.character.moveRight();
                } else {
                    this.character.moveLeft();
                }
            }
        }

        retreat() {
            const diff = this.targetX - this.character.getCenterX();
            if (Math.abs(diff) > 20) {
                if (diff > 0) {
                    this.character.moveRight();
                } else {
                    this.character.moveLeft();
                }
            }
        }

        tryAttack(playerCharacter, heightAboveGround) {
            const distanceX = playerCharacter.getCenterX() - this.character.getCenterX();
            
            if (distanceX > 0) {
                this.character.facingRight = true;
            } else {
                this.character.facingRight = false;
            }

            if (heightAboveGround < 50) {
                this.character.attack('charge');
            } else if (heightAboveGround < 150) {
                this.character.attack('kick');
            } else {
                this.character.attack('special');
            }

            const diff = playerCharacter.getCenterX() - this.character.getCenterX();
            if (Math.abs(diff) > 10) {
                if (diff > 0) {
                    this.character.moveRight();
                } else {
                    this.character.moveLeft();
                }
            }
        }

        jump() {
            if (this.character.isGrounded) {
                const highJump = Math.random() > 0.5;
                this.character.setJumpHeight(highJump ? 1.3 : 1);
                this.character.jump(highJump);
                this.state = AI_STATE.IDLE;
            }
        }

        dodge(playerCharacter) {
            const distanceX = playerCharacter.getCenterX() - this.character.getCenterX();
            if (distanceX > 0) {
                this.character.moveLeft();
            } else {
                this.character.moveRight();
            }
            if (this.character.isGrounded && Math.random() < 0.3) {
                this.character.jump();
            }
        }

        idle(playerCharacter) {
            const distanceX = playerCharacter.getCenterX() - this.character.getCenterX();
            if (Math.abs(distanceX) > 10) {
                if (distanceX > 0) {
                    this.character.facingRight = true;
                } else {
                    this.character.facingRight = false;
                }
            }
        }

        serialize() {
            return {
                state: this.state,
                stateTimer: this.stateTimer,
                decisionTimer: this.decisionTimer,
                targetX: this.targetX,
                jumpCooldown: this.jumpCooldown,
                difficulty: this.difficulty
            };
        }

        static deserialize(data, character) {
            const ai = new AIController(character);
            ai.state = data.state;
            ai.stateTimer = data.stateTimer;
            ai.decisionTimer = data.decisionTimer;
            ai.targetX = data.targetX;
            ai.jumpCooldown = data.jumpCooldown;
            ai.difficulty = data.difficulty || 1;
            return ai;
        }
    }

    return {
        AIController,
        AI_STATE
    };
})();