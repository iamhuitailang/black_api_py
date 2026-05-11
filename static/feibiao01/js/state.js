const StateManager = {
    createInitialState() {
        return {
            mode: GameConfig.GameMode.STANDARD,
            state: GameConfig.GameState.MENU,
            dartState: GameConfig.GameState.DART_READY,
            
            score: 0,
            highScore: StorageManager.loadHighScore(),
            currentRound: 1,
            totalRounds: GameConfig.GameRules.STANDARD_ROUNDS,
            
            timeLeft: GameConfig.GameRules.TIMED_DURATION,
            
            target: {
                x: 0,
                y: 0,
                radius: 0
            },
            
            dart: {
                x: 0,
                y: 0,
                angle: 0,
                vx: 0,
                vy: 0,
                isLanded: false,
                landedX: 0,
                landedY: 0,
                landedScore: 0
            },
            
            pullStart: {
                x: 0,
                y: 0
            },
            
            pullCurrent: {
                x: 0,
                y: 0
            },
            
            pullDistance: 0,
            power: 0,
            
            landedDarts: [],
            isNewRecord: false,
            
            effects: {
                shake: {
                    intensity: 0,
                    startTime: 0,
                    duration: 0
                },
                floatingTexts: [],
                fireworks: [],
                confetti: [],
                glowEffects: []
            }
        };
    },
    
    resetGame(state, mode) {
        const initialState = this.createInitialState();
        initialState.mode = mode;
        initialState.highScore = state.highScore;
        initialState.totalRounds = mode === GameConfig.GameMode.TIMED 
            ? Infinity 
            : GameConfig.GameRules.STANDARD_ROUNDS;
        
        return initialState;
    },
    
    addScore(state, score) {
        state.score += score;
        state.isNewRecord = StorageManager.updateHighScore(state.score);
        if (state.isNewRecord) {
            state.highScore = state.score;
        }
        return state.isNewRecord;
    },
    
    nextRound(state) {
        if (state.mode === GameConfig.GameMode.STANDARD) {
            state.currentRound++;
            if (state.currentRound > state.totalRounds) {
                return false;
            }
        }
        return true;
    },
    
    isGameOver(state) {
        if (state.mode === GameConfig.GameMode.STANDARD) {
            return state.currentRound > state.totalRounds;
        } else {
            return state.timeLeft <= 0;
        }
    },
    
    serialize(state) {
        return {
            mode: state.mode,
            state: state.state,
            dartState: state.dartState,
            score: state.score,
            highScore: state.highScore,
            currentRound: state.currentRound,
            totalRounds: state.totalRounds,
            timeLeft: state.timeLeft,
            target: state.target,
            dart: state.dart,
            landedDarts: state.landedDarts,
            isNewRecord: state.isNewRecord
        };
    },
    
    deserialize(data) {
        const state = this.createInitialState();
        Object.assign(state, data);
        return state;
    }
};

if (typeof window !== 'undefined') {
    window.StateManager = StateManager;
}
