const QuizPage = {
    caseId: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    showResult: false,
    completed: false,

    async render() {
        const app = document.getElementById('app');
        const params = Router.getParams();
        this.caseId = params.case_id;

        if (!this.caseId) {
            Router.navigate('home');
            return;
        }

        this._restoreLocalState();

        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <h1 class="header-title">知识问答</h1>
                </header>

                <div class="quiz-container" id="quizContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">❓</div>
                        <div class="empty-state-title">加载题目中<span class="loading-dots"></span></div>
                    </div>
                </div>
            </div>
        `;

        await this.loadQuiz();
    },

    _saveKey() {
        return 'poan_quiz_' + this.caseId;
    },

    _restoreLocalState() {
        const saved = Storage.get(this._saveKey());
        if (saved) {
            this.currentIndex = saved.currentIndex || 0;
            this.answers = saved.answers || {};
            this.showResult = saved.showResult || false;
            this.completed = saved.completed || false;
        }
    },

    _saveLocalState() {
        if (!this.caseId) return;
        Storage.set(this._saveKey(), {
            currentIndex: this.currentIndex,
            answers: this.answers,
            showResult: this.showResult,
            completed: this.completed,
            caseId: this.caseId
        });
    },

    _clearLocalState() {
        if (!this.caseId) return;
        Storage.remove(this._saveKey());
    },

    async loadQuiz() {
        try {
            const result = await PoanApi.getQuiz(this.caseId);
            if (result.code === 0) {
                this.questions = result.data || [];
                if (this.questions.length === 0) {
                    this.renderNoQuestions();
                } else if (this.completed) {
                    this.renderCompleted();
                } else {
                    this.renderQuiz();
                }
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载问答失败:', error);
            document.getElementById('quizContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-title">加载失败</div>
                    <div class="empty-state-text">点击重试</div>
                </div>
            `;
            document.getElementById('quizContent').querySelector('.empty-state').onclick = () => this.loadQuiz();
        }
    },

    renderNoQuestions() {
        const container = document.getElementById('quizContent');
        container.innerHTML = `
            <div class="quiz-header">
                <h2 class="quiz-title">历史知识问答</h2>
                <p class="quiz-subtitle">测试你对这个时代的了解</p>
            </div>
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <div class="empty-state-title">暂无问答题目</div>
                <div class="empty-state-text">该案件暂未设置知识问答</div>
                <button class="btn btn-primary mt-2" onclick="Router.navigate('game', { case_id: '${this.caseId}' })">
                    返回调查
                </button>
            </div>
        `;
    },

    renderCompleted() {
        const container = document.getElementById('quizContent');
        const total = this.questions.length;
        const answered = Object.keys(this.answers).length;
        let correctCount = 0;
        for (const q of this.questions) {
            if (this.answers[q.id] === q.correct_answer) correctCount++;
        }
        const score = Math.round((correctCount / total) * 100);

        container.innerHTML = `
            <div class="quiz-header">
                <h2 class="quiz-title">历史知识问答</h2>
                <p class="quiz-subtitle">测试你对这个时代的了解</p>
            </div>
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <div class="empty-state-title">问答已完成</div>
                <div class="empty-state-text">
                    得分: ${score}分 (${correctCount}/${total})
                </div>
                <button class="btn btn-primary mt-2" onclick="QuizPage.resetAndRestart()">
                    重新答题
                </button>
                <button class="btn btn-outline mt-2" onclick="Router.navigate('game', { case_id: '${this.caseId}' })">
                    返回调查
                </button>
            </div>
        `;
    },

    resetAndRestart() {
        this.currentIndex = 0;
        this.answers = {};
        this.showResult = false;
        this.completed = false;
        this._clearLocalState();
        this.renderQuiz();
    },

    renderQuiz() {
        if (this.completed) {
            this.renderCompleted();
            return;
        }

        const container = document.getElementById('quizContent');
        const currentQuestion = this.questions[this.currentIndex];
        if (!currentQuestion) {
            this.completed = true;
            this._saveLocalState();
            this.renderCompleted();
            return;
        }

        const progress = ((this.currentIndex + 1) / this.questions.length) * 100;
        const answer = this.answers[currentQuestion.id];

        container.innerHTML = `
            <div class="quiz-header">
                <h2 class="quiz-title">历史知识问答</h2>
                <p class="quiz-subtitle">测试你对这个时代的了解</p>
            </div>

            <div class="quiz-progress">
                <span class="quiz-progress-text">${this.currentIndex + 1} / ${this.questions.length}</span>
                <div class="quiz-progress-bar">
                    <div class="quiz-progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>

            <div class="quiz-question-card">
                <span class="quiz-question-number">第 ${this.currentIndex + 1} 题</span>
                <div class="quiz-question-text">${currentQuestion.question}</div>

                <div class="quiz-options" id="quizOptions">
                    ${this.renderOptions(currentQuestion, answer)}
                </div>

                ${this.showResult && answer !== undefined ? this.renderExplanation(currentQuestion, answer) : ''}
            </div>

            <div class="quiz-actions">
                ${this.currentIndex > 0 ? `
                    <button class="btn btn-outline flex-1" onclick="QuizPage.prevQuestion()">
                        上一题
                    </button>
                ` : '<div class="flex-1"></div>'}

                ${this.showResult || answer !== undefined ? `
                    ${this.currentIndex < this.questions.length - 1 ? `
                        <button class="btn btn-primary flex-1" onclick="QuizPage.nextQuestion()">
                            下一题
                        </button>
                    ` : `
                        <button class="btn btn-secondary flex-1" onclick="QuizPage.submitQuiz()">
                            提交答案
                        </button>
                    `}
                ` : `
                    <button class="btn btn-primary flex-1" id="confirmBtn" onclick="QuizPage.confirmAnswer()" ${answer === undefined ? 'disabled' : ''}>
                        确认答案
                    </button>
                `}
            </div>
        `;

        this.bindOptionEvents();
    },

    renderOptions(question, selectedAnswer) {
        const options = question.options || [];
        const letters = ['A', 'B', 'C', 'D'];

        return options.map((opt, index) => {
            const letter = letters[index] || String.fromCharCode(65 + index);
            const isSelected = selectedAnswer === index;
            let optionClass = '';

            if (this.showResult) {
                if (index === question.correct_answer) {
                    optionClass = 'correct';
                } else if (isSelected && index !== question.correct_answer) {
                    optionClass = 'wrong';
                }
            } else if (isSelected) {
                optionClass = 'selected';
            }

            return `
                <div class="quiz-option ${optionClass}" data-index="${index}">
                    <span class="quiz-option-letter">${letter}</span>
                    <span class="quiz-option-text">${opt}</span>
                </div>
            `;
        }).join('');
    },

    renderExplanation(question, answer) {
        const isCorrect = answer === question.correct_answer;
        const explanation = question.explanation || (isCorrect ? '回答正确！' : '回答错误。');

        return `
            <div class="quiz-explanation">
                <div class="quiz-explanation-title">${isCorrect ? '✓ 回答正确' : '✗ 回答错误'}</div>
                ${explanation}
            </div>
        `;
    },

    bindOptionEvents() {
        if (this.showResult) return;

        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', () => {
                const index = parseInt(option.dataset.index);
                const currentQuestion = this.questions[this.currentIndex];
                this.answers[currentQuestion.id] = index;
                this._saveLocalState();
                this.renderQuiz();
            });
        });
    },

    prevQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showResult = false;
            this._saveLocalState();
            this.renderQuiz();
        }
    },

    nextQuestion() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            this.showResult = false;
            this._saveLocalState();
            this.renderQuiz();
        }
    },

    confirmAnswer() {
        this.showResult = true;
        this._saveLocalState();
        this.renderQuiz();
    },

    async submitQuiz() {
        Loading.show();
        try {
            let correctCount = 0;
            const answers = [];

            for (const question of this.questions) {
                const userAnswer = this.answers[question.id];
                const isCorrect = userAnswer === question.correct_answer;
                if (isCorrect) correctCount++;

                try {
                    await PoanApi.answerQuiz(this.caseId, question.id, userAnswer);
                } catch (e) {
                    console.error('提交单题答案失败:', e);
                }

                answers.push({
                    quiz_id: question.id,
                    answer: userAnswer,
                    is_correct: isCorrect
                });
            }

            this.completed = true;
            this._saveLocalState();

            const score = Math.round((correctCount / this.questions.length) * 100);

            Toast.success('问答完成！得分: ' + score + '分 (' + correctCount + '/' + this.questions.length + ')');

            setTimeout(() => {
                Router.navigate('game', { case_id: this.caseId });
            }, 2000);
        } catch (error) {
            console.error('提交问答失败:', error);
            Toast.error('提交失败，请检查网络');
        } finally {
            Loading.hide();
        }
    }
};

window.QuizPage = QuizPage;
