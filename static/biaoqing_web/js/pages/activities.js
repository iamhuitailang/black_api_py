(function() {
    const { ref, computed, onMounted } = Vue;
    
    window.ActivitiesPage = {
        name: 'ActivitiesPage',
        template: `
            <div class="activities-container">
                <div class="page-header">
                    <h1>🎉 活动中心</h1>
                    <p>参与活动，赢取积分和奖励</p>
                </div>
    
                <div class="activity-tabs">
                    <span 
                        class="activity-tab" 
                        :class="{ active: statusFilter === 'ongoing' }"
                        @click="statusFilter = 'ongoing'; loadActivities(true)">
                        进行中
                    </span>
                    <span 
                        class="activity-tab" 
                        :class="{ active: statusFilter === 'upcoming' }"
                        @click="statusFilter = 'upcoming'; loadActivities(true)">
                        即将开始
                    </span>
                    <span 
                        class="activity-tab" 
                        :class="{ active: statusFilter === 'ended' }"
                        @click="statusFilter = 'ended'; loadActivities(true)">
                        已结束
                    </span>
                    <span 
                        class="activity-tab" 
                        :class="{ active: statusFilter === 'my' }"
                        @click="statusFilter = 'my'; loadMyActivities(true)">
                        我参与的
                    </span>
                </div>
    
                <div class="empty-state" v-if="!loading && activities.length === 0">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">暂无活动</div>
                </div>
    
                <div class="activities-list" v-if="activities.length > 0">
                    <div class="activity-card" v-for="item in activities" :key="item.id">
                        <div class="activity-cover">
                            <img :src="item.cover_url || 'https://picsum.photos/400/200'" :alt="item.title">
                            <span 
                                class="activity-status"
                                :class="{
                                    ongoing: item.status === 1,
                                    upcoming: item.status === 0,
                                    ended: item.status === 2
                                }">
                                {{ getStatusText(item.status) }}
                            </span>
                        </div>
                        <div class="activity-info">
                            <h3 class="activity-title">{{ item.title }}</h3>
                            <div class="activity-desc">{{ item.description }}</div>
                            <div class="activity-meta">
                                <span class="meta-item">📅 {{ Utils.formatTime(item.start_time) }}</span>
                                <span class="meta-item">→</span>
                                <span class="meta-item">{{ Utils.formatTime(item.end_time) }}</span>
                            </div>
                            <div class="activity-reward">
                                <span class="reward-icon">🎁</span>
                                <span class="reward-text">{{ item.reward_desc || '参与即有机会获得积分奖励' }}</span>
                            </div>
                            <div class="activity-stats">
                                <span class="stat-item">👥 {{ Utils.formatNumber(item.participant_count || 0) }} 人参与</span>
                                <span class="stat-item">👀 {{ Utils.formatNumber(item.view_count || 0) }} 次浏览</span>
                            </div>
                        </div>
                        <div class="activity-actions">
                            <button class="action-btn" @click="viewDetail(item)">查看详情</button>
                            <button 
                                v-if="item.status === 1 && !item.is_registered"
                                class="action-btn primary" 
                                @click="registerActivity(item)">
                                立即报名
                            </button>
                            <button 
                                v-if="item.status === 1 && item.is_registered"
                                class="action-btn success" 
                                disabled>
                                已报名
                            </button>
                        </div>
                    </div>
                </div>
    
                <div class="load-more" v-if="loading">
                    <span class="loading-spinner"></span> 加载中...
                </div>
    
                <div class="load-more-btn" v-if="!loading && hasMore && activities.length > 0" @click="loadMore">
                    加载更多
                </div>
    
                <div class="no-more" v-if="!loading && !hasMore && activities.length > 0">
                    已加载全部内容
                </div>
    
                <div class="activity-detail-dialog" v-if="showDetail && selectedActivity" @click.self="showDetail = false">
                    <div class="dialog-content">
                        <div class="dialog-header">
                            <h3>{{ selectedActivity.title }}</h3>
                            <span class="close-btn" @click="showDetail = false">✕</span>
                        </div>
                        <div class="dialog-body">
                            <img :src="selectedActivity.cover_url || 'https://picsum.photos/600/300'" class="detail-image">
                            <div class="detail-content">
                                <div class="detail-section">
                                    <h4>活动介绍</h4>
                                    <p>{{ selectedActivity.description }}</p>
                                </div>
                                <div class="detail-section">
                                    <h4>活动时间</h4>
                                    <p>{{ Utils.formatTime(selectedActivity.start_time) }} - {{ Utils.formatTime(selectedActivity.end_time) }}</p>
                                </div>
                                <div class="detail-section" v-if="selectedActivity.rules">
                                    <h4>活动规则</h4>
                                    <p>{{ selectedActivity.rules }}</p>
                                </div>
                                <div class="detail-section">
                                    <h4>奖励设置</h4>
                                    <p>{{ selectedActivity.reward_desc || '参与即有机会获得积分奖励' }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="dialog-footer">
                            <button class="btn-cancel" @click="showDetail = false">关闭</button>
                            <button 
                                v-if="selectedActivity.status === 1 && !selectedActivity.is_registered"
                                class="btn-submit" 
                                @click="registerActivity(selectedActivity)">
                                立即报名
                            </button>
                            <button 
                                v-if="selectedActivity.status === 1 && selectedActivity.is_registered"
                                class="btn-submit success" 
                                disabled>
                                已报名
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
    
            const activities = ref([]);
            const loading = ref(false);
            const page = ref(1);
            const pageSize = ref(10);
            const total = ref(0);
            const hasMore = ref(true);
            const statusFilter = ref('ongoing');
            const showDetail = ref(false);
            const selectedActivity = ref(null);
    
            const isLoggedIn = computed(() => Auth.isLoggedIn());
    
            const getStatusText = (status) => {
                const statusMap = {
                    0: '即将开始',
                    1: '进行中',
                    2: '已结束'
                };
                return statusMap[status] || '未知';
            };
    
            const loadActivities = async (reset = false) => {
                if (reset) {
                    page.value = 1;
                    activities.value = [];
                    hasMore.value = true;
                }
    
                loading.value = true;
                try {
                    let status = null;
                    if (statusFilter.value === 'ongoing') status = 1;
                    else if (statusFilter.value === 'upcoming') status = 0;
                    else if (statusFilter.value === 'ended') status = 2;
    
                    const result = await API.activity.getList(page.value, pageSize.value, status);
                    if (result.code === 0 && result.data) {
                        const items = result.data.items || result.data || [];
                        activities.value = reset ? items : [...activities.value, ...items];
                        total.value = result.data.total || 0;
                        hasMore.value = activities.value.length < total.value;
                    }
                } catch (error) {
                    console.error('Load activities error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadMyActivities = async (reset = false) => {
                if (reset) {
                    page.value = 1;
                    activities.value = [];
                    hasMore.value = true;
                }
    
                loading.value = true;
                try {
                    const result = await API.activity.getMyRegistrations(page.value, pageSize.value);
                    if (result.code === 0 && result.data) {
                        const items = result.data.items || result.data || [];
                        activities.value = reset ? items : [...activities.value, ...items];
                        total.value = result.data.total || 0;
                        hasMore.value = activities.value.length < total.value;
                    }
                } catch (error) {
                    console.error('Load my activities error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadMore = () => {
                page.value++;
                if (statusFilter.value === 'my') {
                    loadMyActivities(false);
                } else {
                    loadActivities(false);
                }
            };
    
            const viewDetail = (item) => {
                selectedActivity.value = item;
                showDetail.value = true;
                API.activity.incrementViewCount(item.id).catch(e => console.error(e));
            };
    
            const registerActivity = async (item) => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
                    return;
                }
    
                try {
                    const result = await API.activity.register(item.id);
                    if (result.code === 0) {
                        Utils.showToast('报名成功', 'success');
                        item.is_registered = true;
                        item.participant_count = (item.participant_count || 0) + 1;
                        if (selectedActivity.value && selectedActivity.value.id === item.id) {
                            selectedActivity.value.is_registered = true;
                        }
                    } else {
                        Utils.showToast(result.msg || '报名失败', 'error');
                    }
                } catch (error) {
                    console.error('Register activity error:', error);
                    Utils.showToast('报名失败，请稍后重试', 'error');
                }
            };
    
            onMounted(() => {
                loadActivities(true);
            });
    
            return {
                activities,
                loading,
                total,
                hasMore,
                statusFilter,
                showDetail,
                selectedActivity,
                isLoggedIn,
                getStatusText,
                loadActivities,
                loadMyActivities,
                loadMore,
                viewDetail,
                registerActivity,
                Utils
            };
        }
    };
})();
