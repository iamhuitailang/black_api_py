const TrashPage = {
    notes: [],
    page: 1,
    pageSize: 50,

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">🗑️ 回收站</div>
                    <button class="header-action" id="emptyBtn">清空</button>
                </div>

                <div class="trash-actions" id="trashActions" style="display: none;">
                    <button class="btn btn-outline btn-sm" id="restoreAllBtn">全部恢复</button>
                    <button class="btn btn-danger btn-sm" id="emptyTrashBtn">清空回收站</button>
                </div>

                <div class="notes-container" id="trashContainer">
                    <div class="empty-state" id="emptyState">
                        <div class="empty-state-icon">🗑️</div>
                        <div class="empty-state-text">回收站为空</div>
                    </div>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item" data-route="home">
                        <span class="tabbar-icon">📝</span>
                        <span class="tabbar-text">便签</span>
                    </div>
                    <div class="tabbar-item active" data-route="trash">
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
        const tabbarItems = document.querySelectorAll('.tabbar-item');
        tabbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route !== Router.getCurrentRoute()) {
                    Router.navigate(route);
                }
            });
        });

        const restoreAllBtn = document.getElementById('restoreAllBtn');
        restoreAllBtn.addEventListener('click', () => {
            this.restoreAll();
        });

        const emptyTrashBtn = document.getElementById('emptyTrashBtn');
        emptyTrashBtn.addEventListener('click', () => {
            this.emptyTrash();
        });

        const emptyBtn = document.getElementById('emptyBtn');
        emptyBtn.addEventListener('click', () => {
            this.emptyTrash();
        });
    },

    async loadNotes() {
        const trashContainer = document.getElementById('trashContainer');
        const emptyState = document.getElementById('emptyState');
        const trashActions = document.getElementById('trashActions');

        try {
            const result = await ApiService.get('/bq/note/list/get', {
                page: this.page,
                page_size: this.pageSize,
                status: 'deleted'
            });

            if (result.code === 0) {
                this.notes = result.data.items;

                if (this.notes.length === 0) {
                    emptyState.classList.remove('hidden');
                    trashActions.style.display = 'none';
                    trashContainer.innerHTML = '';
                    trashContainer.appendChild(emptyState);
                } else {
                    emptyState.classList.add('hidden');
                    trashActions.style.display = 'flex';
                    this.renderNotes();
                }
            }
        } catch (error) {
            console.error('加载回收站失败:', error);
        }
    },

    renderNotes() {
        const trashContainer = document.getElementById('trashContainer');
        
        const notesHtml = this.notes.map(note => this.renderNoteCard(note)).join('');
        
        trashContainer.innerHTML = `
            <div class="trash-list">
                ${notesHtml}
            </div>
        `;

        this.bindNoteEvents();
    },

    renderNoteCard(note) {
        const color = note.color || '#FFF9C4';
        const title = note.title || '无标题';
        const timeText = Utils.formatDate(note.updated_at);

        return `
            <div class="trash-item" data-id="${note.id}">
                <div class="trash-item-content" style="background-color: ${color};">
                    <h3 class="trash-item-title">${Utils.escapeHtml(title)}</h3>
                    <p class="trash-item-time">${timeText}</p>
                </div>
                <div class="trash-item-actions">
                    <button class="note-action" data-action="restore" data-id="${note.id}">恢复</button>
                    <button class="note-action danger" data-action="delete" data-id="${note.id}">删除</button>
                </div>
            </div>
        `;
    },

    bindNoteEvents() {
        const noteActions = document.querySelectorAll('.note-action');
        noteActions.forEach(action => {
            action.addEventListener('click', async (e) => {
                const noteId = parseInt(action.dataset.id);
                const actionType = action.dataset.action;

                if (actionType === 'restore') {
                    await this.restoreNote(noteId);
                } else if (actionType === 'delete') {
                    await this.deleteNote(noteId);
                }
            });
        });
    },

    async restoreNote(noteId) {
        try {
            const result = await ApiService.post(`/bq/note/restore?note_id=${noteId}`);

            if (result.code === 0) {
                Utils.showToast('恢复成功');
                this.notes = this.notes.filter(n => n.id !== noteId);
                this.loadNotes();
            } else {
                Utils.showToast(result.msg || '恢复失败');
            }
        } catch (error) {
            Utils.showToast('恢复失败');
        }
    },

    async deleteNote(noteId) {
        if (!confirm('确定要永久删除这张便签吗？此操作不可恢复！')) return;

        try {
            const result = await ApiService.post(`/bq/note/delete/permanent?note_id=${noteId}`);

            if (result.code === 0) {
                Utils.showToast('已永久删除');
                this.notes = this.notes.filter(n => n.id !== noteId);
                this.loadNotes();
            } else {
                Utils.showToast(result.msg || '删除失败');
            }
        } catch (error) {
            Utils.showToast('删除失败');
        }
    },

    async restoreAll() {
        if (this.notes.length === 0) {
            Utils.showToast('回收站为空');
            return;
        }

        if (!confirm('确定要恢复所有便签吗？')) return;

        try {
            const result = await ApiService.post('/bq/note/trash/restore/all');

            if (result.code === 0) {
                Utils.showToast('恢复成功');
                this.notes = [];
                this.loadNotes();
            } else {
                Utils.showToast(result.msg || '恢复失败');
            }
        } catch (error) {
            Utils.showToast('恢复失败');
        }
    },

    async emptyTrash() {
        if (this.notes.length === 0) {
            Utils.showToast('回收站为空');
            return;
        }

        if (!confirm('确定要清空回收站吗？所有便签将被永久删除！')) return;

        try {
            const result = await ApiService.post('/bq/note/trash/empty');

            if (result.code === 0) {
                Utils.showToast('回收站已清空');
                this.notes = [];
                this.loadNotes();
            } else {
                Utils.showToast(result.msg || '操作失败');
            }
        } catch (error) {
            Utils.showToast('操作失败');
        }
    }
};

window.TrashPage = TrashPage;
