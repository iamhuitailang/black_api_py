const AdminComplaintPage = {
    template: `
        <div>
            <div class="page-header">
                <h1 class="page-title">投诉管理</h1>
            </div>

            <div class="card">
                <div class="filter-bar">
                    <select v-model="filterStatus" @change="loadComplaints">
                        <option value="">全部状态</option>
                        <option value="0">待处理</option>
                        <option value="1">已处理</option>
                        <option value="2">已驳回</option>
                    </select>
                    <button class="btn-small btn-info" @click="loadComplaints">刷新</button>
                </div>

                <div v-if="complaints.length === 0 && !loading" class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <p>暂无投诉记录</p>
                </div>

                <div v-else class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>投诉人</th>
                                <th>被投诉人</th>
                                <th>投诉原因</th>
                                <th>状态</th>
                                <th>投诉时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="complaint in complaints" :key="complaint.id">
                                <td>{{ complaint.id }}</td>
                                <td>
                                    <div class="user-info-cell">
                                        <div class="user-avatar">{{ complaint.from_user_nickname ? complaint.from_user_nickname.charAt(0) : '?' }}</div>
                                        <div>
                                            <div>{{ complaint.from_user_nickname || '-' }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="user-info-cell">
                                        <div class="user-avatar">{{ complaint.to_user_nickname ? complaint.to_user_nickname.charAt(0) : '?' }}</div>
                                        <div>
                                            <div>{{ complaint.to_user_nickname || '-' }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="max-width:200px;">
                                    <div><strong>{{ complaint.reason }}</strong></div>
                                    <div style="color:#888;font-size:12px;" v-if="complaint.description">{{ complaint.description }}</div>
                                </td>
                                <td>
                                    <span :class="['status-badge', getStatusClass(complaint.status)]">
                                        {{ getStatusText(complaint.status) }}
                                    </span>
                                </td>
                                <td>{{ complaint.created_at }}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button v-if="complaint.status === 0" class="btn-small btn-success" 
                                                @click="showProcessModal(complaint, 1)">处理</button>
                                        <button v-if="complaint.status === 0" class="btn-small btn-danger" 
                                                @click="showProcessModal(complaint, 2)">驳回</button>
                                        <button v-if="complaint.status !== 0" class="btn-small btn-info" 
                                                @click="showDetailModal(complaint)">查看</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button @click="changePage(page - 1)" :disabled="page <= 1">上一页</button>
                    <button v-for="p in totalPages" :key="p" 
                            :class="{ active: p === page }"
                            @click="changePage(p)">{{ p }}</button>
                    <button @click="changePage(page + 1)" :disabled="page >= totalPages">下一页</button>
                </div>
            </div>

            <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">{{ modalTitle }}</div>
                        <button class="modal-close" @click="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group" v-if="currentComplaint">
                            <label>投诉原因</label>
                            <div style="padding:10px;background:#f5f5f5;border-radius:8px;">
                                {{ currentComplaint.reason }}
                            </div>
                        </div>
                        <div class="form-group" v-if="currentComplaint">
                            <label>投诉详情</label>
                            <div style="padding:10px;background:#f5f5f5;border-radius:8px;min-height:60px;">
                                {{ currentComplaint.description || '无' }}
                            </div>
                        </div>
                        <div class="form-group" v-if="processing">
                            <label>处理回复</label>
                            <textarea v-model="processReply" rows="4" placeholder="请输入处理回复..."></textarea>
                        </div>
                        <div class="form-group" v-if="!processing && currentComplaint">
                            <label>处理回复</label>
                            <div style="padding:10px;background:#f5f5f5;border-radius:8px;">
                                {{ currentComplaint.reply || '无' }}
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button v-if="processing" class="btn btn-secondary" @click="closeModal">取消</button>
                        <button v-if="processing" class="btn btn-primary" @click="submitProcess">确认提交</button>
                        <button v-if="!processing" class="btn btn-primary" @click="closeModal">关闭</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            complaints: [],
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            filterStatus: '',
            loading: false,
            showModal: false,
            processing: false,
            modalTitle: '',
            currentComplaint: null,
            processStatus: 1,
            processReply: ''
        };
    },
    mounted() {
        this.loadComplaints();
    },
    methods: {
        async loadComplaints() {
            this.loading = true;
            const params = {
                page: this.page,
                page_size: this.pageSize
            };
            if (this.filterStatus !== '') params.status = this.filterStatus;

            const result = await Api.get('/jaoyou/admin/complaint/list/get', params);
            this.loading = false;

            if (result.code === 0) {
                this.complaints = result.data.items;
                this.total = result.data.total;
                this.totalPages = result.data.total_pages;
            }
        },
        changePage(newPage) {
            if (newPage >= 1 && newPage <= this.totalPages) {
                this.page = newPage;
                this.loadComplaints();
            }
        },
        getStatusClass(status) {
            const classes = {
                0: 'status-pending',
                1: 'status-active',
                2: 'status-rejected'
            };
            return classes[status] || '';
        },
        getStatusText(status) {
            const texts = {
                0: '待处理',
                1: '已处理',
                2: '已驳回'
            };
            return texts[status] || '未知';
        },
        showProcessModal(complaint, status) {
            this.currentComplaint = complaint;
            this.processStatus = status;
            this.processing = true;
            this.modalTitle = status === 1 ? '处理投诉' : '驳回投诉';
            this.processReply = '';
            this.showModal = true;
        },
        showDetailModal(complaint) {
            this.currentComplaint = complaint;
            this.processing = false;
            this.modalTitle = '投诉详情';
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
            this.currentComplaint = null;
            this.processing = false;
            this.processReply = '';
        },
        async submitProcess() {
            const result = await Api.post('/jaoyou/admin/complaint/process', {
                complaint_id: this.currentComplaint.id,
                status: this.processStatus,
                reply: this.processReply
            });

            if (result.code === 0) {
                alert('操作成功');
                this.closeModal();
                this.loadComplaints();
            } else {
                alert(result.msg);
            }
        }
    }
};
