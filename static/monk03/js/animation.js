class AnimationManager {
    constructor() {
        this.animations = [];
    }

    update(deltaTime) {
        if (gameState.mode === CONSTANTS.GAME_MODES.RHYTHM) {
            const now = Date.now();
            if (now - gameState.rhythmBeatTime > gameState.rhythmInterval) {
                gameState.rhythmBeatTime = now;
            }
        }
    }
}

const animationManager = new AnimationManager();
