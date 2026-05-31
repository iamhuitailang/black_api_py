const OrderCreatePage = {
    service: null,

    async render() {
        const params = Router.getParams();
        const serviceId = params.serviceId;

        if (!serviceId) {
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="header">
                    <div class="header-content">
                        <button class="back-btn" onclick="Router.back()">←</button>
                        <h1 class="header-title">预约服务</h1>
                        <div style="width:40px;"></div>
                    </div>
                </header>

                <div class="order-create-content" id="orderCreateContent">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `;

        await this.loadService(serviceId);
    },

    async loadService(id) {
        try {
            const result = await ServiceApi.get(id);
            if (result.code === 0) {
                this.service = result.data;
                this.renderForm();
            } else {
                document.getElementById('orderCreateContent').innerHTML = '<div class="empty">服务不存在</div>';
            }
        } catch (error) {
            document.getElementById('orderCreateContent').innerHTML = '<div class="empty">加载失败</div>';
        }
    },

    renderForm() {
        const container = document.getElementById('orderCreateContent');
        const service = this.service;
        const user = AuthService.getCurrentUser();
        const today = new Date().toISOString().split('T')[0];

        container.innerHTML = `
            <div class="order-create">
                <div class="service-summary">
                    <div class="summary-image">
                        <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(service.name)}&image_size=square" alt="${service.name}">
                    </div>
                    <div class="summary-info">
                        <h3>${service.name}</h3>
                        <p class="summary-category">${service.category}</p>
                        <p class="summary-price">${Utils.formatPrice(service.price)}</p>
                    </div>
                </div>

                <form id="orderForm" class="order-form">
                    <div class="form-section">
                        <h3>预约信息</h3>
                        
                        <div class="form-group">
                            <label>联系人姓名</label>
                            <input type="text" id="contactName" value="${user?.name || ''}" placeholder="请输入联系人姓名" required>
                        </div>

                        <div class="form-group">
                            <label>联系电话</label>
                            <input type="tel" id="contactPhone" value="${user?.phone || ''}" placeholder="请输入联系电话" required>
                        </div>

                        <div class="form-group">
                            <label>服务地址</label>
                            <input type="text" id="address" placeholder="请输入详细地址" required>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>预约日期</label>
                                <input type="date" id="appointmentDate" min="${today}" required>
                            </div>
                            <div class="form-group">
                                <label>预约时间</label>
                                <select id="appointmentTime" required>
                                    <option value="">请选择</option>
                                    <option value="09:00">09:00</option>
                                    <option value="10:00">10:00</option>
                                    <option value="11:00">11:00</option>
                                    <option value="14:00">14:00</option>
                                    <option value="15:00">15:00</option>
                                    <option value="16:00">16:00</option>
                                    <option value="17:00">17:00</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>备注信息</label>
                            <textarea id="remarks" rows="3" placeholder="有什么特殊要求请填写..."></textarea>
                        </div>
                    </div>

                    <div class="form-section price-section">
                        <div class="price-row">
                            <span>服务费用</span>
                            <span>${Utils.formatPrice(service.price)}</span>
                        </div>
                        <div class="price-row total">
                            <span>合计</span>
                            <span class="total-price">${Utils.formatPrice(service.price)}</span>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block btn-submit">提交预约</button>
                </form>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('orderForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const contactName = document.getElementById('contactName').value;
            const contactPhone = document.getElementById('contactPhone').value;
            const address = document.getElementById('address').value;
            const appointmentDate = document.getElementById('appointmentDate').value;
            const appointmentTime = document.getElementById('appointmentTime').value;
            const remarks = document.getElementById('remarks').value;

            if (!contactName || !contactPhone || !address || !appointmentDate || !appointmentTime) {
                Utils.showToast('请填写完整的预约信息', 'error');
                return;
            }

            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(contactPhone)) {
                Utils.showToast('请输入正确的手机号', 'error');
                return;
            }

            const confirmed = await Utils.confirm('确认提交预约吗？');
            if (!confirmed) return;

            try {
                const result = await OrderApi.create({
                    service_id: this.service.id,
                    contact_name: contactName,
                    contact_phone: contactPhone,
                    address: address,
                    appointment_date: appointmentDate,
                    appointment_time: appointmentTime,
                    remarks: remarks
                });

                if (result.code === 0) {
                    Utils.showToast('预约成功！');
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
