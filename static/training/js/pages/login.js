const LoginPage = {
    setup() {
        const employees = VueApi.ref([]);
        const selectedRole = VueApi.ref('employee');
        const selectedEmployeeId = VueApi.ref(null);
        const loading = VueApi.ref(false);

        const loadEmployees = async () => {
            loading.value = true;
            try {
                const res = await Api.getEmployees();
                if (res.code === 0) {
                    employees.value = res.data || [];
                }
            } finally {
                loading.value = false;
            }
        };

        const filteredEmployees = VueApi.computed(() => {
            return employees.value.filter(e => e.role === selectedRole.value);
        });

        const login = async () => {
            if (!selectedEmployeeId.value) {
                Utils.showToast('请选择用户', 'warning');
                return;
            }
            const emp = employees.value.find(e => e.id === selectedEmployeeId.value);
            if (emp) {
                Utils.setCurrentUser(emp);
                GlobalStore.currentUser = emp;
                GlobalStore.currentPage = emp.role === 'hr' ? 'hr-courses' : 'emp-courses';
                Utils.showToast(`欢迎，${emp.name}！`, 'success');
            }
        };

        VueApi.onMounted(() => {
            loadEmployees();
        });

        return {
            employees, selectedRole, selectedEmployeeId, loading,
            filteredEmployees, login
        };
    },
    template: `
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <div class="login-logo">培</div>
                    <h1 class="login-title">企业培训管理系统</h1>
                    <p class="login-subtitle">Enterprise Training Management</p>
                </div>
                
                <div class="role-selector">
                    <div class="role-card" :class="{ active: selectedRole === 'employee' }" @click="selectedRole = 'employee'; selectedEmployeeId = null;">
                        <div class="role-icon">👤</div>
                        <div class="role-name">员工登录</div>
                    </div>
                    <div class="role-card" :class="{ active: selectedRole === 'hr' }" @click="selectedRole = 'hr'; selectedEmployeeId = null;">
                        <div class="role-icon">👔</div>
                        <div class="role-name">HR登录</div>
                    </div>
                </div>

                <div class="form-group" v-if="filteredEmployees.length > 0">
                    <label class="form-label">选择用户</label>
                    <select class="select-control" v-model="selectedEmployeeId">
                        <option :value="null" disabled>请选择用户</option>
                        <option v-for="emp in filteredEmployees" :key="emp.id" :value="emp.id">
                            {{ emp.name }} - {{ emp.department }} ({{ emp.employee_id }})
                        </option>
                    </select>
                </div>

                <div class="empty-state" v-else-if="!loading">
                    <div class="empty-icon">👥</div>
                    <p>暂无{{ selectedRole === 'hr' ? 'HR' : '员工' }}用户</p>
                </div>

                <button class="btn btn-primary w-100 mt-2" :disabled="!selectedEmployeeId" @click="login" style="width:100%;padding:12px;margin-top:16px;">
                    {{ loading ? '加载中...' : '登 录' }}
                </button>
            </div>
        </div>
    `
};

window.LoginPage = LoginPage;
