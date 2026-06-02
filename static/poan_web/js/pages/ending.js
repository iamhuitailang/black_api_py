const EndingPage = {
    caseId: null,
    caseData: null,
    clues: [],
    selectedEnding: null,

    endingOptions: [
        { type: 'perfect', icon: '🏆', title: '完美推理', desc: '所有线索指向真凶，证据链完整' },
        { type: 'good', icon: '⭐', title: '基本正确', desc: '主要推理正确，但部分细节有偏差' },
        { type: 'normal', icon: '📜', title: '普通结局', desc: '推理存在不足，但方向大致正确' },
        { type: 'bad', icon: '💔', title: '推理失败', desc: '未能找到真凶，案件成为悬案' }
    ],

    _saveKey() {
        return 'poan_ending_' + this.caseId;
    },

    _restoreLocalState() {
        const saved = Storage.get(this._saveKey());
        if (saved) {
            this.selectedEnding = saved.selectedEnding || null;
        }
    },

    _saveLocalState() {
        if (!this.caseId) return;
        Storage.set(this._saveKey(), {
            selectedEnding: this.selectedEnding,
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
                    <h1 class="header-title">提交推理</h1>
                </header>

                <div id="endingContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">🏁</div>
                        <div class="empty-state-title">加载中<span class="loading-dots"></span></div>
                    </div>
                </div>
            </div>
        `;

        await this.loadData();
    },

    async loadData() {
        try {
            const [caseResult, cluesResult] = await Promise.all([
                PoanApi.getCaseDetail(this.caseId),
                PoanApi.getClues(this.caseId)
            ]);

            if (caseResult.code === 0) {
                this.caseData = caseResult.data;
            }

            if (cluesResult.code === 0) {
                this.clues = cluesResult.data || [];
            }

            this.renderEnding();
        } catch (error) {
            console.error('加载数据失败:', error);
            document.getElementById('endingContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-title">加载失败</div>
                    <div class="empty-state-text">点击重试</div>
                </div>
            `;
            document.getElementById('endingContent').querySelector('.empty-state').onclick = () => this.loadData();
        }
    },

    renderEnding() {
        const collectedClues = this.clues.filter(c => c.collected);
        const totalClues = this.clues.length;
        const clueProgress = totalClues > 0 ? Math.floor((collectedClues.length / totalClues) * 100) : 0;

        const container = document.getElementById('endingContent');
        container.innerHTML = `
            <div class="ending-container">
                <div class="ending-bg-pattern"></div>
                
                <div class="ending-icon">📝</div>
                <h1 class="ending-title">提交最终推理</h1>
                <p class="ending-type">${this.caseData?.title || '案件'}</p>

                <div class="ending-stats">
                    <div class="ending-stat-item">
                        <div class="ending-stat-value">${collectedClues.length}</div>
                        <div class="ending-stat-label">收集线索</div>
                    </div>
                    <div class="ending-stat-item">
                        <div class="ending-stat-value">${totalClues}</div>
                        <div class="ending-stat-label">总线索数</div>
                    </div>
                    <div class="ending-stat-item">
                        <div class="ending-stat-value">${clueProgress}%</div>
                        <div class="ending-stat-label">完成度</div>
                    </div>
                </div>

                <div class="ending-description">
                    <div class="ending-description-text">
                        根据您收集的线索和调查结果，请选择您认为的案件结局。
                        ${clueProgress < 80 ? 
                            `<br><br><span style="color: var(--warning);">⚠️ 您只收集了 ${clueProgress}% 的线索，建议收集更多线索后再提交。</span>` : 
                            `<br><br><span style="color: var(--success);">✓ 您已收集足够的线索，可以提交最终推理。</span>`
                        }
                    </div>
                </div>

                <div class="section-title" style="padding-left: 0;">选择推理结局</div>
                
                <div style="width: 100%; max-width: 500px; z-index: 1;">
                    ${this.endingOptions.map(opt => `
                        <div class="profile-menu-item" 
                             data-type="${opt.type}"
                             onclick="EndingPage.selectEnding('${opt.type}')"
                             style="margin-bottom: 12px; border: 2px solid ${this.selectedEnding === opt.type ? 'var(--primary-purple)' : 'var(--border-color)'};">
                            <div class="profile-menu-icon" style="font-size: 28px;">${opt.icon}</div>
                            <div class="profile-menu-content">
                                <div class="profile-menu-title" style="color: ${this.selectedEnding === opt.type ? 'var(--primary-purple)' : 'var(--text-primary)'};">${opt.title}</div>
                                <div class="profile-menu-desc">${opt.desc}</div>
                            </div>
                            ${this.selectedEnding === opt.type ? '<span style="color: var(--primary-purple); font-size: 20px;">✓</span>' : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="ending-actions">
                    <button class="btn btn-outline" onclick="Router.navigate('game', { case_id: '${this.caseId}' })">
                        返回继续调查
                    </button>
                    <button class="btn btn-primary btn-glow" 
                            id="submitEndingBtn"
                            onclick="EndingPage.submitEnding()"
                            ${!this.selectedEnding ? 'disabled' : ''}>
                        ${!this.selectedEnding ? '请选择结局类型' : '确认提交推理'}
                    </button>
                </div>
            </div>
        `;
    },

    selectEnding(type) {
        this.selectedEnding = type;
        this._saveLocalState();
        this.renderEnding();
    },

    async submitEnding() {
        if (!this.selectedEnding) {
            Toast.error('请选择结局类型');
            return;
        }

        const submitBtn = document.getElementById('submitEndingBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> 提交中...';

        try {
            const result = await PoanApi.submitEnding(this.caseId, this.selectedEnding);

            if (result.code === 0) {
                const endingData = result.data || {};
                const endingType = endingData.ending_type || this.selectedEnding;
                const expGained = endingData.exp_gained || 0;

                this._clearLocalState();
                Storage.removeGameState(this.caseId);

                Toast.success('推理提交成功！');

                setTimeout(() => {
                    this.showEndingResult(endingType, expGained, endingData);
                }, 1000);
            } else {
                Toast.error(result.msg || '提交失败');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '确认提交推理';
            }
        } catch (error) {
            console.error('提交结局失败:', error);
            Toast.error('提交失败，请检查网络');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '确认提交推理';
        }
    },

    showEndingResult(endingType, expGained, data) {
        const endingIcon = Utils.getEndingIcon(endingType);
        const endingText = Utils.getEndingTypeText(endingType);
        const endingClass = endingType;

        const container = document.getElementById('endingContent');
        container.innerHTML = `
            <div class="ending-container">
                <div class="ending-bg-pattern"></div>
                
                <div class="ending-icon">${endingIcon}</div>
                <h1 class="ending-title">案件结案</h1>
                <p class="ending-type ${endingClass}">${endingText}</p>

                <div class="ending-description">
                    <div class="ending-description-text">
                        ${data.description || this.getEndingDescription(endingType)}
                    </div>
                </div>

                <div class="ending-stats">
                    <div class="ending-stat-item">
                        <div class="ending-stat-value">${data.clues_collected || this.clues.filter(c => c.collected).length}</div>
                        <div class="ending-stat-label">收集线索</div>
                    </div>
                    <div class="ending-stat-item">
                        <div class="ending-stat-value">${data.accuracy || '—'}</div>
                        <div class="ending-stat-label">推理准确度</div>
                    </div>
                    <div class="ending-stat-item">
                        <div class="ending-stat-value">+${expGained}</div>
                        <div class="ending-stat-label">获得经验</div>
                    </div>
                </div>

                <div class="ending-actions">
                    <button class="btn btn-outline" onclick="Router.navigate('home')">
                        返回案件列表
                    </button>
                    <button class="btn btn-primary" onclick="Router.navigate('profile')">
                        查看个人中心
                    </button>
                </div>
            </div>
        `;

        if (expGained > 0) {
            setTimeout(() => {
                Toast.info(`获得 ${expGained} 点经验值！`);
            }, 500);
        }
    },

    getEndingDescription(type) {
        const descriptions = {
            perfect: '恭喜您！您的推理完美还原了案件真相。所有线索都指向正确的方向，真凶已经落网。您展现了出色的侦探天赋，时光侦探局为您感到骄傲！',
            good: '干得不错！您的推理基本正确，虽然在一些细节上还有偏差，但整体方向是对的。真凶已经被绳之以法，继续努力成为更优秀的侦探吧！',
            normal: '案件已经结束。虽然您的推理存在一些不足，但还是帮助警方找到了破案的方向。建议您下次收集更多线索，仔细分析证据。',
            bad: '很遗憾，这次推理失败了。由于证据不足或方向偏差，真凶仍然逍遥法外。别灰心，每一次失败都是成长的机会，回去重新调查吧！'
        };
        return descriptions[type] || '案件调查已结束。';
    }
};

window.EndingPage = EndingPage;
