const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar has-header">
                ${Header.render('注册账号', true)}
                <main class="container">
                    <div class="card">
                        <form id="registerForm">
                            <div class="form-group">
                                <label class="form-label">手机号 <span class="required">*</span></label>
                                <input type="tel" class="form-input" id="regPhone" placeholder="请输入手机号" maxlength="11">
                            </div>
                            <div class="form-group">
                                <label class="form-label">昵称</label>
                                <input type="text" class="form-input" id="regNickname" placeholder="请输入昵称（选填）">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">学号</label>
                                    <input type="text" class="form-input" id="regStudentId" placeholder="学号（选填）">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">学院</label>
                                    <input type="text" class="form-input" id="regCollege" placeholder="学院（选填）">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="regPassword" placeholder="请设置登录密码（至少6位）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="regConfirmPassword" placeholder="请再次输入密码">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block btn-lg" id="regBtn">注册</button>
                        </form>
                        <div style="margin-top: 16px; text-align: center;">
                            <a href="javascript:;" onclick="Router.navigate('login')">已有账号？去登录</a>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('registerForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    },

    async handleRegister() {
        const phone = document.getElementById('regPhone').value.trim();
        const nickname = document.getElementById('regNickname').value.trim();
        const student_id = document.getElementById('regStudentId').value.trim();
        const college = document.getElementById('regCollege').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const regBtn = document.getElementById('regBtn');

        if (!phone) {
            Toast.error('请输入手机号');
            return;
        }

        if (!Utils.validatePhone(phone)) {
            Toast.error('请输入正确的手机号');
            return;
        }

        if (!password) {
            Toast.error('请设置密码');
            return;
        }

        if (password.length < 6) {
            Toast.error('密码至少6位');
            return;
        }

        if (password !== confirmPassword) {
            Toast.error('两次密码输入不一致');
            return;
        }

        regBtn.disabled = true;
        regBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> 注册中...';

        try {
            const result = await AuthService.register({
                phone,
                password,
                nickname,
                student_id,
                college
            });

            if (result.code === 0) {
                Toast.success('注册成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '注册失败');
            }
        } catch (error) {
            Toast.error('注册失败，请检查网络');
        } finally {
            regBtn.disabled = false;
            regBtn.innerHTML = '注册';
        }
    }
};

window.RegisterPage = RegisterPage;
