const MemoryAlgorithm = {
    EBBINGHAUS_INTERVALS: [1, 2, 4, 7, 15, 30],

    calculateSM2(quality, interval, easeFactor, repetitions) {
        if (quality < 0 || quality > 5) {
            quality = 0;
        }

        let newInterval = interval;
        let newEaseFactor = easeFactor;
        let newRepetitions = repetitions;

        if (quality >= 3) {
            if (repetitions === 0) {
                newInterval = 1;
            } else if (repetitions === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(interval * easeFactor);
            }
            newRepetitions = repetitions + 1;
        } else {
            newRepetitions = 0;
            newInterval = 1;
        }

        newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        
        if (newEaseFactor < 1.3) {
            newEaseFactor = 1.3;
        }

        return {
            interval: newInterval,
            easeFactor: Math.round(newEaseFactor * 100) / 100,
            repetitions: newRepetitions
        };
    },

    calculateEbbinghaus(repetitionCount) {
        if (repetitionCount < 0) {
            return 1;
        }
        
        const index = Math.min(repetitionCount, this.EBBINGHAUS_INTERVALS.length - 1);
        return this.EBBINGHAUS_INTERVALS[index];
    },

    getForgettingCurveData() {
        return [
            { label: '刚学完', value: 100 },
            { label: '20分钟', value: 58 },
            { label: '1小时', value: 44 },
            { label: '9小时', value: 36 },
            { label: '1天', value: 33 },
            { label: '2天', value: 28 },
            { label: '6天', value: 25 },
            { label: '31天', value: 21 }
        ];
    },

    getPersonalizedForgettingCurve(question) {
        if (!question || !question.studyStats) {
            return this.getForgettingCurveData();
        }

        const stats = question.studyStats;
        const accuracy = stats.totalCount > 0 ? stats.correctCount / stats.totalCount : 0.5;
        const easeFactor = stats.easeFactor || 2.5;
        
        const baseData = this.getForgettingCurveData();
        
        const retentionBoost = (easeFactor - 1.3) * 10;
        const accuracyBoost = accuracy * 20;
        const totalBoost = Math.min(retentionBoost + accuracyBoost, 30);
        
        return baseData.map(d => ({
            label: d.label,
            value: Math.min(100, d.value + totalBoost)
        }));
    },

    calculateNextReview(question, isCorrect, useEbbinghaus = false) {
        const stats = question.studyStats || {
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0
        };

        let result;
        if (useEbbinghaus) {
            const repetitionCount = isCorrect ? stats.repetitions + 1 : 0;
            const interval = this.calculateEbbinghaus(repetitionCount);
            result = {
                interval: interval,
                easeFactor: stats.easeFactor,
                repetitions: repetitionCount
            };
        } else {
            result = this.calculateSM2(
                isCorrect ? 5 : 2,
                stats.interval,
                stats.easeFactor,
                stats.repetitions
            );
        }

        const nextReviewTime = Date.now() + (result.interval * 24 * 60 * 60 * 1000);

        return {
            ...result,
            nextReviewTime: nextReviewTime
        };
    },

    getReviewPriority(question) {
        if (!question || !question.studyStats) {
            return 0;
        }

        const stats = question.studyStats;
        const now = Date.now();
        
        let priority = 0;

        if (stats.nextReviewTime && stats.nextReviewTime <= now) {
            const overdueDays = (now - stats.nextReviewTime) / (24 * 60 * 60 * 1000);
            priority += Math.min(overdueDays * 10, 50);
        }

        if (stats.totalCount > 0) {
            const accuracy = stats.correctCount / stats.totalCount;
            priority += (1 - accuracy) * 30;
        }

        const easeFactor = stats.easeFactor || 2.5;
        if (easeFactor < 2) {
            priority += (2 - easeFactor) * 20;
        }

        if (question.isWrong) {
            priority += 15;
        }

        return Math.round(priority);
    },

    sortQuestionsForReview(questions) {
        return [...questions].sort((a, b) => {
            const priorityA = this.getReviewPriority(a);
            const priorityB = this.getReviewPriority(b);
            return priorityB - priorityA;
        });
    },

    getReviewSchedule() {
        const reviewQuestions = QuestionModel.getQuestionsForReview();
        const sorted = this.sortQuestionsForReview(reviewQuestions);
        
        const schedule = {
            today: [],
            overdue: [],
            upcoming: []
        };

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        sorted.forEach(q => {
            if (!q.studyStats || !q.studyStats.nextReviewTime) {
                schedule.today.push(q);
                return;
            }

            const nextReview = q.studyStats.nextReviewTime;
            if (nextReview <= now) {
                schedule.overdue.push(q);
            } else if (nextReview <= now + oneDay) {
                schedule.today.push(q);
            } else if (nextReview <= now + (7 * oneDay)) {
                schedule.upcoming.push(q);
            }
        });

        return schedule;
    },

    calculateMasteryScore(question) {
        if (!question || !question.studyStats) {
            return 0;
        }

        const stats = question.studyStats;
        
        if (stats.totalCount === 0) {
            return 0;
        }

        const accuracyScore = (stats.correctCount / stats.totalCount) * 40;
        
        const repetitionBonus = Math.min(stats.repetitions * 5, 30);
        
        const easeScore = stats.easeFactor >= 2.5 ? 15 : 
                          stats.easeFactor >= 2 ? 10 : 
                          stats.easeFactor >= 1.5 ? 5 : 0;
        
        const recencyBonus = stats.lastReviewTime ? 
            Math.max(0, 15 - ((Date.now() - stats.lastReviewTime) / (7 * 24 * 60 * 60 * 1000)) * 15) : 0;

        const totalScore = accuracyScore + repetitionBonus + easeScore + recencyBonus;

        return Math.round(Math.min(100, totalScore));
    },

    getBankMastery(bankId) {
        const questions = QuestionModel.getByBankId(bankId);
        
        if (questions.length === 0) {
            return {
                total: 0,
                mastered: 0,
                learning: 0,
                new: 0,
                averageMastery: 0
            };
        }

        const stats = {
            total: questions.length,
            mastered: 0,
            learning: 0,
            new: 0,
            totalMastery: 0
        };

        questions.forEach(q => {
            const mastery = this.calculateMasteryScore(q);
            stats.totalMastery += mastery;

            if (mastery >= 80) {
                stats.mastered++;
            } else if (mastery > 0) {
                stats.learning++;
            } else {
                stats.new++;
            }
        });

        stats.averageMastery = Math.round(stats.totalMastery / stats.total);

        return stats;
    },

    getStudyRecommendation() {
        const reviewQuestions = QuestionModel.getQuestionsForReview();
        const allQuestions = QuestionModel.getAll();
        
        const newQuestions = allQuestions.filter(q => 
            !q.studyStats || q.studyStats.totalCount === 0
        );

        const reviewByPriority = this.sortQuestionsForReview(reviewQuestions);

        return {
            urgentReview: reviewByPriority.slice(0, Math.min(10, reviewByPriority.length)),
            suggestedReview: reviewByPriority,
            newQuestions: newQuestions.slice(0, 20),
            reviewCount: reviewQuestions.length,
            newCount: newQuestions.length
        };
    },

    calculateSpacedRepetitionSchedule(questionCount, dailyLimit = 20) {
        const schedule = [];
        let day = 0;
        let remaining = questionCount;

        while (remaining > 0) {
            const todayNew = Math.min(dailyLimit, remaining);
            const todayReview = Math.floor(todayNew * 0.5);
            
            schedule.push({
                day: day,
                new: todayNew,
                review: todayReview,
                total: todayNew + todayReview
            });

            remaining -= todayNew;
            day++;

            for (let i = 1; i <= 6; i++) {
                const reviewDay = day + this.calculateEbbinghaus(i);
                if (reviewDay < schedule.length) {
                    schedule[reviewDay].review += todayNew;
                    schedule[reviewDay].total += todayNew;
                }
            }
        }

        return schedule;
    }
};

window.MemoryAlgorithm = MemoryAlgorithm;
