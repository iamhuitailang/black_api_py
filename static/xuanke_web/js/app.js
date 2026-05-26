const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

const MainLayout = {
    template: `
        <el-container class="main-layout">
            <el-header>
                <div class="header-title">
                    <el-icon :size="28"><Reading /></el-icon>
                    在线选课系统
                </div>
                <div class="header-user">
                    <el-dropdown @command="handleCommand">
                        <span style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <el-avatar :size="32">
                                {{ currentUser?.real_name?.charAt(0) || currentUser?.username?.charAt(0) }}
                            </el-avatar>
                            <span>{{ currentUser?.real_name || currentUser?.username }}</span>
                            <el-tag size="small" :type="getRoleTagType(currentUser?.role)">
                                {{ getRoleText(currentUser?.role) }}
                            </el-tag>
                            <el-icon><ArrowDown /></el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile">
                                    <el-icon><User /></el-icon> 个人资料
                                </el-dropdown-item>
                                <el-dropdown-item command="password">
                                    <el-icon><Lock /></el-icon> 修改密码
                                </el-dropdown-item>
                                <el-dropdown-item divided command="logout">
                                    <el-icon><SwitchButton /></el-icon> 退出登录
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>
            
            <el-container>
                <el-aside width="220px">
                    <el-menu
                        :default-active="activeMenu"
                        background-color="#001529"
                        text-color="#a6adb4"
                        active-text-color="#ffffff"
                        @select="handleMenuSelect"
                    >
                        <template v-if="isAdmin">
                            <el-menu-item index="/admin">
                                <el-icon><DataAnalysis /></el-icon>
                                <span>系统管理</span>
                            </el-menu-item>
                        </template>
                        
                        <template v-if="!isAdmin">
                            <el-menu-item index="/home">
                                <el-icon><Collection /></el-icon>
                                <span>课程列表</span>
                            </el-menu-item>
                            <el-menu-item index="/my-courses">
                                <el-icon><Calendar /></el-icon>
                                <span>我的课表</span>
                            </el-menu-item>
                            <el-menu-item index="/grades">
                                <el-icon><Trophy /></el-icon>
                                <span>成绩查询</span>
                            </el-menu-item>
                            <el-menu-item index="/reviews">
                                <el-icon><ChatDotRound /></el-icon>
                                <span>课程评价</span>
                            </el-menu-item>
                        </template>
                    </el-menu>
                </el-aside>
                
                <el-main style="padding: 0; overflow: auto;">
                    <component :is="currentComponent" v-if="currentComponent" />
                </el-main>
            </el-container>
            
            <el-dialog v-model="profileDialogVisible" title="个人资料" width="500px">
                <el-form ref="profileFormRef" :model="profileForm" label-width="100px">
                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item label="用户名">
                                <el-input v-model="profileForm.username" disabled />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="真实姓名">
                                <el-input v-model="profileForm.real_name" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="角色">
                                <el-input :value="getRoleText(profileForm.role)" disabled />
                            </el-form-item>
                        </el-col>
                        <el-col v-if="profileForm.role === 'student'" :span="12">
                            <el-form-item label="学号">
                                <el-input v-model="profileForm.student_no" />
                            </el-form-item>
                        </el-col>
                        <el-col v-if="profileForm.role === 'teacher'" :span="12">
                            <el-form-item label="教师号">
                                <el-input v-model="profileForm.teacher_no" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="院系">
                                <el-input v-model="profileForm.department" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="专业">
                                <el-input v-model="profileForm.major" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="班级">
                                <el-input v-model="profileForm.class_name" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="年级">
                                <el-input v-model="profileForm.grade" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="邮箱">
                                <el-input v-model="profileForm.email" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="手机号">
                                <el-input v-model="profileForm.phone" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                <template #footer>
                    <el-button @click="profileDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveProfile" :loading="submitting">保存</el-button>
                </template>
            </el-dialog>
            
            <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
                <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
                    <el-form-item label="原密码" prop="old_password">
                        <el-input v-model="passwordForm.old_password" type="password" show-password />
                    </el-form-item>
                    <el-form-item label="新密码" prop="new_password">
                        <el-input v-model="passwordForm.new_password" type="password" show-password />
                    </el-form-item>
                    <el-form-item label="确认密码" prop="confirm_password">
                        <el-input v-model="passwordForm.confirm_password" type="password" show-password />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="passwordDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="savePassword" :loading="submitting">确认修改</el-button>
                </template>
            </el-dialog>
        </el-container>
    `,
    setup() {
        const currentUser = ref(Auth.getCurrentUser());
        const currentPage = ref(Router.currentRoute);
        const profileDialogVisible = ref(false);
        const passwordDialogVisible = ref(false);
        const submitting = ref(false);
        const profileFormRef = ref(null);
        const passwordFormRef = ref(null);
        
        const profileForm = reactive({
            id: null,
            username: '',
            real_name: '',
            role: '',
            student_no: '',
            teacher_no: '',
            department: '',
            major: '',
            class_name: '',
            grade: '',
            email: '',
            phone: ''
        });
        
        const passwordForm = reactive({
            old_password: '',
            new_password: '',
            confirm_password: ''
        });
        
        const passwordRules = {
            old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
            new_password: [
                { required: true, message: '请输入新密码', trigger: 'blur' },
                { min: 6, message: '密码长度至少6位', trigger: 'blur' }
            ],
            confirm_password: [
                { required: true, message: '请确认新密码', trigger: 'blur' },
                {
                    validator: (rule, value, callback) => {
                        if (value !== passwordForm.new_password) {
                            callback(new Error('两次输入的密码不一致'));
                        } else {
                            callback();
                        }
                    },
                    trigger: 'blur'
                }
            ]
        };

        const isAdmin = computed(() => Auth.isAdmin());
        
        const activeMenu = computed(() => {
            if (currentPage.value.startsWith('/admin')) return '/admin';
            if (currentPage.value.startsWith('/my-courses')) return '/my-courses';
            if (currentPage.value.startsWith('/grades')) return '/grades';
            if (currentPage.value.startsWith('/reviews')) return '/reviews';
            return '/home';
        });
        
        const currentComponent = computed(() => {
            const page = currentPage.value;
            if (page.startsWith('/admin')) return AdminPage;
            if (page.startsWith('/my-courses')) return MyCoursesPage;
            if (page.startsWith('/grades')) return GradesPage;
            if (page.startsWith('/reviews')) return ReviewsPage;
            return HomePage;
        });

        const getRoleText = (role) => {
            const map = {
                'student': '学生',
                'teacher': '教师',
                'admin': '管理员'
            };
            return map[role] || '未知';
        };
        
        const getRoleTagType = (role) => {
            const map = {
                'student': 'success',
                'teacher': 'primary',
                'admin': 'danger'
            };
            return map[role] || 'info';
        };
        
        const handleMenuSelect = (index) => {
            Router.navigate(index);
        };
        
        const handleCommand = (command) => {
            switch (command) {
                case 'profile':
                    openProfile();
                    break;
                case 'password':
                    openPassword();
                    break;
                case 'logout':
                    handleLogout();
                    break;
            }
        };
        
        const openProfile = () => {
            const user = Auth.getCurrentUser();
            Object.assign(profileForm, {
                id: user.id,
                username: user.username,
                real_name: user.real_name,
                role: user.role,
                student_no: user.student_no || '',
                teacher_no: user.teacher_no || '',
                department: user.department || '',
                major: user.major || '',
                class_name: user.class_name || '',
                grade: user.grade || '',
                email: user.email || '',
                phone: user.phone || ''
            });
            profileDialogVisible.value = true;
        };
        
        const saveProfile = async () => {
            submitting.value = true;
            try {
                const data = {
                    real_name: profileForm.real_name,
                    student_no: profileForm.student_no,
                    teacher_no: profileForm.teacher_no,
                    department: profileForm.department,
                    major: profileForm.major,
                    class_name: profileForm.class_name,
                    grade: profileForm.grade,
                    email: profileForm.email,
                    phone: profileForm.phone
                };
                
                const response = await API.user.updateProfile(data);
                if (response.code === 0) {
                    Toast.success('资料更新成功');
                    Storage.setUser(response.data);
                    currentUser.value = response.data;
                    profileDialogVisible.value = false;
                } else {
                    Toast.error(response.msg);
                }
            } finally {
                submitting.value = false;
            }
        };
        
        const openPassword = () => {
            Object.assign(passwordForm, {
                old_password: '',
                new_password: '',
                confirm_password: ''
            });
            passwordDialogVisible.value = true;
        };
        
        const savePassword = async () => {
            if (!passwordFormRef.value) return;
            
            try {
                await passwordFormRef.value.validate();
            } catch (e) {
                return;
            }
            
            submitting.value = true;
            try {
                const response = await API.user.changePassword({
                    old_password: passwordForm.old_password,
                    new_password: passwordForm.new_password
                });
                if (response.code === 0) {
                    Toast.success('密码修改成功，请重新登录');
                    passwordDialogVisible.value = false;
                    handleLogout();
                } else {
                    Toast.error(response.msg);
                }
            } finally {
                submitting.value = false;
            }
        };
        
        const handleLogout = async () => {
            try {
                await Toast.confirm('确定要退出登录吗？');
            } catch (e) {
                return;
            }
            
            await Auth.logout();
            Toast.success('已退出登录');
            Router.navigate('/login');
        };
        
        onMounted(() => {
            if (!Auth.isLoggedIn()) {
                Router.navigate('/login');
            } else {
                const user = Auth.getCurrentUser();
                if (user.role === 'admin' && !currentPage.value.startsWith('/admin')) {
                    Router.navigate('/admin');
                }
            }
            
            window.addEventListener('hashchange', () => {
                currentPage.value = Router.currentRoute;
            });
        });

        return {
            currentUser,
            currentPage,
            activeMenu,
            currentComponent,
            isAdmin,
            profileDialogVisible,
            passwordDialogVisible,
            submitting,
            profileFormRef,
            passwordFormRef,
            profileForm,
            passwordForm,
            passwordRules,
            getRoleText,
            getRoleTagType,
            handleMenuSelect,
            handleCommand,
            saveProfile,
            savePassword
        };
    }
};

const App = {
    template: `
        <component :is="layoutComponent" />
    `,
    setup() {
        const currentPage = ref(window.location.hash.slice(1) || '/login');
        
        const layoutComponent = computed(() => {
            if (currentPage.value === '/login' || currentPage.value === '/register') {
                return currentPage.value === '/login' ? LoginPage : RegisterPage;
            }
            return MainLayout;
        });
        
        onMounted(() => {
            Router.register('/login', LoginPage);
            Router.register('/register', RegisterPage);
            Router.register('/home', HomePage);
            Router.register('/my-courses', MyCoursesPage);
            Router.register('/grades', GradesPage);
            Router.register('/reviews', ReviewsPage);
            Router.register('/admin', AdminPage);
            
            Router.init();
            
            window.addEventListener('hashchange', () => {
                currentPage.value = window.location.hash.slice(1) || '/login';
            });
        });
        
        return {
            layoutComponent
        };
    }
};

const app = createApp(App);

app.use(ElementPlus);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.mount('#app');