const HomePage = {
    render() {
        const stats = this.getDashboardStats();
        const dailyProgress = DailyPlanModel.getTodayProgress();
        const recommendations = MemoryAlgorithm.getStudyRecommendation();
        const recentBanks = this.getRecentBanks();
        
        const html = `
            <div class="page-container">
                <div class="page-header">
                    <h1 class="page-title">📚 欢迎使用背题神器</h1>
                    <p class="page-subtitle">科学记忆，高效学习</p>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">总题库数</span>
                            <span class="stat-card-icon primary">📁</span>
                        </div>
                        <div class="stat-card-value">${stats.totalBanks}</div>
                        <div class="stat-card-change">${stats.totalQuestions} 道题目</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">今日进度</span>
                            <span class="stat-card-icon ${dailyProgress.isCompleted ? 'success' : 'warning'}">${dailyProgress.isCompleted ? '✅' : '⏳'}</span>
                        </div>
                        <div class="stat-card-value">${dailyProgress.totalProgress}%</div>
                        <div class="stat-card-change">${dailyProgress.today.newQuestions + dailyProgress.today.reviewQuestions} / ${dailyProgress.plan.dailyNewQuestions + dailyProgress.plan.dailyReviewQuestions} 题</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">待复习</span>
                            <span class="stat-card-icon danger">🔄</span>
                        </div>
                        <div class="stat-card-value">${recommendations.reviewCount}</div>
                        <div class="stat-card-change">需要复习的题目</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">连续天数</span>
                            <span class="stat-card-icon success">🔥</span>
                        </div>
                        <div class="stat-card-value">${stats.streakDays}</div>
                        <div class="stat-card-change">天连续学习</div>
                    </div>
                </div>

                <div class="card mb-20">
                    <div class="card-header">
                        <h2 class="card-title">📊 今日学习计划</h2>
                        <button class="btn btn-sm btn-primary" onclick="Router.navigate('settings')">
                            调整计划
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-2 gap-20">
                            <div>
                                <div class="flex-between mb-8">
                                    <span>新题目</span>
                                    <span>${dailyProgress.today.newQuestions} / ${dailyProgress.plan.dailyNewQuestions}</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width: ${dailyProgress.newProgress}%"></div>
                                </div>
                                <div class="mt-8">
                                    ${dailyProgress.newRemaining > 0 ? 
                                        `<span class="text-warning">还剩 ${dailyProgress.newRemaining} 道新题</span>` :
                                        '<span class="text-success">✅ 已完成新题目标</span>'
                                    }
                                </div>
                            </div>
                            <div>
                                <div class="flex-between mb-8">
                                    <span>复习题</span>
                                    <span>${dailyProgress.today.reviewQuestions} / ${dailyProgress.plan.dailyReviewQuestions}</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width: ${dailyProgress.reviewProgress}%"></div>
                                </div>
                                <div class="mt-8">
                                    ${dailyProgress.reviewRemaining > 0 ? 
                                        `<span class="text-warning">还剩 ${dailyProgress.reviewRemaining} 道复习题</span>` :
                                        '<span class="text-success">✅ 已完成复习目标</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-20">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">🔥 推荐学习</h2>
                        </div>
                        <div class="card-body">
                            ${recommendations.urgentReview.length > 0 ? `
                                <div class="mb-16">
                                    <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                                        急需复习 (${recommendations.urgentReview.length}题)
                                    </h3>
                                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                        ${recommendations.urgentReview.slice(0, 5).map(q => `
                                            <span class="tag" style="background: var(--danger-color); color: white;">
                                                ${Utils.truncate(q.content, 15)}
                                            </span>
                                        `).join('')}
                                    </div>
                                    <button class="btn btn-sm btn-danger mt-12" onclick="Router.navigate('review')">
                                        开始复习
                                    </button>
                                </div>
                            ` : ''}
                            
                            ${recommendations.newQuestions.length > 0 ? `
                                <div>
                                    <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                                        新题目 (${recommendations.newQuestions.length}题)
                                    </h3>
                                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                        ${recommendations.newQuestions.slice(0, 5).map(q => `
                                            <span class="tag">
                                                ${Utils.truncate(q.content, 15)}
                                            </span>
                                        `).join('')}
                                    </div>
                                    ${recentBanks.length > 0 ? `
                                        <button class="btn btn-sm btn-primary mt-12" onclick="Router.navigate('study', { bankId: '${recentBanks[0].id}', mode: 'sequential' })">
                                            开始学习
                                        </button>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            ${recommendations.urgentReview.length === 0 && recommendations.newQuestions.length === 0 ? `
                                <div class="empty-state">
                                    <div class="icon">🎉</div>
                                    <h3>太棒了！</h3>
                                    <p>没有需要复习的题目，继续保持！</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">📁 我的题库</h2>
                            <button class="btn btn-sm btn-primary" onclick="Router.navigate('bank')">
                                管理题库
                            </button>
                        </div>
                        <div class="card-body">
                            ${recentBanks.length > 0 ? `
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    ${recentBanks.slice(0, 4).map(bank => `
                                        <div class="question-bank-card" style="padding: 12px 16px; cursor: pointer;" onclick="Router.navigate('bank', { id: '${bank.id}' })">
                                            <div class="flex-between">
                                                <div class="flex" style="align-items: center; gap: 12px;">
                                                    <span style="font-size: 24px;">${bank.icon}</span>
                                                    <div>
                                                        <div style="font-weight: 600; color: var(--text-primary);">${bank.name}</div>
                                                        <div style="font-size: 12px; color: var(--text-secondary);">${bank.questionCount} 道题目 · 掌握 ${bank.masteryRate}%</div>
                                                    </div>
                                                </div>
                                                <div class="mastery-bar" style="width: 80px;">
                                                    <div class="mastery-bar-fill ${bank.masteryRate >= 60 ? 'mastery-high' : bank.masteryRate >= 30 ? 'mastery-medium' : 'mastery-low'}" style="width: ${bank.masteryRate}%"></div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="empty-state">
                                    <div class="icon">📁</div>
                                    <h3>还没有题库</h3>
                                    <p>创建你的第一个题库开始学习吧</p>
                                    <button class="btn btn-primary mt-12" onclick="Router.navigate('bank')">
                                        创建题库
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <div class="card mt-20">
                    <div class="card-header">
                        <h2 class="card-title">📈 学习热力图</h2>
                    </div>
                    <div class="card-body">
                        <canvas id="calendar-heatmap" style="width: 100%; height: 120px;"></canvas>
                        <div class="flex mt-12" style="align-items: center; gap: 8px; justify-content: flex-end;">
                            <span style="font-size: 12px; color: var(--text-secondary);">少</span>
                            <div style="display: flex; gap: 4px;">
                                <div class="calendar-day level-0"></div>
                                <div class="calendar-day level-1"></div>
                                <div class="calendar-day level-2"></div>
                                <div class="calendar-day level-3"></div>
                                <div class="calendar-day level-4"></div>
                            </div>
                            <span style="font-size: 12px; color: var(--text-secondary);">多</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        App.renderMainContent(html);
        this.initCharts();
    },

    getDashboardStats() {
        const banks = BankModel.getAll();
        const streakDays = DailyPlanModel.getStreakDays();
        const totalQuestions = BankModel.getTotalQuestions();
        
        return {
            totalBanks: banks.length,
            totalQuestions: totalQuestions,
            streakDays: streakDays
        };
    },

    getRecentBanks() {
        const banks = BankModel.getAll();
        return banks
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);
    },

    initCharts() {
        const heatmapCanvas = document.getElementById('calendar-heatmap');
        if (heatmapCanvas) {
            const heatmapData = StudyRecordModel.getCalendarHeatmapData();
            CanvasUtils.drawCalendarHeatmap(heatmapCanvas, heatmapData);
        }
    }
};

window.HomePage = HomePage;
