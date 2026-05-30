(function() {
    const { ref, computed, onMounted, reactive } = Vue;
    
    window.AdminPage = {
        name: 'AdminPage',
        template: `
            <div class="admin-container">
                <div class="admin-sidebar">
                    <div class="admin-header">
                        <div class="admin-logo">🔐</div>
                        <div class="admin-title">管理后台</div>
                    </div>
    
                    <div class="admin-menu">
                        <div 
                            class="menu-item" 
                            :class="{ active: activeMenu === 'dashboard' }"
                            @click="activeMenu = 'dashboard'">
                            <span class="menu-icon">📊</span>
                            <span class="menu-text">数据概览</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeMenu === 'emoji-review' }"
                            @click="activeMenu = 'emoji-review'">
                            <span class="menu-icon">📝</span>
                            <span class="menu-text">表情包审核</span>
                            <span class="menu-badge" v-if="pendingCount > 0">{{ pendingCount }}</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeMenu === 'emoji-manage' }"
                            @click="activeMenu = 'emoji-manage'">
                            <span class="menu-icon">🖼️</span>
                            <span class="menu-text">表情包管理</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeMenu === 'category' }"
                            @click="activeMenu = 'category'">
                            <span class="menu-icon">📁</span>
                            <span class="menu-text">分类管理</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeMenu === 'user' }"
                            @click="activeMenu = 'user'">
                            <span class="menu-icon">👥</span>
                            <span class="menu-text">用户管理</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeMenu === 'report' }"
                            @click="activeMenu = 'report'">
                            <span class="menu-icon">🚩</span>
                            <span class="menu-text">举报处理</span>
                            <span class="menu-badge" v-if="reportPendingCount > 0">{{ reportPendingCount }}</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeMenu === 'activity' }"
                            @click="activeMenu = 'activity'">
                            <span class="menu-icon">🎉</span>
                            <span class="menu-text">活动管理</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeMenu === 'ad' }"
                            @click="activeMenu = 'ad'">
                            <span class="menu-icon">📢</span>
                            <span class="menu-text">广告管理</span>
                        </div>
                    </div>
    
                    <div class="admin-footer">
                        <div class="admin-info">
                            <span>管理员：{{ admin.username }}</span>
                        </div>
                        <button class="logout-btn" @click="handleLogout">退出登录</button>
                    </div>
                </div>
    
                <div class="admin-content">
                    <div v-if="activeMenu === 'dashboard'" class="dashboard">
                        <h2>📊 数据概览</h2>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">🖼️</div>
                                <div class="stat-info">
                                    <div class="stat-value">{{ stats.total_emojis || 0 }}</div>
                                    <div class="stat-label">表情包总数</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">👥</div>
                                <div class="stat-info">
                                    <div class="stat-value">{{ stats.total_users || 0 }}</div>
                                    <div class="stat-label">用户总数</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">📝</div>
                                <div class="stat-info">
                                    <div class="stat-value">{{ stats.pending_reviews || 0 }}</div>
                                    <div class="stat-label">待审核</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">❤️</div>
                                <div class="stat-info">
                                    <div class="stat-value">{{ stats.total_favorites || 0 }}</div>
                                    <div class="stat-label">收藏总数</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">⬇️</div>
                                <div class="stat-info">
                                    <div class="stat-value">{{ stats.total_downloads || 0 }}</div>
                                    <div class="stat-label">下载总数</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">👀</div>
                                <div class="stat-info">
                                    <div class="stat-value">{{ stats.total_views || 0 }}</div>
                                    <div class="stat-label">浏览总数</div>
                                </div>
                            </div>
                        </div>
    
                        <div class="chart-section">
                            <h3>📈 最近7天数据</h3>
                            <div class="chart-placeholder">
                                图表区域
                            </div>
                        </div>
                    </div>
    
                    <div v-if="activeMenu === 'emoji-review'" class="emoji-review">
                        <h2>📝 表情包审核</h2>
                        <div class="review-list">
                            <div class="load-more" v-if="loading">加载中...</div>
                            <div 
                                class="review-item" 
                                v-for="item in reviewList" 
                                :key="item.id">
                                <div class="review-preview">
                                    <img :src="item.url" :alt="item.title">
                                </div>
                                <div class="review-info">
                                    <h4>{{ item.title || '暂无标题' }}</h4>
                                    <p>上传者：{{ item.username || '匿名' }}</p>
                                    <p>上传时间：{{ Utils.formatTime(item.created_at) }}</p>
                                    <p v-if="item.description">描述：{{ item.description }}</p>
                                </div>
                                <div class="review-actions">
                                    <button 
                                        class="btn-success" 
                                        @click="approveEmoji(item.id)">
                                        通过
                                    </button>
                                    <button 
                                        class="btn-danger" 
                                        @click="showRejectDialog(item)">
                                        拒绝
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="empty-state" v-if="!loading && reviewList.length === 0">
                            暂无待审核内容
                        </div>
                    </div>
    
                    <div v-if="activeMenu === 'emoji-manage'" class="emoji-manage">
                        <h2>🖼️ 表情包管理</h2>
                        <div class="manage-actions">
                            <input 
                                type="text" 
                                class="search-input" 
                                v-model="searchKeyword"
                                placeholder="搜索表情包..."
                            >
                            <button class="btn-primary" @click="loadEmojis(true)">搜索</button>
                        </div>
                        <div class="manage-list">
                            <div class="load-more" v-if="loading">加载中...</div>
                            <div 
                                class="manage-item" 
                                v-for="item in emojiList" 
                                :key="item.id">
                                <div class="manage-preview">
                                    <img :src="item.url" :alt="item.title">
                                </div>
                                <div class="manage-info">
                                    <h4>{{ item.title || '暂无标题' }}</h4>
                                    <p>ID：{{ item.id }}</p>
                                    <p>状态：{{ getReviewStatusText(item.review_status) }}</p>
                                    <p>浏览：{{ item.view_count || 0 }} | 收藏：{{ item.favorite_count || 0 }}</p>
                                </div>
                                <div class="manage-actions">
                                    <button 
                                        class="btn-danger" 
                                        @click="deleteEmoji(item.id)">
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <div v-if="activeMenu === 'category'" class="category-manage">
                        <h2>📁 分类管理</h2>
                        <div class="manage-actions">
                            <button class="btn-primary" @click="showAddCategory = true">
                                + 添加分类
                            </button>
                        </div>
                        <div class="category-list">
                            <div class="load-more" v-if="loading">加载中...</div>
                            <div 
                                class="category-item" 
                                v-for="item in categoryList" 
                                :key="item.id">
                                <div class="category-icon">{{ item.icon || '📦' }}</div>
                                <div class="category-info">
                                    <h4>{{ item.name }}</h4>
                                    <p v-if="item.description">{{ item.description }}</p>
                                    <p>表情包数量：{{ item.emoji_count || 0 }}</p>
                                </div>
                                <div class="category-actions">
                                    <button 
                                        class="btn-primary" 
                                        @click="editCategory(item)">
                                        编辑
                                    </button>
                                    <button 
                                        class="btn-danger" 
                                        @click="deleteCategory(item.id)">
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
    
                        <div class="category-dialog" v-if="showAddCategory" @click.self="showAddCategory = false">
                            <div class="dialog-content">
                                <div class="dialog-header">
                                    <h3>{{ editingCategory ? '编辑分类' : '添加分类' }}</h3>
                                    <span class="close-btn" @click="showAddCategory = false">✕</span>
                                </div>
                                <div class="dialog-body">
                                    <div class="form-group">
                                        <label>分类名称</label>
                                        <input 
                                            type="text" 
                                            class="form-input" 
                                            v-model="categoryForm.name"
                                            placeholder="请输入分类名称">
                                    </div>
                                    <div class="form-group">
                                        <label>分类图标</label>
                                        <input 
                                            type="text" 
                                            class="form-input" 
                                            v-model="categoryForm.icon"
                                            placeholder="请输入emoji图标">
                                    </div>
                                    <div class="form-group">
                                        <label>分类描述</label>
                                        <textarea 
                                            class="form-textarea" 
                                            v-model="categoryForm.description"
                                            placeholder="请输入分类描述"
                                            rows="3">
                                        </textarea>
                                    </div>
                                </div>
                                <div class="dialog-footer">
                                    <button class="btn-cancel" @click="showAddCategory = false">取消</button>
                                    <button class="btn-submit" @click="saveCategory">保存</button>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <div v-if="activeMenu === 'user'" class="user-manage">
                        <h2>👥 用户管理</h2>
                        <div class="manage-actions">
                            <input 
                                type="text" 
                                class="search-input" 
                                v-model="userSearchKeyword"
                                placeholder="搜索用户名/邮箱...">
                            <button class="btn-primary" @click="loadUsers(true)">搜索</button>
                        </div>
                        <div class="user-list">
                            <div class="load-more" v-if="loading">加载中...</div>
                            <div 
                                class="user-item" 
                                v-for="item in userList" 
                                :key="item.id">
                                <div class="user-avatar">{{ item.nickname?.charAt(0) || item.username?.charAt(0) || 'U' }}</div>
                                <div class="user-info">
                                    <h4>{{ item.nickname || item.username }}</h4>
                                    <p>用户名：{{ item.username }}</p>
                                    <p>邮箱：{{ item.email }}</p>
                                    <p>积分：{{ item.points || 0 }}</p>
                                    <p>状态：{{ getUserStatusText(item.status) }}</p>
                                </div>
                                <div class="user-actions">
                                    <button 
                                        class="btn-warning" 
                                        v-if="item.status === 0"
                                        @click="banUser(item.id)">
                                        封禁
                                    </button>
                                    <button 
                                        class="btn-success" 
                                        v-else
                                        @click="unbanUser(item.id)">
                                        解封
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <div v-if="activeMenu === 'report'" class="report-manage">
                        <h2>🚩 举报处理</h2>
                        <div class="report-tabs">
                            <span 
                                class="report-tab" 
                                :class="{ active: reportStatus === 'pending' }"
                                @click="reportStatus = 'pending'; loadReports(true)">
                                待处理
                            </span>
                            <span 
                                class="report-tab" 
                                :class="{ active: reportStatus === 'processed' }"
                                @click="reportStatus = 'processed'; loadReports(true)">
                                已处理
                            </span>
                        </div>
                        <div class="report-list">
                            <div class="load-more" v-if="loading">加载中...</div>
                            <div 
                                class="report-item" 
                                v-for="item in reportList" 
                                :key="item.id">
                                <div class="report-info">
                                    <h4>举报类型：{{ getReportTypeText(item.type) }}</h4>
                                    <p>举报人：{{ item.reporter_name || '匿名' }}</p>
                                    <p>被举报表情包：{{ item.emoji_title || '未知' }}</p>
                                    <p>举报时间：{{ Utils.formatTime(item.created_at) }}</p>
                                    <p v-if="item.content">举报内容：{{ item.content }}</p>
                                </div>
                                <div class="report-actions" v-if="item.status === 0">
                                    <button 
                                        class="btn-success" 
                                        @click="processReport(item, 'ignore')">
                                        忽略
                                    </button>
                                    <button 
                                        class="btn-warning" 
                                        @click="processReport(item, 'warning')">
                                        警告
                                    </button>
                                    <button 
                                        class="btn-danger" 
                                        @click="processReport(item, 'delete')">
                                        删除表情包
                                    </button>
                                </div>
                                <div class="report-status" v-else>
                                    处理结果：{{ item.process_result || '已处理' }}
                                </div>
                            </div>
                        </div>
                        <div class="empty-state" v-if="!loading && reportList.length === 0">
                            暂无举报内容
                        </div>
                    </div>
    
                    <div v-if="activeMenu === 'activity'" class="activity-manage">
                        <h2>🎉 活动管理</h2>
                        <div class="manage-actions">
                            <button class="btn-primary" @click="showAddActivity = true">
                                + 添加活动
                            </button>
                        </div>
                        <div class="activity-list">
                            <div class="load-more" v-if="loading">加载中...</div>
                            <div 
                                class="activity-item" 
                                v-for="item in activityList" 
                                :key="item.id">
                                <div class="activity-preview">
                                    <img :src="item.cover_url || 'https://picsum.photos/100/100'" :alt="item.title">
                                </div>
                                <div class="activity-info">
                                    <h4>{{ item.title }}</h4>
                                    <p>状态：{{ getActivityStatusText(item.status) }}</p>
                                    <p>时间：{{ Utils.formatTime(item.start_time) }} - {{ Utils.formatTime(item.end_time) }}</p>
                                    <p>参与人数：{{ item.participant_count || 0 }}</p>
                                </div>
                                <div class="activity-actions">
                                    <button 
                                        class="btn-primary" 
                                        @click="editActivity(item)">
                                        编辑
                                    </button>
                                    <button 
                                        class="btn-danger" 
                                        @click="deleteActivity(item.id)">
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <div v-if="activeMenu === 'ad'" class="ad-manage">
                        <h2>📢 广告管理</h2>
                        <div class="manage-actions">
                            <button class="btn-primary" @click="showAddAd = true">
                                + 添加广告
                            </button>
                        </div>
                        <div class="ad-list">
                            <div class="load-more" v-if="loading">加载中...</div>
                            <div 
                                class="ad-item" 
                                v-for="item in adList" 
                                :key="item.id">
                                <div class="ad-preview">
                                    <img :src="item.image_url || 'https://picsum.photos/100/100'" :alt="item.title">
                                </div>
                                <div class="ad-info">
                                    <h4>{{ item.title }}</h4>
                                    <p>位置：{{ item.position }}</p>
                                    <p>状态：{{ item.status === 1 ? '启用' : '禁用' }}</p>
                                    <p>点击量：{{ item.click_count || 0 }}</p>
                                </div>
                                <div class="ad-actions">
                                    <button 
                                        class="btn-primary" 
                                        @click="toggleAdStatus(item)">
                                        {{ item.status === 1 ? '禁用' : '启用' }}
                                    </button>
                                    <button 
                                        class="btn-danger" 
                                        @click="deleteAd(item.id)">
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <div class="reject-dialog" v-if="showReject" @click.self="showReject = false">
                        <div class="dialog-content">
                            <div class="dialog-header">
                                <h3>拒绝原因</h3>
                                <span class="close-btn" @click="showReject = false">✕</span>
                            </div>
                            <div class="dialog-body">
                                <textarea 
                                    class="form-textarea" 
                                    v-model="rejectReason"
                                    placeholder="请输入拒绝原因"
                                    rows="4">
                                </textarea>
                            </div>
                            <div class="dialog-footer">
                                <button class="btn-cancel" @click="showReject = false">取消</button>
                                <button class="btn-submit" @click="submitReject">确认拒绝</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
    
            const admin = ref({});
            const activeMenu = ref('dashboard');
            const loading = ref(false);
            const pendingCount = ref(0);
            const reportPendingCount = ref(0);
            const stats = ref({});
            const reviewList = ref([]);
            const emojiList = ref([]);
            const categoryList = ref([]);
            const userList = ref([]);
            const reportList = ref([]);
            const activityList = ref([]);
            const adList = ref([]);
            const searchKeyword = ref('');
            const userSearchKeyword = ref('');
            const reportStatus = ref('pending');
            const showReject = ref(false);
            const rejectEmoji = ref(null);
            const rejectReason = ref('');
            const showAddCategory = ref(false);
            const editingCategory = ref(null);
            const categoryForm = reactive({
                name: '',
                icon: '',
                description: ''
            });
            const showAddActivity = ref(false);
            const showAddAd = ref(false);
    
            const isAdminLoggedIn = computed(() => Auth.isAdminLoggedIn());
    
            const getReviewStatusText = (status) => {
                const map = { 0: '审核中', 1: '已通过', 2: '已拒绝' };
                return map[status] || '未知';
            };
    
            const getUserStatusText = (status) => {
                const map = { 0: '正常', 1: '禁言', 2: '封禁' };
                return map[status] || '未知';
            };
    
            const getReportTypeText = (type) => {
                const map = {
                    porn: '色情低俗',
                    violence: '暴力恐怖',
                    politics: '政治敏感',
                    copyright: '侵权',
                    other: '其他'
                };
                return map[type] || '其他';
            };
    
            const getActivityStatusText = (status) => {
                const map = { 0: '即将开始', 1: '进行中', 2: '已结束' };
                return map[status] || '未知';
            };
    
            const loadStats = async () => {
                try {
                    const result = await API.admin.getStats();
                    if (result.code === 0 && result.data) {
                        stats.value = result.data;
                        pendingCount.value = result.data.pending_reviews || 0;
                    }
                } catch (error) {
                    console.error('Load stats error:', error);
                }
            };
    
            const loadPendingReviews = async () => {
                loading.value = true;
                try {
                    const result = await API.admin.getPendingReviews(1, 50);
                    if (result.code === 0 && result.data) {
                        reviewList.value = result.data.items || result.data || [];
                        pendingCount.value = reviewList.value.length;
                    }
                } catch (error) {
                    console.error('Load pending reviews error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadEmojis = async (reset = false) => {
                loading.value = true;
                try {
                    const result = await API.emoji.search(
                        searchKeyword.value,
                        1,
                        50,
                        'latest',
                        null
                    );
                    if (result.code === 0 && result.data) {
                        emojiList.value = result.data.items || result.data || [];
                    }
                } catch (error) {
                    console.error('Load emojis error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadCategories = async () => {
                loading.value = true;
                try {
                    const result = await API.category.getAll();
                    if (result.code === 0 && result.data) {
                        categoryList.value = result.data;
                    }
                } catch (error) {
                    console.error('Load categories error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadUsers = async (reset = false) => {
                loading.value = true;
                try {
                    const result = await API.admin.getUserList(
                        1,
                        50,
                        userSearchKeyword.value || null
                    );
                    if (result.code === 0 && result.data) {
                        userList.value = result.data.items || result.data || [];
                    }
                } catch (error) {
                    console.error('Load users error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadReports = async (reset = false) => {
                loading.value = true;
                try {
                    const status = reportStatus.value === 'pending' ? 0 : 1;
                    const result = await API.admin.getReportList(1, 50, status);
                    if (result.code === 0 && result.data) {
                        reportList.value = result.data.items || result.data || [];
                        if (status === 0) {
                            reportPendingCount.value = reportList.value.length;
                        }
                    }
                } catch (error) {
                    console.error('Load reports error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadActivities = async () => {
                loading.value = true;
                try {
                    const result = await API.activity.getList(1, 50, null);
                    if (result.code === 0 && result.data) {
                        activityList.value = result.data.items || result.data || [];
                    }
                } catch (error) {
                    console.error('Load activities error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadAds = async () => {
                loading.value = true;
                try {
                    const result = await API.ad.getList(1, 50);
                    if (result.code === 0 && result.data) {
                        adList.value = result.data.items || result.data || [];
                    }
                } catch (error) {
                    console.error('Load ads error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const approveEmoji = async (id) => {
                try {
                    const result = await API.admin.reviewEmoji(id, 1, '');
                    if (result.code === 0) {
                        Utils.showToast('审核通过', 'success');
                        reviewList.value = reviewList.value.filter(item => item.id !== id);
                        pendingCount.value--;
                        loadStats();
                    } else {
                        Utils.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    console.error('Approve emoji error:', error);
                    Utils.showToast('操作失败', 'error');
                }
            };
    
            const showRejectDialog = (item) => {
                rejectEmoji.value = item;
                rejectReason.value = '';
                showReject.value = true;
            };
    
            const submitReject = async () => {
                if (!rejectReason.value.trim()) {
                    Utils.showToast('请输入拒绝原因', 'warning');
                    return;
                }
    
                try {
                    const result = await API.admin.reviewEmoji(
                        rejectEmoji.value.id,
                        2,
                        rejectReason.value
                    );
                    if (result.code === 0) {
                        Utils.showToast('已拒绝', 'success');
                        reviewList.value = reviewList.value.filter(
                            item => item.id !== rejectEmoji.value.id
                        );
                        pendingCount.value--;
                        showReject.value = false;
                        loadStats();
                    } else {
                        Utils.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    console.error('Reject emoji error:', error);
                    Utils.showToast('操作失败', 'error');
                }
            };
    
            const deleteEmoji = async (id) => {
                if (!confirm('确定要删除这个表情包吗？')) return;
    
                try {
                    const result = await API.emoji.delete(id);
                    if (result.code === 0) {
                        Utils.showToast('删除成功', 'success');
                        emojiList.value = emojiList.value.filter(item => item.id !== id);
                    } else {
                        Utils.showToast(result.msg || '删除失败', 'error');
                    }
                } catch (error) {
                    console.error('Delete emoji error:', error);
                    Utils.showToast('删除失败', 'error');
                }
            };
    
            const editCategory = (item) => {
                editingCategory.value = item;
                categoryForm.name = item.name;
                categoryForm.icon = item.icon || '';
                categoryForm.description = item.description || '';
                showAddCategory.value = true;
            };
    
            const saveCategory = async () => {
                if (!categoryForm.name.trim()) {
                    Utils.showToast('请输入分类名称', 'warning');
                    return;
                }
    
                try {
                    let result;
                    if (editingCategory.value) {
                        result = await API.category.update(
                            editingCategory.value.id,
                            categoryForm.name,
                            categoryForm.icon,
                            categoryForm.description
                        );
                    } else {
                        result = await API.category.create(
                            categoryForm.name,
                            categoryForm.icon,
                            categoryForm.description
                        );
                    }
    
                    if (result.code === 0) {
                        Utils.showToast(
                            editingCategory.value ? '修改成功' : '添加成功',
                            'success'
                        );
                        showAddCategory.value = false;
                        editingCategory.value = null;
                        categoryForm.name = '';
                        categoryForm.icon = '';
                        categoryForm.description = '';
                        loadCategories();
                    } else {
                        Utils.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    console.error('Save category error:', error);
                    Utils.showToast('操作失败', 'error');
                }
            };
    
            const deleteCategory = async (id) => {
                if (!confirm('确定要删除这个分类吗？')) return;
    
                try {
                    const result = await API.category.delete(id);
                    if (result.code === 0) {
                        Utils.showToast('删除成功', 'success');
                        categoryList.value = categoryList.value.filter(item => item.id !== id);
                    } else {
                        Utils.showToast(result.msg || '删除失败', 'error');
                    }
                } catch (error) {
                    console.error('Delete category error:', error);
                    Utils.showToast('删除失败', 'error');
                }
            };
    
            const banUser = async (id) => {
                if (!confirm('确定要封禁这个用户吗？')) return;
    
                try {
                    const result = await API.admin.updateUserStatus(id, 2);
                    if (result.code === 0) {
                        Utils.showToast('已封禁', 'success');
                        loadUsers();
                    } else {
                        Utils.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    console.error('Ban user error:', error);
                    Utils.showToast('操作失败', 'error');
                }
            };
    
            const unbanUser = async (id) => {
                try {
                    const result = await API.admin.updateUserStatus(id, 0);
                    if (result.code === 0) {
                        Utils.showToast('已解封', 'success');
                        loadUsers();
                    } else {
                        Utils.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    console.error('Unban user error:', error);
                    Utils.showToast('操作失败', 'error');
                }
            };
    
            const processReport = async (item, action) => {
                try {
                    const result = await API.admin.processReport(
                        item.id,
                        action,
                        action === 'delete' ? '删除表情包' : action === 'warning' ? '警告用户' : '忽略举报'
                    );
                    if (result.code === 0) {
                        Utils.showToast('处理成功', 'success');
                        reportList.value = reportList.value.filter(r => r.id !== item.id);
                        reportPendingCount.value--;
                    } else {
                        Utils.showToast(result.msg || '处理失败', 'error');
                    }
                } catch (error) {
                    console.error('Process report error:', error);
                    Utils.showToast('处理失败', 'error');
                }
            };
    
            const editActivity = (item) => {
                Utils.showToast('编辑功能开发中', 'info');
            };
    
            const deleteActivity = async (id) => {
                if (!confirm('确定要删除这个活动吗？')) return;
    
                try {
                    const result = await API.activity.delete(id);
                    if (result.code === 0) {
                        Utils.showToast('删除成功', 'success');
                        activityList.value = activityList.value.filter(item => item.id !== id);
                    } else {
                        Utils.showToast(result.msg || '删除失败', 'error');
                    }
                } catch (error) {
                    console.error('Delete activity error:', error);
                    Utils.showToast('删除失败', 'error');
                }
            };
    
            const toggleAdStatus = async (item) => {
                try {
                    const newStatus = item.status === 1 ? 0 : 1;
                    const result = await API.ad.updateStatus(item.id, newStatus);
                    if (result.code === 0) {
                        item.status = newStatus;
                        Utils.showToast(
                            newStatus === 1 ? '已启用' : '已禁用',
                            'success'
                        );
                    } else {
                        Utils.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    console.error('Toggle ad status error:', error);
                    Utils.showToast('操作失败', 'error');
                }
            };
    
            const deleteAd = async (id) => {
                if (!confirm('确定要删除这个广告吗？')) return;
    
                try {
                    const result = await API.ad.delete(id);
                    if (result.code === 0) {
                        Utils.showToast('删除成功', 'success');
                        adList.value = adList.value.filter(item => item.id !== id);
                    } else {
                        Utils.showToast(result.msg || '删除失败', 'error');
                    }
                } catch (error) {
                    console.error('Delete ad error:', error);
                    Utils.showToast('删除失败', 'error');
                }
            };
    
            const handleLogout = async () => {
                if (!confirm('确定要退出登录吗？')) return;
                await Auth.adminLogout();
                Utils.showToast('已退出登录', 'success');
                router.push({ name: 'admin-login' });
            };
    
            onMounted(() => {
                if (!isAdminLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'admin-login' });
                    return;
                }
    
                const currentAdmin = Auth.getCurrentAdmin();
                if (currentAdmin) {
                    admin.value = currentAdmin;
                }
    
                loadStats();
            });
    
            return {
                admin,
                activeMenu,
                loading,
                pendingCount,
                reportPendingCount,
                stats,
                reviewList,
                emojiList,
                categoryList,
                userList,
                reportList,
                activityList,
                adList,
                searchKeyword,
                userSearchKeyword,
                reportStatus,
                showReject,
                rejectReason,
                showAddCategory,
                categoryForm,
                showAddActivity,
                showAddAd,
                isAdminLoggedIn,
                getReviewStatusText,
                getUserStatusText,
                getReportTypeText,
                getActivityStatusText,
                loadStats,
                loadPendingReviews,
                loadEmojis,
                loadCategories,
                loadUsers,
                loadReports,
                loadActivities,
                loadAds,
                approveEmoji,
                showRejectDialog,
                submitReject,
                deleteEmoji,
                editCategory,
                saveCategory,
                deleteCategory,
                banUser,
                unbanUser,
                processReport,
                editActivity,
                deleteActivity,
                toggleAdStatus,
                deleteAd,
                handleLogout,
                Utils
            };
        }
    };
})();
