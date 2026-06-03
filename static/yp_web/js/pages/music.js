const MusicPage = {
    data() {
        return {
            user: null,
            musicList: [],
            myMusic: [],
            activeTab: 'all',
            loading: false,
            uploading: false,
            showUploadModal: false,
            selectedFile: null,
            musicName: '',
            musicArtist: ''
        };
    },
    template: `
        <div class="main-layout">
            <header class="header">
                <div class="header-left">
                    <div class="header-logo">🎵 音乐</div>
                </div>
                <div class="user-info">
                    <div class="user-coins">💰 {{ user ? user.coins : 0 }}</div>
                    <div class="user-avatar">{{ user ? user.nickname.charAt(0).toUpperCase() : 'U' }}</div>
                </div>
            </header>

            <div class="content">
                <h1 class="page-title">选择音乐</h1>

                <div class="tabs">
                    <div 
                        class="tab" 
                        :class="{ active: activeTab === 'all' }"
                        @click="activeTab = 'all'"
                    >
                        全部音乐
                    </div>
                    <div 
                        class="tab" 
                        :class="{ active: activeTab === 'favorite' }"
                        @click="activeTab = 'favorite'"
                    >
                        我的收藏
                    </div>
                    <div 
                        class="tab" 
                        :class="{ active: activeTab === 'custom' }"
                        @click="activeTab = 'custom'"
                    >
                        自定义
                    </div>
                </div>

                <div v-if="activeTab === 'custom'" class="card" style="margin-bottom: 16px;">
                    <div class="upload-area" @click="triggerUpload">
                        <input 
                            type="file" 
                            ref="fileInput" 
                            style="display: none;" 
                            accept=".mp3,.wav,.ogg,.m4a"
                            @change="onFileSelect"
                        />
                        <div class="upload-icon">🎵</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">
                            {{ selectedFile ? selectedFile.name : '点击上传自定义音乐' }}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 13px;">
                            支持 MP3、WAV、OGG、M4A 格式
                        </div>
                    </div>
                    <div v-if="selectedFile" style="margin-top: 16px;">
                        <div class="form-group">
                            <label>歌曲名称</label>
                            <input v-model="musicName" type="text" placeholder="请输入歌曲名称" />
                        </div>
                        <div class="form-group">
                            <label>艺术家</label>
                            <input v-model="musicArtist" type="text" placeholder="请输入艺术家名称" />
                        </div>
                        <button 
                            class="btn btn-primary btn-block" 
                            :disabled="uploading || !musicName"
                            @click="uploadMusic"
                        >
                            {{ uploading ? '上传中...' : '上传音乐' }}
                        </button>
                    </div>
                </div>

                <div v-if="loading" class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <div class="empty-text">加载中...</div>
                </div>
                <div v-else-if="displayMusic.length === 0" class="empty-state">
                    <div class="empty-icon">🎵</div>
                    <div class="empty-text">暂无音乐</div>
                </div>
                <div v-else class="grid grid-2">
                    <div 
                        v-for="music in displayMusic" 
                        :key="music.id"
                        class="card music-card"
                        @click="playMusic(music)"
                    >
                        <div class="music-cover" :style="{ background: getMusicCover(music) }">
                            {{ getMusicEmoji(music) }}
                        </div>
                        <div class="music-info">
                            <div class="music-name">{{ music.name }}</div>
                            <div class="music-artist">{{ music.artist }}</div>
                            <div class="music-meta">
                                <span class="music-bpm">🎵 {{ music.bpm }} BPM</span>
                                <span 
                                    class="music-difficulty"
                                    :class="'difficulty-' + Utils.getDifficultyClass(music.difficulty)"
                                >
                                    {{ Utils.getDifficultyText(music.difficulty) }}
                                </span>
                                <span v-if="music.is_favorite" style="color: var(--warning);">⭐</span>
                            </div>
                        </div>
                        <button 
                            class="btn btn-primary"
                            @click.stop="toggleFavorite(music)"
                            style="padding: 8px 16px; font-size: 14px;"
                        >
                            {{ music.is_favorite ? '取消' : '收藏' }}
                        </button>
                    </div>
                </div>
            </div>

            <nav class="nav-bar">
                <div class="nav-item" @click="goToHome">
                    <div class="nav-icon">🏠</div>
                    <div class="nav-label">首页</div>
                </div>
                <div class="nav-item active" @click="goToMusic">
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
    computed: {
        displayMusic() {
            if (this.activeTab === 'all') {
                return this.musicList;
            } else if (this.activeTab === 'favorite') {
                return this.musicList.filter(m => m.is_favorite);
            } else {
                return this.myMusic;
            }
        }
    },
    methods: {
        async loadData() {
            this.user = Auth.getUser();
            this.loading = true;

            const [allRes, myRes] = await Promise.all([
                YpAPI.music.list(),
                YpAPI.music.my()
            ]);

            this.loading = false;

            if (allRes.code === 0 && allRes.data) {
                this.musicList = allRes.data.items || allRes.data || [];
            }

            if (myRes.code === 0 && myRes.data) {
                this.myMusic = myRes.data.items || myRes.data || [];
            }
        },
        getMusicCover(music) {
            const gradients = [
                'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
                'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
            ];
            return gradients[music.id % gradients.length];
        },
        getMusicEmoji(music) {
            const emojis = ['🎹', '🎸', '🎺', '🎻', '🥁', '🎤', '🎧'];
            return emojis[music.id % emojis.length];
        },
        triggerUpload() {
            this.$refs.fileInput.click();
        },
        onFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                this.selectedFile = file;
                if (!this.musicName) {
                    this.musicName = file.name.replace(/\.[^/.]+$/, '');
                }
            }
        },
        async uploadMusic() {
            if (!this.selectedFile || !this.musicName) {
                Utils.showToast('请填写完整信息', 'error');
                return;
            }

            this.uploading = true;
            const response = await YpAPI.music.upload(this.selectedFile, {
                name: this.musicName,
                artist: this.musicArtist || '未知艺术家'
            });
            this.uploading = false;

            if (response.code === 0) {
                Utils.showToast('上传成功', 'success');
                this.selectedFile = null;
                this.musicName = '';
                this.musicArtist = '';
                this.loadData();
            } else {
                Utils.showToast(response.msg || '上传失败', 'error');
            }
        },
        async toggleFavorite(music) {
            const response = await YpAPI.music.favorite({
                music_id: music.id,
                is_favorite: !music.is_favorite
            });

            if (response.code === 0) {
                music.is_favorite = !music.is_favorite;
                Utils.showToast(music.is_favorite ? '已收藏' : '已取消收藏', 'success');
            } else {
                Utils.showToast(response.msg || '操作失败', 'error');
            }
        },
        playMusic(music) {
            Router.navigate('game', { musicId: music.id });
        },
        goToHome() {
            Router.navigate('home');
        },
        goToMusic() {},
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
