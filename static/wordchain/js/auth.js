document.addEventListener('DOMContentLoaded', function() {
    if (api.token) {
        window.location.href = 'game.html';
        return;
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (tab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }
        });
    });

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading"></span> 登录中...';
        
        const result = await api.login(username, password);
        
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        if (result.code === 0) {
            api.setToken(result.data.token);
            localStorage.setItem('wordchain_user', JSON.stringify(result.data.user));
            showToast('登录成功！', 'success');
            setTimeout(() => {
                window.location.href = 'game.html';
            }, 500);
        } else {
            showToast(result.message, 'error');
        }
    });

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        
        if (password !== confirmPassword) {
            showToast('两次输入的密码不一致', 'error');
            return;
        }
        
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading"></span> 注册中...';
        
        const result = await api.register(username, password);
        
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        if (result.code === 0) {
            showToast('注册成功！请登录', 'success');
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').focus();
        } else {
            showToast(result.message, 'error');
        }
    });
});
