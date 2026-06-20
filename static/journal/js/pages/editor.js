const EditorDashboardPage = {
    data() {
        return {
            loading: false,
            stats: {},
            statusLabels: {
                draft: { label: '草稿', color: 'stat-icon-blue' },
                submitted: { label: '待分配', color: 'stat-icon-yellow' },
                under_review: { label: '审稿中', color: 'stat-icon-blue' },
                review_completed: { label: '审稿完成', color: 'stat-icon-purple' },
                accepted: { label: '已录用', color: 'stat-icon-green' },
                revision_required: { label: '需修改', color: 'stat-icon-yellow' },
                rejected: { label: '已退稿', color: 'stat-icon-red' },
                published: { label: '已发表', color: 'stat-icon-green' }
            },
            recentManuscripts: []
        };
    },
    computed: {
        statCards() {
            const cards = [];
            const order = ['submitted', 'under_review', 'review_completed', 'accepted', 'rejected'];
            for (const key of order) {
                if (this.stats[key]) {
                    cards.push({
                        key,
                        count: this.stats[key].count,
                        label: this.stats[key].label,
                        color: this.statusLabels[key] ? this.statusLabels[key].color : 'stat-icon-blue'
                    });
                }
            }
            return cards;
        }
    },
    methods: {
        async loadStats() {
            this.loading = true;
            try {
                const res = await JournalService.getEditorDashboard();
                if (res.code === 0 && res.data) {
                    this.stats = res.data;
                }
            } finally {
                this.loading = false;
            }
        },
        async loadRecent() {
            const res = await JournalService.getAllManuscripts(null, 1, 5);
            if (res.code === 0 && res.data) {
                this.recentManuscripts = res.data.items || [];
            }
        },
        goAllManuscripts(status = null) {
            this.$root.navigateTo('all-manuscripts', { status });
        },
        goDetail(id) {
            this.$root.navigateTo(`manuscript-detail/${id}`);
        },
        getStatusBadge(status) {
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
        }
    },
    mounted() {
        this.loadStats();
        this.loadRecent();
    },
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">📊 编辑工作台</h1>
                <p class="page-subtitle">投稿审稿全流程状态概览</p>
            </div>

            <div v-if="loading" class="loading-page">
                <div class="spinner"></div>
            </div>

            <div v-if="!loading && Object.keys(stats).length > 0">
                <div class="card mb-4" style="background:linear-gradient(135deg,#1e3a8a,#3730a3);color:white;">
                    <div class="card-body">
                        <div class="flex justify-between items-center gap-6" style="flex-wrap:wrap;">
                            <div>
                                <div style="font-size:15px;opacity:0.8;margin-bottom:8px;">系统总稿件数</div>
                                <div style="font-size:48px;font-weight:700;line-height:1;">{{ stats.total || 0 }}</div>
                                <div style="font-size:13px;opacity:0.7;margin-top:8px;">
                                    草稿 {{ stats.draft ? stats.draft.count : 0 }} ·
                                    处理中 {{ (stats.submitted ? stats.submitted.count : 0) + (stats.under_review ? stats.under_review.count : 0) + (stats.review_completed ? stats.review_completed.count : 0) }}
                                </div>
                            </div>
                            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;min-width:400px;">
                                <div style="background:rgba(255,255,255,0.1);padding:16px;border-radius:8px;text-align:center;">
                                    <div style="font-size:28px;font-weight:600;">{{ stats.accepted ? stats.accepted.count : 0 }}</div>
                                    <div style="font-size:12px;opacity:0.8;">已录用</div>
                                </div>
                                <div style="background:rgba(255,255,255,0.1);padding:16px;border-radius:8px;text-align:center;">
                                    <div style="font-size:28px;font-weight:600;">{{ stats.rejected ? stats.rejected.count : 0 }}</div>
                                    <div style="font-size:12px;opacity:0.8;">已退稿</div>
                                </div>
                                <div style="background:rgba(255,255,255,0.1);padding:16px;border-radius:8px;text-align:center;">
                                    <div style="font-size:28px;font-weight:600;">{{ stats.published ? stats.published.count : 0 }}</div>
                                    <div style="font-size:12px;opacity:0.8;">已发表</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">
                    <div
                        v-for="card in statCards"
                        :key="card.key"
                        class="stat-card"
                        style="cursor:pointer;"
                        @click="goAllManuscripts(card.key)">
                        <div class="stat-icon" :class="card.color">
                            {{ card.key === 'submitted' ? '📥' :
                               card.key === 'under_review' ? '🔬' :
                               card.key === 'review_completed' ? '✅' :
                               card.key === 'accepted' ? '🎉' : '❌' }}
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ card.count }}</div>
                            <div class="stat-label">{{ card.label }}</div>
                        </div>
                    </div>
                </div>

                <div class="card mt-4">
                    <div class="card-header">
                        <div class="card-title">📋 最近投稿</div>
                        <button class="btn btn-sm btn-outline" @click="goAllManuscripts()">查看全部 →</button>
                    </div>
                    <div class="card-body" style="padding:0;">
                        <div v-if="recentManuscripts.length === 0" class="empty-state">
                            <div class="empty-icon">📭</div>
                            <p>暂无稿件</p>
                        </div>
                        <div v-else class="table-container" style="border:none;border-radius:0;">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>标题</th>
                                        <th style="width:120px;">作者</th>
                                        <th style="width:120px;">状态</th>
                                        <th style="width:160px;">提交时间</th>
                                        <th style="width:140px;">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(m, idx) in recentManuscripts" :key="m.id">
                                        <td class="text-muted">#{{ m.id }}</td>
                                        <td>
                                            <div class="table-title" style="cursor:pointer;" @click="goDetail(m.id)">{{ m.title }}</div>
                                        </td>
                                        <td>{{ m.author_name || '—' }}</td>
                                        <td>
                                            <span class="badge" :class="getStatusBadge(m.status).class">
                                                {{ getStatusBadge(m.status).label }}
                                            </span>
                                        </td>
                                        <td class="text-secondary" style="font-size:13px;">{{ $helpers.formatDateShort(m.submitted_at || m.created_at) }}</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline" @click="goDetail(m.id)">详情</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

const AllManuscriptsPage = {
    data() {
        return {
            loading: false,
            manuscripts: [],
            total: 0,
            page: 1,
            pageSize: 10,
            activeTab: 'all',
            tabs: [
                { key: 'all', label: '全部' },
                { key: 'submitted', label: '待分配' },
                { key: 'under_review', label: '审稿中' },
                { key: 'review_completed', label: '审稿完成' },
                { key: 'accepted', label: '已录用' },
                { key: 'revision_required', label: '需修改' },
                { key: 'rejected', label: '已退稿' },
                { key: 'published', label: '已发表' }
            ]
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.total / this.pageSize) || 1;
        }
    },
    methods: {
        async loadData() {
            this.loading = true;
            try {
                const status = this.activeTab === 'all' ? null : this.activeTab;
                const res = await JournalService.getAllManuscripts(status, this.page, this.pageSize);
                if (res.code === 0 && res.data) {
                    this.manuscripts = res.data.items || [];
                    this.total = res.data.total || 0;
                }
            } finally {
                this.loading = false;
            }
        },
        goToPage(p) {
            if (p < 1 || p > this.totalPages || p === this.page) return;
            this.page = p;
            this.loadData();
        },
        goDetail(id) {
            this.$root.navigateTo(`manuscript-detail/${id}`);
        },
        getStatusBadge(status) {
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
        }
    },
    mounted() {
        if (this.$route && this.$route.params && this.$route.params.status) {
            this.activeTab = this.$route.params.status;
        }
        this.loadData();
    },
    watch: {
        activeTab() {
            this.page = 1;
            this.loadData();
        }
    },
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">📚 全部稿件</h1>
                <p class="page-subtitle">管理系统中的所有稿件，共 {{ total }} 篇</p>
            </div>

            <div class="card">
                <div class="card-header" style="padding-bottom:0;border-bottom:none;">
                    <div class="tabs" style="overflow-x:auto;flex-wrap:nowrap;white-space:nowrap;">
                        <div
                            v-for="tab in tabs"
                            :key="tab.key"
                            class="tab-item"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                            style="flex-shrink:0;">
                            {{ tab.label }}
                        </div>
                    </div>
                </div>
                <div class="card-body" style="padding-top:0;">
                    <div v-if="loading" class="loading-page">
                        <div class="spinner"></div>
                    </div>
                    <div v-else-if="manuscripts.length === 0" class="empty-state">
                        <div class="empty-icon">📭</div>
                        <h3>暂无稿件</h3>
                        <p>{{ activeTab === 'all' ? '系统中暂无稿件' : '该状态下暂无稿件' }}</p>
                    </div>
                    <div v-else class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="width:60px;">#</th>
                                    <th>标题</th>
                                    <th style="width:120px;">作者</th>
                                    <th style="width:100px;">栏目</th>
                                    <th style="width:120px;">状态</th>
                                    <th style="width:180px;">进度</th>
                                    <th style="width:150px;">提交时间</th>
                                    <th style="width:120px;">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="m in manuscripts" :key="m.id">
                                    <td class="text-muted">#{{ m.id }}</td>
                                    <td>
                                        <div class="table-title" style="cursor:pointer;" @click="goDetail(m.id)">{{ m.title }}</div>
                                        <div class="table-sub">{{ m.keywords || '—' }}</div>
                                    </td>
                                    <td>{{ m.author_name || '—' }}</td>
                                    <td>栏目{{ m.section_id }}</td>
                                    <td>
                                        <span class="badge" :class="getStatusBadge(m.status).class">
                                            {{ getStatusBadge(m.status).label }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="flex items-center gap-2">
                                            <div style="flex:1;height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;">
                                                <div style="height:100%;background:var(--primary-color);width:{{ (m.current_step / 6) * 100 }}%;"></div>
                                            </div>
                                            <span class="text-muted" style="font-size:12px;">{{ m.current_step }}/6</span>
                                        </div>
                                    </td>
                                    <td class="text-secondary" style="font-size:13px;">
                                        {{ $helpers.formatDateShort(m.submitted_at || m.created_at) }}
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-outline" @click="goDetail(m.id)">详情</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-if="total > pageSize" class="pagination">
                        <button class="pagination-btn" @click="goToPage(page - 1)" :disabled="page <= 1">‹</button>
                        <template v-for="p in totalPages" :key="p">
                            <button
                                v-if="totalPages <= 7 || Math.abs(p - page) <= 1 || p === 1 || p === totalPages"
                                class="pagination-btn"
                                :class="{ active: p === page }"
                                @click="goToPage(p)"
                            >{{ p }}</button>
                            <span v-else-if="p === 2 || p === totalPages - 1" style="padding:0 4px;color:var(--text-muted);">...</span>
                        </template>
                        <button class="pagination-btn" @click="goToPage(page + 1)" :disabled="page >= totalPages">›</button>
                        <span class="pagination-info">共 {{ total }} 条</span>
                    </div>
                </div>
            </div>
        </div>
    `
};
