const MathPracticeApp = {
    canvas: null,
    gameData: null,
    animationId: null,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        Renderer.init(this.canvas);
        
        this.gameData = Storage.load();
        Renderer.setTheme(this.gameData.theme);
        
        Statistics.load(this.gameData.statistics);
        
        if (this.gameData.currentState === GAME_STATE.PLAYING) {
            const timerState = this.gameData.timerState || { totalTime: 0, questionTime: 0, isRunning: true };
            Timer.resume(timerState.totalTime, timerState.questionTime, timerState.isRunning);
        }

        this.setupEvents();
        this.startGameLoop();
    },

    setupEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        window.addEventListener('beforeunload', () => this.saveState());
    },

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width);
        const y = (e.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height);

        const buttonId = Renderer.getClickedButton(x, y);
        if (buttonId) {
            this.handleButtonClick(buttonId);
        }
    },

    handleKeydown(e) {
        if (this.gameData.currentState !== GAME_STATE.PLAYING || this.gameData.isAnswered) {
            return;
        }

        const key = e.key;
        
        if (/^[0-9]$/.test(key)) {
            if (this.gameData.userAnswer.length < 6) {
                this.gameData.userAnswer += key;
            }
        } else if (key === 'Backspace') {
            this.gameData.userAnswer = this.gameData.userAnswer.slice(0, -1);
        } else if (key === 'Enter') {
            this.submitAnswer();
        } else if (key === 'Escape') {
            this.gameData.userAnswer = '';
        }
        
        this.saveState();
    },

    handleButtonClick(buttonId) {
        if (buttonId.startsWith('diff_')) {
            this.gameData.difficulty = buttonId.replace('diff_', '');
            this.saveState();
            return;
        }

        if (buttonId.startsWith('theme_')) {
            this.gameData.theme = buttonId.replace('theme_', '');
            Renderer.setTheme(this.gameData.theme);
            this.saveState();
            return;
        }

        if (buttonId.startsWith('num_')) {
            const num = buttonId.replace('num_', '');
            if (this.gameData.currentState === GAME_STATE.PLAYING && !this.gameData.isAnswered) {
                if (num === 'C') {
                    this.gameData.userAnswer = '';
                } else if (num === '←') {
                    this.gameData.userAnswer = this.gameData.userAnswer.slice(0, -1);
                } else if (this.gameData.userAnswer.length < 6) {
                    this.gameData.userAnswer += num;
                }
                this.saveState();
            }
            return;
        }

        switch (buttonId) {
            case 'start':
                this.startGame();
                break;
            case 'submit':
                this.submitAnswer();
                break;
            case 'nextQuestion':
                this.nextQuestion();
                break;
            case 'showResult':
                this.showResult();
                break;
            case 'restart':
                this.startGame();
                break;
            case 'backToMenu':
                this.goToMenu();
                break;
        }
    },

    startGame() {
        Timer.reset();
        Statistics.init();
        
        this.gameData = Storage.resetGame();
        this.gameData.currentState = GAME_STATE.PLAYING;
        this.gameData.currentQuestion = QuestionGenerator.generate(this.gameData.difficulty);
        
        Timer.start();
        this.saveState();
    },

    submitAnswer() {
        if (!this.gameData.userAnswer || this.gameData.isAnswered) {
            return;
        }

        const question = this.gameData.currentQuestion;
        const isCorrect = QuestionGenerator.checkAnswer(question, this.gameData.userAnswer);
        const questionTime = Timer.stopQuestion();

        this.gameData.isAnswered = true;
        this.gameData.lastAnswerCorrect = isCorrect;

        if (isCorrect) {
            Statistics.addCorrect(questionTime);
        } else {
            Statistics.addWrong(questionTime);
        }

        this.gameData.statistics = Statistics.export();
        this.gameData.history.push({
            question: question.display,
            userAnswer: this.gameData.userAnswer,
            correctAnswer: question.answer,
            correct: isCorrect,
            time: questionTime
        });

        this.saveState();
    },

    nextQuestion() {
        this.gameData.questionIndex++;
        this.gameData.currentQuestion = QuestionGenerator.generate(this.gameData.difficulty);
        this.gameData.userAnswer = '';
        this.gameData.isAnswered = false;
        this.gameData.lastAnswerCorrect = null;
        
        Timer.startQuestion();
        this.saveState();
    },

    showResult() {
        Timer.stop();
        this.gameData.currentState = GAME_STATE.RESULT;
        this.gameData.showResult = true;
        this.saveState();
    },

    goToMenu() {
        Timer.stop();
        this.gameData.currentState = GAME_STATE.MENU;
        this.saveState();
    },

    saveState() {
        Storage.save(this.gameData);
    },

    render() {
        Renderer.clear();

        switch (this.gameData.currentState) {
            case GAME_STATE.MENU:
                Renderer.drawMenu(this.gameData);
                break;
            case GAME_STATE.PLAYING:
                Renderer.drawPlaying(this.gameData);
                break;
            case GAME_STATE.RESULT:
                Renderer.drawResult(this.gameData);
                break;
        }
    },

    startGameLoop() {
        const loop = () => {
            this.render();
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    },

    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MathPracticeApp.init();
});