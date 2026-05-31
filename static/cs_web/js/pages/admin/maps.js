window.AdminMaps = {
    template: `
        <div>
            <div class="admin-sidebar">
                <div style="padding: 20px; text-align: center; border-bottom: 1px solid #1e293b;">
                    <h2 style="color: #e94560;">🔫 管理后台</h2>
                </div>
                <router-link to="/admin" class="nav-link">📊 数据概览</router-link>
                <router-link to="/admin/users" class="nav-link">👥 用户管理</router-link>
                <router-link to="/admin/weapons" class="nav-link">🔫 武器管理</router-link>
                <router-link to="/admin/maps" class="nav-link active">🗺️ 地图管理</router-link>
                <router-link to="/admin/statistics" class="nav-link">📈 数据统计</router-link>
                <div style="position: absolute; bottom: 20px; left: 20px; right: 20px;">
                    <a class="nav-link" @click="backToHome" style="cursor: pointer;">← 返回首页</a>
                </div>
            </div>

            <div class="admin-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h1 class="page-title" style="margin: 0;">地图管理</h1>
                    <button class="btn btn-primary" @click="showAddModal = true">+ 添加地图</button>
                </div>

                <div class="card">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>名称</th>
                                <th>类型</th>
                                <th>最大人数</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="map in maps" :key="map.id">
                                <td>{{ map.id }}</td>
                                <td>{{ map.name }}</td>
                                <td>{{ map.type }}</td>
                                <td>{{ map.max_players }}</td>
                                <td>
                                    <span class="badge" :class="map.is_active ? 'badge-success' : 'badge-danger'">
                                        {{ map.is_active ? '启用' : '禁用' }}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; margin-right: 5px;" 
                                            @click="editMap(map)">编辑</button>
                                    <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" 
                                            @click="deleteMap(map.id)">删除</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-if="showAddModal || showEditModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>{{ showAddModal ? '添加地图' : '编辑地图' }}</h3>
                        <button class="close" @click="closeModal">&times;</button>
                    </div>
                    <div class="form-group">
                        <label>名称</label>
                        <input type="text" v-model="form.name">
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>类型</label>
                            <input type="text" v-model="form.type" placeholder="bomb/deathmatch">
                        </div>
                        <div class="form-group">
                            <label>最大人数</label>
                            <input type="number" v-model="form.max_players">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>描述</label>
                        <input type="text" v-model="form.description">
                    </div>
                    <button class="btn btn-primary" @click="saveMap">保存</button>
                </div>
            </div>
        </div>

        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
            {{ toast.message }}
        </div>
    `,
    setup() {
        const router = useRouter();
        const maps = ref([]);
        const showAddModal = ref(false);
        const showEditModal = ref(false);
        const editingId = ref(null);
        const form = reactive({
            name: '',
            type: 'bomb',
            max_players: 10,
            description: ''
        });

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

        const resetForm = () => {
            form.name = '';
            form.type = 'bomb';
            form.max_players = 10;
            form.description = '';
        };

        const loadMaps = async () => {
            const res = await API.map.getList(0, 100);
            if (res.code === 200) {
                maps.value = res.data || [];
            }
        };

        const editMap = (map) => {
            editingId.value = map.id;
            Object.assign(form, map);
            showEditModal.value = true;
        };

        const closeModal = () => {
            showAddModal.value = false;
            showEditModal.value = false;
            editingId.value = null;
            resetForm();
        };

        const saveMap = async () => {
            if (!form.name) {
                showToast('请填写地图名称', 'error');
                return;
            }

            if (showAddModal.value) {
                const res = await API.map.create(form);
                if (res.code === 200) {
                    showToast('添加成功');
                    closeModal();
                    loadMaps();
                } else {
                    showToast(res.message, 'error');
                }
            } else {
                const res = await API.map.update(editingId.value, form);
                if (res.code === 200) {
                    showToast('更新成功');
                    closeModal();
                    loadMaps();
                } else {
                    showToast(res.message, 'error');
                }
            }
        };

        const deleteMap = async (id) => {
            if (!confirm('确定要删除该地图吗？')) return;
            const res = await API.map.delete(id);
            if (res.code === 200) {
                showToast('删除成功');
                loadMaps();
            } else {
                showToast(res.message, 'error');
            }
        };

        const backToHome = () => {
            router.push('/home');
        };

        onMounted(() => {
            loadMaps();
        });

        return {
            maps, showAddModal, showEditModal, form, toast,
            editMap, closeModal, saveMap, deleteMap, backToHome
        };
    }
};
