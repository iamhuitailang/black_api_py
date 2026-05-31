const ProfilePage = {
    tab: 'info',

    render() {
        const user = AuthService.getCurrentUser();
        document.getElementById('app').innerHTML = `
            <nav class="navbar">
                <div class="nav-brand" onclick="Router.navigate('home')">成语接龙</div>
                <div class="nav-menu">
                    <span class="nav-link" onclick="Router.navigate('home')">首页</span>
                    <span class="nav-link" onclick="Router.navigate('game')">开始游戏</span>
                    <span class="nav-link" onclick="Router.navigate('achievements')">成就</span>
                    <span class="nav-link active" onclick="Router.navigate('profile')">个人中心</span>
                </div>
            </nav>
            <div class="page-container">
                <div class="card">
                    <div class="profile-header">
                        <div class="profile-avatar">${(user && (user.nickname || user.username || '?'))[0]}</div>
                        <div class="profile-info">
                            <h2>${user ? (user.nickname || user.username) : ''}</h2>
                            <div class="username">@${user ? user.username : ''}</div>
                        </div>
                    </div>
                    <div class="profile-stats">
                        <div class="stat-item"><span class="stat-value" id="pScore">0</span><span class="stat-label">总积分</span></div>
                        <div class="stat-item"><span class="stat-value" id="pWins">0</span><span class="stat-label">胜场</span></div>
                        <div class="stat-item"><span class="stat-value" id="pGames">0</span><span class="stat-label">总场次</span></div>
                        <div class="stat-item"><span class="stat-value" id="pAch">0</span><span class="stat-label">成就</span></div>
                    </div>
                </div>

                <div class="tabs">
                    <button class="tab-btn ${this.tab === 'info' ? 'active' : ''}" onclick="ProfilePage.switchTab('info')">个人信息</button>
                    <button class="tab-btn ${this.tab === 'password' ? 'active' : ''}" onclick="ProfilePage.switchTab('password')">修改密码</button>
                    <button class="tab-btn ${this.tab === 'history' ? 'active' : ''}" onclick="ProfilePage.switchTab('history')">游戏记录</button>
                </div>

                <div id="profileContent"></div>
            </div>
        `;
        this.loadStats();
        this.switchTab(this.tab);
    },

    async loadStats() {
        try {
            const [scoreRes, achRes] = await Promise.all([
                ApiService.get('/chengyu/game/myscores/get'),
                ApiService.get('/chengyu/achievement/my/get')
            ]);
            const scores = scoreRes.code === 0 ? scoreRes.data : [];
            const achievements = achRes.code === 0 ? achRes.data : [];
            const totalScore = scores.reduce((s, x) => s + (x.score || 0), 0);
            const totalGames = scores.length;
            const totalWins = scores.filter(x => x.is_win).length;
            document.getElementById('pScore').textContent = totalScore;
            document.getElementById('pWins').textContent = totalWins;
            document.getElementById('pGames').textContent = totalGames;
            document.getElementById('pAch').textContent = achievements.length;
        } catch (err) {}
    },

    switchTab(tab) {
        this.tab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const btns = document.querySelectorAll('.tab-btn');
        const idx = { info: 0, password: 1, history: 2 }[tab];
        if (btns[idx]) btns[idx].classList.add('active');

        if (tab === 'info') this.renderInfo();
        else if (tab === 'password') this.renderPassword();
        else if (tab === 'history') this.renderHistory();
    },

    renderInfo() {
        const user = AuthService.getCurrentUser();
        document.getElementById('profileContent').innerHTML = `
            <div class="card">
                <form id="profileForm">
                    <div class="form-group"><label>用户名</label><input type="text" value="${user ? user.username : ''}" disabled></div>
                    <div class="form-group"><label>昵称</label><input type="text" id="editNickname" value="${user ? (user.nickname || '') : ''}" placeholder="请输入昵称"></div>
                    <div class="form-group"><label>邮箱</label><input type="email" id="editEmail" value="${user ? (user.email || '') : ''}" placeholder="请输入邮箱"></div>
                    <button type="submit" class="btn btn-primary">保存修改</button>
                </form>
            </div>
        `;
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nickname = document.getElementById('editNickname').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            try {
                const res = await AuthService.updateProfile({ nickname, email });
                if (res.code === 0) { Toast.success('修改成功'); }
                else { Toast.error(res.message || '修改失败'); }
            } catch (err) { Toast.error('修改失败'); }
        });
    },

    renderPassword() {
        document.getElementById('profileContent').innerHTML = `
            <div class="card">
                <form id="passwordForm">
                    <div class="form-group"><label>旧密码</label><input type="password" id="oldPwd" placeholder="请输入旧密码" required></div>
                    <div class="form-group"><label>新密码</label><input type="password" id="newPwd" placeholder="请输入新密码" required></div>
                    <div class="form-group"><label>确认新密码</label><input type="password" id="confirmPwd" placeholder="请再次输入新密码" required></div>
                    <button type="submit" class="btn btn-primary">修改密码</button>
                </form>
            </div>
        `;
        document.getElementById('passwordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPwd = document.getElementById('oldPwd').value;
            const newPwd = document.getElementById('newPwd').value;
            const confirmPwd = document.getElementById('confirmPwd').value;
            if (newPwd !== confirmPwd) { Toast.error('两次密码不一致'); return; }
            try {
                const res = await AuthService.changePassword(oldPwd, newPwd);
                if (res.code === 0) { Toast.success('密码修改成功，请重新登录'); AuthService.logout(); Router.navigate('login'); }
                else { Toast.error(res.message || '修改失败'); }
            } catch (err) { Toast.error('修改失败'); }
        });
    },

    async renderHistory() {
        document.getElementById('profileContent').innerHTML = '<div class="loading">加载中...</div>';
        try {
            const res = await ApiService.get('/chengyu/game/myscores/get');
            if (res.code === 0 && res.data && res.data.length > 0) {
                document.getElementById('profileContent').innerHTML = `
                    <div class="card"><div class="history-list">
                        ${res.data.map(s => `
                            <div class="history-item">
                                <span>${s.game_type === 'classic' ? '经典模式' : '对战模式'} - ${s.is_win ? '胜利' : '失败'}</span>
                                <span>得分: ${s.score}</span>
                                <span>${formatDate(s.created_at)}</span>
                            </div>
                        `).join('')}
                    </div></div>
                `;
            } else {
                document.getElementById('profileContent').innerHTML = '<div class="card"><div class="empty">暂无游戏记录</div></div>';
            }
        } catch (err) {
            document.getElementById('profileContent').innerHTML = '<div class="card"><div class="empty">加载失败</div></div>';
        }
    }
};
