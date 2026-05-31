const ReviewCreatePage = {
    order: null,
    rating: 5,

    async render() {
        const params = Router.getParams();
        const orderId = params.orderId;

        if (!orderId) {
            Router.navigate('myOrders');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="header">
                    <div class="header-content">
                        <button class="back-btn" onclick="Router.back()">←</button>
                        <h1 class="header-title">评价服务</h1>
                        <div style="width:40px;"></div>
                    </div>
                </header>

                <div class="review-create-content" id="reviewCreateContent">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `;

        await this.loadOrder(orderId);
    },

    async loadOrder(id) {
        try {
            const result = await OrderApi.get(id);
            if (result.code === 0) {
                this.order = result.data;
                this.renderForm();
            } else {
                document.getElementById('reviewCreateContent').innerHTML = '<div class="empty">订单不存在</div>';
            }
        } catch (error) {
            document.getElementById('reviewCreateContent').innerHTML = '<div class="empty">加载失败</div>';
        }
    },

    renderForm() {
        const container = document.getElementById('reviewCreateContent');
        const order = this.order;

        container.innerHTML = `
            <div class="review-create">
                <div class="order-summary">
                    <h3>${order.service_name}</h3>
                    <p>订单号：${order.order_no}</p>
                    <p>预约时间：${order.appointment_date} ${order.appointment_time}</p>
                </div>

                <form id="reviewForm" class="review-form">
                    <div class="form-section">
                        <h3>服务评分</h3>
                        <div class="rating-stars" id="ratingStars">
                            ${[1,2,3,4,5].map(i => `
                                <span class="star ${i <= this.rating ? 'active' : ''}" data-rating="${i}">★</span>
                            `).join('')}
                        </div>
                        <p class="rating-text" id="ratingText">非常满意</p>
                    </div>

                    <div class="form-section">
                        <h3>评价内容</h3>
                        <textarea id="reviewContent" rows="5" placeholder="请输入您的评价内容..."></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">提交评价</button>
                </form>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const stars = document.querySelectorAll('#ratingStars .star');
        const ratingText = document.getElementById('ratingText');
        const ratingTexts = ['很差', '较差', '一般', '满意', '非常满意'];

        stars.forEach(star => {
            star.addEventListener('click', () => {
                this.rating = parseInt(star.dataset.rating);
                stars.forEach((s, idx) => {
                    s.classList.toggle('active', idx < this.rating);
                });
                ratingText.textContent = ratingTexts[this.rating - 1];
            });

            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                stars.forEach((s, idx) => {
                    s.classList.toggle('active', idx < rating);
                });
                ratingText.textContent = ratingTexts[rating - 1];
            });
        });

        document.getElementById('ratingStars').addEventListener('mouseleave', () => {
            stars.forEach((s, idx) => {
                s.classList.toggle('active', idx < this.rating);
            });
            ratingText.textContent = ratingTexts[this.rating - 1];
        });

        const form = document.getElementById('reviewForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const content = document.getElementById('reviewContent').value;

            if (!this.rating) {
                Utils.showToast('请选择评分', 'error');
                return;
            }

            try {
                const result = await ReviewApi.create({
                    order_id: this.order.id,
                    service_id: this.order.service_id,
                    rating: this.rating,
                    content: content
                });

                if (result.code === 0) {
                    Utils.showToast('评价成功！');
                    setTimeout(() => {
                        Router.navigate('myOrders');
                    }, 1000);
                } else {
                    Utils.showToast(result.msg || '提交失败', 'error');
                }
            } catch (error) {
                Utils.showToast(error.message || '提交失败', 'error');
            }
        });
    }
};
