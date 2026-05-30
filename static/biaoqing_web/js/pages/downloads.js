(function() {
    const { ref, computed, onMounted } = Vue;
    
    window.DownloadsPage = {
        name: 'DownloadsPage',
        template: `
            <div class="downloads-container">
                <div class="page-header">
                    <h1>📥 下载记录</h1>
                    <p>共下载了 {{ total }} 个表情包</p>
                </div>
    
                <div class="empty-state" v-if="!loading && downloads.length === 0">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">还没有下载记录</div>
                    <div class="empty-hint" @click="goHome">去发现有趣的表情包 →</div>
                </div>
    
                <div class="downloads-list" v-if="downloads.length > 0">
                    <div class="download-item" v-for="item in downloads" :key="item.id">
                        <div class="download-preview">
                            <img :src="item.url" :alt="item.title" @click="viewDetail(item.emoji_id)">
                        </div>
                        <div class="download-info">
                            <div class="download-title" @click="viewDetail(item.emoji_id)">
                                {{ item.title || '暂无标题' }}
                            </div>
                            <div class="download-meta">
                                <span class="meta-item">📅 {{ Utils.formatTime(item.download_time || item.created_at) }}</span>
                                <span class="meta-item">👀 {{ Utils.formatNumber(item.view_count || 0) }}</span>
                                <span class="meta-item">❤️ {{ Utils.formatNumber(item.favorite_count || 0) }}</span>
                            </div>
                        </div>
                        <div class="download-actions">
                            <button class="action-btn primary" @click="downloadAgain(item)">
                                ⬇️ 重新下载
                            </button>
                            <button class="action-btn" @click="viewDetail(item.emoji_id)">
                                查看详情
                            </button>
                        </div>
                    </div>
                </div>
    
                <div class="load-more" v-if="loading">
                    <span class="loading-spinner"></span> 加载中...
                </div>
    
                <div class="load-more-btn" v-if="!loading && hasMore && downloads.length > 0" @click="loadMore">
                    加载更多
                </div>
    
                <div class="no-more" v-if="!loading && !hasMore && downloads.length > 0">
                    已加载全部内容
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
    
            const downloads = ref([]);
            const loading = ref(false);
            const page = ref(1);
            const pageSize = ref(20);
            const total = ref(0);
            const hasMore = ref(true);
    
            const isLoggedIn = computed(() => Auth.isLoggedIn());
    
            const loadDownloads = async (reset = false) => {
                if (reset) {
                    page.value = 1;
                    downloads.value = [];
                    hasMore.value = true;
                }
    
                loading.value = true;
                try {
                    const result = await API.emoji.getMyDownloads(page.value, pageSize.value);
                    if (result.code === 0 && result.data) {
                        const items = result.data.items || result.data || [];
                        downloads.value = reset ? items : [...downloads.value, ...items];
                        total.value = result.data.total || 0;
                        hasMore.value = downloads.value.length < total.value;
                    }
                } catch (error) {
                    console.error('Load downloads error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadMore = () => {
                page.value++;
                loadDownloads(false);
            };
    
            const viewDetail = (id) => {
                router.push({ name: 'detail', params: { id } });
            };
    
            const goHome = () => {
                router.push({ name: 'home' });
            };
    
            const downloadAgain = async (item) => {
                try {
                    const link = document.createElement('a');
                    link.href = item.url;
                    link.download = `emoji_${item.emoji_id}.gif`;
                    link.click();
                    Utils.showToast('下载成功', 'success');
                } catch (error) {
                    console.error('Download error:', error);
                    Utils.showToast('下载失败', 'error');
                }
            };
    
            onMounted(() => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
                    return;
                }
                loadDownloads(true);
            });
    
            return {
                downloads,
                loading,
                total,
                hasMore,
                isLoggedIn,
                loadDownloads,
                loadMore,
                viewDetail,
                goHome,
                downloadAgain,
                Utils
            };
        }
    };
})();
