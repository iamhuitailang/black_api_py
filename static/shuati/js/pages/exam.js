const ExamPage = {
    state: {
        questions: [],
        currentIndex: 0,
        userAnswers: {},
        showAnswers: false,
        startTime: null,
        endTime: null,
        timeLimit: 0,
        timerInterval: null,
        remainingTime: 0,
        bankId: null,
        questionCount: 20
    },

    render(params = {}) {
        this.state = {
            questions: [],
            currentIndex: 0,
            userAnswers: {},
            showAnswers: false,
            startTime: null,
            endTime: null,
            timeLimit: 0,
            timerInterval: null,
            remainingTime: 0,
            bankId: params.bankId || null,
            questionCount: parseInt(params.count) || 20
        };

        const html = `
            <div class="page-container">
                <div class="page-header">
                    <h1 class="page-title">📝 模拟考试</h1>
                    <p class="page-subtitle">检验你的学习成果</p>
                </div>

                <div class="card">
                    <div class="card-body" style="padding: 32px;">
                        <div id="exam-setup">
                            <h3 style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 20px;">
                                考试设置
                            </h3>

                            <div class="form-group">
                                <label class="form-label">选择题库</label>
                                <select class="form-select" id="exam-bank">
                                    <option value="">全部题库</option>
                                    ${this.getBankOptions()}
                                </select>
                            </div>

                            <div class="grid grid-cols-2 gap-20">
                                <div class="form-group">
                                    <label class="form-label">题目数量</label>
                                    <select class="form-select" id="exam-count">
                                        <option value="10">10 题</option>
                                        <option value="20" selected>20 题</option>
                                        <option value="30">30 题</option>
                                        <option value="50">50 题</option>
                                        <option value="100">100 题</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">考试时间</label>
                                    <select class="form-select" id="exam-time">
                                        <option value="0">不限时</option>
                                        <option value="15">15 分钟</option>
                                        <option value="30">30 分钟</option>
                                        <option value="45">45 分钟</option>
                                        <option value="60">60 分钟</option>
                                    </select>
                                </div>
                            </div>

                            <button class="btn btn-primary btn-large w-100 mt-16" onclick="ExamPage.startExam()">
                                🚀 开始考试
                            </button>

                            <p class="text-center mt-12" style="font-size: 14px; color: var(--text-secondary);">
                                考试结束后会显示成绩和解析
                            </p>
                        </div>

                        <div id="exam-content" style="display: none;"></div>
                        <div id="exam-results" style="display: none;"></div>
                    </div>
                </div>
            </div>
        `;

        App.renderMainContent(html);
    },

    getBankOptions() {
        const banks = BankModel.getAll();
        return banks.map(bank => `
            <option value="${bank.id}">${bank.icon} ${bank.name} (${bank.questionCount} 题)</option>
        `).join('');
    },

    startExam() {
        const bankId = document.getElementById('exam-bank')?.value || null;
        const count = parseInt(document.getElementById('exam-count')?.value || 20);
        const timeLimit = parseInt(document.getElementById('exam-time')?.value || 0);

        let questions = [];
        if (bankId) {
            questions = QuestionModel.getByBankId(bankId);
        } else {
            questions = QuestionModel.getAll();
        }

        if (questions.length === 0) {
            Toast.show('没有可用的题目，请先添加题目', 'warning');
            return;
        }

        const shuffled = Utils.shuffle(questions);
        const examQuestions = shuffled.slice(0, Math.min(count, shuffled.length));

        this.state.questions = examQuestions;
        this.state.currentIndex = 0;
        this.state.userAnswers = {};
        this.state.showAnswers = false;
        this.state.startTime = Date.now();
        this.state.timeLimit = timeLimit;
        this.state.remainingTime = timeLimit * 60;

        const setup = document.getElementById('exam-setup');
        const content = document.getElementById('exam-content');
        if (setup) setup.style.display = 'none';
        if (content) content.style.display = 'block';

        if (timeLimit > 0) {
            this.startTimer();
        }

        this.renderExamContent();
    },

    startTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }

        this.state.timerInterval = setInterval(() => {
            this.state.remainingTime--;
            this.updateTimerDisplay();

            if (this.state.remainingTime <= 0) {
                clearInterval(this.state.timerInterval);
                this.finishExam();
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const timerEl = document.getElementById('exam-timer');
        if (!timerEl) return;

        const minutes = Math.floor(this.state.remainingTime / 60);
        const seconds = this.state.remainingTime % 60;
        timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (this.state.remainingTime < 60) {
            timerEl.style.color = 'var(--danger-color)';
        }
    },

    renderExamContent() {
        const { questions, currentIndex, userAnswers, timeLimit, remainingTime } = this.state;
        const question = questions[currentIndex];
        const total = questions.length;

        if (!question) {
            this.finishExam();
            return;
        }

        const answeredCount = Object.keys(userAnswers).length;
        const currentAnswer = userAnswers[question.id] || [];
        const isSingleChoice = question.type === 'single';
        const isTrueFalse = question.type === 'true-false';
        const isMultipleChoice = question.type === 'multiple';

        const html = `
            <div class="exam-header">
                <div class="flex-between">
                    <div class="flex" style="gap: 24px; align-items: center;">
                        <span style="font-weight: 600; color: var(--text-primary);">
                            第 ${currentIndex + 1} / ${total} 题
                        </span>
                        <span style="color: var(--text-secondary);">
                            已答: ${answeredCount} 题
                        </span>
                    </div>
                    <div class="flex" style="gap: 16px; align-items: center;">
                        ${timeLimit > 0 ? `
                            <div id="exam-timer" style="font-family: monospace; font-size: 20px; font-weight: 700; color: var(--primary-color);">
                                ${String(Math.floor(remainingTime / 60)).padStart(2, '0')}:${String(remainingTime % 60).padStart(2, '0')}
                            </div>
                        ` : ''}
                        <button class="btn btn-success" onclick="ExamPage.finishExam()">
                            交卷
                        </button>
                    </div>
                </div>

                <div class="progress-bar mt-12">
                    <div class="progress-bar-fill" style="width: ${(currentIndex + 1) / total * 100}%"></div>
                </div>
            </div>

            <div class="exam-question mb-20">
                <div class="flex" style="align-items: center; gap: 8px; margin-bottom: 16px;">
                    <span class="tag">${this.getTypeLabel(question.type)}</span>
                    ${question.difficulty > 1 ? `
                        <span class="tag">${'⭐'.repeat(question.difficulty)}</span>
                    ` : ''}
                </div>

                <h3 style="font-size: 18px; font-weight: 600; color: var(--text-primary); line-height: 1.6; margin-bottom: 20px;">
                    ${currentIndex + 1}. ${this.formatQuestionContent(question.content)}
                </h3>

                ${(isSingleChoice || isMultipleChoice || isTrueFalse) ? `
                    <div class="options-list">
                        ${this.renderExamOptions(question, currentAnswer)}
                    </div>
                ` : ''}

                ${question.type === 'fill' || question.type === 'essay' ? `
                    <textarea class="form-input" placeholder="请输入答案..."
                        style="min-height: ${question.type === 'essay' ? '150px' : '100px'};"
                        oninput="ExamPage.recordTextAnswer('${question.id}', this.value)"
                    >${currentAnswer[0] || ''}</textarea>
                ` : ''}
            </div>

            <div class="exam-navigation">
                <div class="flex-between">
                    <button class="btn btn-secondary" onclick="ExamPage.prevQuestion()" 
                        ${currentIndex === 0 ? 'disabled' : ''}>
                        ← 上一题
                    </button>

                    <div class="exam-progress-dots">
                        ${questions.map((q, idx) => {
                            const hasAnswer = userAnswers[q.id] && userAnswers[q.id].length > 0;
                            const isCurrent = idx === currentIndex;
                            return `
                                <span class="exam-dot ${isCurrent ? 'current' : ''} ${hasAnswer ? 'answered' : ''}"
                                    onclick="ExamPage.goToQuestion(${idx})"
                                    title="第 ${idx + 1} 题">
                                    ${idx + 1}
                                </span>
                            `;
                        }).join('')}
                    </div>

                    <button class="btn btn-secondary" onclick="ExamPage.nextQuestion()"
                        ${currentIndex === questions.length - 1 ? 'disabled' : ''}>
                        下一题 →
                    </button>
                </div>
            </div>
        `;

        const content = document.getElementById('exam-content');
        if (content) {
            content.innerHTML = html;
        }
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

    formatQuestionContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/_{4,}/g, '______');
    },

    renderExamOptions(question, currentAnswer) {
        const isSingleChoice = question.type === 'single';
        const isTrueFalse = question.type === 'true-false';
        const options = isTrueFalse ? 
            [{ label: '对', value: 'true' }, { label: '错', value: 'false' }] :
            (question.options || []);

        return options.map((opt, index) => {
            const label = isTrueFalse ? opt.label : String.fromCharCode(65 + index);
            const value = isTrueFalse ? opt.value : (typeof opt === 'object' ? opt.value : opt);
            const text = isTrueFalse ? opt.label : (typeof opt === 'object' ? opt.text : opt);
            
            const isSelected = currentAnswer.includes(value);
            
            let optionClass = 'option-item';
            if (isSelected) {
                optionClass += ' selected';
            }

            return `
                <div class="${optionClass}" onclick="ExamPage.selectOption('${question.id}', '${value}', ${isSingleChoice || isTrueFalse})">
                    <span class="option-label">${label}</span>
                    <span class="option-text">${text || value}</span>
                </div>
            `;
        }).join('');
    },

    selectOption(questionId, value, isSingle) {
        if (!this.state.userAnswers[questionId]) {
            this.state.userAnswers[questionId] = [];
        }

        if (isSingle) {
            this.state.userAnswers[questionId] = [value];
        } else {
            const idx = this.state.userAnswers[questionId].indexOf(value);
            if (idx >= 0) {
                this.state.userAnswers[questionId].splice(idx, 1);
            } else {
                this.state.userAnswers[questionId].push(value);
            }
        }

        this.renderExamContent();
    },

    recordTextAnswer(questionId, value) {
        this.state.userAnswers[questionId] = [value];
    },

    prevQuestion() {
        if (this.state.currentIndex > 0) {
            this.state.currentIndex--;
            this.renderExamContent();
        }
    },

    nextQuestion() {
        if (this.state.currentIndex < this.state.questions.length - 1) {
            this.state.currentIndex++;
            this.renderExamContent();
        }
    },

    goToQuestion(index) {
        this.state.currentIndex = index;
        this.renderExamContent();
    },

    async finishExam() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }

        const unanswered = this.state.questions.filter(q => 
            !this.state.userAnswers[q.id] || this.state.userAnswers[q.id].length === 0
        ).length;

        if (unanswered > 0) {
            const confirmed = await App.confirm(
                `还有 ${unanswered} 道题未作答，确定要交卷吗？`,
                '确认交卷'
            );
            if (!confirmed) return;
        }

        this.state.endTime = Date.now();
        this.state.showAnswers = true;

        const content = document.getElementById('exam-content');
        const results = document.getElementById('exam-results');
        if (content) content.style.display = 'none';
        if (results) results.style.display = 'block';

        this.renderResults();
    },

    renderResults() {
        const { questions, userAnswers, startTime, endTime } = this.state;
        
        let correctCount = 0;
        let wrongCount = 0;
        const results = [];

        questions.forEach((question, index) => {
            const userAnswer = userAnswers[question.id] || [];
            const isCorrect = this.checkExamAnswer(userAnswer, question.answer, question.type);
            
            if (isCorrect) {
                correctCount++;
            } else {
                wrongCount++;
            }

            results.push({
                index,
                question,
                userAnswer,
                isCorrect
            });
        });

        const total = questions.length;
        const score = Math.round(correctCount / total * 100);
        const duration = Math.round((endTime - startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        let gradeClass = 'success';
        let gradeText = '优秀';
        if (score < 60) {
            gradeClass = 'danger';
            gradeText = '需努力';
        } else if (score < 80) {
            gradeClass = 'warning';
            gradeText = '良好';
        }

        const html = `
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 72px; margin-bottom: 16px;">
                    ${score >= 60 ? '🎉' : '💪'}
                </div>
                <h2 style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
                    考试完成！
                </h2>
                <p style="color: var(--text-secondary);">
                    用时: ${minutes} 分 ${seconds} 秒
                </p>
            </div>

            <div class="grid grid-cols-3 gap-16 mb-24">
                <div class="card" style="margin: 0; background: var(--bg-secondary);">
                    <div class="card-body" style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: 700; color: var(--primary-color);">
                            ${score}
                        </div>
                        <div style="font-size: 14px; color: var(--text-secondary);">得分</div>
                    </div>
                </div>
                <div class="card" style="margin: 0; background: var(--bg-secondary);">
                    <div class="card-body" style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: 700; color: var(--success-color);">
                            ${correctCount}
                        </div>
                        <div style="font-size: 14px; color: var(--text-secondary);">正确</div>
                    </div>
                </div>
                <div class="card" style="margin: 0; background: var(--bg-secondary);">
                    <div class="card-body" style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: 700; color: var(--danger-color);">
                            ${wrongCount}
                        </div>
                        <div style="font-size: 14px; color: var(--text-secondary);">错误</div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
                <span class="tag tag-${gradeClass}" style="font-size: 16px; padding: 8px 24px;">
                    ${gradeText}
                </span>
            </div>

            <div class="flex" style="gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 24px;">
                <button class="btn btn-primary" onclick="ExamPage.render()">
                    🔄 再考一次
                </button>
                <button class="btn btn-secondary" onclick="Router.navigate('stats')">
                    📊 查看统计
                </button>
                <button class="btn btn-secondary" onclick="Router.navigate('home')">
                    🏠 返回首页
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📝 答案解析</h2>
                </div>
                <div class="card-body" style="padding: 0;">
                    ${results.map(r => this.renderResultItem(r)).join('')}
                </div>
            </div>
        `;

        const resultsEl = document.getElementById('exam-results');
        if (resultsEl) {
            resultsEl.innerHTML = html;
        }
    },

    checkExamAnswer(userAnswer, correctAnswer, type) {
        if (type === 'fill' || type === 'essay') {
            if (!userAnswer || userAnswer.length === 0) return false;
            if (!correctAnswer || correctAnswer.length === 0) return true;
            
            const userText = userAnswer[0] || '';
            return correctAnswer.some(correct => 
                userText.trim().toLowerCase() === correct.trim().toLowerCase()
            );
        }

        if (!correctAnswer || correctAnswer.length === 0) return true;
        if (!userAnswer || userAnswer.length === 0) return false;
        
        if (userAnswer.length !== correctAnswer.length) return false;
        
        return correctAnswer.every(ans => userAnswer.includes(ans));
    },

    renderResultItem(result) {
        const { index, question, userAnswer, isCorrect } = result;
        const isSingleChoice = question.type === 'single';
        const isTrueFalse = question.type === 'true-false';
        const isMultipleChoice = question.type === 'multiple';

        return `
            <div class="question-item" style="border-bottom: 1px solid var(--border-color); padding: 16px;">
                <div class="flex" style="align-items: flex-start; gap: 12px;">
                    <span style="font-size: 24px;">${isCorrect ? '✅' : '❌'}</span>
                    <div style="flex: 1;">
                        <div class="flex" style="align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span class="tag ${isCorrect ? 'tag-success' : 'tag-danger'}">
                                第 ${index + 1} 题
                            </span>
                            <span class="tag">${this.getTypeLabel(question.type)}</span>
                        </div>

                        <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 12px; line-height: 1.5;">
                            ${this.formatQuestionContent(question.content)}
                        </div>

                        ${(isSingleChoice || isMultipleChoice || isTrueFalse) ? `
                            <div class="options-list mb-12">
                                ${this.renderResultOptions(question, userAnswer)}
                            </div>
                        ` : ''}

                        ${question.type === 'fill' || question.type === 'essay' ? `
                            <div class="mb-12">
                                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">你的答案:</div>
                                <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 4px;">
                                    ${userAnswer[0] || '(未作答)'}
                                </div>
                            </div>
                        ` : ''}

                        <div class="answer-section ${isCorrect ? 'correct' : 'wrong'}">
                            <div style="font-weight: 600; margin-bottom: 4px;">正确答案: ${this.renderCorrectAnswer(question)}</div>
                            ${question.explanation ? `
                                <div style="margin-top: 8px; font-size: 14px; color: var(--text-secondary);">
                                    解析: ${question.explanation}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderResultOptions(question, userAnswer) {
        const isSingleChoice = question.type === 'single';
        const isTrueFalse = question.type === 'true-false';
        const options = isTrueFalse ? 
            [{ label: '对', value: 'true' }, { label: '错', value: 'false' }] :
            (question.options || []);

        return options.map((opt, index) => {
            const label = isTrueFalse ? opt.label : String.fromCharCode(65 + index);
            const value = isTrueFalse ? opt.value : (typeof opt === 'object' ? opt.value : opt);
            const text = isTrueFalse ? opt.label : (typeof opt === 'object' ? opt.text : opt);
            
            const isSelected = userAnswer.includes(value);
            const isCorrect = question.answer.includes(value);
            
            let optionClass = 'option-item';
            if (isCorrect) {
                optionClass += ' correct';
            } else if (isSelected && !isCorrect) {
                optionClass += ' wrong';
            } else if (isSelected) {
                optionClass += ' selected';
            }

            return `
                <div class="${optionClass}">
                    <span class="option-label">${label}</span>
                    <span class="option-text">${text || value}</span>
                    ${isCorrect ? '<span class="option-check">✓</span>' : (isSelected ? '<span class="option-check">✗</span>' : '')}
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
    }
};

window.ExamPage = ExamPage;
