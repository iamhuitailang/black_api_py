const PostPage = {
    currentType: 'need',
    selectedCategory: null,

    categories: [
        { code: 'tools', name: '工具借用', desc: '维修工具、户外装备' },
        { code: 'errand', name: '跑腿帮忙', desc: '取快递、遛狗、浇花' },
        { code: 'repair', name: '维修', desc: '水电、家电、手机' },
        { code: 'care', name: '照顾', desc: '看孩子、陪老人' },
        { code: 'study', name: '学习', desc: '辅导作业、技能交换' },
        { code: 'life', name: '生活', desc: '推荐服务、拼单' }
    ],

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page create-post-page has-header">
                <header class="header">
                    <h1 class="header-title">发布</h1>
                </header>

                <div class="create-post-tabs">
                    <div class="create-post-tab ${this.currentType === 'need' ? 'active' : ''}" data-type="need">我要求助</div>
                    <div class="create-post-tab ${this.currentType === 'help' ? 'active' : ''}" data-type="help">我能帮助</div>
                </div>

                <div class="divider"></div>

                <div class="create-post-section">
                    <div class="section-title">选择分类</div>
                    <div class="category-picker" id="categoryPicker">
                        ${this.renderCategories()}
                    </div>
                </div>

                <div class="card">
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">标题 <span class="text-primary">*</span></label>
                            <input type="text" class="form-control" id="postTitle" placeholder="请输入标题（至少2字）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述 <span class="text-primary">*</span></label>
                            <textarea class="form-control" id="postContent" placeholder="请详细描述您的需求或能提供的帮助（至少5字）"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">期望时间</label>
                            <input type="datetime-local" class="form-control" id="postExpectTime">
                        </div>
                    </div>
                </div>

                <div style="padding: 16px; padding-bottom: calc(16px + var(--safe-area-bottom));">
                    <button class="btn btn-primary btn-block" id="submitBtn">发布</button>
                </div>
            </div>

            ${Tabbar.render('post')}
        `;

        this.bindEvents();
    },

    renderCategories() {
        return this.categories.map(cat => `
            <div class="category-picker-item ${this.selectedCategory === cat.code ? 'active' : ''}" data-category="${cat.code}">
                ${cat.name}
            </div>
        `).join('');
    },

    bindEvents() {
        document.querySelectorAll('.create-post-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentType = tab.dataset.type;
                document.querySelectorAll('.create-post-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.type === this.currentType);
                });
            });
        });

        document.querySelectorAll('.category-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectedCategory = item.dataset.category;
                document.querySelectorAll('.category-picker-item').forEach(i => {
                    i.classList.toggle('active', i.dataset.category === this.selectedCategory);
                });
            });
        });

        document.getElementById('submitBtn').addEventListener('click', () => {
            this.submit();
        });
    },

    async submit() {
        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        const expectTime = document.getElementById('postExpectTime').value;
        const submitBtn = document.getElementById('submitBtn');

        if (!this.selectedCategory) {
            Toast.error('请选择分类');
            return;
        }

        if (!title || title.length < 2) {
            Toast.error('标题至少2个字');
            return;
        }

        if (!content || content.length < 5) {
            Toast.error('描述至少5个字');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> 发布中...';

        try {
            const data = {
                category: this.selectedCategory,
                title: title,
                content: content
            };

            if (expectTime) {
                data.expect_time = new Date(expectTime).toISOString();
            }

            let result;
            if (this.currentType === 'need') {
                result = await ApiService.post('/xq/post/need/create', data);
            } else {
                result = await ApiService.post('/xq/post/help/create', data);
            }

            if (result.code === 0) {
                Toast.success('发布成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '发布失败');
            }
        } catch (error) {
            console.error('发布失败:', error);
            Toast.error('发布失败，请检查网络');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '发布';
        }
    }
};
