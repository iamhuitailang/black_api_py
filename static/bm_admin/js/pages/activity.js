const ActivityPage = {
    currentPage: 1,
    pageSize: 10,
    activities: [],

    init() {
        this.loadActivities();
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('addActivityBtn')?.addEventListener('click', () => this.openModal());
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('activityForm')?.addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('searchBtn')?.addEventListener('click', () => this.loadActivities());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.loadActivities());
        document.getElementById('keyword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadActivities();
        });
    },

    async loadActivities() {
        const status = document.getElementById('statusFilter')?.value || '';
        const keyword = document.getElementById('keyword')?.value || '';

        const result = await API.activity.list(
            this.currentPage,
            this.pageSize,
            status === '' ? null : parseInt(status),
            keyword
        );

        if (result.code === 0) {
            this.activities = result.data.items || [];
            this.renderActivities();
            this.renderPagination(result.data.total, result.data.total_pages);
        }
    },

    renderActivities() {
        const container = document.getElementById('activityList');
        if (!container) return;

        if (this.activities.length === 0) {
            container.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">暂无活动</td></tr>';
            return;
        }

        const statusMap = {
            1: { text: '报名中', class: 'status-1' },
            2: { text: '进行中', class: 'status-2' },
            3: { text: '已结束', class: 'status-3' },
            4: { text: '已取消', class: 'status-4' }
        };

        container.innerHTML = this.activities.map(activity => {
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
                            <button class="btn-small btn-primary" onclick="ActivityPage.viewActivity(${activity.id})">查看</button>
                            <button class="btn-small btn-secondary" onclick="ActivityPage.editActivity(${activity.id})">编辑</button>
                            <button class="btn-small btn-success" onclick="ActivityPage.viewRegistrations(${activity.id})">报名</button>
                            <button class="btn-small btn-danger" onclick="ActivityPage.deleteActivity(${activity.id})">删除</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderPagination(total, totalPages) {
        const container = document.getElementById('pagination');
        if (!container) return;

        let html = `<button class="page-btn" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="ActivityPage.changePage(${this.currentPage - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="ActivityPage.changePage(${i})">${i}</button>`;
        }

        html += `<button class="page-btn" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="ActivityPage.changePage(${this.currentPage + 1})">下一页</button>`;
        container.innerHTML = html;
    },

    changePage(page) {
        this.currentPage = page;
        this.loadActivities();
    },

    openModal(activity = null) {
        const modal = document.getElementById('activityModal');
        modal?.classList.add('active');

        const titleEl = document.getElementById('modalTitle');
        titleEl.textContent = activity ? '编辑活动' : '创建活动';

        document.getElementById('activityId').value = activity ? activity.id : '';
        document.getElementById('title').value = activity ? activity.title : '';
        document.getElementById('description').value = activity ? activity.description || '' : '';
        document.getElementById('location').value = activity ? activity.location : '';
        document.getElementById('startTime').value = activity ? activity.start_time?.substring(0, 16) || '' : '';
        document.getElementById('endTime').value = activity ? activity.end_time?.substring(0, 16) || '' : '';
        document.getElementById('registrationStart').value = activity ? activity.registration_start?.substring(0, 16) || '' : '';
        document.getElementById('registrationEnd').value = activity ? activity.registration_end?.substring(0, 16) || '' : '';
        document.getElementById('totalQuota').value = activity ? activity.total_quota || '' : '';
        document.getElementById('needApproval').value = activity ? (activity.need_approval || 0) : 0;
    },

    closeModal() {
        const modal = document.getElementById('activityModal');
        modal?.classList.remove('active');
    },

    async handleSubmit(e) {
        e.preventDefault();

        const activityId = document.getElementById('activityId').value;
        const data = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            location: document.getElementById('location').value,
            start_time: document.getElementById('startTime').value,
            end_time: document.getElementById('endTime').value,
            registration_start: document.getElementById('registrationStart').value,
            registration_end: document.getElementById('registrationEnd').value,
            total_quota: parseInt(document.getElementById('totalQuota').value),
            need_approval: parseInt(document.getElementById('needApproval').value)
        };

        let result;
        if (activityId) {
            result = await API.activity.update(parseInt(activityId), data);
        } else {
            result = await API.activity.create(data);
        }

        if (result.code === 0) {
            Toast.success(activityId ? '更新成功' : '创建成功');
            this.closeModal();
            this.loadActivities();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    async editActivity(id) {
        const activity = this.activities.find(a => a.id === id);
        if (activity) {
            this.openModal(activity);
        }
    },

    async deleteActivity(id) {
        if (!confirm('确定要删除这个活动吗？')) return;

        const result = await API.activity.delete(id);
        if (result.code === 0) {
            Toast.success('删除成功');
            this.loadActivities();
        } else {
            Toast.error(result.msg || '删除失败');
        }
    },

    viewActivity(id) {
        window.location.href = `activity_detail.html?id=${id}`;
    },

    viewRegistrations(id) {
        window.location.href = `registration_list.html?activity_id=${id}`;
    }
};
