const DetailPage = {
    activityId: null,
    activity: null,

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.activityId = urlParams.get('id');
        if (this.activityId) {
            this.loadActivity();
        }
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('registrationForm')?.addEventListener('submit', (e) => this.handleRegistration(e));
    },

    async loadActivity() {
        const result = await API.activity.detail(this.activityId);
        if (result.code === 0) {
            this.activity = result.data;
            this.renderActivity(result.data);
        }
    },

    renderActivity(activity) {
        document.getElementById('activityTitle').textContent = activity.title;
        document.getElementById('activityDescription').textContent = activity.description || '暂无描述';
        document.getElementById('activityLocation').textContent = activity.location;
        document.getElementById('activityStartTime').textContent = activity.start_time ? activity.start_time.substring(0, 16) : '-';
        document.getElementById('activityEndTime').textContent = activity.end_time ? activity.end_time.substring(0, 16) : '-';
        document.getElementById('activityRegistrationStart').textContent = activity.registration_start ? activity.registration_start.substring(0, 16) : '-';
        document.getElementById('activityRegistrationEnd').textContent = activity.registration_end ? activity.registration_end.substring(0, 16) : '-';
        document.getElementById('activityQuota').innerHTML = `剩余 <strong>${activity.remaining_quota}</strong> / ${activity.total_quota}`;

        const statusMap = {
            1: { text: '报名中', class: 'status-1' },
            2: { text: '进行中', class: 'status-2' },
            3: { text: '已结束', class: 'status-3' },
            4: { text: '已取消', class: 'status-4' }
        };
        const status = statusMap[activity.status] || statusMap[1];
        const statusBadge = `<span class="status-badge ${status.class}">${status.text}</span>`;
        document.getElementById('activityTitle').insertAdjacentHTML('afterend', statusBadge);

        const registerBtn = document.getElementById('registerBtn');
        if (activity.status !== 1 || activity.remaining_quota <= 0) {
            registerBtn.disabled = true;
            registerBtn.textContent = activity.remaining_quota <= 0 ? '名额已满' : '活动已结束';
            registerBtn.style.opacity = '0.5';
            registerBtn.style.cursor = 'not-allowed';
        }

        const user = Storage.getUser();
        if (user) {
            document.getElementById('realName').value = user.real_name || user.nickname || '';
            document.getElementById('phone').value = user.phone || '';
        }
    },

    async handleRegistration(e) {
        e.preventDefault();

        const user = Storage.getUser();
        if (!user) {
            Toast.error('请先登录');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        if (!this.activityId) return;

        const data = {
            activity_id: parseInt(this.activityId),
            real_name: document.getElementById('realName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            remark: document.getElementById('remark').value
        };

        if (!data.real_name || !data.phone) {
            Toast.error('请填写姓名和手机号');
            return;
        }

        const result = await API.activity.register(data);

        if (result.code === 0) {
            Toast.success('报名成功！');
            setTimeout(() => {
                window.location.href = 'my_registrations.html';
            }, 1500);
        } else {
            Toast.error(result.msg || '报名失败');
        }
    }
};
