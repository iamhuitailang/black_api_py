const MyBooksPage = {
    books: [],
    currentTab: 'all',
    tabs: [
        { value: 'all', label: '全部' },
        { value: '1', label: '在售中' },
        { value: '0', label: '已下架' }
    ],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" onclick="Router.navigate('profile')">‹</div>
                    <div class="header-title">我发布的教材</div>
                </div>
                
                <div class="home-tabs">
                    ${this.tabs.map(tab => `
                        <div class="home-tab ${this.currentTab === tab.value ? 'active' : ''}" data-tab="${tab.value}">
                            ${tab.label}
                        </div>
                    `).join('')}
                </div>
                
                <div class="book-list" id="bookList">
                    <div class="text-center text-secondary" style="padding:40px;">加载中...</div>
                </div>
                
                <div class="fab" id="publishBtn">+</div>
                
                <div class="tabbar">
                    <div class="tabbar-item" data-page="home">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" data-page="orders">
                        <div class="tabbar-icon">📋</div>
                        <div class="tabbar-text">订单</div>
                    </div>
                    <div class="tabbar-item" data-page="favorites">
                        <div class="tabbar-icon">❤️</div>
                        <div class="tabbar-text">收藏</div>
                    </div>
                    <div class="tabbar-item active" data-page="profile">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
        await this.loadBooks();
    },

    bindEvents() {
        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                Router.navigate(page);
            });
        });

        document.querySelectorAll('.home-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                document.querySelectorAll('.home-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadBooks();
            });
        });

        document.getElementById('publishBtn').addEventListener('click', () => {
            Router.navigate('publish');
        });
    },

    async loadBooks() {
        try {
            const params = { page: 1, page_size: 50 };
            if (this.currentTab !== 'all') {
                params.status = parseInt(this.currentTab);
            }

            const result = await ApiService.book.getMyList(params);
            if (result.code === 0) {
                this.books = result.data.items;
                this.renderBooks();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (e) {
            Toast.error('加载失败');
        }
    },

    renderBooks() {
        const container = document.getElementById('bookList');
        
        if (this.books.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <div class="empty-state-text">暂无教材</div>
                    <button class="btn btn-primary" style="margin-top:20px;" onclick="Router.navigate('publish')">去发布</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.books.map(book => `
            <div class="book-item" data-book-id="${book.id}">
                <div class="book-image">📖</div>
                <div class="book-info">
                    <div class="book-title">${Utils.escapeHtml(book.title)}</div>
                    <div class="book-meta">
                        <span class="book-price">¥${Utils.formatPrice(book.price)}</span>
                        <span class="book-status ${book.status === 1 ? 'status-online' : 'status-offline'}">${book.status === 1 ? '在售中' : '已下架'}</span>
                    </div>
                    <div class="book-actions">
                        ${book.status === 1 ? 
                            `<button class="btn btn-outline btn-sm" data-action="offline" data-id="${book.id}">下架</button>` : 
                            `<button class="btn btn-primary btn-sm" data-action="online" data-id="${book.id}">上架</button>`
                        }
                        <button class="btn btn-outline btn-sm" data-action="edit" data-id="${book.id}">编辑</button>
                        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${book.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.bindBookEvents();
    },

    bindBookEvents() {
        const container = document.getElementById('bookList');

        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const bookId = btn.dataset.id;
                Router.navigate('publish', { bookId });
            });
        });

        container.querySelectorAll('[data-action="offline"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleOffline(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="online"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleOnline(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleDelete(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('.book-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    const bookId = item.dataset.bookId;
                    Router.navigate('bookDetail', { id: bookId });
                }
            });
        });
    },

    async handleOffline(bookId) {
        Utils.showLoading();
        try {
            const result = await ApiService.book.offline(bookId);
            if (result.code === 0) {
                Toast.success('已下架');
                this.loadBooks();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (e) {
            Toast.error('操作失败');
        } finally {
            Utils.hideLoading();
        }
    },

    async handleOnline(bookId) {
        Utils.showLoading();
        try {
            const result = await ApiService.book.online(bookId);
            if (result.code === 0) {
                Toast.success('已上架');
                this.loadBooks();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (e) {
            Toast.error('操作失败');
        } finally {
            Utils.hideLoading();
        }
    },

    async handleDelete(bookId) {
        if (!confirm('确定要删除这个教材吗？')) {
            return;
        }
        Utils.showLoading();
        try {
            const result = await ApiService.book.delete(bookId);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.loadBooks();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (e) {
            Toast.error('删除失败');
        } finally {
            Utils.hideLoading();
        }
    }
};

window.MyBooksPage = MyBooksPage;
