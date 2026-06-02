const HomePage = {
    template: `
        <div>
            <div class="page-header">
                <h1 class="page-title">歌曲选择</h1>
                <p class="page-subtitle">选择你喜欢的歌曲，开始你的音乐之旅</p>
            </div>
            
            <div class="search-bar">
                <input 
                    type="text" 
                    class="search-input" 
                    v-model="searchQuery" 
                    placeholder="搜索歌曲或艺术家..."
                />
            </div>
            
            <div class="genre-filter" style="margin-bottom: 25px;">
                <span 
                    v-for="genre in genres" 
                    :key="genre"
                    class="genre-tag"
                    :class="{ active: selectedGenre === genre }"
                    @click="selectedGenre = genre"
                >
                    {{ genre }}
                </span>
            </div>
            
            <div v-if="loading" class="loading">
                <div class="loading-spinner"></div>
            </div>
            
            <div v-else class="song-grid">
                <div 
                    v-for="song in filteredSongs" 
                    :key="song.id"
                    class="song-card"
                    @click="selectSong(song)"
                >
                    <div class="song-cover" :style="{ background: song.coverGradient }">
                        {{ song.icon }}
                    </div>
                    <div class="song-info">
                        <div class="song-title">{{ song.title }}</div>
                        <div class="song-artist">{{ song.artist }}</div>
                        <div class="song-meta">
                            <span>BPM: {{ song.bpm }}</span>
                            <div class="difficulty-badges">
                                <span class="difficulty-badge difficulty-easy" v-if="song.easy_enabled">E</span>
                                <span class="difficulty-badge difficulty-normal" v-if="song.normal_enabled">N</span>
                                <span class="difficulty-badge difficulty-hard" v-if="song.hard_enabled">H</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div v-if="!loading && filteredSongs.length === 0" class="empty-state">
                <div class="empty-state-icon">🎵</div>
                <div class="empty-state-text">没有找到匹配的歌曲</div>
            </div>
        </div>
    `,
    emits: ['navigate'],
    setup(props, { emit }) {
        const { ref, computed, onMounted } = Vue;
        
        const searchQuery = ref('');
        const selectedGenre = ref('全部');
        const loading = ref(true);
        const songs = ref([]);
        
        const genres = ['全部', '流行', '摇滚', '电子', '古典', '动漫', '游戏'];
        
        const demoSongs = [
            { id: 1, title: 'V3', artist: '贝多芬', bpm: 160, genre: '古典', icon: '🎹', coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 5, normal_level: 10, hard_level: 18 },
            { id: 2, title: '卡农', artist: '帕赫贝尔', bpm: 140, genre: '古典', icon: '🎻', coverGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 4, normal_level: 8, hard_level: 15 },
            { id: 3, title: '亡灵序曲', artist: 'Dreamtale', bpm: 170, genre: '摇滚', icon: '🎸', coverGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 6, normal_level: 12, hard_level: 20 },
            { id: 4, title: '克罗地亚狂想曲', artist: '马克西姆', bpm: 150, genre: '古典', icon: '🎼', coverGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 7, normal_level: 13, hard_level: 22 },
            { id: 5, title: 'Butter-Fly', artist: '和田光司', bpm: 145, genre: '动漫', icon: '🦋', coverGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 5, normal_level: 11, hard_level: 19 },
            { id: 6, title: '千本樱', artist: '初音未来', bpm: 155, genre: '动漫', icon: '🌸', coverGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 6, normal_level: 14, hard_level: 23 },
            { id: 7, title: 'Tetris Theme', artist: '游戏原声', bpm: 180, genre: '游戏', icon: '🎮', coverGradient: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 8, normal_level: 15, hard_level: 25 },
            { id: 8, title: 'Faded', artist: 'Alan Walker', bpm: 120, genre: '电子', icon: '🎧', coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 3, normal_level: 7, hard_level: 14 },
            { id: 9, title: 'Alone', artist: 'Marshmello', bpm: 140, genre: '电子', icon: '🎵', coverGradient: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 4, normal_level: 9, hard_level: 16 },
            { id: 10, title: '光辉岁月', artist: 'Beyond', bpm: 135, genre: '流行', icon: '🎤', coverGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 5, normal_level: 10, hard_level: 17 },
            { id: 11, title: '海阔天空', artist: 'Beyond', bpm: 130, genre: '流行', icon: '🌊', coverGradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 4, normal_level: 9, hard_level: 16 },
            { id: 12, title: 'Sweet Child O Mine', artist: 'Guns N Roses', bpm: 126, genre: '摇滚', icon: '🎸', coverGradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', easy_enabled: true, normal_enabled: true, hard_enabled: true, easy_level: 6, normal_level: 12, hard_level: 21 }
        ];
        
        const filteredSongs = computed(() => {
            return songs.value.filter(song => {
                const matchesSearch = song.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                                     song.artist.toLowerCase().includes(searchQuery.value.toLowerCase());
                const matchesGenre = selectedGenre.value === '全部' || song.genre === selectedGenre.value;
                return matchesSearch && matchesGenre;
            });
        });
        
        const selectSong = (song) => {
            Storage.save('selectedSong', song);
            emit('navigate', 'instrument-select');
        };
        
        const loadSongs = async () => {
            loading.value = true;
            try {
                const result = await ApiService.get('/jinwutuan/song/list/get');
                if (result && result.code === 0 && result.data && result.data.items && result.data.items.length > 0) {
                    songs.value = result.data.items.map((s, i) => ({
                        ...s,
                        icon: demoSongs[i % demoSongs.length].icon,
                        coverGradient: demoSongs[i % demoSongs.length].coverGradient,
                        easy_enabled: s.difficulty_easy > 0,
                        normal_enabled: s.difficulty_normal > 0,
                        hard_enabled: s.difficulty_hard > 0,
                        easy_level: Math.round(s.difficulty_easy || 5),
                        normal_level: Math.round(s.difficulty_normal || 10),
                        hard_level: Math.round(s.difficulty_hard || 18),
                        genre: s.genre || '流行'
                    }));
                } else {
                    songs.value = demoSongs;
                }
            } catch (e) {
                songs.value = demoSongs;
            } finally {
                loading.value = false;
            }
        };
        
        onMounted(() => {
            loadSongs();
        });
        
        return {
            searchQuery,
            selectedGenre,
            genres,
            loading,
            songs,
            filteredSongs,
            selectSong
        };
    }
};
