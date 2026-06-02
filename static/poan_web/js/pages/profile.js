const ProfilePage = {
    user: null,
    myCases: [],
    activeTab: 'profile',
    showEditModal: false,
    showPasswordModal: false,
    editForm: { nickname: '', avatar: '' },
    passwordForm: { old_password: '', new_password: '', confirm_password: '' },
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,

    async render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <div class="header-back" onclick="Router.navigate('home')">←</div>
                    <h1 class="header-title">个人中心</h1>
                </header>

                <div class="profile-container" id="profileContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">👤</div>
                        <div class="empty-state-title">加载中<span class="loading-dots"></span></div>
                    </div>
                </div>
            </div>
        `;

        this.activeTab = 'profile';
        this.page = 1;
        this.myCases = [];
        this.total = 0;

        await this.loadUserInfo();
    },

    async loadUserInfo() {
        try {
            const result = await PoanApi.getCurrentUser();
            if (result.code === 0) {
                this.user = result.data;
                this.editForm = {
                    nickname: this.user?.nickname || '',
                    avatar: this.user?.avatar || ''
                };
                this.renderProfile();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
            document.getElementById('profileContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-title">加载失败</div>
                    <div class="empty-state-text">点击重试</div>
                </div>
            `;
            document.getElementById('profileContent').querySelector('.empty-state').onclick = () => this.loadUserInfo();
        }
    },

    renderProfile() {
        const container = document.getElementById('profileContent');
        const levelInfo = Utils.calculateLevel(this.user?.exp || 0);

        container.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    ${this.user?.avatar ? 
                        `<img src="${this.user.avatar}" alt="头像">` : 
                        `<span>${(this.user?.nickname || this.user?.username || '?').charAt(0).toUpperCase()}</span>`
                    }
                    <div class="profile-level-badge">Lv.${levelInfo.level}</div>
                </div>
                <div class="profile-info">
                    <h2 class="profile-name">${this.user?.nickname || this.user?.username || '匿名用户'}</h2>
                    <p class="profile-username">@${this.user?.username || 'unknown'}</p>
                    <p class="profile-title">${Utils.getLevelTitle(levelInfo.level)} · ${this.user?.title || '时光侦探'}</p>
                </div>
            </div>

            <div class="profile-stats">
                <div class="profile-stat-item">
                    <div class="profile-stat-value">${this.user?.solved_cases || 0}</div>
                    <div class="profile-stat-label">已破案件</div>
                </div>
                <div class="profile-stat-item">
                    <div class="profile-stat-value">${levelInfo.level}</div>
                    <div class="profile-stat-label">当前等级</div>
                </div>
                <div class="profile-stat-item">
                    <div class="profile-stat-value">${this.user?.exp || 0}</div>
                    <div class="profile-stat-label">总经验值</div>
                </div>
                <div class="profile-stat-item">
                    <div class="profile-stat-value">${this.user?.perfect_endings || 0}</div>
                    <div class="profile-stat-label">完美推理</div>
                </div>
            </div>

            <div class="profile-exp">
                <div class="profile-exp-label">
                    <span>Lv.${levelInfo.level}</span>
                    <span>${levelInfo.currentExp} / ${levelInfo.nextLevelExp} EXP</span>
                    <span>Lv.${levelInfo.level + 1}</span>
                </div>
                <div class="profile-exp-bar">
                    <div class="profile-exp-fill" style="width: ${levelInfo.progress}%"></div>
                </div>
            </div>

            <div class="tabs">
                <div class="tab-item ${this.activeTab === 'profile' ? 'active' : ''}" onclick="ProfilePage.switchTab('profile')">
                    个人信息
                </div>
                <div class="tab-item ${this.activeTab === 'cases' ? 'active' : ''}" onclick="ProfilePage.switchTab('cases')">
                    我的案件
                </div>
            </div>

            <div id="tabContent">
                ${this.activeTab === 'profile' ? this.renderProfileTab() : this.renderCasesTab()}
            </div>
        `;

        if (this.showEditModal) {
            this.renderEditModal();
        }

        if (this.showPasswordModal) {
            this.renderPasswordModal();
        }
    },

    renderProfileTab() {
        return `
            <div class="profile-menu">
                <div class="profile-menu-item" onclick="ProfilePage.openEditModal()">
                    <div class="profile-menu-icon">✏️</div>
                    <div class="profile-menu-content">
                        <div class="profile-menu-title">编辑资料</div>
                        <div class="profile-menu-desc">修改昵称和头像</div>
                    </div>
                    <span>›</span>
                </div>

                <div class="profile-menu-item" onclick="ProfilePage.openPasswordModal()">
                    <div class="profile-menu-icon">🔐</div>
                    <div class="profile-menu-content">
                        <div class="profile-menu-title">修改密码</div>
                        <div class="profile-menu-desc">修改登录密码</div>
                    </div>
                    <span>›</span>
                </div>

                <div class="profile-menu-item" onclick="ProfilePage.showInitButton()">
                    <div class="profile-menu-icon">📦</div>
                    <div class="profile-menu-content">
                        <div class="profile-menu-title">初始化示例案件</div>
                        <div class="profile-menu-desc">添加示例案件数据</div>
                    </div>
                    <span>›</span>
                </div>

                <div class="section-title" style="margin-top: 24px;">账户</div>

                <div class="profile-menu-item" onclick="ProfilePage.handleLogout()">
                    <div class="profile-menu-icon" style="color: var(--error);">🚪</div>
                    <div class="profile-menu-content">
                        <div class="profile-menu-title" style="color: var(--error);">退出登录</div>
                        <div class="profile-menu-desc">退出当前账户</div>
                    </div>
                    <span>›</span>
                </div>
            </div>
        `;
    },

    renderCasesTab() {
        if (this.loading && this.myCases.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📂</div>
                    <div class="empty-state-title">加载中<span class="loading-dots"></span></div>
                </div>
            `;
        }

        if (this.myCases.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📂</div>
                    <div class="empty-state-title">暂无案件记录</div>
                    <div class="empty-state-text">去破案吧，成为真正的时光侦探！</div>
                    <button class="btn btn-primary mt-2" onclick="Router.navigate('home')">
                        去破案
                    </button>
                </div>
            `;
        }

        return `
            <div class="my-cases-list">
                ${this.myCases.map(c => `
                    <div class="my-case-item" onclick="Router.navigate('case_detail', { case_id: '${c.case_id}' })">
                        <div class="my-case-icon">${Utils.getEraIcon(c.era)}</div>
                        <div class="my-case-content">
                            <div class="my-case-title">${c.title}</div>
                            <div class="my-case-meta">
                                <span>${Utils.getEraText(c.era)}</span>
                                <span>${Utils.getDifficultyStars(c.difficulty)}</span>
                            </div>
                            <div class="my-case-progress">
                                ${c.ending_type ? `
                                    <span class="my-case-ending ${c.ending_type}">
                                        ${Utils.getEndingIcon(c.ending_type)} ${Utils.getEndingTypeText(c.ending_type)}
                                    </span>
                                ` : `
                                    <span class="my-case-progress-text">进度: ${c.progress || 0}%</span>
                                `}
                            </div>
                        </div>
                        <span>›</span>
                    </div>
                `).join('')}
            </div>

            ${this.total > this.myCases.length ? `
                <div style="padding: 16px; text-align: center;">
                    <button class="btn btn-outline" ${this.loading ? 'disabled' : ''} onclick="ProfilePage.loadMore()">
                        ${this.loading ? '<span class="loading"></span> 加载中...' : '加载更多'}
                    </button>
                </div>
            ` : ''}
        `;
    },

    switchTab(tab) {
        this.activeTab = tab;
        if (tab === 'cases' && this.myCases.length === 0) {
            this.loadMyCases();
        }
        this.renderProfile();
    },

    async loadMyCases() {
        if (this.loading) return;
        this.loading = true;

        try {
            const result = await PoanApi.getMyCases(this.page, this.pageSize);
            if (result.code === 0) {
                const data = result.data || {};
                this.myCases = data.list || data.items || [];
                this.total = data.total || 0;
                this.renderProfile();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载我的案件失败:', error);
        } finally {
            this.loading = false;
        }
    },

    async loadMore() {
        if (this.loading) return;
        this.loading = true;
        this.page++;

        try {
            const result = await PoanApi.getMyCases(this.page, this.pageSize);
            if (result.code === 0) {
                const data = result.data || {};
                const newCases = data.list || data.items || [];
                this.myCases = [...this.myCases, ...newCases];
                this.total = data.total || 0;
                this.renderProfile();
            }
        } catch (error) {
            console.error('加载更多失败:', error);
        } finally {
            this.loading = false;
        }
    },

    openEditModal() {
        this.showEditModal = true;
        this.renderProfile();
    },

    openPasswordModal() {
        this.showPasswordModal = true;
        this.passwordForm = { old_password: '', new_password: '', confirm_password: '' };
        this.renderProfile();
    },

    renderEditModal() {
        const modalHtml = `
            <div class="modal-overlay" id="editModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>编辑资料</h3>
                        <span class="modal-close" onclick="ProfilePage.closeEditModal()">×</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>昵称</label>
                            <input type="text" id="editNickname" placeholder="请输入昵称" 
                                   value="${this.editForm.nickname}" 
                                   oninput="ProfilePage.editForm.nickname = this.value">
                        </div>
                        <div class="form-group">
                            <label>头像URL (可选)</label>
                            <input type="text" id="editAvatar" placeholder="请输入头像链接" 
                                   value="${this.editForm.avatar}" 
                                   oninput="ProfilePage.editForm.avatar = this.value">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="ProfilePage.closeEditModal()">取消</button>
                        <button class="btn btn-primary" onclick="ProfilePage.submitEdit()">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    renderPasswordModal() {
        const modalHtml = `
            <div class="modal-overlay" id="passwordModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>修改密码</h3>
                        <span class="modal-close" onclick="ProfilePage.closePasswordModal()">×</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>原密码</label>
                            <input type="password" id="oldPassword" placeholder="请输入原密码" 
                                   oninput="ProfilePage.passwordForm.old_password = this.value">
                        </div>
                        <div class="form-group">
                            <label>新密码</label>
                            <input type="password" id="newPassword" placeholder="请输入新密码 (6-20位)" 
                                   oninput="ProfilePage.passwordForm.new_password = this.value">
                        </div>
                        <div class="form-group">
                            <label>确认新密码</label>
                            <input type="password" id="confirmPassword" placeholder="请再次输入新密码" 
                                   oninput="ProfilePage.passwordForm.confirm_password = this.value">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="ProfilePage.closePasswordModal()">取消</button>
                        <button class="btn btn-primary" onclick="ProfilePage.submitPassword()">确认修改</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    closeEditModal() {
        this.showEditModal = false;
        const modal = document.getElementById('editModal');
        if (modal) modal.remove();
    },

    closePasswordModal() {
        this.showPasswordModal = false;
        const modal = document.getElementById('passwordModal');
        if (modal) modal.remove();
    },

    async submitEdit() {
        if (!this.editForm.nickname.trim()) {
            Toast.error('昵称不能为空');
            return;
        }

        Loading.show();
        try {
            const result = await AuthService.updateProfile({
                nickname: this.editForm.nickname.trim(),
                avatar: this.editForm.avatar.trim() || null
            });

            if (result.code === 0) {
                Toast.success('资料更新成功！');
                this.closeEditModal();
                await this.loadUserInfo();
            } else {
                Toast.error(result.msg || '更新失败');
            }
        } catch (error) {
            console.error('更新资料失败:', error);
            Toast.error('更新失败，请检查网络');
        } finally {
            Loading.hide();
        }
    },

    async submitPassword() {
        const { old_password, new_password, confirm_password } = this.passwordForm;

        if (!old_password || !new_password || !confirm_password) {
            Toast.error('请填写完整信息');
            return;
        }

        if (new_password.length < 6 || new_password.length > 20) {
            Toast.error('新密码长度应为6-20位');
            return;
        }

        if (new_password !== confirm_password) {
            Toast.error('两次输入的新密码不一致');
            return;
        }

        Loading.show();
        try {
            const result = await AuthService.changePassword(old_password, new_password);

            if (result.code === 0) {
                Toast.success('密码修改成功！');
                this.closePasswordModal();
            } else {
                Toast.error(result.msg || '修改失败');
            }
        } catch (error) {
            console.error('修改密码失败:', error);
            Toast.error('修改失败，请检查网络');
        } finally {
            Loading.hide();
        }
    },

    async showInitButton() {
        if (!confirm('确定要初始化示例案件吗？')) {
            return;
        }

        Loading.show();
        try {
            const result = await PoanApi.initCases();
            if (result.code === 0) {
                Toast.success('初始化成功！');
            } else {
                Toast.error(result.msg || '初始化失败');
            }
        } catch (error) {
            console.error('初始化失败:', error);
            Toast.error('初始化失败，请检查网络');
        } finally {
            Loading.hide();
        }
    },

    async handleLogout() {
        if (!confirm('确定要退出登录吗？')) {
            return;
        }

        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (error) {
            console.error('退出登录失败:', error);
            Storage.clearToken();
            Storage.clearUser();
            Router.navigate('login');
        }
    }
};

window.ProfilePage = ProfilePage;
