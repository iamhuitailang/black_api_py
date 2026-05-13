const Game = {
    currentLevel: 'all',
    questionType: 'name',
    score: 0,
    streak: 0,
    maxStreak: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    timeRemaining: 300,
    totalTime: 300,
    isPlaying: false,
    isPaused: false,
    currentProvince: null,
    timerInterval: null,
    animationFrame: null,

    init() {
        this.setupUI();
        this.setupEvents();
        this.startGameLoop();
        this.checkSavedGame();
    },

    checkSavedGame() {
        const saved = Storage.load();
        if (saved && saved.gameState && saved.gameState.isPlaying) {
            document.getElementById('resumeBtn').classList.remove('hidden');
        }
    },

    setupUI() {
        UI.updateScore(this.score);
        UI.updateStreak(this.streak);
        UI.updateAccuracy(0);
    },

    setupEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame(false));
        document.getElementById('resumeBtn').addEventListener('click', () => this.startGame(true));
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetViewBtn').addEventListener('click', () => this.resetView());
        document.getElementById('confirmBtn').addEventListener('click', () => this.submitAnswer());
        document.getElementById('hintBtn').addEventListener('click', () => this.useHint());
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelInput());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.playAgain());
        document.getElementById('answerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitAnswer();
        });
        document.getElementById('answerInput').addEventListener('input', (e) => {
            this.showSuggestions(e.target.value);
        });
    },

    startGame(resume = false) {
        if (resume) {
            const saved = Storage.load();
            if (saved && saved.gameState) {
                this.restoreState(saved.gameState);
                if (saved.mapState) {
                    MapRenderer.restoreState(saved.mapState);
                }
                UI.hideStartScreen();
                this.startTimer();
                Sound.playClick();
                return;
            }
        }

        this.currentLevel = document.getElementById('levelSelect').value;
        this.questionType = document.getElementById('typeSelect').value;

        const levelConfig = CONFIG.LEVELS[this.currentLevel];
        this.totalTime = levelConfig.time;
        this.timeRemaining = this.totalTime;

        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.totalQuestions = 0;
        this.correctAnswers = 0;

        MapRenderer.resetProvinces(this.currentLevel);
        this.isPlaying = true;
        this.isPaused = false;

        UI.hideStartScreen();
        UI.updateTime(this.timeRemaining);
        UI.updateScore(this.score);
        UI.updateStreak(this.streak);
        UI.updateAccuracy(0);

        this.startTimer();
        this.saveState();

        Sound.playClick();
    },

    pauseGame() {
        if (!this.isPlaying) return;
        this.isPaused = true;
        this.stopTimer();
        UI.showPauseScreen();
        this.saveState();
    },

    resumeFromPause() {
        this.isPaused = false;
        UI.hidePauseScreen();
        this.startTimer();
    },

    resetGame() {
        this.stopTimer();
        this.isPlaying = false;
        this.isPaused = false;
        Storage.clear();
        UI.hidePauseScreen();
        UI.hideResultScreen();
        UI.showStartScreen();
        MapRenderer.centerMap();
    },

    zoomIn() {
        const centerX = MapRenderer.width / 2;
        const centerY = MapRenderer.height / 2;
        MapRenderer.zoom(1, centerX, centerY);
    },

    zoomOut() {
        const centerX = MapRenderer.width / 2;
        const centerY = MapRenderer.height / 2;
        MapRenderer.zoom(-1, centerX, centerY);
    },

    resetView() {
        MapRenderer.centerMap();
    },

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            UI.updateTime(this.timeRemaining);

            if (this.timeRemaining === CONFIG.WARNING_TIME) {
                Sound.playWarning();
            }

            if (this.timeRemaining <= 0) {
                this.gameOver(false);
            }

            if (this.timeRemaining % 10 === 0) {
                this.saveState();
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    startGameLoop() {
        const gameLoop = () => {
            MapRenderer.render();
            this.animationFrame = requestAnimationFrame(gameLoop);
        };
        this.animationFrame = requestAnimationFrame(gameLoop);
    },

    handleProvinceClick(province) {
        if (province === 'hint') {
            this.useHint();
            return;
        }

        if (!this.isPlaying || this.isPaused) return;
        if (province.status !== 'blank') return;

        this.currentProvince = province;
        UI.showInputModal(province, this.questionType);
        setTimeout(() => {
            document.getElementById('answerInput').focus();
        }, 100);
    },

    submitAnswer() {
        if (!this.currentProvince) return;

        const userAnswer = document.getElementById('answerInput').value.trim();
        if (!userAnswer) return;

        let correctAnswer;
        switch (this.questionType) {
            case 'name': correctAnswer = this.currentProvince.name; break;
            case 'short': correctAnswer = this.currentProvince.short; break;
            case 'capital': correctAnswer = this.currentProvince.capital; break;
        }

        this.totalQuestions++;

        if (checkAnswer(userAnswer, correctAnswer, this.questionType)) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }

        this.saveState();
    },

    handleCorrectAnswer() {
        this.correctAnswers++;
        this.streak++;
        this.maxStreak = Math.max(this.maxStreak, this.streak);

        const baseScore = CONFIG.BASE_SCORE;
        const streakBonus = this.streak * CONFIG.STREAK_BONUS;
        const timeBonus = Math.floor(this.timeRemaining * CONFIG.TIME_BONUS_MULTIPLIER);
        this.score += baseScore + streakBonus + timeBonus;

        MapRenderer.setProvinceStatus(this.currentProvince.id, 'correct');

        UI.updateScore(this.score);
        UI.updateStreak(this.streak);
        UI.updateAccuracy(Math.round((this.correctAnswers / this.totalQuestions) * 100));

        Sound.playCorrect();
        UI.hideInputModal();
        this.currentProvince = null;

        this.checkLevelComplete();
    },

    handleWrongAnswer() {
        this.streak = 0;
        MapRenderer.setProvinceStatus(this.currentProvince.id, 'wrong');

        UI.updateStreak(this.streak);
        UI.updateAccuracy(Math.round((this.correctAnswers / this.totalQuestions) * 100));

        Sound.playWrong();

        setTimeout(() => {
            MapRenderer.setProvinceStatus(this.currentProvince.id, 'blank');
            UI.hideInputModal();
            this.currentProvince = null;
        }, 500);
    },

    useHint() {
        if (!this.currentProvince) return;
        if (this.currentProvince.hintsUsed >= CONFIG.MAX_HINTS) {
            this.revealAnswer();
            return;
        }

        this.currentProvince.hintsUsed++;
        UI.updateHintCount(CONFIG.MAX_HINTS - this.currentProvince.hintsUsed);

        let correctAnswer;
        switch (this.questionType) {
            case 'name': correctAnswer = this.currentProvince.name; break;
            case 'short': correctAnswer = this.currentProvince.short; break;
            case 'capital': correctAnswer = this.currentProvince.capital; break;
        }

        const input = document.getElementById('answerInput');
        const currentValue = input.value;
        const hintLength = Math.min(currentValue.length + 1, correctAnswer.length);
        input.value = correctAnswer.substring(0, hintLength);

        Sound.playClick();
    },

    revealAnswer() {
        let correctAnswer;
        switch (this.questionType) {
            case 'name': correctAnswer = this.currentProvince.name; break;
            case 'short': correctAnswer = this.currentProvince.short; break;
            case 'capital': correctAnswer = this.currentProvince.capital; break;
        }

        document.getElementById('answerInput').value = correctAnswer;
        Sound.playClick();
    },

    cancelInput() {
        UI.hideInputModal();
        this.currentProvince = null;
        Sound.playClick();
    },

    showSuggestions(input) {
        const suggestions = getSuggestions(input, this.questionType);
        UI.showSuggestions(suggestions);
    },

    checkLevelComplete() {
        const blankProvinces = MapRenderer.provinces.filter(p => p.status === 'blank');

        if (blankProvinces.length === 0) {
            const accuracy = this.totalQuestions > 0 ? this.correctAnswers / this.totalQuestions : 0;
            const passed = accuracy >= CONFIG.PASS_ACCURACY;
            this.gameOver(passed);
        }
    },

    gameOver(victory) {
        this.stopTimer();
        this.isPlaying = false;

        const accuracy = this.totalQuestions > 0 ? Math.round((this.correctAnswers / this.totalQuestions) * 100) : 0;

        if (victory) {
            Sound.playVictory();
        } else {
            Sound.playGameOver();
        }

        Storage.clear();

        UI.showResultScreen(victory, {
            score: this.score,
            accuracy: accuracy,
            time: this.totalTime - this.timeRemaining
        });
    },

    playAgain() {
        UI.hideResultScreen();
        UI.showStartScreen();
        MapRenderer.centerMap();
    },

    saveState() {
        const gameState = {
            currentLevel: this.currentLevel,
            questionType: this.questionType,
            score: this.score,
            streak: this.streak,
            maxStreak: this.maxStreak,
            totalQuestions: this.totalQuestions,
            correctAnswers: this.correctAnswers,
            timeRemaining: this.timeRemaining,
            totalTime: this.totalTime,
            isPlaying: this.isPlaying,
            isPaused: this.isPaused
        };

        const mapState = MapRenderer.getState();
        Storage.save({ gameState, mapState });
    },

    restoreState(state) {
        this.currentLevel = state.currentLevel;
        this.questionType = state.questionType;
        this.score = state.score;
        this.streak = state.streak;
        this.maxStreak = state.maxStreak;
        this.totalQuestions = state.totalQuestions;
        this.correctAnswers = state.correctAnswers;
        this.timeRemaining = state.timeRemaining;
        this.totalTime = state.totalTime;
        this.isPlaying = state.isPlaying;
        this.isPaused = state.isPaused;

        document.getElementById('levelSelect').value = this.currentLevel;
        document.getElementById('typeSelect').value = this.questionType;

        UI.updateTime(this.timeRemaining);
        UI.updateScore(this.score);
        UI.updateStreak(this.streak);
        UI.updateAccuracy(this.totalQuestions > 0 ? Math.round((this.correctAnswers / this.totalQuestions) * 100) : 0);
    }
};
