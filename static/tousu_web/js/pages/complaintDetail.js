const ComplaintDetailPage = {
    complaintData: null,

    async render() {
        const app = document.getElementById('app');
        const params = Router.getParams();
        const complaintId = params.complaint_id;

        if (!complaintId) {
            Router.navigate('myComplaints');
            return;
        }

        app.innerHTML = `
            <div class="page has-header">
                ${Layout.renderHeader('详情', true)}
                <div id="detailContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        await this.loadDetail(complaintId);
    },

    async loadDetail(complaintId) {
        try {
            const result = await ApiService.get('/tousu/complaint/detail/get', { complaint_id: complaintId });

            if (result.code === 0) {
                this.complaintData = result.data;
                this.renderDetail();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载详情失败:', error);
            document.getElementById('detailContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-text">加载失败，点击重试</div>
                </div>
            `;
            document.getElementById('detailContent').querySelector('.empty-state').onclick = () => this.loadDetail(complaintId);
        }
    },

    renderDetail() {
        const data = this.complaintData;
        const user = AuthService.getUser();
        const role = user?.role || 'student';

        const statusColors = {
            0: 'badge-warning',
            1: 'badge-info',
            2: 'badge-primary',
            3: 'badge-success',
            4: 'badge-secondary',
            5: 'badge-danger'
        };

        const typeClass = data.type === 'complaint' ? 'badge-danger' : 'badge-info';

        let actionButtons = '';
        if (role === 'student' && data.user_id === user.id) {
            if (data.status === 0 || data.status === 1) {
                actionButtons = `
                    <button class="btn btn-outline" onclick="ComplaintDetailPage.cancelComplaint()">撤回</button>
                `;
            }
            if (data.status === 3 && !data.evaluation) {
                actionButtons = `
                    <button class="btn btn-primary" onclick="ComplaintDetailPage.showEvaluation()">评价</button>
                `;
            }
        } else if (role === 'staff') {
            if (data.status === 0) {
                actionButtons = `
                    <button class="btn btn-primary" onclick="ComplaintDetailPage.accept()">受理</button>
                `;
            } else if (data.status === 1 || data.status === 2) {
                actionButtons = `
                    <button class="btn btn-outline" onclick="ComplaintDetailPage.showFeedback()">添加反馈</button>
                    ${data.status === 1 ? '<button class="btn btn-warning" onclick="ComplaintDetailPage.process()">开始处理</button>' : ''}
                    ${data.status === 2 ? '<button class="btn btn-success" onclick="ComplaintDetailPage.showComplete()">完成</button>' : ''}
                `;
            }
        } else if (role === 'admin') {
            if (data.status === 0) {
                actionButtons = `
                    <button class="btn btn-primary" onclick="ComplaintDetailPage.accept()">受理</button>
                `;
            } else if (data.status === 1 || data.status === 2) {
                actionButtons = `
                    <button class="btn btn-outline" onclick="ComplaintDetailPage.showFeedback()">添加反馈</button>
                    ${data.status === 1 ? '<button class="btn btn-warning" onclick="ComplaintDetailPage.process()">开始处理</button>' : ''}
                    ${data.status === 2 ? '<button class="btn btn-success" onclick="ComplaintDetailPage.showComplete()">完成</button>' : ''}
                `;
            }
        }

        let feedbacksHtml = '';
        if (data.feedbacks && data.feedbacks.length > 0) {
            feedbacksHtml = `
                <div class="section-title">处理记录</div>
                <div class="feedback-list">
                    ${data.feedbacks.map(fb => `
                        <div class="feedback-item">
                            <div class="feedback-header">
                                <span class="feedback-user">处理记录</span>
                                <span class="feedback-time">${fb.created_at || ''}</span>
                            </div>
                            <div class="feedback-content">${fb.content || ''}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        let evaluationHtml = '';
        if (data.evaluation) {
            const stars = '⭐'.repeat(data.evaluation.rating) + '☆'.repeat(5 - data.evaluation.rating);
            evaluationHtml = `
                <div class="section-title">用户评价</div>
                <div class="card">
                    <div class="card-body">
                        <div style="font-size: 24px; margin-bottom: 8px;">${stars}</div>
                        ${data.evaluation.content ? `<div style="color: var(--text-secondary);">${data.evaluation.content}</div>` : ''}
                    </div>
                </div>
            `;
        }

        const submitterName = data.is_anonymous ? '匿名用户' : (data.submitter?.nickname || '用户');

        document.getElementById('detailContent').innerHTML = `
            <div class="complaint-detail">
                <div class="complaint-detail-header">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <span class="badge ${typeClass}" style="margin-right: 8px;">${data.type_text}</span>
                        <span class="badge ${statusColors[data.status] || 'badge-secondary'}">${data.status_text}</span>
                        ${data.priority === 4 ? '<span class="badge badge-danger" style="margin-left: 8px;">紧急</span>' : ''}
                    </div>
                    <h2 style="font-size: 18px; font-weight: 500;">${data.title}</h2>
                </div>

                <div class="complaint-detail-info">
                    <div class="complaint-detail-info-row">
                        <span class="complaint-detail-info-label">提交人</span>
                        <span class="complaint-detail-info-value">${submitterName}</span>
                    </div>
                    <div class="complaint-detail-info-row">
                        <span class="complaint-detail-info-label">优先级</span>
                        <span class="complaint-detail-info-value">${data.priority_text || ''}</span>
                    </div>
                    <div class="complaint-detail-info-row">
                        <span class="complaint-detail-info-label">提交时间</span>
                        <span class="complaint-detail-info-value">${data.created_at || ''}</span>
                    </div>
                    ${data.handler ? `
                    <div class="complaint-detail-info-row">
                        <span class="complaint-detail-info-label">处理人</span>
                        <span class="complaint-detail-info-value">${data.handler.nickname || ''}</span>
                    </div>
                    ` : ''}
                    ${data.completed_at ? `
                    <div class="complaint-detail-info-row">
                        <span class="complaint-detail-info-label">完成时间</span>
                        <span class="complaint-detail-info-value">${data.completed_at}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="complaint-detail-content">
                    <h3>详细内容</h3>
                    <p style="white-space: pre-wrap;">${data.content || ''}</p>
                </div>

                ${feedbacksHtml}

                ${evaluationHtml}

                ${actionButtons ? `
                <div class="complaint-detail-footer">
                    ${actionButtons}
                </div>
                ` : ''}
            </div>
        `;
    },

    async cancelComplaint() {
        if (!confirm('确定要撤回这条投诉建议吗？')) return;

        try {
            const result = await ApiService.post(`/tousu/complaint/cancel?complaint_id=${this.complaintData.id}`);
            if (result.code === 0) {
                Toast.success('撤回成功');
                this.loadDetail(this.complaintData.id);
            } else {
                Toast.error(result.msg || '撤回失败');
            }
        } catch (error) {
            Toast.error('撤回失败');
        }
    },

    async accept() {
        try {
            const result = await ApiService.post(`/tousu/complaint/accept?complaint_id=${this.complaintData.id}`);
            if (result.code === 0) {
                Toast.success('受理成功');
                this.loadDetail(this.complaintData.id);
            } else {
                Toast.error(result.msg || '受理失败');
            }
        } catch (error) {
            Toast.error('受理失败');
        }
    },

    async process() {
        try {
            const result = await ApiService.post(`/tousu/complaint/process?complaint_id=${this.complaintData.id}`);
            if (result.code === 0) {
                Toast.success('已标记为处理中');
                this.loadDetail(this.complaintData.id);
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败');
        }
    },

    showFeedback() {
        const content = prompt('请输入反馈内容：');
        if (content) {
            this.addFeedback(content);
        }
    },

    async addFeedback(content) {
        try {
            const result = await ApiService.post(`/tousu/complaint/feedback/add?complaint_id=${this.complaintData.id}`, {
                content: content
            });
            if (result.code === 0) {
                Toast.success('反馈成功');
                this.loadDetail(this.complaintData.id);
            } else {
                Toast.error(result.msg || '反馈失败');
            }
        } catch (error) {
            Toast.error('反馈失败');
        }
    },

    showComplete() {
        const content = prompt('请输入处理结果：');
        if (content) {
            this.complete(content);
        }
    },

    async complete(content) {
        try {
            const result = await ApiService.post(`/tousu/complaint/complete?complaint_id=${this.complaintData.id}`, {
                handle_result: content
            });
            if (result.code === 0) {
                Toast.success('处理完成');
                this.loadDetail(this.complaintData.id);
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败');
        }
    },

    showEvaluation() {
        const rating = prompt('请评分（1-5）：', '5');
        if (rating) {
            const content = prompt('请输入评价内容（选填）：') || '';
            this.evaluate(parseInt(rating), content);
        }
    },

    async evaluate(rating, content) {
        try {
            const result = await ApiService.post(`/tousu/complaint/evaluation?complaint_id=${this.complaintData.id}`, {
                rating: rating,
                content: content
            });
            if (result.code === 0) {
                Toast.success('评价成功');
                this.loadDetail(this.complaintData.id);
            } else {
                Toast.error(result.msg || '评价失败');
            }
        } catch (error) {
            Toast.error('评价失败');
        }
    }
};

window.ComplaintDetailPage = ComplaintDetailPage;