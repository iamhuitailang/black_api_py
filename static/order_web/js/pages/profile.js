class ProfilePage {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('my-orders-btn').addEventListener('click', () => {
            app.navigateTo('orders');
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('确定要退出登录吗？')) {
                localStorage.removeItem('order_user');
                app.currentUser = null;
                
                document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
                
                showToast('已退出登录');
                
                setTimeout(() => {
                    app.showLoginPage();
                }, 50);
            }
        });
    }
}

let profilePage;
document.addEventListener('DOMContentLoaded', () => {
    profilePage = new ProfilePage();
});