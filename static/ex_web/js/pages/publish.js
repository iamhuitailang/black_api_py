var PublishPage = {
    images: [],
    categories: ['数码', '图书', '家居', '服饰', '美妆', '运动', '母婴', '其他'],
    conditions: [
        { value: 1, label: '全新' },
        { value: 2, label: '几乎全新' },
        { value: 3, label: '轻微使用' },
        { value: 4, label: '明显使用' }
    ],
    
    render: function() {
        if (!Auth.checkAuth()) return;
        
        var app = document.getElementById('app');
        
        var categoriesHtml = this.categories.map(function(cat) {
            return '<option value="' + cat + '">' + cat + '</option>';
        }).join('');
        
        var conditionsHtml = this.conditions.map(function(c) {
            return '<option value="' + c.value + '">' + c.label + '</option>';
        }).join('');
        
        app.innerHTML = `
            <div class="page-container">
                <div class="header">
                    <div class="header-left">
                        <button class="header-btn" onclick="Router.navigate(-1)">
                            <span>←</span>
                        </button>
                    </div>
                    <div class="header-title">发布物品</div>
                    <div class="header-right"></div>
                </div>
                <div class="page-content">
                    <form id="publishForm">
                        <div class="publish-section">
                            <div class="publish-section-title">物品图片（最多6张）</div>
                            <div class="image-upload-grid" id="imageUploadGrid"></div>
                        </div>
                        
                        <div class="publish-section">
                            <div class="publish-section-title">基本信息</div>
                            <div class="form-group">
                                <label class="form-label">标题 <span class="required">*</span></label>
                                <input type="text" class="form-control" id="title" placeholder="请输入物品标题（最多30字）" maxlength="30">
                            </div>
                            <div class="form-group">
                                <label class="form-label">分类 <span class="required">*</span></label>
                                <div class="select-wrapper">
                                    <select class="form-control" id="category">
                                        <option value="">请选择分类</option>
                                        ` + categoriesHtml + `
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">新旧程度 <span class="required">*</span></label>
                                <div class="select-wrapper">
                                    <select class="form-control" id="condition">
                                        <option value="">请选择新旧程度</option>
                                        ` + conditionsHtml + `
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="publish-section">
                            <div class="publish-section-title">详细描述</div>
                            <div class="form-group">
                                <label class="form-label">物品描述 <span class="required">*</span></label>
                                <textarea class="form-control" id="description" placeholder="请详细描述物品情况（至少10字）" rows="4" maxlength="500"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">期望交换品类</label>
                                <div class="select-wrapper">
                                    <select class="form-control" id="exchangeCategory">
                                        <option value="">不限</option>
                                        ` + categoriesHtml + `
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">所在地区</label>
                                <input type="text" class="form-control" id="location" placeholder="请输入所在地区（如：北京市朝阳区）">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="publish-bottom-bar safe-bottom">
                    <button type="button" class="btn btn-primary btn-block" id="publishBtn">发布物品</button>
                </div>
            </div>
        `;
        
        this.renderImageGrid();
        this.bindEvents();
    },
    
    renderImageGrid: function() {
        var self = this;
        var container = document.getElementById('imageUploadGrid');
        var html = '';
        
        this.images.forEach(function(img, index) {
            html += `
                <div class="image-upload-item">
                    <img src="` + img + `" alt="">
                    <button class="remove-btn" onclick="PublishPage.removeImage(` + index + `)">×</button>
                </div>
            `;
        });
        
        if (this.images.length < 6) {
            html += `
                <div class="image-upload-item" id="addImageBtn">
                    <div class="icon">➕</div>
                    <div class="text">添加图片</div>
                    <input type="file" id="imageInput" accept="image/*" multiple style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;">
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        var imageInput = document.getElementById('imageInput');
        if (imageInput) {
            imageInput.addEventListener('change', function(e) {
                self.handleImageSelect(e);
            });
        }
    },
    
    handleImageSelect: function(e) {
        var self = this;
        var files = e.target.files;
        
        for (var i = 0; i < files.length && this.images.length < 6; i++) {
            var file = files[i];
            if (file.type.startsWith('image/')) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    self.images.push(event.target.result);
                    self.renderImageGrid();
                };
                reader.readAsDataURL(file);
            }
        }
    },
    
    removeImage: function(index) {
        this.images.splice(index, 1);
        this.renderImageGrid();
    },
    
    bindEvents: function() {
        var self = this;
        var publishBtn = document.getElementById('publishBtn');
        
        publishBtn.addEventListener('click', function() {
            var title = document.getElementById('title').value.trim();
            var category = document.getElementById('category').value;
            var condition = document.getElementById('condition').value;
            var description = document.getElementById('description').value.trim();
            var exchangeCategory = document.getElementById('exchangeCategory').value;
            var location = document.getElementById('location').value.trim();
            
            if (self.images.length === 0) {
                Toast.error('请至少上传一张图片');
                return;
            }
            
            if (!title) {
                Toast.error('请输入标题');
                return;
            }
            
            if (!category) {
                Toast.error('请选择分类');
                return;
            }
            
            if (!condition) {
                Toast.error('请选择新旧程度');
                return;
            }
            
            if (!description) {
                Toast.error('请输入物品描述');
                return;
            }
            
            if (description.length < 10) {
                Toast.error('描述至少10个字');
                return;
            }
            
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<span class="loading-small"></span> 发布中...';
            
            API.post('/ex/item/publish', {
                title: title,
                category: category,
                condition: parseInt(condition),
                description: description,
                images: self.images,
                expect_categories: exchangeCategory ? [exchangeCategory] : [],
                city: location
            })
                .then(function() {
                    Toast.success('发布成功');
                    setTimeout(function() {
                        Router.navigate('/');
                    }, 500);
                })
                .catch(function(error) {
                    Toast.error(error.message || '发布失败');
                    publishBtn.disabled = false;
                    publishBtn.innerHTML = '发布物品';
                });
        });
    }
};
