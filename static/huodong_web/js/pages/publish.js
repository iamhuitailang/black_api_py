const PublishPage = {
    categories: [],
    selectedCategory: '',

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <span class="header-back" onclick="Router.back()">←</span>
                    <h1 class="header-title">发布活动</h1>
                    <span class="header-action" id="publishBtn">发布</span>
                </header>

                <div class="publish-form">
                    <div class="form-group">
                        <label class="form-label">活动分类</label>
                        <div class="category-picker" id="categoryPicker">
                            加载中...
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">活动标题 *</label>
                        <input type="text" id="title" class="form-control" placeholder="请输入活动标题">
                    </div>

                    <div class="form-group">
                        <label class="form-label">活动描述 *</label>
                        <textarea id="description" class="form-control" placeholder="请详细描述活动内容"></textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">开始时间</label>
                            <input type="datetime-local" id="startTime" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">结束时间</label>
                            <input type="datetime-local" id="endTime" class="form-control">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">活动地点</label>
                        <input type="text" id="locationName" class="form-control" placeholder="如：人民公园">
                    </div>

                    <div class="form-group">
                        <label class="form-label">详细地址</label>
                        <input type="text" id="locationAddress" class="form-control" placeholder="如：北京市朝阳区">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">最大人数</label>
                            <input type="number" id="maxParticipants" class="form-control" placeholder="0=不限">
                        </div>
                        <div class="form-group">
                            <label class="form-label">费用</label>
                            <select id="isFree" class="form-control">
                                <option value="1">免费</option>
                                <option value="0">收费</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group hidden" id="feeGroup">
                        <label class="form-label">费用说明</label>
                        <input type="text" id="fee" class="form-control" placeholder="如：50元/人">
                    </div>

                    <div class="form-group">
                        <label class="form-label">标签(逗号分隔)</label>
                        <input type="text" id="tags" class="form-control" placeholder="如：户外,交友,运动">
                    </div>
                </div>

                ${Tabbar.render('publish')}
            </div>
        `;
        await this.loadCategories();
        this.bindEvents();
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/huodong/activity/categories/get');
            if (result.code === 0) {
                this.categories = result.data || [];
                const picker = document.getElementById('categoryPicker');
                picker.innerHTML = this.categories.map(cat => `
                    <div class="category-picker-item" data-code="${cat.code}">
                        ${cat.icon} ${cat.name}
                    </div>
                `).join('');
                this.bindCategoryEvents();
            }
        } catch (e) {
            console.error('加载分类失败:', e);
        }
    },

    bindCategoryEvents() {
        document.querySelectorAll('.category-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectedCategory = item.dataset.code;
                document.querySelectorAll('.category-picker-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    bindEvents() {
        document.getElementById('isFree').addEventListener('change', (e) => {
            document.getElementById('feeGroup').classList.toggle('hidden', e.target.value === '1');
        });

        document.getElementById('publishBtn').addEventListener('click', async () => {
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
                start_time: document.getElementById('startTime').value || null,
                end_time: document.getElementById('endTime').value || null,
                location_name: document.getElementById('locationName').value.trim(),
                location_address: document.getElementById('locationAddress').value.trim(),
                max_participants: parseInt(document.getElementById('maxParticipants').value) || 0,
                is_free: parseInt(document.getElementById('isFree').value),
                fee: document.getElementById('fee').value.trim(),
                tags: document.getElementById('tags').value.trim()
            };
            Loading.show();
            try {
                const result = await ApiService.post('/huodong/activity/create', data);
                if (result.code === 0) {
                    Toast.success('发布成功！');
                    Router.navigate('detail', { activity_id: result.data.id });
                } else {
                    Toast.error(result.msg || '发布失败');
                }
            } catch (e) {
                Toast.error('发布失败');
            } finally {
                Loading.hide();
            }
        });
    }
};
