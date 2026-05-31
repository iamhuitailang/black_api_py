const MyRecordsPage = {
    records: [],
    loading: true,

    render() {
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <div class="header-title">📊 游戏记录</div>
                </div>
                <div class="record-list" id="recordList">
                    <div class="loading-state"><div class="loading-spinner"></div></div>
                </div>
            </div>
        `
        this.loadRecords()
    },

    async loadRecords() {
        try {
            const result = await GameService.getRecords()
            if (result.code === 0 && result.data) {
                this.records = result.data.items || []
                this.renderRecords()
            } else {
                document.getElementById('recordList').innerHTML =
                    '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">暂无记录</div></div>'
            }
        } catch (error) {
            document.getElementById('recordList').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">😢</div><div class="empty-state-text">加载失败</div></div>'
        }
    },

    renderRecords() {
        const list = document.getElementById('recordList')
        if (this.records.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">暂无记录</div></div>'
            return
        }
        list.innerHTML = this.records.map(record => {
            const date = new Date(record.created_at)
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
            return `
                <div class="record-item">
                    <div class="record-left">
                        <div class="record-score">${record.score} 分</div>
                        <div class="record-meta">
                            <span>⏱️ ${record.duration}秒</span>
                            <span>🔥 最高${record.max_combo}连击</span>
                        </div>
                        <div class="record-date">${dateStr}</div>
                    </div>
                    <div class="record-right">
                        <span class="badge ${record.is_completed ? 'badge-success' : 'badge-secondary'}">
                            ${record.is_completed ? '通关' : '未通关'}
                        </span>
                    </div>
                </div>
            `
        }).join('')
    }
}
