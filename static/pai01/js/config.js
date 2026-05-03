const Config = {
    current: { ...CONSTANTS.DEFAULT_CONFIG },
    
    set(gridSize, gameMode, timeLimit, enableSpecialCards) {
        this.current = {
            gridSize: gridSize || CONSTANTS.DEFAULT_CONFIG.gridSize,
            gameMode: gameMode || CONSTANTS.DEFAULT_CONFIG.gameMode,
            timeLimit: timeLimit,
            enableSpecialCards: enableSpecialCards
        };
    },
    
    getTotalCards() {
        return this.current.gridSize * this.current.gridSize;
    },
    
    getPairsCount() {
        return this.getTotalCards() / 2;
    },
    
    isDoubleMode() {
        return this.current.gameMode === CONSTANTS.GAME_MODE.DOUBLE;
    },
    
    hasTimeLimit() {
        return this.current.timeLimit > 0;
    }
};
