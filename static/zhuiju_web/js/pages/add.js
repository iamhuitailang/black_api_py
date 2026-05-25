const AddPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <div style="margin-bottom:16px">
                    <button class="btn btn-ghost" onclick="history.back()" style="flex:none;padding:6px 12px">← 返回</button>
                </div>
                <h1 class="page-title">➕ 添加剧集</h1>
                <p class="page-subtitle">把想看的剧加入你的私人剧库</p>

                <div class="detail-progress-section">
                    <div class="form-row">
                        <label>剧名 *</label>
                        <input type="text" id="f-name" placeholder="例如:怪奇物语">
                    </div>
                    <div class="form-row">
                        <label>封面emoji</label>
                        <input type="text" id="f-cover" placeholder="🎬 选填" maxlength="4">
                    </div>
                    <div class="form-row">
                        <label>类型 *</label>
                        <input type="text" id="f-genre" placeholder="科幻 / 爱情 / 悬疑 ...">
                    </div>
                    <div class="form-row">
                        <label>总集数 *</label>
                        <input type="number" id="f-total" value="0" min="0">
                    </div>
                    <div class="form-row">
                        <label>已看集数</label>
                        <input type="number" id="f-watched" value="0" min="0">
                    </div>
                    <div class="form-row">
                        <label>每集时长(分钟)</label>
                        <input type="number" id="f-duration" value="45" min="0">
                    </div>
                    <div class="form-row">
                        <label>年份</label>
                        <input type="number" id="f-year" value="0" min="0" placeholder="选填">
                    </div>
                    <div class="form-row">
                        <label>初始状态</label>
                        <select id="f-status">
                            <option value="want">想看</option>
                            <option value="watching">正在追</option>
                            <option value="finished">已看完</option>
                            <option value="dropped">弃剧</option>
                        </select>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-primary" id="btn-save">保存</button>
                        <button class="btn btn-ghost" onclick="history.back()">取消</button>
                    </div>
                </div>
            </div>
        `;

        AppHeader.bindEvents();

        document.getElementById('btn-save').addEventListener('click', async () => {
            const name = document.getElementById('f-name').value.trim();
            const genre = document.getElementById('f-genre').value.trim();
            const total = parseInt(document.getElementById('f-total').value) || 0;

            if (!name) {
                Utils.toast('请填写剧名', 'error');
                return;
            }
            if (!genre) {
                Utils.toast('请填写类型', 'error');
                return;
            }
            if (total <= 0) {
                Utils.toast('总集数必须大于 0', 'error');
                return;
            }

            const data = {
                name,
                cover: document.getElementById('f-cover').value.trim(),
                genre: document.getElementById('f-genre').value.trim(),
                total_episodes: parseInt(document.getElementById('f-total').value) || 0,
                watched_episodes: parseInt(document.getElementById('f-watched').value) || 0,
                episode_duration: parseInt(document.getElementById('f-duration').value) || 0,
                year: parseInt(document.getElementById('f-year').value) || 0,
                status: document.getElementById('f-status').value,
                seasons: 1
            };
            const r = await ApiService.addDrama(data);
            if (r.code === 0) {
                Utils.toast('添加成功 🎉', 'success');
                Router.navigate('home');
            } else {
                Utils.toast(r.message, 'error');
            }
        });
    }
};

window.AddPage = AddPage;
