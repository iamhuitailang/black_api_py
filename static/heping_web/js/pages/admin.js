var AdminPage = {
    currentTab: 'dashboard',
    userPage: 1,
    userPageSize: 10,
    userKeyword: '',
    userStatus: null,
    weaponPage: 1,
    weaponPageSize: 10,
    weaponType: null,
    weaponRarity: null,
    mapPage: 1,
    mapPageSize: 10,

    render: function() {
        var app = document.getElementById('app');
        var adminName = '管理员';
        try {
            var info = Storage.get('heping_admin_info');
            if (info && info.username) adminName = info.username;
            if (info && info.name) adminName = info.name;
        } catch(e) {}

        app.innerHTML = '\
        <div style="display:flex;height:100vh;background:#0a0e17;color:#e0e6ed;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">\
            <div style="width:200px;min-width:200px;background:#0d1321;border-right:1px solid #1e2a3a;display:flex;flex-direction:column;">\
                <div style="padding:20px 16px;border-bottom:1px solid #1e2a3a;">\
                    <div style="display:flex;align-items:center;gap:10px;">\
                        <div style="width:36px;height:36px;background:linear-gradient(135deg,#00ff88,#00cc6a);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;color:#0a0e17;">&#x548C;</div>\
                        <div>\
                            <div style="font-size:14px;font-weight:600;color:#00ff88;">&#x548C;&#x5E73;&#x7CBE;&#x82F1;</div>\
                            <div style="font-size:11px;color:#6b7b8d;">&#x7BA1;&#x7406;&#x540E;&#x53F0;</div>\
                        </div>\
                    </div>\
                </div>\
                <nav style="flex:1;padding:12px 8px;" id="adminNav">\
                    <div class="admin-nav-item" data-tab="dashboard" style="padding:10px 12px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;margin-bottom:4px;font-size:13px;transition:all 0.2s;color:#6b7b8d;">\
                        <span style="font-size:16px;">&#x1F4CA;</span><span>&#x6570;&#x636E;&#x7EDF;&#x8BA1;</span>\
                    </div>\
                    <div class="admin-nav-item" data-tab="users" style="padding:10px 12px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;margin-bottom:4px;font-size:13px;transition:all 0.2s;color:#6b7b8d;">\
                        <span style="font-size:16px;">&#x1F465;</span><span>&#x7528;&#x6237;&#x7BA1;&#x7406;</span>\
                    </div>\
                    <div class="admin-nav-item" data-tab="weapons" style="padding:10px 12px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;margin-bottom:4px;font-size:13px;transition:all 0.2s;color:#6b7b8d;">\
                        <span style="font-size:16px;">&#x1F52B;</span><span>&#x6B66;&#x5668;&#x7BA1;&#x7406;</span>\
                    </div>\
                    <div class="admin-nav-item" data-tab="maps" style="padding:10px 12px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;margin-bottom:4px;font-size:13px;transition:all 0.2s;color:#6b7b8d;">\
                        <span style="font-size:16px;">&#x1F5FA;</span><span>&#x5730;&#x56FE;&#x7BA1;&#x7406;</span>\
                    </div>\
                </nav>\
                <div style="padding:12px 8px;border-top:1px solid #1e2a3a;">\
                    <div id="adminLogoutBtn" style="padding:10px 12px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:13px;color:#ff4757;transition:all 0.2s;">\
                        <span style="font-size:16px;">&#x1F6AA;</span><span>&#x9000;&#x51FA;&#x767B;&#x5F55;</span>\
                    </div>\
                </div>\
            </div>\
            <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">\
                <div style="height:56px;background:#0d1321;border-bottom:1px solid #1e2a3a;display:flex;align-items:center;justify-content:flex-end;padding:0 24px;gap:16px;">\
                    <span style="font-size:13px;color:#6b7b8d;">&#x6B22;&#x8FCE;&#x56DE;&#x6765;</span>\
                    <span style="font-size:13px;color:#00ff88;font-weight:500;">' + adminName + '</span>\
                </div>\
                <div id="adminContent" style="flex:1;overflow-y:auto;padding:24px;"></div>\
            </div>\
        </div>';

        this.bindGlobalEvents();
        this.switchTab(this.currentTab);
    },

    bindGlobalEvents: function() {
        var self = this;
        var navItems = document.querySelectorAll('.admin-nav-item');
        navItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var tab = this.getAttribute('data-tab');
                self.switchTab(tab);
            });
            item.addEventListener('mouseenter', function() {
                if (!this.classList.contains('active')) {
                    this.style.background = 'rgba(0,255,136,0.05)';
                    this.style.color = '#e0e6ed';
                }
            });
            item.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.background = 'transparent';
                    this.style.color = '#6b7b8d';
                }
            });
        });
        document.getElementById('adminLogoutBtn').addEventListener('click', function() {
            self.handleLogout();
        });
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        var navItems = document.querySelectorAll('.admin-nav-item');
        navItems.forEach(function(item) {
            var isActive = item.getAttribute('data-tab') === tab;
            item.classList.toggle('active', isActive);
            item.style.background = isActive ? 'rgba(0,255,136,0.1)' : 'transparent';
            item.style.color = isActive ? '#00ff88' : '#6b7b8d';
        });
        this.renderTabContent();
    },

    renderTabContent: function() {
        var content = document.getElementById('adminContent');
        switch (this.currentTab) {
            case 'dashboard': this.renderDashboard(content); break;
            case 'users': this.renderUsers(content); break;
            case 'weapons': this.renderWeapons(content); break;
            case 'maps': this.renderMaps(content); break;
        }
    },

    renderDashboard: function(container) {
        container.innerHTML = '\
        <div style="margin-bottom:24px;">\
            <h2 style="font-size:20px;font-weight:600;color:#e0e6ed;margin:0 0 4px;">&#x6570;&#x636E;&#x7EDF;&#x8BA1;</h2>\
            <p style="font-size:13px;color:#6b7b8d;margin:0;">&#x6E38;&#x620F;&#x8FD0;&#x8425;&#x6570;&#x636E;&#x6982;&#x89C8;</p>\
        </div>\
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">\
            <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:8px;padding:20px;">\
                <div style="font-size:12px;color:#6b7b8d;margin-bottom:8px;">&#x603B;&#x7528;&#x6237;&#x6570;</div>\
                <div style="font-size:28px;font-weight:700;color:#00ff88;" id="statTotalUsers">-</div>\
            </div>\
            <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:8px;padding:20px;">\
                <div style="font-size:12px;color:#6b7b8d;margin-bottom:8px;">&#x603B;&#x5BF9;&#x5C40;&#x6570;</div>\
                <div style="font-size:28px;font-weight:700;color:#3b82f6;" id="statTotalGames">-</div>\
            </div>\
            <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:8px;padding:20px;">\
                <div style="font-size:12px;color:#6b7b8d;margin-bottom:8px;">&#x603B;&#x51FB;&#x6740;&#x6570;</div>\
                <div style="font-size:28px;font-weight:700;color:#ff4757;" id="statTotalKills">-</div>\
            </div>\
            <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:8px;padding:20px;">\
                <div style="font-size:12px;color:#6b7b8d;margin-bottom:8px;">&#x5E73;&#x5747;&#x5B58;&#x6D3B;&#x65F6;&#x95F4;</div>\
                <div style="font-size:28px;font-weight:700;color:#ffa502;" id="statAvgSurvive">-</div>\
            </div>\
        </div>\
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">\
            <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:8px;padding:20px;">\
                <div style="font-size:14px;font-weight:500;color:#e0e6ed;margin-bottom:16px;">对局趋势（近7天）</div>\
                <div id="trendChart" style="height:200px;display:flex;align-items:flex-end;gap:6px;padding-top:20px;"></div>\
            </div>\
            <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:8px;padding:20px;">\
                <div style="font-size:14px;font-weight:500;color:#e0e6ed;margin-bottom:16px;">用户增长（近30天）</div>\
                <div id="growthChart" style="height:200px;display:flex;align-items:flex-end;gap:2px;padding-top:20px;"></div>\
            </div>\
        </div>';
        this.loadDashboardData();
    },

    loadDashboardData: function() {
        var self = this;
        ApiService.get('/heping/statistics/overview/get').then(function(result) {
            if (result.code === 0) {
                var d = result.data;
                document.getElementById('statTotalUsers').textContent = d.total_users || 0;
                document.getElementById('statTotalGames').textContent = d.total_games || 0;
                document.getElementById('statTotalKills').textContent = d.total_kills || 0;
                document.getElementById('statAvgSurvive').textContent = (d.avg_survive_time || 0) + 's';
            }
        }).catch(function() {
            Utils.showToast('加载统计数据失败', 'error');
        });
        ApiService.get('/heping/statistics/trend/get', { days: 7 }).then(function(result) {
            if (result.code === 0) {
                self.renderBarChart(result.data || [], 'trendChart', '#3b82f6');
            }
        }).catch(function() {});
        ApiService.get('/heping/statistics/user/growth/get', { days: 30 }).then(function(result) {
            if (result.code === 0) {
                self.renderBarChart(result.data || [], 'growthChart', '#00ff88');
            }
        }).catch(function() {});
    },

    renderBarChart: function(data, containerId, color) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:#6b7b8d;font-size:13px;">暂无数据</div>';
            return;
        }
        var maxVal = 1;
        data.forEach(function(d) { if ((d.count || 0) > maxVal) maxVal = d.count; });
        var html = '';
        data.forEach(function(item) {
            var h = Math.max(4, Math.round((item.count / maxVal) * 160));
            var label = item.date ? item.date.substring(5) : '';
            html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0;">\
                <div style="font-size:10px;color:#6b7b8d;margin-bottom:4px;">' + (item.count || 0) + '</div>\
                <div style="width:100%;max-width:32px;height:' + h + 'px;background:' + color + ';border-radius:3px 3px 0 0;opacity:0.8;"></div>\
                <div style="font-size:9px;color:#4a5568;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40px;text-align:center;">' + label + '</div>\
            </div>';
        });
        container.innerHTML = html;
    },

    renderUsers: function(container) {
        container.innerHTML = '\
        <div style="margin-bottom:24px;">\
            <h2 style="font-size:20px;font-weight:600;color:#e0e6ed;margin:0 0 4px;">&#x7528;&#x6237;&#x7BA1;&#x7406;</h2>\
            <p style="font-size:13px;color:#6b7b8d;margin:0;">&#x7BA1;&#x7406;&#x6E38;&#x620F;&#x7528;&#x6237;&#xFF0C;&#x53EF;&#x8FDB;&#x884C;&#x7981;&#x8A00;&#x3001;&#x5C01;&#x53F7;&#x7B49;&#x64CD;&#x4F5C;</p>\
        </div>\
        <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:8px;">\
            <div style="padding:16px;border-bottom:1px solid #1e2a3a;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">\
                <div style="display:flex;align-items:center;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;padding:0 12px;">\
                    <span style="color:#6b7b8d;font-size:14px;">&#x1F50D;</span>\
                    <input type="text" id="userKeyword" placeholder="&#x641C;&#x7D22;&#x7528;&#x6237;&#x540D;/&#x6635;&#x79F0;" value="' + this.userKeyword + '" style="background:transparent;border:none;outline:none;color:#e0e6ed;padding:8px;font-size:13px;width:160px;">\
                </div>\
                <select id="userStatusFilter" style="background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;cursor:pointer;">\
                    <option value="">&#x5168;&#x90E8;&#x72B6;&#x6001;</option>\
                    <option value="0"' + (this.userStatus === 0 ? ' selected' : '') + '>&#x6B63;&#x5E38;</option>\
                    <option value="1"' + (this.userStatus === 1 ? ' selected' : '') + '>&#x7981;&#x8A00;</option>\
                    <option value="2"' + (this.userStatus === 2 ? ' selected' : '') + '>&#x5C01;&#x53F7;</option>\
                </select>\
                <button id="userSearchBtn" style="background:#00ff88;color:#0a0e17;border:none;border-radius:6px;padding:8px 16px;font-size:13px;font-weight:500;cursor:pointer;">&#x641C;&#x7D22;</button>\
            </div>\
            <div style="overflow-x:auto;">\
                <table style="width:100%;border-collapse:collapse;font-size:13px;">\
                    <thead><tr style="border-bottom:1px solid #1e2a3a;">\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">ID</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x7528;&#x6237;&#x540D;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x6635;&#x79F0;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x7B49;&#x7EA7;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x51FB;&#x6740;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x80DC;&#x573A;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x72B6;&#x6001;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x64CD;&#x4F5C;</th>\
                    </tr></thead>\
                    <tbody id="userTableBody"><tr><td colspan="8" style="padding:40px;text-align:center;color:#6b7b8d;">&#x52A0;&#x8F7D;&#x4E2D;...</td></tr></tbody>\
                </table>\
            </div>\
            <div id="userPagination" style="padding:16px;border-top:1px solid #1e2a3a;display:flex;align-items:center;justify-content:flex-end;gap:8px;"></div>\
        </div>';
        this.bindUserEvents();
        this.loadUsers();
    },

    bindUserEvents: function() {
        var self = this;
        document.getElementById('userSearchBtn').addEventListener('click', function() {
            self.userPage = 1;
            self.userKeyword = document.getElementById('userKeyword').value.trim();
            var sv = document.getElementById('userStatusFilter').value;
            self.userStatus = sv !== '' ? parseInt(sv) : null;
            self.loadUsers();
        });
        document.getElementById('userKeyword').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') document.getElementById('userSearchBtn').click();
        });
    },

    loadUsers: function() {
        var self = this;
        var params = { page: this.userPage, page_size: this.userPageSize };
        if (this.userKeyword) params.keyword = this.userKeyword;
        if (this.userStatus !== null && this.userStatus !== '') params.status = this.userStatus;
        ApiService.get('/heping/admin/user/list/get', params).then(function(result) {
            var tbody = document.getElementById('userTableBody');
            if (!tbody) return;
            if (result.code === 0 && result.data.items && result.data.items.length > 0) {
                tbody.innerHTML = result.data.items.map(function(u) {
                    var statusBadge = self.getUserStatusBadge(u.status);
                    var actions = '';
                    if (u.status === 0) {
                        actions += '<button onclick="AdminPage.muteUser(' + u.id + ')" style="background:rgba(255,165,2,0.15);color:#ffa502;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;margin-right:6px;">&#x7981;&#x8A00;</button>';
                        actions += '<button onclick="AdminPage.banUser(' + u.id + ')" style="background:rgba(255,71,87,0.15);color:#ff4757;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;margin-right:6px;">&#x5C01;&#x53F7;</button>';
                    } else {
                        actions += '<button onclick="AdminPage.unbanUser(' + u.id + ')" style="background:rgba(0,255,136,0.15);color:#00ff88;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;margin-right:6px;">&#x89E3;&#x5C01;</button>';
                    }
                    actions += '<button onclick="AdminPage.deleteUser(' + u.id + ')" style="background:rgba(255,71,87,0.15);color:#ff4757;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;">&#x5220;&#x9664;</button>';
                    return '<tr style="border-bottom:1px solid #1e2a3a;">\
                        <td style="padding:12px 16px;color:#6b7b8d;">' + u.id + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;">' + u.username + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;">' + (u.nickname || '-') + '</td>\
                        <td style="padding:12px 16px;color:#ffa502;">Lv.' + u.level + '</td>\
                        <td style="padding:12px 16px;color:#ff4757;">' + u.kills + '</td>\
                        <td style="padding:12px 16px;color:#00ff88;">' + u.wins + '</td>\
                        <td style="padding:12px 16px;">' + statusBadge + '</td>\
                        <td style="padding:12px 16px;">' + actions + '</td>\
                    </tr>';
                }).join('');
                self.renderUserPagination(result.data);
            } else {
                tbody.innerHTML = '<tr><td colspan="8" style="padding:40px;text-align:center;color:#6b7b8d;">暂无数据</td></tr>';
                document.getElementById('userPagination').innerHTML = '';
            }
        }).catch(function() {
            var tbody = document.getElementById('userTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="padding:40px;text-align:center;color:#ff4757;">加载失败</td></tr>';
        });
    },

    getUserStatusBadge: function(status) {
        var map = {
            0: { text: '正常', bg: 'rgba(0,255,136,0.15)', color: '#00ff88' },
            1: { text: '禁言', bg: 'rgba(255,165,2,0.15)', color: '#ffa502' },
            2: { text: '封号', bg: 'rgba(255,71,87,0.15)', color: '#ff4757' }
        };
        var s = map[status] || { text: '未知', bg: 'rgba(107,123,141,0.15)', color: '#6b7b8d' };
        return '<span style="background:' + s.bg + ';color:' + s.color + ';padding:3px 8px;border-radius:4px;font-size:12px;">' + s.text + '</span>';
    },

    renderUserPagination: function(data) {
        var total = data.total, page = data.page, totalPages = data.total_pages;
        var container = document.getElementById('userPagination');
        if (!container || totalPages <= 1) { if (container) container.innerHTML = ''; return; }
        container.innerHTML = this._buildPagination(total, page, totalPages, 'AdminPage.goToUserPage');
    },

    goToUserPage: function(page) { this.userPage = page; this.loadUsers(); },

    muteUser: function(userId) {
        if (!confirm('确定要禁言该用户吗？')) return;
        var self = this;
        ApiService.post('/heping/admin/user/status/update', { user_id: userId, status: 1 }).then(function(result) {
            if (result.code === 0) { Utils.showToast('禁言成功', 'success'); self.loadUsers(); }
            else { Utils.showToast(result.msg || '操作失败', 'error'); }
        }).catch(function() { Utils.showToast('操作失败', 'error'); });
    },

    banUser: function(userId) {
        if (!confirm('确定要封号该用户吗？该操作会禁止用户登录。')) return;
        var self = this;
        ApiService.post('/heping/admin/user/status/update', { user_id: userId, status: 2 }).then(function(result) {
            if (result.code === 0) { Utils.showToast('封号成功', 'success'); self.loadUsers(); }
            else { Utils.showToast(result.msg || '操作失败', 'error'); }
        }).catch(function() { Utils.showToast('操作失败', 'error'); });
    },

    unbanUser: function(userId) {
        if (!confirm('确定要解封该用户吗？')) return;
        var self = this;
        ApiService.post('/heping/admin/user/status/update', { user_id: userId, status: 0 }).then(function(result) {
            if (result.code === 0) { Utils.showToast('解封成功', 'success'); self.loadUsers(); }
            else { Utils.showToast(result.msg || '操作失败', 'error'); }
        }).catch(function() { Utils.showToast('操作失败', 'error'); });
    },

    deleteUser: function(userId) {
        if (!confirm('确定要删除该用户吗？此操作不可恢复！')) return;
        var self = this;
        ApiService.post('/heping/admin/user/delete', { user_id: userId }).then(function(result) {
            if (result.code === 0) { Utils.showToast('删除成功', 'success'); self.loadUsers(); }
            else { Utils.showToast(result.msg || '删除失败', 'error'); }
        }).catch(function() { Utils.showToast('删除失败', 'error'); });
    },

    renderWeapons: function(container) {
        container.innerHTML = '\
        <div style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">\
            <div>\
                <h2 style="font-size:20px;font-weight:600;color:#e0e6ed;margin:0 0 4px;">&#x6B66;&#x5668;&#x7BA1;&#x7406;</h2>\
                <p style="font-size:13px;color:#6b7b8d;margin:0;">&#x7BA1;&#x7406;&#x6E38;&#x620F;&#x6B66;&#x5668;&#x6570;&#x636E;</p>\
            </div>\
            <button id="addWeaponBtn" style="background:#00ff88;color:#0a0e17;border:none;border-radius:6px;padding:8px 20px;font-size:13px;font-weight:500;cursor:pointer;">+ &#x6DFB;&#x52A0;&#x6B66;&#x5668;</button>\
        </div>\
        <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:8px;">\
            <div style="padding:16px;border-bottom:1px solid #1e2a3a;display:flex;align-items:center;gap:12px;">\
                <select id="weaponTypeFilter" style="background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;cursor:pointer;">\
                    <option value="">&#x5168;&#x90E8;&#x7C7B;&#x578B;</option>\
                    <option value="pistol"' + (this.weaponType === 'pistol' ? ' selected' : '') + '>&#x624B;&#x67AA;</option>\
                    <option value="rifle"' + (this.weaponType === 'rifle' ? ' selected' : '') + '>&#x6B65;&#x67AA;</option>\
                    <option value="sniper"' + (this.weaponType === 'sniper' ? ' selected' : '') + '>&#x72D9;&#x51FB;&#x67AA;</option>\
                    <option value="shotgun"' + (this.weaponType === 'shotgun' ? ' selected' : '') + '>&#x970D;&#x5F39;&#x67AA;</option>\
                    <option value="smg"' + (this.weaponType === 'smg' ? ' selected' : '') + '>&#x51B2;&#x950B;&#x67AA;</option>\
                </select>\
                <select id="weaponRarityFilter" style="background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;cursor:pointer;">\
                    <option value="">&#x5168;&#x90E8;&#x7A00;&#x6709;&#x5EA6;</option>\
                    <option value="common"' + (this.weaponRarity === 'common' ? ' selected' : '') + '>&#x666E;&#x901A;</option>\
                    <option value="uncommon"' + (this.weaponRarity === 'uncommon' ? ' selected' : '') + '>&#x4F18;&#x79C0;</option>\
                    <option value="rare"' + (this.weaponRarity === 'rare' ? ' selected' : '') + '>&#x7A00;&#x6709;</option>\
                    <option value="epic"' + (this.weaponRarity === 'epic' ? ' selected' : '') + '>&#x53F2;&#x8BD7;</option>\
                    <option value="legendary"' + (this.weaponRarity === 'legendary' ? ' selected' : '') + '>&#x4F20;&#x8BF4;</option>\
                </select>\
                <button id="weaponFilterBtn" style="background:#141b2d;border:1px solid #1e2a3a;color:#e0e6ed;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;">&#x7B5B;&#x9009;</button>\
            </div>\
            <div style="overflow-x:auto;">\
                <table style="width:100%;border-collapse:collapse;font-size:13px;">\
                    <thead><tr style="border-bottom:1px solid #1e2a3a;">\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">ID</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x540D;&#x79F0;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x7C7B;&#x578B;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x4F24;&#x5BB3;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x5C04;&#x901F;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x5C04;&#x7A0B;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x7CBE;&#x51C6;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x5F39;&#x5939;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x7A00;&#x6709;&#x5EA6;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x72B6;&#x6001;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x64CD;&#x4F5C;</th>\
                    </tr></thead>\
                    <tbody id="weaponTableBody"><tr><td colspan="11" style="padding:40px;text-align:center;color:#6b7b8d;">&#x52A0;&#x8F7D;&#x4E2D;...</td></tr></tbody>\
                </table>\
            </div>\
            <div id="weaponPagination" style="padding:16px;border-top:1px solid #1e2a3a;display:flex;align-items:center;justify-content:flex-end;gap:8px;"></div>\
        </div>\
        <div id="weaponModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;">\
            <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:12px;width:520px;max-height:80vh;overflow-y:auto;">\
                <div style="padding:20px 24px;border-bottom:1px solid #1e2a3a;display:flex;justify-content:space-between;align-items:center;">\
                    <h3 id="weaponModalTitle" style="font-size:16px;font-weight:500;color:#e0e6ed;margin:0;">&#x6DFB;&#x52A0;&#x6B66;&#x5668;</h3>\
                    <button onclick="AdminPage.closeWeaponModal()" style="background:none;border:none;color:#6b7b8d;font-size:20px;cursor:pointer;">&times;</button>\
                </div>\
                <form id="weaponForm" style="padding:24px;">\
                    <input type="hidden" id="editWeaponId">\
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x6B66;&#x5668;&#x540D;&#x79F0; *</label>\
                            <input type="text" id="weaponName" required style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x6B66;&#x5668;&#x7C7B;&#x578B; *</label>\
                            <select id="weaponType" required style="width:100%;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;">\
                                <option value="pistol">&#x624B;&#x67AA;</option><option value="rifle">&#x6B65;&#x67AA;</option><option value="sniper">&#x72D9;&#x51FB;&#x67AA;</option><option value="shotgun">&#x970D;&#x5F39;&#x67AA;</option><option value="smg">&#x51B2;&#x950B;&#x67AA;</option>\
                            </select></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x4F24;&#x5BB3;&#x503C; *</label>\
                            <input type="number" step="0.1" id="weaponDamage" required style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x5C04;&#x901F; *</label>\
                            <input type="number" step="0.1" id="weaponFireRate" required style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x5C04;&#x7A0B; *</label>\
                            <input type="number" step="0.1" id="weaponRange" required style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x7CBE;&#x51C6;&#x5EA6; *</label>\
                            <input type="number" step="0.1" id="weaponAccuracy" required style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x5F39;&#x5939;&#x5BB9;&#x91CF; *</label>\
                            <input type="number" id="weaponAmmo" required style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x7A00;&#x6709;&#x5EA6; *</label>\
                            <select id="weaponRarity" required style="width:100%;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;">\
                                <option value="common">&#x666E;&#x901A;</option><option value="uncommon">&#x4F18;&#x79C0;</option><option value="rare">&#x7A00;&#x6709;</option><option value="epic">&#x53F2;&#x8BD7;</option><option value="legendary">&#x4F20;&#x8BF4;</option>\
                            </select></div>\
                    </div>\
                    <div style="margin-top:16px;"><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x6B66;&#x5668;&#x63CF;&#x8FF0;</label>\
                        <textarea id="weaponDescription" rows="3" style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;resize:vertical;"></textarea></div>\
                    <div style="margin-top:16px;"><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x56FE;&#x6807;URL</label>\
                        <input type="text" id="weaponIcon" placeholder="&#x56FE;&#x6807;URL&#xFF08;&#x53EF;&#x9009;&#xFF09;" style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                    <div style="margin-top:24px;display:flex;justify-content:flex-end;gap:12px;">\
                        <button type="button" onclick="AdminPage.closeWeaponModal()" style="background:#1e2a3a;color:#e0e6ed;border:none;border-radius:6px;padding:8px 20px;font-size:13px;cursor:pointer;">&#x53D6;&#x6D88;</button>\
                        <button type="submit" id="saveWeaponBtn" style="background:#00ff88;color:#0a0e17;border:none;border-radius:6px;padding:8px 20px;font-size:13px;font-weight:500;cursor:pointer;">&#x4FDD;&#x5B58;</button>\
                    </div>\
                </form>\
            </div>\
        </div>';
        this.bindWeaponEvents();
        this.loadWeapons();
    },

    bindWeaponEvents: function() {
        var self = this;
        document.getElementById('addWeaponBtn').addEventListener('click', function() { self.showWeaponModal(); });
        document.getElementById('weaponFilterBtn').addEventListener('click', function() {
            self.weaponPage = 1;
            self.weaponType = document.getElementById('weaponTypeFilter').value || null;
            self.weaponRarity = document.getElementById('weaponRarityFilter').value || null;
            self.loadWeapons();
        });
        document.getElementById('weaponForm').addEventListener('submit', function(e) { e.preventDefault(); self.saveWeapon(); });
        var modal = document.getElementById('weaponModal');
        modal.addEventListener('click', function(e) { if (e.target === modal) self.closeWeaponModal(); });
    },

    loadWeapons: function() {
        var self = this;
        var params = { page: this.weaponPage, page_size: this.weaponPageSize };
        if (this.weaponType) params.type = this.weaponType;
        if (this.weaponRarity) params.rarity = this.weaponRarity;
        ApiService.get('/heping/weapon/list/get', params).then(function(result) {
            var tbody = document.getElementById('weaponTableBody');
            if (!tbody) return;
            if (result.code === 0 && result.data.items && result.data.items.length > 0) {
                tbody.innerHTML = result.data.items.map(function(w) {
                    var rarityBadge = self.getRarityBadge(w.rarity);
                    var typeText = self.getWeaponTypeText(w.type);
                    var statusBadge = w.status === 0
                        ? '<span style="background:rgba(0,255,136,0.15);color:#00ff88;padding:3px 8px;border-radius:4px;font-size:12px;">启用</span>'
                        : '<span style="background:rgba(107,123,141,0.15);color:#6b7b8d;padding:3px 8px;border-radius:4px;font-size:12px;">禁用</span>';
                    return '<tr style="border-bottom:1px solid #1e2a3a;">\
                        <td style="padding:12px 16px;color:#6b7b8d;">' + w.id + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;font-weight:500;">' + w.name + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;">' + typeText + '</td>\
                        <td style="padding:12px 16px;color:#ff4757;">' + w.damage + '</td>\
                        <td style="padding:12px 16px;color:#3b82f6;">' + w.fire_rate + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;">' + w.range + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;">' + w.accuracy + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;">' + w.ammo_capacity + '</td>\
                        <td style="padding:12px 16px;">' + rarityBadge + '</td>\
                        <td style="padding:12px 16px;">' + statusBadge + '</td>\
                        <td style="padding:12px 16px;">\
                            <button onclick="AdminPage.showWeaponModal(' + w.id + ')" style="background:rgba(59,130,246,0.15);color:#3b82f6;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;margin-right:6px;">编辑</button>\
                            <button onclick="AdminPage.deleteWeapon(' + w.id + ')" style="background:rgba(255,71,87,0.15);color:#ff4757;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;">删除</button>\
                        </td></tr>';
                }).join('');
                self.renderWeaponPagination(result.data);
            } else {
                tbody.innerHTML = '<tr><td colspan="11" style="padding:40px;text-align:center;color:#6b7b8d;">暂无数据</td></tr>';
                document.getElementById('weaponPagination').innerHTML = '';
            }
        }).catch(function() {
            var tbody = document.getElementById('weaponTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="11" style="padding:40px;text-align:center;color:#ff4757;">加载失败</td></tr>';
        });
    },

    getWeaponTypeText: function(type) {
        var map = { pistol: '手枪', rifle: '步枪', sniper: '狙击枪', shotgun: '霰弹枪', smg: '冲锋枪' };
        return map[type] || type;
    },

    getRarityBadge: function(rarity) {
        var map = {
            common: { text: '普通', color: '#9ca3af' },
            uncommon: { text: '优秀', color: '#22c55e' },
            rare: { text: '稀有', color: '#3b82f6' },
            epic: { text: '史诗', color: '#a855f7' },
            legendary: { text: '传说', color: '#f59e0b' }
        };
        var r = map[rarity] || { text: rarity, color: '#6b7b8d' };
        return '<span style="color:' + r.color + ';font-size:12px;font-weight:500;">' + r.text + '</span>';
    },

    renderWeaponPagination: function(data) {
        var container = document.getElementById('weaponPagination');
        if (!container || data.total_pages <= 1) { if (container) container.innerHTML = ''; return; }
        container.innerHTML = this._buildPagination(data.total, data.page, data.total_pages, 'AdminPage.goToWeaponPage');
    },

    goToWeaponPage: function(page) { this.weaponPage = page; this.loadWeapons(); },

    showWeaponModal: function(weaponId) {
        var modal = document.getElementById('weaponModal');
        document.getElementById('editWeaponId').value = '';
        document.getElementById('weaponForm').reset();
        if (weaponId) {
            document.getElementById('weaponModalTitle').textContent = '编辑武器';
            this.loadWeaponDetail(weaponId);
        } else {
            document.getElementById('weaponModalTitle').textContent = '添加武器';
        }
        modal.style.display = 'flex';
    },

    loadWeaponDetail: function(weaponId) {
        var self = this;
        ApiService.get('/heping/weapon/list/get', { page: 1, page_size: 100 }).then(function(result) {
            if (result.code === 0 && result.data.items) {
                var weapon = result.data.items.find(function(w) { return w.id === weaponId; });
                if (weapon) self.fillWeaponForm(weapon);
            }
        }).catch(function() {});
    },

    fillWeaponForm: function(w) {
        document.getElementById('editWeaponId').value = w.id;
        document.getElementById('weaponName').value = w.name || '';
        document.getElementById('weaponType').value = w.type || 'pistol';
        document.getElementById('weaponDamage').value = w.damage || 0;
        document.getElementById('weaponFireRate').value = w.fire_rate || 0;
        document.getElementById('weaponRange').value = w.range || 0;
        document.getElementById('weaponAccuracy').value = w.accuracy || 0;
        document.getElementById('weaponAmmo').value = w.ammo_capacity || 0;
        document.getElementById('weaponRarity').value = w.rarity || 'common';
        document.getElementById('weaponDescription').value = w.description || '';
        document.getElementById('weaponIcon').value = w.icon || '';
    },

    closeWeaponModal: function() {
        document.getElementById('weaponModal').style.display = 'none';
    },

    saveWeapon: function() {
        var self = this;
        var editId = document.getElementById('editWeaponId').value;
        var data = {
            name: document.getElementById('weaponName').value.trim(),
            type: document.getElementById('weaponType').value,
            damage: parseFloat(document.getElementById('weaponDamage').value) || 0,
            fire_rate: parseFloat(document.getElementById('weaponFireRate').value) || 0,
            range: parseFloat(document.getElementById('weaponRange').value) || 0,
            accuracy: parseFloat(document.getElementById('weaponAccuracy').value) || 0,
            ammo_capacity: parseInt(document.getElementById('weaponAmmo').value) || 0,
            rarity: document.getElementById('weaponRarity').value,
            description: document.getElementById('weaponDescription').value.trim(),
            icon: document.getElementById('weaponIcon').value.trim()
        };
        if (!data.name) { Utils.showToast('武器名称不能为空', 'error'); return; }
        var saveBtn = document.getElementById('saveWeaponBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';
        var promise = editId
            ? ApiService.post('/heping/weapon/update', Object.assign({ weapon_id: parseInt(editId) }, data))
            : ApiService.post('/heping/weapon/create', data);
        promise.then(function(result) {
            if (result.code === 0) {
                Utils.showToast(editId ? '更新成功' : '创建成功', 'success');
                self.closeWeaponModal();
                self.loadWeapons();
            } else {
                Utils.showToast(result.msg || '操作失败', 'error');
            }
        }).catch(function() { Utils.showToast('操作失败', 'error'); })
        .finally(function() { saveBtn.disabled = false; saveBtn.textContent = '保存'; });
    },

    deleteWeapon: function(weaponId) {
        if (!confirm('确定要删除该武器吗？')) return;
        var self = this;
        ApiService.post('/heping/weapon/delete', { weapon_id: weaponId }).then(function(result) {
            if (result.code === 0) { Utils.showToast('删除成功', 'success'); self.loadWeapons(); }
            else { Utils.showToast(result.msg || '删除失败', 'error'); }
        }).catch(function() { Utils.showToast('删除失败', 'error'); });
    },

    renderMaps: function(container) {
        container.innerHTML = '\
        <div style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">\
            <div>\
                <h2 style="font-size:20px;font-weight:600;color:#e0e6ed;margin:0 0 4px;">&#x5730;&#x56FE;&#x7BA1;&#x7406;</h2>\
                <p style="font-size:13px;color:#6b7b8d;margin:0;">&#x7BA1;&#x7406;&#x6E38;&#x620F;&#x5730;&#x56FE;&#x6570;&#x636E;</p>\
            </div>\
            <button id="addMapBtn" style="background:#00ff88;color:#0a0e17;border:none;border-radius:6px;padding:8px 20px;font-size:13px;font-weight:500;cursor:pointer;">+ &#x6DFB;&#x52A0;&#x5730;&#x56FE;</button>\
        </div>\
        <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:8px;">\
            <div style="overflow-x:auto;">\
                <table style="width:100%;border-collapse:collapse;font-size:13px;">\
                    <thead><tr style="border-bottom:1px solid #1e2a3a;">\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">ID</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x540D;&#x79F0;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x5BBD;&#x5EA6;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x9AD8;&#x5EA6;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x5730;&#x5F62;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x6700;&#x5927;&#x73A9;&#x5BB6;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x7F29;&#x5708;&#x901F;&#x5EA6;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x72B6;&#x6001;</th>\
                        <th style="padding:12px 16px;text-align:left;color:#6b7b8d;font-weight:500;">&#x64CD;&#x4F5C;</th>\
                    </tr></thead>\
                    <tbody id="mapTableBody"><tr><td colspan="9" style="padding:40px;text-align:center;color:#6b7b8d;">&#x52A0;&#x8F7D;&#x4E2D;...</td></tr></tbody>\
                </table>\
            </div>\
            <div id="mapPagination" style="padding:16px;border-top:1px solid #1e2a3a;display:flex;align-items:center;justify-content:flex-end;gap:8px;"></div>\
        </div>\
        <div id="mapModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;">\
            <div style="background:#141b2d;border:1px solid #1e2a3a;border-radius:12px;width:520px;max-height:80vh;overflow-y:auto;">\
                <div style="padding:20px 24px;border-bottom:1px solid #1e2a3a;display:flex;justify-content:space-between;align-items:center;">\
                    <h3 id="mapModalTitle" style="font-size:16px;font-weight:500;color:#e0e6ed;margin:0;">&#x6DFB;&#x52A0;&#x5730;&#x56FE;</h3>\
                    <button onclick="AdminPage.closeMapModal()" style="background:none;border:none;color:#6b7b8d;font-size:20px;cursor:pointer;">&times;</button>\
                </div>\
                <form id="mapForm" style="padding:24px;">\
                    <input type="hidden" id="editMapId">\
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x5730;&#x56FE;&#x540D;&#x79F0; *</label>\
                            <input type="text" id="mapName" required style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x5730;&#x5F62;&#x7C7B;&#x578B; *</label>\
                            <select id="mapTerrainType" required style="width:100%;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;">\
                                <option value="forest">&#x68EE;&#x6797;</option><option value="desert">&#x6C99;&#x6F20;</option><option value="city">&#x57CE;&#x5E02;</option><option value="island">&#x6D77;&#x5C9B;</option>\
                            </select></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x5730;&#x56FE;&#x5BBD;&#x5EA6; *</label>\
                            <input type="number" id="mapWidth" value="8000" required style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x5730;&#x56FE;&#x9AD8;&#x5EA6; *</label>\
                            <input type="number" id="mapHeight" value="8000" required style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x6700;&#x5927;&#x73A9;&#x5BB6;&#x6570;</label>\
                            <input type="number" id="mapMaxPlayers" value="100" style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                        <div><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x7F29;&#x5708;&#x901F;&#x5EA6;</label>\
                            <input type="number" step="0.1" id="mapSafeZoneSpeed" value="1.0" style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                    </div>\
                    <div style="margin-top:16px;"><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x5730;&#x56FE;&#x63CF;&#x8FF0;</label>\
                        <textarea id="mapDescription" rows="3" style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;resize:vertical;"></textarea></div>\
                    <div style="margin-top:16px;"><label style="display:block;font-size:12px;color:#6b7b8d;margin-bottom:6px;">&#x7F29;&#x7565;&#x56FE;URL</label>\
                        <input type="text" id="mapThumbnail" placeholder="&#x7F29;&#x7565;&#x56FE;URL&#xFF08;&#x53EF;&#x9009;&#xFF09;" style="width:100%;box-sizing:border-box;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#e0e6ed;padding:8px 12px;font-size:13px;outline:none;"></div>\
                    <div style="margin-top:24px;display:flex;justify-content:flex-end;gap:12px;">\
                        <button type="button" onclick="AdminPage.closeMapModal()" style="background:#1e2a3a;color:#e0e6ed;border:none;border-radius:6px;padding:8px 20px;font-size:13px;cursor:pointer;">&#x53D6;&#x6D88;</button>\
                        <button type="submit" id="saveMapBtn" style="background:#00ff88;color:#0a0e17;border:none;border-radius:6px;padding:8px 20px;font-size:13px;font-weight:500;cursor:pointer;">&#x4FDD;&#x5B58;</button>\
                    </div>\
                </form>\
            </div>\
        </div>';
        this.bindMapEvents();
        this.loadMaps();
    },

    bindMapEvents: function() {
        var self = this;
        document.getElementById('addMapBtn').addEventListener('click', function() { self.showMapModal(); });
        document.getElementById('mapForm').addEventListener('submit', function(e) { e.preventDefault(); self.saveMap(); });
        var modal = document.getElementById('mapModal');
        modal.addEventListener('click', function(e) { if (e.target === modal) self.closeMapModal(); });
    },

    loadMaps: function() {
        var self = this;
        ApiService.get('/heping/map/list/get', { page: this.mapPage, page_size: this.mapPageSize }).then(function(result) {
            var tbody = document.getElementById('mapTableBody');
            if (!tbody) return;
            if (result.code === 0 && result.data.items && result.data.items.length > 0) {
                tbody.innerHTML = result.data.items.map(function(m) {
                    var terrainText = self.getTerrainText(m.terrain_type);
                    var statusBadge = m.status === 0
                        ? '<span style="background:rgba(0,255,136,0.15);color:#00ff88;padding:3px 8px;border-radius:4px;font-size:12px;">启用</span>'
                        : '<span style="background:rgba(107,123,141,0.15);color:#6b7b8d;padding:3px 8px;border-radius:4px;font-size:12px;">禁用</span>';
                    return '<tr style="border-bottom:1px solid #1e2a3a;">\
                        <td style="padding:12px 16px;color:#6b7b8d;">' + m.id + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;font-weight:500;">' + m.name + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;">' + m.width + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;">' + m.height + '</td>\
                        <td style="padding:12px 16px;color:#3b82f6;">' + terrainText + '</td>\
                        <td style="padding:12px 16px;color:#e0e6ed;">' + (m.max_players || '-') + '</td>\
                        <td style="padding:12px 16px;color:#ffa502;">' + (m.safe_zone_speed || '-') + '</td>\
                        <td style="padding:12px 16px;">' + statusBadge + '</td>\
                        <td style="padding:12px 16px;">\
                            <button onclick="AdminPage.showMapModal(' + m.id + ')" style="background:rgba(59,130,246,0.15);color:#3b82f6;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;margin-right:6px;">编辑</button>\
                            <button onclick="AdminPage.deleteMap(' + m.id + ')" style="background:rgba(255,71,87,0.15);color:#ff4757;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;">删除</button>\
                        </td></tr>';
                }).join('');
                self.renderMapPagination(result.data);
            } else {
                tbody.innerHTML = '<tr><td colspan="9" style="padding:40px;text-align:center;color:#6b7b8d;">暂无数据</td></tr>';
                document.getElementById('mapPagination').innerHTML = '';
            }
        }).catch(function() {
            var tbody = document.getElementById('mapTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="padding:40px;text-align:center;color:#ff4757;">加载失败</td></tr>';
        });
    },

    getTerrainText: function(terrain) {
        var map = { forest: '森林', desert: '沙漠', city: '城市', island: '海岛' };
        return map[terrain] || terrain;
    },

    renderMapPagination: function(data) {
        var container = document.getElementById('mapPagination');
        if (!container || data.total_pages <= 1) { if (container) container.innerHTML = ''; return; }
        container.innerHTML = this._buildPagination(data.total, data.page, data.total_pages, 'AdminPage.goToMapPage');
    },

    goToMapPage: function(page) { this.mapPage = page; this.loadMaps(); },

    showMapModal: function(mapId) {
        var modal = document.getElementById('mapModal');
        document.getElementById('editMapId').value = '';
        document.getElementById('mapForm').reset();
        if (mapId) {
            document.getElementById('mapModalTitle').textContent = '编辑地图';
            this.loadMapDetail(mapId);
        } else {
            document.getElementById('mapModalTitle').textContent = '添加地图';
            document.getElementById('mapWidth').value = 8000;
            document.getElementById('mapHeight').value = 8000;
            document.getElementById('mapMaxPlayers').value = 100;
            document.getElementById('mapSafeZoneSpeed').value = '1.0';
        }
        modal.style.display = 'flex';
    },

    loadMapDetail: function(mapId) {
        var self = this;
        ApiService.get('/heping/map/list/get', { page: 1, page_size: 100 }).then(function(result) {
            if (result.code === 0 && result.data.items) {
                var mapData = result.data.items.find(function(m) { return m.id === mapId; });
                if (mapData) self.fillMapForm(mapData);
            }
        }).catch(function() {});
    },

    fillMapForm: function(m) {
        document.getElementById('editMapId').value = m.id;
        document.getElementById('mapName').value = m.name || '';
        document.getElementById('mapTerrainType').value = m.terrain_type || 'forest';
        document.getElementById('mapWidth').value = m.width || 8000;
        document.getElementById('mapHeight').value = m.height || 8000;
        document.getElementById('mapMaxPlayers').value = m.max_players || 100;
        document.getElementById('mapSafeZoneSpeed').value = m.safe_zone_speed || '1.0';
        document.getElementById('mapDescription').value = m.description || '';
        document.getElementById('mapThumbnail').value = m.thumbnail || '';
    },

    closeMapModal: function() {
        document.getElementById('mapModal').style.display = 'none';
    },

    saveMap: function() {
        var self = this;
        var editId = document.getElementById('editMapId').value;
        var data = {
            name: document.getElementById('mapName').value.trim(),
            terrain_type: document.getElementById('mapTerrainType').value,
            width: parseInt(document.getElementById('mapWidth').value) || 8000,
            height: parseInt(document.getElementById('mapHeight').value) || 8000,
            max_players: parseInt(document.getElementById('mapMaxPlayers').value) || 100,
            safe_zone_speed: parseFloat(document.getElementById('mapSafeZoneSpeed').value) || 1.0,
            description: document.getElementById('mapDescription').value.trim(),
            thumbnail: document.getElementById('mapThumbnail').value.trim()
        };
        if (!data.name) { Utils.showToast('地图名称不能为空', 'error'); return; }
        var saveBtn = document.getElementById('saveMapBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';
        var promise = editId
            ? ApiService.post('/heping/map/update', Object.assign({ map_id: parseInt(editId) }, data))
            : ApiService.post('/heping/map/create', data);
        promise.then(function(result) {
            if (result.code === 0) {
                Utils.showToast(editId ? '更新成功' : '创建成功', 'success');
                self.closeMapModal();
                self.loadMaps();
            } else {
                Utils.showToast(result.msg || '操作失败', 'error');
            }
        }).catch(function() { Utils.showToast('操作失败', 'error'); })
        .finally(function() { saveBtn.disabled = false; saveBtn.textContent = '保存'; });
    },

    deleteMap: function(mapId) {
        if (!confirm('确定要删除该地图吗？')) return;
        var self = this;
        ApiService.post('/heping/map/delete', { map_id: mapId }).then(function(result) {
            if (result.code === 0) { Utils.showToast('删除成功', 'success'); self.loadMaps(); }
            else { Utils.showToast(result.msg || '删除失败', 'error'); }
        }).catch(function() { Utils.showToast('删除失败', 'error'); });
    },

    _buildPagination: function(total, page, totalPages, callbackName) {
        var html = '<span style="font-size:12px;color:#6b7b8d;margin-right:8px;">共 ' + total + ' 条</span>';
        html += '<button onclick="' + callbackName + '(' + (page - 1) + ')" style="background:#141b2d;border:1px solid #1e2a3a;color:#e0e6ed;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;"' + (page === 1 ? ' disabled' : '') + '>上一页</button>';
        var start = Math.max(1, page - 2);
        var end = Math.min(totalPages, page + 2);
        for (var i = start; i <= end; i++) {
            var isActive = i === page;
            html += '<button onclick="' + callbackName + '(' + i + ')" style="background:' + (isActive ? '#00ff88' : '#141b2d') + ';border:1px solid ' + (isActive ? '#00ff88' : '#1e2a3a') + ';color:' + (isActive ? '#0a0e17' : '#e0e6ed') + ';border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;">' + i + '</button>';
        }
        html += '<button onclick="' + callbackName + '(' + (page + 1) + ')" style="background:#141b2d;border:1px solid #1e2a3a;color:#e0e6ed;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;"' + (page === totalPages ? ' disabled' : '') + '>下一页</button>';
        return html;
    },

    handleLogout: function() {
        if (!confirm('确定要退出登录吗？')) return;
        if (AuthService && AuthService.adminLogout) {
            AuthService.adminLogout().then(function() {
                if (Router) Router.navigate('login');
            }).catch(function() {
                if (Router) Router.navigate('login');
            });
        } else {
            if (Router) Router.navigate('login');
        }
    }
};