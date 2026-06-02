const CaseDetailPage = {
    caseData: null,

    async render() {
        const app = document.getElementById('app');
        const params = Router.getParams();
        const caseId = params.case_id;

        if (!caseId) {
            Router.navigate('home');
            return;
        }

        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <h1 class="header-title">案件详情</h1>
                </header>

                <div id="caseDetailContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">📜</div>
                        <div class="empty-state-title">加载中<span class="loading-dots"></span></div>
                    </div>
                </div>

                <div class="case-detail-action">
                    <button class="btn btn-primary btn-block btn-glow" id="startBtn" onclick="CaseDetailPage.handleStart()">开始探案</button>
                </div>
            </div>
        `;

        await this.loadCaseDetail(caseId);
    },

    async loadCaseDetail(caseId) {
        try {
            const result = await PoanApi.getCaseDetail(caseId);

            if (result.code === 0 && result.data) {
                this.caseData = result.data;
                this.renderDetail();
            } else {
                Toast.error(result.msg || '加载失败');
                Router.navigate('home');
            }
        } catch (error) {
            console.error('加载案件详情失败:', error);
            document.getElementById('caseDetailContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-title">加载失败</div>
                    <div class="empty-state-text">点击重试</div>
                </div>
            `;
            document.getElementById('caseDetailContent').querySelector('.empty-state').onclick = () => this.loadCaseDetail(caseId);
        }
    },

    renderDetail() {
        const c = this.caseData;
        const stars = Utils.getDifficultyStars(c.difficulty || 1);
        const eraName = Utils.getEraName(c.era);
        const eraIcon = Utils.getEraIcon(c.era);
        const eraDesc = eraName + '时期，一个充满神秘与悬疑的时代...';
        const container = document.getElementById('caseDetailContent');

        container.innerHTML = `
            <div class="case-detail-hero">
                <div class="case-detail-icon">${c.icon || '📜'}</div>
                <h2 class="case-detail-title">${c.title}</h2>
                <div class="case-detail-tags">
                    <span class="badge badge-primary">${eraIcon} ${eraName}</span>
                    <span class="badge ${Utils.getDifficultyClass(c.difficulty)}">${Utils.getDifficultyText(c.difficulty)}</span>
                </div>
            </div>

            <div class="case-detail-info">
                <div class="case-detail-info-item">
                    <div class="case-detail-info-value">${c.clue_count || 0}</div>
                    <div class="case-detail-info-label">线索数量</div>
                </div>
                <div class="case-detail-info-item">
                    <div class="case-detail-info-value">${c.character_count || 0}</div>
                    <div class="case-detail-info-label">角色数量</div>
                </div>
                <div class="case-detail-info-item">
                    <div class="difficulty-stars" style="justify-content: center;">
                        ${stars.map((s, i) => '<span class="star ' + s + '">★</span>').join('')}
                    </div>
                    <div class="case-detail-info-label">难度等级</div>
                </div>
            </div>

            <div class="case-detail-section">
                <h3 class="case-detail-section-title">案件背景</h3>
                <div class="case-detail-section-content">
                    ${c.background_story || c.background || '暂无背景信息'}
                </div>
            </div>

            <div class="case-detail-section">
                <h3 class="case-detail-section-title">案件描述</h3>
                <div class="case-detail-section-content">
                    ${c.description || '暂无描述'}
                </div>
            </div>

            <div class="case-detail-section">
                <h3 class="case-detail-section-title">时代背景</h3>
                <div class="case-detail-section-content">
                    ${c.era_description || eraDesc}
                </div>
            </div>

            <div style="height: 100px;"></div>
        `;
    },

    async handleStart() {
        if (!this.caseData) return;

        Loading.show();
        try {
            const result = await PoanApi.startGame(this.caseData.id);

            if (result.code === 0) {
                Toast.success('案件已启动，祝您探案顺利！');
                Router.navigate('game', { case_id: this.caseData.id });
            } else {
                Toast.error(result.msg || '启动失败');
            }
        } catch (error) {
            console.error('启动游戏失败:', error);
            Toast.error('启动失败，请检查网络');
        } finally {
            Loading.hide();
        }
    }
};

window.CaseDetailPage = CaseDetailPage;
