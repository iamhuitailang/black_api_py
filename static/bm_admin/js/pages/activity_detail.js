const ActivityDetailPage = {
    activityId: null,
    activity: null,

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.activityId = urlParams.get('id');
        if (this.activityId) {
            this.loadActivity();
        } else {
            Toast.error('活动ID不存在');
            setTimeout(() => {
                window.location.href = 'activity_list.html';
            }, 1500);
        }
    },

    async loadActivity() {
        const result = await API.activity.detail(this.activityId);
        if (result.code === 0) {
            this.activity = result.data;
            this.render();
        } else {
            Toast.error(result.msg || '加载失败');
        }
    },

    render() {
        const container = document.getElementById('activityDetail');
        if (!container || !this.activity) return;

        const statusMap = {
            1: { text: '报名中', class: 'status-1' },
            2: { text: '进行中', class: 'status-2' },
            3: { text: '已结束', class: 'status-3' },
            4: { text: '已取消', class: 'status-4' }
        };
        const status = statusMap[this.activity.status] || statusMap[1];

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div>
                    <h2 style="margin: 0 0 8px 0;">${this.activity.title}</h2>
                    <span class="status-badge ${status.class}">${status.text}</span>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" onclick="ActivityDetailPage.editActivity()">编辑活动</button>
                    <button class="btn btn-success" onclick="ActivityDetailPage.viewRegistrations()">查看报名</button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
                <div class="info-card">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #333;">基本信息</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; gap: 8px;">
                            <span style="color: #666; min-width: 80px;">📍 地点:</span>
                            <span style="color: #333;">${this.activity.location}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <span style="color: #666; min-width: 80px;">🕐 开始:</span>
                            <span style="color: #333;">${this.activity.start_time ? this.activity.start_time.substring(0, 16) : '-'}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <span style="color: #666; min-width: 80px;">🕐 结束:</span>
                            <span style="color: #333;">${this.activity.end_time ? this.activity.end_time.substring(0, 16) : '-'}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <span style="color: #666; min-width: 80px;">📅 报名开始:</span>
                            <span style="color: #333;">${this.activity.registration_start ? this.activity.registration_start.substring(0, 16) : '-'}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <span style="color: #666; min-width: 80px;">📅 报名截止:</span>
                            <span style="color: #333;">${this.activity.registration_end ? this.activity.registration_end.substring(0, 16) : '-'}</span>
                        </div>
                    </div>
                </div>

                <div class="info-card">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #333;">名额信息</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; gap: 8px;">
                            <span style="color: #666; min-width: 100px;">总名额:</span>
                            <span style="color: #333; font-weight: 600;">${this.activity.total_quota}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <span style="color: #666; min-width: 100px;">剩余名额:</span>
                            <span style="color: #10b981; font-weight: 600;">${this.activity.remaining_quota}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <span style="color: #666; min-width: 100px;">已报名:</span>
                            <span style="color: #667eea; font-weight: 600;">${this.activity.total_quota - this.activity.remaining_quota}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <span style="color: #666; min-width: 100px;">审核方式:</span>
                            <span style="color: #333;">${this.activity.need_approval_text || '无需审核'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="info-card" style="margin-top: 24px;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #333;">活动描述</h3>
                <p style="color: #666; line-height: 1.6; margin: 0;">${this.activity.description || '暂无描述'}</p>
            </div>
        `;
    },

    editActivity() {
        window.location.href = `activity_list.html?edit_id=${this.activityId}`;
    },

    viewRegistrations() {
        window.location.href = `registration_list.html?activity_id=${this.activityId}`;
    }
};

function goBack() {
    window.history.back();
}

document.addEventListener('DOMContentLoaded', () => {
    ActivityDetailPage.init();
});
