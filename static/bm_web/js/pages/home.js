const HomePage = {
    currentPage: 1,
    pageSize: 12,

    init() {
        this.loadActivities();
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.currentPage = 1;
            this.loadActivities();
        });
        document.getElementById('statusFilter')?.addEventListener('change', () => {
            this.currentPage = 1;
            this.loadActivities();
        });
        document.getElementById('keyword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.currentPage = 1;
                this.loadActivities();
            }
        });
    },

    async loadActivities() {
        const status = document.getElementById('statusFilter')?.value || '';
        const keyword = document.getElementById('keyword')?.value || '';

        const result = await API.activity.list(
            this.currentPage,
            this.pageSize,
            status === '' ? null : parseInt(status),
            keyword
        );

        if (result.code === 0) {
            this.renderActivities(result.data.items || []);
            this.renderPagination(result.data.total, result.data.total_pages);
        }
    },

    renderActivities(activities) {
        const container = document.getElementById('activityGrid');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">📭</div>
                    <h3>暂无活动</h3>
                    <p>还没有任何活动，敬请期待</p>
                </div>
            `;
            return;
        }

        const statusMap = {
            1: { text: '报名中', class: 'status-1' },
            2: { text: '进行中', class: 'status-2' },
            3: { text: '已结束', class: 'status-3' },
            4: { text: '已取消', class: 'status-4' }
        };

        container.innerHTML = activities.map(activity => {
            const status = statusMap[activity.status] || statusMap[1];
            return `
                <div class="activity-card">
                    <div class="activity-image">📅</div>
                    <div class="activity-content">
                        <h3 class="activity-title">${activity.title}</h3>
                        <div class="activity-meta">
                            <span>📍 ${activity.location}</span>
                            <span>🕐 ${activity.start_time ? activity.start_time.substring(0, 16) : '-'}</span>
                        </div>
                        <p class="activity-description">${activity.description || '暂无描述'}</p>
                        <div class="activity-footer">
                            <span class="status-badge ${status.class}">${status.text}</span>
                            <span class="quota-info">剩余 <strong>${activity.remaining_quota}</strong> / ${activity.total_quota}</span>
                            <a href="detail.html?id=${activity.id}" class="btn btn-small btn-primary">查看详情</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderPagination(total, totalPages) {
        const container = document.getElementById('pagination');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `<button class="page-btn" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="HomePage.changePage(${this.currentPage - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="HomePage.changePage(${i})">${i}</button>`;
        }

        html += `<button class="page-btn" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="HomePage.changePage(${this.currentPage + 1})">下一页</button>`;
        container.innerHTML = html;
    },

    changePage(page) {
        this.currentPage = page;
        this.loadActivities();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
