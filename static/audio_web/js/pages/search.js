const { computed, onMounted, onBeforeUnmount, ref, watch } = Vue;

const SearchPage = {
    template: `
        <div class="search-page">
            <div class="page-title">搜索</div>

            <div style="margin-bottom: 20px;">
                <el-input
                    v-model="keyword"
                    placeholder="搜索歌曲、歌手、专辑"
                    size="large"
                    clearable
                    @input="handleSearchInput"
                    @keyup.enter="doSearch"
                >
                    <template #prefix>🔍</template>
                </el-input>
                <div style="margin-top: 8px;">
                    <el-radio-group v-model="searchType" size="default" @change="doSearch">
                        <el-radio-button label="song">歌曲</el-radio-button>
                        <el-radio-button label="artist">歌手</el-radio-button>
                        <el-radio-button label="album">专辑</el-radio-button>
                    </el-radio-group>
                </div>
            </div>

            <div v-if="!hasSearched">
                <div class="search-history" v-if="searchHistory.length > 0">
                    <div class="search-history-title">
                        <span>搜索历史</span>
                        <el-button link type="danger" size="small" @click="clearSearchHistory">清空</el-button>
                    </div>
                    <div class="search-history-tags">
                        <span
                            v-for="(item, idx) in searchHistory"
                            :key="idx"
                            class="search-tag"
                            @click="searchByHistory(item)"
                        >{{ item.keyword }}</span>
                    </div>
                </div>

                <div class="hot-search" v-if="hotSearches.length > 0">
                    <div class="hot-search-title">🔥 热门搜索</div>
                    <div class="hot-search-list">
                        <span
                            v-for="(item, idx) in hotSearches"
                            :key="idx"
                            class="search-tag"
                            @click="searchByHot(item)"
                        >{{ item }}</span>
                    </div>
                </div>
            </div>

            <div v-else>
                <div v-if="loading" style="text-align: center; padding: 40px;">
                    <span style="font-size: 18px;">⏳ 搜索中...</span>
                </div>

                <div v-else-if="results.length === 0" class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">未找到相关歌曲</div>
                </div>

                <div v-else>
                    <div style="margin-bottom: 12px; color: #999;">
                        找到 {{ total }} 个结果
                    </div>
                    <el-table :data="results" style="width: 100%" :header-cell-style="{ background: '#f5f7fa', color: '#333' }">
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
                </div>
            </div>
        </div>
    `,
    setup() {
        const s = AudioStore.state;
        const keyword = ref(s.searchKeyword || '');
        const searchType = ref('song');
        const results = ref([]);
        const total = ref(0);
        const loading = ref(false);
        const hasSearched = ref(false);
        const searchHistory = ref([]);
        const hotSearches = ref([]);
        let searchTimer = null;

        function handleSearchInput() {
            if (searchTimer) clearTimeout(searchTimer);
            if (!keyword.value.trim()) {
                hasSearched.value = false;
                return;
            }
            searchTimer = setTimeout(() => {
                doSearch();
            }, 300);
        }

        async function doSearch() {
            const kw = keyword.value.trim();
            if (!kw) {
                hasSearched.value = false;
                return;
            }
            loading.value = true;
            hasSearched.value = true;
            try {
                const res = await AudioAPI.song.search({
                    keyword: kw,
                    search_type: searchType.value,
                    page: 1,
                    page_size: 50
                });
                if (res.code === 0) {
                    results.value = res.data.items || [];
                    total.value = res.data.total || 0;
                }
                await AudioAPI.searchHistory.record(kw, searchType.value);
                loadSearchHistory();
            } finally {
                loading.value = false;
            }
        }

        function searchByHistory(item) {
            keyword.value = item.keyword;
            searchType.value = item.search_type || 'song';
            doSearch();
        }

        function searchByHot(kw) {
            keyword.value = kw;
            searchType.value = 'song';
            doSearch();
        }

        async function loadSearchHistory() {
            const res = await AudioAPI.searchHistory.list();
            if (res.code === 0) {
                searchHistory.value = res.data || [];
            }
        }

        async function loadHotSearches() {
            const res = await AudioAPI.song.hotSearches();
            if (res.code === 0) {
                hotSearches.value = res.data || [];
            }
        }

        async function clearSearchHistory() {
            try {
                await ElementPlus.ElMessageBox.confirm('确定要清空搜索历史吗？', '确认', { type: 'warning' });
                await AudioAPI.searchHistory.clear();
                searchHistory.value = [];
            } catch (e) {}
        }

        function playSong(song) {
            AudioStore.setPlayList(results.value);
            const index = results.value.findIndex(s => s.id === song.id);
            AudioStore.playSong(song, index);
        }

        function isFavorited(songId) {
            return s.favoriteIds.includes(songId);
        }

        async function toggleFav(songId) {
            await AudioStore.toggleFavorite(songId);
        }

        onMounted(() => {
            loadSearchHistory();
            loadHotSearches();
            if (keyword.value.trim()) {
                hasSearched.value = true;
                doSearch();
            }
        });

        onBeforeUnmount(() => {
            if (searchTimer) clearTimeout(searchTimer);
        });

        return {
            keyword,
            searchType,
            results,
            total,
            loading,
            hasSearched,
            searchHistory,
            hotSearches,
            handleSearchInput,
            doSearch,
            searchByHistory,
            searchByHot,
            clearSearchHistory,
            playSong,
            isFavorited,
            toggleFav
        };
    }
};