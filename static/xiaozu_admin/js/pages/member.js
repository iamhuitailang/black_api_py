const MemberPage = {
    async render() {
        const app = document.getElementById('app');
        const currentTeam = AuthService.getCurrentTeam();

        if (!currentTeam) {
            app.innerHTML = Layout.render(`
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p>请先创建或加入小组</p>
                </div>
            `, { title: '成员管理' });
            return;
        }

        app.innerHTML = Layout.render(`
            <div class="card">
                <div class="card-header">
                    <span class="card-title">邀请成员</span>
                </div>
                <div class="invite-box">
                    <p style="color: var(--text-secondary); margin-bottom: 8px;">分享邀请码给成员加入小组</p>
                    <div class="invite-code" id="inviteCode">${currentTeam.invite_code || '-'}</div>
                    <div class="invite-actions">
                        <button class="btn btn-primary" onclick="MemberPage.copyInviteCode()">复制邀请码</button>
                        <button class="btn btn-secondary" onclick="MemberPage.regenerateCode()">重新生成</button>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">成员列表</span>
                </div>
                <div id="memberList">
                    <div class="empty-state"><p>加载中...</p></div>
                </div>
            </div>
        `, { title: '成员管理' });

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
        const currentUser = AuthService.getCurrentUser();

        if (members.length === 0) {
            document.getElementById('memberList').innerHTML = '<div class="empty-state"><p>暂无成员</p></div>';
            return;
        }

        document.getElementById('memberList').innerHTML = `
            <div class="member-list">
                ${members.map(m => `
                    <div class="member-card">
                        <div class="avatar avatar-lg">${(m.username || 'U').charAt(0).toUpperCase()}</div>
                        <div class="member-info" style="flex: 1;">
                            <h4>${m.username}</h4>
                            <p>${m.email || ''}</p>
                            <p><span class="badge ${m.role === 'owner' ? 'badge-primary' : m.role === 'admin' ? 'badge-warning' : 'badge-secondary'}">${this.getRoleText(m.role)}</span></p>
                        </div>
                        <div>
                            ${this.renderActions(m, currentUser)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderActions(member, currentUser) {
        const currentTeam = AuthService.getCurrentTeam();
        const isOwner = currentTeam.owner_id === currentUser.id;
        const isSelf = member.user_id === currentUser.id;

        if (member.role === 'owner') {
            return '<span class="badge badge-primary">组长</span>';
        }

        if (isOwner) {
            return `
                ${member.role === 'admin' ? `
                    <button class="btn btn-sm btn-secondary" onclick="MemberPage.setRole(${member.user_id}, 'member')">取消管理员</button>
                ` : `
                    <button class="btn btn-sm btn-warning" onclick="MemberPage.setRole(${member.user_id}, 'admin')">设为管理员</button>
                `}
                <button class="btn btn-sm btn-danger" onclick="MemberPage.removeMember(${member.user_id})">移除</button>
            `;
        }

        if (isSelf) {
            return `<button class="btn btn-sm btn-secondary" onclick="MemberPage.leaveTeam()">退出小组</button>`;
        }

        return '';
    },

    getRoleText(role) {
        const map = { owner: '组长', admin: '管理员', member: '成员' };
        return map[role] || role;
    },

    copyInviteCode() {
        const code = document.getElementById('inviteCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            Toast.success('已复制到剪贴板');
        });
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
    },

    async setRole(userId, role) {
        const currentTeam = AuthService.getCurrentTeam();
        const result = await ApiService.post('/xz/team/member/role/update', {
            team_id: currentTeam.team_id,
            target_user_id: userId,
            role: role
        });

        if (result.code === 0) {
            Toast.success('操作成功');
            this.loadMembers();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    async removeMember(userId) {
        if (!confirm('确定要移除该成员吗？')) return;

        const currentTeam = AuthService.getCurrentTeam();
        const result = await ApiService.post('/xz/team/member/remove', {
            team_id: currentTeam.team_id,
            target_user_id: userId
        });

        if (result.code === 0) {
            Toast.success('已移除');
            this.loadMembers();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    async leaveTeam() {
        if (!confirm('确定要退出该小组吗？')) return;

        const currentTeam = AuthService.getCurrentTeam();
        const currentUser = AuthService.getCurrentUser();
        const result = await ApiService.post('/xz/team/member/remove', {
            team_id: currentTeam.team_id,
            target_user_id: currentUser.id
        });

        if (result.code === 0) {
            Toast.success('已退出');
            await AuthService.loadUserTeams();
            const teams = AuthService.getUserTeams();
            if (teams && teams.length > 0) {
                AuthService.setCurrentTeam(teams[0]);
            } else {
                AuthService.setCurrentTeam(null);
            }
            Router.navigate('dashboard');
        } else {
            Toast.error(result.msg || '操作失败');
        }
    }
};

window.MemberPage = MemberPage;
