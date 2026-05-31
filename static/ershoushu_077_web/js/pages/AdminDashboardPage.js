const AdminDashboardPage = {
    template: `
    <div>
        <div class="page-header"><h1 class="page-title">📊 数据统计</h1></div>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">书籍总数</span><div class="stat-card-icon primary">📚</div></div><div class="stat-card-value">{{ stats.bookTotal }}</div><div class="stat-card-desc">在售 {{ stats.bookOnsale }}</div></div>
            <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">交易总数</span><div class="stat-card-icon success">🔄</div></div><div class="stat-card-value">{{ stats.tradeTotal }}</div><div class="stat-card-desc">已完成 {{ stats.tradeCompleted }}</div></div>
            <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">交易金额</span><div class="stat-card-icon warning">💰</div></div><div class="stat-card-value">¥{{ stats.totalAmount }}</div><div class="stat-card-desc">累计成交额</div></div>
            <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">待处理投诉</span><div class="stat-card-icon danger">📢</div></div><div class="stat-card-value">{{ stats.complaintPending }}</div><div class="stat-card-desc">投诉总数 {{ stats.complaintTotal }}</div></div>
        </div>
    </div>
    `,
    data() {
        return { stats: { bookTotal: 0, bookOnsale: 0, tradeTotal: 0, tradeCompleted: 0, totalAmount: '0.00', complaintTotal: 0, complaintPending: 0 } };
    },
    async mounted() {
        const [bookResult, tradeResult, complaintResult] = await Promise.all([
            BookService.getStatistics(), TradeService.getStatistics(), ComplaintService.getStatistics()
        ]);
        if (bookResult.code === 0) { this.stats.bookTotal = bookResult.data.total; this.stats.bookOnsale = bookResult.data.onsale; }
        if (tradeResult.code === 0) { this.stats.tradeTotal = tradeResult.data.total; this.stats.tradeCompleted = tradeResult.data.completed; this.stats.totalAmount = tradeResult.data.total_amount; }
        if (complaintResult.code === 0) { this.stats.complaintTotal = complaintResult.data.total; this.stats.complaintPending = complaintResult.data.pending; }
    }
};
