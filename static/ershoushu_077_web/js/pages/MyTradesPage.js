const MyTradesPage = {
    template: `
    <div>
        <div class="page-header flex-between">
            <h1 class="page-title">🔄 我的交易</h1>
            <div style="display:flex;gap:8px">
                <button v-for="s in statusOptions" :key="s.value" class="btn btn-sm" :class="currentStatus===s.value?'btn-primary':'btn-outline'" @click="currentStatus=s.value;page=1;loadTrades()">{{ s.label }}</button>
            </div>
        </div>
        <div v-if="loading" class="text-center" style="padding:40px"><span class="loading-spinner"></span></div>
        <div v-else-if="trades.length===0" class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">暂无交易记录</div></div>
        <div v-else>
            <div v-for="trade in trades" :key="trade.id" class="trade-item">
                <div class="trade-item-header">
                    <div class="trade-item-title">{{ trade.book?.title || '未知书籍' }}</div>
                    <span class="badge" :class="Utils.getTradeStatusBadge(trade.status)">{{ Utils.getTradeStatusText(trade.status) }}</span>
                </div>
                <div class="trade-item-body">
                    <div class="trade-item-info">
                        <div class="trade-item-info-row"><span>对方：</span><span>{{ trade.other_user?.nickname || '未知' }}</span></div>
                        <div class="trade-item-info-row"><span>时间：</span><span>{{ Utils.formatDateTime(trade.created_at) }}</span></div>
                    </div>
                    <div class="trade-item-price">¥{{ Utils.formatPrice(trade.price) }}</div>
                </div>
                <div style="display:flex;gap:8px;margin-top:12px" v-if="trade.status===0 || trade.status===1">
                    <button v-if="trade.status===0" class="btn btn-success btn-sm" @click="confirmTrade(trade.id)">确认交易</button>
                    <button v-if="trade.status===1" class="btn btn-primary btn-sm" @click="completeTrade(trade.id)">完成交易</button>
                    <button class="btn btn-danger btn-sm" @click="cancelTrade(trade.id)">取消</button>
                    <button class="btn btn-outline btn-sm" @click="openComplaint(trade)">投诉</button>
                </div>
                <div v-if="trade.status===2" style="margin-top:8px">
                    <button class="btn btn-outline btn-sm" @click="openReview(trade)">📝 评价</button>
                    <button class="btn btn-outline btn-sm" style="margin-left:8px" @click="openComplaint(trade)">投诉</button>
                </div>
                <div v-if="trade.status===3" style="margin-top:8px">
                    <button class="btn btn-outline btn-sm" @click="openComplaint(trade)">投诉</button>
                </div>
            </div>
            <div class="pagination">
                <button class="pagination-btn" :disabled="page<=1" @click="page--;loadTrades()">上一页</button>
                <span style="font-size:13px;color:var(--text-secondary);padding:0 8px">{{ page }} / {{ totalPages||1 }}</span>
                <button class="pagination-btn" :disabled="page>=totalPages" @click="page++;loadTrades()">下一页</button>
            </div>
        </div>
        <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal=false">
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-title">评价交易</div>
                    <button class="modal-close" @click="showReviewModal=false">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">评分</label>
                        <div class="star-rating">
                            <span v-for="s in 5" :key="s" class="star" :class="{active:s<=reviewForm.rating}" @click="reviewForm.rating=s">★</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">评价内容</label>
                        <textarea v-model="reviewForm.content" placeholder="说说你的交易体验..." rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" @click="showReviewModal=false">取消</button>
                    <button class="btn btn-primary" @click="submitReview" :disabled="submitting">提交评价</button>
                </div>
            </div>
        </div>
        <div v-if="showComplaintModal" class="modal-overlay" @click.self="showComplaintModal=false">
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-title">提交投诉</div>
                    <button class="modal-close" @click="showComplaintModal=false">×</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom:16px;padding:12px;background:var(--bg-secondary);border-radius:var(--radius);font-size:13px">
                        <strong>交易书籍：</strong>{{ currentTrade?.book?.title || '未知' }}<br>
                        <strong>对方用户：</strong>{{ currentTrade?.other_user?.nickname || '未知' }}
                    </div>
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
                    <button class="btn btn-outline" @click="showComplaintModal=false">取消</button>
                    <button class="btn btn-danger" @click="submitComplaint" :disabled="submitting">{{ submitting ? '提交中...' : '提交投诉' }}</button>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            trades: [], loading: false, page: 1, pageSize: 10, total: 0, totalPages: 0,
            currentStatus: null,
            statusOptions: [
                { value: null, label: '全部' },
                { value: 0, label: '待确认' },
                { value: 1, label: '已确认' },
                { value: 2, label: '已完成' },
                { value: 3, label: '已取消' }
            ],
            showReviewModal: false, showComplaintModal: false, submitting: false,
            reviewForm: { trade_id: 0, rating: 5, content: '' },
            complaintForm: { trade_id: 0, target_user_id: 0, reason: '', description: '' },
            currentTrade: null,
            Utils: Utils
        };
    },
    async mounted() { await this.loadTrades(); },
    methods: {
        async loadTrades() {
            this.loading = true;
            try {
                const params = { page: this.page, page_size: this.pageSize };
                if (this.currentStatus !== null) params.status = this.currentStatus;
                const result = await TradeService.getMyTrades(params);
                if (result.code === 0) {
                    this.trades = result.data.items;
                    this.total = result.data.total;
                    this.totalPages = result.data.total_pages;
                }
            } finally { this.loading = false; }
        },
        async confirmTrade(tradeId) {
            const result = await TradeService.confirm(tradeId);
            if (result.code === 0) { this.$root.showToast('确认成功', 'success'); await this.loadTrades(); }
            else this.$root.showToast(result.msg || '操作失败', 'error');
        },
        async completeTrade(tradeId) {
            if (!confirm('确定完成交易？')) return;
            const result = await TradeService.complete(tradeId);
            if (result.code === 0) { this.$root.showToast('交易已完成', 'success'); await this.loadTrades(); }
            else this.$root.showToast(result.msg || '操作失败', 'error');
        },
        async cancelTrade(tradeId) {
            if (!confirm('确定取消交易？')) return;
            const result = await TradeService.cancel(tradeId);
            if (result.code === 0) { this.$root.showToast('交易已取消', 'success'); await this.loadTrades(); }
            else this.$root.showToast(result.msg || '操作失败', 'error');
        },
        openReview(trade) {
            this.reviewForm = { trade_id: trade.id, rating: 5, content: '' };
            this.showReviewModal = true;
        },
        async submitReview() {
            this.submitting = true;
            try {
                const result = await TradeService.createReview(this.reviewForm);
                if (result.code === 0) { this.$root.showToast('评价成功', 'success'); this.showReviewModal = false; await this.loadTrades(); }
                else this.$root.showToast(result.msg || '评价失败', 'error');
            } finally { this.submitting = false; }
        },
        openComplaint(trade) {
            this.currentTrade = trade;
            this.complaintForm = {
                trade_id: trade.id,
                target_user_id: trade.other_user?.id || 0,
                reason: '',
                description: ''
            };
            this.showComplaintModal = true;
        },
        async submitComplaint() {
            if (!this.complaintForm.reason) { this.$root.showToast('请选择投诉原因', 'error'); return; }
            this.submitting = true;
            try {
                const result = await ComplaintService.create(this.complaintForm);
                if (result.code === 0) {
                    this.$root.showToast('投诉已提交', 'success');
                    this.showComplaintModal = false;
                } else {
                    this.$root.showToast(result.msg || '提交失败', 'error');
                }
            } finally { this.submitting = false; }
        }
    }
};
