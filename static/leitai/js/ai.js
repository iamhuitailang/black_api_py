const AI = {
    state: AI_STATE.IDLE,
    stateTimer: 0,

    update(enemy, player, state, deltaTime) {
        this.stateTimer -= deltaTime;

        enemy.facingRight = enemy.x < player.x;

        const distance = Math.abs(enemy.x - player.x);

        switch (this.state) {
            case AI_STATE.IDLE:
                this.idleState(enemy, player, distance);
                break;
            case AI_STATE.APPROACH:
                this.approachState(enemy, player, distance);
                break;
            case AI_STATE.ATTACK:
                this.attackState(enemy, player, distance, state);
                break;
            case AI_STATE.DODGE:
                this.dodgeState(enemy, player);
                break;
            case AI_STATE.RETREAT:
                this.retreatState(enemy, player, distance);
                break;
        }
    },

    idleState(enemy, player, distance) {
        enemy.vx = 0;

        if (this.stateTimer <= 0) {
            if (distance > 200) {
                this.changeState(AI_STATE.APPROACH, 1);
            } else if (distance < 100 && Math.random() < 0.3) {
                this.changeState(AI_STATE.ATTACK, 0.5);
            } else if (Math.random() < 0.4) {
                this.changeState(AI_STATE.APPROACH, 0.8);
            } else {
                this.changeState(AI_STATE.IDLE, 0.5 + Math.random() * 0.5);
            }
        }
    },

    approachState(enemy, player, distance) {
        const direction = enemy.x < player.x ? 1 : -1;
        enemy.vx = direction * (enemy.speed * 0.6);

        if (distance < 120) {
            this.changeState(AI_STATE.ATTACK, 0.3);
        } else if (this.stateTimer <= 0) {
            this.changeState(AI_STATE.IDLE, 0.3);
        }
    },

    attackState(enemy, player, distance, state) {
        enemy.vx = 0;

        if (!enemy.isAttacking && this.stateTimer <= 0) {
            const attacks = [ATTACKS.LIGHT_STOMP, ATTACKS.HEAVY_STOMP, ATTACKS.BELLY_SLAP, ATTACKS.ANGRY_ROAR];
            let selectedAttack;

            if (distance < 80) {
                selectedAttack = Math.random() < 0.5 ? ATTACKS.BELLY_SLAP : ATTACKS.LIGHT_STOMP;
            } else if (distance < 150) {
                selectedAttack = Math.random() < 0.5 ? ATTACKS.HEAVY_STOMP : ATTACKS.ANGRY_ROAR;
            } else {
                selectedAttack = ATTACKS.ANGRY_ROAR;
            }

            if (enemy.ultimateGauge >= enemy.maxUltimateGauge && Math.random() < 0.4) {
                selectedAttack = ATTACKS.ULTIMATE_STOMP;
            }

            Combat.startAttack(enemy, selectedAttack);
            
            if (Math.random() < 0.3) {
                this.changeState(AI_STATE.RETREAT, 0.8);
            } else {
                this.changeState(AI_STATE.IDLE, 0.6);
            }
        }
    },

    dodgeState(enemy, player) {
        const direction = enemy.x < player.x ? -1 : 1;
        enemy.vx = direction * enemy.speed;

        if (this.stateTimer <= 0) {
            this.changeState(AI_STATE.IDLE, 0.3);
        }
    },

    retreatState(enemy, player, distance) {
        const direction = enemy.x < player.x ? -1 : 1;
        enemy.vx = direction * enemy.speed * 0.7;

        if (distance > 250 || this.stateTimer <= 0) {
            this.changeState(AI_STATE.IDLE, 0.3);
        }
    },

    changeState(newState, duration) {
        this.state = newState;
        this.stateTimer = duration;
    },

    reactToPlayerAttack(enemy, player) {
        if (player.isAttacking && player.attackPhase === 'startup') {
            const distance = Math.abs(enemy.x - player.x);
            if (distance < 150 && Math.random() < 0.4) {
                this.changeState(AI_STATE.DODGE, 0.3);
            }
        }
    },

    reset() {
        this.state = AI_STATE.IDLE;
        this.stateTimer = 1;
    }
};