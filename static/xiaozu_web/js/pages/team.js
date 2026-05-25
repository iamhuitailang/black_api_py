const TeamPage = {
    async render() {
        const app = document.getElementById('app');
        const currentTeam = AuthService.getCurrentTeam();

        if (!currentTeam) {
            app.innerHTML = HomePage.renderNoTeam();
            return;
        }

        app.innerHTML = `
            <div class="app-container">
                <div class="page-content">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <h2 style="font-size: 18px; font-weight: 500;">小组管理</h2>
                        <button class="btn btn-sm btn-secondary" onclick="HomePage.showTeamSwitcher()">切换</button>
                    </div>
                    
                    <div class="invite-box">
                        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">邀请成员加入</p>
                        <div class="invite-code" id="inviteCode">${currentTeam.invite_code || '-'}</div>
                        <div class="invite-actions">
                            <button class="btn btn-primary btn-sm" onclick="TeamPage.copyInviteCode()">复制</button>
                            <button class="btn btn-secondary btn-sm" onclick="TeamPage.regenerateCode()">换一个</button>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">小组成员</span>
                        </div>
                        <div id="memberList">
                            <div class="empty-state"><p>加载中...</p></div>
                        </div>
                    </div>
                </div>
                ${HomePage.renderBottomNav('team')}
            </div>
        `;

        await this.loadMembers();
    },

    async loadMembers() {
        const currentTeam = AuthService.getCurrentTeam();
        const result = await ApiService.get(`/xz/team/members/get?team_id=${currentTeam.team_id}`);

        if (result.code !== 0) {
            document.getElementById('memberList').innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
            return;
        }

        const members = result.data || [];
        if (members.length === 0) {
            document.getElementById('memberList').innerHTML = '<div class="empty-state"><p>暂无成员</p></div>';
            return;
        }

        document.getElementById('memberList').innerHTML = members.map(m => `
            <div class="member-card">
                <div class="avatar">${(m.username || 'U').charAt(0).toUpperCase()}</div>
                <div class="member-info">
                    <div class="member-name">${m.username}</div>
                    <div class="member-email">${m.email || ''}</div>
                </div>
                <span class="badge ${m.role === 'owner' ? 'badge-primary' : m.role === 'admin' ? 'badge-warning' : 'badge-secondary'}">${this.getRoleText(m.role)}</span>
            </div>
        `).join('');
    },

    getRoleText(role) {
        const map = { owner: '组长', admin: '管理员', member: '成员' };
        return map[role] || role;
    },

    copyInviteCode() {
        const code = document.getElementById('inviteCode').textContent;
        navigator.clipboard?.writeText(code).then(() => Toast.success('已复制'));
    },

    async regenerateCode() {
        const currentTeam = AuthService.getCurrentTeam();
        const result = await ApiService.post(`/xz/team/invite/code/regenerate?team_id=${currentTeam.team_id}`);
        if (result.code === 0) {
            document.getElementById('inviteCode').textContent = result.data.invite_code;
            currentTeam.invite_code = result.data.invite_code;
            AuthService.setCurrentTeam(currentTeam);
            Toast.success('邀请码已更新');
        } else {
            Toast.error(result.msg || '操作失败');
        }
    }
};

window.TeamPage = TeamPage;
