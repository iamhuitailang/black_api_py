const App = {
    init: function() {
        this.updateUserInfo();
        this.setupEventListeners();
        Router.init();
    },
    updateUserInfo: function() {
        const userInfo = document.getElementById('user-info');
        if (!userInfo) return;

        if (Auth.isLoggedIn()) {
            const user = Storage.getUser();
            const nickname = user ? user.nickname : '用户';
            const avatarText = nickname ? nickname.charAt(0).toUpperCase() : 'U';
            
            userInfo.innerHTML = `
                <div class="user-dropdown">
                    <div class="user-avatar" id="user-avatar">${avatarText}</div>
                    <div class="user-menu" id="user-menu">
                        <div class="user-menu-item" data-action="profile">个人中心</div>
                        <div class="user-menu-item" data-action="my-activities">我的活动</div>
                        <div class="user-menu-item" data-action="my-rides">我的记录</div>
                        <div class="user-menu-item" data-action="my-posts">我的动态</div>
                        <div class="user-menu-item danger" data-action="logout">退出登录</div>
                    </div>
                </div>
            `;

            const avatar = document.getElementById('user-avatar');
            const menu = document.getElementById('user-menu');
            
            avatar.addEventListener('click', function(e) {
                e.stopPropagation();
                menu.classList.toggle('show');
            });

            document.addEventListener('click', function() {
                menu.classList.remove('show');
            });

            menu.querySelectorAll('.user-menu-item').forEach(item => {
                item.addEventListener('click', function() {
                    const action = this.dataset.action;
                    menu.classList.remove('show');
                    switch(action) {
                        case 'profile':
                            Router.go('profile');
                            break;
                        case 'my-activities':
                            Router.go('activities', { type: 'my' });
                            break;
                        case 'my-rides':
                            Router.go('rides', { type: 'my' });
                            break;
                        case 'my-posts':
                            Router.go('posts', { type: 'my' });
                            break;
                        case 'logout':
                            App.logout();
                            break;
                    }
                });
            });
        } else {
            userInfo.innerHTML = `
                <a href="?page=login" class="btn btn-primary">登录</a>
                <a href="?page=register" class="btn btn-outline">注册</a>
            `;
        }
    },
    setupEventListeners: function() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                const page = link.dataset.route;
                const params = {};
                if (link.dataset.id) {
                    params.id = link.dataset.id;
                }
                Router.go(page, params);
            }
        });
    },
    logout: async function() {
        const confirm = window.confirm('确定要退出登录吗？');
        if (confirm) {
            await Auth.logout();
            this.updateUserInfo();
            Router.go('home');
            this.showToast('已退出登录', 'success');
        }
    },
    showToast: function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },
    renderLoading: function() {
        return `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
    },
    renderEmpty: function(icon, text, hint) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-text">${text}</div>
                ${hint ? `<div class="empty-state-hint">${hint}</div>` : ''}
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
