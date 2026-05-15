const Storage = {
    STORAGE_KEY: 'jianpu_practice_data',

    getDefaultState() {
        return {
            difficulty: 'easy',
            mode: 'sing',
            correctCount: 0,
            wrongCount: 0,
            totalTime: 0,
            currentNote: null,
            questionStartTime: null,
            answered: false,
            answerInput: ''
        };
    },

    save(state) {
        try {
            const data = JSON.stringify(state);
            localStorage.setItem(this.STORAGE_KEY, data);
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    },

    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                return { ...this.getDefaultState(), ...parsed };
            }
        } catch (e) {
            console.error('加载数据失败:', e);
        }
        return this.getDefaultState();
    },

    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('清除数据失败:', e);
        }
    }
};