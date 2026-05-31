const MyBookingsPage = {
    currentPage: 1, pageSize: 10, currentStatus: null,

    async render() {
        const app = document.getElementById('app');
        const statusTabs = [
            { value: null, label: '全部' },
            { value: 0, label: '待确认' },
            { value: 1, label: '已确认' },
            { value: 2, label: '寄养中' },
            { value: 3, label: '已完成' },
            { value: 4, label: '已取消' }
        ];
        app.innerHTML = `
            <div class="page has-header">
                <header class="header"><h1 class="header-title">我的寄养</h1></header>
                <div class="category-tabs" id="statusTabs">
                    ${statusTabs.map(t => `<div class="category-tab ${this.currentStatus === t.value ? 'active' : ''}" data-status="${t.value === null ? '' : t.value}">${t.label}</div>`).join('')}
                </div>
                <div id="bookingList"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">加载中...</div></div></div>
                ${Tabbar.render('myBookings')}
            </div>
        `;
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentStatus = tab.dataset.status === '' ? null : parseInt(tab.dataset.status);
                this.currentPage = 1;
                document.querySelectorAll('.category-tab').forEach(t => t.classList.toggle('active', t.dataset.status === (this.currentStatus === null ? '' : String(this.currentStatus))));
                this.loadBookings();
            });
        });
        await this.loadBookings();
    },

    async loadBookings() {
        const list = document.getElementById('bookingList');
        try {
            const params = { page: this.currentPage, page_size: this.pageSize };
            if (this.currentStatus !== null) params.status = this.currentStatus;
            const result = await ApiService.get('/chongwu09/booking/my/list/get', params);
            if (result.code === 0) {
                const items = result.data.items || [];
                if (items.length === 0) {
                    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无寄养记录</div></div>';
                    return;
                }
                list.innerHTML = items.map(b => this.renderBookingItem(b)).join('');
                this.bindEvents();
            } else { Toast.error(result.msg); }
        } catch (e) { list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>'; }
    },

    renderBookingItem(b) {
        const petName = b.pet ? b.pet.name : '未知宠物';
        const petType = b.pet ? b.pet.pet_type_name : '';
        const serviceName = b.service ? b.service.title : '未知服务';
        const petIcon = b.pet ? Utils.getPetIcon(b.pet.pet_type) : '🐾';
        return `
            <div class="booking-item">
                <div class="booking-header">
                    <span class="booking-service-name">${serviceName}</span>
                    <span class="badge ${Utils.getBookingStatusClass(b.status)}">${b.status_text}</span>
                </div>
                <div class="booking-pet">${petIcon} ${petName} (${petType})</div>
                <div class="booking-dates">📅 ${b.start_date} ~ ${b.end_date}</div>
                ${b.notes ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">备注: ${b.notes}</div>` : ''}
                ${b.admin_notes ? `<div style="font-size:12px;color:var(--info-color);margin-top:4px">管理员: ${b.admin_notes}</div>` : ''}
                <div class="booking-actions">
                    ${b.status === 0 || b.status === 1 ? `<button class="btn btn-outline btn-sm" data-cancel="${b.id}">取消预约</button>` : ''}
                    ${b.status === 3 ? `<button class="btn btn-primary btn-sm" data-review="${b.id}" data-service="${b.service_id}">评价</button>` : ''}
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('[data-cancel]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('确定取消该预约？')) return;
                try {
                    const result = await ApiService.post('/chongwu09/booking/cancel', { booking_id: parseInt(btn.dataset.cancel) });
                    if (result.code === 0) { Toast.success('取消成功'); this.loadBookings(); }
                    else { Toast.error(result.msg); }
                } catch (e) { Toast.error('操作失败'); }
            });
        });
        document.querySelectorAll('[data-review]').forEach(btn => {
            btn.addEventListener('click', () => {
                Router.navigate('review', { booking_id: btn.dataset.review, service_id: btn.dataset.service });
            });
        });
    }
};
