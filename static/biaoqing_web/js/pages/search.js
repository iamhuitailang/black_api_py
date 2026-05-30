(function() {
    const { ref, onMounted, onBeforeUnmount, reactive, computed, watch } = Vue;
    
    window.SearchPage = {
        name: 'SearchPage',
        template: `
            <div>
                <div class="search-header">
                    <div class="search-box">
                        <input 
                            type="text" 
                            class="search-input" 
                            v-model="searchKeyword"
                            @keyup.enter="doSearch"
                            placeholder="搜索表情包..."
                        >
                        <button class="search-btn" @click="doSearch">搜索</button>
                    </div>
                </div>
    
                <div class="search-history" v-if="showHistory && searchHistory.length">
                    <div class="history-header">
                        <span>搜索历史</span>
                        <span class="clear-history" @click="clearHistory">清空</span>
                    </div>
                    <div class="history-list">
                        <span 
                            class="history-item" 
                            v-for="(item, index) in searchHistory" 
                            :key="index"
                            @click="searchByHistory(item)">
                            {{ item }}
                        </span>
                    </div>
                </div>
    
                <div class="search-actions">
                    <div class="sort-options">
                        <span 
                            class="sort-option" 
                            :class="{ active: sortBy === 'hot' }"
                            @click="changeSort('hot')">
                            🔥 最热
                        </span>
                        <span 
                            class="sort-option" 
                            :class="{ active: sortBy === 'latest' }"
                            @click="changeSort('latest')">
                            🆕 最新
                        </span>
                        <span 
                            class="sort-option" 
                            :class="{ active: sortBy === 'downloads' }"
                            @click="changeSort('downloads')">
                            ⬇️ 下载最多
                        </span>
                        <span 
                            class="sort-option" 
                            :class="{ active: sortBy === 'favorites' }"
                            @click="changeSort('favorites')">
                            ❤️ 收藏最多
                        </span>
                    </div>
    
                    <div class="filter-options">
                        <select class="filter-select" v-model="selectedCategory" @change="applyFilters">
                            <option :value="0">全部分类</option>
                            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                                {{ cat.name }}
                            </option>
                        </select>
                    </div>
                </div>
    
                <div class="search-result-info" v-if="searchPerformed">
                    共找到 <span class="highlight">{{ total }}</span> 个表情包
                </div>
    
                <div class="empty-state" v-if="searchPerformed && emojis.length === 0">
                    <div class="empty-icon">😅</div>
                    <div class="empty-text">暂无搜索结果</div>
                    <div class="empty-hint">换个关键词试试吧</div>
                </div>
    
                <div class="emoji-grid">
                    <div class="emoji-card" v-for="emoji in emojis" :key="emoji.id" @click="viewDetail(emoji.id)">
                        <div style="position: relative;">
                            <img :src="emoji.url" :alt="emoji.title" class="emoji-image">
                            <div class="favorite-btn" 
                                 :class="{ active: emoji.is_favorited }"
                                 @click.stop="toggleFavorite(emoji)">
                                {{ emoji.is_favorited ? '❤️' : '🤍' }}
                            </div>
                        </div>
                        <div class="emoji-info">
                            <div class="emoji-title">{{ emoji.title || '暂无标题' }}</div>
                            <div class="emoji-stats">
                                <span class="emoji-stat">👀 {{ Utils.formatNumber(emoji.view_count || 0) }}</span>
                                <span class="emoji-stat">❤️ {{ Utils.formatNumber(emoji.favorite_count || 0) }}</span>
                                <span class="emoji-stat">⬇️ {{ Utils.formatNumber(emoji.download_count || 0) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
    
                <div class="load-more" v-if="loading">
                    <span class="loading-spinner"></span> 加载中...
                </div>
    
                <div class="load-more-btn" v-if="!loading && hasMore && emojis.length > 0" @click="loadMore">
                    加载更多
                </div>
    
                <div class="no-more" v-if="!loading && !hasMore && emojis.length > 0">
                    已加载全部内容
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
            const route = VueRouter.useRoute();
    
            const searchKeyword = ref('');
            const sortBy = ref('hot');
            const selectedCategory = ref(0);
            const emojis = ref([]);
            const categories = ref([]);
            const searchHistory = ref([]);
            const loading = ref(false);
            const page = ref(1);
            const pageSize = ref(20);
            const total = ref(0);
            const hasMore = ref(true);
            const searchPerformed = ref(false);
            const showHistory = ref(true);
    
            const isLoggedIn = computed(() => Auth.isLoggedIn());
    
            const saveHistory = (keyword) => {
                const history = Storage.getSearchHistory();
                const filtered = history.filter(h => h !== keyword);
                filtered.unshift(keyword);
                if (filtered.length > 20) {
                    filtered.pop();
                }
                Storage.setSearchHistory(filtered);
                searchHistory.value = filtered;
            };
    
            const doSearch = async (reset = false) => {
                if (reset) {
                    page.value = 1;
                    emojis.value = [];
                    hasMore.value = true;
                }
    
                if (!searchKeyword.value && sortBy.value === 'hot' && selectedCategory.value === 0) {
                    return;
                }
    
                loading.value = true;
                searchPerformed.value = true;
                showHistory.value = false;
    
                if (searchKeyword.value) {
                    saveHistory(searchKeyword.value);
                }
    
                try {
                    let result;
                    if (searchKeyword.value) {
                        result = await API.emoji.search(
                            searchKeyword.value,
                            page.value,
                            pageSize.value,
                            sortBy.value,
                            selectedCategory.value || null
                        );
                    } else {
                        if (sortBy.value === 'hot') {
                            result = await API.emoji.getHotList(
                                page.value,
                                pageSize.value,
                                selectedCategory.value || null
                            );
                        } else if (sortBy.value === 'latest') {
                            result = await API.emoji.getLatestList(
                                page.value,
                                pageSize.value,
                                selectedCategory.value || null
                            );
                        } else {
                            result = await API.emoji.search(
                                '',
                                page.value,
                                pageSize.value,
                                sortBy.value,
                                selectedCategory.value || null
                            );
                        }
                    }
    
                    if (result.code === 0 && result.data) {
                        const items = result.data.items || result.data || [];
                        emojis.value = reset ? items : [...emojis.value, ...items];
                        total.value = result.data.total || 0;
                        hasMore.value = emojis.value.length < total.value;
                    }
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadCategories = async () => {
                try {
                    const result = await API.category.getAll();
                    if (result.code === 0 && result.data) {
                        categories.value = result.data;
                    }
                } catch (error) {
                    console.error('Load categories error:', error);
                }
            };
    
            const loadHistory = () => {
                const history = Storage.getSearchHistory();
                searchHistory.value = history;
            };
    
            const clearHistory = () => {
                Storage.removeSearchHistory();
                searchHistory.value = [];
            };
    
            const searchByHistory = (keyword) => {
                searchKeyword.value = keyword;
                showHistory.value = false;
                doSearch(true);
            };
    
            const changeSort = (sort) => {
                sortBy.value = sort;
                doSearch(true);
            };
    
            const applyFilters = () => {
                doSearch(true);
            };
    
            watch(() => route.query, (query) => {
                if (query.keyword) {
                    searchKeyword.value = query.keyword;
                    showHistory.value = false;
                    doSearch(true);
                }
                if (query.sort) {
                    sortBy.value = query.sort;
                }
                if (query.category) {
                    selectedCategory.value = parseInt(query.category) || 0;
                }
            });
    
            const loadMore = () => {
                page.value++;
                doSearch(false);
            };
    
            const viewDetail = (id) => {
                router.push({ name: 'detail', params: { id } });
            };
    
            const toggleFavorite = async (emoji) => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login' });
                    return;
                }
    
                try {
                    const result = await API.emoji.toggleFavorite(emoji.id);
                    if (result.code === 0 && result.data) {
                        emoji.is_favorited = result.data.is_favorited;
                        Utils.showToast(result.data.is_favorited ? '收藏成功' : '已取消收藏', 'success');
                    }
                } catch (error) {
                    console.error('Toggle favorite error:', error);
                }
            };
    
            onMounted(() => {
                loadCategories();
                loadHistory();
                
                if (route.query.keyword) {
                    searchKeyword.value = route.query.keyword;
                    showHistory.value = false;
                    doSearch(true);
                } else if (route.query.sort || route.query.category) {
                    if (route.query.sort) {
                        sortBy.value = route.query.sort;
                    }
                    if (route.query.category) {
                        selectedCategory.value = parseInt(route.query.category) || 0;
                    }
                    showHistory.value = false;
                    doSearch(true);
                }
            });
    
            return {
                searchKeyword,
                sortBy,
                selectedCategory,
                emojis,
                categories,
                searchHistory,
                loading,
                total,
                hasMore,
                searchPerformed,
                showHistory,
                isLoggedIn,
                doSearch,
                loadMore,
                viewDetail,
                toggleFavorite,
                searchByHistory,
                clearHistory,
                changeSort,
                applyFilters,
                Utils
            };
        }
    };
})();
