const CreateRidePage = {
    render: function() {
        if (!Auth.isLoggedIn()) {
            Router.go('login');
            return;
        }

        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = `
            <div class="grid justify-center" style="grid-template-columns: minmax(300px, 600px);">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🗺️ 记录骑行</h3>
                    </div>
                    <div class="card-body">
                        <form id="create-ride-form">
                            <div class="form-group">
                                <label class="form-label">路线名称</label>
                                <input type="text" class="form-input" id="route_name" name="route_name" placeholder="例如：周末休闲骑" maxlength="100">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">骑行日期</label>
                                    <input type="date" class="form-input" id="date" name="date">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">骑行距离 (km) <span class="required">*</span></label>
                                    <input type="number" class="form-input" id="distance" name="distance" placeholder="例如：30" min="0" step="0.1">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">骑行时长 (分钟) <span class="required">*</span></label>
                                    <input type="number" class="form-input" id="duration" name="duration" placeholder="例如：60" min="0">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">平均速度 (km/h)</label>
                                    <input type="number" class="form-input" id="avg_speed" name="avg_speed" placeholder="留空自动计算" min="0" step="0.1">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">最高速度 (km/h)</label>
                                    <input type="number" class="form-input" id="max_speed" name="max_speed" placeholder="例如：35" min="0" step="0.1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">累计爬升 (m)</label>
                                    <input type="number" class="form-input" id="elevation" name="elevation" placeholder="例如：200" min="0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">骑行笔记</label>
                                <textarea class="form-textarea" id="notes" name="notes" placeholder="记录这次骑行的感受..." maxlength="1000"></textarea>
                            </div>
                            <div class="form-group flex justify-between items-center">
                                <button type="button" class="btn btn-outline" data-route="rides">取消</button>
                                <button type="submit" class="btn btn-green btn-lg" id="submit-btn">保存记录</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;

        this.setupEventListeners();
    },
    setupEventListeners: function() {
        const form = document.getElementById('create-ride-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const routeName = document.getElementById('route_name').value.trim();
            const date = document.getElementById('date').value;
            const distance = parseFloat(document.getElementById('distance').value);
            const duration = parseInt(document.getElementById('duration').value);
            let avgSpeed = parseFloat(document.getElementById('avg_speed').value);
            const maxSpeed = parseFloat(document.getElementById('max_speed').value) || 0;
            const elevation = parseInt(document.getElementById('elevation').value) || 0;
            const notes = document.getElementById('notes').value.trim();
            const submitBtn = document.getElementById('submit-btn');

            if (!distance || distance <= 0) {
                App.showToast('请输入骑行距离', 'error');
                return;
            }

            if (!duration || duration <= 0) {
                App.showToast('请输入骑行时长', 'error');
                return;
            }

            if (!avgSpeed && distance && duration) {
                avgSpeed = (distance / (duration / 60)).toFixed(1);
            }

            submitBtn.disabled = true;
            submitBtn.textContent = '保存中...';

            try {
                const data = {
                    distance: distance,
                    duration: duration,
                    avg_speed: parseFloat(avgSpeed) || 0,
                    max_speed: maxSpeed,
                    elevation: elevation,
                    route_name: routeName,
                    notes: notes
                };

                if (date) {
                    data.date = date;
                }

                const result = await API.post('/ride/create', data);
                
                if (result.code === 0) {
                    App.showToast('记录成功', 'success');
                    setTimeout(() => {
                        Router.go('rides');
                    }, 500);
                } else {
                    App.showToast(result.msg || '保存失败', 'error');
                }
            } catch (error) {
                App.showToast('保存失败，请稍后重试', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '保存记录';
            }
        });
    }
};

Router.register('create-ride', function(params) {
    CreateRidePage.render();
});
