const SettingsPage = {
    render() {
        const user = AuthService.getUser();
        
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">⚙️ 设置</div>
                </div>

                <div class="profile-section" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <div class="profile-avatar" style="width: 64px; height: 64px; border-radius: 50%; background-color: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 28px; color: white; margin-bottom: 12px;">
                        ${user?.nickname ? user.nickname[0].toUpperCase() : 'U'}
                    </div>
                    <div class="profile-name" style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 4px;">
                        ${user?.nickname || user?.username || '用户'}
                    </div>
                    <div class="profile-username" style="font-size: 13px; opacity: 0.8; color: white;">
                        @${user?.username || ''}
                    </div>
                </div>

                <div class="list">
                    <div class="list-item" id="editProfile">
                        <div class="list-item-content">
                            <div class="list-item-title">编辑资料</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                    <div class="list-item" id="changePassword">
                        <div class="list-item-content">
                            <div class="list-item-title">修改密码</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                </div>

                <div class="section-title">数据管理</div>
                <div class="list">
                    <div class="list-item" id="exportJson">
                        <div class="list-item-content">
                            <div class="list-item-title">导出为 JSON</div>
                            <div class="list-item-desc">备份所有便签数据</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                    <div class="list-item" id="exportMarkdown">
                        <div class="list-item-content">
                            <div class="list-item-title">导出为 Markdown</div>
                            <div class="list-item-desc">导出为可读的文档格式</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                    <div class="list-item" id="importNotes">
                        <div class="list-item-content">
                            <div class="list-item-title">导入便签</div>
                            <div class="list-item-desc">从 JSON 文件恢复数据</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                </div>

                <div class="section-title">其他</div>
                <div class="list">
                    <div class="list-item" id="about">
                        <div class="list-item-content">
                            <div class="list-item-title">关于</div>
                            <div class="list-item-desc">版本 1.0.0</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                </div>

                <div class="logout-section" style="padding: 20px 16px;">
                    <button class="btn btn-outline btn-block" id="logoutBtn">退出登录</button>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item" data-route="home">
                        <span class="tabbar-icon">📝</span>
                        <span class="tabbar-text">便签</span>
                    </div>
                    <div class="tabbar-item" data-route="trash">
                        <span class="tabbar-icon">🗑️</span>
                        <span class="tabbar-text">回收站</span>
                    </div>
                    <div class="tabbar-item active" data-route="settings">
                        <span class="tabbar-icon">⚙️</span>
                        <span class="tabbar-text">设置</span>
                    </div>
                </div>
            </div>

            <input type="file" id="importFile" style="display: none;" accept=".json">
        `;

        this.bindEvents();
    },

    bindEvents() {
        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route !== Router.getCurrentRoute()) {
                    Router.navigate(route);
                }
            });
        });

        const editProfile = document.getElementById('editProfile');
        editProfile.addEventListener('click', () => {
            this.showEditProfileModal();
        });

        const changePassword = document.getElementById('changePassword');
        changePassword.addEventListener('click', () => {
            this.showChangePasswordModal();
        });

        const exportJson = document.getElementById('exportJson');
        exportJson.addEventListener('click', () => {
            this.exportJson();
        });

        const exportMarkdown = document.getElementById('exportMarkdown');
        exportMarkdown.addEventListener('click', () => {
            this.exportMarkdown();
        });

        const importNotes = document.getElementById('importNotes');
        const importFile = document.getElementById('importFile');
        
        importNotes.addEventListener('click', () => {
            importFile.click();
        });

        importFile.addEventListener('change', (e) => {
            this.handleImport(e);
        });

        const about = document.getElementById('about');
        about.addEventListener('click', () => {
            Utils.showToast('便利贴 v1.0.0 - 轻量级在线便签工具');
        });

        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => {
            this.logout();
        });
    },

    showEditProfileModal() {
        const user = AuthService.getUser();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>编辑资料</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input type="text" class="form-control" id="modalNickname" value="${user?.nickname || ''}" placeholder="请输入昵称">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="modalCancel">取消</button>
                    <button class="btn btn-primary" id="modalSave">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('#modalCancel');
        const saveBtn = modal.querySelector('#modalSave');

        closeBtn.addEventListener('click', () => modal.remove());
        cancelBtn.addEventListener('click', () => modal.remove());

        saveBtn.addEventListener('click', async () => {
            const nickname = document.getElementById('modalNickname').value.trim();
            
            Utils.showLoading();
            try {
                const result = await AuthService.updateProfile({ nickname });
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast('保存成功');
                    modal.remove();
                    Router.navigate('settings');
                } else {
                    Utils.showToast(result.msg || '保存失败');
                }
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast('保存失败');
            }
        });
    },

    showChangePasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>修改密码</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">原密码</label>
                        <input type="password" class="form-control" id="modalOldPassword" placeholder="请输入原密码">
                    </div>
                    <div class="form-group">
                        <label class="form-label">新密码</label>
                        <input type="password" class="form-control" id="modalNewPassword" placeholder="请输入新密码（至少6位）">
                    </div>
                    <div class="form-group">
                        <label class="form-label">确认新密码</label>
                        <input type="password" class="form-control" id="modalConfirmPassword" placeholder="请再次输入新密码">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="modalCancel">取消</button>
                    <button class="btn btn-primary" id="modalSave">确认</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('#modalCancel');
        const saveBtn = modal.querySelector('#modalSave');

        closeBtn.addEventListener('click', () => modal.remove());
        cancelBtn.addEventListener('click', () => modal.remove());

        saveBtn.addEventListener('click', async () => {
            const oldPassword = document.getElementById('modalOldPassword').value;
            const newPassword = document.getElementById('modalNewPassword').value;
            const confirmPassword = document.getElementById('modalConfirmPassword').value;

            if (!oldPassword) {
                Utils.showToast('请输入原密码');
                return;
            }

            if (!newPassword || newPassword.length < 6) {
                Utils.showToast('新密码长度至少6位');
                return;
            }

            if (newPassword !== confirmPassword) {
                Utils.showToast('两次密码输入不一致');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.changePassword(oldPassword, newPassword);
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast('密码修改成功，请重新登录');
                    modal.remove();
                    Router.navigate('login');
                } else {
                    Utils.showToast(result.msg || '修改失败');
                }
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast('修改失败');
            }
        });
    },

    async exportJson() {
        try {
            const result = await ApiService.get('/bq/note/export/json/get');
            
            if (result.code === 0) {
                const dataStr = JSON.stringify(result.data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `notes_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                
                URL.revokeObjectURL(url);
                Utils.showToast('导出成功');
            } else {
                Utils.showToast(result.msg || '导出失败');
            }
        } catch (error) {
            Utils.showToast('导出失败');
        }
    },

    async exportMarkdown() {
        try {
            const result = await ApiService.get('/bq/note/export/markdown/get');
            
            if (result.code === 0) {
                const blob = new Blob([result.data], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `notes_${new Date().toISOString().slice(0, 10)}.md`;
                a.click();
                
                URL.revokeObjectURL(url);
                Utils.showToast('导出成功');
            } else {
                Utils.showToast(result.msg || '导出失败');
            }
        } catch (error) {
            Utils.showToast('导出失败');
        }
    },

    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!data.notes || !Array.isArray(data.notes)) {
                    Utils.showToast('文件格式错误');
                    return;
                }

                Utils.showLoading();
                const result = await ApiService.post('/bq/note/import', { notes: data.notes });
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast(`成功导入 ${result.data.imported} 条便签`);
                    Router.navigate('home');
                } else {
                    Utils.showToast(result.msg || '导入失败');
                }
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast('文件解析失败');
            }
        };
        reader.readAsText(file);
        
        e.target.value = '';
    },

    async logout() {
        if (!confirm('确定要退出登录吗？')) return;

        try {
            await AuthService.logout();
            Utils.showToast('已退出登录');
            Router.navigate('login');
        } catch (error) {
            Storage.removeToken();
            Storage.removeUser();
            Router.navigate('login');
        }
    }
};

window.SettingsPage = SettingsPage;
