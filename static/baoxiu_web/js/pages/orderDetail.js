const OrderDetailPage = {
    render() {
        const params = Router.getParams() || {};
        const orderId = params.id;

        if (!orderId) {
            Router.back();
            return;
        }

        const app = document.getElementById('app');
        app.className = 'page has-header no-tabbar';
        app.innerHTML = `
            <div class="header">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">报修详情</div>
            </div>
            <div id="orderDetailContent"></div>
        `;

        this.loadOrderDetail(orderId);
    },

    async loadOrderDetail(orderId) {
        const container = document.getElementById('orderDetailContent');
        Utils.showLoading(container);

        try {
            const result = await ApiService.get('/baoxiu/order/detail/get', { order_id: orderId });
            if (result.code === 0) {
                this.renderDetail(result.data);
            } else {
                Utils.showEmpty(container, '加载失败');
            }
        } catch (error) {
            Utils.showEmpty(container, '加载失败');
        }
    },

    renderDetail(order) {
        const user = AuthService.getCurrentUser();
        const container = document.getElementById('orderDetailContent');

        const records = order.records || [];
        const timelineHtml = records.length > 0 ? `
            <div class="order-timeline">
                <div class="card-title">处理记录</div>
                ${records.map(record => `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">${record.action_text}</div>
                            ${record.description ? `<div class="timeline-desc">${record.description}</div>` : ''}
                            <div class="timeline-time">${Utils.formatDate(record.created_at)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        let actionButtons = '';
        if (user.role === 'admin') {
            if (order.status === 0) {
                actionButtons = `
                    <button class="btn btn-primary btn-block" id="assignBtn">分配维修工</button>
                `;
            } else if (order.status === 1 || order.status === 2) {
                actionButtons = `
                    <button class="btn btn-warning btn-block" id="cancelBtn">取消工单</button>
                `;
            }
        } else if (user.role === 'repairman') {
            if (order.status === 0) {
                actionButtons = `
                    <button class="btn btn-primary btn-block" id="acceptBtn">接单</button>
                `;
            } else if (order.repairman_id === user.id) {
                if (order.status === 1) {
                    actionButtons = `
                        <button class="btn btn-primary btn-block" id="startBtn">开始维修</button>
                    `;
                } else if (order.status === 2) {
                    actionButtons = `
                        <button class="btn btn-success btn-block" id="completeBtn">完成维修</button>
                    `;
                }
            }
        } else if (user.role === 'student') {
            if (order.student_id === user.id && order.status === 0) {
                actionButtons = `
                    <button class="btn btn-danger btn-block" id="cancelBtn">取消报修</button>
                `;
            }
        }

        container.innerHTML = `
            <div class="card">
                <div class="detail-row">
                    <div class="detail-label">报修标题</div>
                    <div class="detail-value">${order.title}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">报修单号</div>
                    <div class="detail-value">${order.order_no}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">报修类别</div>
                    <div class="detail-value">${order.category || '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">紧急程度</div>
                    <div class="detail-value">
                        <span class="badge ${Utils.getUrgencyClass(order.urgency)}">${Utils.getUrgencyText(order.urgency)}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">当前状态</div>
                    <div class="detail-value">
                        <span class="status-badge ${Utils.getStatusClass(order.status)}">${Utils.getStatusText(order.status)}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">报修学生</div>
                    <div class="detail-value">${order.student_name || '-'}</div>
                </div>
                ${order.repairman_name ? `
                <div class="detail-row">
                    <div class="detail-label">处理维修工</div>
                    <div class="detail-value">${order.repairman_name}</div>
                </div>
                ` : ''}
                <div class="detail-row">
                    <div class="detail-label">宿舍楼</div>
                    <div class="detail-value">${order.room_number || '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">联系人</div>
                    <div class="detail-value">${order.contact_name || '-'} ${order.contact_phone || ''}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">创建时间</div>
                    <div class="detail-value">${Utils.formatDate(order.created_at)}</div>
                </div>
                ${order.assigned_at ? `
                <div class="detail-row">
                    <div class="detail-label">分配时间</div>
                    <div class="detail-value">${Utils.formatDate(order.assigned_at)}</div>
                </div>
                ` : ''}
                ${order.completed_at ? `
                <div class="detail-row">
                    <div class="detail-label">完成时间</div>
                    <div class="detail-value">${Utils.formatDate(order.completed_at)}</div>
                </div>
                ` : ''}
            </div>
            <div class="card">
                <div class="card-title">报修描述</div>
                <div style="color: var(--text-secondary); line-height: 1.6;">${order.description || '暂无描述'}</div>
            </div>
            ${timelineHtml}
            ${actionButtons ? `
                <div style="padding: 16px;">
                    ${actionButtons}
                </div>
            ` : ''}
        `;

        this.bindActions(order);
    },

    bindActions(order) {
        const assignBtn = document.getElementById('assignBtn');
        if (assignBtn) {
            assignBtn.onclick = () => this.showAssignModal(order.id);
        }

        const acceptBtn = document.getElementById('acceptBtn');
        if (acceptBtn) {
            acceptBtn.onclick = () => this.acceptOrder(order.id);
        }

        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.onclick = () => this.startProcessing(order.id);
        }

        const completeBtn = document.getElementById('completeBtn');
        if (completeBtn) {
            completeBtn.onclick = () => this.showCompleteModal(order.id);
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.showCancelModal(order.id);
        }
    },

    async acceptOrder(orderId) {
        try {
            const result = await ApiService.post(`/baoxiu/order/accept?order_id=${orderId}`);
            if (result.code === 0) {
                Utils.showToast('接单成功');
                this.loadOrderDetail(orderId);
            } else {
                Utils.showToast(result.msg);
            }
        } catch (e) {
            Utils.showToast('操作失败');
        }
    },

    async showAssignModal(orderId) {
        try {
            const result = await ApiService.get('/baoxiu/repairman/available/get');
            if (result.code === 0 && result.data.length > 0) {
                const options = result.data.map(r => ({
                    label: `${r.real_name} (${r.detail?.specialty || '通用'})`,
                    value: r.id
                }));
                Utils.showSelectModal('选择维修工', options, async (selected) => {
                    try {
                        const assignResult = await ApiService.post(`/baoxiu/order/assign?order_id=${orderId}`, {
                            repairman_id: selected.value
                        });
                        if (assignResult.code === 0) {
                            Utils.showToast('分配成功');
                            this.loadOrderDetail(orderId);
                        } else {
                            Utils.showToast(assignResult.msg);
                        }
                    } catch (e) {
                        Utils.showToast('分配失败');
                    }
                });
            } else {
                Utils.showToast('暂无可用维修工');
            }
        } catch (e) {
            Utils.showToast('加载维修工列表失败');
        }
    },

    async startProcessing(orderId) {
        try {
            const result = await ApiService.post(`/baoxiu/order/start?order_id=${orderId}`);
            if (result.code === 0) {
                Utils.showToast('已开始维修');
                this.loadOrderDetail(orderId);
            } else {
                Utils.showToast(result.msg);
            }
        } catch (e) {
            Utils.showToast('操作失败');
        }
    },

    showCompleteModal(orderId) {
        Utils.showModal({
            title: '完成维修',
            content: `
                <div class="form-group">
                    <label class="form-label">维修描述</label>
                    <textarea class="form-textarea" id="completeDesc" placeholder="请输入维修情况描述"></textarea>
                </div>
            `,
            onConfirm: async () => {
                const description = document.getElementById('completeDesc')?.value || '';
                try {
                    const result = await ApiService.post(`/baoxiu/order/complete?order_id=${orderId}`, {
                        description
                    });
                    if (result.code === 0) {
                        Utils.showToast('维修已完成');
                        this.loadOrderDetail(orderId);
                    } else {
                        Utils.showToast(result.msg);
                    }
                } catch (e) {
                    Utils.showToast('操作失败');
                }
            }
        });
    },

    showCancelModal(orderId) {
        Utils.showModal({
            title: '确认取消',
            content: '<p>确定要取消该工单吗？</p>',
            onConfirm: async () => {
                try {
                    const result = await ApiService.post(`/baoxiu/order/cancel?order_id=${orderId}`, {
                        reason: '用户取消'
                    });
                    if (result.code === 0) {
                        Utils.showToast('已取消');
                        this.loadOrderDetail(orderId);
                    } else {
                        Utils.showToast(result.msg);
                    }
                } catch (e) {
                    Utils.showToast('操作失败');
                }
            }
        });
    }
};
