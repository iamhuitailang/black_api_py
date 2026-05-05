const FriendsPage = {
    currentTab: 'list',
    friends: null,
    pendingRequests: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header">
                    <button class="header-back" id="friends-back">←</button>
                    <div class="header-title">好友管理</div>
                </div>

                <div class="social-tabs">
                    <div class="social-tab ${this.currentTab === 'list' ? 'active' : ''}" data-tab="list">好友列表</div>
                    <div class="social-tab ${this.currentTab === 'pending' ? 'active' : ''}" data-tab="pending">待确认</div>
                </div>

                <div class="friend-search">
                    <input type="tel" class="friend-search-input" id="search-phone" placeholder="搜索手机号添加好友" maxlength="11">
                    <button class="friend-search-btn" id="search-btn">搜索</button>
                </div>

                <div id="friends-content">
                    ${this.renderContent()}
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadData();
    },

    renderContent() {
        if (this.currentTab === 'list') {
            return this.renderFriendsList();
        } else {
            return this.renderPendingList();
        }
    },

    renderFriendsList() {
        if (!this.friends || this.friends.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">暂无好友</div>
                    <div style="font-size: 12px; margin-top: 8px; color: var(--text-secondary);">
                        输入好友手机号添加好友
                    </div>
                </div>
            `;
        }

        return `
            <div class="list" style="margin: 12px;">
                ${this.friends.map(friend => `
                    <div class="list-item">
                        <div class="ranking-avatar" style="margin-right: 12px;">${friend.avatar || '🏃'}</div>
                        <div class="list-item-content">
                            <div class="list-item-title">${friend.nickname || '用户'}</div>
                            <div class="list-item-desc">
                                ${Utils.formatNumber(friend.total_count || 0)} 次 · 连续打卡 ${friend.streak_days || 0} 天
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline" data-action="remove" data-id="${friend.user_id}">删除</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderPendingList() {
        if (!this.pendingRequests || this.pendingRequests.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无待确认请求</div>
                </div>
            `;
        }

        return `
            <div style="padding: 0 12px;">
                ${this.pendingRequests.map(req => `
                    <div class="friend-request-item">
                        <div class="friend-request-avatar">${req.avatar || '🏃'}</div>
                        <div class="friend-request-info">
                            <div class="friend-request-name">${req.nickname || '用户'}</div>
                            <div class="list-item-desc" style="margin-top: 2px;">请求添加你为好友</div>
                        </div>
                        <div class="friend-request-actions">
                            <button class="friend-request-btn accept" data-action="accept" data-id="${req.id}">接受</button>
                            <button class="friend-request-btn reject" data-action="reject" data-id="${req.id}">拒绝</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    bindEvents() {
        const backBtn = document.getElementById('friends-back');
        backBtn.addEventListener('click', () => {
            Router.navigate('profile');
        });

        document.querySelectorAll('.social-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                document.querySelectorAll('.social-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.tab === this.currentTab);
                });
                const content = document.getElementById('friends-content');
                if (content) {
                    content.innerHTML = this.renderContent();
                    this.bindContentEvents();
                }
            });
        });

        const searchBtn = document.getElementById('search-btn');
        searchBtn.addEventListener('click', () => this.handleSearch());

        const searchInput = document.getElementById('search-phone');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        this.bindContentEvents();
    },

    bindContentEvents() {
        document.querySelectorAll('[data-action="remove"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const friendId = parseInt(btn.dataset.id);
                const confirmed = await Utils.showConfirm('删除好友', '确定要删除该好友吗？');
                if (confirmed) {
                    await this.removeFriend(friendId);
                }
            });
        });

        document.querySelectorAll('[data-action="accept"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const relationshipId = parseInt(btn.dataset.id);
                await this.acceptRequest(relationshipId);
            });
        });

        document.querySelectorAll('[data-action="reject"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const relationshipId = parseInt(btn.dataset.id);
                await this.rejectRequest(relationshipId);
            });
        });
    },

    async loadData() {
        await Promise.all([
            this.loadFriends(),
            this.loadPendingRequests()
        ]);
    },

    async loadFriends() {
        try {
            const result = await ApiService.get('/ts/friend/list/get');
            if (result.code === 0) {
                this.friends = result.data;
            }
        } catch (e) {
            console.error('Load friends error:', e);
        }
        this.updateContent();
    },

    async loadPendingRequests() {
        try {
            const result = await ApiService.get('/ts/friend/pending/get');
            if (result.code === 0) {
                this.pendingRequests = result.data;
            }
        } catch (e) {
            console.error('Load pending requests error:', e);
        }
        this.updateContent();
    },

    updateContent() {
        const content = document.getElementById('friends-content');
        if (content) {
            content.innerHTML = this.renderContent();
            this.bindContentEvents();
        }
    },

    async handleSearch() {
        const phone = document.getElementById('search-phone').value.trim();

        if (!phone) {
            Utils.showToast('请输入手机号');
            return;
        }

        if (!Utils.isValidPhone(phone)) {
            Utils.showToast('手机号格式不正确');
            return;
        }

        Utils.showLoading();
        try {
            const result = await ApiService.post('/ts/friend/request', {
                phone
            });
            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('好友请求已发送');
                document.getElementById('search-phone').value = '';
            } else {
                Utils.showToast(result.msg || '发送失败');
            }
        } catch (e) {
            Utils.hideLoading();
            Utils.showToast('发送失败，请稍后重试');
        }
    },

    async acceptRequest(relationshipId) {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/ts/friend/accept', {
                relationship_id: relationshipId
            });
            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('已接受好友请求');
                await this.loadData();
            } else {
                Utils.showToast(result.msg || '操作失败');
            }
        } catch (e) {
            Utils.hideLoading();
            Utils.showToast('操作失败，请稍后重试');
        }
    },

    async rejectRequest(relationshipId) {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/ts/friend/reject', {
                relationship_id: relationshipId
            });
            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('已拒绝好友请求');
                await this.loadData();
            } else {
                Utils.showToast(result.msg || '操作失败');
            }
        } catch (e) {
            Utils.hideLoading();
            Utils.showToast('操作失败，请稍后重试');
        }
    },

    async removeFriend(friendId) {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/ts/friend/remove', {
                friend_id: friendId
            });
            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('已删除好友');
                await this.loadFriends();
            } else {
                Utils.showToast(result.msg || '操作失败');
            }
        } catch (e) {
            Utils.hideLoading();
            Utils.showToast('操作失败，请稍后重试');
        }
    }
};
