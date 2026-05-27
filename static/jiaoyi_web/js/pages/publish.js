const PublishPage = {
    categories: [],
    selectedCategory: null,
    selectedCondition: 'good',

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar publish-page">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <div class="header-title">发布教材</div>
                    <div class="header-action" id="submitBtn">发布</div>
                </div>
                
                <div class="publish-form">
                    <div class="form-group">
                        <label class="form-label">教材图片（选填）</label>
                        <div class="image-uploader">
                            <div class="image-add" id="addImageBtn">+</div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">教材名称 *</label>
                        <input type="text" class="form-control" id="title" placeholder="请输入教材名称">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">分类 *</label>
                        <div class="category-select" id="categorySelect">
                            <div class="text-center text-secondary" style="width:100%;padding:10px;">加载中...</div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">作者</label>
                            <input type="text" class="form-control" id="author" placeholder="请输入作者">
                        </div>
                        <div class="form-group">
                            <label class="form-label">出版社</label>
                            <input type="text" class="form-control" id="publisher" placeholder="请输入出版社">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">出版日期</label>
                            <input type="text" class="form-control" id="publishDate" placeholder="如：2023-01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">ISBN</label>
                            <input type="text" class="form-control" id="isbn" placeholder="请输入ISBN">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">新旧程度 *</label>
                            <div class="condition-select">
                                <div class="condition-option" data-condition="new">全新</div>
                                <div class="condition-option" data-condition="like_new">几乎全新</div>
                                <div class="condition-option active" data-condition="good">良好</div>
                                <div class="condition-option" data-condition="fair">一般</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row price-input-group">
                        <div class="form-group">
                            <label class="form-label">售价（元）*</label>
                            <input type="number" class="form-control" id="price" placeholder="请输入售价" step="0.01" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">原价（元）</label>
                            <input type="number" class="form-control" id="originalPrice" placeholder="请输入原价" step="0.01" min="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">适用课程</label>
                        <input type="text" class="form-control" id="course" placeholder="如：高等数学">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">商品描述</label>
                        <textarea class="form-control" id="description" placeholder="请描述教材的详细情况..."></textarea>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
        await this.loadCategories();
    },

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => Router.back());
        document.getElementById('submitBtn').addEventListener('click', () => this.handleSubmit());

        document.querySelectorAll('.condition-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.condition-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.selectedCondition = option.dataset.condition;
            });
        });

        document.getElementById('addImageBtn').addEventListener('click', () => {
            Toast.info('图片上传功能开发中');
        });
    },

    async loadCategories() {
        try {
            const result = await ApiService.category.getList();
            if (result.code === 0) {
                this.categories = result.data;
                this.renderCategories();
            }
        } catch (e) {
            console.error('加载分类失败', e);
        }
    },

    renderCategories() {
        const container = document.getElementById('categorySelect');
        container.innerHTML = this.categories.map(cat => `
            <div class="category-option" data-category-id="${cat.id}">
                ${cat.icon || '📚'} ${cat.name}
            </div>
        `).join('');

        container.querySelectorAll('.category-option').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.category-option').forEach(o => o.classList.remove('active'));
                item.classList.add('active');
                this.selectedCategory = parseInt(item.dataset.categoryId);
            });
        });
    },

    async handleSubmit() {
        const title = document.getElementById('title').value.trim();
        const author = document.getElementById('author').value.trim();
        const publisher = document.getElementById('publisher').value.trim();
        const publishDate = document.getElementById('publishDate').value.trim();
        const isbn = document.getElementById('isbn').value.trim();
        const price = parseFloat(document.getElementById('price').value);
        const originalPrice = parseFloat(document.getElementById('originalPrice').value) || 0;
        const course = document.getElementById('course').value.trim();
        const description = document.getElementById('description').value.trim();

        if (!title) {
            Toast.error('请输入教材名称');
            return;
        }
        if (!this.selectedCategory) {
            Toast.error('请选择分类');
            return;
        }
        if (isNaN(price) || price <= 0) {
            Toast.error('请输入有效的售价');
            return;
        }

        const user = AuthService.getUser();
        
        Utils.showLoading();
        try {
            const result = await ApiService.book.create({
                category_id: this.selectedCategory,
                title,
                author,
                publisher,
                publish_date: publishDate,
                isbn,
                edition: '',
                price,
                original_price: originalPrice,
                condition: this.selectedCondition,
                description,
                images: '',
                school: user?.school || '',
                major: user?.major || '',
                course
            });
            if (result.code === 0) {
                Toast.success('发布成功，等待审核');
                setTimeout(() => {
                    Router.navigate('home');
                }, 1500);
            } else {
                Toast.error(result.msg || '发布失败');
            }
        } catch (e) {
            Toast.error('发布失败');
        } finally {
            Utils.hideLoading();
        }
    }
};

window.PublishPage = PublishPage;
