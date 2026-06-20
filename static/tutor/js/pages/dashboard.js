const CommonLayout = {
    render(contentHtml, activeMenu = 'dashboard', pageTitle = '') {
        if (!AuthService.isLoggedIn()) {
            Router.navigate('login');
            return;
        }

        const user = AuthService.getUser();
        const role = user && user.profile ? user.profile.role : 'parent';
        const displayName = (user.profile && user.profile.real_name) || user.username;
        const roleText = role === 'parent' ? '家长' : '教师';
        const roleColor = role === 'parent' ? '#c0392b' : '#27ae60';

        const menuItems = role === 'parent' ? [
            { key: 'dashboard', name: '首页', icon: '🏠' },
            { key: 'demand', name: '我的需求', icon: '📋' },
            { key: 'match', name: '匹配教师', icon: '🔍' },
            { key: 'calendar', name: '课程日历', icon: '📅' },
            { key: 'profile', name: '个人资料', icon: '👤' }
        ] : [
            { key: 'dashboard', name: '首页', icon: '🏠' },
            { key: 'match', name: '匹配需求', icon: '🔍' },
            { key: 'calendar', name: '课程日历', icon: '📅' },
            { key: 'profile', name: '个人资料', icon: '👤' }
        ];

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="layout">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">优</div>
                        <div class="sidebar-brand">优师家教</div>
                    </div>
                    <nav class="sidebar-menu">
                        ${menuItems.map(item => `
                            <div class="menu-item ${item.key === activeMenu ? 'active' : ''}" data-route="${item.key}">
                                <span class="icon">${item.icon}</span>
                                <span>${item.name}</span>
                            </div>
                        `).join('')}
                    </nav>
                    <div class="sidebar-footer">
                        <div class="user-brief">
                            <div class="user-avatar">${displayName.charAt(0)}</div>
                            <div class="user-brief-info">
                                <div class="user-brief-name">${displayName}</div>
                                <div class="user-brief-role" style="color: ${roleColor}">${roleText}</div>
                            </div>
                        </div>
                        <button class="btn btn-secondary w-100 btn-sm" id="btn-logout">退出登录</button>
                    </div>
                </aside>
                <div class="main-wrapper">
                    <header class="header">
                        <div class="header-left">
                            <span class="header-title">${pageTitle}</span>
                        </div>
                        <div class="header-right">
                            <span style="color: var(--text-secondary); font-size: 13px;">欢迎回来，${displayName}</span>
                        </div>
                    </header>
                    <main class="main-content" id="main-content">
                        ${contentHtml}
                    </main>
                </div>
            </div>
        `;

        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                Router.navigate(item.dataset.route);
            });
        });

        document.getElementById('btn-logout').addEventListener('click', () => {
            AuthService.logout();
        });
    },

    updateContent(html) {
        const main = document.getElementById('main-content');
        if (main) {
            main.innerHTML = html;
        }
    }
};

const DashboardPage = {
    async render() {
        if (!AuthService.requireAuth()) return;

        CommonLayout.render(`
            <div class="page-header">
                <div class="page-title">工作台</div>
                <div class="page-subtitle">查看您的家教概览信息</div>
            </div>
            <div id="dashboard-content">
                <div class="text-center" style="padding: 60px;"><span class="loading"></span> 加载中...</div>
            </div>
        `, 'dashboard', '首页');

        await this.loadData();
    },

    async loadData() {
        const user = AuthService.getUser();
        const role = user && user.profile ? user.profile.role : 'parent';

        try {
            const coursesResult = await TutorService.getMyCourses();
            const courses = coursesResult.code === 0 ? (coursesResult.data || []) : [];

            const confirmedCount = courses.filter(c => c.status === 'confirmed').length;
            const pendingCount = courses.filter(c => c.status === 'pending').length;

            let statsHtml = '';

            if (role === 'parent') {
                const demandsResult = await TutorService.getMyDemands();
                const demands = demandsResult.code === 0 ? (demandsResult.data || []) : [];
                const activeDemands = demands.filter(d => d.status === 'active').length;

                statsHtml = `
                    <div class="grid-stats">
                        <div class="stat-card">
                            <span class="stat-icon">📋</span>
                            <div class="stat-label">活跃需求</div>
                            <div class="stat-value primary">${activeDemands}</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">⏳</span>
                            <div class="stat-label">待确认课程</div>
                            <div class="stat-value warning">${pendingCount}</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">✅</span>
                            <div class="stat-label">已确认课程</div>
                            <div class="stat-value success">${confirmedCount}</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">📚</span>
                            <div class="stat-label">总课程数</div>
                            <div class="stat-value">${courses.length}</div>
                        </div>
                    </div>
                `;
            } else {
                const matchResult = await TutorService.matchDemands();
                const matchedDemands = matchResult.code === 0 ? (matchResult.data || []) : [];

                statsHtml = `
                    <div class="grid-stats">
                        <div class="stat-card">
                            <span class="stat-icon">🎯</span>
                            <div class="stat-label">匹配需求</div>
                            <div class="stat-value primary">${matchedDemands.length}</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">⏳</span>
                            <div class="stat-label">待确认课程</div>
                            <div class="stat-value warning">${pendingCount}</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">✅</span>
                            <div class="stat-label">已确认课程</div>
                            <div class="stat-value success">${confirmedCount}</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">📚</span>
                            <div class="stat-label">总课程数</div>
                            <div class="stat-value">${courses.length}</div>
                        </div>
                    </div>
                `;
            }

            const recentCourses = courses.slice(0, 5);
            const coursesHtml = recentCourses.length ? `
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">最近课程</div>
                        <button class="btn btn-sm btn-secondary" onclick="Router.navigate('calendar')">查看全部</button>
                    </div>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>科目</th>
                                    <th>${role === 'parent' ? '教师' : '家长'}</th>
                                    <th>日期</th>
                                    <th>时间</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentCourses.map(c => `
                                    <tr>
                                        <td><span class="subject-tag">${c.subject}</span></td>
                                        <td>${role === 'parent' ? (c.teacher_name || c.teacher_username) : (c.parent_name || c.parent_username)}</td>
                                        <td>${c.course_date}</td>
                                        <td>${c.start_time} - ${c.end_time}</td>
                                        <td>${this.getStatusBadge(c.status)}</td>
                                        <td>
                                            ${c.status === 'pending' ? `
                                                <button class="btn btn-sm btn-success" onclick="DashboardPage.confirmCourse(${c.id})">确认</button>
                                                <button class="btn btn-sm btn-secondary" onclick="DashboardPage.cancelCourse(${c.id})">取消</button>
                                            ` : c.status === 'confirmed' ? `
                                                <button class="btn btn-sm btn-secondary" onclick="DashboardPage.cancelCourse(${c.id})">取消</button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : `
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="icon">📅</div>
                            <p>暂无课程安排</p>
                            <p class="hint">${role === 'parent' ? '去发布需求匹配老师吧' : '去查看匹配的需求吧'}</p>
                            <div class="mt-2">
                                ${role === 'parent'
                                    ? '<button class="btn btn-primary" onclick="Router.navigate(\'demand\')">发布需求</button>'
                                    : '<button class="btn btn-primary" onclick="Router.navigate(\'match\')">查看需求</button>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            CommonLayout.updateContent(`
                <div class="page-header">
                    <div class="page-title">工作台</div>
                    <div class="page-subtitle">查看您的家教概览信息</div>
                </div>
                ${statsHtml}
                ${coursesHtml}
            `);
        } catch (e) {
            CommonLayout.updateContent(`
                <div class="page-header">
                    <div class="page-title">工作台</div>
                    <div class="page-subtitle">查看您的家教概览信息</div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="icon">⚠️</div>
                            <p>加载失败，请稍后重试</p>
                        </div>
                    </div>
                </div>
            `);
        }
    },

    getStatusBadge(status) {
        const map = {
            pending: { class: 'badge-warning', text: '待确认' },
            confirmed: { class: 'badge-success', text: '已确认' },
            cancelled: { class: 'badge-secondary', text: '已取消' },
            completed: { class: 'badge-info', text: '已完成' }
        };
        const s = map[status] || { class: 'badge-secondary', text: status };
        return `<span class="badge ${s.class}">${s.text}</span>`;
    },

    async confirmCourse(id) {
        try {
            const result = await TutorService.confirmCourse(id);
            if (result.code === 0) {
                Toast.success('课程已确认');
                this.loadData();
            } else {
                Toast.error(result.message);
            }
        } catch (e) {}
    },

    async cancelCourse(id) {
        if (!confirm('确定要取消这个课程吗？')) return;
        try {
            const result = await TutorService.cancelCourse(id);
            if (result.code === 0) {
                Toast.success('课程已取消');
                this.loadData();
            } else {
                Toast.error(result.message);
            }
        } catch (e) {}
    }
};
