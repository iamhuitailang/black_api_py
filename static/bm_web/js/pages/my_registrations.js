const MyRegistrationsPage = {
    currentPage: 1,
    pageSize: 10,

    init() {
        this.checkAuth();
        this.loadRegistrations();
        this.bindEvents();
    },

    checkAuth() {
        const user = Storage.getUser();
        if (!user) {
            Toast.error('请先登录');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }
    },

    bindEvents() {
        document.getElementById('statusFilter')?.addEventListener('change', () => {
            this.currentPage = 1;
            this.loadRegistrations();
        });
    },

    async loadRegistrations() {
        const status = document.getElementById('statusFilter')?.value || '';

        const result = await API.myRegistrations(
            this.currentPage,
            this.pageSize,
            status === '' ? null : parseInt(status)
        );

        if (result.code === 0) {
            this.renderRegistrations(result.data.items || []);
            this.renderPagination(result.data.total, result.data.total_pages);
        }
    },

    renderRegistrations(registrations) {
        const container = document.getElementById('registrationList');
        if (!container) return;

        if (registrations.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <div class="empty-state-icon">📋</div>
                            <h3>暂无报名记录</h3>
                            <p>还没有报名任何活动</p>
                            <a href="index.html" class="btn btn-primary" style="margin-top: 20px;">去报名</a>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const statusMap = {
            1: { text: '待审核', class: 'status-1' },
            2: { text: '已通过', class: 'status-2' },
            3: { text: '已拒绝', class: 'status-4' },
            4: { text: '已取消', class: 'status-3' }
        };

        container.innerHTML = registrations.map(reg => {
            const status = statusMap[reg.status] || statusMap[2];
            return `
                <tr>
                    <td>${reg.registration_no}</td>
                    <td>${reg.activity?.title || '-'}</td>
                    <td>${reg.activity?.location || '-'}</td>
                    <td>${reg.created_at ? reg.created_at.substring(0, 16) : '-'}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td>
                        ${reg.status === 2 ? `
                            <button class="btn btn-small btn-primary" onclick="MyRegistrationsPage.showTicket('${reg.qrcode}', '${reg.registration_no}')">电子票</button>
                        ` : ''}
                        ${reg.status === 1 || reg.status === 2 ? `
                            <button class="btn btn-small btn-danger" onclick="MyRegistrationsPage.cancelRegistration(${reg.id})">取消报名</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderPagination(total, totalPages) {
        const container = document.getElementById('pagination');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `<button class="page-btn" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="MyRegistrationsPage.changePage(${this.currentPage - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="MyRegistrationsPage.changePage(${i})">${i}</button>`;
        }

        html += `<button class="page-btn" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="MyRegistrationsPage.changePage(${this.currentPage + 1})">下一页</button>`;
        container.innerHTML = html;
    },

    changePage(page) {
        this.currentPage = page;
        this.loadRegistrations();
    },

    async cancelRegistration(id) {
        if (!confirm('确定要取消该报名吗？取消后将释放名额。')) return;

        const result = await API.activity.cancelRegistration(id);
        if (result.code === 0) {
            Toast.success('取消成功');
            this.loadRegistrations();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    showTicket(qrcode, registrationNo) {
        const modal = document.getElementById('ticketModal');
        if (!modal) return;

        document.getElementById('ticketNo').textContent = registrationNo;
        document.getElementById('ticketQrcode').textContent = qrcode;
        modal.classList.add('active');

        modal.querySelector('.close-btn')?.addEventListener('click', () => {
            modal.classList.remove('active');
        }, { once: true });
    }
};
