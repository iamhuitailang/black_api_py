const { onMounted, ref, computed } = Vue;

const PlaylistPage = {
    template: `
        <div class="playlist-page">
            <div style="margin-bottom: 20px;">
                <el-button link @click="goBack" style="padding: 0;">← 返回歌单列表</el-button>
            </div>

            <div class="playlist-header" v-if="playlist">
                <div class="playlist-cover-large">{{ playlist.cover || '📀' }}</div>
                <div class="playlist-detail-info">
                    <div class="playlist-name">{{ playlist.name }}</div>
                    <div class="playlist-meta" style="color: #999;">
                        <span>{{ playlist.song_count || 0 }} 首歌</span>
                        <span style="margin-left: 16px;">创建于 {{ formatCreatedAt(playlist.created_at) }}</span>
                    </div>
                    <div class="playlist-desc" v-if="playlist.description" style="color: #666; margin-top: 8px;">
                        {{ playlist.description }}
                    </div>
                    <div style="margin-top: 16px;">
                        <el-button type="primary" @click="playAll" :disabled="songs.length === 0">▶️ 播放全部</el-button>
                        <el-button @click="showAddSongsDialog = true" :disabled="songs.length >= 1000">+ 添加歌曲</el-button>
                    </div>
                </div>
            </div>

            <div v-if="loading" style="text-align: center; padding: 40px;">
                <span style="font-size: 18px;">⏳ 加载中...</span>
            </div>

            <div v-else-if="songs.length === 0" class="empty-state">
                <div class="empty-state-icon">📀</div>
                <div class="empty-state-text">歌单里还没有歌曲</div>
                <el-button type="primary" style="margin-top: 12px;" @click="showAddSongsDialog = true">添加歌曲</el-button>
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
                <el-table-column prop="duration" label="时长" width="80" align="center">
                    <template #default="{ row }">
                        <span class="song-duration">{{ row.duration }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="160" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="playSong(row)">▶️ 播放</el-button>
                        <el-button
                            size="small"
                            :type="isFavorited(row.id) ? 'danger' : 'default'"
                            @click="toggleFav(row.id)"
                        >
                            {{ isFavorited(row.id) ? '❤️' : '🤍' }}
                        </el-button>
                        <el-button size="small" text type="danger" @click="removeSong(row)">移除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-dialog v-model="showAddSongsDialog" title="添加歌曲到歌单" width="700px">
                <div style="margin-bottom: 12px;">
                    <el-input
                        v-model="searchKeyword"
                        placeholder="搜索歌曲、歌手"
                        clearable
                        size="default"
                        @input="onSearchInput"
                    />
                </div>
                <div style="margin-bottom: 12px; color: #999;">已选 {{ selectedSongIds.length }} 首</div>
                <div style="max-height: 400px; overflow-y: auto;">
                    <el-table
                        :data="availableSongs"
                        style="width: 100%"
                        @selection-change="handleSelectionChange"
                    >
                        <el-table-column type="selection" width="50" :selectable="isSelectable" />
                        <el-table-column label="封面" width="60" align="center">
                            <template #default="{ row }">
                                <div class="song-cover" style="width: 40px; height: 40px; font-size: 20px;">{{ row.cover || '🎵' }}</div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="title" label="歌曲" min-width="140">
                            <template #default="{ row }">
                                <span class="song-title">{{ row.title }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="artist" label="歌手" width="120">
                            <template #default="{ row }">
                                <span class="song-artist">{{ row.artist }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="album" label="专辑" width="140">
                            <template #default="{ row }">
                                <span class="song-album">{{ row.album || '-' }}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <template #footer>
                    <el-button @click="showAddSongsDialog = false">取消</el-button>
                    <el-button type="primary" @click="addSongsToPlaylist" :disabled="selectedSongIds.length === 0">添加选中</el-button>
                </template>
            </el-dialog>
        </div>
    `,
    setup() {
        const s = AudioStore.state;
        const playlist = ref(null);
        const songs = ref([]);
        const loading = ref(false);
        const showAddSongsDialog = ref(false);
        const searchKeyword = ref('');
        const availableSongs = ref([]);
        const selectedSongIds = ref([]);
        let searchTimer = null;

        const playlistId = computed(() => s.currentPlaylist?.id);

        async function loadPlaylistDetail() {
            if (!playlistId.value) return;
            loading.value = true;
            try {
                const res = await AudioAPI.playlist.detail(playlistId.value);
                if (res.code === 0) {
                    playlist.value = res.data.playlist || res.data;
                    songs.value = res.data.songs || [];
                }
            } finally {
                loading.value = false;
            }
        }

        async function loadAvailableSongs() {
            const kw = searchKeyword.value.trim();
            const res = kw ?
                await AudioAPI.song.search({ keyword: kw, search_type: 'song', page: 1, page_size: 100 }) :
                await AudioAPI.song.list({ keyword: '', genre: '', page: 1, page_size: 100 });
            if (res.code === 0) {
                availableSongs.value = res.data.items || [];
            }
        }

        function onSearchInput() {
            if (searchTimer) clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                loadAvailableSongs();
            }, 200);
        }

        function handleSelectionChange(selection) {
            selectedSongIds.value = selection.map(s => s.id);
        }

        function isSelectable(row) {
            return !songs.value.find(ss => ss.id === row.id);
        }

        async function addSongsToPlaylist() {
            if (!playlistId.value || selectedSongIds.value.length === 0) return;
            const toAdd = selectedSongIds.value.filter(id =>
                !songs.value.find(ss => ss.id === id)
            );
            if (toAdd.length === 0) {
                ElementPlus.ElMessage.warning('歌曲已在歌单中');
                return;
            }
            await AudioAPI.playlist.addSongs(playlistId.value, toAdd);
            ElementPlus.ElMessage.success(`已添加 ${toAdd.length} 首歌曲`);
            showAddSongsDialog.value = false;
            loadPlaylistDetail();
        }

        async function removeSong(song) {
            try {
                await ElementPlus.ElMessageBox.confirm(`确定从歌单中移除「${song.title}」吗？`, '确认', { type: 'warning' });
                await AudioAPI.playlist.removeSong(playlistId.value, song.id);
                ElementPlus.ElMessage.success('已移除');
                loadPlaylistDetail();
            } catch (e) {}
        }

        function goBack() {
            AudioStore.setRoute('playlists');
        }

        function playAll() {
            if (songs.value.length === 0) return;
            AudioStore.setPlayList(songs.value);
            AudioStore.playSong(songs.value[0], 0);
        }

        function playSong(song) {
            AudioStore.setPlayList(songs.value);
            const index = songs.value.findIndex(ss => ss.id === song.id);
            AudioStore.playSong(song, index);
        }

        function isFavorited(songId) {
            return s.favoriteIds.includes(songId);
        }

        async function toggleFav(songId) {
            await AudioStore.toggleFavorite(songId);
        }

        function formatCreatedAt(timeStr) {
            if (!timeStr) return '-';
            return timeStr.substring(0, 10);
        }

        onMounted(() => {
            loadPlaylistDetail();
            loadAvailableSongs();
            AudioStore.loadFavoriteIds();
        });

        return {
            s,
            playlist,
            songs,
            loading,
            showAddSongsDialog,
            searchKeyword,
            availableSongs,
            selectedSongIds,
            loadPlaylistDetail,
            loadAvailableSongs,
            onSearchInput,
            handleSelectionChange,
            isSelectable,
            addSongsToPlaylist,
            removeSong,
            goBack,
            playAll,
            playSong,
            isFavorited,
            toggleFav,
            formatCreatedAt
        };
    }
};