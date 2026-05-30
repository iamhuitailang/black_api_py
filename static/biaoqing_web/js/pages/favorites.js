(function() {
    const { ref, computed, onMounted } = Vue;
    
    window.FavoritesPage = {
        name: 'FavoritesPage',
        template: `
            <div class="favorites-container">
                <div class="page-header">
                    <h1>❤️ 我的收藏</h1>
                    <p>共收藏了 {{ total }} 个表情包</p>
                </div>
    
                <div class="empty-state" v-if="!loading && emojis.length === 0">
                    <div class="empty-icon">💔</div>
                    <div class="empty-text">还没有收藏的表情包</div>
                    <div class="empty-hint" @click="goHome">去发现有趣的表情包 →</div>
                </div>
    
                <div class="emoji-grid" v-if="emojis.length > 0">
                    <div class="emoji-card" v-for="item in emojis" :key="item.id" @click="viewDetail(item.id)">
                        <div style="position: relative;">
                            <img :src="item.url" :alt="item.title" class="emoji-image">
                            <div class="favorite-btn active" @click.stop="toggleFavorite(item)">
                                ❤️
                            </div>
                        </div>
                        <div class="emoji-info">
                            <div class="emoji-title">{{ item.title || '暂无标题' }}</div>
                            <div class="emoji-stats">
                                <span class="emoji-stat">👀 {{ Utils.formatNumber(item.view_count || 0) }}</span>
                                <span class="emoji-stat">❤️ {{ Utils.formatNumber(item.favorite_count || 0) }}</span>
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
    
            const emojis = ref([]);
            const loading = ref(false);
            const page = ref(1);
            const pageSize = ref(20);
            const total = ref(0);
            const hasMore = ref(true);
    
            const isLoggedIn = computed(() => Auth.isLoggedIn());
    
            const loadFavorites = async (reset = false) => {
                if (reset) {
                    page.value = 1;
                    emojis.value = [];
                    hasMore.value = true;
                }
    
                loading.value = true;
                try {
                    const result = await API.emoji.getMyFavorites(page.value, pageSize.value);
                    if (result.code === 0 && result.data) {
                        const items = result.data.items || result.data || [];
                        emojis.value = reset ? items : [...emojis.value, ...items];
                        total.value = result.data.total || 0;
                        hasMore.value = emojis.value.length < total.value;
                    }
                } catch (error) {
                    console.error('Load favorites error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadMore = () => {
                page.value++;
                loadFavorites(false);
            };
    
            const viewDetail = (id) => {
                router.push({ name: 'detail', params: { id } });
            };
    
            const toggleFavorite = async (item) => {
                try {
                    const result = await API.emoji.toggleFavorite(item.id);
                    if (result.code === 0 && result.data && !result.data.is_favorited) {
                        emojis.value = emojis.value.filter(e => e.id !== item.id);
                        total.value--;
                        Utils.showToast('已取消收藏', 'success');
                    }
                } catch (error) {
                    console.error('Toggle favorite error:', error);
                }
            };
    
            const goHome = () => {
                router.push({ name: 'home' });
            };
    
            onMounted(() => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
                    return;
                }
                loadFavorites(true);
            });
    
            return {
                emojis,
                loading,
                total,
                hasMore,
                isLoggedIn,
                loadFavorites,
                loadMore,
                viewDetail,
                toggleFavorite,
                goHome,
                Utils
            };
        }
    };
})();
