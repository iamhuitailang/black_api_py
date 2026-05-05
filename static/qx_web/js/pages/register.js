const RegisterPage = {
    render: function() {
        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = `
            <div class="grid justify-center" style="grid-template-columns: minmax(300px, 450px);">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title text-center">🚴 注册骑行搭子</h3>
                    </div>
                    <div class="card-body">
                        <form id="register-form">
                            <div class="form-group">
                                <label class="form-label">手机号 <span class="required">*</span></label>
                                <input type="tel" class="form-input" id="phone" name="phone" placeholder="请输入手机号" maxlength="11">
                            </div>
                            <div class="form-group">
                                <label class="form-label">昵称 <span class="required">*</span></label>
                                <input type="text" class="form-input" id="nickname" name="nickname" placeholder="请输入昵称" maxlength="20">
                            </div>
                            <div class="form-group">
                                <label class="form-label">密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="password" name="password" placeholder="请输入密码（至少6位）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="confirm_password" name="confirm_password" placeholder="请再次输入密码">
                            </div>
                            <div class="form-group">
                                <label class="form-label">车辆类型</label>
                                <select class="form-select" id="bike_type" name="bike_type">
                                    <option value="">请选择</option>
                                    <option value="公路车">公路车</option>
                                    <option value="山地车">山地车</option>
                                    <option value="折叠车">折叠车</option>
                                    <option value="电动车">电动车</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">个人简介</label>
                                <textarea class="form-textarea" id="bio" name="bio" placeholder="介绍一下自己..." maxlength="200"></textarea>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-green btn-lg w-full" id="register-btn">注册</button>
                            </div>
                            <div class="text-center">
                                已有账号？<a href="?page=login" data-route="login">立即登录</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    },
    setupEventListeners: function() {
        const form = document.getElementById('register-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phone = document.getElementById('phone').value.trim();
            const nickname = document.getElementById('nickname').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            const bikeType = document.getElementById('bike_type').value;
            const bio = document.getElementById('bio').value.trim();
            const registerBtn = document.getElementById('register-btn');

            if (!phone) {
                App.showToast('请输入手机号', 'error');
                return;
            }

            if (!/^1[3-9]\d{9}$/.test(phone)) {
                App.showToast('请输入正确的手机号', 'error');
                return;
            }

            if (!nickname) {
                App.showToast('请输入昵称', 'error');
                return;
            }

            if (nickname.length < 2) {
                App.showToast('昵称至少2个字符', 'error');
                return;
            }

            if (!password) {
                App.showToast('请输入密码', 'error');
                return;
            }

            if (password.length < 6) {
                App.showToast('密码至少6位', 'error');
                return;
            }

            if (password !== confirmPassword) {
                App.showToast('两次输入的密码不一致', 'error');
                return;
            }

            registerBtn.disabled = true;
            registerBtn.textContent = '注册中...';

            try {
                const data = {
                    phone: phone,
                    nickname: nickname,
                    password: password
                };

                if (bikeType) {
                    data.bike_type = bikeType;
                }

                if (bio) {
                    data.bio = bio;
                }

                const result = await Auth.register(data);
                
                if (result.code === 0) {
                    App.showToast('注册成功，请登录', 'success');
                    setTimeout(() => {
                        Router.go('login');
                    }, 500);
                } else {
                    App.showToast(result.msg || '注册失败', 'error');
                }
            } catch (error) {
                App.showToast('注册失败，请稍后重试', 'error');
            } finally {
                registerBtn.disabled = false;
                registerBtn.textContent = '注册';
            }
        });
    }
};

Router.register('register', function(params) {
    if (Auth.isLoggedIn()) {
        Router.go('home');
        return;
    }
    RegisterPage.render();
});
