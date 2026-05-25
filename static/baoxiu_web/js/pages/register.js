const RegisterPage = {
    currentRole: 'student',

    render() {
        const app = document.getElementById('app');
        app.className = '';
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">🔧</div>
                    <div class="login-title">注册账号</div>
                    <div class="login-subtitle">加入宿舍报修系统</div>
                </div>
                <div class="login-form">
                    <div class="login-tabs">
                        <div class="login-tab active" data-role="student">学生注册</div>
                        <div class="login-tab" data-role="repairman">维修工注册</div>
                    </div>
                    <form id="registerForm">
                        <div class="form-group">
                            <label class="form-label">用户名 <span style="color: #ef4444;">*</span></label>
                            <input type="text" class="form-input" id="username" placeholder="请输入用户名（至少3位）" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码 <span style="color: #ef4444;">*</span></label>
                            <input type="password" class="form-input" id="password" placeholder="请输入密码（至少6位）" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码 <span style="color: #ef4444;">*</span></label>
                            <input type="password" class="form-input" id="confirmPassword" placeholder="请再次输入密码" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">真实姓名</label>
                            <input type="text" class="form-input" id="realName" placeholder="请输入真实姓名">
                        </div>
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-input" id="phone" placeholder="请输入手机号">
                        </div>
                        <div id="studentFields" style="display: block;">
                            <div class="form-group">
                                <label class="form-label">学号</label>
                                <input type="text" class="form-input" id="studentNo" placeholder="请输入学号">
                            </div>
                            <div class="form-group">
                                <label class="form-label">宿舍楼</label>
                                <select class="form-select" id="dormitoryId">
                                    <option value="0">请选择宿舍楼</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">房间号</label>
                                <input type="text" class="form-input" id="roomNumber" placeholder="如：301">
                            </div>
                        </div>
                        <div id="repairmanFields" style="display: none;">
                            <div class="form-group">
                                <label class="form-label">工号</label>
                                <input type="text" class="form-input" id="workerNo" placeholder="请输入工号">
                            </div>
                            <div class="form-group">
                                <label class="form-label">维修专长</label>
                                <select class="form-select" id="specialty">
                                    <option value="">请选择专长</option>
                                    <option value="水电维修">水电维修</option>
                                    <option value="门窗维修">门窗维修</option>
                                    <option value="家具维修">家具维修</option>
                                    <option value="电器维修">电器维修</option>
                                    <option value="管道维修">管道维修</option>
                                    <option value="其他">其他</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="registerBtn">注 册</button>
                    </form>
                    <div class="register-link">
                        已有账号？<a href="#login">立即登录</a>
                    </div>
                </div>
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
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentRole = tab.dataset.role;

                document.getElementById('studentFields').style.display = this.currentRole === 'student' ? 'block' : 'none';
                document.getElementById('repairmanFields').style.display = this.currentRole === 'repairman' ? 'block' : 'none';
            };
        });

        document.getElementById('registerForm').onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            if (username.length < 3) {
                Utils.showToast('用户名至少3位');
                return;
            }
            if (password.length < 6) {
                Utils.showToast('密码至少6位');
                return;
            }
            if (password !== confirmPassword) {
                Utils.showToast('两次输入的密码不一致');
                return;
            }

            const phone = document.getElementById('phone').value.trim();
            if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
                Utils.showToast('手机号格式不正确');
                return;
            }

            const btn = document.getElementById('registerBtn');
            btn.disabled = true;
            btn.textContent = '注册中...';

            const userData = {
                username,
                password,
                real_name: document.getElementById('realName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                role: this.currentRole
            };

            if (this.currentRole === 'student') {
                userData.student_no = document.getElementById('studentNo').value.trim();
                userData.dormitory_id = parseInt(document.getElementById('dormitoryId').value) || 0;
                userData.room_number = document.getElementById('roomNumber').value.trim();
            } else if (this.currentRole === 'repairman') {
                userData.worker_no = document.getElementById('workerNo').value.trim();
                userData.specialty = document.getElementById('specialty').value;
            }

            try {
                const result = await AuthService.register(userData);
                if (result.code === 0) {
                    Utils.showToast('注册成功');
                    setTimeout(() => {
                        Router.navigate('home');
                    }, 500);
                } else {
                    Utils.showToast(result.msg);
                }
            } catch (error) {
                Utils.showToast('注册失败，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '注 册';
            }
        };
    }
};
