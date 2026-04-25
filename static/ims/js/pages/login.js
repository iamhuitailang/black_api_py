const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="card login-card">
                    <div class="login-logo">
                        <div style="font-size: 48px;">🌸</div>
                        <h1>牡丹进销存管理系统</h1>
                        <p>请登录您的账户</p>
                    </div>
                    
                    <form class="login-form" id="loginForm">
                        <div class="form-group">
                            <label class="form-label">
                                用户名 <span class="required">*</span>
                            </label>
                            <input type="text" name="username" class="form-control" placeholder="请输入用户名" autofocus>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                密码 <span class="required">*</span>
                            </label>
                            <input type="password" name="password" class="form-control" placeholder="请输入密码">
                        </div>
                        
                        <div class="form-group mt-2">
                            <button type="submit" class="btn btn-primary" id="loginBtn">
                                登录
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.bindEvents();
    },
    
    bindEvents() {
        const form = document.getElementById('loginForm');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const rules = {
                username: [{ required: true, message: '请输入用户名' }],
                password: [{ required: true, message: '请输入密码' }]
            };
            
            const validation = FormUtil.validate(form, rules);
            if (!validation.isValid) return;
            
            const data = FormUtil.getData(form);
            const submitBtn = document.getElementById('loginBtn');
            
            FormUtil.setLoading(submitBtn, true, '登录中...');
            
            try {
                const result = await AuthService.login(data.username, data.password);
                
                if (result.code === 0) {
                    Toast.success('登录成功');
                    Router.navigate('dashboard');
                } else {
                    Toast.error(result.message || '登录失败');
                }
            } catch (error) {
                Toast.error(error.message || '网络错误，请稍后重试');
            } finally {
                FormUtil.setLoading(submitBtn, false);
            }
        });
    }
};
