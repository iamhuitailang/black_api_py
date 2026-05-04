const ReviewPage = {
    state: {
        schedule: null,
        questions: []
    },

    render() {
        this.state.schedule = MemoryAlgorithm.getReviewSchedule();
        this.state.questions = QuestionModel.getQuestionsForReview();

        const html = `
            <div class="page-container">
                <div class="page-header">
                    <div class="flex-between">
                        <div>
                            <h1 class="page-title">🔄 待复习</h1>
                            <p class="page-subtitle">根据艾宾浩斯记忆曲线，今天有 ${this.getTodayCount()} 道题需要复习</p>
                        </div>
                        ${this.state.questions.length > 0 ? `
                            <button class="btn btn-primary" onclick="Router.navigate('study', { mode: 'sequential' })">
                                📖 开始复习
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-16 mb-20">
                    <div class="card ${this.state.schedule.overdue.length > 0 ? 'card-danger' : ''}">
                        <div class="card-body" style="text-align: center; padding: 20px;">
                            <div style="font-size: 40px; margin-bottom: 8px;">⚠️</div>
                            <div style="font-size: 32px; font-weight: 700; color: var(--danger-color);">
                                ${this.state.schedule.overdue.length}
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">已过期</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 20px;">
                            <div style="font-size: 40px; margin-bottom: 8px;">📅</div>
                            <div style="font-size: 32px; font-weight: 700; color: var(--primary-color);">
                                ${this.state.schedule.today.length}
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">今日待复习</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 20px;">
                            <div style="font-size: 40px; margin-bottom: 8px;">🔮</div>
                            <div style="font-size: 32px; font-weight: 700; color: var(--success-color);">
                                ${this.state.schedule.upcoming.length}
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">即将到来</div>
                        </div>
                    </div>
                </div>

                <div class="card mb-20">
                    <div class="card-header">
                        <h2 class="card-title">📊 记忆曲线</h2>
                    </div>
                    <div class="card-body">
                        <canvas id="forgetting-curve" style="width: 100%; height: 200px;"></canvas>
                        <p class="text-center mt-8" style="font-size: 12px; color: var(--text-secondary);">
                            根据艾宾浩斯遗忘曲线，定期复习可以大幅提高记忆效果
                        </p>
                    </div>
                </div>

                ${this.state.schedule.overdue.length > 0 ? `
                    <div class="card mb-20">
                        <div class="card-header">
                            <h2 class="card-title" style="color: var(--danger-color);">⚠️ 已过期 (${this.state.schedule.overdue.length})</h2>
                            <button class="btn btn-sm btn-danger" onclick="ReviewPage.reviewGroup('overdue')">
                                立即复习
                            </button>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${this.renderQuestionList(this.state.schedule.overdue.slice(0, 5), 'overdue')}
                            ${this.state.schedule.overdue.length > 5 ? `
                                <div style="padding: 12px; text-align: center; border-top: 1px solid var(--border-color);">
                                    <span style="color: var(--text-secondary);">还有 ${this.state.schedule.overdue.length - 5} 道题...</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${this.state.schedule.today.length > 0 ? `
                    <div class="card mb-20">
                        <div class="card-header">
                            <h2 class="card-title">📅 今日待复习 (${this.state.schedule.today.length})</h2>
                            <button class="btn btn-sm btn-primary" onclick="ReviewPage.reviewGroup('today')">
                                开始复习
                            </button>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${this.renderQuestionList(this.state.schedule.today.slice(0, 10), 'today')}
                            ${this.state.schedule.today.length > 10 ? `
                                <div style="padding: 12px; text-align: center; border-top: 1px solid var(--border-color);">
                                    <span style="color: var(--text-secondary);">还有 ${this.state.schedule.today.length - 10} 道题...</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${this.state.schedule.upcoming.length > 0 ? `
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">🔮 即将到来 (${this.state.schedule.upcoming.length})</h2>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${this.renderQuestionList(this.state.schedule.upcoming.slice(0, 5), 'upcoming')}
                        </div>
                    </div>
                ` : ''}

                ${this.state.questions.length === 0 && this.state.schedule.today.length === 0 && this.state.schedule.upcoming.length === 0 ? `
                    <div class="card">
                        <div class="card-body">
                            <div class="empty-state">
                                <div class="icon">🎉</div>
                                <h3>太棒了！</h3>
                                <p>没有需要复习的题目，继续保持学习的好习惯！</p>
                                <button class="btn btn-primary mt-12" onclick="Router.navigate('bank')">
                                    去学习新内容
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        App.renderMainContent(html);
        this.initCharts();
    },

    getTodayCount() {
        return this.state.schedule.overdue.length + this.state.schedule.today.length;
    },

    renderQuestionList(questions, group) {
        if (questions.length === 0) {
            return `
                <div style="padding: 16px; text-align: center; color: var(--text-secondary);">
                    暂无题目
                </div>
            `;
        }

        return questions.map(q => {
            const bank = BankModel.getById(q.bankId);
            const priority = MemoryAlgorithm.getReviewPriority(q);
            const priorityClass = priority >= 50 ? 'danger' : priority >= 30 ? 'warning' : 'secondary';

            return `
                <div class="question-item" style="border-bottom: 1px solid var(--border-color); padding: 12px 16px;">
                    <div class="flex-between">
                        <div style="flex: 1;">
                            <div class="flex" style="align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span class="tag tag-${priorityClass}">
                                    优先级: ${priority}
                                </span>
                                <span class="tag">
                                    ${bank ? bank.icon + ' ' + bank.name : '未知题库'}
                                </span>
                            </div>
                            <div style="font-weight: 500; color: var(--text-primary); line-height: 1.4;">
                                ${Utils.truncate(q.content, 80)}
                            </div>
                            ${q.studyStats && q.studyStats.nextReviewTime ? `
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                    下次复习: ${Utils.formatDate(q.studyStats.nextReviewTime)}
                                </div>
                            ` : ''}
                        </div>
                        <button class="btn btn-sm btn-primary" 
                            onclick="ReviewPage.reviewQuestion('${q.id}')">
                            复习
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    initCharts() {
        const canvas = document.getElementById('forgetting-curve');
        if (canvas) {
            const curveData = MemoryAlgorithm.getForgettingCurveData();
            CanvasUtils.drawForgettingCurve(canvas, curveData);
        }
    },

    reviewGroup(group) {
        Router.navigate('study', { mode: 'sequential' });
    },

    reviewQuestion(questionId) {
        const question = QuestionModel.getById(questionId);
        if (question) {
            Router.navigate('study', { bankId: question.bankId, mode: 'sequential' });
        }
    }
};

window.ReviewPage = ReviewPage;
