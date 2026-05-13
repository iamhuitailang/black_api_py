const RegistrationPage = {
    currentPage: 1,
    pageSize: 10,
    registrations: [],
    activityId: null,

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.activityId = urlParams.get('activity_id');
        this.loadRegistrations();
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('searchBtn')?.addEventListener('click', () => this.loadRegistrations());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.loadRegistrations());
        document.getElementById('keyword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadRegistrations();
        });
    },

    async loadRegistrations() {
        const status = document.getElementById('statusFilter')?.value || '';
        const keyword = document.getElementById('keyword')?.value || '';

        const result = await API.registration.list(
            this.activityId ? parseInt(this.activityId) : null,
            this.currentPage,
            this.pageSize,
            status === '' ? null : parseInt(status),
            keyword
        );

        if (result.code === 0) {
            this.registrations = result.data.items || [];
            this.renderRegistrations();
            this.renderPagination(result.data.total, result.data.total_pages);
        }
    },

    renderRegistrations() {
        const container = document.getElementById('registrationList');
        if (!container) return;

        if (this.registrations.length === 0) {
            container.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">暂无报名</td></tr>';
            return;
        }

        const statusMap = {
            1: { text: '待审核', class: 'status-1' },
            2: { text: '已通过', class: 'status-2' },
            3: { text: '已拒绝', class: 'status-4' },
            4: { text: '已取消', class: 'status-3' }
        };

        container.innerHTML = this.registrations.map(reg => {
            const status = statusMap[reg.status] || statusMap[2];
            return `
                <tr>
                    <td>${reg.id}</td>
                    <td>${reg.registration_no}</td>
                    <td>${reg.real_name}</td>
                    <td>${reg.phone}</td>
                    <td>${reg.activity?.title || '-'}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${reg.status === 1 ? `
                                <button class="btn-small btn-success" onclick="RegistrationPage.approve(${reg.id})">通过</button>
                                <button class="btn-small btn-danger" onclick="RegistrationPage.reject(${reg.id})">拒绝</button>
                            ` : ''}
                            ${reg.status === 2 ? `
                                <button class="btn-small btn-primary" onclick="RegistrationPage.checkin(${reg.id})">签到</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderPagination(total, totalPages) {
        const container = document.getElementById('pagination');
        if (!container) return;

        let html = `<button class="page-btn" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="RegistrationPage.changePage(${this.currentPage - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="RegistrationPage.changePage(${i})">${i}</button>`;
        }

        html += `<button class="page-btn" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="RegistrationPage.changePage(${this.currentPage + 1})">下一页</button>`;
        container.innerHTML = html;
    },

    changePage(page) {
        this.currentPage = page;
        this.loadRegistrations();
    },

    async approve(id) {
        if (!confirm('确定要通过该报名吗？')) return;

        const result = await API.registration.approve(id);
        if (result.code === 0) {
            Toast.success('审核通过');
            this.loadRegistrations();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    async reject(id) {
        if (!confirm('确定要拒绝该报名吗？')) return;

        const result = await API.registration.reject(id);
        if (result.code === 0) {
            Toast.success('已拒绝');
            this.loadRegistrations();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    async checkin(id) {
        if (!confirm('确定要对该用户进行签到吗？')) return;

        const result = await API.checkin.byId(id);
        if (result.code === 0) {
            Toast.success('签到成功');
            this.loadRegistrations();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    }
};
