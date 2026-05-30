const PostPage = {
    postType: 'lost',
    categories: [],
    images: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                ${Header.render('发布信息', true)}
                <main class="container">
                    <div class="tabs">
                        <div class="tab-item ${this.postType === 'lost' ? 'active' : ''}" data-type="lost">
                            🔍 我丢了东西
                        </div>
                        <div class="tab-item ${this.postType === 'found' ? 'active' : ''}" data-type="found">
                            🫴 我捡到了东西
                        </div>
                    </div>

                    <div class="card">
                        <form id="postForm">
                            <div class="form-group">
                                <label class="form-label">物品名称 <span class="required">*</span></label>
                                <input type="text" class="form-input" id="postTitle" placeholder="请输入物品名称，如：黑色钱包、蓝色雨伞等">
                            </div>

                            <div class="form-group">
                                <label class="form-label">物品分类 <span class="required">*</span></label>
                                <div class="category-grid" id="categorySelect">
                                    <div class="loading">
                                        <div class="loading-spinner"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">${this.postType === 'lost' ? '丢失' : '拾到'}地点 <span class="required">*</span></label>
                                <input type="text" class="form-input" id="postLocation" placeholder="请输入${this.postType === 'lost' ? '丢失' : '拾到'}的具体地点">
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">${this.postType === 'lost' ? '丢失' : '拾到'}时间</label>
                                    <input type="datetime-local" class="form-input" id="postTime">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">联系方式</label>
                                    <input type="text" class="form-input" id="postContact" placeholder="手机号或微信号">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">详细描述 <span class="required">*</span></label>
                                <textarea class="form-textarea" id="postDescription" placeholder="${this.postType === 'lost' ? '请详细描述物品特征，如：品牌、颜色、内含物品等，越详细越容易找回' : '请详细描述物品特征和拾到经过，方便失主确认'}"></textarea>
                            </div>

                            <div class="form-group">
                                <label class="form-label">物品图片</label>
                                <div class="images-preview" id="imagesPreview">
                                    <label class="image-upload-btn">
                                        <span class="icon">📷</span>
                                        <span class="text">添加图片</span>
                                        <input type="file" id="imageInput" accept="image/*" multiple style="display: none;">
                                    </label>
                                </div>
                            </div>

                            <div class="form-group" style="margin-top: 24px;">
                                <button type="submit" class="btn btn-primary btn-block btn-lg" id="submitBtn">
                                    ${this.postType === 'lost' ? '发布寻物启事' : '发布招领启事'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        `;

        this.bindEvents();
        await this.loadCategories();
    },

    bindEvents() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.postType = tab.dataset.type;
                this.render();
            });
        });

        document.getElementById('postForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        document.getElementById('imageInput').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/shiwu/category/list/get');
            if (result.code === 0) {
                this.categories = result.data || [];
                this.renderCategories();
            }
        } catch (error) {
            console.error('加载分类失败:', error);
        }
    },

    renderCategories() {
        const container = document.getElementById('categorySelect');
        container.innerHTML = this.categories.map(cat => `
            <div class="category-item" data-code="${cat.code}">
                <div class="category-icon">${cat.icon || Utils.getCategoryIcon(cat.code)}</div>
                <div class="category-name">${cat.name}</div>
            </div>
        `).join('');

        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.images.push(event.target.result);
                this.renderImages();
            };
            reader.readAsDataURL(file);
        });
    },

    renderImages() {
        const preview = document.getElementById('imagesPreview');
        preview.innerHTML = this.images.map((img, index) => `
            <div style="position: relative;">
                <img src="${img}" alt="图片${index + 1}">
                <button type="button" style="position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; cursor: pointer;" onclick="PostPage.removeImage(${index})">×</button>
            </div>
        `).join('') + `
            ${this.images.length < 9 ? `
                <label class="image-upload-btn">
                    <span class="icon">📷</span>
                    <span class="text">添加图片</span>
                    <input type="file" id="imageInput" accept="image/*" multiple style="display: none;">
                </label>
            ` : ''}
        `;

        const input = document.getElementById('imageInput');
        if (input) {
            input.addEventListener('change', (e) => {
                this.handleImageUpload(e);
            });
        }
    },

    removeImage(index) {
        this.images.splice(index, 1);
        this.renderImages();
    },

    async handleSubmit() {
        const title = document.getElementById('postTitle').value.trim();
        const description = document.getElementById('postDescription').value.trim();
        const location = document.getElementById('postLocation').value.trim();
        const lost_time = document.getElementById('postTime').value;
        const contact = document.getElementById('postContact').value.trim();
        const activeCategory = document.querySelector('.category-item.active');
        const category_code = activeCategory ? activeCategory.dataset.code : null;

        const submitBtn = document.getElementById('submitBtn');

        if (!title) {
            Toast.error('请输入物品名称');
            return;
        }

        if (!category_code) {
            Toast.error('请选择物品分类');
            return;
        }

        if (!location) {
            Toast.error('请输入地点');
            return;
        }

        if (!description) {
            Toast.error('请输入详细描述');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> 发布中...';

        try {
            const data = {
                title,
                description,
                location,
                category_code,
                post_type: this.postType,
                images: this.images,
                contact
            };

            if (lost_time) {
                data.lost_time = lost_time;
            }

            const result = await ApiService.post('/shiwu/post/create', data);

            if (result.code === 0) {
                Toast.success('发布成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '发布失败');
            }
        } catch (error) {
            Toast.error('发布失败，请检查网络');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = this.postType === 'lost' ? '发布寻物启事' : '发布招领启事';
        }
    }
};

window.PostPage = PostPage;
