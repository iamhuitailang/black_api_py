window.AdminUsers = {
    template: `
        <div>
            <div class="admin-sidebar">
                <div style="padding: 20px; text-align: center; border-bottom: 1px solid #1e293b;">
                    <h2 style="color: #e94560;">🔫 管理后台</h2>
                </div>
                <router-link to="/admin" class="nav-link">📊 数据概览</router-link>
                <router-link to="/admin/users" class="nav-link active">👥 用户管理</router-link>
                <router-link to="/admin/weapons" class="nav-link">🔫 武器管理</router-link>
                <router-link to="/admin/maps" class="nav-link">🗺️ 地图管理</router-link>
                <router-link to="/admin/statistics" class="nav-link">📈 数据统计</router-link>
                <div style="position: absolute; bottom: 20px; left: 20px; right: 20px;">
                    <a class="nav-link" @click="backToHome" style="cursor: pointer;">← 返回首页</a>
                </div>
            </div>

            <div class="admin-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h1 class="page-title" style="margin: 0;">用户管理</h1>
                </div>

                <div class="card">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>用户名</th>
                                <th>昵称</th>
                                <th>邮箱</th>
                                <th>角色</th>
                                <th>总击杀</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in users" :key="user.id">
                                <td>{{ user.id }}</td>
                                <td>{{ user.username }}</td>
                                <td>{{ user.nickname || '-' }}</td>
                                <td>{{ user.email || '-' }}</td>
                                <td>
                                    <span class="badge" :class="user.role === 'admin' ? 'badge-warning' : 'badge-success'">
                                        {{ user.role }}
                                    </span>
                                </td>
                                <td>{{ user.total_kills }}</td>
                                <td>
                                    <span class="badge" :class="user.is_active ? 'badge-success' : 'badge-danger'">
                                        {{ user.is_active ? '正常' : '禁用' }}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" 
                                            @click="deleteUser(user.id)">删除</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
            {{ toast.message }}
        </div>
    `,
    setup() {
        const router = useRouter();
        const users = ref([]);

        const toast = reactive({
            show: false,
            message: '',
            type: 'success'
        });

        const showToast = (message, type = 'success') => {
            toast.message = message;
            toast.type = type;
            toast.show = true;
            setTimeout(() => {
                toast.show = false;
            }, 3000);
        };

        const loadUsers = async () => {
            const res = await API.user.getList(0, 100);
            if (res.code === 200) {
                users.value = res.data || [];
            }
        };

        const deleteUser = async (id) => {
            if (!confirm('确定要删除该用户吗？')) return;
            const res = await API.user.delete(id);
            if (res.code === 200) {
                showToast('删除成功');
                loadUsers();
            } else {
                showToast(res.message, 'error');
            }
        };

        const backToHome = () => {
            router.push('/home');
        };

        onMounted(() => {
            loadUsers();
        });

        return { users, toast, deleteUser, backToHome };
    }
};
