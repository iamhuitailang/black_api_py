const EditActivityPage = {
    activityId: null,
    activity: null,
    categories: [],
    selectedCategory: '',

    async render() {
        this.activityId = Router.getParams().activity_id;
        if (!this.activityId) {
            Router.navigate('home');
            return;
        }
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <span class="header-back" onclick="Router.back()">←</span>
                    <h1 class="header-title">编辑活动</h1>
                    <span class="header-action" id="saveBtn">保存</span>
                </header>

                <div class="publish-form">
                    <div class="empty-state">
                        <div class="empty-state-icon">⏳</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>
            </div>
        `;
        await this.loadActivity();
    },

    async loadActivity() {
        try {
            const result = await ApiService.get('/huodong/activity/detail/get', { activity_id: this.activityId });
            if (result.code === 0) {
                this.activity = result.data;
                await this.loadCategories();
            } else {
                Toast.error(result.msg || '加载失败');
                Router.back();
            }
        } catch (e) {
            Toast.error('加载失败');
            Router.back();
        }
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/huodong/activity/categories/get');
            if (result.code === 0) {
                this.categories = result.data || [];
                this.selectedCategory = this.activity.category;
                this.renderForm();
            }
        } catch (e) {
            console.error('加载分类失败:', e);
        }
    },

    renderForm() {
        const a = this.activity;
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <span class="header-back" onclick="Router.back()">←</span>
                    <h1 class="header-title">编辑活动</h1>
                    <span class="header-action" id="saveBtn">保存</span>
                </header>

                <div class="publish-form">
                    <div class="form-group">
                        <label class="form-label">活动分类</label>
                        <div class="category-picker" id="categoryPicker">
                            ${this.categories.map(cat => `
                                <div class="category-picker-item ${cat.code === this.selectedCategory ? 'active' : ''}" data-code="${cat.code}">
                                    ${cat.icon} ${cat.name}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">活动标题 *</label>
                        <input type="text" id="title" class="form-control" value="${a.title || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">活动描述 *</label>
                        <textarea id="description" class="form-control">${a.description || ''}</textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">开始时间</label>
                            <input type="datetime-local" id="startTime" class="form-control" value="${a.start_time ? a.start_time.slice(0, 16) : ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">结束时间</label>
                            <input type="datetime-local" id="endTime" class="form-control" value="${a.end_time ? a.end_time.slice(0, 16) : ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">活动地点</label>
                        <input type="text" id="locationName" class="form-control" value="${a.location_name || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">详细地址</label>
                        <input type="text" id="locationAddress" class="form-control" value="${a.location_address || ''}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">最大人数</label>
                            <input type="number" id="maxParticipants" class="form-control" value="${a.max_participants || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">费用</label>
                            <select id="isFree" class="form-control">
                                <option value="1" ${a.is_free === 1 ? 'selected' : ''}>免费</option>
                                <option value="0" ${a.is_free === 0 ? 'selected' : ''}>收费</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group ${a.is_free === 1 ? 'hidden' : ''}" id="feeGroup">
                        <label class="form-label">费用说明</label>
                        <input type="text" id="fee" class="form-control" value="${a.fee || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">标签(逗号分隔)</label>
                        <input type="text" id="tags" class="form-control" value="${a.tags || ''}">
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.category-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectedCategory = item.dataset.code;
                document.querySelectorAll('.category-picker-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        document.getElementById('isFree').addEventListener('change', (e) => {
            document.getElementById('feeGroup').classList.toggle('hidden', e.target.value === '1');
        });

        document.getElementById('saveBtn').addEventListener('click', async () => {
            const title = document.getElementById('title').value.trim();
            const description = document.getElementById('description').value.trim();
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime').value;
            
            if (!this.selectedCategory) {
                Toast.error('请选择活动分类');
                return;
            }
            if (!title || title.length < 2) {
                Toast.error('标题至少2个字符');
                return;
            }
            if (!description || description.length < 5) {
                Toast.error('描述至少5个字符');
                return;
            }
            if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
                Toast.error('结束时间必须大于开始时间');
                return;
            }
            
            const data = {
                title,
                description,
                category: this.selectedCategory,
                start_time: startTime || null,
                end_time: endTime || null,
                location_name: document.getElementById('locationName').value.trim(),
                location_address: document.getElementById('locationAddress').value.trim(),
                max_participants: parseInt(document.getElementById('maxParticipants').value) || 0,
                is_free: parseInt(document.getElementById('isFree').value),
                fee: document.getElementById('fee').value.trim(),
                tags: document.getElementById('tags').value.trim()
            };
            
            Loading.show();
            try {
                const result = await ApiService.post(`/huodong/activity/update?activity_id=${this.activityId}`, data);
                if (result.code === 0) {
                    Toast.success('保存成功！');
                    Router.navigate('detail', { activity_id: this.activityId });
                } else {
                    Toast.error(result.msg || '保存失败');
                }
            } catch (e) {
                Toast.error('保存失败');
            } finally {
                Loading.hide();
            }
        });
    }
};
