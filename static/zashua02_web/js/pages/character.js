const CharacterPage = {
    selectedCharacter: 'clown',

    render() {
        const user = AuthService.getCurrentUser();
        this.selectedCharacter = user?.characterType || 'clown';

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
                        <div class="header-stats">
                            <div class="stat-item">
                                <span class="icon">🏆</span>
                                <span class="value" id="headerScore">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="icon">💎</span>
                                <span class="value" id="headerCombo">0</span>
                            </div>
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
        const characters = [
            { id: 'clown', name: '马戏小丑', emoji: '🤡', tags: ['平衡百搭', '快速连抛', '小额容错'], desc: '平衡百搭，快速连抛、小额容错' },
            { id: 'street', name: '街头艺人', emoji: '🎪', tags: ['速度灵活', '低空瞬接', '位移接物'], desc: '速度灵活，低空瞬接、位移接物' },
            { id: 'palace', name: '宫廷杂耍师', emoji: '👑', tags: ['稳定高分', '高空远抛', '双倍计分'], desc: '稳定高分，高空远抛、双倍计分' }
        ];

        return `
            <div class="character-select-container">
                <h2 class="section-title">
                    <span>👤</span>
                    选择你的杂耍角色
                </h2>
                
                <div class="character-grid">
                    ${characters.map(char => `
                        <div class="character-card ${this.selectedCharacter === char.id ? 'selected' : ''}" data-character="${char.id}">
                            <div class="character-avatar">${char.emoji}</div>
                            <div class="character-name">${char.name}</div>
                            <div class="character-desc">${char.desc}</div>
                            <div class="character-tags">
                                ${char.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="text-center mt-3">
                    <button class="btn btn-primary btn-lg" id="confirmBtn">确认选择</button>
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

        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCharacter = card.dataset.character;
            });
        });

        document.getElementById('confirmBtn').addEventListener('click', async () => {
            await this.confirmSelection();
        });

        document.getElementById('userMenu')?.addEventListener('click', async () => {
            if (confirm('确定要退出登录吗？')) {
                await AuthService.logout();
                Router.navigate('login');
            }
        });
    },

    async confirmSelection() {
        const btn = document.getElementById('confirmBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> 保存中...';

        try {
            const result = await AuthService.updateProfile({
                character_type: this.selectedCharacter
            });

            if (result.code === 0) {
                const user = AuthService.getCurrentUser();
                user.characterType = this.selectedCharacter;
                Storage.setUser(user);

                Toast.success('角色选择成功');
                setTimeout(() => Router.navigate('game'), 500);
            } else {
                Toast.error(result.msg || '保存失败');
            }
        } catch (e) {
            Toast.error('保存失败，请重试');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '确认选择';
        }
    }
};

window.CharacterPage = CharacterPage;
