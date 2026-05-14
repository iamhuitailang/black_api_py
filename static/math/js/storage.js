const Storage = {
    KEY: 'math_practice_data',

    getDefaultData() {
        return {
            currentState: GAME_STATE.MENU,
            difficulty: 'easy',
            theme: 'candy',
            currentQuestion: null,
            questionIndex: 0,
            userAnswer: '',
            statistics: {
                correct: 0,
                wrong: 0,
                totalTime: 0,
                questionTimes: []
            },
            history: [],
            isAnswered: false,
            lastAnswerCorrect: null,
            showResult: false,
            timerState: {
                totalTime: 0,
                questionTime: 0,
                isRunning: false
            }
        };
    },

    save(data) {
        try {
            const saveData = { ...data };
            if (data.currentState === GAME_STATE.PLAYING) {
                saveData.timerState = {
                    totalTime: Timer.getTotalTime(),
                    questionTime: Timer.getQuestionTime(),
                    isRunning: Timer.isRunning
                };
            }
            localStorage.setItem(this.KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(this.KEY);
            if (data) {
                return { ...this.getDefaultData(), ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('加载数据失败:', e);
        }
        return this.getDefaultData();
    },

    clear() {
        localStorage.removeItem(this.KEY);
    },

    resetGame() {
        const data = this.load();
        const newData = {
            ...this.getDefaultData(),
            difficulty: data.difficulty,
            theme: data.theme
        };
        this.save(newData);
        return newData;
    }
};