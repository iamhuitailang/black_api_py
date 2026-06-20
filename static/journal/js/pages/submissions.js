const SubmissionsPage = {
    data() {
        return {
            loading: false,
            manuscripts: [],
            total: 0,
            page: 1,
            pageSize: 10,
            activeTab: 'all',
            statusTabs: [
                { key: 'all', label: '全部' },
                { key: 'draft', label: '草稿' },
                { key: 'submitted', label: '待分配' },
                { key: 'under_review', label: '审稿中' },
                { key: 'review_completed', label: '审稿完成' },
                { key: 'accepted', label: '已录用' },
                { key: 'revision_required', label: '需修改' },
                { key: 'rejected', label: '已退稿' }
            ]
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.total / this.pageSize) || 1;
        },
        statusMap() {
            return {
                draft: { label: '草稿', class: 'badge-default' },
                submitted: { label: '待分配', class: 'badge-info' },
                under_review: { label: '审稿中', class: 'badge-warning' },
                review_completed: { label: '审稿完成', class: 'badge-primary' },
                accepted: { label: '已录用', class: 'badge-success' },
                revision_required: { label: '需修改', class: 'badge-warning' },
                rejected: { label: '已退稿', class: 'badge-danger' },
                published: { label: '已发表', class: 'badge-success' }
            };
        }
    },
    methods: {
        async loadData() {
            this.loading = true;
            try {
                const res = await JournalService.getMySubmissions(this.page, this.pageSize);
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
        goEdit(id) {
            this.$root.navigateTo(`edit-submission/${id}`);
        },
        goDetail(id) {
            this.$root.navigateTo(`manuscript-detail/${id}`);
        },
        goSubmit() {
            this.$root.navigateTo('submit');
        },
        async handleSubmit(id) {
            if (!confirm('确定提交该稿件进入审稿流程？提交后将无法修改。')) return;
            const res = await JournalService.submitManuscript(id);
            if (res.code === 0) {
                Toast.success(res.message || '提交成功');
                this.loadData();
            } else {
                Toast.error(res.message || '提交失败');
            }
        },
        async handleDelete(id) {
            if (!confirm('确定删除该稿件？此操作无法撤销。')) return;
            const res = await JournalService.deleteManuscript(id);
            if (res.code === 0) {
                Toast.success('删除成功');
                this.loadData();
            } else {
                Toast.error(res.message || '删除失败');
            }
        },
        getStatusBadge(status) {
            const info = this.statusMap[status] || { label: status, class: 'badge-default' };
            return { ...info };
        },
        filterByStatus(list) {
            if (this.activeTab === 'all') return list;
            return list.filter(m => m.status === this.activeTab);
        },
        getTabCounts() {
            const counts = { all: this.total };
            for (const m of this.manuscripts) {
                counts[m.status] = (counts[m.status] || 0) + 1;
            }
            return counts;
        }
    },
    mounted() {
        this.loadData();
    },
    template: `
        <div class="page-container">
            <div class="page-header flex justify-between items-center">
                <div>
                    <h1 class="page-title">📋 我的投稿</h1>
                    <p class="page-subtitle">共 {{ total }} 篇稿件</p>
                </div>
                <button class="btn btn-primary" @click="goSubmit">
                    <span>📝</span> 新建投稿
                </button>
            </div>

            <div class="card">
                <div class="card-header" style="padding-bottom:0;border-bottom:none;">
                    <div class="tabs">
                        <div
                            v-for="tab in statusTabs"
                            :key="tab.key"
                            class="tab-item"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                        >
                            {{ tab.label }}
                        </div>
                    </div>
                </div>
                <div class="card-body" style="padding-top:0;">
                    <div v-if="loading" class="loading-page">
                        <div class="spinner"></div>
                    </div>
                    <div v-else-if="filterByStatus(manuscripts).length === 0" class="empty-state">
                        <div class="empty-icon">📭</div>
                        <h3>暂无稿件</h3>
                        <p>{{ activeTab === 'all' ? '点击右上角按钮开始投稿' : '该状态下暂无稿件' }}</p>
                        <button v-if="activeTab === 'all'" class="btn btn-primary mt-4" @click="goSubmit">立即投稿</button>
                    </div>
                    <div v-else class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="width:60px;">#</th>
                                    <th>稿件标题</th>
                                    <th style="width:120px;">栏目</th>
                                    <th style="width:120px;">状态</th>
                                    <th style="width:180px;">进度</th>
                                    <th style="width:160px;">提交时间</th>
                                    <th style="width:200px;">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(m, idx) in filterByStatus(manuscripts)" :key="m.id">
                                    <td class="text-muted">#{{ m.id }}</td>
                                    <td>
                                        <div class="table-title" style="cursor:pointer;" @click="goDetail(m.id)">
                                            {{ m.title }}
                                        </div>
                                        <div class="table-sub">{{ m.keywords || '暂无关键词' }}</div>
                                    </td>
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
                                        {{ m.submitted_at ? $helpers.formatDateShort(m.submitted_at) : '未提交' }}
                                    </td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="btn btn-sm btn-outline" @click="goDetail(m.id)">详情</button>
                                            <button v-if="m.status === 'draft'" class="btn btn-sm btn-primary" @click="goEdit(m.id)">编辑</button>
                                            <button v-if="m.status === 'draft'" class="btn btn-sm btn-success" @click="handleSubmit(m.id)">提交</button>
                                            <button v-if="m.status === 'draft'" class="btn btn-sm btn-danger" @click="handleDelete(m.id)">删除</button>
                                        </div>
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
