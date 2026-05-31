const ProfilePage = {
    render() {
        const user = AuthService.getCurrentUser()
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <div class="header-title">个人中心</div>
                </div>
                <div class="profile-header">
                    <div class="profile-avatar">${(user.nickname || user.username || '?')[0]}</div>
                    <div class="profile-info">
                        <div class="profile-name">${user.nickname || user.username}</div>
                        <div class="profile-community">@${user.username}</div>
                        <div class="profile-credit">
                            <span class="profile-credit-badge">🏆 总分 ${user.total_score || 0}</span>
                            <span class="profile-credit-badge">🎮 局数 ${user.games_played || 0}</span>
                        </div>
                    </div>
                </div>

                <div class="list" style="margin-top:12px">
                    <div class="list-item" onclick="Router.navigate('changePassword')">
                        <div class="list-item-content">
                            <div class="list-item-title">🔑 修改密码</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="Router.navigate('myProps')">
                        <div class="list-item-content">
                            <div class="list-item-title">🎒 我的道具</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="Router.navigate('myRecords')">
                        <div class="list-item-content">
                            <div class="list-item-title">📊 游戏记录</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                </div>

                <div class="list" style="margin-top:12px">
                    <div class="list-item" onclick="ProfilePage.handleLogout()">
                        <div class="list-item-content">
                            <div class="list-item-title" style="color:var(--danger-color)">退出登录</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    },

    async handleLogout() {
        await AuthService.logout()
        Toast.success('已退出登录')
        Router.navigate('login')
    }
}
