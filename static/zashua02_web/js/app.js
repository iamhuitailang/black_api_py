const HomePage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderLayout(this.renderContent());
        this.bindEvents();
        this.applyTheme();
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
        const user = AuthService.getCurrentUser();
        
        return `
            <div class="home-container">
                <div class="welcome-section">
                    <h2>🎪 欢迎，${user?.nickname || user?.username || '杂耍大师'}！</h2>
                    <p>准备好开始你的杂耍表演了吗？选择角色，和队友一起完成精彩的抛接表演！</p>
                </div>

                <div class="menu-grid">
                    <div class="menu-card" data-action="game">
                        <div class="icon">🎮</div>
                        <h3>开始游戏</h3>
                        <p>和队友一起开始杂耍表演，挑战最高连击！</p>
                    </div>
                    
                    <div class="menu-card" data-action="character">
                        <div class="icon">👤</div>
                        <h3>选择角色</h3>
                        <p>挑选你的专属杂耍角色，每种都有独特能力！</p>
                    </div>
                    
                    <div class="menu-card" data-action="rank">
                        <div class="icon">🏆</div>
                        <h3>排行榜</h3>
                        <p>看看谁是最强的杂耍大师！</p>
                    </div>
                    
                    <div class="menu-card" data-action="settings">
                        <div class="icon">⚙️</div>
                        <h3>游戏设置</h3>
                        <p>调整主题、难度，修改账号密码</p>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🎯 游戏玩法</h3>
                    <div style="color: rgba(255, 255, 255, 0.8); line-height: 2;">
                        <p>• 使用 <strong>← → 方向键</strong> 移动你的角色</p>
                        <p>• 按下 <strong>空格键</strong> 抛出道具给队友</p>
                        <p>• 按下 <strong>Shift键</strong> 接住飞来的道具</p>
                        <p>• 在正确的节拍上操作可以获得额外分数</p>
                        <p>• 连续成功接球可以累积连击获得更高分！</p>
                        <p>• 达到指定连击数即可通关进入下一关</p>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>🎁 道具说明</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; color: rgba(255, 255, 255, 0.8);">
                        <div>🔴 <strong>彩球</strong> - 基础10分，容易接住</div>
                        <div>⭕ <strong>圆环</strong> - 15分，速度较快</div>
                        <div>🔥 <strong>火把</strong> - 22分，需要精准时机</div>
                        <div>🏺 <strong>花瓶</strong> - 30分，难度最高</div>
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

        document.querySelectorAll('.menu-card').forEach(card => {
            card.addEventListener('click', () => {
                Router.navigate(card.dataset.action);
            });
        });

        document.getElementById('userMenu')?.addEventListener('click', async () => {
            if (confirm('确定要退出登录吗？')) {
                await AuthService.logout();
                Router.navigate('login');
            }
        });
    },

    applyTheme() {
        const settings = Storage.getSettings();
        document.body.className = '';
        if (settings.theme !== 'circus') {
            document.body.classList.add(`theme-${settings.theme}`);
        }
    }
};

window.HomePage = HomePage;

const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', () => {
            LoginPage.render();
        });

        Router.register('register', () => {
            RegisterPage.render();
        });

        Router.register('home', () => {
            HomePage.render();
        });

        Router.register('character', () => {
            CharacterPage.render();
        });

        Router.register('game', () => {
            GamePage.render();
        });

        Router.register('rank', () => {
            RankPage.render();
        });

        Router.register('settings', () => {
            SettingsPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
