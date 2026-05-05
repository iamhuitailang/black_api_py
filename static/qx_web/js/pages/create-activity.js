const CreateActivityPage = {
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
                        <h3 class="card-title">🚴 发布骑行活动</h3>
                    </div>
                    <div class="card-body">
                        <form id="create-activity-form">
                            <div class="form-group">
                                <label class="form-label">活动标题 <span class="required">*</span></label>
                                <input type="text" class="form-input" id="title" name="title" placeholder="例如：周末休闲骑，绕翠湖" maxlength="100">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">路线名称 <span class="required">*</span></label>
                                    <input type="text" class="form-input" id="route" name="route" placeholder="例如：翠湖环线" maxlength="255">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">骑行距离 (km)</label>
                                    <input type="number" class="form-input" id="distance" name="distance" placeholder="例如：30" min="0" step="0.1">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">累计爬升 (m)</label>
                                    <input type="number" class="form-input" id="elevation" name="elevation" placeholder="例如：200" min="0">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">预计均速</label>
                                    <input type="text" class="form-input" id="pace" name="pace" placeholder="例如：25-28km/h" maxlength="20">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">难度等级</label>
                                    <select class="form-select" id="difficulty" name="difficulty">
                                        <option value="初级">初级</option>
                                        <option value="中级">中级</option>
                                        <option value="高级">高级</option>
                                        <option value="挑战">挑战</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">人数上限</label>
                                    <input type="number" class="form-input" id="max_people" name="max_people" placeholder="例如：20" min="1">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">集合时间</label>
                                    <input type="datetime-local" class="form-input" id="meeting_time" name="meeting_time">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">集合地点</label>
                                    <input type="text" class="form-input" id="meeting_point" name="meeting_point" placeholder="例如：翠湖公园南门" maxlength="255">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">活动费用 (元)</label>
                                <input type="number" class="form-input" id="cost" name="cost" placeholder="0为免费" min="0" step="0.01">
                            </div>
                            <div class="form-group">
                                <label class="form-label">活动描述</label>
                                <textarea class="form-textarea" id="description" name="description" placeholder="详细描述活动内容、注意事项等..." maxlength="1000"></textarea>
                            </div>
                            <div class="form-group flex justify-between items-center">
                                <button type="button" class="btn btn-outline" data-route="activities">取消</button>
                                <button type="submit" class="btn btn-green btn-lg" id="submit-btn">发布活动</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    },
    setupEventListeners: function() {
        const form = document.getElementById('create-activity-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('title').value.trim();
            const route = document.getElementById('route').value.trim();
            const distance = parseFloat(document.getElementById('distance').value) || 0;
            const elevation = parseInt(document.getElementById('elevation').value) || 0;
            const pace = document.getElementById('pace').value.trim();
            const difficulty = document.getElementById('difficulty').value;
            const max_people = parseInt(document.getElementById('max_people').value) || 0;
            const meeting_time = document.getElementById('meeting_time').value;
            const meeting_point = document.getElementById('meeting_point').value.trim();
            const cost = parseFloat(document.getElementById('cost').value) || 0;
            const description = document.getElementById('description').value.trim();
            const submitBtn = document.getElementById('submit-btn');

            if (!title) {
                App.showToast('请输入活动标题', 'error');
                return;
            }

            if (!route) {
                App.showToast('请输入路线名称', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = '发布中...';

            try {
                const data = {
                    title: title,
                    route: route,
                    distance: distance,
                    elevation: elevation,
                    pace: pace,
                    difficulty: difficulty,
                    max_people: max_people,
                    meeting_point: meeting_point,
                    cost: cost,
                    description: description
                };

                if (meeting_time) {
                    data.meeting_time = meeting_time.replace('T', ' ');
                }

                const result = await API.post('/activity/create', data);
                
                if (result.code === 0) {
                    App.showToast('发布成功', 'success');
                    setTimeout(() => {
                        Router.go('activities');
                    }, 500);
                } else {
                    App.showToast(result.msg || '发布失败', 'error');
                }
            } catch (error) {
                App.showToast('发布失败，请稍后重试', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '发布活动';
            }
        });
    }
};

Router.register('create-activity', function(params) {
    CreateActivityPage.render();
});
