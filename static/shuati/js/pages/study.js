const StudyPage = {
    state: {
        questions: [],
        currentIndex: 0,
        showAnswer: false,
        selectedAnswers: [],
        bankId: null,
        mode: 'sequential',
        isQuickMode: false,
        completedCount: 0
    },

    render(params = {}) {
        const bankId = params.bankId || params.id;
        const mode = params.mode || 'sequential';
        const isQuickMode = mode === 'quick';

        this.state = {
            questions: [],
            currentIndex: 0,
            showAnswer: false,
            selectedAnswers: [],
            bankId: bankId,
            mode: mode,
            isQuickMode: isQuickMode,
            completedCount: 0
        };

        const savedState = Storage.getStudyState();
        if (savedState && savedState.bankId === bankId && savedState.mode === mode) {
            this.state.currentIndex = savedState.currentIndex || 0;
            this.state.showAnswer = savedState.showAnswer || false;
        }

        this.loadQuestions();

        const bank = bankId ? BankModel.getById(bankId) : null;
        const modeNames = {
            sequential: '顺序刷题',
            random: '随机刷题',
            reverse: '倒序刷题',
            wrong: '错题重做',
            quick: '快速刷题'
        };

        const html = `
            <div class="page-container">
                <div class="page-header">
                    <div class="flex-between">
                        <div>
                            <h1 class="page-title">
                                ${bank ? bank.icon + ' ' + bank.name : '📝 学习中心'}
                            </h1>
                            <p class="page-subtitle">${modeNames[mode] || mode}</p>
                        </div>
                        <button class="btn btn-secondary" onclick="Router.navigate('${bankId ? 'bank' : 'home'}'${bankId ? `, { id: '${bankId}' }` : ''})">
                            返回
                        </button>
                    </div>
                </div>

                <div class="study-progress-bar mb-20">
                    <div class="flex-between mb-8">
                        <span>学习进度</span>
                        <span id="progress-text">0 / 0</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" id="progress-fill" style="width: 0%"></div>
                    </div>
                </div>

                <div id="study-card" class="card study-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="icon">📚</div>
                            <h3>加载中...</h3>
                            <p>正在准备题目</p>
                        </div>
                    </div>
                </div>

                <div class="flex mt-20" style="justify-content: center; gap: 12px;">
                    <button class="btn btn-outline" id="prev-btn" onclick="StudyPage.prevQuestion()" disabled>
                        ← 上一题
                    </button>
                    <button class="btn btn-outline" id="next-btn" onclick="StudyPage.nextQuestion()" disabled>
                        下一题 →
                    </button>
                </div>
            </div>
        `;

        App.renderMainContent(html);
        this.renderCurrentQuestion();
    },

    loadQuestions() {
        const { bankId, mode } = this.state;
        
        if (mode === 'wrong') {
            if (bankId) {
                this.state.questions = QuestionModel.getByBankId(bankId).filter(q => q.isWrong);
            } else {
                this.state.questions = QuestionModel.getWrongQuestions();
            }
        } else {
            let questions = [];
            if (bankId) {
                questions = QuestionModel.getByBankId(bankId);
            } else {
                questions = QuestionModel.getAll();
            }

            switch (mode) {
                case 'random':
                    this.state.questions = Utils.shuffle(questions);
                    break;
                case 'reverse':
                    this.state.questions = [...questions].reverse();
                    break;
                case 'quick':
                    this.state.questions = Utils.shuffle(questions);
                    break;
                default:
                    this.state.questions = questions;
            }
        }

        if (this.state.currentIndex >= this.state.questions.length) {
            this.state.currentIndex = 0;
        }
    },

    getCurrentQuestion() {
        return this.state.questions[this.state.currentIndex] || null;
    },

    renderCurrentQuestion() {
        const question = this.getCurrentQuestion();
        const { currentIndex, showAnswer, selectedAnswers, questions } = this.state;
        const total = questions.length;

        if (!question) {
            this.renderEmpty();
            return;
        }

        const progress = total > 0 ? ((currentIndex + 1) / total * 100) : 0;
        const progressText = document.getElementById('progress-text');
        const progressFill = document.getElementById('progress-fill');
        if (progressText) progressText.textContent = `${currentIndex + 1} / ${total}`;
        if (progressFill) progressFill.style.width = `${progress}%`;

        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === questions.length - 1;

        const isSingleChoice = question.type === 'single';
        const isMultipleChoice = question.type === 'multiple';
        const isTrueFalse = question.type === 'true-false';
        const isFill = question.type === 'fill';
        const isEssay = question.type === 'essay';

        const typeLabels = {
            single: '单选题',
            multiple: '多选题',
            'true-false': '判断题',
            fill: '填空题',
            essay: '简答题'
        };

        const isCorrect = this.checkAnswer(selectedAnswers, question.answer);

        const card = document.getElementById('study-card');
        if (!card) return;

        card.innerHTML = `
            <div class="card-body">
                <div class="flex-between mb-16">
                    <span class="tag">${typeLabels[question.type]}</span>
                    <div class="flex" style="gap: 8px;">
                        <button class="btn btn-sm ${question.isFavorite ? 'btn-danger' : 'btn-outline'}" 
                            onclick="StudyPage.toggleFavorite()">
                            ${question.isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
                        </button>
                    </div>
                </div>

                <div class="question-content mb-20">
                    <h3 style="font-size: 18px; font-weight: 600; color: var(--text-primary); line-height: 1.6;">
                        ${this.formatQuestionContent(question.content)}
                    </h3>
                    ${question.difficulty > 1 ? `
                        <div class="mt-8">
                            ${'⭐'.repeat(question.difficulty)}
                            <span style="font-size: 12px; color: var(--text-secondary);">难度</span>
                        </div>
                    ` : ''}
                </div>

                ${(isSingleChoice || isMultipleChoice || isTrueFalse) ? `
                    <div class="options-list mb-20">
                        ${this.renderOptions(question, selectedAnswers, showAnswer)}
                    </div>
                ` : ''}

                ${isFill ? `
                    <div class="mb-20">
                        <textarea class="form-input" id="fill-answer" placeholder="请输入答案..."
                            style="min-height: 100px;" oninput="StudyPage.handleFillInput(this.value)"
                            ${showAnswer ? 'disabled' : ''}>${selectedAnswers[0] || ''}</textarea>
                    </div>
                ` : ''}

                ${isEssay ? `
                    <div class="mb-20">
                        <textarea class="form-input" id="essay-answer" placeholder="请输入你的答案..."
                            style="min-height: 150px;" oninput="StudyPage.handleEssayInput(this.value)"
                            ${showAnswer ? 'disabled' : ''}>${selectedAnswers[0] || ''}</textarea>
                    </div>
                ` : ''}

                ${showAnswer ? `
                    <div class="answer-section ${isCorrect ? 'correct' : 'wrong'}" style="animation: slideDown 0.3s ease;">
                        <div class="flex-between mb-12">
                            <span class="answer-status">
                                ${isCorrect ? '✅ 回答正确' : '❌ 回答错误'}
                            </span>
                            ${question.studyStats && question.studyStats.totalCount > 0 ? `
                                <span style="font-size: 12px; color: var(--text-secondary);">
                                    正确率: ${question.studyStats.totalCount > 0 ? 
                                        Math.round(question.studyStats.correctCount / question.studyStats.totalCount * 100) : 0}%
                                </span>
                            ` : ''}
                        </div>
                        
                        <div class="mb-12">
                            <div style="font-weight: 600; margin-bottom: 4px;">正确答案:</div>
                            <div style="color: var(--success-color); font-weight: 500;">
                                ${this.renderCorrectAnswer(question)}
                            </div>
                        </div>

                        ${question.explanation ? `
                            <div>
                                <div style="font-weight: 600; margin-bottom: 4px;">解析:</div>
                                <div style="color: var(--text-secondary); line-height: 1.6;">
                                    ${question.explanation}
                                </div>
                            </div>
                        ` : ''}

                        ${question.isWrong ? `
                            <div class="mt-12" style="padding: 8px 12px; background: var(--danger-bg); border-radius: 6px;">
                                <span style="color: var(--danger-color);">⚠️ 这是错题，请重点复习</span>
                            </div>
                        ` : ''}
                    </div>
                ` : `
                    <button class="btn btn-primary w-100" onclick="StudyPage.showAnswer()">
                        👁️ 显示答案
                    </button>
                    <p class="text-center mt-8" style="font-size: 12px; color: var(--text-secondary);">
                        按 空格键 显示答案
                    </p>
                `}

                ${showAnswer ? `
                    <div class="flex mt-20" style="gap: 12px; justify-content: center;">
                        <button class="btn btn-success btn-large" onclick="StudyPage.answerCorrect()" style="flex: 1;">
                            ✅ 我会了
                        </button>
                        <button class="btn btn-danger btn-large" onclick="StudyPage.answerWrong()" style="flex: 1;">
                            ❌ 不会
                        </button>
                    </div>
                    <p class="text-center mt-8" style="font-size: 12px; color: var(--text-secondary);">
                        按 1 键 = 会了 | 按 2 键 = 不会
                    </p>
                ` : ''}
            </div>
        `;

        this.saveStudyState();
    },

    renderEmpty() {
        const card = document.getElementById('study-card');
        if (!card) return;

        card.innerHTML = `
            <div class="card-body">
                <div class="empty-state">
                    <div class="icon">📚</div>
                    <h3>没有可学习的题目</h3>
                    <p>${this.state.mode === 'wrong' ? '当前没有错题，继续保持！' : '请先添加题目到题库'}</p>
                    <button class="btn btn-primary mt-12" onclick="Router.navigate('bank')">
                        去管理题库
                    </button>
                </div>
            </div>
        `;
    },

    formatQuestionContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/_{4,}/g, '______');
    },

    renderOptions(question, selectedAnswers, showAnswer) {
        const isSingleChoice = question.type === 'single';
        const isTrueFalse = question.type === 'true-false';
        const options = isTrueFalse ? 
            [{ label: '对', value: 'true' }, { label: '错', value: 'false' }] :
            (question.options || []);

        return options.map((opt, index) => {
            const label = isTrueFalse ? opt.label : String.fromCharCode(65 + index);
            const value = isTrueFalse ? opt.value : (typeof opt === 'object' ? opt.value : opt);
            const text = isTrueFalse ? opt.label : (typeof opt === 'object' ? opt.text : opt);
            
            const isSelected = selectedAnswers.includes(value);
            const isCorrect = question.answer.includes(value);
            
            let optionClass = 'option-item';
            if (showAnswer) {
                if (isCorrect) {
                    optionClass += ' correct';
                } else if (isSelected && !isCorrect) {
                    optionClass += ' wrong';
                }
            } else if (isSelected) {
                optionClass += ' selected';
            }

            return `
                <div class="${optionClass}" onclick="StudyPage.selectOption('${value}', ${isSingleChoice || isTrueFalse})">
                    <span class="option-label">${label}</span>
                    <span class="option-text">${text || value}</span>
                    ${showAnswer ? `
                        <span class="option-check">
                            ${isCorrect ? '✓' : (isSelected ? '✗' : '')}
                        </span>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    renderCorrectAnswer(question) {
        const isSingleChoice = question.type === 'single';
        const isMultipleChoice = question.type === 'multiple';
        const isTrueFalse = question.type === 'true-false';

        if (isTrueFalse) {
            return question.answer.map(a => a === 'true' ? '对' : '错').join(', ');
        }

        if (isSingleChoice || isMultipleChoice) {
            const options = question.options || [];
            return question.answer.map(ans => {
                const idx = options.findIndex(opt => 
                    (typeof opt === 'object' ? opt.value : opt) === ans
                );
                return idx >= 0 ? String.fromCharCode(65 + idx) : ans;
            }).join(', ');
        }

        return question.answer.join(', ') || '无';
    },

    checkAnswer(selectedAnswers, correctAnswers) {
        if (!correctAnswers || correctAnswers.length === 0) return true;
        if (!selectedAnswers || selectedAnswers.length === 0) return false;
        
        if (selectedAnswers.length !== correctAnswers.length) return false;
        
        return correctAnswers.every(ans => selectedAnswers.includes(ans));
    },

    selectOption(value, isSingle) {
        if (this.state.showAnswer) return;

        if (isSingle) {
            this.state.selectedAnswers = [value];
        } else {
            const idx = this.state.selectedAnswers.indexOf(value);
            if (idx >= 0) {
                this.state.selectedAnswers.splice(idx, 1);
            } else {
                this.state.selectedAnswers.push(value);
            }
        }

        this.renderCurrentQuestion();
    },

    handleFillInput(value) {
        this.state.selectedAnswers = [value];
    },

    handleEssayInput(value) {
        this.state.selectedAnswers = [value];
    },

    showAnswer() {
        this.state.showAnswer = true;
        this.renderCurrentQuestion();
    },

    answerCorrect() {
        this.recordAnswer(true);
    },

    answerWrong() {
        this.recordAnswer(false);
    },

    recordAnswer(isCorrect) {
        const question = this.getCurrentQuestion();
        if (!question) return;

        const isNewQuestion = !question.studyStats || question.studyStats.totalCount === 0;
        QuestionModel.recordAnswer(question.id, isCorrect, isNewQuestion);

        this.state.showAnswer = false;
        this.state.selectedAnswers = [];
        this.state.completedCount++;

        Toast.show(isCorrect ? '太棒了！继续加油 🎉' : '没关系，多加练习 💪', 
            isCorrect ? 'success' : 'warning');

        if (this.state.currentIndex < this.state.questions.length - 1) {
            setTimeout(() => {
                this.nextQuestion();
            }, 500);
        } else {
            this.renderComplete();
        }
    },

    nextQuestion() {
        if (this.state.currentIndex < this.state.questions.length - 1) {
            this.state.currentIndex++;
            this.state.showAnswer = false;
            this.state.selectedAnswers = [];
            this.renderCurrentQuestion();
        }
    },

    prevQuestion() {
        if (this.state.currentIndex > 0) {
            this.state.currentIndex--;
            this.state.showAnswer = false;
            this.state.selectedAnswers = [];
            this.renderCurrentQuestion();
        }
    },

    toggleFavorite() {
        const question = this.getCurrentQuestion();
        if (!question) return;

        const result = QuestionModel.toggleFavorite(question.id);
        if (result) {
            question.isFavorite = result.isFavorite;
            Toast.show(result.isFavorite ? '已收藏 ❤️' : '已取消收藏', 'success');
            this.renderCurrentQuestion();
        }
    },

    renderComplete() {
        const { questions, completedCount, mode, bankId } = this.state;
        const total = questions.length;

        const card = document.getElementById('study-card');
        if (!card) return;

        card.innerHTML = `
            <div class="card-body" style="text-align: center;">
                <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
                <h2 style="font-size: 24px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
                    本次学习完成！
                </h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    完成了 ${completedCount} 道题目
                </p>

                <div class="grid grid-cols-2 gap-16 mb-24">
                    <div class="card" style="margin: 0; background: var(--bg-secondary);">
                        <div class="card-body" style="padding: 16px; text-align: center;">
                            <div style="font-size: 32px; font-weight: 700; color: var(--primary-color);">
                                ${total}
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">总题数</div>
                        </div>
                    </div>
                    <div class="card" style="margin: 0; background: var(--bg-secondary);">
                        <div class="card-body" style="padding: 16px; text-align: center;">
                            <div style="font-size: 32px; font-weight: 700; color: var(--success-color);">
                                ${completedCount}
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">已完成</div>
                        </div>
                    </div>
                </div>

                <div class="flex" style="gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="StudyPage.restart()">
                        🔄 再来一次
                    </button>
                    ${bankId ? `
                        <button class="btn btn-secondary" onclick="Router.navigate('bank', { id: '${bankId}' })">
                            📁 返回题库
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="Router.navigate('home')">
                        🏠 返回首页
                    </button>
                </div>
            </div>
        `;

        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
    },

    restart() {
        this.state.currentIndex = 0;
        this.state.showAnswer = false;
        this.state.selectedAnswers = [];
        this.state.completedCount = 0;
        
        if (this.state.mode === 'random' || this.state.mode === 'quick') {
            this.state.questions = Utils.shuffle(this.state.questions);
        }

        this.renderCurrentQuestion();
    },

    saveStudyState() {
        const { bankId, mode, currentIndex, showAnswer } = this.state;
        Storage.setStudyState({
            bankId,
            mode,
            currentIndex,
            showAnswer,
            timestamp: Date.now()
        });
    },

    handleKeyboard(e) {
        const question = this.getCurrentQuestion();
        if (!question) return;

        const isSingleChoice = question.type === 'single';
        const isTrueFalse = question.type === 'true-false';
        const isMultipleChoice = question.type === 'multiple';

        if (!this.state.showAnswer) {
            if (e.code === 'Space') {
                e.preventDefault();
                this.showAnswer();
                return;
            }

            if ((isSingleChoice || isMultipleChoice) && !isTrueFalse) {
                const options = question.options || [];
                const keyNum = parseInt(e.key);
                if (keyNum >= 1 && keyNum <= 9 && keyNum <= options.length) {
                    const opt = options[keyNum - 1];
                    const value = typeof opt === 'object' ? opt.value : opt;
                    this.selectOption(value, isSingleChoice);
                    return;
                }
            }

            if (isTrueFalse) {
                if (e.key === '1' || e.key === 't' || e.key === 'T') {
                    this.selectOption('true', true);
                    return;
                }
                if (e.key === '2' || e.key === 'f' || e.key === 'F') {
                    this.selectOption('false', true);
                    return;
                }
            }
        } else {
            if (e.key === '1') {
                this.answerCorrect();
                return;
            }
            if (e.key === '2') {
                this.answerWrong();
                return;
            }
        }

        if (e.code === 'ArrowLeft') {
            this.prevQuestion();
            return;
        }
        if (e.code === 'ArrowRight' || e.code === 'Enter') {
            if (!this.state.showAnswer) {
                this.showAnswer();
            }
            return;
        }
    }
};

window.StudyPage = StudyPage;
