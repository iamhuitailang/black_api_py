const MyComplaintsPage = {
    template: `
    <div>
        <div class="page-header flex-between">
            <h1 class="page-title">📢 我的投诉</h1>
            <button class="btn btn-primary" @click="openCreateModal">+ 提交投诉</button>
        </div>
        <div v-if="loading" class="text-center" style="padding:40px"><span class="loading-spinner"></span></div>
        <div v-else-if="complaints.length===0" class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无投诉记录</div></div>
        <div v-else>
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>投诉原因</th><th>状态</th><th>提交时间</th><th>管理员回复</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr v-for="c in complaints" :key="c.id">
                            <td>{{ c.reason }}</td>
                            <td><span class="badge" :class="c.status===0?'badge-warning':c.status===1?'badge-info':'badge-success'">{{ c.status_text }}</span></td>
                            <td>{{ Utils.formatDateTime(c.created_at) }}</td>
                            <td>{{ c.admin_reply || '暂无回复' }}</td>
                            <td><button class="btn btn-outline btn-sm" @click="viewDetail(c)">查看</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination">
                <button class="pagination-btn" :disabled="page<=1" @click="page--;loadComplaints()">上一页</button>
                <span style="font-size:13px;color:var(--text-secondary)">{{ page }} / {{ totalPages||1 }}</span>
                <button class="pagination-btn" :disabled="page>=totalPages" @click="page++;loadComplaints()">下一页</button>
            </div>
        </div>
        <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal=false">
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-title">提交投诉</div>
                    <button class="modal-close" @click="showCreateModal=false">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">投诉原因</label>
                        <select v-model="complaintForm.reason" class="form-select">
                            <option value="">请选择投诉原因</option>
                            <option value="商品描述不符">商品描述不符</option>
                            <option value="价格问题">价格问题</option>
                            <option value="交易纠纷">交易纠纷</option>
                            <option value="沟通问题">沟通问题</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">详细描述</label>
                        <textarea v-model="complaintForm.description" placeholder="请详细描述您遇到的问题..." rows="4"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" @click="showCreateModal=false">取消</button>
                    <button class="btn btn-primary" @click="submitComplaint" :disabled="submitting">{{ submitting ? '提交中...' : '提交投诉' }}</button>
                </div>
            </div>
        </div>
        <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal=false">
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-title">投诉详情</div>
                    <button class="modal-close" @click="showDetailModal=false">×</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom:16px">
                        <div style="font-weight:500;margin-bottom:8px">投诉原因</div>
                        <div style="color:var(--text-secondary)">{{ currentComplaint?.reason }}</div>
                    </div>
                    <div style="margin-bottom:16px">
                        <div style="font-weight:500;margin-bottom:8px">详细描述</div>
                        <div style="color:var(--text-secondary)">{{ currentComplaint?.description || '无' }}</div>
                    </div>
                    <div style="margin-bottom:16px">
                        <div style="font-weight:500;margin-bottom:8px">状态</div>
                        <span class="badge" :class="currentComplaint?.status===0?'badge-warning':currentComplaint?.status===1?'badge-info':'badge-success'">{{ currentComplaint?.status_text }}</span>
                    </div>
                    <div>
                        <div style="font-weight:500;margin-bottom:8px">管理员回复</div>
                        <div style="color:var(--text-secondary)">{{ currentComplaint?.admin_reply || '暂无回复' }}</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" @click="showDetailModal=false">关闭</button>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            complaints: [], loading: false, page: 1, pageSize: 10, totalPages: 0,
            showCreateModal: false, showDetailModal: false, submitting: false,
            complaintForm: { reason: '', description: '' },
            currentComplaint: null,
            Utils: Utils
        };
    },
    async mounted() { await this.loadComplaints(); },
    methods: {
        async loadComplaints() {
            this.loading = true;
            try {
                const result = await ComplaintService.getMyComplaints({ page: this.page, page_size: this.pageSize });
                if (result.code === 0) { this.complaints = result.data.items; this.totalPages = result.data.total_pages; }
            } finally { this.loading = false; }
        },
        openCreateModal() {
            this.complaintForm = { reason: '', description: '' };
            this.showCreateModal = true;
        },
        async submitComplaint() {
            if (!this.complaintForm.reason) { this.$root.showToast('请选择投诉原因', 'error'); return; }
            this.submitting = true;
            try {
                const result = await ComplaintService.create(this.complaintForm);
                if (result.code === 0) {
                    this.$root.showToast('投诉已提交', 'success');
                    this.showCreateModal = false;
                    await this.loadComplaints();
                } else {
                    this.$root.showToast(result.msg || '提交失败', 'error');
                }
            } finally { this.submitting = false; }
        },
        viewDetail(c) {
            this.currentComplaint = c;
            this.showDetailModal = true;
        }
    }
};
