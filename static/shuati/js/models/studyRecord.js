const StudyRecordModel = {
    getAll() {
        return Storage.get('studyRecords', []);
    },

    create(data) {
        const records = this.getAll();
        const record = {
            id: Utils.generateId(),
            questionId: data.questionId,
            bankId: data.bankId,
            isCorrect: data.isCorrect,
            isNew: data.isNew || false,
            studyTime: data.studyTime || Date.now(),
            duration: data.duration || 0
        };
        
        records.push(record);
        Storage.set('studyRecords', records);
        
        return record;
    },

    delete(id) {
        const records = this.getAll();
        const index = records.findIndex(r => r.id === id);
        
        if (index === -1) return false;
        
        records.splice(index, 1);
        Storage.set('studyRecords', records);
        
        return true;
    },

    deleteByQuestionId(questionId) {
        const records = this.getAll();
        const filtered = records.filter(r => r.questionId !== questionId);
        Storage.set('studyRecords', filtered);
    },

    deleteByBankId(bankId) {
        const records = this.getAll();
        const filtered = records.filter(r => r.bankId !== bankId);
        Storage.set('studyRecords', filtered);
    },

    getByQuestionId(questionId) {
        const records = this.getAll();
        return records.filter(r => r.questionId === questionId);
    },

    getByBankId(bankId) {
        const records = this.getAll();
        return records.filter(r => r.bankId === bankId);
    },

    getByDate(date) {
        const records = this.getAll();
        const targetDate = new Date(date).toDateString();
        
        return records.filter(r => {
            const recordDate = new Date(r.studyTime).toDateString();
            return recordDate === targetDate;
        });
    },

    getByDateRange(startDate, endDate) {
        const records = this.getAll();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        
        return records.filter(r => {
            const time = r.studyTime;
            return time >= start && time <= end;
        });
    },

    getDailyStats(date = new Date()) {
        const records = this.getByDate(date);
        
        const stats = {
            total: records.length,
            correct: records.filter(r => r.isCorrect).length,
            wrong: records.filter(r => !r.isCorrect).length,
            newQuestions: records.filter(r => r.isNew).length,
            reviewQuestions: records.filter(r => !r.isNew).length
        };
        
        stats.accuracy = stats.total > 0 
            ? Math.round((stats.correct / stats.total) * 100) 
            : 0;
        
        return stats;
    },

    getWeeklyStats() {
        const now = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        
        const records = this.getByDateRange(weekAgo, now);
        
        const dailyStats = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateStr = date.toDateString();
            dailyStats[dateStr] = {
                total: 0,
                correct: 0,
                accuracy: 0
            };
        }
        
        records.forEach(r => {
            const dateStr = new Date(r.studyTime).toDateString();
            if (dailyStats[dateStr]) {
                dailyStats[dateStr].total++;
                if (r.isCorrect) {
                    dailyStats[dateStr].correct++;
                }
            }
        });
        
        Object.values(dailyStats).forEach(stat => {
            stat.accuracy = stat.total > 0 
                ? Math.round((stat.correct / stat.total) * 100) 
                : 0;
        });
        
        return dailyStats;
    },

    getCalendarHeatmapData(weeks = 52) {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - weeks * 7);
        
        const records = this.getByDateRange(startDate, now);
        
        const heatmap = {};
        
        records.forEach(r => {
            const dateStr = new Date(r.studyTime).toDateString();
            if (!heatmap[dateStr]) {
                heatmap[dateStr] = 0;
            }
            heatmap[dateStr]++;
        });
        
        return heatmap;
    },

    getStudyStreak() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streak = 0;
        let currentDate = new Date(today);
        
        while (true) {
            const records = this.getByDate(currentDate);
            if (records.length > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
            
            if (streak > 365) break;
        }
        
        return streak;
    },

    getTotalStudyTime() {
        const records = this.getAll();
        return records.reduce((total, r) => total + (r.duration || 0), 0);
    },

    clearOldRecords(days = 365) {
        const records = this.getAll();
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        const filtered = records.filter(r => r.studyTime > cutoff);
        Storage.set('studyRecords', filtered);
        
        return records.length - filtered.length;
    }
};

window.StudyRecordModel = StudyRecordModel;
