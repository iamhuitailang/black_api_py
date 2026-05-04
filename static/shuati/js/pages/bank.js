const BankPage = {
    currentBankId: null,
    searchKeyword: '',
    questionPage: 1,
    questionsPerPage: 10,

    render(params = {}) {
        const bankId = params.id;
        
        if (bankId) {
            this.currentBankId = bankId;
            this.renderBankDetail();
        } else {
            this.renderBankList();
        }
    },

    renderBankList() {
        const banks = BankModel.search(this.searchKeyword);
        
        const html = `
            <div class="page-container">
                <div class="page-header">
                    <h1 class="page-title">📁 题库管理</h1>
                    <p class="page-subtitle">管理你的所有题库</p>
                </div>

                <div class="toolbar">
                    <div class="toolbar-left">
                        <div class="search-box">
                            <span class="search-icon">🔍</span>
                            <input type="text" class="form-control" id="bank-search" placeholder="搜索题库..." value="${this.searchKeyword}" oninput="BankPage.handleSearch(this.value)">
                        </div>
                    </div>
                    <div class="toolbar-right">
                        <button class="btn btn-primary" onclick="BankPage.showCreateModal()">
                            ➕ 创建题库
                        </button>
                    </div>
                </div>

                ${banks.length > 0 ? `
                    <div class="grid grid-cols-2 gap-20">
                        ${banks.map(bank => this.renderBankCard(bank)).join('')}
                    </div>
                ` : `
                    <div class="card">
                        <div class="card-body">
                            <div class="empty-state">
                                <div class="icon">📁</div>
                                <h3>还没有题库</h3>
                                <p>创建你的第一个题库开始学习吧</p>
                                <button class="btn btn-primary mt-12" onclick="BankPage.showCreateModal()">
                                    创建题库
                                </button>
                            </div>
                        </div>
                    </div>
                `}
            </div>
        `;
        
        App.renderMainContent(html);
    },

    renderBankCard(bank) {
        const masteryColor = bank.masteryRate >= 60 ? 'mastery-high' : bank.masteryRate >= 30 ? 'mastery-medium' : 'mastery-low';
        
        return `
            <div class="card question-bank-card" style="cursor: pointer;" onclick="Router.navigate('bank', { id: '${bank.id}' })">
                <div class="card-header" style="border: none; padding: 16px 20px 8px 20px;">
                    <div class="flex" style="align-items: center; gap: 12px;">
                        <span style="font-size: 32px;">${bank.icon}</span>
                        <div>
                            <h3 class="card-title" style="margin-bottom: 4px;">${bank.name}</h3>
                            <p class="card-subtitle">${bank.description || '暂无描述'}</p>
                        </div>
                    </div>
                    <div class="flex gap-8">
                        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); BankPage.showEditModal('${bank.id}')">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); BankPage.confirmDelete('${bank.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-3 gap-16 text-center">
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">${bank.questionCount}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">题目数</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--success-color);">${bank.masteryRate}%</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">掌握程度</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">
                                ${bank.lastStudyTime ? Utils.relativeTime(bank.lastStudyTime) : '未学习'}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">最近学习</div>
                        </div>
                    </div>
                    <div class="mastery-bar mt-16">
                        <div class="mastery-bar-fill ${masteryColor}" style="width: ${bank.masteryRate}%"></div>
                    </div>
                </div>
            </div>
        `;
    },

    renderBankDetail() {
        const bank = BankModel.getById(this.currentBankId);
        if (!bank) {
            Router.navigate('bank');
            return;
        }

        const questions = QuestionModel.getByBankId(this.currentBankId);
        const stats = QuestionModel.getStats(this.currentBankId);
        const mastery = MemoryAlgorithm.getBankMastery(this.currentBankId);
        
        const totalPages = Math.ceil(questions.length / this.questionsPerPage);
        const startIndex = (this.questionPage - 1) * this.questionsPerPage;
        const endIndex = startIndex + this.questionsPerPage;
        const pageQuestions = questions.slice(startIndex, endIndex);

        const html = `
            <div class="page-container">
                <div class="page-header flex-between">
                    <div>
                        <button class="btn btn-ghost mb-8" onclick="Router.navigate('bank')">
                            ← 返回题库列表
                        </button>
                        <h1 class="page-title">${bank.icon} ${bank.name}</h1>
                        <p class="page-subtitle">${bank.description || '暂无描述'}</p>
                    </div>
                    <div class="flex gap-12">
                        <button class="btn btn-outline" onclick="BankPage.showShareModal('${bank.id}')">
                            📤 分享
                        </button>
                        <button class="btn btn-primary" onclick="BankPage.startStudy('${bank.id}')">
                            📖 开始学习
                        </button>
                        <button class="btn btn-success" onclick="BankPage.showAddQuestionModal()">
                            ➕ 添加题目
                        </button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">总题目</span>
                            <span class="stat-card-icon primary">📝</span>
                        </div>
                        <div class="stat-card-value">${stats.total}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">已掌握</span>
                            <span class="stat-card-icon success">✅</span>
                        </div>
                        <div class="stat-card-value">${mastery.mastered}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">错题数</span>
                            <span class="stat-card-icon danger">❌</span>
                        </div>
                        <div class="stat-card-value">${stats.wrong}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">收藏数</span>
                            <span class="stat-card-icon warning">⭐</span>
                        </div>
                        <div class="stat-card-value">${stats.favorites}</div>
                    </div>
                </div>

                <div class="card mb-20">
                    <div class="card-header">
                        <h2 class="card-title">📚 学习模式</h2>
                    </div>
                    <div class="card-body">
                        <div class="study-mode-options">
                            <div class="study-mode-card" onclick="BankPage.startStudy('${bank.id}', 'sequential')">
                                <div class="study-mode-icon">📖</div>
                                <div class="study-mode-title">顺序刷题</div>
                                <div class="study-mode-desc">按题目顺序逐题学习</div>
                            </div>
                            <div class="study-mode-card" onclick="BankPage.startStudy('${bank.id}', 'random')">
                                <div class="study-mode-icon">🎲</div>
                                <div class="study-mode-title">随机刷题</div>
                                <div class="study-mode-desc">打乱顺序，避免位置记忆</div>
                            </div>
                            <div class="study-mode-card" onclick="BankPage.startStudy('${bank.id}', 'reverse')">
                                <div class="study-mode-icon">⏪</div>
                                <div class="study-mode-title">倒序刷题</div>
                                <div class="study-mode-desc">从后往前复习</div>
                            </div>
                            <div class="study-mode-card" onclick="BankPage.startStudy('${bank.id}', 'wrong')">
                                <div class="study-mode-icon">❌</div>
                                <div class="study-mode-title">错题重做</div>
                                <div class="study-mode-desc">只刷错题，直到掌握</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">📝 题目列表 (${questions.length})</h2>
                        <div class="flex gap-8">
                            <button class="btn btn-sm btn-secondary" onclick="BankPage.showImportModal()">
                                📥 批量导入
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="BankPage.exportBank('${bank.id}')">
                                📤 导出
                            </button>
                        </div>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        ${pageQuestions.length > 0 ? `
                            <div style="overflow-x: auto;">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>序号</th>
                                            <th>题目</th>
                                            <th>类型</th>
                                            <th>掌握度</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${pageQuestions.map((q, index) => `
                                            <tr>
                                                <td>${startIndex + index + 1}</td>
                                                <td style="max-width: 400px;">
                                                    ${Utils.escapeHtml(Utils.truncate(q.content, 50))}
                                                    ${q.isFavorite ? '<span style="margin-left: 8px;">⭐</span>' : ''}
                                                    ${q.isWrong ? '<span style="margin-left: 8px;">❌</span>' : ''}
                                                </td>
                                                <td>
                                                    <span class="badge badge-${q.type === 'single' ? 'info' : q.type === 'multiple' ? 'primary' : q.type === 'true-false' ? 'success' : 'warning'}">
                                                        ${Utils.getQuestionTypeLabel(q.type)}
                                                    </span>
                                                </td>
                                                <td>
                                                    ${q.studyStats && q.studyStats.totalCount > 0 ? 
                                                        `<span style="color: var(--success-color);">${Utils.calculateMastery(q)}%</span>` : 
                                                        '<span style="color: var(--text-secondary);">未学习</span>'
                                                    }
                                                </td>
                                                <td>
                                                    <div class="table-actions">
                                                        <button class="btn btn-sm btn-secondary" onclick="BankPage.showEditQuestionModal('${q.id}')">
                                                            ✏️
                                                        </button>
                                                        <button class="btn btn-sm btn-secondary" onclick="BankPage.confirmDeleteQuestion('${q.id}')">
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            
                            ${totalPages > 1 ? `
                                <div class="pagination" style="padding: 16px 20px; border-top: 1px solid var(--border-color);">
                                    <button class="pagination-btn" onclick="BankPage.goToPage(${this.questionPage - 1})" ${this.questionPage === 1 ? 'disabled' : ''}>
                                        ‹
                                    </button>
                                    <span class="pagination-info">${this.questionPage} / ${totalPages}</span>
                                    <button class="pagination-btn" onclick="BankPage.goToPage(${this.questionPage + 1})" ${this.questionPage === totalPages ? 'disabled' : ''}>
                                        ›
                                    </button>
                                </div>
                            ` : ''}
                        ` : `
                            <div class="empty-state">
                                <div class="icon">📝</div>
                                <h3>还没有题目</h3>
                                <p>添加题目开始学习吧</p>
                                <div class="flex gap-12 mt-12" style="justify-content: center;">
                                    <button class="btn btn-primary" onclick="BankPage.showAddQuestionModal()">
                                        手动添加
                                    </button>
                                    <button class="btn btn-secondary" onclick="BankPage.showImportModal()">
                                        批量导入
                                    </button>
                                </div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        App.renderMainContent(html);
    },

    handleSearch(keyword) {
        this.searchKeyword = keyword;
        this.renderBankList();
    },

    goToPage(page) {
        if (page < 1) return;
        this.questionPage = page;
        this.renderBankDetail();
    },

    startStudy(bankId, mode = 'sequential') {
        Router.navigate('study', { bankId: bankId, mode: mode });
    },

    showCreateModal() {
        const modalContent = `
            <div class="modal-header">
                <h3 class="modal-title">创建题库</h3>
                <button class="modal-close" data-action="close">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">题库名称 <span class="required">*</span></label>
                    <input type="text" class="form-control" id="bank-name" placeholder="例如：驾驶证科目一">
                </div>
                <div class="form-group">
                    <label class="form-label">描述</label>
                    <textarea class="form-control" id="bank-desc" placeholder="简单描述这个题库的内容..." rows="3"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">图标</label>
                        <select class="form-control" id="bank-icon">
                            <option value="📚">📚 书籍</option>
                            <option value="📝">📝 笔记</option>
                            <option value="🎯">🎯 目标</option>
                            <option value="🚗">🚗 驾驶</option>
                            <option value="💻">💻 编程</option>
                            <option value="📖">📖 阅读</option>
                            <option value="🎓">🎓 教育</option>
                            <option value="⭐">⭐ 精选</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">颜色</label>
                        <select class="form-control" id="bank-color">
                            <option value="#6366f1">🔵 蓝色</option>
                            <option value="#10b981">🟢 绿色</option>
                            <option value="#f59e0b">🟡 黄色</option>
                            <option value="#ef4444">🔴 红色</option>
                            <option value="#8b5cf6">🟣 紫色</option>
                            <option value="#ec4899">🩷 粉色</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-action="close">取消</button>
                <button class="btn btn-primary" onclick="BankPage.createBank()">创建</button>
            </div>
        `;
        
        App.showModal(modalContent);
    },

    showEditModal(bankId) {
        const bank = BankModel.getById(bankId);
        if (!bank) return;
        
        const modalContent = `
            <div class="modal-header">
                <h3 class="modal-title">编辑题库</h3>
                <button class="modal-close" data-action="close">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">题库名称 <span class="required">*</span></label>
                    <input type="text" class="form-control" id="bank-name" value="${bank.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">描述</label>
                    <textarea class="form-control" id="bank-desc" rows="3">${bank.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">图标</label>
                        <select class="form-control" id="bank-icon">
                            <option value="📚" ${bank.icon === '📚' ? 'selected' : ''}>📚 书籍</option>
                            <option value="📝" ${bank.icon === '📝' ? 'selected' : ''}>📝 笔记</option>
                            <option value="🎯" ${bank.icon === '🎯' ? 'selected' : ''}>🎯 目标</option>
                            <option value="🚗" ${bank.icon === '🚗' ? 'selected' : ''}>🚗 驾驶</option>
                            <option value="💻" ${bank.icon === '💻' ? 'selected' : ''}>💻 编程</option>
                            <option value="📖" ${bank.icon === '📖' ? 'selected' : ''}>📖 阅读</option>
                            <option value="🎓" ${bank.icon === '🎓' ? 'selected' : ''}>🎓 教育</option>
                            <option value="⭐" ${bank.icon === '⭐' ? 'selected' : ''}>⭐ 精选</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">颜色</label>
                        <select class="form-control" id="bank-color">
                            <option value="#6366f1" ${bank.color === '#6366f1' ? 'selected' : ''}>🔵 蓝色</option>
                            <option value="#10b981" ${bank.color === '#10b981' ? 'selected' : ''}>🟢 绿色</option>
                            <option value="#f59e0b" ${bank.color === '#f59e0b' ? 'selected' : ''}>🟡 黄色</option>
                            <option value="#ef4444" ${bank.color === '#ef4444' ? 'selected' : ''}>🔴 红色</option>
                            <option value="#8b5cf6" ${bank.color === '#8b5cf6' ? 'selected' : ''}>🟣 紫色</option>
                            <option value="#ec4899" ${bank.color === '#ec4899' ? 'selected' : ''}>🩷 粉色</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-action="close">取消</button>
                <button class="btn btn-primary" onclick="BankPage.updateBank('${bankId}')">保存</button>
            </div>
        `;
        
        App.showModal(modalContent);
    },

    createBank() {
        const name = document.getElementById('bank-name').value.trim();
        if (!name) {
            Toast.error('请输入题库名称');
            return;
        }
        
        const description = document.getElementById('bank-desc').value.trim();
        const icon = document.getElementById('bank-icon').value;
        const color = document.getElementById('bank-color').value;
        
        BankModel.create({
            name: name,
            description: description,
            icon: icon,
            color: color
        });
        
        Toast.success('题库创建成功');
        App.hideModal();
        this.renderBankList();
    },

    updateBank(bankId) {
        const name = document.getElementById('bank-name').value.trim();
        if (!name) {
            Toast.error('请输入题库名称');
            return;
        }
        
        const description = document.getElementById('bank-desc').value.trim();
        const icon = document.getElementById('bank-icon').value;
        const color = document.getElementById('bank-color').value;
        
        BankModel.update(bankId, {
            name: name,
            description: description,
            icon: icon,
            color: color
        });
        
        Toast.success('题库更新成功');
        App.hideModal();
        
        if (this.currentBankId === bankId) {
            this.renderBankDetail();
        } else {
            this.renderBankList();
        }
    },

    async confirmDelete(bankId) {
        const confirmed = await App.confirm('确定要删除这个题库吗？所有题目和学习记录都将被删除。', '删除题库');
        if (confirmed) {
            BankModel.delete(bankId);
            Toast.success('题库已删除');
            this.renderBankList();
        }
    },

    showAddQuestionModal() {
        const modalContent = `
            <div class="modal-header">
                <h3 class="modal-title">添加题目</h3>
                <button class="modal-close" data-action="close">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">题目类型 <span class="required">*</span></label>
                    <select class="form-control" id="question-type" onchange="BankPage.handleTypeChange()">
                        <option value="single">单选题</option>
                        <option value="multiple">多选题</option>
                        <option value="true-false">判断题</option>
                        <option value="fill">填空题</option>
                        <option value="essay">简答题</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">题目内容 <span class="required">*</span></label>
                    <textarea class="form-control" id="question-content" placeholder="请输入题目内容..." rows="3"></textarea>
                </div>
                <div id="options-section">
                    <div class="form-group">
                        <label class="form-label">选项</label>
                        <div id="options-container">
                            <div class="flex gap-8 mb-8">
                                <input type="text" class="form-control" placeholder="选项 A" data-option="A">
                                <button class="btn btn-secondary" type="button" onclick="BankPage.addOption()">+</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">正确答案 <span class="required">*</span> <span class="hint">如：A 或 A,B</span></label>
                    <input type="text" class="form-control" id="question-answer" placeholder="例如：A 或 A,B">
                </div>
                <div class="form-group">
                    <label class="form-label">解析</label>
                    <textarea class="form-control" id="question-explanation" placeholder="请输入答案解析..." rows="2"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">难度</label>
                        <select class="form-control" id="question-difficulty">
                            <option value="1">简单</option>
                            <option value="2">中等</option>
                            <option value="3">困难</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">标签</label>
                        <input type="text" class="form-control" id="question-tags" placeholder="用逗号分隔">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-action="close">取消</button>
                <button class="btn btn-primary" onclick="BankPage.addQuestion()">添加</button>
            </div>
        `;
        
        App.showModal(modalContent, { size: 'lg' });
        this.optionCount = 2;
    },

    handleTypeChange() {
        const type = document.getElementById('question-type').value;
        const optionsSection = document.getElementById('options-section');
        
        if (type === 'fill' || type === 'essay') {
            optionsSection.style.display = 'none';
        } else {
            optionsSection.style.display = 'block';
            
            if (type === 'true-false') {
                const container = document.getElementById('options-container');
                container.innerHTML = `
                    <div class="flex gap-8 mb-8">
                        <input type="text" class="form-control" value="正确" data-option="A" readonly style="background: var(--bg-color);">
                    </div>
                    <div class="flex gap-8 mb-8">
                        <input type="text" class="form-control" value="错误" data-option="B" readonly style="background: var(--bg-color);">
                    </div>
                `;
            }
        }
    },

    addOption() {
        const container = document.getElementById('options-container');
        const optionIndex = container.children.length + 1;
        const optionLabel = String.fromCharCode(64 + optionIndex);
        
        const div = document.createElement('div');
        div.className = 'flex gap-8 mb-8';
        div.innerHTML = `
            <input type="text" class="form-control" placeholder="选项 ${optionLabel}" data-option="${optionLabel}">
            <button class="btn btn-secondary" type="button" onclick="this.parentElement.remove()">-</button>
        `;
        container.appendChild(div);
    },

    addQuestion() {
        const type = document.getElementById('question-type').value;
        const content = document.getElementById('question-content').value.trim();
        const answerText = document.getElementById('question-answer').value.trim().toUpperCase();
        const explanation = document.getElementById('question-explanation').value.trim();
        const difficulty = parseInt(document.getElementById('question-difficulty').value);
        const tagsText = document.getElementById('question-tags').value.trim();
        
        if (!content) {
            Toast.error('请输入题目内容');
            return;
        }
        
        if (!answerText && type !== 'essay') {
            Toast.error('请输入正确答案');
            return;
        }
        
        let options = [];
        if (type !== 'fill' && type !== 'essay') {
            const optionInputs = document.querySelectorAll('#options-container input[data-option]');
            optionInputs.forEach(input => {
                const value = input.value.trim();
                if (value) {
                    options.push({
                        label: input.dataset.option,
                        content: value
                    });
                }
            });
            
            if (type === 'true-false' && options.length === 0) {
                options = [
                    { label: 'A', content: '正确' },
                    { label: 'B', content: '错误' }
                ];
            }
        }
        
        const answer = answerText.split(/[,，\s]+/).filter(a => a);
        const tags = tagsText ? tagsText.split(/[,，\s]+/).filter(t => t) : [];
        
        QuestionModel.create(this.currentBankId, {
            content: content,
            type: type,
            options: options,
            answer: answer,
            explanation: explanation,
            difficulty: difficulty,
            tags: tags
        });
        
        Toast.success('题目添加成功');
        App.hideModal();
        this.renderBankDetail();
    },

    showEditQuestionModal(questionId) {
        const question = QuestionModel.getById(questionId);
        if (!question) return;
        
        const modalContent = `
            <div class="modal-header">
                <h3 class="modal-title">编辑题目</h3>
                <button class="modal-close" data-action="close">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">题目类型</label>
                    <select class="form-control" id="question-type" disabled>
                        <option value="single" ${question.type === 'single' ? 'selected' : ''}>单选题</option>
                        <option value="multiple" ${question.type === 'multiple' ? 'selected' : ''}>多选题</option>
                        <option value="true-false" ${question.type === 'true-false' ? 'selected' : ''}>判断题</option>
                        <option value="fill" ${question.type === 'fill' ? 'selected' : ''}>填空题</option>
                        <option value="essay" ${question.type === 'essay' ? 'selected' : ''}>简答题</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">题目内容</label>
                    <textarea class="form-control" id="question-content" rows="3">${question.content}</textarea>
                </div>
                ${(question.type !== 'fill' && question.type !== 'essay') ? `
                    <div class="form-group">
                        <label class="form-label">选项</label>
                        <div id="options-container">
                            ${(question.options || []).map(opt => `
                                <div class="flex gap-8 mb-8">
                                    <input type="text" class="form-control" value="${opt.content}" data-option="${opt.label}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="form-group">
                    <label class="form-label">正确答案</label>
                    <input type="text" class="form-control" id="question-answer" value="${(question.answer || []).join(',')}">
                </div>
                <div class="form-group">
                    <label class="form-label">解析</label>
                    <textarea class="form-control" id="question-explanation" rows="2">${question.explanation || ''}</textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-action="close">取消</button>
                <button class="btn btn-primary" onclick="BankPage.updateQuestion('${questionId}')">保存</button>
            </div>
        `;
        
        App.showModal(modalContent, { size: 'lg' });
    },

    updateQuestion(questionId) {
        const content = document.getElementById('question-content').value.trim();
        const answerText = document.getElementById('question-answer').value.trim().toUpperCase();
        const explanation = document.getElementById('question-explanation').value.trim();
        
        if (!content) {
            Toast.error('请输入题目内容');
            return;
        }
        
        let options = [];
        const optionInputs = document.querySelectorAll('#options-container input[data-option]');
        optionInputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                options.push({
                    label: input.dataset.option,
                    content: value
                });
            }
        });
        
        const answer = answerText ? answerText.split(/[,，\s]+/).filter(a => a) : [];
        
        QuestionModel.update(questionId, {
            content: content,
            options: options,
            answer: answer,
            explanation: explanation
        });
        
        Toast.success('题目更新成功');
        App.hideModal();
        this.renderBankDetail();
    },

    async confirmDeleteQuestion(questionId) {
        const confirmed = await App.confirm('确定要删除这个题目吗？', '删除题目');
        if (confirmed) {
            QuestionModel.delete(questionId);
            Toast.success('题目已删除');
            this.renderBankDetail();
        }
    },

    showImportModal() {
        const modalContent = `
            <div class="modal-header">
                <h3 class="modal-title">批量导入题目</h3>
                <button class="modal-close" data-action="close">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">选择导入方式</label>
                    <div class="flex gap-12">
                        <button class="btn btn-secondary" id="import-file-btn" onclick="BankPage.showFileImport()">
                            📁 文件导入
                        </button>
                        <button class="btn btn-secondary" id="import-text-btn" onclick="BankPage.showTextImport()">
                            📝 文本导入
                        </button>
                    </div>
                </div>
                
                <div id="import-file-section" class="hidden">
                    <div class="file-upload" id="file-upload-area">
                        <div class="file-upload-icon">📄</div>
                        <div class="file-upload-text">点击或拖拽文件到此处</div>
                        <div class="file-upload-hint">支持 .txt, .json 格式</div>
                        <input type="file" id="import-file-input" accept=".txt,.json,.csv" style="display: none;">
                    </div>
                </div>
                
                <div id="import-text-section">
                    <div class="form-group">
                        <label class="form-label">粘贴题目内容</label>
                        <textarea class="form-control" id="import-text-content" placeholder="1. 题目内容
A. 选项A
B. 选项B
答案：A
解析：题目解析" rows="10"></textarea>
                    </div>
                    <button class="btn btn-primary" onclick="BankPage.importFromText()">
                        解析并导入
                    </button>
                </div>
                
                <div id="import-preview-section" class="hidden mt-20">
                    <h4 style="margin-bottom: 12px; font-weight: 600;">预览 (共 <span id="preview-count">0</span> 题)</h4>
                    <div id="import-preview" class="import-preview"></div>
                    <div class="flex gap-12 mt-16">
                        <button class="btn btn-primary" onclick="BankPage.confirmImport()">
                            确认导入
                        </button>
                        <button class="btn btn-secondary" onclick="BankPage.cancelImport()">
                            取消
                        </button>
                    </div>
                </div>
                
                <div class="mt-20" style="background: var(--bg-color); padding: 16px; border-radius: var(--radius-md);">
                    <h4 style="margin-bottom: 8px; font-weight: 600; font-size: 14px;">📖 格式说明</h4>
                    <pre style="font-size: 12px; white-space: pre-wrap; color: var(--text-secondary);">1. 题目内容
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案：A,B
解析：这是答案解析</pre>
                </div>
            </div>
        `;
        
        App.showModal(modalContent, { size: 'lg' });
        
        setTimeout(() => {
            this.setupImportEvents();
        }, 100);
    },

    showFileImport() {
        document.getElementById('import-file-section').classList.remove('hidden');
        document.getElementById('import-text-section').classList.add('hidden');
    },

    showTextImport() {
        document.getElementById('import-text-section').classList.remove('hidden');
        document.getElementById('import-file-section').classList.add('hidden');
    },

    setupImportEvents() {
        const uploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('import-file-input');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileImport(files[0]);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileImport(e.target.files[0]);
                }
            });
        }
    },

    async handleFileImport(file) {
        try {
            const text = await Utils.readFileAsText(file);
            let questions = [];
            
            if (file.name.endsWith('.json')) {
                questions = Utils.parseQuestionsFromJSON(text);
            } else {
                questions = Utils.parseQuestionsFromText(text);
            }
            
            this.previewQuestions = questions;
            this.showImportPreview(questions);
        } catch (e) {
            Toast.error('文件解析失败：' + e.message);
        }
    },

    importFromText() {
        const text = document.getElementById('import-text-content').value;
        if (!text.trim()) {
            Toast.error('请输入题目内容');
            return;
        }
        
        const questions = Utils.parseQuestionsFromText(text);
        if (questions.length === 0) {
            Toast.error('未能解析到任何题目，请检查格式');
            return;
        }
        
        this.previewQuestions = questions;
        this.showImportPreview(questions);
    },

    showImportPreview(questions) {
        document.getElementById('import-preview-section').classList.remove('hidden');
        document.getElementById('preview-count').textContent = questions.length;
        
        const preview = document.getElementById('import-preview');
        preview.innerHTML = questions.slice(0, 10).map((q, i) => `
            <div class="import-preview-item">
                <span class="import-preview-index">${i + 1}.</span>
                <span>${Utils.escapeHtml(Utils.truncate(q.content, 50))}</span>
                <span class="badge badge-${q.type === 'single' ? 'info' : 'primary'}">${Utils.getQuestionTypeLabel(q.type)}</span>
            </div>
        `).join('') + (questions.length > 10 ? '<div class="import-preview-item" style="text-align: center; color: var(--text-secondary);">... 还有 ' + (questions.length - 10) + ' 题</div>' : '');
    },

    confirmImport() {
        if (!this.previewQuestions || this.previewQuestions.length === 0) {
            Toast.error('没有可导入的题目');
            return;
        }
        
        QuestionModel.batchCreate(this.currentBankId, this.previewQuestions);
        Toast.success(`成功导入 ${this.previewQuestions.length} 道题目`);
        App.hideModal();
        this.previewQuestions = null;
        this.renderBankDetail();
    },

    cancelImport() {
        this.previewQuestions = null;
        document.getElementById('import-preview-section').classList.add('hidden');
    },

    exportBank(bankId) {
        const bank = BankModel.getById(bankId);
        const questions = QuestionModel.getByBankId(bankId);
        
        if (questions.length === 0) {
            Toast.warning('该题库没有题目可导出');
            return;
        }
        
        const content = Utils.exportQuestionsToJSON(questions, bank.name);
        const filename = `${bank.name}_${Utils.formatDate(new Date())}.json`;
        Utils.downloadFile(content, filename, 'application/json');
        
        Toast.success('导出成功');
    },

    showShareModal(bankId) {
        const bank = BankModel.getById(bankId);
        const questions = QuestionModel.getByBankId(bankId);
        
        if (questions.length === 0) {
            Toast.warning('该题库没有题目，无法分享');
            return;
        }

        const shareLink = ShareUtils.generateSimpleShareLink(bankId);
        
        const modalContent = `
            <div class="modal-header">
                <h3 class="modal-title">📤 分享题库</h3>
                <button class="modal-close" data-action="close">✕</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 8px;">${bank.icon}</div>
                    <h4 style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                        ${bank.name}
                    </h4>
                    <p style="color: var(--text-secondary);">${questions.length} 道题目</p>
                </div>

                <div class="form-group">
                    <label class="form-label">分享链接</label>
                    <div class="flex gap-8">
                        <input type="text" class="form-control" id="share-link-input" 
                            value="${shareLink}" readonly style="font-size: 12px;">
                        <button class="btn btn-primary" onclick="BankPage.copyShareLink()">
                            复制
                        </button>
                    </div>
                    <p class="form-hint">将此链接发送给好友，他们打开后即可导入题库</p>
                </div>

                <div class="form-group">
                    <label class="form-label">分享选项</label>
                    <div class="flex gap-12" style="flex-wrap: wrap;">
                        <button class="btn btn-outline" onclick="BankPage.shareNative('${bankId}')">
                            📲 系统分享
                        </button>
                        <button class="btn btn-outline" onclick="BankPage.downloadShareCard('${bankId}')">
                            🖼️ 生成卡片
                        </button>
                        <button class="btn btn-outline" onclick="BankPage.exportAsJson('${bankId}')">
                            📄 导出JSON
                        </button>
                    </div>
                </div>

                <div id="share-card-preview" style="display: none; margin-top: 20px;">
                    <div style="text-align: center; margin-bottom: 12px;">
                        <span style="font-weight: 600; color: var(--text-primary);">分享卡片预览</span>
                    </div>
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
                        <canvas id="share-card-canvas" style="width: 100%; height: auto;"></canvas>
                    </div>
                    <div class="flex gap-12 mt-12" style="justify-content: center;">
                        <button class="btn btn-primary" onclick="BankPage.downloadCard()">
                            下载图片
                        </button>
                        <button class="btn btn-secondary" onclick="BankPage.hideCardPreview()">
                            隐藏
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        App.showModal(modalContent, { size: 'lg' });
    },

    copyShareLink() {
        const input = document.getElementById('share-link-input');
        if (input) {
            const link = input.value;
            ShareUtils.copyToClipboard(link).then(success => {
                if (success) {
                    Toast.success('链接已复制到剪贴板');
                } else {
                    Toast.error('复制失败，请手动复制');
                }
            });
        }
    },

    shareNative(bankId) {
        const bank = BankModel.getById(bankId);
        const questions = QuestionModel.getByBankId(bankId);
        const shareLink = ShareUtils.generateSimpleShareLink(bankId);
        
        ShareUtils.shareNative(
            `分享题库：${bank.name}`,
            `我在背题神器中发现了一个很棒的题库：${bank.name}，包含 ${questions.length} 道题目，快来一起学习吧！`,
            shareLink
        ).then(success => {
            if (!success) {
                this.copyShareLink();
            }
        });
    },

    downloadShareCard(bankId) {
        const previewDiv = document.getElementById('share-card-preview');
        if (previewDiv) {
            previewDiv.style.display = 'block';
        }

        setTimeout(() => {
            const canvas = document.getElementById('share-card-canvas');
            if (canvas) {
                const bank = BankModel.getById(bankId);
                ShareUtils.drawBankShareCard(canvas, bank);
            }
        }, 100);
    },

    hideCardPreview() {
        const previewDiv = document.getElementById('share-card-preview');
        if (previewDiv) {
            previewDiv.style.display = 'none';
        }
    },

    downloadCard() {
        const canvas = document.getElementById('share-card-canvas');
        if (canvas) {
            const bank = BankModel.getById(this.currentBankId);
            const filename = bank ? `分享_${bank.name}.png` : 'share-card.png';
            ShareUtils.downloadCanvasAsImage(canvas, filename);
            Toast.success('卡片已下载');
        }
    },

    exportAsJson(bankId) {
        this.exportBank(bankId);
    }
};

window.BankPage = BankPage;
