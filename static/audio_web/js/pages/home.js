const { onMounted, ref } = Vue;

const HomePage = {
    template: `
        <div class="home-page">
            <div class="page-title">音乐库</div>

            <div style="margin-bottom: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
                <el-radio-group v-model="selectedGenre" size="default" @change="onGenreChange">
                    <el-radio-button label="">全部</el-radio-button>
                    <el-radio-button v-for="g in genres" :key="g" :label="g">{{ g }}</el-radio-button>
                </el-radio-group>
            </div>

            <div v-if="loading" style="text-align: center; padding: 40px;">
                <span style="font-size: 18px;">⏳ 加载中...</span>
            </div>

            <el-table v-else :data="songs" style="width: 100%" :header-cell-style="{ background: '#f5f7fa', color: '#333' }">
                <el-table-column label="#" width="60" align="center">
                    <template #default="{ $index }">
                        <span style="color: #999;">{{ $index + 1 }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="封面" width="70" align="center">
                    <template #default="{ row }">
                        <div class="song-cover">{{ row.cover || '🎵' }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="title" label="歌曲" min-width="160">
                    <template #default="{ row }">
                        <span class="song-title">{{ row.title }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="artist" label="歌手" width="140">
                    <template #default="{ row }">
                        <span class="song-artist">{{ row.artist }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="album" label="专辑" width="160">
                    <template #default="{ row }">
                        <span class="song-album">{{ row.album || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="genre" label="风格" width="80" align="center">
                    <template #default="{ row }">
                        <span class="genre-tag" v-if="row.genre">{{ row.genre }}</span>
                        <span v-else style="color: #ccc;">-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="duration" label="时长" width="80" align="center">
                    <template #default="{ row }">
                        <span class="song-duration">{{ row.duration }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="popularity" label="热度" width="80" align="center">
                    <template #default="{ row }">
                        <span class="song-popularity">{{ '🔥'.repeat(row.popularity) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="playSong(row)">▶️ 播放</el-button>
                        <el-button
                            size="small"
                            :type="isFavorited(row.id) ? 'danger' : 'default'"
                            @click="toggleFav(row.id)"
                        >
                            {{ isFavorited(row.id) ? '❤️' : '🤍' }}
                        </el-button>
                        <el-dropdown size="small" @command="(cmd) => handleCommand(cmd, row)">
                            <el-button size="small">更多</el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="add">添加到歌单</el-dropdown-item>
                                    <el-dropdown-item command="playNext" v-if="!isPlayingSong(row)">下一首播放</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </template>
                </el-table-column>
            </el-table>

            <div v-if="total > pageSize" style="margin-top: 16px; text-align: center;">
                <el-pagination
                    background
                    layout="prev, pager, next"
                    :total="total"
                    :page-size="pageSize"
                    v-model:current-page="currentPage"
                    @current-change="onPageChange"
                />
            </div>

            <el-dialog v-model="showAddDialog" title="添加到歌单" width="400px">
                <div v-if="playlists.length === 0" style="text-align: center; padding: 20px;">
                    <el-empty description="暂无歌单，请先创建" />
                    <el-button type="primary" style="margin-top: 12px;" @click="showAddDialog = false; goToPlaylists()">
                        创建歌单
                    </el-button>
                </div>
                <div v-else>
                    <el-checkbox-group v-model="selectedPlaylistIds">
                        <div v-for="pl in playlists" :key="pl.id" style="margin-bottom: 8px;">
                            <el-checkbox :value="pl.id" :label="pl.id">{{ pl.name }} ({{ pl.song_count }}首)</el-checkbox>
                        </div>
                    </el-checkbox-group>
                </div>
                <template #footer>
                    <el-button @click="showAddDialog = false">取消</el-button>
                    <el-button type="primary" @click="addToPlaylists" :disabled="selectedPlaylistIds.length === 0">添加</el-button>
                </template>
            </el-dialog>
        </div>
    `,
    setup() {
        const s = AudioStore.state;
        const songs = ref([]);
        const total = ref(0);
        const currentPage = ref(1);
        const pageSize = ref(20);
        const loading = ref(false);
        const selectedGenre = ref('');
        const genres = ref([]);
        const showAddDialog = ref(false);
        const selectedPlaylistIds = ref([]);
        const playlists = ref([]);
        const currentSongToAdd = ref(null);

        async function loadSongs() {
            loading.value = true;
            try {
                const res = await AudioAPI.song.list({
                    keyword: '',
                    genre: selectedGenre.value,
                    page: currentPage.value,
                    page_size: pageSize.value
                });
                if (res.code === 0) {
                    songs.value = res.data.items || [];
                    total.value = res.data.total || 0;
                }
            } finally {
                loading.value = false;
            }
        }

        async function loadGenres() {
            const res = await AudioAPI.song.genres();
            if (res.code === 0) {
                genres.value = res.data || [];
            }
        }

        async function loadPlaylists() {
            const res = await AudioAPI.playlist.list({ page_size: 50 });
            if (res.code === 0) {
                playlists.value = res.data.items || [];
            }
        }

        function onGenreChange() {
            currentPage.value = 1;
            loadSongs();
        }

        function onPageChange(page) {
            currentPage.value = page;
            loadSongs();
        }

        function playSong(song) {
            AudioStore.setPlayList(songs.value);
            const index = songs.value.findIndex(ss => ss.id === song.id);
            AudioStore.playSong(song, index);
        }

        function isFavorited(songId) {
            return s.favoriteIds.includes(songId);
        }

        function isPlayingSong(song) {
            return s.currentSong?.id === song.id;
        }

        async function toggleFav(songId) {
            await AudioStore.toggleFavorite(songId);
        }

        function handleCommand(cmd, row) {
            if (cmd === 'add') {
                currentSongToAdd.value = row;
                selectedPlaylistIds.value = [];
                loadPlaylists();
                showAddDialog.value = true;
            } else if (cmd === 'playNext') {
                const list = [...s.playList];
                const idx = s.currentIndex;
                list.splice(idx + 1, 0, row);
                AudioStore.setPlayList(list);
                ElementPlus.ElMessage.success('已添加到下一首播放');
            }
        }

        async function addToPlaylists() {
            for (const playlistId of selectedPlaylistIds.value) {
                await AudioAPI.playlist.addSongs(playlistId, [currentSongToAdd.value.id]);
            }
            ElementPlus.ElMessage.success('添加成功');
            showAddDialog.value = false;
        }

        function goToPlaylists() {
            AudioStore.setRoute('playlists');
        }

        onMounted(() => {
            loadSongs();
            loadGenres();
            AudioStore.loadFavoriteIds();
        });

        return {
            songs,
            total,
            currentPage,
            pageSize,
            loading,
            selectedGenre,
            genres,
            showAddDialog,
            selectedPlaylistIds,
            playlists,
            loadSongs,
            onGenreChange,
            onPageChange,
            playSong,
            isFavorited,
            isPlayingSong,
            toggleFav,
            handleCommand,
            addToPlaylists,
            goToPlaylists
        };
    }
};