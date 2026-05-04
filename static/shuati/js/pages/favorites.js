const FavoritesPage = {
    state: {
        questions: [],
        filteredQuestions: [],
        selectedBankId: null,
        currentPage: 1,
        pageSize: 10
    },

    render() {
        this.state.questions = QuestionModel.getFavorites();
        this.state.filteredQuestions = [...this.state.questions];
        this.state.selectedBankId = null;
        this.state.currentPage = 1;

        const banks = this.getBankList();

        const html = `
            <div class="page-container">
                <div class="page-header">
                    <div class="flex-between">
                        <div>
                            <h1 class="page-title">❤️ 收藏夹</h1>
                            <p class="page-subtitle">共 ${this.state.questions.length} 道收藏题目</p>
                        </div>
                        ${this.state.questions.length > 0 ? `
                            <button class="btn btn-primary" onclick="FavoritesPage.startReview()">
                                📖 开始复习
                            </button>
                        ` : ''}
                    </div>
                </div>

                ${banks.length > 0 ? `
                    <div class="card mb-20">
                        <div class="card-body">
                            <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                                <button class="tag ${!this.state.selectedBankId ? 'tag-primary' : ''}" 
                                    onclick="FavoritesPage.filterByBank(null)">
                                    全部
                                </button>
                                ${banks.map(bank => `
                                    <button class="tag ${this.state.selectedBankId === bank.id ? 'tag-primary' : ''}" 
                                        onclick="FavoritesPage.filterByBank('${bank.id}')">
                                        ${bank.icon} ${bank.name} (${bank.count})
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div id="favorites-questions-list">
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
                            <div class="icon">📌</div>
                            <h3>还没有收藏</h3>
                            <p>在学习过程中点击收藏按钮，将重点题目加入收藏夹</p>
                            <button class="btn btn-primary mt-12" onclick="Router.navigate('bank')">
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
                        const mastery = MemoryAlgorithm.calculateMasteryScore(q);
                        const masteryClass = mastery >= 60 ? 'success' : mastery >= 30 ? 'warning' : 'danger';

                        return `
                            <div class="question-item" style="border-bottom: 1px solid var(--border-color); padding: 16px;">
                                <div class="flex-between">
                                    <div style="flex: 1;">
                                        <div class="flex" style="align-items: center; gap: 8px; margin-bottom: 8px;">
                                            <span class="tag">
                                                ${this.getTypeLabel(q.type)}
                                            </span>
                                            <span class="tag">
                                                ${bank ? bank.icon + ' ' + bank.name : '未知题库'}
                                            </span>
                                            <span class="tag tag-${masteryClass}">
                                                掌握度: ${mastery}%
                                            </span>
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
                                            onclick="FavoritesPage.reviewQuestion('${q.id}')">
                                            复习
                                        </button>
                                        <button class="btn btn-sm btn-danger" 
                                            onclick="FavoritesPage.removeFavorite('${q.id}')">
                                            取消收藏
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
                    <button class="btn btn-sm" onclick="FavoritesPage.prevPage()" 
                        ${currentPage === 1 ? 'disabled' : ''}>
                        上一页
                    </button>
                    <span style="padding: 8px 16px; color: var(--text-secondary);">
                        ${currentPage} / ${totalPages}
                    </span>
                    <button class="btn btn-sm" onclick="FavoritesPage.nextPage()" 
                        ${currentPage === totalPages ? 'disabled' : ''}>
                        下一页
                    </button>
                </div>
            ` : ''}
        `;
    },

    getTypeLabel(type) {
        const labels = {
            single: '单选题',
            multiple: '多选题',
            'true-false': '判断题',
            fill: '填空题',
            essay: '简答题'
        };
        return labels[type] || type;
    },

    renderQuestionListToDOM() {
        const listContainer = document.getElementById('favorites-questions-list');
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

    startReview() {
        if (this.state.filteredQuestions.length > 0) {
            const firstQuestion = this.state.filteredQuestions[0];
            Router.navigate('study', { bankId: firstQuestion.bankId, mode: 'sequential' });
        }
    },

    reviewQuestion(questionId) {
        const question = QuestionModel.getById(questionId);
        if (question) {
            Router.navigate('study', { bankId: question.bankId, mode: 'sequential' });
        }
    },

    async removeFavorite(questionId) {
        const confirmed = await App.confirm('确定要取消收藏这道题吗？', '确认取消');
        if (confirmed) {
            QuestionModel.toggleFavorite(questionId);
            Toast.show('已取消收藏', 'success');
            this.render();
        }
    }
};

window.FavoritesPage = FavoritesPage;
