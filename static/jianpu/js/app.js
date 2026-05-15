const App = {
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        Renderer.init('scoreCanvas');
        Game.init();
        this.updateUI();
        this.startStatsUpdate();

        this.elements.answerInput.value = Game.getAnswerInput();

        if (Game.getCurrentNote()) {
            Renderer.drawNote(Game.getCurrentNote(), Game.getMode());
        } else {
            Renderer.drawPlaceholder();
        }
    },

    cacheElements() {
        this.elements = {
            answerInput: document.getElementById('answerInput'),
            submitBtn: document.getElementById('submitBtn'),
            nextBtn: document.getElementById('nextBtn'),
            resetBtn: document.getElementById('resetBtn'),
            playSoundBtn: document.getElementById('playSoundBtn'),
            feedback: document.getElementById('feedback'),
            hintText: document.getElementById('hintText'),
            quickBtns: document.getElementById('quickBtns'),
            correctCount: document.getElementById('correctCount'),
            wrongCount: document.getElementById('wrongCount'),
            accuracy: document.getElementById('accuracy'),
            totalTime: document.getElementById('totalTime'),
            questionTime: document.getElementById('questionTime'),
            diffBtns: document.querySelectorAll('.diff-btn'),
            modeBtns: document.querySelectorAll('.mode-btn')
        };
    },

    bindEvents() {
        this.elements.submitBtn.addEventListener('click', () => this.submitAnswer());
        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });
        this.elements.answerInput.addEventListener('input', (e) => {
            Game.setAnswerInput(e.target.value);
        });

        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());
        this.elements.playSoundBtn.addEventListener('click', () => this.playSound());

        this.elements.diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                Game.setDifficulty(btn.dataset.difficulty);
                this.updateDiffButtons();
            });
        });

        this.elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                Game.setMode(btn.dataset.mode);
                this.updateModeButtons();
                this.updateQuickButtons();
                
                const currentNote = Game.getCurrentNote();
                if (currentNote) {
                    Renderer.drawNote(currentNote, Game.getMode());
                }
            });
        });
    },

    startStatsUpdate() {
        setInterval(() => this.updateStats(), 100);
    },

    updateStats() {
        const stats = Game.getStats();
        this.elements.correctCount.textContent = stats.correctCount;
        this.elements.wrongCount.textContent = stats.wrongCount;
        this.elements.accuracy.textContent = stats.accuracy + '%';
        this.elements.totalTime.textContent = this.formatTime(stats.totalTime);
        this.elements.questionTime.textContent = stats.questionTime.toFixed(1) + 's';
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    updateDiffButtons() {
        const difficulty = Game.getDifficulty();
        this.elements.diffBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
    },

    updateModeButtons() {
        const mode = Game.getMode();
        this.elements.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    },

    updateQuickButtons() {
        const mode = Game.getMode();
        const answers = NoteData.getAnswerModeAnswers(mode);
        
        this.elements.quickBtns.innerHTML = '';
        answers.forEach(answer => {
            const btn = document.createElement('button');
            btn.className = 'quick-btn';
            btn.textContent = answer;
            btn.addEventListener('click', () => {
                this.elements.answerInput.value = answer;
                this.submitAnswer();
            });
            this.elements.quickBtns.appendChild(btn);
        });
    },

    submitAnswer() {
        const answer = this.elements.answerInput.value.trim();
        if (!answer) return;

        const result = Game.checkAnswer(answer);
        if (!result) return;

        this.showFeedback(result);
        this.elements.answerInput.value = '';
        Game.setAnswerInput('');
    },

    showFeedback(result) {
        const feedback = this.elements.feedback;
        feedback.classList.remove('correct', 'wrong', 'show');
        
        if (result.isCorrect) {
            feedback.textContent = `✓ 正确！答案是 "${result.correctAnswer}"，用时 ${result.questionTime.toFixed(1)}秒`;
            feedback.classList.add('correct');
        } else {
            feedback.textContent = `✗ 错误！正确答案是 "${result.correctAnswer}"，你的答案是 "${result.userAnswer}"`;
            feedback.classList.add('wrong');
        }
        
        setTimeout(() => feedback.classList.add('show'), 10);
    },

    nextQuestion() {
        const note = Game.generateQuestion();
        Renderer.drawNote(note, Game.getMode());
        this.elements.feedback.classList.remove('show');
        this.elements.hintText.textContent = '';
        this.elements.answerInput.value = '';
        Game.setAnswerInput('');
        this.elements.answerInput.focus();

        if (Game.getMode() === 'listen') {
            setTimeout(() => this.playSound(), 300);
        }
    },

    resetGame() {
        if (confirm('确定要重置所有进度吗？')) {
            Game.reset();
            this.updateUI();
            Renderer.drawPlaceholder();
            this.elements.feedback.classList.remove('show');
            this.elements.hintText.textContent = '';
        }
    },

    playSound() {
        const note = Game.getCurrentNote();
        if (note) {
            AudioPlayer.playNotePiano(note.frequency);
        }
    },

    updateUI() {
        this.updateDiffButtons();
        this.updateModeButtons();
        this.updateQuickButtons();
        this.updateStats();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});