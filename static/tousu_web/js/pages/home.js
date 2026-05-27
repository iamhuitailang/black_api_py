const HomePage = {
    async render() {
        const app = document.getElementById('app');
        const user = AuthService.getUser();
        const role = user?.role || 'student';

        app.innerHTML = `
            <div class="page has-header">
                ${Layout.renderHeader('校园投诉建议')}
                
                <div class="home-banner">
                    <h2 class="home-banner-title">📝 投诉建议系统</h2>
                    <p class="home-banner-subtitle">您的声音，我们倾听</p>
                </div>

                ${role === 'staff' ? this.renderStaffContent() : this.renderStudentContent()}

                ${Layout.renderTabbar('home')}
            </div>
        `;

        this.bindEvents();
        await this.loadData();
    },

    renderStudentContent() {
        return `
            <div class="home-stats">
                <div class="stat-item">
                    <div class="stat-value" id="myPendingCount">-</div>
                    <div class="stat-label">待处理</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="myProcessingCount">-</div>
                    <div class="stat-label">处理中</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="myCompletedCount">-</div>
                    <div class="stat-label">已完成</div>
                </div>
            </div>

            <div class="home-quick-actions">
                <div class="quick-action" onclick="Router.navigate('complaint', {type: 'complaint'})">
                    <div class="quick-action-icon">📢</div>
                    <div class="quick-action-text">提交投诉</div>
                </div>
                <div class="quick-action" onclick="Router.navigate('complaint', {type: 'suggestion'})">
                    <div class="quick-action-icon">💡</div>
                    <div class="quick-action-text">提交建议</div>
                </div>
                <div class="quick-action" onclick="Router.navigate('myComplaints')">
                    <div class="quick-action-icon">📋</div>
                    <div class="quick-action-text">我的提交</div>
                </div>
                <div class="quick-action" onclick="Router.navigate('notification')">
                    <div class="quick-action-icon">🔔</div>
                    <div class="quick-action-text">消息通知</div>
                </div>
            </div>

            <div class="section-title">最新公告</div>
            <div id="announcementList">
                <div class="empty-state">
                    <div class="empty-state-icon">📢</div>
                    <div class="empty-state-text">加载中...</div>
                </div>
            </div>
        `;
    },

    renderStaffContent() {
        return `
            <div class="home-stats">
                <div class="stat-item">
                    <div class="stat-value" id="pendingCount">-</div>
                    <div class="stat-label">待受理</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="processingCount">-</div>
                    <div class="stat-label">处理中</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="completedCount">-</div>
                    <div class="stat-label">已完成</div>
                </div>
            </div>

            <div class="home-quick-actions">
                <div class="quick-action" onclick="Router.navigate('handle')">
                    <div class="quick-action-icon">📋</div>
                    <div class="quick-action-text">待处理列表</div>
                </div>
                <div class="quick-action" onclick="Router.navigate('handle', {filter: 'processing'})">
                    <div class="quick-action-icon">⚙️</div>
                    <div class="quick-action-text">处理中</div>
                </div>
                <div class="quick-action" onclick="Router.navigate('handle', {filter: 'completed'})">
                    <div class="quick-action-icon">✅</div>
                    <div class="quick-action-text">已完成</div>
                </div>
                <div class="quick-action" onclick="Router.navigate('notification')">
                    <div class="quick-action-icon">🔔</div>
                    <div class="quick-action-text">消息通知</div>
                </div>
            </div>

            <div class="section-title">最新公告</div>
            <div id="announcementList">
                <div class="empty-state">
                    <div class="empty-state-icon">📢</div>
                    <div class="empty-state-text">加载中...</div>
                </div>
            </div>
        `;
    },

    bindEvents() {
    },

    async loadData() {
        const user = AuthService.getUser();
        const role = user?.role || 'student';

        try {
            const result = await ApiService.get('/tousu/complaint/my/list/get', { page: 1, page_size: 1 });
            
            if (result.code === 0) {
                if (role === 'student') {
                    const myResult = await ApiService.get('/tousu/complaint/my/list/get', { page_size: 100 });
                    if (myResult.code === 0) {
                        const items = myResult.data.items || [];
                        document.getElementById('myPendingCount').textContent = items.filter(i => i.status === 0).length;
                        document.getElementById('myProcessingCount').textContent = items.filter(i => i.status === 2).length;
                        document.getElementById('myCompletedCount').textContent = items.filter(i => i.status === 3).length;
                    }
                } else if (role === 'staff') {
                    const statsResult = await ApiService.get('/tousu/complaint/statistics/get');
                    if (statsResult.code === 0) {
                        const stats = statsResult.data;
                        document.getElementById('pendingCount').textContent = stats.pending || 0;
                        document.getElementById('processingCount').textContent = stats.processing || 0;
                        document.getElementById('completedCount').textContent = stats.completed || 0;
                    }
                }
            }
        } catch (error) {
            console.error('加载数据失败:', error);
        }

        this.loadAnnouncements();
    },

    async loadAnnouncements() {
        try {
            const result = await ApiService.get('/tousu/announcement/published/list/get', { page: 1, page_size: 5 });
            
            if (result.code === 0 && result.data.items.length > 0) {
                const list = document.getElementById('announcementList');
                list.innerHTML = result.data.items.map(item => `
                    <div class="list-item" onclick="Toast.info('查看公告详情')">
                        <div class="list-item-content">
                            <div class="list-item-title">${item.title}</div>
                            <div class="list-item-desc">${item.publish_time || item.created_at}</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                `).join('');
            } else {
                document.getElementById('announcementList').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📢</div>
                        <div class="empty-state-text">暂无公告</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载公告失败:', error);
            document.getElementById('announcementList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📢</div>
                    <div class="empty-state-text">加载失败</div>
                </div>
            `;
        }
    }
};

window.HomePage = HomePage;