const RegisterPage = {
    template: `
        <div class="register-container">
            <div class="register-box">
                <h2 class="register-title">用户注册</h2>
                
                <el-form ref="registerForm" :model="form" :rules="rules" label-position="top">
                    <el-form-item label="用户名" prop="username">
                        <el-input 
                            v-model="form.username" 
                            placeholder="请输入用户名（3-20位字母数字下划线）" 
                            size="large"
                        />
                    </el-form-item>
                    
                    <el-form-item label="密码" prop="password">
                        <el-input 
                            v-model="form.password" 
                            type="password" 
                            placeholder="请输入密码（至少6位）" 
                            size="large"
                            show-password
                        />
                    </el-form-item>
                    
                    <el-form-item label="确认密码" prop="confirmPassword">
                        <el-input 
                            v-model="form.confirmPassword" 
                            type="password" 
                            placeholder="请再次输入密码" 
                            size="large"
                            show-password
                        />
                    </el-form-item>
                    
                    <el-form-item label="真实姓名" prop="real_name">
                        <el-input 
                            v-model="form.real_name" 
                            placeholder="请输入真实姓名" 
                            size="large"
                        />
                    </el-form-item>
                    
                    <el-form-item label="角色" prop="role">
                        <el-select v-model="form.role" size="large" style="width: 100%;">
                            <el-option label="学生" value="student" />
                            <el-option label="教师" value="teacher" />
                        </el-select>
                    </el-form-item>
                    
                    <el-form-item v-if="form.role === 'student'" label="学号">
                        <el-input 
                            v-model="form.student_no" 
                            placeholder="请输入学号" 
                            size="large"
                        />
                    </el-form-item>
                    
                    <el-form-item v-if="form.role === 'teacher'" label="教师号">
                        <el-input 
                            v-model="form.teacher_no" 
                            placeholder="请输入教师号" 
                            size="large"
                        />
                    </el-form-item>
                    
                    <el-form-item label="邮箱">
                        <el-input 
                            v-model="form.email" 
                            placeholder="请输入邮箱" 
                            size="large"
                        />
                    </el-form-item>
                    
                    <el-form-item label="手机号">
                        <el-input 
                            v-model="form.phone" 
                            placeholder="请输入手机号" 
                            size="large"
                        />
                    </el-form-item>
                    
                    <el-form-item>
                        <el-button 
                            type="primary" 
                            size="large" 
                            style="width: 100%" 
                            :loading="loading"
                            @click="handleRegister"
                        >
                            注册
                        </el-button>
                    </el-form-item>
                </el-form>
                
                <div style="text-align: center; margin-top: 16px;">
                    <span style="color: #909399;">已有账号？</span>
                    <el-link type="primary" @click="goLogin">立即登录</el-link>
                </div>
            </div>
        </div>
    `,
    setup() {
        const { ref, reactive } = Vue;

        const form = reactive({
            username: '',
            password: '',
            confirmPassword: '',
            real_name: '',
            role: 'student',
            student_no: '',
            teacher_no: '',
            email: '',
            phone: ''
        });

        const loading = ref(false);
        const registerForm = ref(null);

        const validateConfirmPassword = (rule, value, callback) => {
            if (value !== form.password) {
                callback(new Error('两次输入的密码不一致'));
            } else {
                callback();
            }
        };

        const rules = {
            username: [
                { required: true, message: '请输入用户名', trigger: 'blur' },
                { min: 3, max: 20, message: '用户名长度3-20位', trigger: 'blur' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
            ],
            password: [
                { required: true, message: '请输入密码', trigger: 'blur' },
                { min: 6, message: '密码长度至少6位', trigger: 'blur' }
            ],
            confirmPassword: [
                { required: true, message: '请再次输入密码', trigger: 'blur' },
                { validator: validateConfirmPassword, trigger: 'blur' }
            ],
            real_name: [
                { required: true, message: '请输入真实姓名', trigger: 'blur' }
            ],
            role: [
                { required: true, message: '请选择角色', trigger: 'change' }
            ]
        };

        const handleRegister = async () => {
            if (!registerForm.value) return;
            
            try {
                await registerForm.value.validate();
            } catch (e) {
                return;
            }

            loading.value = true;
            try {
                const registerData = {
                    username: form.username,
                    password: form.password,
                    real_name: form.real_name,
                    role: form.role,
                    email: form.email,
                    phone: form.phone
                };
                
                if (form.role === 'student' && form.student_no) {
                    registerData.student_no = form.student_no;
                }
                if (form.role === 'teacher' && form.teacher_no) {
                    registerData.teacher_no = form.teacher_no;
                }

                const response = await Auth.register(registerData);
                if (response.code === 0) {
                    Toast.success('注册成功');
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
                Toast.error('注册失败，请重试');
            } finally {
                loading.value = false;
            }
        };

        const goLogin = () => {
            Router.navigate('/login');
        };

        return {
            form,
            rules,
            loading,
            registerForm,
            handleRegister,
            goLogin
        };
    }
};
