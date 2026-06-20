const ReviewTasksPage = {
    data() {
        return {
            loading: false,
            tasks: [],
            total: 0,
            page: 1,
            pageSize: 20,
            activeTab: 'all',
            tabs: [
                { key: 'all', label: '全部' },
                { key: 'pending', label: '待接受' },
                { key: 'accepted', label: '审稿中' },
                { key: 'completed', label: '已完成' }
            ],
            stats: { pending: 0, active: 0, total: 0 },
            showReviewModal: false,
            selectedAssignmentId: null
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.total / this.pageSize) || 1;
        },
        filteredTasks() {
            const status = this.activeTab;
            if (status === 'all') return this.tasks;
            return this.tasks.filter(t => t.assignment.status === status);
        }
    },
    methods: {
        async loadStats() {
            const res = await JournalService.getReviewTaskStats();
            if (res.code === 0 && res.data) {
                this.stats = res.data;
            }
        },
        async loadTasks() {
            this.loading = true;
            try {
                const status = this.activeTab === 'all' ? null : this.activeTab;
                const res = await JournalService.getReviewTasks(status, this.page, this.pageSize);
                if (res.code === 0 && res.data) {
                    this.tasks = res.data.items || [];
                    this.total = res.data.total || 0;
                }
            } finally {
                this.loading = false;
            }
        },
        goToPage(p) {
            if (p < 1 || p > this.totalPages || p === this.page) return;
            this.page = p;
            this.loadTasks();
        },
        goDetail(manuscriptId) {
            this.$root.navigateTo(`manuscript-detail/${manuscriptId}`);
        },
        openReviewModal(assignmentId) {
            this.selectedAssignmentId = assignmentId;
            this.showReviewModal = true;
        },
        async handleAccept(assignmentId) {
            const res = await JournalService.acceptAssignment(assignmentId);
            if (res.code === 0) {
                Toast.success('已接受审稿任务');
                this.loadTasks();
                this.loadStats();
            } else {
                Toast.error(res.message || '操作失败');
            }
        },
        async handleDecline(assignmentId) {
            if (!confirm('确定拒绝该审稿任务？')) return;
            const res = await JournalService.declineAssignment(assignmentId);
            if (res.code === 0) {
                Toast.success('已拒绝');
                this.loadTasks();
                this.loadStats();
            } else {
                Toast.error(res.message || '操作失败');
            }
        },
        getAssignmentBadge(status) {
            const map = {
                pending: { label: '待接受', class: 'badge-warning' },
                accepted: { label: '审稿中', class: 'badge-info' },
                declined: { label: '已拒绝', class: 'badge-default' },
                completed: { label: '已完成', class: 'badge-success' }
            };
            return map[status] || { label: status, class: 'badge-default' };
        },
        getManuscriptBadge(status) {
            const map = {
                draft: { label: '草稿', class: 'badge-default' },
                submitted: { label: '待分配', class: 'badge-info' },
                under_review: { label: '审稿中', class: 'badge-warning' },
                review_completed: { label: '审稿完成', class: 'badge-primary' },
                accepted: { label: '已录用', class: 'badge-success' },
                revision_required: { label: '需修改', class: 'badge-warning' },
                rejected: { label: '已退稿', class: 'badge-danger' },
                published: { label: '已发表', class: 'badge-success' }
            };
            return map[status] || { label: status, class: 'badge-default' };
        },
        getRecommendationBadge(rec) {
            const map = {
                accept: { label: '录用', class: 'badge-success' },
                minor_revision: { label: '小修', class: 'badge-warning' },
                major_revision: { label: '大修', class: 'badge-warning' },
                reject: { label: '退稿', class: 'badge-danger' }
            };
            return map[rec] || null;
        }
    },
    mounted() {
        this.loadStats();
        this.loadTasks();
    },
    watch: {
        activeTab() {
            this.page = 1;
            this.loadTasks();
        }
    },
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">🔬 审稿任务</h1>
                <p class="page-subtitle">管理您被分配的审稿任务，及时完成评审工作</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon stat-icon-yellow">📥</div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.pending }}</div>
                        <div class="stat-label">待接受任务</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-icon-blue">🔍</div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.active }}</div>
                        <div class="stat-label">审稿中任务</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-icon-green">✅</div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.total }}</div>
                        <div class="stat-label">总任务数</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="padding-bottom:0;border-bottom:none;">
                    <div class="tabs">
                        <div
                            v-for="tab in tabs"
                            :key="tab.key"
                            class="tab-item"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                        >
                            {{ tab.label }}
                            <span class="tab-item-count">{{ tab.key === 'all' ? total : filteredTasks.length }}</span>
                        </div>
                    </div>
                </div>
                <div class="card-body" style="padding-top:0;">
                    <div v-if="loading" class="loading-page">
                        <div class="spinner"></div>
                    </div>
                    <div v-else-if="filteredTasks.length === 0" class="empty-state">
                        <div class="empty-icon">📭</div>
                        <h3>暂无审稿任务</h3>
                        <p>{{ activeTab === 'all' ? '您目前没有被分配任何审稿任务' : '该状态下暂无任务' }}</p>
                    </div>
                    <div v-else class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="width:60px;">#</th>
                                    <th>稿件信息</th>
                                    <th style="width:140px;">稿件状态</th>
                                    <th style="width:140px;">分配状态</th>
                                    <th style="width:160px;">分配时间</th>
                                    <th style="width:180px;">您的建议</th>
                                    <th style="width:280px;">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(t, idx) in filteredTasks" :key="t.assignment.id">
                                    <td class="text-muted">{{ idx + 1 }}</td>
                                    <td>
                                        <div class="table-title" style="cursor:pointer;" @click="goDetail(t.manuscript.id)">
                                            {{ t.manuscript.title }}
                                        </div>
                                        <div class="table-sub">
                                            作者: {{ t.manuscript.author_name || '—' }}
                                            <span v-if="t.manuscript.file_path"> · <a :href="t.manuscript.file_path" target="_blank" class="text-primary" @click.stop>📎下载正文</a></span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge" :class="getManuscriptBadge(t.manuscript.status).class">
                                            {{ getManuscriptBadge(t.manuscript.status).label }}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge" :class="getAssignmentBadge(t.assignment.status).class">
                                            {{ getAssignmentBadge(t.assignment.status).label }}
                                        </span>
                                    </td>
                                    <td class="text-secondary" style="font-size:13px;">
                                        {{ $helpers.formatDateShort(t.assignment.assigned_at) }}
                                    </td>
                                    <td>
                                        <span v-if="t.recommendation_label" class="badge" :class="getRecommendationBadge(t.review ? t.review.recommendation : '') ? getRecommendationBadge(t.review.recommendation).class : 'badge-default'">
                                            {{ t.recommendation_label }}
                                        </span>
                                        <span v-else class="text-muted">未提交</span>
                                    </td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="btn btn-sm btn-outline" @click="goDetail(t.manuscript.id)">查看</button>
                                            <template v-if="t.assignment.status === 'pending'">
                                                <button class="btn btn-sm btn-success" @click="handleAccept(t.assignment.id)">接受</button>
                                                <button class="btn btn-sm btn-secondary" @click="handleDecline(t.assignment.id)">拒绝</button>
                                            </template>
                                            <template v-if="t.assignment.status === 'accepted'">
                                                <button class="btn btn-sm btn-primary" @click="openReviewModal(t.assignment.id)">填写意见</button>
                                            </template>
                                            <template v-if="t.assignment.status === 'completed'">
                                                <button class="btn btn-sm btn-outline" @click="openReviewModal(t.assignment.id)">查看意见</button>
                                            </template>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false" style="z-index:9999;">
                <div class="modal modal-xl" style="z-index:10000;">
                    <review-form
                        :assignment-id="selectedAssignmentId"
                        @close="showReviewModal = false"
                        @submitted="showReviewModal = false; loadTasks(); loadStats();">
                    </review-form>
                </div>
            </div>
        </div>
    `
};
