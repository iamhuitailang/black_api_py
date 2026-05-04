const WrongBookPage = {
    state: {
        questions: [],
        filteredQuestions: [],
        selectedBankId: null,
        currentPage: 1,
        pageSize: 10
    },

    render() {
        this.state.questions = QuestionModel.getWrongQuestions();
        this.state.filteredQuestions = [...this.state.questions];
        this.state.selectedBankId = null;
        this.state.currentPage = 1;

        const banks = this.getBankList();
        const stats = this.getStats();

        const html = `
            <div class="page-container">
                <div class="page-header">
                    <div class="flex-between">
                        <div>
                            <h1 class="page-title">📝 错题本</h1>
                            <p class="page-subtitle">共 ${this.state.questions.length} 道错题需要复习</p>
                        </div>
                        ${this.state.questions.length > 0 ? `
                            <button class="btn btn-primary" onclick="Router.navigate('study', { mode: 'wrong' })">
                                🔄 重做错题
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-4 gap-16 mb-20">
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 16px;">
                            <div style="font-size: 28px; font-weight: 700; color: var(--danger-color);">
                                ${stats.total}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">错题总数</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 16px;">
                            <div style="font-size: 28px; font-weight: 700; color: var(--warning-color);">
                                ${stats.needReview}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">待复习</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 16px;">
                            <div style="font-size: 28px; font-weight: 700; color: var(--primary-color);">
                                ${stats.banks}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">涉及题库</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 16px;">
                            <div style="font-size: 28px; font-weight: 700; color: var(--success-color);">
                                ${stats.highPriority}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">高优先级</div>
                        </div>
                    </div>
                </div>

                ${banks.length > 0 ? `
                    <div class="card mb-20">
                        <div class="card-body">
                            <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                                <button class="tag ${!this.state.selectedBankId ? 'tag-primary' : ''}" 
                                    onclick="WrongBookPage.filterByBank(null)">
                                    全部
                                </button>
                                ${banks.map(bank => `
                                    <button class="tag ${this.state.selectedBankId === bank.id ? 'tag-primary' : ''}" 
                                        onclick="WrongBookPage.filterByBank('${bank.id}')">
                                        ${bank.icon} ${bank.name} (${bank.count})
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div id="wrong-questions-list">
                    ${this.renderQuestionList()}
                </div>
            </div>
        `;

        App.renderMainContent(html);
    },

    getBankList() {
        const bankMap = {};
        this.state.questions.forEach(q => {
            if (!bankMap[q.bankId]) {
                const bank = BankModel.getById(q.bankId);
                bankMap[q.bankId] = {
                    id: q.bankId,
                    name: bank ? bank.name : '未知题库',
                    icon: bank ? bank.icon : '📁',
                    count: 0
                };
            }
            bankMap[q.bankId].count++;
        });
        return Object.values(bankMap);
    },

    getStats() {
        const now = Date.now();
        let needReview = 0;
        let highPriority = 0;
        const bankIds = new Set();

        this.state.questions.forEach(q => {
            bankIds.add(q.bankId);
            if (q.studyStats && q.studyStats.nextReviewTime && q.studyStats.nextReviewTime <= now) {
                needReview++;
            }
            if (q.wrongCount && q.wrongCount >= 3) {
                highPriority++;
            }
        });

        return {
            total: this.state.questions.length,
            needReview,
            banks: bankIds.size,
            highPriority
        };
    },

    filterByBank(bankId) {
        this.state.selectedBankId = bankId;
        this.state.currentPage = 1;

        if (bankId) {
            this.state.filteredQuestions = this.state.questions.filter(q => q.bankId === bankId);
        } else {
            this.state.filteredQuestions = [...this.state.questions];
        }

        this.renderQuestionListToDOM();
    },

    renderQuestionList() {
        const { filteredQuestions, currentPage, pageSize } = this.state;
        const totalPages = Math.ceil(filteredQuestions.length / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const pageQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

        if (filteredQuestions.length === 0) {
            return `
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="icon">🎉</div>
                            <h3>太棒了！</h3>
                            <p>错题本是空的，继续保持！</p>
                            <button class="btn btn-primary mt-12" onclick="Router.navigate('home')">
                                去学习
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <div class="card-body" style="padding: 0;">
                    ${pageQuestions.map((q, idx) => {
                        const bank = BankModel.getById(q.bankId);
                        const priority = q.wrongCount >= 3 ? 'high' : q.wrongCount >= 2 ? 'medium' : 'low';
                        const priorityText = { high: '高', medium: '中', low: '低' };
                        const priorityClass = { high: 'danger', medium: 'warning', low: 'secondary' };

                        return `
                            <div class="question-item" style="border-bottom: 1px solid var(--border-color); padding: 16px;">
                                <div class="flex-between">
                                    <div style="flex: 1;">
                                        <div class="flex" style="align-items: center; gap: 8px; margin-bottom: 8px;">
                                            <span class="tag tag-${priorityClass[priority]}">
                                                优先级: ${priorityText[priority]}
                                            </span>
                                            <span class="tag">
                                                ${bank ? bank.icon + ' ' + bank.name : '未知题库'}
                                            </span>
                                            ${q.wrongCount ? `
                                                <span class="tag" style="background: var(--danger-bg); color: var(--danger-color);">
                                                    错误 ${q.wrongCount} 次
                                                </span>
                                            ` : ''}
                                        </div>
                                        <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 8px; line-height: 1.5;">
                                            ${Utils.truncate(q.content, 100)}
                                        </div>
                                        ${q.studyStats && q.studyStats.totalCount > 0 ? `
                                            <div style="font-size: 12px; color: var(--text-secondary);">
                                                正确率: ${Math.round(q.studyStats.correctCount / q.studyStats.totalCount * 100)}%
                                                · 练习 ${q.studyStats.totalCount} 次
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="flex" style="gap: 8px; align-items: flex-start;">
                                        <button class="btn btn-sm btn-primary" 
                                            onclick="WrongBookPage.reviewQuestion('${q.id}')">
                                            复习
                                        </button>
                                        <button class="btn btn-sm btn-outline" 
                                            onclick="WrongBookPage.removeFromWrong('${q.id}')">
                                            移除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            ${totalPages > 1 ? `
                <div class="flex mt-16" style="justify-content: center; gap: 8px;">
                    <button class="btn btn-sm" onclick="WrongBookPage.prevPage()" 
                        ${currentPage === 1 ? 'disabled' : ''}>
                        上一页
                    </button>
                    <span style="padding: 8px 16px; color: var(--text-secondary);">
                        ${currentPage} / ${totalPages}
                    </span>
                    <button class="btn btn-sm" onclick="WrongBookPage.nextPage()" 
                        ${currentPage === totalPages ? 'disabled' : ''}>
                        下一页
                    </button>
                </div>
            ` : ''}
        `;
    },

    renderQuestionListToDOM() {
        const listContainer = document.getElementById('wrong-questions-list');
        if (listContainer) {
            listContainer.innerHTML = this.renderQuestionList();
        }
    },

    prevPage() {
        if (this.state.currentPage > 1) {
            this.state.currentPage--;
            this.renderQuestionListToDOM();
        }
    },

    nextPage() {
        const totalPages = Math.ceil(this.state.filteredQuestions.length / this.state.pageSize);
        if (this.state.currentPage < totalPages) {
            this.state.currentPage++;
            this.renderQuestionListToDOM();
        }
    },

    reviewQuestion(questionId) {
        const question = QuestionModel.getById(questionId);
        if (question) {
            Router.navigate('study', { bankId: question.bankId, mode: 'sequential' });
        }
    },

    async removeFromWrong(questionId) {
        const confirmed = await App.confirm('确定要将这道题移出错题本吗？', '确认移除');
        if (confirmed) {
            QuestionModel.removeFromWrong(questionId);
            Toast.show('已移出错题本', 'success');
            this.render();
        }
    }
};

window.WrongBookPage = WrongBookPage;
