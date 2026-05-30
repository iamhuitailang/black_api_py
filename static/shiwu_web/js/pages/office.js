const OfficePage = {
    offices: [],
    notices: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                ${Header.render('官方招领处', false)}
                <main class="container">
                    <div class="hero-section" style="margin: -16px -16px 20px; border-radius: 0 0 var(--radius-xl) var(--radius-xl);">
                        <h1 class="hero-title">🏛️ 失物招领处</h1>
                        <p class="hero-subtitle">学生会 · 保卫处 官方指定平台</p>
                    </div>

                    <div class="office-section">
                        <h3 class="office-section-title">
                            <span class="icon">📍</span> 招领点
                        </h3>
                        <div id="officesList">
                            <div class="loading">
                                <div class="loading-spinner"></div>
                            </div>
                        </div>
                    </div>

                    <div class="office-section">
                        <h3 class="office-section-title">
                            <span class="icon">📢</span> 官方公告
                        </h3>
                        <div id="noticesList">
                            <div class="loading">
                                <div class="loading-spinner"></div>
                            </div>
                        </div>
                    </div>

                    <div class="office-section">
                        <h3 class="office-section-title">
                            <span class="icon">📦</span> 本周汇总
                        </h3>
                        <div id="summaryList">
                            <div class="loading">
                                <div class="loading-spinner"></div>
                            </div>
                        </div>
                    </div>
                </main>

                ${Tabbar.render('office')}
            </div>
        `;

        await this.loadData();
    },

    async loadData() {
        try {
            const result = await ApiService.get('/shiwu/office/list/get');
            if (result.code === 0) {
                this.offices = result.data.official || [];
                this.notices = result.data.announcement || [];
                this.summaries = result.data.summary || [];
                this.renderOffices();
                this.renderNotices();
                this.renderSummaries();
            }
        } catch (error) {
            console.error('加载官方信息失败:', error);
            document.getElementById('officesList').innerHTML = `
                <div class="empty" style="padding: 30px 20px;">
                    <div class="empty-icon">❌</div>
                    <div class="empty-text">加载失败</div>
                </div>
            `;
        }
    },

    renderOffices() {
        const list = document.getElementById('officesList');
        
        if (this.offices.length === 0) {
            list.innerHTML = `
                <div class="empty" style="padding: 30px 20px;">
                    <div class="empty-icon">🏢</div>
                    <div class="empty-text">暂无招领点信息</div>
                </div>
            `;
            return;
        }

        list.innerHTML = this.offices.map(office => `
            <div class="office-card">
                <h4 class="office-card-title">${office.title}</h4>
                <div class="office-card-meta">
                    ${office.location ? `<span>📍 ${office.location}</span>` : ''}
                    ${office.open_hours ? `<span>⏰ ${office.open_hours}</span>` : ''}
                </div>
                <p class="office-card-content">${office.content || ''}</p>
                ${office.contact ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
                        <span style="font-size: 12px; color: var(--primary-blue);">📞 ${office.contact}</span>
                    </div>
                ` : ''}
            </div>
        `).join('');
    },

    renderNotices() {
        const list = document.getElementById('noticesList');
        
        if (this.notices.length === 0) {
            list.innerHTML = `
                <div class="empty" style="padding: 30px 20px;">
                    <div class="empty-icon">📋</div>
                    <div class="empty-text">暂无公告</div>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notices.map(notice => `
            <div class="office-card">
                <h4 class="office-card-title">${notice.title}</h4>
                <div class="office-card-meta">
                    <span>📅 ${Utils.formatTime(notice.created_at)}</span>
                </div>
                <p class="office-card-content">${notice.content}</p>
            </div>
        `).join('');
    },

    renderSummaries() {
        const list = document.getElementById('summaryList');
        
        if (!this.summaries || this.summaries.length === 0) {
            list.innerHTML = `
                <div class="card">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--primary-blue);">0</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">寻物启事</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--primary-green);">0</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">招领启事</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--gray-color);">0</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">已认领</div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        list.innerHTML = this.summaries.map(summary => `
            <div class="office-card">
                <h4 class="office-card-title">${summary.title}</h4>
                <div class="office-card-meta">
                    <span>📅 ${Utils.formatTime(summary.created_at)}</span>
                </div>
                <p class="office-card-content">${summary.content}</p>
            </div>
        `).join('');
    }
};

window.OfficePage = OfficePage;
