const DetailPage = {
    async render() {
        const params = Router.getParams();
        const id = params.id || Router.queryParams.id;
        if (!id) {
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <p class="page-subtitle">加载中...</p>
            </div>
        `;
        AppHeader.bindEvents();

        const res = await ApiService.getDrama(id);
        if (res.code !== 0 || !res.data) {
            app.innerHTML = `
                ${AppHeader.render()}
                <div class="empty-state">
                    <div class="emoji">🤔</div>
                    <div class="title">剧集不存在</div>
                    <div style="margin-top:16px"><button class="btn btn-primary" onclick="Router.navigate('home')" style="flex:none;padding:10px 20px">返回</button></div>
                </div>
            `;
            AppHeader.bindEvents();
            return;
        }

        const d = res.data;
        const total = d.total_episodes || 0;
        const watched = d.watched_episodes || 0;
        const progress = total > 0 ? Math.round(watched * 100 / total) : 0;

        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <div style="margin-bottom:16px">
                    <button class="btn btn-ghost" onclick="history.back()" style="flex:none;padding:6px 12px">← 返回</button>
                </div>
                <div class="detail-header">
                    <div class="detail-cover">${d.cover || '🎬'}</div>
                    <div class="detail-info">
                        <h1>${Utils.escapeHtml(d.name)}</h1>
                        <div class="detail-meta">
                            ${d.genre ? `<span class="genre-tag">${Utils.escapeHtml(d.genre)}</span>` : ''}
                            <span class="card-badge ${Utils.statusBadgeClass(d.status)}">${Utils.statusLabel(d.status)}</span>
                            ${d.seasons > 1 ? `<span>${d.seasons}季</span>` : ''}
                            ${total > 0 ? `<span>${total}集</span>` : ''}
                            ${d.episode_duration > 0 ? `<span>每集 ${d.episode_duration} 分钟</span>` : ''}
                            ${d.year > 0 ? `<span>${d.year}</span>` : ''}
                        </div>
                        <div style="margin-top:10px">
                            <span class="rating-stars" id="rating-display">${[1,2,3,4,5].map(i => `<span class="rating-star ${i <= (d.rating || 0) ? 'active' : ''}">★</span>`).join('')}</span>
                            <span style="color:var(--text-muted);margin-left:8px;font-size:14px">${d.rating > 0 ? d.rating + '.0' : '未评分'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-progress-section">
                    <div class="section-title">📊 观看进度</div>
                    <div class="progress-row">
                        <span style="font-size:14px;color:var(--text-secondary);width:60px">${watched}/${total}</span>
                        <div class="progress-slider" id="progress-slider">
                            <div class="progress-slider-fill" style="width:${progress}%"></div>
                        </div>
                        <span style="font-size:14px;color:var(--text-muted);width:40px;text-align:right">${progress}%</span>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-primary" id="btn-minus">− 1集</button>
                        <button class="btn btn-primary" id="btn-plus">+ 1集</button>
                        <button class="btn btn-secondary" id="btn-set">手动设置</button>
                    </div>
                </div>

                <div class="detail-progress-section">
                    <div class="section-title">🔄 状态切换</div>
                    <div class="btn-group">
                        <button class="btn ${d.status === 'want' ? 'btn-primary' : 'btn-ghost'}" data-status="want">想看</button>
                        <button class="btn ${d.status === 'watching' ? 'btn-primary' : 'btn-ghost'}" data-status="watching">正在追</button>
                        <button class="btn ${d.status === 'finished' ? 'btn-primary' : 'btn-ghost'}" data-status="finished">已看完</button>
                        <button class="btn ${d.status === 'dropped' ? 'btn-primary' : 'btn-ghost'}" data-status="dropped">弃剧</button>
                    </div>
                </div>

                <div class="detail-progress-section">
                    <div class="section-title">⭐ 评分与评价</div>
                    <div style="margin-bottom:14px">
                        <div style="margin-bottom:6px;color:var(--text-secondary);font-size:13px">我的评分</div>
                        <div class="rating-stars" id="rating-input"></div>
                    </div>
                    <div class="form-row">
                        <label>标签</label>
                        <input type="text" class="tags-input" id="input-tags" placeholder="多个标签用逗号分隔" value="${Utils.escapeHtml(d.tags || '')}">
                    </div>
                    <div class="form-row">
                        <label>短评</label>
                        <textarea class="review-input" id="input-review" placeholder="写点什么...">${Utils.escapeHtml(d.review || '')}</textarea>
                    </div>
                    <div class="form-row">
                        <label>二刷</label>
                        <label style="display:flex;align-items:center;gap:8px">
                            <input type="checkbox" id="input-rewatch" ${d.is_rewatch ? 'checked' : ''} style="width:auto">
                            <span style="color:var(--text-secondary)">标记为二刷</span>
                        </label>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-primary" id="btn-save-rating">保存评分</button>
                    </div>
                </div>

                <div class="detail-progress-section">
                    <div class="section-title">✏️ 基本信息</div>
                    <div class="form-row">
                        <label>剧名</label>
                        <input type="text" id="edit-name" value="${Utils.escapeHtml(d.name)}">
                    </div>
                    <div class="form-row">
                        <label>封面emoji</label>
                        <input type="text" id="edit-cover" value="${Utils.escapeHtml(d.cover || '')}" placeholder="例如 🌍" maxlength="4">
                    </div>
                    <div class="form-row">
                        <label>类型</label>
                        <input type="text" id="edit-genre" value="${Utils.escapeHtml(d.genre || '')}" placeholder="科幻 / 爱情 ...">
                    </div>
                    <div class="form-row">
                        <label>总集数</label>
                        <input type="number" id="edit-total" value="${total}" min="0">
                    </div>
                    <div class="form-row">
                        <label>每集时长(分钟)</label>
                        <input type="number" id="edit-duration" value="${d.episode_duration || 0}" min="0">
                    </div>
                    <div class="form-row">
                        <label>年份</label>
                        <input type="number" id="edit-year" value="${d.year || 0}" min="0">
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-secondary" id="btn-save-info">保存修改</button>
                        <button class="btn btn-danger" id="btn-delete">删除剧集</button>
                    </div>
                </div>

                <div class="detail-progress-section">
                    <div class="section-title">🎁 分享</div>
                    <div class="btn-group">
                        <button class="btn btn-ghost" id="btn-share-card">生成安利卡片</button>
                    </div>
                </div>
            </div>
        `;

        AppHeader.bindEvents();

        let currentRating = d.rating || 0;
        Utils.renderStars(document.getElementById('rating-input'), currentRating, (v) => {
            currentRating = v;
        });

        document.getElementById('btn-plus').addEventListener('click', async () => {
            const r = await ApiService.episodePlus(d.id, 1);
            if (r.code === 0) { Utils.toast('+1 集 🎬', 'success'); this.render(); }
            else Utils.toast(r.message, 'error');
        });
        document.getElementById('btn-minus').addEventListener('click', async () => {
            const r = await ApiService.episodePlus(d.id, -1);
            if (r.code === 0) { Utils.toast('-1 集', 'success'); this.render(); }
            else Utils.toast(r.message, 'error');
        });
        document.getElementById('btn-set').addEventListener('click', () => {
            const html = `
                <div class="form-row"><label>已看集数</label>
                <input type="number" id="manual-watched" value="${watched}" min="0" max="${total || 9999}"></div>
                <div class="btn-group"><button class="btn btn-primary" id="confirm-set">确认</button></div>
            `;
            const m = Utils.showModal(html, { title: '设置进度' });
            m.body.querySelector('#confirm-set').addEventListener('click', async () => {
                const v = parseInt(m.body.querySelector('#manual-watched').value) || 0;
                const r = await ApiService.setProgress(d.id, v);
                if (r.code === 0) { Utils.toast('进度已更新', 'success'); Utils.closeModal(); this.render(); }
                else Utils.toast(r.message, 'error');
            });
        });

        document.querySelectorAll('[data-status]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const r = await ApiService.changeStatus(d.id, btn.dataset.status);
                if (r.code === 0) { Utils.toast('状态已更新', 'success'); this.render(); }
                else Utils.toast(r.message, 'error');
            });
        });

        document.getElementById('btn-save-rating').addEventListener('click', async () => {
            const tags = document.getElementById('input-tags').value;
            const review = document.getElementById('input-review').value;
            const is_rewatch = document.getElementById('input-rewatch').checked ? 1 : 0;
            const r = await ApiService.setRating(d.id, currentRating, review, tags, is_rewatch);
            if (r.code === 0) { Utils.toast('已保存 ⭐', 'success'); this.render(); }
            else Utils.toast(r.message, 'error');
        });

        document.getElementById('btn-save-info').addEventListener('click', async () => {
            const data = {
                id: d.id,
                name: document.getElementById('edit-name').value,
                cover: document.getElementById('edit-cover').value,
                genre: document.getElementById('edit-genre').value,
                total_episodes: parseInt(document.getElementById('edit-total').value) || 0,
                episode_duration: parseInt(document.getElementById('edit-duration').value) || 0,
                year: parseInt(document.getElementById('edit-year').value) || 0
            };
            const r = await ApiService.updateDrama(data);
            if (r.code === 0) { Utils.toast('已保存', 'success'); this.render(); }
            else Utils.toast(r.message, 'error');
        });

        document.getElementById('btn-delete').addEventListener('click', () => {
            const m = Utils.showModal(`
                <p style="color:var(--text-secondary);margin-bottom:16px">确定要删除「${Utils.escapeHtml(d.name)}」吗？此操作不可撤销。</p>
                <div class="btn-group">
                    <button class="btn btn-ghost" id="cancel-del">取消</button>
                    <button class="btn btn-danger" id="confirm-del">删除</button>
                </div>
            `, { title: '删除剧集' });
            m.body.querySelector('#cancel-del').addEventListener('click', Utils.closeModal);
            m.body.querySelector('#confirm-del').addEventListener('click', async () => {
                const r = await ApiService.deleteDrama(d.id);
                if (r.code === 0) { Utils.toast('已删除', 'success'); Utils.closeModal(); Router.navigate('home'); }
                else Utils.toast(r.message, 'error');
            });
        });

        document.getElementById('btn-share-card').addEventListener('click', () => {
            const stars = '★'.repeat(d.rating || 0) + '☆'.repeat(5 - (d.rating || 0));
            const card = `
                <div class="share-card" id="share-card">
                    <div class="emoji-big">${d.cover || '🎬'}</div>
                    <div class="big-title">${Utils.escapeHtml(d.name)}</div>
                    <div class="sub">${Utils.escapeHtml(d.genre || '')} · ${d.seasons > 1 ? d.seasons + '季 · ' : ''}${total}集</div>
                    <div style="text-align:center;color:#fbbf24;font-size:18px;margin-bottom:12px">${stars}</div>
                    <div class="stat-row">
                        <div><div class="v">${watched}/${total}</div><div class="l">观看进度</div></div>
                        <div><div class="v">${progress}%</div><div class="l">完成度</div></div>
                        <div><div class="v">${d.episode_duration > 0 ? watched * d.episode_duration : '-'}<span style="font-size:12px">min</span></div><div class="l">观看时长</div></div>
                    </div>
                    ${d.review ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);color:var(--text-secondary);font-size:13px;font-style:italic">"${Utils.escapeHtml(d.review)}"</div>` : ''}
                    <div style="margin-top:18px;text-align:center;color:var(--accent);font-weight:600">— 来自我的追剧清单 —</div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-ghost" id="copy-share">复制文本</button>
                </div>
            `;
            const m = Utils.showModal(card, { title: '🎁 安利卡片' });
            m.body.querySelector('#copy-share').addEventListener('click', () => {
                const text = `【安利】${d.name}\n${d.genre || ''} ${d.seasons > 1 ? d.seasons + '季' : ''} ${total}集\n评分: ${stars} ${d.rating || 0}.0\n进度: ${watched}/${total} (${progress}%)\n${d.review ? '短评: ' + d.review + '\n' : ''}—— 来自追剧清单`;
                navigator.clipboard.writeText(text).then(() => Utils.toast('已复制到剪贴板 📋', 'success'));
            });
        });
    }
};

window.DetailPage = DetailPage;
