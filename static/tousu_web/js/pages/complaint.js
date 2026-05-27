const ComplaintPage = {
    formData: {
        type: 'complaint',
        category_id: 0,
        department_id: 0,
        title: '',
        content: '',
        priority: 1,
        is_anonymous: 0
    },

    categories: [],
    departments: [],

    async render() {
        const app = document.getElementById('app');
        const params = Router.getParams();
        if (params.type) {
            this.formData.type = params.type;
        }

        app.innerHTML = `
            <div class="page has-header">
                ${Layout.renderHeader('提交投诉建议', true)}

                <div class="create-complaint-tabs">
                    <div class="create-post-tab ${this.formData.type === 'complaint' ? 'active' : ''}" data-type="complaint">
                        📢 投诉
                    </div>
                    <div class="create-post-tab ${this.formData.type === 'suggestion' ? 'active' : ''}" data-type="suggestion">
                        💡 建议
                    </div>
                </div>

                <div class="card">
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">标题 <span style="color: #ef4444;">*</span></label>
                            <input type="text" class="form-control" id="title" placeholder="请输入标题" maxlength="100">
                        </div>

                        <div class="form-group">
                            <label class="form-label">分类 <span style="color: #ef4444;">*</span></label>
                            <select class="form-control" id="category">
                                <option value="0">请选择分类</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">处理部门 <span style="color: #ef4444;">*</span></label>
                            <select class="form-control" id="department">
                                <option value="0">请选择部门</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">内容 <span style="color: #ef4444;">*</span></label>
                            <textarea class="form-control" id="content" placeholder="请详细描述您的问题或建议" rows="6"></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">优先级</label>
                                <select class="form-control" id="priority">
                                    <option value="1">普通</option>
                                    <option value="2">中等</option>
                                    <option value="3">较高</option>
                                    <option value="4">紧急</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">是否匿名</label>
                                <select class="form-control" id="is_anonymous">
                                    <option value="0">实名</option>
                                    <option value="1">匿名</option>
                                </select>
                            </div>
                        </div>

                        <button class="btn btn-primary btn-block btn-lg" id="submitBtn">
                            提交${this.formData.type === 'complaint' ? '投诉' : '建议'}
                        </button>
                    </div>
                </div>

                ${Layout.renderTabbar('complaint')}
            </div>
        `;

        this.bindEvents();
        await this.loadData();
    },

    bindEvents() {
        document.querySelectorAll('.create-post-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.formData.type = tab.dataset.type;
                document.querySelectorAll('.create-post-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('submitBtn').textContent = `提交${this.formData.type === 'complaint' ? '投诉' : '建议'}`;
            });
        });

        document.getElementById('submitBtn').addEventListener('click', async () => {
            const title = document.getElementById('title').value.trim();
            const category_id = parseInt(document.getElementById('category').value);
            const department_id = parseInt(document.getElementById('department').value);
            const content = document.getElementById('content').value.trim();
            const priority = parseInt(document.getElementById('priority').value);
            const is_anonymous = parseInt(document.getElementById('is_anonymous').value);

            if (!title) {
                Toast.error('请输入标题');
                return;
            }

            if (!category_id) {
                Toast.error('请选择分类');
                return;
            }

            if (!department_id) {
                Toast.error('请选择处理部门');
                return;
            }

            if (!content) {
                Toast.error('请输入内容');
                return;
            }

            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.textContent = '提交中...';

            try {
                const result = await ApiService.post('/tousu/complaint/create', {
                    type: this.formData.type,
                    category_id,
                    department_id,
                    title,
                    content,
                    priority,
                    is_anonymous
                });

                if (result.code === 0) {
                    Toast.success('提交成功');
                    Router.navigate('myComplaints');
                } else {
                    Toast.error(result.msg || '提交失败');
                    btn.disabled = false;
                    btn.textContent = `提交${this.formData.type === 'complaint' ? '投诉' : '建议'}`;
                }
            } catch (error) {
                Toast.error('提交失败');
                btn.disabled = false;
                btn.textContent = `提交${this.formData.type === 'complaint' ? '投诉' : '建议'}`;
            }
        });
    },

    async loadData() {
        try {
            const [categoryResult, departmentResult] = await Promise.all([
                ApiService.get('/tousu/category/list/get'),
                ApiService.get('/tousu/department/list/get')
            ]);

            if (categoryResult.code === 0) {
                this.categories = categoryResult.data.items || [];
                const categorySelect = document.getElementById('category');
                this.categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    categorySelect.appendChild(option);
                });
            }

            if (departmentResult.code === 0) {
                this.departments = departmentResult.data.items || [];
                const departmentSelect = document.getElementById('department');
                this.departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.id;
                    option.textContent = dept.name;
                    departmentSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }
};

window.ComplaintPage = ComplaintPage;