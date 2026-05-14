const Statistics = {
    data: {
        correct: 0,
        wrong: 0,
        totalTime: 0,
        questionTimes: []
    },

    init() {
        this.data = {
            correct: 0,
            wrong: 0,
            totalTime: 0,
            questionTimes: []
        };
    },

    load(data) {
        if (data) {
            this.data = { ...data };
        }
    },

    addCorrect(time) {
        this.data.correct++;
        this.data.questionTimes.push(time);
        this.data.totalTime += time;
    },

    addWrong(time) {
        this.data.wrong++;
        this.data.questionTimes.push(time);
        this.data.totalTime += time;
    },

    getTotal() {
        return this.data.correct + this.data.wrong;
    },

    getAccuracy() {
        const total = this.getTotal();
        if (total === 0) return 0;
        return (this.data.correct / total) * 100;
    },

    getAverageTime() {
        const times = this.data.questionTimes;
        if (times.length === 0) return 0;
        return times.reduce((a, b) => a + b, 0) / times.length;
    },

    getGrade() {
        const accuracy = this.getAccuracy();
        if (accuracy >= 90) return { grade: 'S', color: '#FFD700', emoji: '🏆' };
        if (accuracy >= 80) return { grade: 'A', color: '#4CAF50', emoji: '🌟' };
        if (accuracy >= 70) return { grade: 'B', color: '#2196F3', emoji: '👍' };
        if (accuracy >= 60) return { grade: 'C', color: '#FF9800', emoji: '💪' };
        return { grade: 'D', color: '#F44336', emoji: '📚' };
    },

    export() {
        return { ...this.data };
    }
};