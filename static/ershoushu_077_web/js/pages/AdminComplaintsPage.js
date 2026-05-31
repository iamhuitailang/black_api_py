const AdminComplaintsPage = {
    template: `
    <div>
        <div class="page-header"><h1 class="page-title">📢 投诉处理</h1></div>
        <div class="toolbar">
            <div class="toolbar-right">
                <select v-model="currentStatus" @change="page=1;loadComplaints()" style="width:120px;padding:8px">
                    <option :value="null">全部状态</option>
                    <option :value="0">待处理</option>
                    <option :value="1">处理中</option>
                    <option :value="2">已解决</option>
                </select>
            </div>
        </div>
        <div class="card">
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>ID</th><th>投诉人</th><th>被投诉人</th><th>原因</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr v-for="c in complaints" :key="c.id">
                            <td>{{ c.id }}</td>
                            <td>{{ c.user?.nickname || c.user_id }}</td>
                            <td>{{ c.target_user?.nickname || c.target_user_id || '-' }}</td>
                            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="c.reason">{{ c.reason }}</td>
                            <td><span class="badge" :class="c.status===0?'badge-warning':c.status===1?'badge-info':'badge-success'">{{ Utils.getComplaintStatusText(c.status) }}</span></td>
                            <td>{{ Utils.formatDateTime(c.created_at) }}</td>
                            <td><div class="table-actions">
                                <button v-if="c.status!==2" class="btn btn-primary btn-sm" @click="openHandle(c)">处理</button>
                            </div></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="pagination">
            <button class="pagination-btn" :disabled="page<=1" @click="page--;loadComplaints()">上一页</button>
            <span style="font-size:13px;color:var(--text-secondary)">{{ page }} / {{ totalPages||1 }}</span>
            <button class="pagination-btn" :disabled="page>=totalPages" @click="page++;loadComplaints()">下一页</button>
        </div>
        <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-title">处理投诉</div>
                    <button class="modal-close" @click="showModal=false">×</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom:16px">
                        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">投诉原因</div>
                        <div>{{ currentComplaint.reason }}</div>
                    </div>
                    <div v-if="currentComplaint.description" style="margin-bottom:16px">
                        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">详细描述</div>
                        <div>{{ currentComplaint.description }}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">处理状态</label>
                        <select v-model="handleForm.status">
                            <option :value="1">处理中</option>
                            <option :value="2">已解决</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">管理员回复</label>
                        <textarea v-model="handleForm.admin_reply" placeholder="请输入处理结果..." rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" @click="showModal=false">取消</button>
                    <button class="btn btn-primary" @click="submitHandle" :disabled="submitting">提交</button>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            complaints: [], currentStatus: null, page: 1, pageSize: 10, totalPages: 0,
            showModal: false, submitting: false, currentComplaint: {},
            handleForm: { status: 2, admin_reply: '' }, Utils: Utils
        };
    },
    async mounted() { await this.loadComplaints(); },
    methods: {
        async loadComplaints() {
            const params = { page: this.page, page_size: this.pageSize };
            if (this.currentStatus !== null) params.status = this.currentStatus;
            const result = await ComplaintService.getAdminList(params);
            if (result.code === 0) { this.complaints = result.data.items; this.totalPages = result.data.total_pages; }
        },
        openHandle(c) {
            this.currentComplaint = c;
            this.handleForm = { status: 2, admin_reply: '' };
            this.showModal = true;
        },
        async submitHandle() {
            this.submitting = true;
            try {
                const result = await ComplaintService.handle(this.currentComplaint.id, this.handleForm);
                if (result.code === 0) { this.$root.showToast('处理成功', 'success'); this.showModal = false; await this.loadComplaints(); }
                else this.$root.showToast(result.msg || '处理失败', 'error');
            } finally { this.submitting = false; }
        }
    }
};
