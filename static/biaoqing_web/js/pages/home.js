(function() {
    const { ref, onMounted, reactive, computed } = Vue;

    window.HomePage = {
    name: 'HomePage',
    template: `
        <div>
            <div class="banner-section">
                <div class="banner-carousel">
                    🎉 海量表情包，尽在表情包合集 🎉
                </div>
            </div>

            <div class="category-nav">
                <div class="category-list">
                    <div class="category-item" :class="{ active: currentCategory === 0 }" @click="selectCategory(0)">
                        <div class="category-icon">🔥</div>
                        <div class="category-name">全部</div>
                    </div>
                    <div class="category-item" 
                         v-for="cat in categories" 
                         :key="cat.id"
                         :class="{ active: currentCategory === cat.id }"
                         @click="selectCategory(cat.id)">
                        <div class="category-icon">{{ cat.icon || '📦' }}</div>
                        <div class="category-name">{{ cat.name }}</div>
                    </div>
                </div>
            </div>

            <div class="hot-tags">
                <span class="hot-tag" v-for="tag in hotKeywords" :key="tag" @click="searchByKeyword(tag)">
                    {{ tag }}
                </span>
            </div>

            <div class="section-title">
                <span>🔥 热门表情包</span>
                <span class="section-actions" @click="viewMore('hot')">查看更多</span>
            </div>
            <div class="emoji-grid">
                <div class="emoji-card" v-for="emoji in hotEmojis" :key="emoji.id" @click="viewDetail(emoji.id)">
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
                        </div>
                        <div class="emoji-tags" v-if="emoji.tags && emoji.tags.length">
                            <span class="emoji-tag" v-for="tag in emoji.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-title">
                <span>🆕 最新上传</span>
                <span class="section-actions" @click="viewMore('latest')">查看更多</span>
            </div>
            <div class="emoji-grid">
                <div class="emoji-card" v-for="emoji in latestEmojis" :key="emoji.id" @click="viewDetail(emoji.id)">
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
                            <span class="emoji-stat">⬇️ {{ Utils.formatNumber(emoji.download_count || 0) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-title">
                <span>✨ 智能推荐</span>
                <span class="section-actions" @click="refreshRecommend">换一批</span>
            </div>
            <div class="emoji-grid">
                <div class="emoji-card" v-for="emoji in recommendEmojis" :key="emoji.id" @click="viewDetail(emoji.id)">
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
                            <span class="emoji-stat">👍 {{ Utils.formatNumber(emoji.like_count || 0) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-title">
                <span>🎲 随机推荐</span>
                <span class="section-actions" @click="refreshRandom">换一批</span>
            </div>
            <div class="emoji-grid">
                <div class="emoji-card" v-for="emoji in randomEmojis" :key="emoji.id" @click="viewDetail(emoji.id)">
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
                        </div>
                    </div>
                </div>
            </div>

            <div class="load-more" v-if="loading">
                <span class="loading-spinner"></span> 加载中...
            </div>
        </div>
    `,
    setup() {
        const router = VueRouter.useRouter();
        const route = VueRouter.useRoute();

        const categories = ref([]);
        const hotKeywords = ref([]);
        const hotEmojis = ref([]);
        const latestEmojis = ref([]);
        const recommendEmojis = ref([]);
        const randomEmojis = ref([]);
        const currentCategory = ref(0);
        const loading = ref(false);

        const isLoggedIn = computed(() => Auth.isLoggedIn());

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

        const loadHotKeywords = async () => {
            try {
                const result = await API.emoji.getHotKeywords(10);
                if (result.code === 0 && result.data) {
                    hotKeywords.value = result.data.map(item => typeof item === 'object' ? item.keyword : item).filter(k => k && k !== '[object Object]');
                }
            } catch (error) {
                console.error('Load hot keywords error:', error);
            }
        };

        const loadHotEmojis = async () => {
            try {
                const result = await API.emoji.getHotList(1, 8, currentCategory.value || null);
                if (result.code === 0 && result.data) {
                    hotEmojis.value = result.data.items;
                }
            } catch (error) {
                console.error('Load hot emojis error:', error);
            }
        };

        const loadLatestEmojis = async () => {
            try {
                const result = await API.emoji.getLatestList(1, 8, currentCategory.value || null);
                if (result.code === 0 && result.data) {
                    latestEmojis.value = result.data.items;
                }
            } catch (error) {
                console.error('Load latest emojis error:', error);
            }
        };

        const loadRecommendEmojis = async () => {
            try {
                const result = await API.emoji.getRecommendList(1, 8);
                if (result.code === 0 && result.data) {
                    recommendEmojis.value = result.data.items;
                }
            } catch (error) {
                console.error('Load recommend emojis error:', error);
            }
        };

        const loadRandomEmojis = async () => {
            try {
                const result = await API.emoji.getRandomList(8, currentCategory.value || null);
                if (result.code === 0 && result.data) {
                    randomEmojis.value = result.data;
                }
            } catch (error) {
                console.error('Load random emojis error:', error);
            }
        };

        const selectCategory = (catId) => {
            currentCategory.value = catId;
            loadHotEmojis();
            loadLatestEmojis();
            loadRandomEmojis();
        };

        const viewDetail = (id) => {
            router.push({ name: 'detail', params: { id } });
        };

        const viewMore = (type) => {
            router.push({ 
                name: 'search', 
                query: { 
                    sort: type,
                    category: currentCategory.value || undefined
                } 
            });
        };

        const searchByKeyword = (keyword) => {
            router.push({ name: 'search', query: { keyword } });
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

        const refreshRecommend = () => {
            loadRecommendEmojis();
        };

        const refreshRandom = () => {
            loadRandomEmojis();
        };

        onMounted(() => {
            loadCategories();
            loadHotKeywords();
            loadHotEmojis();
            loadLatestEmojis();
            loadRecommendEmojis();
            loadRandomEmojis();
        });

        return {
            categories,
            hotKeywords,
            hotEmojis,
            latestEmojis,
            recommendEmojis,
            randomEmojis,
            currentCategory,
            loading,
            isLoggedIn,
            selectCategory,
            viewDetail,
            viewMore,
            searchByKeyword,
            toggleFavorite,
            refreshRecommend,
            refreshRandom,
            Utils
        };
    }
};
})();
