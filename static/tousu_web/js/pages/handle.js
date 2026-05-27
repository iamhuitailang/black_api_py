const HandlePage = {
    currentPage: 1,
    pageSize: 10,
    currentFilter: 'all',
    complaints: [],
    hasMore: true,

    async render() {
        const app = document.getElementById('app');
        const params = Router.getParams();
        if (params.filter) {
            this.currentFilter = params.filter;
        }

        app.innerHTML = `
            <div class="page has-header">
                ${Layout.renderHeader('投诉处理', true)}

                <div class="filter-tabs">
                    <div class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">全部</div>
                    <div class="filter-tab ${this.currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">待受理</div>
                    <div class="filter-tab ${this.currentFilter === 'processing' ? 'active' : ''}" data-filter="processing">处理中</div>
                    <div class="filter-tab ${this.currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">已完成</div>
                </div>

                <div class="complaint-list" id="complaintList">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                ${Layout.renderTabbar('handle')}
            </div>
        `;

        this.bindEvents();
        this.currentPage = 1;
        this.hasMore = true;
        this.complaints = [];
        await this.loadComplaints();
    },

    bindEvents() {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentFilter = tab.dataset.filter;
                this.currentPage = 1;
                this.hasMore = true;
                this.complaints = [];
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadComplaints();
            });
        });
    },

    async loadComplaints() {
        const listEl = document.getElementById('complaintList');
        const user = AuthService.getUser();

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            const statusMap = {
                'pending': 0,
                'processing': 2,
                'completed': 3
            };

            if (this.currentFilter !== 'all') {
                params.status = statusMap[this.currentFilter];
            }

            let apiUrl = '/tousu/complaint/handler/list/get';
            if (user?.department_id && user.department_id > 0) {
                params.department_id = user.department_id;
                apiUrl = '/tousu/complaint/department/list/get';
            }

            const result = await ApiService.get(apiUrl, params);

            if (result.code === 0) {
                const newComplaints = result.data.items || [];

                if (newComplaints.length === 0 && this.currentPage === 1) {
                    listEl.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <div class="empty-state-text">暂无投诉记录</div>
                        </div>
                    `;
                    return;
                }

                if (newComplaints.length < this.pageSize) {
                    this.hasMore = false;
                }

                if (this.currentPage === 1) {
                    this.complaints = newComplaints;
                } else {
                    this.complaints = [...this.complaints, ...newComplaints];
                }

                listEl.innerHTML = this.complaints.map(c => this.renderComplaintItem(c)).join('');

                this.bindComplaintEvents();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载投诉列表失败:', error);
            if (this.currentPage === 1) {
                listEl.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <div class="empty-state-text">加载失败，点击重试</div>
                    </div>
                `;
                listEl.querySelector('.empty-state').onclick = () => this.loadComplaints();
            }
        }
    },

    renderComplaintItem(complaint) {
        const statusColors = {
            0: 'badge-warning',
            1: 'badge-info',
            2: 'badge-primary',
            3: 'badge-success',
            4: 'badge-secondary',
            5: 'badge-danger'
        };

        const typeClass = complaint.type === 'complaint' ? 'badge-danger' : 'badge-info';

        return `
            <div class="complaint-item" data-id="${complaint.id}">
                <div class="complaint-header">
                    <span class="badge ${typeClass}">${complaint.type_text}</span>
                    <span class="badge ${statusColors[complaint.status] || 'badge-secondary'}">${complaint.status_text}</span>
                    ${complaint.priority === 4 ? '<span class="badge badge-danger">紧急</span>' : ''}
                </div>
                <div class="complaint-title">${complaint.title}</div>
                <div class="complaint-desc">${complaint.content.substring(0, 100)}...</div>
                <div class="complaint-footer">
                    <span class="complaint-time">${complaint.created_at || ''}</span>
                    <div class="complaint-actions">
                        <span class="badge badge-secondary">${complaint.priority_text || ''}</span>
                    </div>
                </div>
            </div>
        `;
    },

    bindComplaintEvents() {
        document.querySelectorAll('.complaint-item').forEach(item => {
            item.addEventListener('click', () => {
                const complaintId = item.dataset.id;
                Router.navigate('complaintDetail', { complaint_id: complaintId });
            });
        });
    }
};

window.HandlePage = HandlePage;