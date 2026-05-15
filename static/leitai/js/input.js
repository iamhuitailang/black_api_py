const Input = {
    keys: {},
    keysJustPressed: {},

    init() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    },

    update() {
        this.keysJustPressed = {};
    },

    isKeyDown(code) {
        return this.keys[code];
    },

    isKeyPressed(code) {
        return this.keysJustPressed[code];
    },

    handlePlayerInput(player) {
        if (player.isHurt) return;

        if (this.isKeyDown('ArrowLeft')) {
            player.vx = -player.speed;
            player.facingRight = false;
        }
        if (this.isKeyDown('ArrowRight')) {
            player.vx = player.speed;
            player.facingRight = true;
        }

        if (this.isKeyPressed('ArrowUp') && !player.isJumping) {
            player.vy = -15;
            player.isJumping = true;
        }

        player.isCrouching = this.isKeyDown('ArrowDown');

        if (!player.isAttacking) {
            if (this.isKeyPressed('KeyA')) {
                Combat.startAttack(player, ATTACKS.LIGHT_STOMP);
            } else if (this.isKeyPressed('KeyS')) {
                Combat.startAttack(player, ATTACKS.HEAVY_STOMP);
            } else if (this.isKeyPressed('KeyD')) {
                Combat.startAttack(player, ATTACKS.BELLY_SLAP);
            } else if (this.isKeyPressed('KeyF')) {
                Combat.startAttack(player, ATTACKS.ANGRY_ROAR);
            } else if (this.isKeyPressed('KeyG')) {
                Combat.startAttack(player, ATTACKS.ULTIMATE_STOMP);
            }
        }
    }
};