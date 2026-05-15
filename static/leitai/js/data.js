const CharacterFactory = {
    createCharacter(charIndex, x, isPlayer = true) {
        const charData = CHARACTERS[charIndex];
        return {
            x: x,
            y: GROUND_Y,
            vx: 0,
            vy: 0,
            width: 80,
            height: 120,
            charIndex: charIndex,
            name: charData.name,
            stompDamage: charData.stompDamage,
            defense: charData.defense,
            speed: charData.speed,
            ultimateDamage: charData.ultimateDamage,
            color: charData.color,
            emoji: charData.emoji,
            rage: 100,
            maxRage: 100,
            isPlayer: isPlayer,
            facingRight: !isPlayer,
            isJumping: false,
            isCrouching: false,
            isAttacking: false,
            currentAttack: null,
            attackTimer: 0,
            attackPhase: 'idle',
            isHurt: false,
            hurtTimer: 0,
            ultimateGauge: 0,
            maxUltimateGauge: 100,
            animFrame: 0,
            animTimer: 0,
            shakeOffset: { x: 0, y: 0 }
        };
    }
};

const GameState = {
    createInitial() {
        const selectedChar = StorageManager.loadSelectedChar();
        return {
            gameState: GAME_STATE.MENU,
            selectedCharIndex: selectedChar,
            enemyCharIndex: Math.floor(Math.random() * 3),
            timer: GAME_DURATION,
            player: null,
            enemy: null,
            effects: [],
            particles: [],
            screenShake: { x: 0, y: 0, intensity: 0 }
        };
    },

    initGame(state) {
        state.timer = GAME_DURATION;
        state.player = CharacterFactory.createCharacter(state.selectedCharIndex, 200, true);
        state.enemy = CharacterFactory.createCharacter(state.enemyCharIndex, CANVAS_WIDTH - 280, false);
        state.effects = [];
        state.particles = [];
        state.screenShake = { x: 0, y: 0, intensity: 0 };
    },

    fromSaved(savedState) {
        const state = this.createInitial();
        state.gameState = savedState.gameState;
        state.selectedCharIndex = savedState.selectedCharIndex;
        state.enemyCharIndex = savedState.enemyCharIndex !== undefined ? savedState.enemyCharIndex : Math.floor(Math.random() * 3);
        state.timer = savedState.timer;
        state.player = CharacterFactory.createCharacter(savedState.player.charIndex, savedState.player.x, true);
        state.player.y = savedState.player.y;
        state.player.rage = savedState.player.rage;
        state.player.facingRight = savedState.player.facingRight;
        state.enemy = CharacterFactory.createCharacter(savedState.enemy.charIndex, savedState.enemy.x, false);
        state.enemy.y = savedState.enemy.y;
        state.enemy.rage = savedState.enemy.rage;
        state.enemy.facingRight = savedState.enemy.facingRight;
        return state;
    }
};