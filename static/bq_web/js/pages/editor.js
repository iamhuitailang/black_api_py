const EditorPage = {
    noteId: null,
    note: null,
    colorOptions: [
        { name: '默认', value: '#FFF9C4' },
        { name: '蓝色', value: '#E3F2FD' },
        { name: '绿色', value: '#E8F5E9' },
        { name: '粉色', value: '#FCE4EC' },
        { name: '紫色', value: '#F3E5F5' },
        { name: '橙色', value: '#FFF3E0' },
    ],
    categories: [
        { code: '', name: '未分类' },
        { code: 'work', name: '工作' },
        { code: 'life', name: '生活' },
        { code: 'study', name: '学习' },
        { code: 'inspiration', name: '灵感' },
    ],

    render() {
        const params = Router.getParams();
        this.noteId = params.noteId;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header" style="background-color: #FFF9C4;" id="editorHeader">
                    <button class="header-back" id="backBtn">←</button>
                    <div class="header-title">${this.noteId ? '编辑便签' : '新建便签'}</div>
                    <button class="header-action" id="saveBtn">保存</button>
                </div>

                <div class="editor-container" id="editorContainer">
                    <div class="form-group">
                        <input type="text" class="form-control" id="titleInput" placeholder="输入标题..." style="font-size: 18px; font-weight: 500;">
                    </div>

                    <div class="form-group">
                        <textarea class="form-control" id="contentInput" placeholder="输入内容..." style="min-height: 300px; font-size: 15px; line-height: 1.8;"></textarea>
                    </div>

                    <div class="section-title">背景颜色</div>
                    <div class="color-picker" id="colorPicker">
                        ${this.colorOptions.map(color => `
                            <div class="color-option" data-color="${color.value}" style="background-color: ${color.value};" title="${color.name}"></div>
                        `).join('')}
                    </div>

                    <div class="section-title">分类</div>
                    <div class="category-picker" id="categoryPicker">
                        ${this.categories.map(cat => `
                            <div class="category-option" data-category="${cat.code}">${cat.name}</div>
                        `).join('')}
                    </div>

                    <div class="section-title">标签</div>
                    <div class="tags-container" id="tagsContainer">
                        <div class="tags-list" id="tagsList"></div>
                        <div class="tag-input-wrapper">
                            <input type="text" class="tag-input" id="tagInput" placeholder="添加标签...">
                            <button class="tag-add-btn" id="addTagBtn">添加</button>
                        </div>
                    </div>

                    <div class="options-group">
                        <div class="option-item">
                            <span>置顶</span>
                            <label class="switch">
                                <input type="checkbox" id="pinnedSwitch">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    ${this.noteId ? `
                        <div class="section-title">其他操作</div>
                        <div class="danger-actions">
                            <button class="btn btn-danger btn-block" id="deleteBtn">删除便签</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadNote();
    },

    bindEvents() {
        const backBtn = document.getElementById('backBtn');
        backBtn.addEventListener('click', () => {
            Router.back();
        });

        const saveBtn = document.getElementById('saveBtn');
        saveBtn.addEventListener('click', () => {
            this.saveNote();
        });

        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                const color = option.dataset.color;
                this.updateEditorColor(color);
            });
        });

        const categoryOptions = document.querySelectorAll('.category-option');
        categoryOptions.forEach(option => {
            option.addEventListener('click', () => {
                categoryOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            });
        });

        const addTagBtn = document.getElementById('addTagBtn');
        const tagInput = document.getElementById('tagInput');
        
        addTagBtn.addEventListener('click', () => {
            this.addTag();
        });

        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTag();
            }
        });

        if (this.noteId) {
            const deleteBtn = document.getElementById('deleteBtn');
            deleteBtn.addEventListener('click', () => {
                this.deleteNote();
            });
        }
    },

    updateEditorColor(color) {
        const header = document.getElementById('editorHeader');
        header.style.backgroundColor = color;
    },

    getSelectedColor() {
        const active = document.querySelector('.color-option.active');
        return active ? active.dataset.color : '#FFF9C4';
    },

    getSelectedCategory() {
        const active = document.querySelector('.category-option.active');
        return active ? active.dataset.category : '';
    },

    getCurrentTags() {
        const tagItems = document.querySelectorAll('.tag-item');
        const tags = [];
        tagItems.forEach(item => {
            tags.push(item.dataset.tag);
        });
        return tags;
    },

    addTag() {
        const tagInput = document.getElementById('tagInput');
        const tag = tagInput.value.trim();
        
        if (!tag) {
            Utils.showToast('请输入标签名称');
            return;
        }

        const currentTags = this.getCurrentTags();
        if (currentTags.includes(tag)) {
            Utils.showToast('标签已存在');
            return;
        }

        this.renderTagItem(tag);
        tagInput.value = '';
    },

    renderTagItem(tag) {
        const tagsList = document.getElementById('tagsList');
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';
        tagElement.dataset.tag = tag;
        tagElement.innerHTML = `
            <span>${Utils.escapeHtml(tag)}</span>
            <button class="tag-remove" data-tag="${tag}">×</button>
        `;
        tagsList.appendChild(tagElement);

        const removeBtn = tagElement.querySelector('.tag-remove');
        removeBtn.addEventListener('click', () => {
            tagElement.remove();
        });
    },

    async loadNote() {
        if (!this.noteId) {
            const firstColor = document.querySelector('.color-option');
            if (firstColor) firstColor.classList.add('active');
            
            const firstCategory = document.querySelector('.category-option');
            if (firstCategory) firstCategory.classList.add('active');
            
            return;
        }

        try {
            const result = await ApiService.get('/bq/note/detail/get', { note_id: this.noteId });
            
            if (result.code === 0) {
                this.note = result.data;
                
                const titleInput = document.getElementById('titleInput');
                const contentInput = document.getElementById('contentInput');
                const pinnedSwitch = document.getElementById('pinnedSwitch');

                titleInput.value = this.note.title || '';
                contentInput.value = this.note.content || '';
                pinnedSwitch.checked = this.note.is_pinned;

                if (this.note.color) {
                    const colorOption = document.querySelector(`.color-option[data-color="${this.note.color}"]`);
                    if (colorOption) {
                        colorOption.classList.add('active');
                        this.updateEditorColor(this.note.color);
                    }
                }

                if (this.note.category !== undefined) {
                    const categoryOption = document.querySelector(`.category-option[data-category="${this.note.category}"]`);
                    if (categoryOption) {
                        categoryOption.classList.add('active');
                    }
                }

                if (this.note.tags && this.note.tags.length > 0) {
                    this.note.tags.forEach(tag => {
                        this.renderTagItem(tag);
                    });
                }
            }
        } catch (error) {
            Utils.showToast('加载便签失败');
        }
    },

    async saveNote() {
        const titleInput = document.getElementById('titleInput');
        const contentInput = document.getElementById('contentInput');
        const pinnedSwitch = document.getElementById('pinnedSwitch');

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        Utils.showLoading();
        try {
            let result;
            
            const noteData = {
                title,
                content,
                color: this.getSelectedColor(),
                category: this.getSelectedCategory(),
                tags: this.getCurrentTags(),
                is_pinned: pinnedSwitch.checked,
                is_completed: false
            };

            if (this.noteId) {
                result = await ApiService.post(`/bq/note/update?note_id=${this.noteId}`, noteData);
            } else {
                result = await ApiService.post('/bq/note/create', noteData);
            }

            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('保存成功');
                Router.navigate('home');
            } else {
                Utils.showToast(result.msg || '保存失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('保存失败');
        }
    },

    async deleteNote() {
        if (!confirm('确定要删除这张便签吗？')) return;

        try {
            const result = await ApiService.post(`/bq/note/delete?note_id=${this.noteId}`);

            if (result.code === 0) {
                Utils.showToast('已移到回收站');
                Router.navigate('home');
            } else {
                Utils.showToast(result.msg || '删除失败');
            }
        } catch (error) {
            Utils.showToast('删除失败');
        }
    }
};

window.EditorPage = EditorPage;
