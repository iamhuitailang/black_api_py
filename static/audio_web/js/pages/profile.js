const { onMounted, ref, computed } = Vue;

const ProfilePage = {
    template: `
        <div class="profile-page">
            <div class="page-title">个人中心</div>

            <div class="profile-header">
                <div class="avatar">👤</div>
                <div class="user-info">
                    <div class="username">小朋友</div>
                    <div class="user-stat">
                        <span>🎵 收藏 {{ s.favoriteIds.length }} 首</span>
                        <span>📋 歌单 {{ playlistCount }} 个</span>
                    </div>
                </div>
            </div>

            <el-tabs v-model="activeTab" class="profile-tabs">
                <el-tab-pane label="播放历史" name="history">
                    <div v-if="playHistory.length === 0" class="empty-state">
                        <div class="empty-state-icon">⏰</div>
                        <div class="empty-state-text">暂无播放记录</div>
                    </div>
                    <el-table v-else :data="playHistory" style="width: 100%" :header-cell-style="{ background: '#f5f7fa', color: '#333' }">
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
                        <el-table-column label="播放时间" width="160" align="center">
                            <template #default="{ row }">
                                <span style="color: #999;">{{ formatTime(row.played_at) }}</span>
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
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>

                <el-tab-pane label="收藏歌曲" name="favorites">
                    <div v-if="favoriteSongs.length === 0" class="empty-state">
                        <div class="empty-state-icon">❤️</div>
                        <div class="empty-state-text">暂无收藏歌曲</div>
                    </div>
                    <el-table v-else :data="favoriteSongs" style="width: 100%" :header-cell-style="{ background: '#f5f7fa', color: '#333' }">
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
                                    type="danger"
                                    @click="toggleFav(row.id)"
                                >❤️</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>

                <el-tab-pane label="喜欢歌曲" name="likes">
                    <div v-if="likedSongs.length === 0" class="empty-state">
                        <div class="empty-state-icon">💖</div>
                        <div class="empty-state-text">暂无喜欢歌曲</div>
                    </div>
                    <el-table v-else :data="likedSongs" style="width: 100%" :header-cell-style="{ background: '#f5f7fa', color: '#333' }">
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
                                    type="danger"
                                    @click="toggleFav(row.id)"
                                >❤️</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>
            </el-tabs>
        </div>
    `,
    setup() {
        const s = AudioStore.state;
        const activeTab = ref('history');
        const playHistory = ref([]);
        const favoriteSongs = ref([]);
        const likedSongs = ref([]);
        const playlistCount = ref(0);

        async function loadPlayHistory() {
            const res = await AudioAPI.playHistory.list({ page_size: 100 });
            if (res.code === 0) {
                playHistory.value = (res.data.items || []).map(item => ({
                    ...item.song,
                    played_at: item.played_at
                }));
            }
        }

        async function loadFavoriteSongs() {
            const res = await AudioAPI.favorite.list({ page_size: 100 });
            if (res.code === 0) {
                favoriteSongs.value = (res.data.items || []).map(item => item.song);
            }
        }

        async function loadLikedSongs() {
            likedSongs.value = favoriteSongs.value;
        }

        async function loadPlaylistCount() {
            const res = await AudioAPI.playlist.list({ page_size: 1 });
            if (res.code === 0) {
                playlistCount.value = res.data.total || 0;
            }
        }

        function playSong(song) {
            const list = activeTab.value === 'history' ? playHistory.value :
                        activeTab.value === 'favorites' ? favoriteSongs.value : likedSongs.value;
            AudioStore.setPlayList(list);
            const index = list.findIndex(ss => ss.id === song.id);
            AudioStore.playSong(song, index);
        }

        function isFavorited(songId) {
            return s.favoriteIds.includes(songId);
        }

        async function toggleFav(songId) {
            await AudioStore.toggleFavorite(songId);
            if (activeTab.value === 'favorites') {
                await loadFavoriteSongs();
            }
        }

        function formatTime(timeStr) {
            if (!timeStr) return '-';
            return timeStr.replace('T', ' ').substring(0, 16);
        }

        onMounted(() => {
            AudioStore.loadFavoriteIds();
            loadPlayHistory();
            loadFavoriteSongs();
            loadLikedSongs();
            loadPlaylistCount();
        });

        return {
            s,
            activeTab,
            playHistory,
            favoriteSongs,
            likedSongs,
            playlistCount,
            loadPlayHistory,
            loadFavoriteSongs,
            loadLikedSongs,
            loadPlaylistCount,
            playSong,
            isFavorited,
            toggleFav,
            formatTime
        };
    }
};