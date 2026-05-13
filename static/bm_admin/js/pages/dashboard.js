const DashboardPage = {
    init() {
        this.render();
    },

    async render() {
        await this.loadActivityList();
    },

    async loadActivityList() {
        const result = await API.activity.list(1, 10);
        if (result.code === 0) {
            const activities = result.data.items || [];
            this.renderActivityList(activities);
        }
    },

    renderActivityList(activities) {
        const container = document.getElementById('activityList');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">暂无活动</td></tr>';
            return;
        }

        const statusMap = {
            1: { text: '报名中', class: 'status-1' },
            2: { text: '进行中', class: 'status-2' },
            3: { text: '已结束', class: 'status-3' },
            4: { text: '已取消', class: 'status-4' }
        };

        container.innerHTML = activities.map(activity => {
            const status = statusMap[activity.status] || statusMap[1];
            return `
                <tr>
                    <td>${activity.id}</td>
                    <td>${activity.title}</td>
                    <td>${activity.location}</td>
                    <td>${activity.start_time ? activity.start_time.substring(0, 16) : '-'}</td>
                    <td>${activity.remaining_quota}/${activity.total_quota}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-small btn-primary" onclick="DashboardPage.viewActivity(${activity.id})">查看</button>
                            <button class="btn-small btn-success" onclick="DashboardPage.viewRegistrations(${activity.id})">报名</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    viewActivity(id) {
        window.location.href = `activity_detail.html?id=${id}`;
    },

    viewRegistrations(id) {
        window.location.href = `registration_list.html?activity_id=${id}`;
    }
};
