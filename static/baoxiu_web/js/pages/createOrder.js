const CreateOrderPage = {
    render() {
        const user = AuthService.getCurrentUser();
        if (user?.role !== 'student') {
            Utils.showToast('只有学生才能提交报修');
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.className = 'page has-header no-tabbar';
        app.innerHTML = `
            <div class="header">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">提交报修</div>
            </div>
            <div style="padding: 16px;">
                <form id="createOrderForm">
                    <div class="form-group">
                        <label class="form-label">报修标题 <span style="color: #ef4444;">*</span></label>
                        <input type="text" class="form-input" id="title" placeholder="请输入报修标题" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">报修类别 <span style="color: #ef4444;">*</span></label>
                        <select class="form-select" id="category">
                            <option value="">请选择类别</option>
                            <option value="水电维修">水电维修</option>
                            <option value="门窗维修">门窗维修</option>
                            <option value="家具维修">家具维修</option>
                            <option value="电器维修">电器维修</option>
                            <option value="管道维修">管道维修</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">紧急程度</label>
                        <select class="form-select" id="urgency">
                            <option value="1">普通</option>
                            <option value="2">高</option>
                            <option value="3">紧急</option>
                            <option value="0">低</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">宿舍楼 <span style="color: #ef4444;">*</span></label>
                        <select class="form-select" id="dormitoryId">
                            <option value="0">请选择宿舍楼</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">房间号 <span style="color: #ef4444;">*</span></label>
                        <input type="text" class="form-input" id="roomNumber" placeholder="如：301">
                    </div>
                    <div class="form-group">
                        <label class="form-label">联系人 <span style="color: #ef4444;">*</span></label>
                        <input type="text" class="form-input" id="contactName" placeholder="请输入联系人姓名">
                    </div>
                    <div class="form-group">
                        <label class="form-label">联系电话 <span style="color: #ef4444;">*</span></label>
                        <input type="tel" class="form-input" id="contactPhone" placeholder="请输入联系电话">
                    </div>
                    <div class="form-group">
                        <label class="form-label">报修描述</label>
                        <textarea class="form-textarea" id="description" placeholder="请详细描述报修内容..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" id="submitBtn">提 交</button>
                </form>
            </div>
        `;

        this.bindEvents();
        this.loadDormitories();
    },

    async loadDormitories() {
        try {
            const result = await ApiService.get('/baoxiu/dormitory/list/get', { page_size: 100 });
            if (result.code === 0 && result.data.items) {
                const select = document.getElementById('dormitoryId');
                result.data.items.forEach(d => {
                    const option = document.createElement('option');
                    option.value = d.id;
                    option.textContent = d.name;
                    select.appendChild(option);
                });
            }
        } catch (e) {
            console.error('Load dormitories error:', e);
        }
    },

    bindEvents() {
        document.getElementById('createOrderForm').onsubmit = async (e) => {
            e.preventDefault();
            const title = document.getElementById('title').value.trim();
            const category = document.getElementById('category').value;
            const dormitoryId = parseInt(document.getElementById('dormitoryId').value) || 0;
            const roomNumber = document.getElementById('roomNumber').value.trim();
            const contactName = document.getElementById('contactName').value.trim();
            const contactPhone = document.getElementById('contactPhone').value.trim();

            if (!title) {
                Utils.showToast('请输入报修标题');
                return;
            }

            if (!category) {
                Utils.showToast('请选择报修类别');
                return;
            }

            if (!dormitoryId || dormitoryId === 0) {
                Utils.showToast('请选择宿舍楼');
                return;
            }

            if (!roomNumber) {
                Utils.showToast('请填写房间号');
                return;
            }

            if (!contactName) {
                Utils.showToast('请填写联系人');
                return;
            }

            if (!contactPhone) {
                Utils.showToast('请填写联系电话');
                return;
            }

            if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
                Utils.showToast('联系电话格式不正确');
                return;
            }

            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.textContent = '提交中...';

            const data = {
                title,
                description: document.getElementById('description').value.trim(),
                category,
                urgency: parseInt(document.getElementById('urgency').value),
                dormitory_id: dormitoryId,
                room_number: roomNumber,
                contact_name: contactName,
                contact_phone: contactPhone
            };

            try {
                const result = await ApiService.post('/baoxiu/order/create', data);
                if (result.code === 0) {
                    Utils.showToast('提交成功');
                    setTimeout(() => {
                        Router.navigate('orders');
                    }, 500);
                } else {
                    Utils.showToast(result.msg);
                }
            } catch (error) {
                Utils.showToast('提交失败，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '提 交';
            }
        };
    }
};
