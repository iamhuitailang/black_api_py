(function() {
    const { ref, computed, onMounted } = Vue;
    
    window.UploadsPage = {
        name: 'UploadsPage',
        template: `
            <div class="uploads-container">
                <div class="page-header">
                    <h1>📤 我的上传</h1>
                    <p>共上传了 {{ total }} 个表情包</p>
                </div>
    
                <div class="upload-actions">
                    <div class="status-tabs">
                        <span 
                            class="status-tab" 
                            :class="{ active: statusFilter === 'all' }"
                            @click="statusFilter = 'all'; loadUploads(true)">
                            全部
                        </span>
                        <span 
                            class="status-tab" 
                            :class="{ active: statusFilter === 'pending' }"
                            @click="statusFilter = 'pending'; loadUploads(true)">
                            审核中
                        </span>
                        <span 
                            class="status-tab" 
                            :class="{ active: statusFilter === 'approved' }"
                            @click="statusFilter = 'approved'; loadUploads(true)">
                            已通过
                        </span>
                        <span 
                            class="status-tab" 
                            :class="{ active: statusFilter === 'rejected' }"
                            @click="statusFilter = 'rejected'; loadUploads(true)">
                            已拒绝
                        </span>
                    </div>
                    <button class="btn-primary" @click="goUpload">
                        + 上传表情包
                    </button>
                </div>
    
                <div class="empty-state" v-if="!loading && emojis.length === 0">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">还没有上传的表情包</div>
                    <div class="empty-hint" @click="goUpload">立即上传表情包 →</div>
                </div>
    
                <div class="uploads-list" v-if="emojis.length > 0">
                    <div class="upload-item" v-for="item in emojis" :key="item.id">
                        <div class="upload-preview">
                            <img :src="item.url" :alt="item.title" @click="viewDetail(item.id)">
                        </div>
                        <div class="upload-info">
                            <div class="upload-title" @click="viewDetail(item.id)">
                                {{ item.title || '暂无标题' }}
                            </div>
                            <div class="upload-meta">
                                <span class="meta-item">📅 {{ Utils.formatTime(item.created_at) }}</span>
                                <span class="meta-item">👀 {{ Utils.formatNumber(item.view_count || 0) }}</span>
                                <span class="meta-item">❤️ {{ Utils.formatNumber(item.favorite_count || 0) }}</span>
                                <span class="meta-item">⬇️ {{ Utils.formatNumber(item.download_count || 0) }}</span>
                            </div>
                            <div class="upload-status">
                                <span 
                                    class="status-badge"
                                    :class="{
                                        pending: item.review_status === 0,
                                        approved: item.review_status === 1,
                                        rejected: item.review_status === 2
                                    }">
                                    {{ getStatusText(item.review_status) }}
                                </span>
                                <span v-if="item.review_remark" class="review-remark">
                                    审核意见：{{ item.review_remark }}
                                </span>
                            </div>
                            <div class="upload-tags" v-if="item.tags && item.tags.length">
                                <span class="emoji-tag" v-for="tag in item.tags" :key="tag">{{ tag }}</span>
                            </div>
                        </div>
                        <div class="upload-actions">
                            <button class="action-btn" @click="viewDetail(item.id)">查看</button>
                            <button 
                                class="action-btn danger" 
                                @click="deleteEmoji(item.id)"
                                :disabled="item.review_status === 0">
                                删除
                            </button>
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
            const statusFilter = ref('all');
    
            const isLoggedIn = computed(() => Auth.isLoggedIn());
    
            const getStatusText = (status) => {
                const statusMap = {
                    0: '审核中',
                    1: '已通过',
                    2: '已拒绝'
                };
                return statusMap[status] || '未知';
            };
    
            const loadUploads = async (reset = false) => {
                if (reset) {
                    page.value = 1;
                    emojis.value = [];
                    hasMore.value = true;
                }
    
                loading.value = true;
                try {
                    const status = statusFilter.value === 'all' ? null : parseInt(statusFilter.value);
                    const result = await API.emoji.getMyUploads(page.value, pageSize.value, status);
                    if (result.code === 0 && result.data) {
                        const items = result.data.items || result.data || [];
                        emojis.value = reset ? items : [...emojis.value, ...items];
                        total.value = result.data.total || 0;
                        hasMore.value = emojis.value.length < total.value;
                    }
                } catch (error) {
                    console.error('Load uploads error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadMore = () => {
                page.value++;
                loadUploads(false);
            };
    
            const viewDetail = (id) => {
                router.push({ name: 'detail', params: { id } });
            };
    
            const goUpload = () => {
                router.push({ name: 'upload' });
            };
    
            const deleteEmoji = async (id) => {
                if (!confirm('确定要删除这个表情包吗？')) return;
    
                try {
                    const result = await API.emoji.delete(id);
                    if (result.code === 0) {
                        emojis.value = emojis.value.filter(e => e.id !== id);
                        total.value--;
                        Utils.showToast('删除成功', 'success');
                    } else {
                        Utils.showToast(result.msg || '删除失败', 'error');
                    }
                } catch (error) {
                    console.error('Delete error:', error);
                    Utils.showToast('删除失败，请稍后重试', 'error');
                }
            };
    
            onMounted(() => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
                    return;
                }
                loadUploads(true);
            });
    
            return {
                emojis,
                loading,
                total,
                hasMore,
                statusFilter,
                isLoggedIn,
                getStatusText,
                loadUploads,
                loadMore,
                viewDetail,
                goUpload,
                deleteEmoji,
                Utils
            };
        }
    };
})();
