const SettingsPage = {
    settings: null,

    render() {
        this.settings = Storage.getSettings();
        const app = document.getElementById('app');
        app.innerHTML = this.renderLayout(this.renderContent());
        this.bindEvents();
    },

    renderLayout(content) {
        const user = AuthService.getCurrentUser();
        const currentRoute = Router.getCurrentRoute();
        
        return `
            <div class="game-layout">
                <header class="game-header">
                    <div class="game-header-left">
                        <div class="game-logo">
                            <span class="icon">🎪</span>
                            <span>杂耍大师</span>
                        </div>
                    </div>
                    <div class="game-header-right">
                        <div class="user-menu" id="userMenu">
                            <div class="user-avatar">${user?.nickname?.[0] || user?.username?.[0] || 'U'}</div>
                            <span>${user?.nickname || user?.username || '玩家'}</span>
                        </div>
                    </div>
                </header>
                
                <nav class="game-nav">
                    <button class="nav-btn ${currentRoute === 'home' ? 'active' : ''}" data-route="home">🏠 首页</button>
                    <button class="nav-btn ${currentRoute === 'character' ? 'active' : ''}" data-route="character">👤 角色</button>
                    <button class="nav-btn ${currentRoute === 'game' ? 'active' : ''}" data-route="game">🎮 游戏</button>
                    <button class="nav-btn ${currentRoute === 'rank' ? 'active' : ''}" data-route="rank">🏆 排行</button>
                    <button class="nav-btn ${currentRoute === 'settings' ? 'active' : ''}" data-route="settings">⚙️ 设置</button>
                </nav>
                
                <main class="game-main">
                    <div class="game-content">
                        ${content}
                    </div>
                </main>
            </div>
        `;
    },

    renderContent() {
        const themes = [
            { id: 'circus', name: '马戏团之夜', color: '#ff6b35' },
            { id: 'carnival', name: '街头嘉年华', color: '#00b4d8' },
            { id: 'palace', name: '宫廷盛宴', color: '#d4af37' }
        ];

        const difficulties = [
            { id: 'easy', name: '简单', desc: '1名队友，低失误惩罚' },
            { id: 'normal', name: '普通', desc: '2名队友，标准难度' },
            { id: 'hard', name: '困难', desc: '3名队友，高失误惩罚' }
        ];

        return `
            <div class="settings-container">
                <h2 class="section-title">
                    <span>⚙️</span>
                    游戏设置
                </h2>

                <div class="settings-section">
                    <h3>🎨 游戏主题</h3>
                    <div class="setting-item">
                        <span class="setting-label">选择主题</span>
                        <div class="setting-value">
                            <div class="theme-options">
                                ${themes.map(theme => `
                                    <button class="theme-btn ${theme.id} ${this.settings.theme === theme.id ? 'active' : ''}" 
                                            data-theme="${theme.id}">
                                        ${theme.name}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🎯 游戏难度</h3>
                    <div class="setting-item">
                        <span class="setting-label">选择难度</span>
                        <div class="setting-value">
                            <div class="difficulty-options">
                                ${difficulties.map(diff => `
                                    <button class="difficulty-btn ${this.settings.difficulty === diff.id ? 'active' : ''}" 
                                            data-difficulty="${diff.id}">
                                        ${diff.name}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🔐 账号安全</h3>
                    <div class="password-form">
                        <div class="form-group">
                            <label class="form-label" style="color: white;">当前密码</label>
                            <input type="password" class="form-control" id="oldPassword" placeholder="请输入当前密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label" style="color: white;">新密码</label>
                            <input type="password" class="form-control" id="newPassword" placeholder="至少6位">
                        </div>
                        <div class="form-group">
                            <label class="form-label" style="color: white;">确认新密码</label>
                            <input type="password" class="form-control" id="confirmNewPassword" placeholder="再次输入新密码">
                        </div>
                        <div class="form-group" id="passwordError" style="display: none;">
                            <div class="form-error"></div>
                        </div>
                        <button class="btn btn-primary" id="changePasswordBtn">修改密码</button>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>📊 关于游戏</h3>
                    <div style="color: rgba(255, 255, 255, 0.7); line-height: 1.8;">
                        <p><strong>多人同步杂耍</strong></p>
                        <p>操控角色协同抛接各类道具，全员节奏同步完成花式杂耍动作，达成连击高分通关！</p>
                        <p class="mt-2">
                            <strong>操作说明：</strong><br>
                            ← → 方向键移动角色<br>
                            空格键 抛出道具<br>
                            Shift键 接住道具
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Router.navigate(btn.dataset.route);
            });
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTheme(btn.dataset.theme);
            });
        });

        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setDifficulty(btn.dataset.difficulty);
            });
        });

        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            this.changePassword();
        });

        document.getElementById('userMenu')?.addEventListener('click', async () => {
            if (confirm('确定要退出登录吗？')) {
                await AuthService.logout();
                Router.navigate('login');
            }
        });
    },

    setTheme(themeId) {
        this.settings.theme = themeId;
        Storage.setSettings(this.settings);

        document.body.className = '';
        if (themeId !== 'circus') {
            document.body.classList.add(`theme-${themeId}`);
        }

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeId);
        });

        Toast.success('主题已切换');
    },

    setDifficulty(difficultyId) {
        this.settings.difficulty = difficultyId;
        Storage.setSettings(this.settings);

        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficultyId);
        });

        Toast.success('难度已切换');
    },

    async changePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        const errorDiv = document.getElementById('passwordError');
        const btn = document.getElementById('changePasswordBtn');

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            errorDiv.querySelector('.form-error').textContent = '请填写所有密码字段';
            errorDiv.style.display = 'block';
            return;
        }

        if (newPassword !== confirmNewPassword) {
            errorDiv.querySelector('.form-error').textContent = '两次输入的新密码不一致';
            errorDiv.style.display = 'block';
            return;
        }

        if (newPassword.length < 6) {
            errorDiv.querySelector('.form-error').textContent = '新密码长度至少6位';
            errorDiv.style.display = 'block';
            return;
        }

        errorDiv.style.display = 'none';
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> 修改中...';

        try {
            const result = await AuthService.changePassword(oldPassword, newPassword);
            
            if (result.code === 0) {
                Toast.success('密码修改成功');
                document.getElementById('oldPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmNewPassword').value = '';
            } else {
                const errorMsg = result.msg || '修改失败';
                errorDiv.querySelector('.form-error').textContent = errorMsg;
                errorDiv.style.display = 'block';
                Toast.error(errorMsg);
            }
        } catch (e) {
            const errorMsg = '修改失败，请重试';
            errorDiv.querySelector('.form-error').textContent = errorMsg;
            errorDiv.style.display = 'block';
            Toast.error(errorMsg);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '修改密码';
        }
    }
};

window.SettingsPage = SettingsPage;
