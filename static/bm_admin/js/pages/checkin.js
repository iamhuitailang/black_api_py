const CheckinPage = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('checkinBtn')?.addEventListener('click', () => this.handleCheckin());
        document.getElementById('qrcodeInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleCheckin();
        });
    },

    async handleCheckin() {
        const qrcode = document.getElementById('qrcodeInput').value?.trim();
        if (!qrcode) {
            Toast.error('请输入签到码');
            return;
        }

        const result = await API.checkin.byQrcode(qrcode);
        if (result.code === 0) {
            Toast.success('签到成功');
            document.getElementById('qrcodeInput').value = '';
            
            const reg = result.data;
            this.showCheckinResult(reg);
        } else {
            Toast.error(result.msg || '签到失败');
        }
    },

    showCheckinResult(reg) {
        const container = document.getElementById('checkinResult');
        if (!container) return;

        container.classList.remove('hidden');
        container.innerHTML = `
            <div class="card" style="background: #d4edda; border-color: #c3e6cb;">
                <h3 style="color: #155724; margin-bottom: 20px;">签到成功</h3>
                <div class="detail-item">
                    <span class="detail-label">报名编号：</span>
                    <span class="detail-value">${reg.registration_no}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">姓名：</span>
                    <span class="detail-value">${reg.real_name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">手机号：</span>
                    <span class="detail-value">${reg.phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">签到时间：</span>
                    <span class="detail-value">${new Date().toLocaleString()}</span>
                </div>
            </div>
        `;

        setTimeout(() => {
            container.classList.add('hidden');
        }, 5000);
    }
};
