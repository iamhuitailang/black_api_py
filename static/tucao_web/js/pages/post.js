const PostPage = {
    categories: [],
    selectedCategory: '',

    async render() {
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="app-container">
                <header class="page-header">
                    <button class="back-btn" onclick="Router.navigate('home')">←</button>
                    <h1>发布吐槽</h1>
                    <div style="width: 40px;"></div>
                </header>

                <main class="app-main">
                    <div class="post-form">
                        <div class="form-group">
                            <label>选择分类</label>
                            <div class="category-select" id="categorySelect">
                                <div class="loading">加载中...</div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>吐槽内容</label>
                            <textarea 
                                id="postContent" 
                                placeholder="说出你的秘密，这里是你的树洞..."
                                maxlength="500"
                                oninput="PostPage.updateCharCount(this)"
                            ></textarea>
                            <div class="char-count">
                                <span id="charCount">0</span>/500
                            </div>
                        </div>
                        
                        <div class="form-tip">
                            <p>💡 发布后会生成删除码，请妥善保管</p>
                            <p>💡 删除码可用于编辑或删除你的吐槽</p>
                        </div>
                        
                        <button class="btn-submit" onclick="PostPage.submitPost()">
                            发布吐槽
                        </button>
                    </div>
                </main>
            </div>
        `;

        await this.loadCategories();
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/tucao/post/categories/get');
            if (result.code === 0 && result.data) {
                this.categories = result.data;
                this.renderCategories();
            }
        } catch (e) {
            console.error('加载分类失败:', e);
        }
    },

    renderCategories() {
        const container = document.getElementById('categorySelect');
        container.innerHTML = this.categories.map(cat => `
            <div class="category-chip ${this.selectedCategory === cat.code ? 'active' : ''}" 
                 style="border-color: ${cat.color}; ${this.selectedCategory === cat.code ? `background: ${cat.color}30;` : ''}"
                 onclick="PostPage.selectCategory('${cat.code}')">
                ${cat.icon} ${cat.name}
            </div>
        `).join('');
    },

    selectCategory(code) {
        this.selectedCategory = this.selectedCategory === code ? '' : code;
        this.renderCategories();
    },

    updateCharCount(textarea) {
        const count = textarea.value.length;
        document.getElementById('charCount').textContent = count;
        
        if (count > 0) {
            Utils.playTypeSound();
        }
    },

    async submitPost() {
        const content = document.getElementById('postContent').value.trim();
        
        if (!content) {
            Toast.warning('请输入吐槽内容');
            return;
        }
        
        if (content.length > 500) {
            Toast.warning('内容不能超过500字');
            return;
        }

        try {
            const result = await ApiService.post('/tucao/post/create', {
                content: content,
                category: this.selectedCategory
            });

            if (result.code === 0) {
                Toast.success('发布成功');
                this.showDeleteCode(result.data.delete_code);
            } else {
                Toast.error(result.msg || '发布失败');
            }
        } catch (error) {
            Toast.error('发布失败');
        }
    },

    showDeleteCode(code) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎉 发布成功</h3>
                </div>
                <div class="modal-body">
                    <p class="modal-tip">请保存好删除码，用于管理你的吐槽：</p>
                    <div class="delete-code-display">
                        <span class="code-text">${code}</span>
                        <button class="copy-btn" onclick="Utils.copyToClipboard('${code}')">复制</button>
                    </div>
                    <p class="modal-warn">⚠️ 请妥善保管，忘记删除码将无法管理此吐槽</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal" onclick="Router.navigate('home'); this.closest('.modal-overlay').remove()">
                        我知道了
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
};
