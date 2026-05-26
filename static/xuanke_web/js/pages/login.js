const LoginPage = {
    template: `
        <div class="login-container">
            <div class="login-box">
                <h2 class="login-title">在线选课系统</h2>
                <p class="login-subtitle">欢迎回来，请登录您的账号</p>
                
                <el-form ref="loginForm" :model="form" :rules="rules" label-position="top">
                    <el-form-item label="用户名" prop="username">
                        <el-input 
                            v-model="form.username" 
                            placeholder="请输入用户名" 
                            size="large"
                            :prefix-icon="User"
                        />
                    </el-form-item>
                    
                    <el-form-item label="密码" prop="password">
                        <el-input 
                            v-model="form.password" 
                            type="password" 
                            placeholder="请输入密码" 
                            size="large"
                            :prefix-icon="Lock"
                            show-password
                            @keyup.enter="handleLogin"
                        />
                    </el-form-item>
                    
                    <el-form-item>
                        <el-button 
                            type="primary" 
                            size="large" 
                            style="width: 100%" 
                            :loading="loading"
                            @click="handleLogin"
                        >
                            登录
                        </el-button>
                    </el-form-item>
                </el-form>
                
                <div style="text-align: center; margin-top: 16px;">
                    <span style="color: #909399;">还没有账号？</span>
                    <el-link type="primary" @click="goRegister">立即注册</el-link>
                </div>
                
                <div style="margin-top: 24px; padding: 12px; background: #f5f7fa; border-radius: 6px;">
                    <p style="font-size: 12px; color: #909399; margin-bottom: 8px;">测试账号：</p>
                    <p style="font-size: 12px; color: #606266;">管理员：admin / admin123</p>
                    <p style="font-size: 12px; color: #606266;">学生：student / 123456</p>
                    <p style="font-size: 12px; color: #606266;">教师：teacher / 123456</p>
                </div>
            </div>
        </div>
    `,
    setup() {
        const { ref, reactive, onMounted } = Vue;
        const { ElMessage } = ElementPlus;
        const { User, Lock } = ElementPlusIconsVue;

        const form = reactive({
            username: '',
            password: ''
        });

        const loading = ref(false);
        const loginForm = ref(null);

        const rules = {
            username: [
                { required: true, message: '请输入用户名', trigger: 'blur' },
                { min: 3, max: 20, message: '用户名长度3-20位', trigger: 'blur' }
            ],
            password: [
                { required: true, message: '请输入密码', trigger: 'blur' },
                { min: 6, message: '密码长度至少6位', trigger: 'blur' }
            ]
        };

        const handleLogin = async () => {
            if (!loginForm.value) return;
            
            try {
                await loginForm.value.validate();
            } catch (e) {
                return;
            }

            loading.value = true;
            try {
                const response = await Auth.login(form.username, form.password);
                if (response.code === 0) {
                    Toast.success('登录成功');
                    const user = response.data.user;
                    if (user.role === 'admin') {
                        Router.navigate('/admin');
                    } else {
                        Router.navigate('/home');
                    }
                } else {
                    Toast.error(response.msg);
                }
            } catch (e) {
                Toast.error('登录失败，请重试');
            } finally {
                loading.value = false;
            }
        };

        const goRegister = () => {
            Router.navigate('/register');
        };

        onMounted(() => {
            if (Auth.isLoggedIn()) {
                const user = Auth.getCurrentUser();
                if (user.role === 'admin') {
                    Router.navigate('/admin');
                } else {
                    Router.navigate('/home');
                }
            }
        });

        return {
            form,
            rules,
            loading,
            loginForm,
            handleLogin,
            goRegister,
            User,
            Lock
        };
    }
};
