const AdminDashboardPage = {
    stats: null,

    render() {
        const admin = AdminAuthService.getCurrentAdmin()
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="admin-layout">
                <div class="admin-sidebar">
                    <div class="admin-logo">🧩 管理后台</div>
                    <div class="admin-menu">
                        <div class="admin-menu-item active" onclick="AdminRouter.navigate('dashboard')">
                            <span>📊</span> 数据统计
                        </div>
                        <div class="admin-menu-item" onclick="AdminRouter.navigate('users')">
                            <span>👥</span> 用户管理
                        </div>
                        <div class="admin-menu-item" onclick="AdminRouter.navigate('themes')">
                            <span>🎨</span> 主题管理
                        </div>
                        <div class="admin-menu-item" onclick="AdminRouter.navigate('props')">
                            <span>🎒</span> 道具管理
                        </div>
                    </div>
                    <div class="admin-user">
                        <div class="admin-user-name">${admin.real_name || admin.username}</div>
                        <div class="admin-user-logout" onclick="AdminDashboardPage.handleLogout()">退出登录</div>
                    </div>
                </div>
                <div class="admin-main">
                    <div class="admin-header">
                        <div class="admin-title">数据统计</div>
                    </div>
                    <div class="admin-content" id="adminContent">
                        <div class="loading-state"><div class="loading-spinner"></div></div>
                    </div>
                </div>
            </div>
        `
        this.loadStats()
    },

    async loadStats() {
        try {
            const result = await AdminService.getStatistics()
            if (result.code === 0 && result.data) {
                this.stats = result.data
                this.renderStats()
            } else {
                document.getElementById('adminContent').innerHTML =
                    '<div class="empty-state"><div class="empty-state-icon">😢</div><div class="empty-state-text">加载失败</div></div>'
            }
        } catch (error) {
            document.getElementById('adminContent').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">😢</div><div class="empty-state-text">加载失败</div></div>'
        }
    },

    renderStats() {
        const stats = this.stats
        const content = document.getElementById('adminContent')
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">🎮</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.total_games || 0}</div>
                        <div class="stat-label">总游戏次数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.total_score || 0}</div>
                        <div class="stat-label">总得分</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.avg_score || 0}</div>
                        <div class="stat-label">平均得分</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.completed_games || 0}</div>
                        <div class="stat-label">通关次数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.today_games || 0}</div>
                        <div class="stat-label">今日游戏</div>
                    </div>
                </div>
            </div>
            <div class="admin-card">
                <div class="admin-card-title">主题游戏分布</div>
                <div class="theme-stats">
                    ${(stats.theme_stats || []).map(t => `
                        <div class="theme-stat-item">
                            <div class="theme-stat-name">${t.theme_name || '未知'}</div>
                            <div class="theme-stat-bar">
                                <div class="theme-stat-progress" style="width:${Math.min(t.play_count * 10, 100)}%"></div>
                            </div>
                            <div class="theme-stat-info">
                                <span>${t.play_count}次</span>
                                <span>均分 ${t.avg_score}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
    },

    async handleLogout() {
        await AdminAuthService.logout()
        Toast.success('已退出登录')
        AdminRouter.navigate('login')
    }
}
