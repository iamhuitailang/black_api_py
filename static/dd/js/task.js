const TaskModule = {
    tasks: [],
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    categories: ['跑腿', '搬家', '家政', '维修', '其他'],
    statusMap: {
        0: { text: '待接单', class: 'status-pending' },
        1: { text: '已接单', class: 'status-claimed' },
        2: { text: '进行中', class: 'status-in-progress' },
        3: { text: '已完成', class: 'status-completed' },
        4: { text: '已取消', class: 'status-cancelled' }
    },

    cache: {
        tasksLoaded: false,
        myTasksLoaded: false,
        myTasksType: 'published',
        lastCategory: '',
        lastKeyword: '',
        currentTask: null
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const tasksPage = document.getElementById('page-tasks');
        if (tasksPage) {
            tasksPage.addEventListener('page-show', () => {
                if (!this.cache.tasksLoaded) {
                    this.loadTasks({ showSkeleton: true });
                } else {
                    this.loadTasks({ showSkeleton: false });
                }
            });
        }

        const myTasksPage = document.getElementById('page-my-tasks');
        if (myTasksPage) {
            myTasksPage.addEventListener('page-show', () => {
                if (!this.cache.myTasksLoaded) {
                    this.loadMyTasks(this.cache.myTasksType, true);
                } else {
                    this.loadMyTasks(this.cache.myTasksType, false);
                }
            });
        }

        const taskDetailPage = document.getElementById('page-task-detail');
        if (taskDetailPage) {
            taskDetailPage.addEventListener('page-show', () => this.loadTaskDetail());
        }

        const publishTaskPage = document.getElementById('page-publish-task');
        if (publishTaskPage) {
            publishTaskPage.addEventListener('page-show', () => this.initPublishForm());
        }
    },

    async loadTasks(options = {}) {
        const { category, keyword, reset = true, showSkeleton = true } = options;
        
        if (reset) {
            this.currentPage = 1;
            this.tasks = [];
            this.hasMore = true;
        }

        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;

        const container = document.getElementById('tasks-list');
        if (container && reset && showSkeleton) {
            container.innerHTML = this.renderSkeleton();
        }

        try {
            const result = await Api.task.getList({
                page: this.currentPage,
                pageSize: this.pageSize,
                category,
                keyword
            });

            let newTasks = [];
            if (result.data) {
                if (Array.isArray(result.data)) {
                    newTasks = result.data;
                } else if (result.data.items) {
                    newTasks = result.data.items;
                } else if (result.data.list) {
                    newTasks = result.data.list;
                } else if (result.data.tasks) {
                    newTasks = result.data.tasks;
                }
            } else if (Array.isArray(result)) {
                newTasks = result;
            }
            
            if (newTasks.length < this.pageSize) {
                this.hasMore = false;
            }

            this.tasks = reset ? newTasks : [...this.tasks, ...newTasks];
            this.currentPage++;

            if (container) {
                const showAnimation = !this.cache.tasksLoaded;
                container.innerHTML = this.tasks.length > 0 
                    ? this.tasks.map((task, index) => this.renderTaskCard(task, index, false, showAnimation)).join('')
                    : this.renderEmpty('暂无任务');
            }

            this.cache.tasksLoaded = true;
            this.cache.lastCategory = category || '';
            this.cache.lastKeyword = keyword || '';
        } catch (error) {
            Utils.showToast(error.message || '加载失败', 'error');
            if (container && reset) {
                container.innerHTML = this.renderEmpty('加载失败，请重试');
            }
        } finally {
            this.isLoading = false;
        }
    },

    async loadMyTasks(type = 'published', showSkeleton = true) {
        const container = document.getElementById('my-tasks-list');
        if (container && showSkeleton) {
            container.innerHTML = this.renderSkeleton();
        }

        try {
            const result = type === 'published'
                ? await Api.task.getMyPublished()
                : await Api.task.getMyReceived();

            let tasks = [];
            if (result.data) {
                if (Array.isArray(result.data)) {
                    tasks = result.data;
                } else if (result.data.items) {
                    tasks = result.data.items;
                } else if (result.data.list) {
                    tasks = result.data.list;
                } else if (result.data.tasks) {
                    tasks = result.data.tasks;
                }
            } else if (Array.isArray(result)) {
                tasks = result;
            }

            if (container) {
                const showAnimation = !this.cache.myTasksLoaded;
                container.innerHTML = tasks.length > 0
                    ? tasks.map((task, index) => this.renderTaskCard(task, index, true, showAnimation)).join('')
                    : this.renderEmpty(`暂无${type === 'published' ? '发布' : '接单'}的任务`);
            }

            this.cache.myTasksLoaded = true;
            this.cache.myTasksType = type;
        } catch (error) {
            Utils.showToast(error.message || '加载失败', 'error');
            if (container) {
                container.innerHTML = this.renderEmpty('加载失败，请重试');
            }
        }
    },

    async loadTaskDetail() {
        const params = Router.getParams();
        const taskId = params.taskId;

        if (!taskId) {
            Utils.showToast('任务ID不存在', 'error');
            Router.back();
            return;
        }

        const container = document.getElementById('task-detail-container');
        if (container) {
            container.innerHTML = this.renderSkeleton();
        }

        try {
            const result = await Api.task.getDetail(taskId);
            const task = result.data;
            this.cache.currentTask = task;

            if (container) {
                container.innerHTML = this.renderTaskDetail(task);
            }

            await this.loadClaimStatus(taskId);
        } catch (error) {
            Utils.showToast(error.message || '加载失败', 'error');
        }
    },

    async loadClaimStatus(taskId) {
        try {
            const result = await Api.claim.getStatus(taskId);
            this.updateClaimButtons(result.data);
        } catch (error) {
            console.error('Load claim status error:', error);
        }
    },

    updateClaimButtons(status) {
        const claimBtn = document.getElementById('btn-claim-task');
        const cancelClaimBtn = document.getElementById('btn-cancel-claim');
        const contactBtn = document.getElementById('btn-view-contact');
        const reportBtn = document.getElementById('btn-report-user');

        const params = Router.getParams();
        const taskId = params.taskId;
        const userId = Auth.getUserId();
        const currentTask = this.cache.currentTask;

        console.log('=== updateClaimButtons ===');
        console.log('API status:', status);
        console.log('userId:', userId);
        console.log('currentTask:', currentTask);

        if (claimBtn) Utils.addClass(claimBtn, 'hidden');
        if (cancelClaimBtn) Utils.addClass(cancelClaimBtn, 'hidden');
        if (contactBtn) Utils.addClass(contactBtn, 'hidden');

        if (!currentTask || !userId) {
            console.log('Missing data for claim buttons');
            return;
        }

        const publisherId = currentTask.publisher_id;
        const isPublisher = String(userId) === String(publisherId);
        
        let taskStatus;
        if (status && status.task_status !== undefined && status.task_status !== null) {
            taskStatus = Number(status.task_status);
        } else {
            taskStatus = Number(currentTask.status);
        }
        
        const hasClaimed = status && status.has_claimed;
        const receiverId = status ? status.receiver_id : null;
        const hasReceiver = receiverId && String(receiverId) !== '0' && receiverId !== null;

        console.log('Calculated:');
        console.log('  isPublisher:', isPublisher);
        console.log('  taskStatus (Number):', taskStatus);
        console.log('  hasClaimed:', hasClaimed);
        console.log('  receiverId:', receiverId);
        console.log('  hasReceiver:', hasReceiver);

        const STATUS_PENDING = 0;
        const STATUS_ACCEPTED = 1;
        const STATUS_IN_PROGRESS = 2;
        const STATUS_COMPLETED = 3;
        const STATUS_CANCELLED = 4;

        if (isPublisher) {
            console.log('Is publisher');
            if (hasReceiver && contactBtn) {
                console.log('Showing contact button for publisher');
                Utils.removeClass(contactBtn, 'hidden');
                contactBtn.onclick = () => this.viewContact(taskId);
            }
        } else {
            console.log('Not publisher, checking hasClaimed:', hasClaimed);
            if (hasClaimed) {
                console.log('Has claimed, showing contact button');
                if (contactBtn) {
                    Utils.removeClass(contactBtn, 'hidden');
                    contactBtn.onclick = () => this.viewContact(taskId);
                }
                
                if (taskStatus === STATUS_ACCEPTED || taskStatus === STATUS_IN_PROGRESS) {
                    console.log('Task status is accepted/in-progress, showing cancel button');
                    if (cancelClaimBtn) {
                        Utils.removeClass(cancelClaimBtn, 'hidden');
                        cancelClaimBtn.onclick = () => this.cancelClaim(taskId);
                    }
                } else {
                    console.log('Task status is', taskStatus, ', not showing cancel button');
                }
            } else {
                console.log('Not claimed, checking taskStatus:', taskStatus);
                if (taskStatus === STATUS_PENDING) {
                    console.log('Status is pending, showing claim button');
                    if (claimBtn) {
                        Utils.removeClass(claimBtn, 'hidden');
                        claimBtn.onclick = () => this.claimTask(taskId);
                    }
                } else {
                    console.log('Status is not pending, not showing claim button');
                }
            }
        }
    },

    async claimTask(taskId) {
        if (!Auth.requireAuth()) return;

        const claimBtn = document.getElementById('btn-claim-task');
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<span class="loading-spinner"></span> 抢单中...';
        }

        try {
            await Api.claim.claim(taskId);
            Utils.showToast('抢单成功！', 'success');
            await this.loadTaskDetail();
        } catch (error) {
            Utils.showToast(error.message || '抢单失败', 'error');
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.innerHTML = '立即抢单';
            }
        }
    },

    async cancelClaim(taskId) {
        if (!Auth.requireAuth()) return;

        const cancelBtn = document.getElementById('btn-cancel-claim');
        if (cancelBtn) {
            cancelBtn.disabled = true;
            cancelBtn.innerHTML = '<span class="loading-spinner"></span> 取消中...';
        }

        try {
            await Api.claim.cancel(taskId);
            Utils.showToast('已取消抢单', 'success');
            await this.loadTaskDetail();
        } catch (error) {
            Utils.showToast(error.message || '取消失败', 'error');
            if (cancelBtn) {
                cancelBtn.disabled = false;
                cancelBtn.innerHTML = '取消抢单';
            }
        }
    },

    async viewContact(taskId) {
        if (!Auth.requireAuth()) return;

        try {
            const result = await Api.contact.get(taskId);
            const contact = result.data;
            this.showContactModal(contact);
        } catch (error) {
            Utils.showToast(error.message || '获取联系方式失败', 'error');
        }
    },

    showContactModal(contact) {
        const modal = document.getElementById('contact-modal');
        if (!modal) return;

        const container = modal.querySelector('.modal-body');
        if (container) {
            let html = '';
            
            if (contact.contact_phone) {
                html += `
                    <div class="contact-card">
                        <div class="contact-icon contact-icon-phone">
                            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                        </div>
                        <div class="contact-info">
                            <div class="contact-label">联系电话</div>
                            <div class="contact-value">${contact.contact_phone}</div>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="Utils.copyToClipboard('${contact.contact_phone}'); Utils.showToast('已复制', 'success');">
                            复制
                        </button>
                    </div>
                `;
            }

            if (contact.wechat_qrcode_url) {
                html += `
                    <div class="contact-card">
                        <div class="contact-icon contact-icon-wechat">
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.27-.027-.406-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                            </svg>
                        </div>
                        <div class="contact-info">
                            <div class="contact-label">微信</div>
                            <div class="contact-value">长按扫码添加</div>
                        </div>
                    </div>
                    <div class="text-center mt-lg">
                        <img src="${contact.wechat_qrcode_url}" alt="微信二维码" style="max-width: 200px; border-radius: 8px;"/>
                    </div>
                `;
            }

            if (!html) {
                html = '<div class="text-center text-muted">对方暂未设置联系方式</div>';
            }

            container.innerHTML = html;
        }

        this.showModal('contact-modal');
    },

    initPublishForm() {
        const categorySelect = document.getElementById('task-category');
        if (categorySelect) {
            categorySelect.innerHTML = `
                <option value="">请选择分类</option>
                ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            `;
        }

        const form = document.getElementById('publish-task-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this.submitPublishTask();
            };
        }
    },

    async submitPublishTask() {
        if (!Auth.requireAuth()) return;

        const title = document.getElementById('task-title')?.value.trim();
        const category = document.getElementById('task-category')?.value;
        const description = document.getElementById('task-description')?.value.trim();
        const budget = parseFloat(document.getElementById('task-budget')?.value) || 0;
        const address = document.getElementById('task-address')?.value.trim();
        const scheduledHours = parseInt(document.getElementById('task-scheduled-hours')?.value) || 6;

        if (!title) {
            Utils.showToast('请输入任务标题', 'warning');
            return;
        }

        if (!category) {
            Utils.showToast('请选择任务分类', 'warning');
            return;
        }

        const submitBtn = document.getElementById('btn-submit-task');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> 发布中...';
        }

        try {
            await Api.task.publish({
                title,
                category,
                description,
                budget,
                address,
                scheduled_hours: scheduledHours
            });

            this.cache.tasksLoaded = false;
            this.cache.myTasksLoaded = false;

            Utils.showToast('发布成功！', 'success');
            Router.navigate('tasks', { replace: true });
        } catch (error) {
            Utils.showToast(error.message || '发布失败', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    },

    renderTaskCard(task, index, showStatus = false, showAnimation = false) {
        const status = this.statusMap[task.status] || this.statusMap[0];
        const avatar = task.publisher?.avatar_url || '';
        const nickname = task.publisher?.nickname || task.publisher?.phone || '用户';
        const rating = task.publisher?.credit_score || 0;

        const animationClass = showAnimation ? `fade-in-up animate-delay-${(index % 5) + 1} animate-fill-backwards` : '';

        return `
            <div class="task-card ${animationClass}" 
                 data-route="taskDetail" 
                 data-params='{"taskId": ${task.id}}'>
                <div class="task-header">
                    <div class="flex-1">
                        <div class="task-title text-truncate">${Utils.escapeHtml(task.title)}</div>
                        <div class="task-meta">
                            <span class="task-category">${Utils.escapeHtml(task.category)}</span>
                            ${showStatus ? `<span class="status-badge ${status.class}">${status.text}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-budget">${Utils.formatMoney(task.budget)}</div>
                </div>
                ${task.description ? `
                    <div class="text-secondary text-sm mb-md text-truncate-2">
                        ${Utils.escapeHtml(task.description)}
                    </div>
                ` : ''}
                <div class="task-footer">
                    <div class="task-publisher">
                        <div class="avatar avatar-sm">${avatar ? `<img src="${avatar}" alt="">` : nickname.charAt(0)}</div>
                        <div class="task-publisher-info">
                            <div class="task-publisher-name">${Utils.escapeHtml(nickname)}</div>
                            <div class="task-publisher-rating">
                                <svg width="12" height="12" fill="currentColor" class="text-warning" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                ${rating}分
                            </div>
                        </div>
                    </div>
                    <div class="task-time">${Utils.formatRelativeTime(task.created_at)}</div>
                </div>
            </div>
        `;
    },

    renderTaskDetail(task) {
        const status = this.statusMap[task.status] || this.statusMap[0];
        const avatar = task.publisher?.avatar_url || '';
        const nickname = task.publisher?.nickname || task.publisher?.phone || '用户';
        const rating = task.publisher?.credit_score || 0;

        return `
            <div class="card fade-in">
                <div class="card-header">
                    <div class="card-title">${Utils.escapeHtml(task.title)}</div>
                    <span class="status-badge ${status.class}">${status.text}</span>
                </div>
                <div class="card-body">
                    <div class="flex items-center gap-md mb-lg">
                        <div class="task-category">${Utils.escapeHtml(task.category)}</div>
                        <div class="task-budget" style="margin-left: auto;">¥${Utils.formatMoney(task.budget)}</div>
                    </div>
                    
                    ${task.description ? `
                        <div class="mb-lg">
                            <div class="text-sm text-muted mb-sm">任务描述</div>
                            <div class="text-secondary">${Utils.escapeHtml(task.description)}</div>
                        </div>
                    ` : ''}
                    
                    ${task.address ? `
                        <div class="mb-lg">
                            <div class="text-sm text-muted mb-sm">任务地址</div>
                            <div class="flex items-center gap-sm">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="text-secondary" viewBox="0 0 24 24">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                <span class="text-secondary">${Utils.escapeHtml(task.address)}</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="divider"></div>
                    
                    <div class="flex items-center gap-md">
                        <div class="avatar">${avatar ? `<img src="${avatar}" alt="">` : nickname.charAt(0)}</div>
                        <div class="flex-1">
                            <div class="font-semibold">${Utils.escapeHtml(nickname)}</div>
                            <div class="flex items-center gap-xs text-sm text-muted">
                                <svg width="12" height="12" fill="currentColor" class="text-warning" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                信用分 ${rating}
                            </div>
                        </div>
                        <div class="text-xs text-muted">
                            发布于<br>${Utils.formatDate(task.created_at, 'MM-DD HH:mm')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="card fade-in animate-delay-1">
                <div class="card-title mb-md">任务状态</div>
                <div class="flex items-center justify-between">
                    <span class="text-secondary">当前状态</span>
                    <span class="status-badge ${status.class}">${status.text}</span>
                </div>
            </div>

            <div class="fixed bottom-0 left-0 right-0 p-lg" style="background: linear-gradient(to top, var(--bg-primary), transparent); padding-bottom: calc(var(--tab-bar-height) + var(--safe-area-bottom) + 16px);">
                <div class="flex gap-md">
                    <button id="btn-claim-task" class="btn btn-primary btn-lg btn-block flex-1 hidden">
                        立即抢单
                    </button>
                    <button id="btn-cancel-claim" class="btn btn-secondary btn-lg btn-block flex-1 hidden">
                        取消抢单
                    </button>
                    <button id="btn-view-contact" class="btn btn-outline btn-lg btn-block flex-1 hidden">
                        查看联系方式
                    </button>
                    <button id="btn-report-user" class="btn btn-danger btn-sm" onclick="TaskModule.showReportModal(${task.publisher_id}, ${task.id})">
                        举报
                    </button>
                </div>
            </div>
        `;
    },

    showReportModal(reportedId, taskId) {
        const modal = document.getElementById('report-modal');
        if (!modal) return;

        const form = document.getElementById('report-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const reason = document.getElementById('report-reason')?.value.trim();
                
                if (!reason) {
                    Utils.showToast('请填写举报原因', 'warning');
                    return;
                }

                try {
                    await Api.report.submit(reportedId, reason, taskId);
                    Utils.showToast('举报已提交', 'success');
                    this.hideModal('report-modal');
                } catch (error) {
                    Utils.showToast(error.message || '举报失败', 'error');
                }
            };
        }

        this.showModal('report-modal');
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            Utils.preventScroll();
        }
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            Utils.allowScroll();
        }
    },

    renderSkeleton() {
        return Array(3).fill('').map(() => `
            <div class="skeleton-card">
                <div class="skeleton-line skeleton-line-short mb-md"></div>
                <div class="skeleton-line mb-sm"></div>
                <div class="skeleton-line skeleton-line-medium mb-lg"></div>
                <div class="flex items-center gap-md">
                    <div class="skeleton-avatar"></div>
                    <div class="flex-1">
                        <div class="skeleton-line skeleton-line-short mb-sm"></div>
                        <div class="skeleton-line skeleton-line-medium"></div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderEmpty(text) {
        return `
            <div class="empty-state">
                <svg class="empty-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <div class="empty-text">${text}</div>
            </div>
        `;
    }
};

window.TaskModule = TaskModule;
