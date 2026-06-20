const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '音乐', '美术', '体育'];
const GRADES = ['小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级', '初中一年级', '初中二年级', '初中三年级', '高中一年级', '高中二年级', '高中三年级'];
const TIME_SLOTS = ['周一上午', '周一下午', '周一晚上', '周二上午', '周二下午', '周二晚上', '周三上午', '周三下午', '周三晚上', '周四上午', '周四下午', '周四晚上', '周五上午', '周五下午', '周五晚上', '周六上午', '周六下午', '周六晚上', '周日上午', '周日下午', '周日晚上'];

const LoginPage = {
    mode: 'login',
    selectedRole: 'parent',

    render() {
        const app = document.getElementById('app');
        const isLogin = this.mode === 'login';

        app.innerHTML = `
            <div class="auth-container">
                <div class="card auth-card">
                    <div class="auth-logo">
                        <div class="logo-icon">优</div>
                        <h1>优师家教</h1>
                        <p>让家教匹配更简单</p>
                    </div>

                    <div class="auth-toggle">
                        <button class="${isLogin ? 'active' : ''}" id="btn-login-mode">登录</button>
                        <button class="${!isLogin ? 'active' : ''}" id="btn-register-mode">注册</button>
                    </div>

                    ${isLogin ? this.renderLoginForm() : this.renderRegisterForm()}

                    <div class="auth-switch">
                        ${isLogin ? '还没有账号？' : '已有账号？'}
                        <a id="btn-switch-mode">${isLogin ? '立即注册' : '去登录'}</a>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderLoginForm() {
        return `
            <form class="auth-form" id="login-form">
                <div class="form-group">
                    <label class="form-label">用户名<span class="required">*</span></label>
                    <input type="text" class="form-control" name="username" placeholder="请输入用户名" required>
                </div>
                <div class="form-group">
                    <label class="form-label">密码<span class="required">*</span></label>
                    <input type="password" class="form-control" name="password" placeholder="请输入密码" required>
                </div>
                <button type="submit" class="btn btn-primary">登 录</button>
            </form>
        `;
    },

    renderRegisterForm() {
        return `
            <div class="role-selector">
                <div class="role-card ${this.selectedRole === 'parent' ? 'active' : ''}" data-role="parent">
                    <div class="role-icon">👨‍👩‍👧</div>
                    <div class="role-name">我是家长</div>
                    <div class="role-desc">找家教老师</div>
                </div>
                <div class="role-card ${this.selectedRole === 'teacher' ? 'active' : ''}" data-role="teacher">
                    <div class="role-icon">👨‍🏫</div>
                    <div class="role-name">我是教师</div>
                    <div class="role-desc">找学生授课</div>
                </div>
            </div>

            <form class="auth-form" id="register-form">
                <div class="form-group">
                    <label class="form-label">用户名<span class="required">*</span></label>
                    <input type="text" class="form-control" name="username" placeholder="请输入用户名（至少3位）" required>
                </div>
                <div class="form-group">
                    <label class="form-label">密码<span class="required">*</span></label>
                    <input type="password" class="form-control" name="password" placeholder="请输入密码（至少6位）" required minlength="6">
                </div>
                <div class="form-group">
                    <label class="form-label">真实姓名<span class="required">*</span></label>
                    <input type="text" class="form-control" name="real_name" placeholder="请输入真实姓名" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">手机号</label>
                        <input type="tel" class="form-control" name="phone" placeholder="请输入手机号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${this.selectedRole === 'parent' ? '孩子年级' : '教授年级'}</label>
                        <select class="form-control" name="grade">
                            <option value="">请选择</option>
                            ${GRADES.map(g => `<option value="${g}">${g}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">${this.selectedRole === 'parent' ? '需要辅导的科目' : '擅长科目'}</label>
                    <div class="checkbox-group" id="subjects-group">
                        ${SUBJECTS.map(s => `<label class="checkbox-item"><input type="checkbox" name="subjects" value="${s}">${s}</label>`).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">${this.selectedRole === 'parent' ? '期望上课时间' : '空闲时间'}</label>
                    <div class="checkbox-group" id="times-group">
                        ${TIME_SLOTS.map(t => `<label class="checkbox-item"><input type="checkbox" name="available_times" value="${t}">${t}</label>`).join('')}
                    </div>
                </div>
                ${this.selectedRole === 'teacher' ? `
                <div class="form-group">
                    <label class="form-label">个人简介</label>
                    <textarea class="form-control" name="introduction" placeholder="介绍一下你的教学经历、风格等"></textarea>
                </div>
                ` : ''}
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">${this.selectedRole === 'parent' ? '预算最低(元/时)' : '期望时薪最低'}</label>
                        <input type="number" class="form-control" name="budget_min" placeholder="0" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${this.selectedRole === 'parent' ? '预算最高(元/时)' : '期望时薪最高'}</label>
                        <input type="number" class="form-control" name="budget_max" placeholder="0" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">所在地区</label>
                    <input type="text" class="form-control" name="location" placeholder="如：北京市海淀区">
                </div>
                <button type="submit" class="btn btn-primary">注 册</button>
            </form>
        `;
    },

    bindEvents() {
        document.getElementById('btn-login-mode').addEventListener('click', () => {
            this.mode = 'login';
            this.render();
        });

        document.getElementById('btn-register-mode').addEventListener('click', () => {
            this.mode = 'register';
            this.render();
        });

        document.getElementById('btn-switch-mode').addEventListener('click', () => {
            this.mode = this.mode === 'login' ? 'register' : 'login';
            this.render();
        });

        document.querySelectorAll('.role-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedRole = card.dataset.role;
                this.render();
            });
        });

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                const username = formData.get('username').trim();
                const password = formData.get('password');

                const btn = loginForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.innerHTML = '<span class="loading"></span> 登录中...';

                try {
                    const result = await AuthService.login(username, password);
                    if (result.code === 0) {
                        Toast.success('登录成功');
                        Router.navigate('dashboard');
                    } else {
                        Toast.error(result.message);
                    }
                } catch (e) {}

                btn.disabled = false;
                btn.textContent = '登 录';
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);

                const subjects = formData.getAll('subjects');
                const availableTimes = formData.getAll('available_times');

                const data = {
                    username: formData.get('username').trim(),
                    password: formData.get('password'),
                    role: this.selectedRole,
                    real_name: formData.get('real_name').trim(),
                    phone: formData.get('phone') || '',
                    grade: formData.get('grade') || '',
                    subjects: subjects.join(','),
                    available_times: availableTimes.join(','),
                    introduction: formData.get('introduction') || '',
                    location: formData.get('location') || '',
                    budget_min: parseInt(formData.get('budget_min')) || 0,
                    budget_max: parseInt(formData.get('budget_max')) || 0
                };

                if (!subjects.length) {
                    Toast.warning('请至少选择一个科目');
                    return;
                }

                const btn = registerForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.innerHTML = '<span class="loading"></span> 注册中...';

                try {
                    const result = await AuthService.register(data);
                    if (result.code === 0) {
                        Storage.setToken(result.data.token);
                        Storage.setUser(result.data.user);
                        Toast.success('注册成功');
                        Router.navigate('dashboard');
                    } else {
                        Toast.error(result.message);
                    }
                } catch (e) {}

                btn.disabled = false;
                btn.textContent = '注 册';
            });
        }
    }
};
