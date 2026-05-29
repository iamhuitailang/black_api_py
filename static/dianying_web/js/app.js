const { createApp, reactive } = Vue;

const app = createApp({
    data() {
        return {
            isLoggedIn: false,
            isAdmin: false,
            currentUser: null,
            showChangePassword: false,
            passwordForm: {
                old_password: '',
                new_password: ''
            },
            toast: reactive({
                show: false,
                message: '',
                type: 'success'
            })
        };
    },
    computed: {
        currentRoute() {
            return this.$route.path;
        }
    },
    created() {
        this.checkAuth();
    },
    watch: {
        '$route'() {
            this.checkAuth();
        }
    },
    methods: {
        async checkAuth() {
            this.isLoggedIn = AuthService.isLoggedIn();
            this.isAdmin = AuthService.isAdmin();
            this.currentUser = AuthService.getUser();

            if (this.isLoggedIn) {
                try {
                    const user = await AuthService.getCurrentUser();
                    this.currentUser = user;
                    this.isAdmin = user && user.role === 'admin';
                } catch (error) {
                    AuthService.logout();
                    this.isLoggedIn = false;
                    this.isAdmin = false;
                    this.currentUser = null;
                }
            }
        },
        async logout() {
            AuthService.logout();
            this.isLoggedIn = false;
            this.isAdmin = false;
            this.currentUser = null;
            this.showChangePassword = false;
            this.showToast('已退出登录', 'success');
            this.$router.push('/login');
        },
        async changePassword() {
            if (!this.passwordForm.old_password || !this.passwordForm.new_password) {
                this.showToast('请填写完整信息', 'error');
                return;
            }
            if (this.passwordForm.old_password === this.passwordForm.new_password) {
                this.showToast('新密码不能与原密码相同', 'error');
                return;
            }
            try {
                await AuthService.changePassword(this.passwordForm.old_password, this.passwordForm.new_password);
                this.showToast('密码修改成功', 'success');
                this.showChangePassword = false;
                this.passwordForm = { old_password: '', new_password: '' };
            } catch (error) {
                this.showToast(error.message, 'error');
            }
        },
        showToast(message, type = 'success') {
            this.toast.message = message;
            this.toast.type = type;
            this.toast.show = true;

            setTimeout(() => {
                this.toast.show = false;
            }, 3000);
        },
        goHome() {
            this.$router.push('/');
        }
    }
});

app.component('MovieDetailModal', MovieDetailModal);
app.use(router);
app.mount('#app');
