const Timer = {
    startTime: 0,
    questionStartTime: 0,
    totalElapsed: 0,
    questionElapsed: 0,
    isRunning: false,
    pausedTime: 0,
    questionPausedTime: 0,
    animationId: null,

    start() {
        this.startTime = Date.now();
        this.questionStartTime = Date.now();
        this.pausedTime = 0;
        this.questionPausedTime = 0;
        this.isRunning = true;
    },

    resume(savedTotalTime, savedQuestionTime, isRunning) {
        if (isRunning) {
            this.startTime = Date.now() - savedTotalTime * 1000;
            this.questionStartTime = Date.now() - savedQuestionTime * 1000;
            this.pausedTime = 0;
            this.questionPausedTime = 0;
            this.isRunning = true;
        } else {
            this.totalElapsed = savedTotalTime;
            this.questionElapsed = savedQuestionTime;
            this.isRunning = false;
        }
    },

    startQuestion() {
        this.questionStartTime = Date.now();
        this.questionPausedTime = 0;
    },

    stop() {
        if (this.isRunning) {
            this.totalElapsed = this.getTotalTime();
            this.isRunning = false;
        }
    },

    getQuestionTime() {
        if (this.isRunning) {
            return (Date.now() - this.questionStartTime) / 1000;
        }
        return this.questionElapsed;
    },

    getTotalTime() {
        if (this.isRunning) {
            return (Date.now() - this.startTime) / 1000;
        }
        return this.totalElapsed;
    },

    stopQuestion() {
        this.questionElapsed = this.getQuestionTime();
        return this.questionElapsed;
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    reset() {
        this.startTime = 0;
        this.questionStartTime = 0;
        this.totalElapsed = 0;
        this.questionElapsed = 0;
        this.pausedTime = 0;
        this.questionPausedTime = 0;
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
};