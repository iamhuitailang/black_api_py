const CharacterPage = {
    data() {
        return {
            user: null,
            characters: [],
            myCharacters: [],
            usingCharacterId: null,
            loading: false,
            showBuyModal: false,
            selectedCharacter: null
        };
    },
    template: `
        <div class="main-layout">
            <header class="header">
                <div class="header-left">
                    <div class="header-logo">👤 角色</div>
                </div>
                <div class="user-info">
                    <div class="user-coins">💰 {{ user ? user.coins : 0 }}</div>
                    <div class="user-avatar">{{ user ? user.nickname.charAt(0).toUpperCase() : 'U' }}</div>
                </div>
            </header>

            <div class="content">
                <h1 class="page-title">角色商店</h1>

                <div v-if="loading" class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <div class="empty-text">加载中...</div>
                </div>
                <div v-else class="grid grid-3">
                    <div 
                        v-for="character in characters" 
                        :key="character.id"
                        class="card character-card"
                        :class="{ 
                            selected: usingCharacterId === character.id,
                            locked: !ownsCharacter(character.id)
                        }"
                        @click="onCharacterClick(character)"
                    >
                        <div 
                            class="character-avatar"
                            :style="{ background: Utils.getRarityGradient(character.rarity) }"
                        >
                            {{ character.avatar || '👤' }}
                        </div>
                        <div>
                            <span 
                                class="rarity-badge"
                                :class="'rarity-' + Utils.getRarityClass(character.rarity)"
                            >
                                {{ Utils.getRarityText(character.rarity) }}
                            </span>
                        </div>
                        <div class="character-name">{{ character.name }}</div>
                        <div class="character-desc">{{ character.description }}</div>
                        <div class="character-stats">
                            <span>⚡ {{ character.speed_bonus }}%</span>
                            <span>🦘 {{ character.jump_bonus }}%</span>
                            <span>⭐ {{ character.score_bonus }}%</span>
                        </div>
                        <div v-if="!ownsCharacter(character.id)" style="margin-top: 12px;">
                            <span style="color: var(--warning); font-weight: 600;">
                                💰 {{ character.price }}
                            </span>
                        </div>
                        <div v-else-if="usingCharacterId === character.id" style="margin-top: 12px;">
                            <span style="color: var(--success); font-weight: 600;">
                                ✅ 使用中
                            </span>
                        </div>
                        <div v-else style="margin-top: 12px;">
                            <span style="color: var(--text-secondary); font-weight: 600;">
                                已拥有
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showBuyModal && selectedCharacter" class="modal" @click.self="showBuyModal = false">
                <div class="modal-content">
                    <h2 class="modal-title">购买角色</h2>
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div 
                            class="character-avatar"
                            :style="{ background: Utils.getRarityGradient(selectedCharacter.rarity) }"
                            style="width: 100px; height: 100px; font-size: 40px; margin: 0 auto 16px;"
                        >
                            {{ selectedCharacter.avatar || '👤' }}
                        </div>
                        <h3 style="font-size: 20px; margin-bottom: 8px;">{{ selectedCharacter.name }}</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            {{ selectedCharacter.description }}
                        </p>
                        <div style="font-size: 24px; font-weight: 700; color: var(--warning);">
                            💰 {{ selectedCharacter.price }} 金币
                        </div>
                        <div style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
                            当前金币: {{ user ? user.coins : 0 }}
                        </div>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-secondary" @click="showBuyModal = false">
                            取消
                        </button>
                        <button 
                            class="btn btn-primary" 
                            @click="buyCharacter"
                            :disabled="user && user.coins < selectedCharacter.price"
                        >
                            确认购买
                        </button>
                    </div>
                </div>
            </div>

            <nav class="nav-bar">
                <div class="nav-item" @click="goToHome">
                    <div class="nav-icon">🏠</div>
                    <div class="nav-label">首页</div>
                </div>
                <div class="nav-item" @click="goToMusic">
                    <div class="nav-icon">🎵</div>
                    <div class="nav-label">音乐</div>
                </div>
                <div class="nav-item" @click="goToGame">
                    <div class="nav-icon">🎮</div>
                    <div class="nav-label">游戏</div>
                </div>
                <div class="nav-item" @click="goToLeaderboard">
                    <div class="nav-icon">🏆</div>
                    <div class="nav-label">排行</div>
                </div>
                <div class="nav-item" @click="goToSettings">
                    <div class="nav-icon">⚙️</div>
                    <div class="nav-label">设置</div>
                </div>
            </nav>
        </div>
    `,
    methods: {
        async loadData() {
            this.user = Auth.getUser();
            this.loading = true;

            const [allRes, myRes] = await Promise.all([
                YpAPI.character.list(),
                YpAPI.character.my()
            ]);

            this.loading = false;

            if (allRes.code === 0 && allRes.data) {
                this.characters = allRes.data.items || allRes.data || [];
            }

            if (myRes.code === 0 && myRes.data) {
                this.myCharacters = myRes.data.characters || [];
                this.usingCharacterId = myRes.data.using_character_id;
            }
        },
        ownsCharacter(characterId) {
            return this.myCharacters.some(c => c.character_id === characterId);
        },
        onCharacterClick(character) {
            if (this.ownsCharacter(character.id)) {
                if (this.usingCharacterId !== character.id) {
                    this.selectCharacter(character);
                }
            } else {
                this.selectedCharacter = character;
                this.showBuyModal = true;
            }
        },
        async selectCharacter(character) {
            const response = await YpAPI.character.select({ character_id: character.id });
            if (response.code === 0) {
                this.usingCharacterId = character.id;
                Utils.showToast(`已切换到 ${character.name}`, 'success');
            } else {
                Utils.showToast(response.msg || '切换失败', 'error');
            }
        },
        async buyCharacter() {
            if (!this.selectedCharacter) return;

            const response = await YpAPI.character.buy({ character_id: this.selectedCharacter.id });
            if (response.code === 0) {
                this.showBuyModal = false;
                this.user = response.data.user;
                Auth.setUser(this.user);
                Utils.showToast(`成功购买 ${this.selectedCharacter.name}`, 'success');
                this.loadData();
            } else {
                Utils.showToast(response.msg || '购买失败', 'error');
            }
        },
        goToHome() {
            Router.navigate('home');
        },
        goToMusic() {
            Router.navigate('music');
        },
        goToGame() {
            Router.navigate('game');
        },
        goToLeaderboard() {
            Router.navigate('leaderboard');
        },
        goToSettings() {
            Router.navigate('settings');
        }
    },
    mounted() {
        this.loadData();
    }
};
