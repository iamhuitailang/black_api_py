const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">📮</div>
                    <h1 class="auth-title">匿名吐槽箱</h1>
                    <p class="auth-subtitle">创建新账号</p>
                    
                    <form class="auth-form" onsubmit="RegisterPage.handleRegister(event)">
                        <div class="form-group">
                            <input type="text" id="username" placeholder="用户名（3-20位字母数字下划线）" required>
                        </div>
                        <div class="form-group">
                            <input type="text" id="nickname" placeholder="昵称（可选）">
                        </div>
                        <div class="form-group">
                            <input type="password" id="password" placeholder="密码（至少6位）" required>
                        </div>
                        <div class="form-group">
                            <input type="password" id="confirmPassword" placeholder="确认密码" required>
                        </div>
                        <button type="submit" class="btn-auth">注 册</button>
                    </form>
                    
                    <div class="auth-footer">
                        <p>已有账号？<a href="#login">立即登录</a></p>
                    </div>
                    
                    <div class="auth-back" onclick="Router.navigate('home')">
                        ← 返回首页
                    </div>
                </div>
            </div>
        `;
    },

    async handleRegister(event) {
        event.preventDefault();
        const username = document.getElementById('username').value.trim();
        const nickname = document.getElementById('nickname').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!username || username.length < 3) {
            Toast.warning('用户名至少3位');
            return;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            Toast.warning('用户名只能包含字母、数字和下划线');
            return;
        }

        if (!password || password.length < 6) {
            Toast.warning('密码至少6位');
            return;
        }

        if (password !== confirmPassword) {
            Toast.warning('两次密码不一致');
            return;
        }

        try {
            const result = await AuthService.register(username, password, nickname);
            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
                Toast.success('注册成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '注册失败');
            }
        } catch (error) {
            Toast.error(error.message || '注册失败');
        }
    }
};
