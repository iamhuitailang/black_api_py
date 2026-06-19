(function() {
    const ref = Vue.ref;
    const onMounted = Vue.onMounted;

    const TalkList = {
        name: 'TalkList',
        emits: ['view-detail'],
        setup(props, { emit }) {
            const talkList = ref([]);
            const loading = ref(false);
            const keyword = ref('');
            const page = ref(1);
            const pageSize = ref(10);
            const total = ref(0);
            const totalPages = ref(0);

            const loadTalkList = async () => {
                loading.value = true;
                try {
                    const result = await CareerTalkApi.getTalkList(page.value, pageSize.value, keyword.value);
                    if (result.code === 0) {
                        talkList.value = result.data.items || [];
                        total.value = result.data.total || 0;
                        totalPages.value = result.data.total_pages || 0;
                    } else {
                        Toast.error(result.message || '加载失败');
                    }
                } catch (error) {
                    Toast.error('网络错误，请稍后重试');
                } finally {
                    loading.value = false;
                }
            };

            const handleSearch = () => {
                page.value = 1;
                loadTalkList();
            };

            const viewDetail = (id) => {
                emit('view-detail', id);
            };

            const changePage = (newPage) => {
                if (newPage < 1 || newPage > totalPages.value) return;
                page.value = newPage;
                loadTalkList();
            };

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };

            onMounted(() => {
                loadTalkList();
            });

            return {
                talkList,
                loading,
                keyword,
                page,
                pageSize,
                total,
                totalPages,
                loadTalkList,
                handleSearch,
                viewDetail,
                changePage,
                formatDate
            };
        },
        template: `
        <div>
            <div class="page-header">
                <h2>📢 宣讲会列表</h2>
            </div>

            <div class="search-bar">
                <input 
                    type="text" 
                    class="form-control" 
                    v-model="keyword"
                    placeholder="搜索公司名称..."
                    @keyup.enter="handleSearch"
                >
                <button class="btn btn-primary" @click="handleSearch">
                    🔍 搜索
                </button>
            </div>

            <div v-if="loading" class="empty-state">
                <p>加载中...</p>
            </div>

            <div v-else-if="talkList.length === 0" class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                </svg>
                <p>暂无宣讲会信息</p>
            </div>

            <div v-else class="talk-list">
                <div 
                    v-for="talk in talkList" 
                    :key="talk.id"
                    class="talk-item"
                    @click="viewDetail(talk.id)"
                >
                    <div class="talk-item-header">
                        <h3 class="talk-company">{{ talk.company_name }}</h3>
                        <span 
                            class="talk-status"
                            :class="talk.status === 1 ? 'active' : 'inactive'"
                        >
                            {{ talk.status === 1 ? '进行中' : '已结束' }}
                        </span>
                    </div>

                    <div class="talk-meta">
                        <div class="talk-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {{ formatDate(talk.talk_time) }}
                        </div>
                        <div class="talk-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {{ talk.location }}
                        </div>
                    </div>

                    <p class="talk-desc">{{ talk.description || '暂无简介' }}</p>

                    <div class="talk-footer">
                        <div class="talk-stats">
                            <div class="talk-stats-item">
                                👥 报名: <strong>{{ talk.registration_count }}</strong>
                            </div>
                            <div class="talk-stats-item">
                                ✅ 签到: <strong>{{ talk.checkin_count }}</strong>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm" @click.stop="viewDetail(talk.id)">
                            查看详情 →
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="totalPages > 1" class="pagination">
                <button @click="changePage(page - 1)" :disabled="page <= 1">上一页</button>
                <span class="pagination-info">
                    第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条
                </span>
                <button @click="changePage(page + 1)" :disabled="page >= totalPages">下一页</button>
            </div>
        </div>
    `
    };

    window.TalkList = TalkList;
})();
