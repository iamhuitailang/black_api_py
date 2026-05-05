const CreatePostPage = {
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
                        <h3 class="card-title">📝 发布动态</h3>
                    </div>
                    <div class="card-body">
                        <form id="create-post-form">
                            <div class="form-group">
                                <label class="form-label">内容</label>
                                <textarea class="form-textarea" id="content" name="content" placeholder="分享你的骑行故事..." maxlength="1000"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">关联活动</label>
                                <select class="form-select" id="activity_id" name="activity_id">
                                    <option value="">不关联活动</option>
                                </select>
                            </div>
                            <div class="form-group flex justify-between items-center">
                                <button type="button" class="btn btn-outline" data-route="posts">取消</button>
                                <button type="submit" class="btn btn-green btn-lg" id="submit-btn">发布</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.loadMyActivities();
        this.setupEventListeners();
    },
    loadMyActivities: async function() {
        try {
            const result = await API.get('/activity/my/list/get', { page: 1, page_size: 20 });
            const select = document.getElementById('activity_id');
            
            if (result.code === 0 && result.data && result.data.list && result.data.list.length > 0) {
                result.data.list.forEach(activity => {
                    const option = document.createElement('option');
                    option.value = activity.id;
                    option.textContent = activity.title;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Load activities error:', error);
        }
    },
    setupEventListeners: function() {
        const form = document.getElementById('create-post-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const content = document.getElementById('content').value.trim();
            const activityId = parseInt(document.getElementById('activity_id').value) || 0;
            const submitBtn = document.getElementById('submit-btn');

            if (!content) {
                App.showToast('请输入内容', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = '发布中...';

            try {
                const data = {
                    content: content
                };

                if (activityId > 0) {
                    data.activity_id = activityId;
                }

                const result = await API.post('/post/create', data);
                
                if (result.code === 0) {
                    App.showToast('发布成功', 'success');
                    setTimeout(() => {
                        Router.go('posts');
                    }, 500);
                } else {
                    App.showToast(result.msg || '发布失败', 'error');
                }
            } catch (error) {
                App.showToast('发布失败，请稍后重试', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '发布';
            }
        });
    }
};

Router.register('create-post', function(params) {
    CreatePostPage.render();
});
