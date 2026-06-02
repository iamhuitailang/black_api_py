const ProfilePage = {
    data: {
        user: null,
        statistics: null,
        loading: false
    },

    render() {
        this.data.user = AuthService.getCurrentUser();
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="profile-page page">
                ${this.renderProfileHeader()}
                ${this.renderStatistics()}
                ${this.renderMenu()}
                ${Tabbar.render('profile')}
            </div>
        `;

        this.bindEvents();
        this.loadData();
    },

    renderProfileHeader() {
        const user = this.data.user || {};
        const nickname = user.nickname || '梦境旅者';
        const avatar = user.avatar || '';
        const username = user.username || '';
        const level = user.level || 1;
        const experience = user.experience || 0;
        const expNeeded = level * 100;
        const expPercent = Math.min(100, (experience / expNeeded) * 100);
        const dreamFragments = user.dream_fragments || 0;
        const bio = user.bio || '这个人很懒，还没有写简介...';

        return `
            <div class="profile-header">
                <div class="profile-bg"></div>
                <div class="profile-content">
                    <div class="profile-top">
                        <div class="profile-avatar">
                            ${avatar ? `<img src="${avatar}" alt="头像">` : '<span class="avatar-placeholder">🌙</span>'}
                        </div>
                        <button class="btn btn-outline btn-sm edit-profile-btn" onclick="ProfilePage.editProfile()">
                            编辑资料
                        </button>
                    </div>
                    <div class="profile-info">
                        <h2 class="profile-name">
                            ${nickname}
                            <span class="profile-level-badge">Lv.${level}</span>
                        </h2>
                        <p class="profile-username">@${username}</p>
                        <p class="profile-bio">${bio}</p>
                    </div>
                    <div class="profile-level">
                        <div class="level-info">
                            <span class="level-text">经验值</span>
                            <span class="level-exp">${experience} / ${expNeeded}</span>
                        </div>
                        <div class="level-progress-bar">
                            <div class="level-progress-fill" style="width: ${expPercent}%"></div>
                        </div>
                    </div>
                    <div class="profile-fragments">
                        <div class="fragment-display">
                            <span class="fragment-icon">💎</span>
                            <span class="fragment-count">${dreamFragments}</span>
                            <span class="fragment-label">梦境碎片</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderStatistics() {
        const stats = this.data.statistics || {};

        return `
            <div class="profile-stats">
                <h3 class="stats-title">
                    <span class="title-icon">📊</span>
                    梦境统计
                </h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">🌌</div>
                        <div class="stat-value">${stats.total_dreams || 0}</div>
                        <div class="stat-label">我的梦境</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👁️</div>
                        <div class="stat-value">${stats.total_views || 0}</div>
                        <div class="stat-label">总浏览量</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">❤️</div>
                        <div class="stat-value">${stats.total_likes || 0}</div>
                        <div class="stat-label">获赞数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-value">${stats.public_dreams || 0}</div>
                        <div class="stat-label">公开梦境</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderMenu() {
        const menuItems = [
            { icon: '✏️', name: '编辑资料', action: 'editProfile()', color: 'var(--purple-500)' },
            { icon: '🔐', name: '修改密码', action: 'changePassword()', color: 'var(--blue-500)' },
            { icon: '⚙️', name: '设置', action: 'openSettings()', color: 'var(--gray-500)' },
            { icon: '🚪', name: '退出登录', action: 'logout()', color: 'var(--red-500)' }
        ];

        return `
            <div class="profile-menu">
                <h3 class="menu-title">
                    <span class="title-icon">📋</span>
                    功能菜单
                </h3>
                <div class="menu-list">
                    ${menuItems.map(item => `
                        <div class="menu-item" onclick="ProfilePage.${item.action}">
                            <div class="menu-icon-wrapper" style="background: ${item.color}20;">
                                <span class="menu-icon">${item.icon}</span>
                            </div>
                            <div class="menu-info">
                                <span class="menu-name">${item.name}</span>
                            </div>
                            <span class="menu-arrow">›</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    bindEvents() {
    },

    async loadData() {
        this.data.loading = true;

        try {
            const [userResult, statsResult] = await Promise.all([
                AuthService.getCurrentUserInfo(),
                DreamService.getStatistics()
            ]);

            if (userResult.code === 0 && userResult.data) {
                this.data.user = userResult.data;
                this.updateProfileHeader();
            }

            if (statsResult.code === 0 && statsResult.data) {
                this.data.statistics = statsResult.data;
                this.updateStatistics();
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            Toast.error('加载数据失败，请刷新重试');
        } finally {
            this.data.loading = false;
        }
    },

    updateProfileHeader() {
        const header = document.querySelector('.profile-header');
        if (header) {
            header.outerHTML = this.renderProfileHeader();
        }
    },

    updateStatistics() {
        const stats = document.querySelector('.profile-stats');
        if (stats) {
            stats.outerHTML = this.renderStatistics();
        }
    },

    renderModal(title, content, onConfirm) {
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    <button class="btn btn-outline modal-cancel-btn">取消</button>
                    <button class="btn btn-primary modal-confirm-btn">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();

        overlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        overlay.querySelector('.modal-cancel-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        overlay.querySelector('.modal-confirm-btn').addEventListener('click', () => {
            onConfirm(closeModal);
        });

        requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
    },

    editProfile() {
        const user = this.data.user || {};
        const nickname = user.nickname || '';
        const email = user.email || '';
        const bio = user.bio || '';

        const formHtml = `
            <div class="form-group">
                <label class="form-label"><span class="label-icon">🎭</span>昵称</label>
                <input type="text" class="form-control" id="editNickname" value="${nickname}" placeholder="给自己取个好听的名字" maxlength="20">
            </div>
            <div class="form-group">
                <label class="form-label"><span class="label-icon">📧</span>邮箱</label>
                <input type="email" class="form-control" id="editEmail" value="${email}" placeholder="请输入邮箱地址" maxlength="50">
            </div>
            <div class="form-group">
                <label class="form-label"><span class="label-icon">📝</span>简介</label>
                <textarea class="form-control" id="editBio" placeholder="写点什么介绍自己..." maxlength="200">${bio}</textarea>
            </div>
        `;

        this.renderModal('编辑资料', formHtml, async (closeModal) => {
            const newNickname = document.getElementById('editNickname').value.trim();
            const newEmail = document.getElementById('editEmail').value.trim();
            const newBio = document.getElementById('editBio').value.trim();

            if (!newNickname) {
                Toast.error('昵称不能为空');
                return;
            }

            if (newEmail && !FormValidator.rules.email(newEmail)) {
                Toast.error('请输入有效的邮箱地址');
                return;
            }

            const confirmBtn = document.querySelector('.modal-confirm-btn');
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<span class="loading"></span> 保存中...';

            try {
                const result = await AuthService.updateProfile({
                    nickname: newNickname,
                    email: newEmail,
                    bio: newBio
                });

                if (result.code === 0) {
                    this.data.user = result.data || { ...this.data.user, nickname: newNickname, email: newEmail, bio: newBio };
                    this.updateProfileHeader();
                    Toast.success('资料更新成功');
                    closeModal();
                } else {
                    Toast.error(result.msg || '更新失败');
                }
            } catch (error) {
                Toast.error('网络错误，请重试');
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.textContent = '确定';
            }
        });
    },

    changePassword() {
        const formHtml = `
            <div class="form-group">
                <label class="form-label"><span class="label-icon">🔑</span>当前密码</label>
                <input type="password" class="form-control" id="oldPassword" placeholder="请输入当前密码">
            </div>
            <div class="form-group">
                <label class="form-label"><span class="label-icon">🔒</span>新密码</label>
                <input type="password" class="form-control" id="newPassword" placeholder="至少6位，最多20位">
            </div>
            <div class="form-group">
                <label class="form-label"><span class="label-icon">🔐</span>确认新密码</label>
                <input type="password" class="form-control" id="confirmPassword" placeholder="再次输入新密码">
            </div>
        `;

        this.renderModal('修改密码', formHtml, async (closeModal) => {
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!oldPassword) {
                Toast.error('请输入当前密码');
                return;
            }

            if (!newPassword) {
                Toast.error('请输入新密码');
                return;
            }

            if (!FormValidator.rules.password(newPassword)) {
                Toast.error('密码长度需在6-20位之间');
                return;
            }

            if (newPassword !== confirmPassword) {
                Toast.error('两次输入的密码不一致');
                return;
            }

            const confirmBtn = document.querySelector('.modal-confirm-btn');
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<span class="loading"></span> 提交中...';

            try {
                const result = await AuthService.changePassword(oldPassword, newPassword);

                if (result.code === 0) {
                    Toast.success('密码修改成功');
                    closeModal();
                } else {
                    Toast.error(result.msg || '修改失败');
                }
            } catch (error) {
                Toast.error('网络错误，请重试');
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.textContent = '确定';
            }
        });
    },

    openSettings() {
        Toast.info('设置功能开发中');
    },

    async logout() {
        if (!confirm('确定要退出登录吗？')) {
            return;
        }

        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (error) {
            Toast.error('退出失败，请重试');
        }
    }
};
