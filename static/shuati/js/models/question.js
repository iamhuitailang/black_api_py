const QuestionModel = {
    getAll() {
        return Storage.get('questions', []);
    },

    getById(id) {
        const questions = this.getAll();
        return questions.find(q => q.id === id) || null;
    },

    getByBankId(bankId) {
        const questions = this.getAll();
        return questions.filter(q => q.bankId === bankId);
    },

    create(bankId, data) {
        const questions = this.getAll();
        const question = {
            id: Utils.generateId(),
            bankId: bankId,
            content: data.content || '',
            type: data.type || 'single',
            options: data.options || [],
            answer: data.answer || [],
            explanation: data.explanation || '',
            tags: data.tags || [],
            difficulty: data.difficulty || 1,
            isFavorite: false,
            isWrong: false,
            wrongCount: 0,
            studyStats: {
                totalCount: 0,
                correctCount: 0,
                wrongCount: 0,
                lastStudyTime: null,
                nextReviewTime: null,
                interval: 1,
                easeFactor: 2.5,
                repetitions: 0
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        questions.push(question);
        Storage.set('questions', questions);
        
        BankModel.updateStats(bankId);
        return question;
    },

    batchCreate(bankId, questionsData) {
        const results = [];
        questionsData.forEach(data => {
            const question = this.create(bankId, data);
            results.push(question);
        });
        return results;
    },

    update(id, data) {
        const questions = this.getAll();
        const index = questions.findIndex(q => q.id === id);
        
        if (index === -1) return null;
        
        const oldQuestion = questions[index];
        
        questions[index] = {
            ...oldQuestion,
            ...data,
            updatedAt: Date.now()
        };
        
        Storage.set('questions', questions);
        
        if (oldQuestion.bankId !== questions[index].bankId) {
            BankModel.updateStats(oldQuestion.bankId);
            BankModel.updateStats(questions[index].bankId);
        } else {
            BankModel.updateStats(oldQuestion.bankId);
        }
        
        return questions[index];
    },

    delete(id) {
        const questions = this.getAll();
        const index = questions.findIndex(q => q.id === id);
        
        if (index === -1) return false;
        
        const bankId = questions[index].bankId;
        questions.splice(index, 1);
        Storage.set('questions', questions);
        
        StudyRecordModel.deleteByQuestionId(id);
        BankModel.updateStats(bankId);
        
        return true;
    },

    deleteByBankId(bankId) {
        const questions = this.getAll();
        const filtered = questions.filter(q => q.bankId !== bankId);
        Storage.set('questions', filtered);
        
        StudyRecordModel.deleteByBankId(bankId);
    },

    recordAnswer(questionId, isCorrect, isNewQuestion = false) {
        const question = this.getById(questionId);
        if (!question) return null;
        
        const stats = question.studyStats || {
            totalCount: 0,
            correctCount: 0,
            wrongCount: 0,
            lastStudyTime: null,
            nextReviewTime: null,
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0
        };
        
        stats.totalCount++;
        stats.lastStudyTime = Date.now();
        
        if (isCorrect) {
            stats.correctCount++;
        } else {
            stats.wrongCount++;
        }
        
        const wasWrong = question.isWrong;
        const wasFavorite = question.isFavorite;
        
        if (!isCorrect) {
            question.isWrong = true;
            question.wrongCount = (question.wrongCount || 0) + 1;
            if (!wasWrong) {
                EventBus.emit(EventBus.EVENTS.WRONG_QUESTION_ADDED, question);
            }
        }
        
        const sm2Result = MemoryAlgorithm.calculateSM2(
            isCorrect ? 5 : 2,
            stats.interval,
            stats.easeFactor,
            stats.repetitions
        );
        
        stats.interval = sm2Result.interval;
        stats.easeFactor = sm2Result.easeFactor;
        stats.repetitions = sm2Result.repetitions;
        stats.nextReviewTime = Date.now() + (sm2Result.interval * 24 * 60 * 60 * 1000);
        
        question.studyStats = stats;
        
        this.update(questionId, {
            studyStats: stats,
            isWrong: question.isWrong,
            wrongCount: question.wrongCount
        });
        
        StudyRecordModel.create({
            questionId: questionId,
            bankId: question.bankId,
            isCorrect: isCorrect,
            isNew: isNewQuestion,
            studyTime: Date.now()
        });
        
        const todayStudy = Storage.getTodayStudy();
        if (isNewQuestion) {
            todayStudy.newQuestions++;
        } else {
            todayStudy.reviewQuestions++;
        }
        if (isCorrect) {
            todayStudy.correctCount++;
        } else {
            todayStudy.wrongCount++;
        }
        Storage.updateTodayStudy(todayStudy);
        
        EventBus.emit(EventBus.EVENTS.QUESTION_ANSWERED, {
            question: question,
            isCorrect: isCorrect,
            isNew: isNewQuestion
        });
        
        return question;
    },

    toggleFavorite(questionId) {
        const question = this.getById(questionId);
        if (!question) return null;
        
        const newFavoriteState = !question.isFavorite;
        this.update(questionId, { isFavorite: newFavoriteState });
        
        if (newFavoriteState) {
            EventBus.emit(EventBus.EVENTS.FAVORITE_ADDED, question);
        } else {
            EventBus.emit(EventBus.EVENTS.FAVORITE_REMOVED, question);
        }
        
        return { ...question, isFavorite: newFavoriteState };
    },

    removeFromWrong(questionId) {
        const question = this.getById(questionId);
        if (!question) return null;
        
        this.update(questionId, { isWrong: false });
        EventBus.emit(EventBus.EVENTS.WRONG_QUESTION_REMOVED, question);
        
        return { ...question, isWrong: false };
    },

    getFavorites() {
        const questions = this.getAll();
        return questions.filter(q => q.isFavorite);
    },

    getWrongQuestions() {
        const questions = this.getAll();
        return questions.filter(q => q.isWrong);
    },

    getQuestionsForReview() {
        const questions = this.getAll();
        const now = Date.now();
        
        return questions.filter(q => {
            if (!q.studyStats) return false;
            const nextReview = q.studyStats.nextReviewTime;
            return nextReview && nextReview <= now;
        });
    },

    getQuestionsByMode(bankId, mode, excludeIds = []) {
        let questions = [];
        
        if (bankId) {
            questions = this.getByBankId(bankId);
        } else {
            questions = this.getAll();
        }
        
        if (excludeIds.length > 0) {
            questions = questions.filter(q => !excludeIds.includes(q.id));
        }
        
        switch (mode) {
            case 'sequential':
                return questions;
            case 'random':
                return Utils.shuffle(questions);
            case 'reverse':
                return [...questions].reverse();
            case 'wrong':
                return questions.filter(q => q.isWrong);
            default:
                return questions;
        }
    },

    getRandomQuestions(bankId, count) {
        let questions = [];
        if (bankId) {
            questions = this.getByBankId(bankId);
        } else {
            questions = this.getAll();
        }
        
        const shuffled = Utils.shuffle(questions);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    },

    getStats(bankId = null) {
        let questions = [];
        if (bankId) {
            questions = this.getByBankId(bankId);
        } else {
            questions = this.getAll();
        }
        
        const stats = {
            total: questions.length,
            favorites: questions.filter(q => q.isFavorite).length,
            wrong: questions.filter(q => q.isWrong).length,
            forReview: questions.filter(q => {
                if (!q.studyStats) return false;
                const nextReview = q.studyStats.nextReviewTime;
                return nextReview && nextReview <= Date.now();
            }).length,
            typeBreakdown: {
                single: 0,
                multiple: 0,
                'true-false': 0,
                fill: 0,
                essay: 0
            }
        };
        
        questions.forEach(q => {
            if (stats.typeBreakdown.hasOwnProperty(q.type)) {
                stats.typeBreakdown[q.type]++;
            }
        });
        
        return stats;
    }
};

window.QuestionModel = QuestionModel;
