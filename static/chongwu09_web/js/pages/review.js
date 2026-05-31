const ReviewPage = {
    bookingId: null, serviceId: null, rating: 5,

    async render() {
        const params = Router.getParams();
        this.bookingId = params.booking_id;
        this.serviceId = params.service_id;
        if (!this.bookingId || !this.serviceId) { Router.navigate('myBookings'); return; }
        this.rating = 5;
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar has-header">
                <header class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <h1 class="header-title">评价服务</h1>
                </header>
                <div style="padding:16px">
                    <div class="form-group">
                        <label class="form-label">服务评分</label>
                        <div class="star-rating" id="starRating">
                            ${[1,2,3,4,5].map(i => `<span class="star ${i <= 5 ? 'active' : ''}" data-rating="${i}">★</span>`).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">评价内容</label>
                        <textarea class="form-control" id="reviewContent" placeholder="请分享您的寄养体验(选填)"></textarea>
                    </div>
                    <button class="btn btn-primary btn-block" id="submitBtn">提交评价</button>
                </div>
            </div>
        `;
        document.querySelectorAll('#starRating .star').forEach(star => {
            star.addEventListener('click', () => {
                this.rating = parseInt(star.dataset.rating);
                document.querySelectorAll('#starRating .star').forEach((s, i) => {
                    s.classList.toggle('active', i < this.rating);
                });
            });
        });
        document.getElementById('submitBtn').addEventListener('click', () => this.handleSubmit());
    },

    async handleSubmit() {
        const content = document.getElementById('reviewContent').value.trim();
        const btn = document.getElementById('submitBtn');
        btn.disabled = true; btn.textContent = '提交中...';
        try {
            const result = await ApiService.post('/chongwu09/review/create', {
                service_id: parseInt(this.serviceId),
                order_id: parseInt(this.bookingId),
                rating: this.rating,
                content
            });
            if (result.code === 0) { Toast.success('评价成功'); Router.navigate('myBookings'); }
            else { Toast.error(result.msg || '评价失败'); }
        } catch (e) { Toast.error('评价失败'); }
        finally { btn.disabled = false; btn.textContent = '提交评价'; }
    }
};
