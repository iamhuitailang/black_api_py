const ReviewPage = {
    orderId: null,
    score: 5,

    async render() {
        if (!Auth.checkAuth()) return;

        this.orderId = Router.getParam('id');
        if (!this.orderId) {
            Router.navigate('order');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar" style="padding-bottom: 80px;">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <span class="header-title">评价回收员</span>
                </div>

                <div class="card">
                    <div class="card-body">
                        <div class="form-group" style="text-align: center;">
                            <label class="form-label">服务评分</label>
                            <div class="review-stars" id="reviewStars">
                                ${this.renderStars()}
                            </div>
                            <div style="margin-top: 8px; font-size: 14px; color: var(--text-secondary);">
                                当前评分: <span id="currentScore" style="color: var(--warning-color); font-weight: 600;">${this.score}</span> 分
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">评价内容</label>
                            <textarea class="review-textarea" id="reviewContent" 
                                placeholder="请输入评价内容（选填）..."></textarea>
                        </div>
                    </div>
                </div>

                <div style="position: fixed; bottom: 0; left: 0; right: 0; 
                    padding: 12px 16px; padding-bottom: calc(12px + var(--safe-area-bottom));
                    background-color: var(--card-bg); border-top: 1px solid var(--border-color);">
                    <button type="button" class="btn btn-primary btn-block btn-lg" id="submitReviewBtn">
                        提交评价
                    </button>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderStars() {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="review-star ${i <= this.score ? 'active' : ''}" data-score="${i}">★</span>`;
        }
        return html;
    },

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => {
            Router.navigate('order-detail', { id: this.orderId });
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('review-star')) {
                this.score = parseInt(e.target.dataset.score);
                document.getElementById('reviewStars').innerHTML = this.renderStars();
                document.getElementById('currentScore').textContent = this.score;
            }
        });

        document.getElementById('submitReviewBtn').addEventListener('click', () => {
            this.submitReview();
        });
    },

    async submitReview() {
        const content = document.getElementById('reviewContent').value.trim();

        try {
            const result = await API.post('/review/create', {
                order_id: parseInt(this.orderId),
                score: this.score,
                content: content
            });

            if (result.code === 200) {
                Toast.success('评价成功');
                setTimeout(() => {
                    Router.navigate('order');
                }, 1000);
            } else {
                Toast.error(result.msg || '评价失败');
            }
        } catch (e) {
            Toast.error('评价失败，请稍后重试');
        }
    }
};
