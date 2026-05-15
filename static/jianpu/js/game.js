const Game = {
    state: null,
    timerInterval: null,

    init() {
        this.state = Storage.load();
        this.startTimer();
    },

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            if (this.state.questionStartTime && !this.state.answered) {
                this.state.totalTime += 1;
                Storage.save(this.state);
            }
        }, 1000);
    },

    generateQuestion() {
        const notes = NoteData.generateNotes(this.state.difficulty);
        const randomIndex = Math.floor(Math.random() * notes.length);
        this.state.currentNote = notes[randomIndex];
        this.state.questionStartTime = Date.now();
        this.state.answered = false;
        Storage.save(this.state);
        return this.state.currentNote;
    },

    checkAnswer(userAnswer) {
        if (!this.state.currentNote || this.state.answered) {
            return null;
        }

        const note = this.state.currentNote;
        const answer = userAnswer.toLowerCase().trim();
        
        let correctAnswer = '';
        switch (this.state.mode) {
            case 'sing':
                correctAnswer = note.sing;
                break;
            case 'pitch':
                correctAnswer = note.pitch.toLowerCase();
                break;
            case 'number':
            case 'listen':
                correctAnswer = note.number.toString();
                break;
        }

        const isCorrect = answer === correctAnswer;
        const questionTime = (Date.now() - this.state.questionStartTime) / 1000;

        this.state.answered = true;
        
        if (isCorrect) {
            this.state.correctCount++;
        } else {
            this.state.wrongCount++;
        }

        Storage.save(this.state);

        return {
            isCorrect,
            correctAnswer,
            questionTime,
            userAnswer
        };
    },

    setDifficulty(difficulty) {
        this.state.difficulty = difficulty;
        Storage.save(this.state);
    },

    setMode(mode) {
        this.state.mode = mode;
        Storage.save(this.state);
    },

    reset() {
        Storage.clear();
        this.state = Storage.getDefaultState();
        Storage.save(this.state);
    },

    getStats() {
        const total = this.state.correctCount + this.state.wrongCount;
        const accuracy = total > 0 ? Math.round((this.state.correctCount / total) * 100) : 0;
        const questionTime = this.state.questionStartTime && !this.state.answered
            ? (Date.now() - this.state.questionStartTime) / 1000
            : 0;

        return {
            correctCount: this.state.correctCount,
            wrongCount: this.state.wrongCount,
            accuracy,
            totalTime: this.state.totalTime,
            questionTime,
            answered: this.state.answered
        };
    },

    getCurrentNote() {
        return this.state.currentNote;
    },

    getMode() {
        return this.state.mode;
    },

    getDifficulty() {
        return this.state.difficulty;
    },

    isAnswered() {
        return this.state.answered;
    },

    setAnswerInput(value) {
        this.state.answerInput = value;
        Storage.save(this.state);
    },

    getAnswerInput() {
        return this.state.answerInput || '';
    }
};