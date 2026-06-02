const EvidencePage = {
    caseId: null,
    clues: [],
    selectedClues: [],
    conclusion: '',

    _saveKey() {
        return 'poan_evidence_' + this.caseId;
    },

    _restoreLocalState() {
        const saved = Storage.get(this._saveKey());
        if (saved) {
            this.selectedClues = saved.selectedClues || [];
            this.conclusion = saved.conclusion || '';
        }
    },

    _saveLocalState() {
        if (!this.caseId) return;
        Storage.set(this._saveKey(), {
            selectedClues: this.selectedClues,
            conclusion: this.conclusion,
            caseId: this.caseId
        });
    },

    _clearLocalState() {
        if (!this.caseId) return;
        Storage.remove(this._saveKey());
    },

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
                    <h1 class="header-title">证据板</h1>
                </header>

                <div class="evidence-board" id="evidenceContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-title">加载线索中<span class="loading-dots"></span></div>
                    </div>
                </div>
            </div>
        `;

        await this.loadClues();
    },

    async loadClues() {
        try {
            const result = await PoanApi.getClues(this.caseId);
            if (result.code === 0) {
                this.clues = (result.data || []).filter(c => c.collected);
                this.renderEvidence();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载线索失败:', error);
            document.getElementById('evidenceContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-title">加载失败</div>
                    <div class="empty-state-text">点击重试</div>
                </div>
            `;
            document.getElementById('evidenceContent').querySelector('.empty-state').onclick = () => this.loadClues();
        }
    },

    renderEvidence() {
        const collectedClues = this.clues.filter(c => c.collected);
        const container = document.getElementById('evidenceContent');

        if (collectedClues.length === 0) {
            container.innerHTML = `
                <h2 class="evidence-board-title">证据板</h2>
                <p class="evidence-board-subtitle">选择线索构建证据链</p>
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-title">暂未收集到线索</div>
                    <div class="empty-state-text">返回案件调查，收集更多线索后再来构建证据链</div>
                    <button class="btn btn-primary mt-2" onclick="Router.navigate('game', { case_id: '${this.caseId}' })">
                        返回调查
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <h2 class="evidence-board-title">证据板</h2>
            <p class="evidence-board-subtitle">已收集 ${collectedClues.length} 条线索，选择关键线索构建证据链</p>

            <div class="evidence-chain">
                <h3 class="evidence-chain-title">证据链 (${this.selectedClues.length})</h3>
                <div class="evidence-chain-items" id="chainItems">
                    ${this.selectedClues.length === 0 ? 
                        '<div class="evidence-chain-empty">请从下方选择线索添加到证据链</div>' :
                        this.selectedClues.map(id => {
                            const clue = this.clues.find(c => c.id === id);
                            return clue ? `
                                <span class="evidence-chain-item">
                                    ${Utils.getClueIcon(clue.type)} ${clue.name}
                                    <span class="evidence-chain-remove" onclick="EvidencePage.removeFromChain(${clue.id})">×</span>
                                </span>
                            ` : '';
                        }).join('')
                    }
                </div>
            </div>

            <div class="evidence-conclusion">
                <label for="conclusionInput">推理结论</label>
                <textarea 
                    id="conclusionInput" 
                    placeholder="请输入您的推理结论，描述案件经过和真凶..."
                    oninput="EvidencePage.handleConclusionInput(this)"
                >${this.conclusion}</textarea>
            </div>

            <div class="evidence-section">
                <h3 class="evidence-section-title">📌 已收集线索</h3>
                <div class="evidence-clue-grid">
                    ${collectedClues.map(clue => {
                        const isSelected = this.selectedClues.includes(clue.id);
                        return `
                            <div class="evidence-clue-item ${isSelected ? 'selected' : ''}" 
                                 data-id="${clue.id}"
                                 onclick="EvidencePage.toggleClue(${clue.id})">
                                <div class="evidence-clue-icon">${Utils.getClueIcon(clue.type)}</div>
                                <div class="evidence-clue-name">${clue.name}</div>
                                <div class="evidence-clue-desc">${Utils.truncateText(clue.description, 30)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div style="padding: 20px 16px;">
                <button class="btn btn-primary btn-block btn-glow" 
                        id="submitBtn"
                        onclick="EvidencePage.submitEvidence()"
                        ${this.selectedClues.length < 2 ? 'disabled' : ''}>
                    ${this.selectedClues.length < 2 ? 
                        `请至少选择 2 条线索 (当前: ${this.selectedClues.length})` : 
                        '提交证据链'}
                </button>
            </div>
        `;
    },

    toggleClue(clueId) {
        const index = this.selectedClues.indexOf(clueId);
        if (index > -1) {
            this.selectedClues.splice(index, 1);
        } else {
            this.selectedClues.push(clueId);
        }
        this._saveLocalState();
        this.renderEvidence();
    },

    removeFromChain(clueId) {
        const index = this.selectedClues.indexOf(clueId);
        if (index > -1) {
            this.selectedClues.splice(index, 1);
        }
        this._saveLocalState();
        this.renderEvidence();
    },

    handleConclusionInput(el) {
        this.conclusion = el.value;
        this._saveLocalState();
    },

    async submitEvidence() {
        if (this.selectedClues.length < 2) {
            Toast.error('请至少选择2条线索');
            return;
        }

        if (!this.conclusion.trim()) {
            Toast.error('请输入推理结论');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> 提交中...';

        try {
            const result = await PoanApi.submitEvidence(
                this.caseId,
                this.selectedClues,
                this.conclusion.trim()
            );

            if (result.code === 0) {
                this._clearLocalState();
                Toast.success('证据链提交成功！');
                if (result.data?.is_correct) {
                    Toast.success('推理正确！您可以继续完成知识问答或直接提交结局。');
                } else {
                    Toast.info('证据链已提交，但推理可能存在偏差，请继续调查。');
                }
                
                setTimeout(() => {
                    Router.navigate('game', { case_id: this.caseId });
                }, 1500);
            } else {
                Toast.error(result.msg || '提交失败');
            }
        } catch (error) {
            console.error('提交证据链失败:', error);
            Toast.error('提交失败，请检查网络');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = this.selectedClues.length < 2 ? 
                `请至少选择 2 条线索 (当前: ${this.selectedClues.length})` : 
                '提交证据链';
        }
    }
};

window.EvidencePage = EvidencePage;
