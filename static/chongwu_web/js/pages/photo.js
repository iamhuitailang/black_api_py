const PhotoPage = {
    petId: null,
    records: [],

    render() {
        this.petId = Storage.getCurrentPetId();
        if (!this.petId) {
            this.renderNoPet();
            return;
        }

        this.loadRecords();
    },

    renderNoPet() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header">
                <div class="header">
                    <div class="header-title"><span class="paw-icon">📷</span>宠物萌照</div>
                </div>
                <div class="empty-state">
                    <div class="empty-icon">🐾</div>
                    <div class="empty-text">请先选择一只宠物</div>
                    <div class="empty-hint">回到首页点击宠物卡片查看萌照</div>
                    <button class="btn btn-primary" id="go-home-btn" style="margin-top:12px;">去首页</button>
                </div>
                <div class="tabbar">
                    <div class="tabbar-item" data-page="home">
                        <div class="tab-icon">🏠</div>
                        <div class="tab-label">首页</div>
                    </div>
                    <div class="tabbar-item active">
                        <div class="tab-icon">📷</div>
                        <div class="tab-label">萌照</div>
                    </div>
                    <div class="tabbar-item" data-page="reminders">
                        <div class="tab-icon">⏰</div>
                        <div class="tab-label">提醒</div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('go-home-btn').addEventListener('click', () => Router.navigate('home'));
        document.querySelectorAll('.tabbar-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === Router.getCurrentRoute()) return;
                Router.navigate(page);
            });
        });
    },

    async loadRecords() {
        this.showLoading();

        try {
            const result = await ChongwuApi.getPhotoList({ pet_id: this.petId, page: 1, page_size: 50 });
            if (result.code === 0) {
                this.records = result.data.items || [];
                this.renderPage();
            } else {
                this.renderPage();
            }
        } catch (e) {
            console.error(e);
            this.renderPage();
        }
    },

    showLoading() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">📷</span>宠物萌照</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>
                <div class="loading"><div class="spinner"></div><span>加载中...</span></div>
                <div class="tabbar">
                    <div class="tabbar-item" data-page="home">
                        <div class="tab-icon">🏠</div>
                        <div class="tab-label">首页</div>
                    </div>
                    <div class="tabbar-item active">
                        <div class="tab-icon">📷</div>
                        <div class="tab-label">萌照</div>
                    </div>
                    <div class="tabbar-item" data-page="reminders">
                        <div class="tab-icon">⏰</div>
                        <div class="tab-label">提醒</div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());
        document.querySelectorAll('.tabbar-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === Router.getCurrentRoute()) return;
                Router.navigate(page);
            });
        });
    },

    renderPage() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title"><span class="paw-icon">📷</span>宠物萌照</div>
                    <div class="header-action" id="add-btn">+</div>
                </div>

                ${this.records.length > 0 ? `
                    <div class="photo-grid">
                        ${this.records.map(p => this.renderPhoto(p)).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-icon">📷</div>
                        <div class="empty-text">还没有照片</div>
                        <div class="empty-hint">上传宠物的可爱瞬间吧~</div>
                    </div>
                `}

                <div class="tabbar">
                    <div class="tabbar-item ${Router.getCurrentRoute() === 'home' ? 'active' : ''}" data-page="home">
                        <div class="tab-icon">🏠</div>
                        <div class="tab-label">首页</div>
                    </div>
                    <div class="tabbar-item active">
                        <div class="tab-icon">📷</div>
                        <div class="tab-label">萌照</div>
                    </div>
                    <div class="tabbar-item ${Router.getCurrentRoute() === 'reminders' ? 'active' : ''}" data-page="reminders">
                        <div class="tab-icon">⏰</div>
                        <div class="tab-label">提醒</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('add-btn').addEventListener('click', () => this.showForm());

        document.querySelectorAll('.tabbar-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === Router.getCurrentRoute()) return;
                Router.navigate(page);
            });
        });

        this.records.forEach(p => {
            const photoEl = document.getElementById(`photo-${p.id}`);
            if (photoEl) {
                photoEl.addEventListener('click', (e) => {
                    if (e.target.closest('.photo-action-btn')) return;
                    this.viewPhoto(p);
                });
            }
        });

        document.querySelectorAll('.photo-action-btn.share').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const photoId = parseInt(btn.dataset.photoId);
                const photo = this.records.find(r => r.id === photoId);
                if (photo) this.sharePhoto(photo.photo_url, photo.description || '');
            });
        });

        document.querySelectorAll('.photo-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const photoId = parseInt(btn.dataset.photoId);
                this.deleteRecord(photoId);
            });
        });
    },

    renderPhoto(p) {
        return `
            <div class="photo-item" id="photo-${p.id}" style="position: relative;">
                <img src="${p.photo_url}" alt="photo">
                ${p.description ? `<div class="photo-desc">${p.description}</div>` : ''}
                <div class="photo-actions-overlay">
                    <div class="photo-action-btn share" data-photo-id="${p.id}">📤</div>
                    <div class="photo-action-btn delete" data-photo-id="${p.id}">🗑️</div>
                </div>
            </div>
        `;
    },

    viewPhoto(p) {
        const modal = document.createElement('div');
        modal.className = 'modal-mask';
        modal.innerHTML = `
            <div class="modal-content" style="text-align:center">
                <div class="modal-header">
                    <div class="modal-title">照片预览</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>
                <img src="${p.photo_url}" style="max-width:100%; border-radius:var(--radius-md); margin-bottom:12px">
                ${p.description ? `<p style="color:var(--text-secondary); margin-bottom:12px">${p.description}</p>` : ''}
                <div style="display:flex; gap:12px;">
                    <button class="btn btn-secondary btn-block" onclick="PhotoPage.editPhoto(${p.id}, '${p.description || ''}', this)">编辑描述</button>
                    <button class="btn btn-primary btn-block" onclick="PhotoPage.sharePhoto('${p.photo_url}', '${p.description || ''}')">📤 分享</button>
                </div>
            </div>
        `;
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    },

    async editPhoto(id, desc, btn) {
        const newDesc = prompt('编辑照片描述', desc);
        if (newDesc !== null && newDesc !== desc) {
            try {
                const result = await ChongwuApi.updatePhoto(id, { description: newDesc });
                if (result.code === 0) {
                    Toast.success('更新成功');
                    btn.closest('.modal-mask').remove();
                    this.loadRecords();
                } else {
                    Toast.error(result.msg || '更新失败');
                }
            } catch (e) {
                Toast.error('更新失败');
            }
        }
    },

    sharePhoto(url, desc) {
        const modal = document.createElement('div');
        modal.className = 'modal-mask';
        modal.innerHTML = `
            <div class="modal-content" style="text-align:center">
                <div class="modal-header">
                    <div class="modal-title">📤 分享萌照</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>
                <div class="share-card">
                    <img src="${url}" style="max-width:100%; max-height:300px; border-radius:var(--radius-md); margin-bottom:12px; object-fit:contain;">
                    ${desc ? `<p style="color:var(--text-secondary); margin-bottom:12px; font-size:14px;">${desc}</p>` : ''}
                    <div class="share-card-footer" style="font-size:12px; color:var(--text-light);">🐾 来自我的宠物档案</div>
                </div>
                <div style="display:flex; gap:12px; margin-top:16px;">
                    <button class="btn btn-secondary btn-block" id="copy-photo-text">复制文字</button>
                    <button class="btn btn-primary btn-block" id="copy-photo-image">复制图片</button>
                </div>
            </div>
        `;
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        const shareText = desc ? `🐾 宠物萌照：${desc}\n${url}` : `🐾 宠物萌照\n${url}`;

        modal.querySelector('#copy-photo-text').addEventListener('click', () => {
            navigator.clipboard.writeText(shareText).then(() => {
                Toast.success('已复制分享文字');
            }).catch(() => {
                Toast.error('复制失败');
            });
        });

        modal.querySelector('#copy-photo-image').addEventListener('click', async () => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                if (navigator.clipboard && window.ClipboardItem) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    Toast.success('已复制图片');
                } else {
                    navigator.clipboard.writeText(url).then(() => {
                        Toast.success('已复制图片链接');
                    });
                }
            } catch (e) {
                navigator.clipboard.writeText(url).then(() => {
                    Toast.success('已复制图片链接');
                }).catch(() => {
                    Toast.error('复制失败');
                });
            }
        });
    },

    showForm() {
        const modal = document.createElement('div');
        modal.className = 'modal-mask';
        let photoDataUrl = '';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">上传照片</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>

                <div class="image-upload-area" id="upload-area">
                    <div class="upload-icon">📷</div>
                    <div class="upload-text">点击选择照片</div>
                </div>
                <div id="preview-container" style="display:none; margin-bottom:16px;"></div>
                <input type="file" id="photo-input" accept="image/*" style="display:none">

                <div class="form-group">
                    <label class="form-label">描述</label>
                    <input type="text" class="form-input" id="photo-desc" placeholder="如：这是小团在公园的照片">
                </div>

                <button class="btn btn-primary btn-block" id="save-photo-btn">保存</button>
            </div>
        `;

        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        modal.querySelector('#upload-area').addEventListener('click', () => {
            modal.querySelector('#photo-input').click();
        });

        modal.querySelector('#photo-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    photoDataUrl = ev.target.result;
                    const preview = modal.querySelector('#preview-container');
                    preview.style.display = 'block';
                    preview.innerHTML = `
                        <div class="image-preview">
                            <img src="${photoDataUrl}" alt="preview">
                            <div class="remove-btn" onclick="document.getElementById('photo-input').value=''; document.getElementById('preview-container').style.display='none';">×</div>
                        </div>
                    `;
                    modal.querySelector('#upload-area').style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });

        modal.querySelector('#save-photo-btn').addEventListener('click', async () => {
            const desc = modal.querySelector('#photo-desc').value.trim();

            if (!photoDataUrl) {
                Toast.error('请选择照片');
                return;
            }

            try {
                const result = await ChongwuApi.createPhoto(this.petId, {
                    photo_url: photoDataUrl,
                    description: desc
                });

                if (result.code === 0) {
                    Toast.success('上传成功');
                    modal.remove();
                    this.loadRecords();
                } else {
                    Toast.error(result.msg || '上传失败');
                }
            } catch (e) {
                console.error(e);
                Toast.error('上传失败');
            }
        });
    },

    async deleteRecord(id) {
        if (!confirm('确定要删除这张照片吗？')) return;

        try {
            const result = await ChongwuApi.deletePhoto(id);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.loadRecords();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (e) {
            Toast.error('删除失败');
        }
    }
};