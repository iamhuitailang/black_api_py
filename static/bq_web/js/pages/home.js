const HomePage = {
    currentCategory: '',
    currentKeyword: '',
    currentTags: [],
    notes: [],
    page: 1,
    pageSize: 20,
    hasMore: true,

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">📝 便利贴</div>
                    <button class="header-action" id="searchBtn">🔍</button>
                </div>

                <div class="search-bar hidden" id="searchBar">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" id="searchInput" placeholder="搜索便签...">
                    </div>
                    <button class="search-btn" id="cancelSearch">取消</button>
                </div>

                <div class="category-tabs" id="categoryTabs">
                    <div class="category-tab active" data-category="">全部</div>
                    <div class="category-tab" data-category="work">工作</div>
                    <div class="category-tab" data-category="life">生活</div>
                    <div class="category-tab" data-category="study">学习</div>
                    <div class="category-tab" data-category="inspiration">灵感</div>
                </div>

                <div class="filter-bar" id="filterBar" style="display: none;">
                    <div class="filter-tag active" id="filterAll">全部</div>
                    <div class="filter-tag" id="filterPinned">📌 置顶</div>
                </div>

                <div class="notes-container" id="notesContainer">
                    <div class="empty-state" id="emptyState">
                        <div class="empty-state-icon">📝</div>
                        <div class="empty-state-text">暂无便签，点击右下角按钮创建</div>
                    </div>
                </div>

                <div class="fab" id="fabBtn">
                    <span style="font-size: 28px;">+</span>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item active" data-route="home">
                        <span class="tabbar-icon">📝</span>
                        <span class="tabbar-text">便签</span>
                    </div>
                    <div class="tabbar-item" data-route="trash">
                        <span class="tabbar-icon">🗑️</span>
                        <span class="tabbar-text">回收站</span>
                    </div>
                    <div class="tabbar-item" data-route="settings">
                        <span class="tabbar-icon">⚙️</span>
                        <span class="tabbar-text">设置</span>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadNotes();
    },

    bindEvents() {
        const fabBtn = document.getElementById('fabBtn');
        fabBtn.addEventListener('click', () => {
            Router.navigate('editor', { noteId: null });
        });

        const searchBtn = document.getElementById('searchBtn');
        const searchBar = document.getElementById('searchBar');
        const searchInput = document.getElementById('searchInput');
        const cancelSearch = document.getElementById('cancelSearch');

        searchBtn.addEventListener('click', () => {
            searchBar.classList.remove('hidden');
            searchInput.focus();
        });

        cancelSearch.addEventListener('click', () => {
            searchBar.classList.add('hidden');
            searchInput.value = '';
            this.currentKeyword = '';
            this.loadNotes();
        });

        searchInput.addEventListener('input', Utils.debounce(() => {
            this.currentKeyword = searchInput.value.trim();
            this.page = 1;
            this.loadNotes();
        }, 300));

        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategory = tab.dataset.category;
                this.page = 1;
                this.loadNotes();
            });
        });

        const filterAll = document.getElementById('filterAll');
        const filterPinned = document.getElementById('filterPinned');

        filterAll.addEventListener('click', () => {
            filterAll.classList.add('active');
            filterPinned.classList.remove('active');
            this.currentTags = [];
            this.page = 1;
            this.loadNotes();
        });

        filterPinned.addEventListener('click', () => {
            filterPinned.classList.add('active');
            filterAll.classList.remove('active');
            this.page = 1;
            this.loadNotes(true);
        });

        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route !== Router.getCurrentRoute()) {
                    Router.navigate(route);
                }
            });
        });
    },

    async loadNotes(isPinned = null) {
        const notesContainer = document.getElementById('notesContainer');
        const emptyState = document.getElementById('emptyState');

        try {
            const params = {
                page: this.page,
                page_size: this.pageSize,
                status: 'normal'
            };

            if (this.currentCategory) {
                params.category = this.currentCategory;
            }

            if (isPinned !== null) {
                params.is_pinned = isPinned;
            }

            if (this.currentKeyword) {
                params.keyword = this.currentKeyword;
            }

            const result = await ApiService.get('/bq/note/list/get', params);

            if (result.code === 0) {
                this.notes = result.data.items;
                this.hasMore = this.page < result.data.total_pages;

                if (this.notes.length === 0) {
                    emptyState.classList.remove('hidden');
                    notesContainer.innerHTML = '';
                    notesContainer.appendChild(emptyState);
                } else {
                    emptyState.classList.add('hidden');
                    this.renderNotes();
                }
            }
        } catch (error) {
            console.error('加载便签失败:', error);
        }
    },

    renderNotes() {
        const notesContainer = document.getElementById('notesContainer');
        
        const notesHtml = this.notes.map(note => this.renderNoteCard(note)).join('');
        
        notesContainer.innerHTML = `
            <div class="notes-grid">
                ${notesHtml}
            </div>
        `;

        this.bindNoteEvents();
    },

    renderNoteCard(note) {
        const color = note.color || '#FFF9C4';
        const title = note.title || '无标题';
        const content = note.content || '';
        const timeText = Utils.formatDate(note.updated_at);
        const tagsHtml = note.tags && note.tags.length > 0 
            ? note.tags.slice(0, 2).map(tag => `<span class="note-tag">${Utils.escapeHtml(tag)}</span>`).join('')
            : '';

        return `
            <div class="note-card" data-id="${note.id}" style="background-color: ${color};">
                <div class="note-header">
                    <h3 class="note-title">${Utils.escapeHtml(title)}</h3>
                    ${note.is_pinned ? '<span class="note-pin">📌</span>' : ''}
                </div>
                <div class="note-content">${this.truncateContent(content)}</div>
                <div class="note-tags">${tagsHtml}</div>
                <div class="note-footer">
                    <span class="note-time">${timeText}</span>
                    <div class="note-actions">
                        <button class="note-action" data-action="pin" data-id="${note.id}">
                            ${note.is_pinned ? '取消置顶' : '置顶'}
                        </button>
                        <button class="note-action" data-action="delete" data-id="${note.id}">删除</button>
                    </div>
                </div>
            </div>
        `;
    },

    truncateContent(content, maxLength = 100) {
        if (!content) return '';
        const plainText = content.replace(/<[^>]*>/g, '');
        if (plainText.length <= maxLength) return Utils.escapeHtml(plainText);
        return Utils.escapeHtml(plainText.substring(0, maxLength)) + '...';
    },

    bindNoteEvents() {
        const noteCards = document.querySelectorAll('.note-card');
        noteCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.note-action')) return;
                const noteId = parseInt(card.dataset.id);
                Router.navigate('editor', { noteId });
            });
        });

        const noteActions = document.querySelectorAll('.note-action');
        noteActions.forEach(action => {
            action.addEventListener('click', async (e) => {
                e.stopPropagation();
                const noteId = parseInt(action.dataset.id);
                const actionType = action.dataset.action;

                if (actionType === 'pin') {
                    await this.togglePin(noteId);
                } else if (actionType === 'delete') {
                    await this.deleteNote(noteId);
                }
            });
        });
    },

    async togglePin(noteId) {
        try {
            const note = this.notes.find(n => n.id === noteId);
            if (!note) return;

            const result = await ApiService.post(`/bq/note/pin?note_id=${noteId}`, {
                is_pinned: !note.is_pinned
            });

            if (result.code === 0) {
                Utils.showToast(note.is_pinned ? '已取消置顶' : '已置顶');
                this.loadNotes();
            } else {
                Utils.showToast(result.msg || '操作失败');
            }
        } catch (error) {
            Utils.showToast('操作失败');
        }
    },

    async deleteNote(noteId) {
        if (!confirm('确定要删除这张便签吗？')) return;

        try {
            const result = await ApiService.post(`/bq/note/delete?note_id=${noteId}`);

            if (result.code === 0) {
                Utils.showToast('已移到回收站');
                this.notes = this.notes.filter(n => n.id !== noteId);
                this.renderNotes();
            } else {
                Utils.showToast(result.msg || '删除失败');
            }
        } catch (error) {
            Utils.showToast('删除失败');
        }
    }
};

window.HomePage = HomePage;
