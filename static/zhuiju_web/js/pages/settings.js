const SettingsPage = {
    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <h1 class="page-title">⚙️ 设置</h1>
                <p class="page-subtitle">管理你的追剧数据</p>

                <div class="detail-progress-section">
                    <div class="section-title">💾 数据管理</div>
                    <div class="btn-group">
                        <button class="btn btn-secondary" id="btn-export">导出数据(备份)</button>
                        <button class="btn btn-secondary" id="btn-import">从文件导入</button>
                        <input type="file" id="file-input" accept=".json" style="display:none">
                    </div>
                    <div style="margin-top:16px;color:var(--text-muted);font-size:12px">
                        导出为 JSON 格式，可用 Excel 打开查看，或在其他设备恢复
                    </div>
                </div>

                <div class="detail-progress-section">
                    <div class="section-title">🔔 提醒</div>
                    <div id="reminder-content">
                        <p style="color:var(--text-muted)">加载中...</p>
                    </div>
                </div>

                <div class="detail-progress-section">
                    <div class="section-title">⚠️ 危险操作</div>
                    <div class="btn-group">
                        <button class="btn btn-ghost" id="btn-reset">恢复默认20部</button>
                        <button class="btn btn-danger" id="btn-clear">一键清空所有</button>
                    </div>
                </div>

                <div class="detail-progress-section">
                    <div class="section-title">ℹ️ 关于</div>
                    <div style="color:var(--text-secondary);font-size:13px;line-height:1.8">
                        <div>📺 追剧清单 · 私人剧库</div>
                        <div>记录想看的剧、正在追的剧、已看完的剧</div>
                        <div>用数据记录你看过的每一个故事</div>
                    </div>
                </div>
            </div>
            ${BottomNav.render('settings')}
        `;

        AppHeader.bindEvents();
        BottomNav.bindEvents();

        const pendingRes = await ApiService.reminderPending();
        const pending = pendingRes.data?.items || [];
        const reminderEl = document.getElementById('reminder-content');
        if (!pending.length) {
            reminderEl.innerHTML = `<div style="color:var(--text-muted);font-size:13px">🎉 没有久未更新的剧集，继续保持！</div>`;
        } else {
            reminderEl.innerHTML = `
                <div style="color:var(--text-secondary);font-size:13px;margin-bottom:10px">
                    以下剧集已超过3天没有更新进度：
                </div>
                ${pending.map(p => `
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" data-id="${p.drama_id}">
                        <span style="color:var(--warning)">⏰</span>
                        <div style="flex:1">
                            <div style="font-weight:500">${Utils.escapeHtml(p.name)}</div>
                            <div style="font-size:12px;color:var(--text-muted)">已 ${p.days_since} 天未更新</div>
                        </div>
                    </div>
                `).join('')}
            `;
            reminderEl.querySelectorAll('[data-id]').forEach(el => {
                el.addEventListener('click', () => {
                    Router.navigate('detail', { id: el.dataset.id });
                });
            });
        }

        document.getElementById('btn-export').addEventListener('click', async () => {
            const res = await ApiService.exportData();
            if (res.code === 0 && res.data) {
                const content = JSON.stringify(res.data, null, 2);
                const filename = `zhuiju-backup-${new Date().toISOString().slice(0, 10)}.json`;
                Utils.downloadFile(filename, content, 'application/json');
                Utils.toast('导出成功 💾', 'success');
            } else {
                Utils.toast(res.message, 'error');
            }
        });

        document.getElementById('btn-import').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('file-input').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                const items = data.items || data;
                if (!Array.isArray(items)) throw new Error('数据格式错误');
                const m = Utils.showModal(`
                    <p style="color:var(--text-secondary);margin-bottom:16px">共检测到 ${items.length} 条数据，请选择导入方式：</p>
                    <div class="btn-group">
                        <button class="btn btn-secondary" id="import-merge">合并导入</button>
                        <button class="btn btn-danger" id="import-replace">替换所有</button>
                        <button class="btn btn-ghost" id="import-cancel">取消</button>
                    </div>
                `, { title: '导入数据' });
                const doImport = async (mode) => {
                    const r = await ApiService.importData(items, mode);
                    if (r.code === 0) {
                        Utils.toast(`导入成功 ${r.data?.imported || 0} 条`, 'success');
                        Utils.closeModal();
                        this.render();
                    } else Utils.toast(r.message, 'error');
                };
                m.body.querySelector('#import-merge').addEventListener('click', () => doImport('merge'));
                m.body.querySelector('#import-replace').addEventListener('click', () => doImport('replace'));
                m.body.querySelector('#import-cancel').addEventListener('click', Utils.closeModal);
            } catch (err) {
                Utils.toast('文件解析失败: ' + err.message, 'error');
            }
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            const m = Utils.showModal(`
                <p style="color:var(--text-secondary);margin-bottom:16px">将清空所有数据并恢复为默认的20部热门剧，确定吗？</p>
                <div class="btn-group">
                    <button class="btn btn-ghost" id="c">取消</button>
                    <button class="btn btn-primary" id="ok">确定重置</button>
                </div>
            `, { title: '恢复默认' });
            m.body.querySelector('#c').addEventListener('click', Utils.closeModal);
            m.body.querySelector('#ok').addEventListener('click', async () => {
                const r = await ApiService.resetDefault();
                if (r.code === 0) { Utils.toast('已重置', 'success'); Utils.closeModal(); this.render(); }
                else Utils.toast(r.message, 'error');
            });
        });

        document.getElementById('btn-clear').addEventListener('click', () => {
            const m = Utils.showModal(`
                <p style="color:var(--danger);margin-bottom:16px">⚠️ 此操作将删除所有剧集数据，且不可恢复！</p>
                <div class="btn-group">
                    <button class="btn btn-ghost" id="c">取消</button>
                    <button class="btn btn-danger" id="ok">确认清空</button>
                </div>
            `, { title: '清空所有数据' });
            m.body.querySelector('#c').addEventListener('click', Utils.closeModal);
            m.body.querySelector('#ok').addEventListener('click', async () => {
                const r = await ApiService.clearAll();
                if (r.code === 0) { Utils.toast('已清空', 'success'); Utils.closeModal(); this.render(); }
                else Utils.toast(r.message, 'error');
            });
        });
    }
};

window.SettingsPage = SettingsPage;
