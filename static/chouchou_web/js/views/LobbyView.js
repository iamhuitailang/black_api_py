
const LobbyView = Vue.defineComponent({
    name: 'LobbyView',
    setup() {
        const router = window.ChouchouRouter;

        const activeTab = Vue.ref('all');
        const games = Vue.ref([]);
        const myGames = Vue.ref([]);
        const loading = Vue.ref(false);
        const showCreateModal = Vue.ref(false);
        const showJoinModal = Vue.ref(false);
        const joinCode = Vue.ref('');

        const createForm = Vue.reactive({
            name: '',
            theme: Store.currentTheme,
            max_players: 8,
            min_players: 3,
            total_rounds: 5,
            add_ai: true
        });

        const themes = [
            { id: 'carnival', name: '欢乐马戏城 🎠', desc: '卡通童趣风' },
            { id: 'vintage', name: '复古马戏团 🎩', desc: '怀旧欧式风' },
            { id: 'dark', name: '暗夜诡马戏 🌑', desc: '悬疑暗黑风' }
        ];

        const loadGames = async () => {
            loading.value = true;
            try {
                const [allGames, myGamesData] = await Promise.all([
                    API.game.list('waiting', 1, 20),
                    API.game.myGames(1, 10)
                ]);

                if (allGames) {
                    games.value = Array.isArray(allGames) ? allGames : (allGames.items || []);
                }
                if (myGamesData) {
                    myGames.value = Array.isArray(myGamesData) ? myGamesData : (myGamesData.items || []);
                }
            } finally {
                loading.value = false;
            }
        };

        const handleCreateGame = async () => {
            if (!createForm.name.trim()) {
                Utils.warning('请输入游戏名称');
                return;
            }

            loading.value = true;
            try {
                const result = await API.game.create(createForm);
                if (result) {
                    Utils.success('游戏创建成功！');
                    showCreateModal.value = false;
                    Store.setCurrentGame(result);
                    setTimeout(() => {
                        router.push(`/game/${result.game.id}`);
                    }, 500);
                }
            } finally {
                loading.value = false;
            }
        };

        const handleJoinGame = async (gameId = null) => {
            const id = gameId || joinCode.value.trim();
            if (!id) {
                Utils.warning('请输入房间号');
                return;
            }

            loading.value = true;
            try {
                const result = await API.game.join(id);
                if (result) {
                    Utils.success('加入游戏成功！');
                    showJoinModal.value = false;
                    joinCode.value = '';
                    Store.setCurrentGame(result);
                    setTimeout(() => {
                        router.push(`/game/${result.game.id}`);
                    }, 500);
                }
            } finally {
                loading.value = false;
            }
        };

        const goToGame = (game) => {
            Store.setCurrentGame(game);
            router.push(`/game/${game.id}`);
        };

        const quickStart = async () => {
            loading.value = true;
            try {
                const result = await API.game.create({
                    name: `${Store.user.nickname || Store.user.username}的马戏场`,
                    theme: Store.currentTheme,
                    max_players: 8,
                    min_players: 3,
                    total_rounds: 5,
                    add_ai: true
                });
                if (result) {
                    Utils.success('快速开始成功！');
                    Store.setCurrentGame(result);
                    setTimeout(() => {
                        router.push(`/game/${result.game.id}`);
                    }, 500);
                }
            } finally {
                loading.value = false;
            }
        };

        Vue.onMounted(() => {
            loadGames();
        });

        const displayedGames = Vue.computed(() => {
            if (activeTab.value === 'my') {
                return myGames.value;
            }
            return games.value;
        });

        return {
            Store,
            Utils,
            activeTab,
            games,
            myGames,
            loading,
            showCreateModal,
            showJoinModal,
            joinCode,
            createForm,
            themes,
            displayedGames,
            loadGames,
            handleCreateGame,
            handleJoinGame,
            goToGame,
            quickStart
        };
    },
    template: `
        <div>
            <header class="header">
                <h1>🎪 国王游戏 - 马戏对决</h1>
                <nav>
                    <router-link to="/lobby">游戏大厅</router-link>
                    <router-link to="/leaderboard">排行榜</router-link>
                    <router-link to="/profile">个人中心</router-link>
                    <router-link to="/settings">设置</router-link>
                    <button @click="Store.logout()">退出</button>
                    <ThemeSwitcher />
                </nav>
            </header>

            <div class="container">
                <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-lg" @click="showCreateModal = true">
                        🎮 创建游戏
                    </button>
                    <button class="btn btn-secondary btn-lg" @click="showJoinModal = true">
                        🔗 加入游戏
                    </button>
                    <button class="btn btn-outline btn-lg" @click="quickStart" :disabled="loading">
                        ⚡ 快速开始
                    </button>
                    <button class="btn btn-secondary btn-lg" @click="loadGames" :disabled="loading">
                        🔄 刷新
                    </button>
                </div>

                <div class="tabs">
                    <button
                        :class="['tab-btn', { active: activeTab === 'all' }]"
                        @click="activeTab = 'all'"
                    >
                        🎪 全部游戏
                    </button>
                    <button
                        :class="['tab-btn', { active: activeTab === 'my' }]"
                        @click="activeTab = 'my'"
                    >
                        📋 我的游戏
                    </button>
                </div>

                <div v-if="loading" class="loading">
                    <div class="spinner"></div>
                </div>

                <div v-else-if="displayedGames.length === 0" class="empty-state">
                    <div class="empty-state-icon">🎪</div>
                    <div class="empty-state-text">
                        {{ activeTab === 'my' ? '还没有参与的游戏' : '暂无等待中的游戏' }}
                    </div>
                    <button class="btn btn-primary" @click="showCreateModal = true">
                        创建第一个游戏
                    </button>
                </div>

                <div v-else class="grid grid-3">
                    <div
                        v-for="game in displayedGames"
                        :key="game.id"
                        class="card game-card"
                        @click="goToGame(game)"
                    >
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                            <h3 style="color: var(--primary-color);">{{ game.name }}</h3>
                            <span :class="['badge', game.status === 'waiting' ? 'badge-success' : game.status === 'playing' ? 'badge-warning' : 'badge-info']">
                                {{ Utils.getStatusName(game.status) }}
                            </span>
                        </div>

                        <div class="game-code" @click.stop="Utils.copyToClipboard(game.room_code)">
                            {{ game.room_code }}
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>🎭 {{ Utils.getThemeName(game.theme) }}</span>
                            <span>🔄 {{ game.current_round || 0 }}/{{ game.total_rounds }} 回合</span>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                            <span>👥 {{ game.players_count || 0 }}/{{ game.max_players }} 人</span>
                        </div>

                        <button class="btn btn-primary btn-sm" style="width: 100%;">
                            {{ game.status === 'waiting' ? '加入游戏' : '查看详情' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🎮 创建游戏</h3>
                        <button class="close-btn" @click="showCreateModal = false">&times;</button>
                    </div>

                    <div class="form-group">
                        <label>游戏名称</label>
                        <input type="text" v-model="createForm.name" placeholder="给你的游戏起个名字" />
                    </div>

                    <div class="form-group">
                        <label>选择主题</label>
                        <div class="grid grid-3">
                            <div
                                v-for="theme in themes"
                                :key="theme.id"
                                :style="{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: createForm.theme === theme.id ? '3px solid var(--primary-color)' : '2px solid var(--border-color)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'var(--transition)'
                                }"
                                @click="createForm.theme = theme.id"
                            >
                                <div style="font-size: 24px; margin-bottom: 8px;">{{ theme.name.split(' ')[1] }}</div>
                                <div style="font-weight: 600;">{{ theme.name.split(' ')[0] }}</div>
                                <div style="font-size: 12px; color: var(--text-light);">{{ theme.desc }}</div>
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>最大玩家数: {{ createForm.max_players }}</label>
                            <input type="range" v-model="createForm.max_players" min="3" max="16" step="1" />
                        </div>
                        <div class="form-group">
                            <label>最少开始人数: {{ createForm.min_players }}</label>
                            <input type="range" v-model="createForm.min_players" min="3" max="8" step="1" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>总回合数: {{ createForm.total_rounds }}</label>
                            <input type="range" v-model="createForm.total_rounds" min="3" max="10" step="1" />
                        </div>
                        <div class="form-group">
                            <label style="display: flex; justify-content: space-between; align-items: center;">
                                添加AI玩家
                                <div
                                    :class="['switch', { active: createForm.add_ai }]"
                                    @click="createForm.add_ai = !createForm.add_ai"
                                ></div>
                            </label>
                            <div style="font-size: 12px; color: var(--text-light);">自动添加AI填充空位</div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button class="btn btn-outline" style="flex: 1;" @click="showCreateModal = false">
                            取消
                        </button>
                        <button class="btn btn-primary" style="flex: 1;" :disabled="loading" @click="handleCreateGame">
                            {{ loading ? '创建中...' : '创建游戏' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showJoinModal" class="modal-overlay" @click.self="showJoinModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔗 加入游戏</h3>
                        <button class="close-btn" @click="showJoinModal = false">&times;</button>
                    </div>

                    <div class="form-group">
                        <label>输入房间号</label>
                        <input
                            type="text"
                            v-model="joinCode"
                            placeholder="请输入6位房间号"
                            style="text-transform: uppercase; font-family: monospace; font-size: 24px; text-align: center; letter-spacing: 8px;"
                            maxlength="6"
                            @keyup.enter="handleJoinGame()"
                        />
                    </div>

                    <div style="text-align: center; color: var(--text-light); margin-bottom: 16px;">
                        向房主获取房间号加入游戏
                    </div>

                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-outline" style="flex: 1;" @click="showJoinModal = false">
                            取消
                        </button>
                        <button class="btn btn-primary" style="flex: 1;" :disabled="loading || !joinCode.trim()" @click="handleJoinGame()">
                            {{ loading ? '加入中...' : '加入游戏' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
});

window.LobbyView = LobbyView;
