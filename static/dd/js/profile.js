const ProfileModule = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const profilePage = document.getElementById('page-profile');
        if (profilePage) {
            profilePage.addEventListener('page-show', () => this.loadProfile());
        }

        const editProfilePage = document.getElementById('page-edit-profile');
        if (editProfilePage) {
            editProfilePage.addEventListener('page-show', () => this.loadEditForm());
        }

        const contactSettingsPage = document.getElementById('page-contact-settings');
        if (contactSettingsPage) {
            contactSettingsPage.addEventListener('page-show', () => this.loadContactForm());
        }

        const changePasswordPage = document.getElementById('page-change-password');
        if (changePasswordPage) {
            changePasswordPage.addEventListener('page-show', () => this.initPasswordForm());
        }

        const myReportsPage = document.getElementById('page-my-reports');
        if (myReportsPage) {
            myReportsPage.addEventListener('page-show', () => this.loadMyReports());
        }
    },

    loadProfile() {
        const user = Auth.getUser();
        if (!user) return;

        const container = document.getElementById('profile-container');
        if (!container) return;

        const avatar = user.avatar_url || '';
        const nickname = user.nickname || user.phone || '用户';
        const creditScore = user.credit_score || 0;
        const phone = user.phone || '';

        container.innerHTML = `
            <div class="profile-header fade-in">
                <div class="avatar avatar-lg">
                    ${avatar ? `<img src="${avatar}" alt="">` : nickname.charAt(0)}
                </div>
                <div class="profile-info">
                    <div class="profile-name">${Utils.escapeHtml(nickname)}</div>
                    <div class="profile-meta">
                        <div>${Utils.maskPhone(phone)}</div>
                        <div class="profile-credit">
                            <svg width="14" height="14" fill="currentColor" class="text-warning" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            信用分 <span class="credit-score">${creditScore}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="menu-list fade-in animate-delay-1">
                <div class="menu-item" data-route="editProfile">
                    <div class="menu-item-content">
                        <div class="menu-item-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                        </div>
                        <div class="menu-item-text">
                            <div class="menu-item-title">编辑资料</div>
                            <div class="menu-item-hint">修改昵称、头像</div>
                        </div>
                    </div>
                    <div class="menu-item-arrow">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </div>
                </div>

                <div class="menu-item" data-route="contactSettings">
                    <div class="menu-item-content">
                        <div class="menu-item-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                        </div>
                        <div class="menu-item-text">
                            <div class="menu-item-title">联系方式</div>
                            <div class="menu-item-hint">设置电话、微信</div>
                        </div>
                    </div>
                    <div class="menu-item-arrow">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </div>
                </div>

                <div class="menu-item" data-route="changePassword">
                    <div class="menu-item-content">
                        <div class="menu-item-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <div class="menu-item-text">
                            <div class="menu-item-title">修改密码</div>
                            <div class="menu-item-hint">修改登录密码</div>
                        </div>
                    </div>
                    <div class="menu-item-arrow">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="menu-list fade-in animate-delay-2 mt-lg">
                <div class="menu-item" data-route="myReports">
                    <div class="menu-item-content">
                        <div class="menu-item-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M12 9v4"/>
                                <path d="M12 17h.01"/>
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            </svg>
                        </div>
                        <div class="menu-item-text">
                            <div class="menu-item-title">我的举报</div>
                            <div class="menu-item-hint">查看举报记录</div>
                        </div>
                    </div>
                    <div class="menu-item-arrow">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="mt-xl">
                <button class="btn btn-secondary btn-block btn-lg" onclick="ProfileModule.logout()">
                    退出登录
                </button>
            </div>
        `;
    },

    loadEditForm() {
        const user = Auth.getUser();
        if (!user) return;

        const nicknameInput = document.getElementById('edit-nickname');
        if (nicknameInput) {
            nicknameInput.value = user.nickname || '';
        }

        const avatarUrlInput = document.getElementById('edit-avatar-url');
        if (avatarUrlInput) {
            avatarUrlInput.value = user.avatar_url || '';
        }

        const form = document.getElementById('edit-profile-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this.submitEditProfile();
            };
        }
    },

    async submitEditProfile() {
        if (!Auth.requireAuth()) return;

        const nickname = document.getElementById('edit-nickname')?.value.trim();
        const avatarUrl = document.getElementById('edit-avatar-url')?.value.trim();

        const data = {};
        if (nickname) data.nickname = nickname;
        if (avatarUrl) data.avatar_url = avatarUrl;

        if (Object.keys(data).length === 0) {
            Utils.showToast('请填写要修改的内容', 'warning');
            return;
        }

        const submitBtn = document.getElementById('btn-submit-edit');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> 保存中...';
        }

        try {
            await Api.user.updateProfile(data);
            Auth.updateProfile(data);
            Utils.showToast('保存成功', 'success');
            Router.back();
        } catch (error) {
            Utils.showToast(error.message || '保存失败', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    },

    loadContactForm() {
        const user = Auth.getUser();
        if (!user) return;

        const contactPhoneInput = document.getElementById('contact-phone');
        if (contactPhoneInput) {
            contactPhoneInput.value = user.contact_phone || '';
        }

        const wechatQrcodeInput = document.getElementById('wechat-qrcode-url');
        if (wechatQrcodeInput) {
            wechatQrcodeInput.value = user.wechat_qrcode_url || '';
        }

        const form = document.getElementById('contact-settings-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this.submitContactSettings();
            };
        }
    },

    async submitContactSettings() {
        if (!Auth.requireAuth()) return;

        const contactPhone = document.getElementById('contact-phone')?.value.trim();
        const wechatQrcodeUrl = document.getElementById('wechat-qrcode-url')?.value.trim();

        const data = {};
        if (contactPhone) data.contact_phone = contactPhone;
        if (wechatQrcodeUrl) data.wechat_qrcode_url = wechatQrcodeUrl;

        const submitBtn = document.getElementById('btn-submit-contact');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> 保存中...';
        }

        try {
            await Api.user.updateContact(data);
            Auth.updateProfile(data);
            Utils.showToast('保存成功', 'success');
            Router.back();
        } catch (error) {
            Utils.showToast(error.message || '保存失败', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    },

    initPasswordForm() {
        const form = document.getElementById('change-password-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this.submitChangePassword();
            };
        }
    },

    async submitChangePassword() {
        if (!Auth.requireAuth()) return;

        const oldPassword = document.getElementById('old-password')?.value;
        const newPassword = document.getElementById('new-password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;

        if (!oldPassword) {
            Utils.showToast('请输入原密码', 'warning');
            return;
        }

        if (!Utils.isValidPassword(newPassword)) {
            Utils.showToast('新密码至少6位', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            Utils.showToast('两次密码不一致', 'warning');
            return;
        }

        const submitBtn = document.getElementById('btn-submit-password');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> 修改中...';
        }

        try {
            await Api.user.changePassword(oldPassword, newPassword);
            Utils.showToast('密码修改成功，请重新登录', 'success');
            
            await Auth.logout();
            Router.navigate('login', { replace: true });
        } catch (error) {
            Utils.showToast(error.message || '修改失败', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    },

    async loadMyReports() {
        const container = document.getElementById('my-reports-list');
        if (!container) {
            console.error('Container not found: my-reports-list');
            return;
        }

        try {
            container.innerHTML = TaskModule.renderSkeleton();
        } catch (e) {
            console.error('Render skeleton error:', e);
            container.innerHTML = '<div class="text-center text-muted p-lg">加载中...</div>';
        }

        try {
            const result = await Api.report.getMyList();
            console.log('Reports result:', result);

            let reports = [];
            if (result.data) {
                if (Array.isArray(result.data)) {
                    reports = result.data;
                } else if (result.data.list) {
                    reports = result.data.list;
                } else if (result.data.reports) {
                    reports = result.data.reports;
                }
            } else if (Array.isArray(result)) {
                reports = result;
            }

            console.log('Reports parsed:', reports);

            if (reports.length === 0) {
                container.innerHTML = TaskModule.renderEmpty('暂无举报记录');
                return;
            }

            container.innerHTML = reports.map(report => `
                <div class="card fade-in-up">
                    <div class="card-header">
                        <div class="card-title">举报记录 #${report.id || report.report_id || '--'}</div>
                        <span class="badge ${(report.status === 0 || report.status === 'pending') ? 'badge-warning' : (report.status === 1 || report.status === 'processed') ? 'badge-success' : 'badge-secondary'}">
                            ${(report.status === 0 || report.status === 'pending') ? '待处理' : (report.status === 1 || report.status === 'processed') ? '已处理' : '已关闭'}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="mb-sm">
                            <span class="text-muted text-sm">举报原因：</span>
                            <span>${Utils.escapeHtml(report.reason || report.content || '无')}</span>
                        </div>
                        ${report.result || report.handle_result ? `
                            <div class="mb-sm">
                                <span class="text-muted text-sm">处理结果：</span>
                                <span>${Utils.escapeHtml(report.result || report.handle_result || '无')}</span>
                            </div>
                        ` : ''}
                        <div class="text-xs text-muted mt-md">
                            举报时间：${Utils.formatDate(report.created_at || new Date())}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load reports error:', error);
            Utils.showToast(error.message || '加载失败', 'error');
            container.innerHTML = TaskModule.renderEmpty('加载失败，请重试');
        }
    },

    async logout() {
        try {
            await Auth.logout();
            Utils.showToast('已退出登录', 'success');
            Router.navigate('login', { replace: true });
        } catch (error) {
            Utils.showToast(error.message || '退出失败', 'error');
        }
    }
};

window.ProfileModule = ProfileModule;
