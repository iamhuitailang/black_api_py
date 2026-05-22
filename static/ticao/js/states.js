const GameState = {
    states: {
        MENU: 'menu',
        MODE_SELECT: 'mode_select',
        EVENT_SELECT: 'event_select',
        OPPONENT_SELECT: 'opponent_select',
        PLAYING: 'playing',
        PAUSED: 'paused',
        RESULT: 'result',
        ALL_AROUND_RESULT: 'all_around_result'
    },

    currentState: 'menu',
    mode: null,
    event: null,
    opponent: null,
    events: [],
    currentEventIndex: 0,
    
    scores: {
        difficulty: 0,
        execution: 0,
        landing: 0,
        total: 0
    },
    
    eventScores: [],
    opponentScores: [],
    opponentTotalScore: 0,
    
    hasOpponent: false,
    isAllAround: false,
    isFinal: false,
    isTraining: false,

    init() {
        this.currentState = this.states.MENU;
    },

    setState(state) {
        this.currentState = state;
    },

    isState(state) {
        return this.currentState === state;
    },

    setMode(mode) {
        this.mode = mode;
        this.isAllAround = (mode === 'allaround');
        this.isFinal = (mode === 'final');
        this.isTraining = (mode === 'training');
        this.hasOpponent = !this.isTraining;
        
        if (this.isAllAround) {
            this.events = ['floor', 'vault', 'bars', 'horizontal'];
        }
    },

    setEvent(event) {
        this.event = event;
        if (!this.isAllAround) {
            this.events = [event];
        }
        this.currentEventIndex = 0;
    },

    setOpponent(opponentType) {
        this.opponent = opponentType;
        Opponent.setOpponent(opponentType);
    },

    getCurrentEvent() {
        if (this.isAllAround) {
            return this.events[this.currentEventIndex];
        }
        return this.event;
    },

    getCurrentEventName() {
        const eventType = this.getCurrentEvent();
        return GameData.events[eventType]?.name || '';
    },

    getCurrentEventColor() {
        const eventType = this.getCurrentEvent();
        return GameData.events[eventType]?.color || '#FFF';
    },

    addEventScore(scoreData) {
        this.eventScores.push({
            event: this.getCurrentEvent(),
            ...scoreData
        });
    },

    getTotalScore() {
        return this.eventScores.reduce((sum, s) => sum + s.total, 0);
    },

    getOpponentTotalScore() {
        return this.opponentTotalScore;
    },

    addOpponentScore(score) {
        this.opponentTotalScore += score;
    },

    nextEvent() {
        if (this.isAllAround && this.currentEventIndex < this.events.length - 1) {
            this.currentEventIndex++;
            return true;
        }
        return false;
    },

    hasNextEvent() {
        if (this.isAllAround) {
            return this.currentEventIndex < this.events.length - 1;
        }
        return false;
    },

    isLastEvent() {
        if (this.isAllAround) {
            return this.currentEventIndex >= this.events.length - 1;
        }
        return true;
    },

    resetScores() {
        this.scores = {
            difficulty: 0,
            execution: 0,
            landing: 0,
            total: 0
        };
        this.eventScores = [];
        this.opponentScores = [];
        this.opponentTotalScore = 0;
        this.currentEventIndex = 0;
    },

    resetEventScore() {
        this.scores = {
            difficulty: 0,
            execution: 0,
            landing: 0,
            total: 0
        };
    },

    getSaveData() {
        return {
            mode: this.mode,
            event: this.event,
            opponent: this.opponent,
            currentEventIndex: this.currentEventIndex,
            totalScore: this.getTotalScore(),
            eventScores: this.eventScores,
            opponentTotalScore: this.opponentTotalScore,
            opponentScores: this.opponentScores,
            hasSavedProgress: true
        };
    },

    loadSaveData(saveData) {
        this.mode = saveData.mode;
        this.event = saveData.event;
        this.opponent = saveData.opponent;
        this.currentEventIndex = saveData.currentEventIndex || 0;
        this.eventScores = saveData.eventScores || [];
        this.opponentTotalScore = saveData.opponentTotalScore || 0;
        this.opponentScores = saveData.opponentScores || [];
        
        if (this.mode) {
            this.setMode(this.mode);
        }
        if (this.opponent) {
            this.setOpponent(this.opponent);
        }
        
        if (this.isAllAround) {
            this.events = ['floor', 'vault', 'bars', 'horizontal'];
        } else if (this.event) {
            this.events = [this.event];
        }
    },

    reset() {
        this.currentState = this.states.MENU;
        this.mode = null;
        this.event = null;
        this.opponent = null;
        this.events = [];
        this.currentEventIndex = 0;
        this.resetScores();
        this.hasOpponent = false;
        this.isAllAround = false;
        this.isFinal = false;
        this.isTraining = false;
        Opponent.reset();
    }
};
