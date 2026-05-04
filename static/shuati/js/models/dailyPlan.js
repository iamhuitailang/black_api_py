const DailyPlanModel = {
    getPlan() {
        return Storage.getDailyPlan();
    },

    savePlan(plan) {
        Storage.saveDailyPlan(plan);
        EventBus.emit(EventBus.EVENTS.DAILY_PLAN_UPDATED, plan);
    },

    getTodayProgress() {
        const plan = this.getPlan();
        const todayStudy = Storage.getTodayStudy();
        
        const newProgress = plan.dailyNewQuestions > 0 
            ? Math.min(100, Math.round((todayStudy.newQuestions / plan.dailyNewQuestions) * 100))
            : 100;
        
        const reviewProgress = plan.dailyReviewQuestions > 0 
            ? Math.min(100, Math.round((todayStudy.reviewQuestions / plan.dailyReviewQuestions) * 100))
            : 100;
        
        const totalTarget = plan.dailyNewQuestions + plan.dailyReviewQuestions;
        const totalCompleted = todayStudy.newQuestions + todayStudy.reviewQuestions;
        const totalProgress = totalTarget > 0 
            ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100))
            : 100;
        
        return {
            plan: plan,
            today: todayStudy,
            newProgress: newProgress,
            reviewProgress: reviewProgress,
            totalProgress: totalProgress,
            isCompleted: totalProgress >= 100,
            newRemaining: Math.max(0, plan.dailyNewQuestions - todayStudy.newQuestions),
            reviewRemaining: Math.max(0, plan.dailyReviewQuestions - todayStudy.reviewQuestions)
        };
    },

    checkAndNotify() {
        const progress = this.getTodayProgress();
        const settings = Storage.getSettings();
        
        if (settings.notifications && !progress.isCompleted) {
            const now = new Date();
            const hour = now.getHours();
            
            if (hour >= 20 && hour < 22) {
                if (progress.newRemaining > 0 || progress.reviewRemaining > 0) {
                    const message = `今日计划还剩 ${progress.newRemaining + progress.reviewRemaining} 题未完成`;
                    Utils.sendNotification('背题神器', { body: message });
                }
            }
        }
    },

    getWeeklyCompletion() {
        const completion = {};
        const now = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() - (6 - i));
            const dateStr = date.toDateString();
            
            const dayStudy = Storage.getTodayStudy(dateStr);
            const plan = this.getPlan();
            
            const totalTarget = plan.dailyNewQuestions + plan.dailyReviewQuestions;
            const totalCompleted = dayStudy.newQuestions + dayStudy.reviewQuestions;
            
            completion[dateStr] = {
                date: date,
                target: totalTarget,
                completed: totalCompleted,
                completion: totalTarget > 0 
                    ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100))
                    : 100,
                isCompleted: totalTarget > 0 ? totalCompleted >= totalTarget : true
            };
        }
        
        return completion;
    },

    getStreakDays() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streak = 0;
        let currentDate = new Date(today);
        
        while (true) {
            const dateStr = currentDate.toDateString();
            const dayStudy = Storage.getTodayStudy(dateStr);
            const plan = this.getPlan();
            
            const totalTarget = plan.dailyNewQuestions + plan.dailyReviewQuestions;
            const totalCompleted = dayStudy.newQuestions + dayStudy.reviewQuestions;
            
            const isCompleted = totalTarget > 0 ? totalCompleted >= totalTarget : true;
            
            if (isCompleted && totalCompleted > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
            
            if (streak > 365) break;
        }
        
        return streak;
    }
};

window.DailyPlanModel = DailyPlanModel;
