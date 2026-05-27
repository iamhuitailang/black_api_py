const ProfilePage = {
    user: null,
    statistics: null,

    async render() {
        this.user = AuthService.getUser();

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">个人中心</div>
                </div>
                
                <div class="profile-header">
                    <div class="profile-avatar">${(this.user?.nickname || this.user?.username || 'U')[0]}</div>
                    <div class="profile-info">
                        <div class="profile-name">${Utils.escapeHtml(this.user?.nickname || this.user?.username || '用户')}</div>
                        <div class="profile-school">${Utils.escapeHtml(this.user?.school || '未设置学校')}</div>
                        <div class="profile-credit">
                            信用分：<span class="profile-credit-badge">${this.user?.credit || 100}</span>
                        </div>
                    </div>
                </div>

                <div class="list">
                    <div class="list-item" id="myBooksBtn">
                        <div class="list-item-content">
                            <div class="list-item-title">📚 我发布的教材</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" id="editProfileBtn">
                        <div class="list-item-content">
                            <div class="list-item-title">⚙️ 编辑资料</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" id="changePasswordBtn">
                        <div class="list-item-content">
                            <div class="list-item-title">🔐 修改密码</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" id="myStatsBtn">
                        <div class="list-item-content">
                            <div class="list-item-title">📊 我的数据</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                </div>

                <div class="section-title">订单管理</div>
                <div class="list">
                    <div class="list-item" id="buyOrdersBtn">
                        <div class="list-item-content">
                            <div class="list-item-title">🛒 我买到的</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" id="sellOrdersBtn">
                        <div class="list-item-content">
                            <div class="list-item-title">💰 我卖出的</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                </div>

                <div class="list" style="margin-top:12px;">
                    <div class="list-item" id="aboutBtn">
                        <div class="list-item-content">
                            <div class="list-item-title">ℹ️ 关于我们</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" id="logoutBtn">
                        <div class="list-item-content">
                            <div class="list-item-title text-danger">🚪 退出登录</div>
                        </div>
                    </div>
                </div>
                
                <div class="tabbar">
                    <div class="tabbar-item" data-page="home">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" data-page="orders">
                        <div class="tabbar-icon">📋</div>
                        <div class="tabbar-text">订单</div>
                    </div>
                    <div class="tabbar-item" data-page="favorites">
                        <div class="tabbar-icon">❤️</div>
                        <div class="tabbar-text">收藏</div>
                    </div>
                    <div class="tabbar-item active" data-page="profile">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                Router.navigate(page);
            });
        });

        document.getElementById('myBooksBtn').addEventListener('click', () => {
            Router.navigate('myBooks');
        });

        document.getElementById('editProfileBtn').addEventListener('click', () => {
            this.showEditProfileDialog();
        });

        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            this.showChangePasswordDialog();
        });

        document.getElementById('myStatsBtn').addEventListener('click', () => {
            this.showStatisticsDialog();
        });

        document.getElementById('buyOrdersBtn').addEventListener('click', () => {
            Router.navigate('orders');
        });

        document.getElementById('sellOrdersBtn').addEventListener('click', () => {
            Router.navigate('sellOrders');
        });

        document.getElementById('aboutBtn').addEventListener('click', () => {
            Toast.info('校园二手教材交易平台 v1.0');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            AuthService.logout();
        });
    },

    showEditProfileDialog() {
        const user = this.user;
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;';
        dialog.innerHTML = `
            <div style="background:white;border-radius:12px;width:90%;max-width:400px;padding:20px;">
                <h3 style="margin-bottom:20px;">编辑资料</h3>
                <div class="form-group">
                    <label class="form-label">昵称</label>
                    <input type="text" class="form-control" id="editNickname" value="${Utils.escapeHtml(user?.nickname || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">学校</label>
                    <input type="text" class="form-control" id="editSchool" value="${Utils.escapeHtml(user?.school || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">专业</label>
                    <input type="text" class="form-control" id="editMajor" value="${Utils.escapeHtml(user?.major || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">年级</label>
                    <input type="text" class="form-control" id="editGrade" value="${Utils.escapeHtml(user?.grade || '')}">
                </div>
                <div style="display:flex;gap:12px;margin-top:20px;">
                    <button class="btn btn-outline" style="flex:1;" id="cancelEdit">取消</button>
                    <button class="btn btn-primary" style="flex:1;" id="saveEdit">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('#cancelEdit').addEventListener('click', () => dialog.remove());

        dialog.querySelector('#saveEdit').addEventListener('click', async () => {
            const nickname = dialog.querySelector('#editNickname').value.trim();
            const school = dialog.querySelector('#editSchool').value.trim();
            const major = dialog.querySelector('#editMajor').value.trim();
            const grade = dialog.querySelector('#editGrade').value.trim();

            Utils.showLoading();
            try {
                const result = await ApiService.user.updateProfile({ nickname, school, major, grade });
                if (result.code === 0) {
                    Toast.success('保存成功');
                    AuthService.refreshProfile();
                    dialog.remove();
                    this.render();
                } else {
                    Toast.error(result.msg || '保存失败');
                }
            } catch (e) {
                Toast.error('保存失败');
            } finally {
                Utils.hideLoading();
            }
        });
    },

    showChangePasswordDialog() {
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;';
        dialog.innerHTML = `
            <div style="background:white;border-radius:12px;width:90%;max-width:400px;padding:20px;">
                <h3 style="margin-bottom:20px;">修改密码</h3>
                <div class="form-group">
                    <label class="form-label">原密码</label>
                    <input type="password" class="form-control" id="oldPassword">
                </div>
                <div class="form-group">
                    <label class="form-label">新密码</label>
                    <input type="password" class="form-control" id="newPassword">
                </div>
                <div class="form-group">
                    <label class="form-label">确认新密码</label>
                    <input type="password" class="form-control" id="confirmNewPassword">
                </div>
                <div style="display:flex;gap:12px;margin-top:20px;">
                    <button class="btn btn-outline" style="flex:1;" id="cancelPwd">取消</button>
                    <button class="btn btn-primary" style="flex:1;" id="savePwd">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('#cancelPwd').addEventListener('click', () => dialog.remove());

        dialog.querySelector('#savePwd').addEventListener('click', async () => {
            const oldPassword = dialog.querySelector('#oldPassword').value;
            const newPassword = dialog.querySelector('#newPassword').value;
            const confirmNewPassword = dialog.querySelector('#confirmNewPassword').value;

            if (!oldPassword || !newPassword) {
                Toast.error('请填写完整');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                Toast.error('两次密码不一致');
                return;
            }
            if (newPassword.length < 6) {
                Toast.error('密码至少6位');
                return;
            }

            Utils.showLoading();
            try {
                const result = await ApiService.user.updatePassword({ old_password: oldPassword, new_password: newPassword });
                if (result.code === 0) {
                    Toast.success('修改成功');
                    dialog.remove();
                } else {
                    Toast.error(result.msg || '修改失败');
                }
            } catch (e) {
                Toast.error('修改失败');
            } finally {
                Utils.hideLoading();
            }
        });
    },

    async showStatisticsDialog() {
        Utils.showLoading();
        try {
            const result = await ApiService.statistics.getUser();
            if (result.code === 0) {
                const stats = result.data;
                const dialog = document.createElement('div');
                dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;';
                dialog.innerHTML = `
                    <div style="background:white;border-radius:12px;width:90%;max-width:400px;padding:20px;">
                        <h3 style="margin-bottom:20px;">我的数据</h3>
                        <div class="list" style="margin:0;">
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">发布教材数</div>
                                </div>
                                <div class="list-item-title">${stats.published_books || 0}</div>
                            </div>
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">已售教材数</div>
                                </div>
                                <div class="list-item-title">${stats.sold_books || 0}</div>
                            </div>
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">购买教材数</div>
                                </div>
                                <div class="list-item-title">${stats.bought_books || 0}</div>
                            </div>
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">收藏教材数</div>
                                </div>
                                <div class="list-item-title">${stats.favorite_books || 0}</div>
                            </div>
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">收到评价数</div>
                                </div>
                                <div class="list-item-title">${stats.received_reviews || 0}</div>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block" style="margin-top:20px;" id="closeStats">关闭</button>
                    </div>
                `;
                document.body.appendChild(dialog);
                dialog.querySelector('#closeStats').addEventListener('click', () => dialog.remove());
            }
        } catch (e) {
            Toast.error('加载失败');
        } finally {
            Utils.hideLoading();
        }
    }
};

window.ProfilePage = ProfilePage;
