const AdminPage = {
    template: `
        <div class="admin-container">
            <div class="page-header">
                <h1 class="page-title">管理面板</h1>
                <p class="page-subtitle">管理游戏数据和用户</p>
            </div>
            
            <div class="admin-tabs">
                <button 
                    v-for="tab in tabs" 
                    :key="tab.id"
                    class="admin-tab"
                    :class="{ active: currentTab === tab.id }"
                    @click="currentTab = tab.id"
                >
                    {{ tab.icon }} {{ tab.name }}
                </button>
            </div>
            
            <div v-if="currentTab === 'statistics'" class="admin-section">
                <h2 style="margin-bottom: 20px; font-size: 24px; color: var(--neon-cyan);">数据统计</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-icon">👥</div>
                        <div class="stat-card-value">{{ stats.totalUsers || 0 }}</div>
                        <div class="stat-card-label">总用户数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">🎵</div>
                        <div class="stat-card-value">{{ stats.totalSongs || 0 }}</div>
                        <div class="stat-card-label">歌曲总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">🎮</div>
                        <div class="stat-card-value">{{ stats.totalGames || 0 }}</div>
                        <div class="stat-card-label">游戏总场次</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">⭐</div>
                        <div class="stat-card-value">{{ (stats.totalScore || 0).toLocaleString() }}</div>
                        <div class="stat-card-label">总得分</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">📅</div>
                        <div class="stat-card-value">{{ stats.todayGames || 0 }}</div>
                        <div class="stat-card-label">今日游戏</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">🎸</div>
                        <div class="stat-card-value">{{ stats.totalInstruments || 0 }}</div>
                        <div class="stat-card-label">乐器总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">🏅</div>
                        <div class="stat-card-value">{{ stats.totalAchievements || 0 }}</div>
                        <div class="stat-card-label">成就总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">💰</div>
                        <div class="stat-card-value">{{ (stats.totalCoins || 0).toLocaleString() }}</div>
                        <div class="stat-card-label">发放金币</div>
                    </div>
                </div>
            </div>
            
            <div v-if="currentTab === 'users'" class="admin-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <h2 style="font-size: 24px; color: var(--neon-cyan);">用户管理</h2>
                    <input 
                        type="text" 
                        class="search-input" 
                        style="max-width: 300px;"
                        v-model="userSearch" 
                        placeholder="搜索用户..."
                    />
                </div>
                
                <div v-if="userLoading" class="loading">
                    <div class="loading-spinner"></div>
                </div>
                
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户名</th>
                            <th>昵称</th>
                            <th>等级</th>
                            <th>金币</th>
                            <th>状态</th>
                            <th>注册时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in filteredUsers" :key="user.id">
                            <td>{{ user.id }}</td>
                            <td>{{ user.username }}</td>
                            <td>{{ user.nickname }}</td>
                            <td>Lv.{{ user.level }}</td>
                            <td>{{ user.coins?.toLocaleString() || 0 }}</td>
                            <td>
                                <span class="badge" :class="'badge-' + user.status">
                                    {{ user.status === 'active' ? '正常' : user.status === 'banned' ? '封禁' : '禁言' }}
                                </span>
                            </td>
                            <td>{{ user.created_at || '2024-01-01' }}</td>
                            <td>
                                <div class="data-table-actions">
                                    <button 
                                        v-if="user.status === 'active'"
                                        class="btn btn-warning btn-small"
                                        @click="muteUser(user)"
                                    >
                                        禁言
                                    </button>
                                    <button 
                                        v-if="user.status !== 'banned'"
                                        class="btn btn-danger btn-small"
                                        @click="banUser(user)"
                                    >
                                        封禁
                                    </button>
                                    <button 
                                        v-if="user.status !== 'active'"
                                        class="btn btn-success btn-small"
                                        @click="unbanUser(user)"
                                    >
                                        恢复
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div v-if="currentTab === 'songs'" class="admin-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <h2 style="font-size: 24px; color: var(--neon-cyan);">歌曲管理</h2>
                    <button class="btn btn-primary" @click="showSongModal = true">
                        + 添加歌曲
                    </button>
                </div>
                
                <div v-if="songLoading" class="loading">
                    <div class="loading-spinner"></div>
                </div>
                
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>歌曲名</th>
                            <th>艺术家</th>
                            <th>BPM</th>
                            <th>难度</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="song in songs" :key="song.id">
                            <td>{{ song.id }}</td>
                            <td>{{ song.title }}</td>
                            <td>{{ song.artist }}</td>
                            <td>{{ song.bpm }}</td>
                            <td>
                                <span class="difficulty-badge difficulty-easy" v-if="song.easy_enabled">E{{ song.easy_level }}</span>
                                <span class="difficulty-badge difficulty-normal" v-if="song.normal_enabled">N{{ song.normal_level }}</span>
                                <span class="difficulty-badge difficulty-hard" v-if="song.hard_enabled">H{{ song.hard_level }}</span>
                            </td>
                            <td>
                                <span class="badge" :class="song.enabled ? 'badge-active' : 'badge-muted'">
                                    {{ song.enabled ? '启用' : '禁用' }}
                                </span>
                            </td>
                            <td>
                                <div class="data-table-actions">
                                    <button class="btn btn-secondary btn-small" @click="editSong(song)">
                                        编辑
                                    </button>
                                    <button 
                                        class="btn"
                                        :class="song.enabled ? 'btn-warning' : 'btn-success'"
                                        style="font-size: 12px; padding: 6px 12px; border-radius: 6px;"
                                        @click="toggleSong(song)"
                                    >
                                        {{ song.enabled ? '禁用' : '启用' }}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div v-if="currentTab === 'instruments'" class="admin-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <h2 style="font-size: 24px; color: var(--neon-cyan);">乐器管理</h2>
                    <button class="btn btn-primary" @click="showInstrumentModal = true">
                        + 添加乐器
                    </button>
                </div>
                
                <div v-if="instrumentLoading" class="loading">
                    <div class="loading-spinner"></div>
                </div>
                
                <table v-else class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>图标</th>
                            <th>名称</th>
                            <th>键位数量</th>
                            <th>解锁等级</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="instrument in instruments" :key="instrument.id">
                            <td>{{ instrument.id }}</td>
                            <td style="font-size: 24px;">{{ instrument.icon }}</td>
                            <td>{{ instrument.name }}</td>
                            <td>{{ instrument.key_count }}</td>
                            <td>Lv.{{ instrument.unlock_level }}</td>
                            <td>
                                <span class="badge" :class="instrument.enabled ? 'badge-active' : 'badge-muted'">
                                    {{ instrument.enabled ? '启用' : '禁用' }}
                                </span>
                            </td>
                            <td>
                                <div class="data-table-actions">
                                    <button class="btn btn-secondary btn-small" @click="editInstrument(instrument)">
                                        编辑
                                    </button>
                                    <button 
                                        class="btn"
                                        :class="instrument.enabled ? 'btn-warning' : 'btn-success'"
                                        style="font-size: 12px; padding: 6px 12px; border-radius: 6px;"
                                        @click="toggleInstrument(instrument)"
                                    >
                                        {{ instrument.enabled ? '禁用' : '启用' }}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div v-if="showSongModal" class="modal-overlay" @click.self="showSongModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">{{ editingSong ? '编辑歌曲' : '添加歌曲' }}</h3>
                        <button class="modal-close" @click="showSongModal = false">&times;</button>
                    </div>
                    
                    <form @submit.prevent="saveSong">
                        <div class="form-group">
                            <label class="form-label">歌曲名称</label>
                            <input type="text" class="form-input" v-model="songForm.title" placeholder="请输入歌曲名称" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">艺术家</label>
                            <input type="text" class="form-input" v-model="songForm.artist" placeholder="请输入艺术家" required />
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">BPM</label>
                                <input type="number" class="form-input" v-model.number="songForm.bpm" placeholder="BPM" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">流派</label>
                                <select class="form-input" v-model="songForm.genre">
                                    <option value="流行">流行</option>
                                    <option value="摇滚">摇滚</option>
                                    <option value="电子">电子</option>
                                    <option value="古典">古典</option>
                                    <option value="动漫">动漫</option>
                                    <option value="游戏">游戏</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">简单难度</label>
                                <input type="number" class="form-input" v-model.number="songForm.easy_level" placeholder="1-25" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">普通难度</label>
                                <input type="number" class="form-input" v-model.number="songForm.normal_level" placeholder="1-25" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">困难难度</label>
                                <input type="number" class="form-input" v-model.number="songForm.hard_level" placeholder="1-25" />
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="showSongModal = false">取消</button>
                            <button type="submit" class="btn btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div v-if="showInstrumentModal" class="modal-overlay" @click.self="showInstrumentModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">{{ editingInstrument ? '编辑乐器' : '添加乐器' }}</h3>
                        <button class="modal-close" @click="showInstrumentModal = false">&times;</button>
                    </div>
                    
                    <form @submit.prevent="saveInstrument">
                        <div class="form-group">
                            <label class="form-label">乐器名称</label>
                            <input type="text" class="form-input" v-model="instrumentForm.name" placeholder="请输入乐器名称" required />
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">图标 (Emoji)</label>
                                <input type="text" class="form-input" v-model="instrumentForm.icon" placeholder="🎹" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">键位数量</label>
                                <input type="number" class="form-input" v-model.number="instrumentForm.key_count" placeholder="4-7" min="4" max="7" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">解锁等级</label>
                                <input type="number" class="form-input" v-model.number="instrumentForm.unlock_level" placeholder="1" min="1" required />
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">键位配置 (逗号分隔)</label>
                            <input type="text" class="form-input" v-model="instrumentForm.keys" placeholder="D,F,J,K" required />
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="showInstrumentModal = false">取消</button>
                            <button type="submit" class="btn btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    props: {
        user: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['navigate'],
    setup(props) {
        const { ref, reactive, computed, onMounted } = Vue;
        
        const tabs = [
            { id: 'statistics', name: '数据统计', icon: '📊' },
            { id: 'users', name: '用户管理', icon: '👥' },
            { id: 'songs', name: '歌曲管理', icon: '🎵' },
            { id: 'instruments', name: '乐器管理', icon: '🎸' }
        ];
        
        const currentTab = ref('statistics');
        
        const stats = ref({
            totalUsers: 1256,
            totalSongs: 48,
            totalGames: 28456,
            totalScore: 89723450,
            todayGames: 156,
            totalInstruments: 8,
            totalAchievements: 32,
            totalCoins: 1256800
        });
        
        const userSearch = ref('');
        const userLoading = ref(false);
        const users = ref([]);
        
        const songLoading = ref(false);
        const songs = ref([]);
        const showSongModal = ref(false);
        const editingSong = ref(null);
        const songForm = reactive({
            title: '',
            artist: '',
            bpm: 120,
            genre: '流行',
            easy_level: 5,
            normal_level: 10,
            hard_level: 18
        });
        
        const instrumentLoading = ref(false);
        const instruments = ref([]);
        const showInstrumentModal = ref(false);
        const editingInstrument = ref(null);
        const instrumentForm = reactive({
            name: '',
            icon: '🎹',
            key_count: 4,
            unlock_level: 1,
            keys: 'D,F,J,K'
        });
        
        const filteredUsers = computed(() => {
            if (!userSearch.value.trim()) return users.value;
            const search = userSearch.value.toLowerCase();
            return users.value.filter(u => 
                u.username.toLowerCase().includes(search) || 
                u.nickname.toLowerCase().includes(search)
            );
        });
        
        const demoUsers = [
            { id: 1, username: 'admin', nickname: '管理员', level: 99, coins: 99999, status: 'active', created_at: '2024-01-01' },
            { id: 2, username: 'test', nickname: '测试玩家', level: 15, coins: 1500, status: 'active', created_at: '2024-01-15' },
            { id: 3, username: 'player1', nickname: '音乐达人', level: 32, coins: 8500, status: 'active', created_at: '2024-02-01' },
            { id: 4, username: 'player2', nickname: '节奏大师', level: 28, coins: 6200, status: 'active', created_at: '2024-02-10' },
            { id: 5, username: 'player3', nickname: '钢琴王子', level: 45, coins: 15000, status: 'active', created_at: '2024-02-15' },
            { id: 6, username: 'player4', nickname: '吉他英雄', level: 22, coins: 4200, status: 'muted', created_at: '2024-03-01' },
            { id: 7, username: 'player5', nickname: '鼓神', level: 38, coins: 12000, status: 'active', created_at: '2024-03-10' },
            { id: 8, username: 'player6', nickname: '新手玩家', level: 5, coins: 500, status: 'banned', created_at: '2024-03-15' }
        ];
        
        const demoSongs = [
            { id: 1, title: 'V3', artist: '贝多芬', bpm: 160, genre: '古典', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 5, normal_level: 10, hard_level: 18, enabled: true },
            { id: 2, title: '卡农', artist: '帕赫贝尔', bpm: 140, genre: '古典', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 4, normal_level: 8, hard_level: 15, enabled: true },
            { id: 3, title: '亡灵序曲', artist: 'Dreamtale', bpm: 170, genre: '摇滚', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 6, normal_level: 12, hard_level: 20, enabled: true },
            { id: 4, title: '克罗地亚狂想曲', artist: '马克西姆', bpm: 150, genre: '古典', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 7, normal_level: 13, hard_level: 22, enabled: true },
            { id: 5, title: 'Butter-Fly', artist: '和田光司', bpm: 145, genre: '动漫', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 5, normal_level: 11, hard_level: 19, enabled: true }
        ];
        
        const demoInstruments = [
            { id: 1, name: '键盘', icon: '🎹', key_count: 4, unlock_level: 1, keys: ['D', 'F', 'J', 'K'], enabled: true },
            { id: 2, name: '吉他', icon: '🎸', key_count: 5, unlock_level: 1, keys: ['S', 'D', 'F', 'J', 'K'], enabled: true },
            { id: 3, name: '贝斯', icon: '🎸', key_count: 6, unlock_level: 3, keys: ['S', 'D', 'F', 'J', 'K', 'L'], enabled: true },
            { id: 4, name: '鼓', icon: '🥁', key_count: 7, unlock_level: 5, keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L'], enabled: true }
        ];
        
        const loadUsers = async () => {
            userLoading.value = true;
            try {
                const result = await ApiService.get('/jinwutuan/user/list/get');
                if (result && result.code === 0 && result.data && result.data.items && result.data.items.length > 0) {
                    users.value = result.data.items.map(u => ({
                        ...u,
                        status: u.status === 0 ? 'active' : u.status === 1 ? 'muted' : 'banned'
                    }));
                } else {
                    users.value = demoUsers;
                }
            } catch (e) {
                users.value = demoUsers;
            } finally {
                userLoading.value = false;
            }
        };
        
        const loadSongs = async () => {
            songLoading.value = true;
            try {
                const result = await ApiService.get('/jinwutuan/song/list/get');
                if (result && result.code === 0 && result.data && result.data.items && result.data.items.length > 0) {
                    songs.value = result.data.items.map(s => ({
                        ...s,
                        easy_enabled: s.difficulty_easy > 0,
                        normal_enabled: s.difficulty_normal > 0,
                        hard_enabled: s.difficulty_hard > 0,
                        easy_level: Math.round(s.difficulty_easy || 5),
                        normal_level: Math.round(s.difficulty_normal || 10),
                        hard_level: Math.round(s.difficulty_hard || 18),
                        enabled: s.status === 0
                    }));
                } else {
                    songs.value = demoSongs;
                }
            } catch (e) {
                songs.value = demoSongs;
            } finally {
                songLoading.value = false;
            }
        };
        
        const loadInstruments = async () => {
            instrumentLoading.value = true;
            try {
                const result = await ApiService.get('/jinwutuan/instrument/list/get');
                if (result && result.code === 0 && result.data && result.data.items && result.data.items.length > 0) {
                    instruments.value = result.data.items.map((ins, i) => ({
                        ...ins,
                        icon: demoInstruments[i % demoInstruments.length].icon,
                        keys: demoInstruments[i % demoInstruments.length].keys,
                        enabled: ins.status === 0
                    }));
                } else {
                    instruments.value = demoInstruments;
                }
            } catch (e) {
                instruments.value = demoInstruments;
            } finally {
                instrumentLoading.value = false;
            }
        };
        
        const loadStats = async () => {
            try {
                const result = await ApiService.get('/jinwutuan/stats/dashboard/get');
                if (result && result.code === 0 && result.data) {
                    stats.value = { ...stats.value, ...result.data };
                }
            } catch (e) {
                console.error('Load stats error:', e);
            }
        };
        
        const muteUser = (user) => {
            user.status = 'muted';
        };
        
        const banUser = (user) => {
            user.status = 'banned';
        };
        
        const unbanUser = (user) => {
            user.status = 'active';
        };
        
        const editSong = (song) => {
            editingSong.value = song;
            Object.assign(songForm, song);
            showSongModal.value = true;
        };
        
        const toggleSong = (song) => {
            song.enabled = !song.enabled;
        };
        
        const saveSong = () => {
            if (editingSong.value) {
                Object.assign(editingSong.value, songForm);
            } else {
                const newSong = {
                    ...songForm,
                    id: songs.value.length + 1,
                    easy_enabled: !!songForm.easy_level,
                    normal_enabled: !!songForm.normal_level,
                    hard_enabled: !!songForm.hard_level,
                    enabled: true
                };
                songs.value.unshift(newSong);
            }
            showSongModal.value = false;
            editingSong.value = null;
            Object.assign(songForm, {
                title: '',
                artist: '',
                bpm: 120,
                genre: '流行',
                easy_level: 5,
                normal_level: 10,
                hard_level: 18
            });
        };
        
        const editInstrument = (instrument) => {
            editingInstrument.value = instrument;
            Object.assign(instrumentForm, {
                ...instrument,
                keys: Array.isArray(instrument.keys) ? instrument.keys.join(',') : instrument.keys
            });
            showInstrumentModal.value = true;
        };
        
        const toggleInstrument = (instrument) => {
            instrument.enabled = !instrument.enabled;
        };
        
        const saveInstrument = () => {
            const keys = instrumentForm.keys.split(',').map(k => k.trim().toUpperCase());
            
            if (editingInstrument.value) {
                Object.assign(editingInstrument.value, {
                    ...instrumentForm,
                    keys: keys
                });
            } else {
                const newInstrument = {
                    ...instrumentForm,
                    id: instruments.value.length + 1,
                    keys: keys,
                    enabled: true
                };
                instruments.value.unshift(newInstrument);
            }
            showInstrumentModal.value = false;
            editingInstrument.value = null;
            Object.assign(instrumentForm, {
                name: '',
                icon: '🎹',
                key_count: 4,
                unlock_level: 1,
                keys: 'D,F,J,K'
            });
        };
        
        onMounted(() => {
            loadUsers();
            loadSongs();
            loadInstruments();
            loadStats();
        });
        
        return {
            tabs,
            currentTab,
            stats,
            userSearch,
            userLoading,
            users,
            filteredUsers,
            songLoading,
            songs,
            showSongModal,
            editingSong,
            songForm,
            instrumentLoading,
            instruments,
            showInstrumentModal,
            editingInstrument,
            instrumentForm,
            muteUser,
            banUser,
            unbanUser,
            editSong,
            toggleSong,
            saveSong,
            editInstrument,
            toggleInstrument,
            saveInstrument
        };
    }
};
