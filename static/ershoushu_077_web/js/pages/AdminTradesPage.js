const AdminTradesPage = {
    template: `
    <div>
        <div class="page-header"><h1 class="page-title">🔄 交易管理</h1></div>
        <div class="toolbar">
            <div class="toolbar-right">
                <select v-model="currentStatus" @change="page=1;loadTrades()" style="width:120px;padding:8px">
                    <option :value="null">全部状态</option>
                    <option :value="0">待确认</option>
                    <option :value="1">已确认</option>
                    <option :value="2">已完成</option>
                    <option :value="3">已取消</option>
                </select>
            </div>
        </div>
        <div class="card">
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>ID</th><th>书籍</th><th>买家</th><th>卖家</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
                    <tbody>
                        <tr v-for="trade in trades" :key="trade.id">
                            <td>{{ trade.id }}</td>
                            <td>{{ trade.book?.title || '-' }}</td>
                            <td>{{ trade.buyer?.nickname || '-' }}</td>
                            <td>{{ trade.seller?.nickname || '-' }}</td>
                            <td style="color:var(--danger);font-weight:600">¥{{ Utils.formatPrice(trade.price) }}</td>
                            <td><span class="badge" :class="Utils.getTradeStatusBadge(trade.status)">{{ Utils.getTradeStatusText(trade.status) }}</span></td>
                            <td>{{ Utils.formatDateTime(trade.created_at) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="pagination">
            <button class="pagination-btn" :disabled="page<=1" @click="page--;loadTrades()">上一页</button>
            <span style="font-size:13px;color:var(--text-secondary)">{{ page }} / {{ totalPages||1 }}</span>
            <button class="pagination-btn" :disabled="page>=totalPages" @click="page++;loadTrades()">下一页</button>
        </div>
    </div>
    `,
    data() {
        return { trades: [], currentStatus: null, page: 1, pageSize: 10, totalPages: 0, Utils: Utils };
    },
    async mounted() { await this.loadTrades(); },
    methods: {
        async loadTrades() {
            const params = { page: this.page, page_size: this.pageSize };
            if (this.currentStatus !== null) params.status = this.currentStatus;
            const result = await TradeService.getAdminList(params);
            if (result.code === 0) { this.trades = result.data.items; this.totalPages = result.data.total_pages; }
        }
    }
};
