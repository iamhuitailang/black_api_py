window.AdminWeapons = {
    template: `
        <div>
            <div class="admin-sidebar">
                <div style="padding: 20px; text-align: center; border-bottom: 1px solid #1e293b;">
                    <h2 style="color: #e94560;">🔫 管理后台</h2>
                </div>
                <router-link to="/admin" class="nav-link">📊 数据概览</router-link>
                <router-link to="/admin/users" class="nav-link">👥 用户管理</router-link>
                <router-link to="/admin/weapons" class="nav-link active">🔫 武器管理</router-link>
                <router-link to="/admin/maps" class="nav-link">🗺️ 地图管理</router-link>
                <router-link to="/admin/statistics" class="nav-link">📈 数据统计</router-link>
                <div style="position: absolute; bottom: 20px; left: 20px; right: 20px;">
                    <a class="nav-link" @click="backToHome" style="cursor: pointer;">← 返回首页</a>
                </div>
            </div>

            <div class="admin-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h1 class="page-title" style="margin: 0;">武器管理</h1>
                    <button class="btn btn-primary" @click="showAddModal = true">+ 添加武器</button>
                </div>

                <div class="card">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>名称</th>
                                <th>类型</th>
                                <th>伤害</th>
                                <th>射速</th>
                                <th>弹夹</th>
                                <th>换弹</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="weapon in weapons" :key="weapon.id">
                                <td>{{ weapon.id }}</td>
                                <td>{{ weapon.name }}</td>
                                <td>{{ weapon.type }}</td>
                                <td>{{ weapon.damage }}</td>
                                <td>{{ weapon.fire_rate }}</td>
                                <td>{{ weapon.magazine_size }}</td>
                                <td>{{ weapon.reload_time }}s</td>
                                <td>
                                    <span class="badge" :class="weapon.is_active ? 'badge-success' : 'badge-danger'">
                                        {{ weapon.is_active ? '启用' : '禁用' }}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; margin-right: 5px;" 
                                            @click="editWeapon(weapon)">编辑</button>
                                    <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" 
                                            @click="deleteWeapon(weapon.id)">删除</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-if="showAddModal || showEditModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>{{ showAddModal ? '添加武器' : '编辑武器' }}</h3>
                        <button class="close" @click="closeModal">&times;</button>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>名称</label>
                            <input type="text" v-model="form.name">
                        </div>
                        <div class="form-group">
                            <label>类型</label>
                            <input type="text" v-model="form.type" placeholder="rifle/smg/pistol/sniper">
                        </div>
                        <div class="form-group">
                            <label>伤害</label>
                            <input type="number" v-model="form.damage">
                        </div>
                        <div class="form-group">
                            <label>射速</label>
                            <input type="number" step="0.01" v-model="form.fire_rate">
                        </div>
                        <div class="form-group">
                            <label>弹夹容量</label>
                            <input type="number" v-model="form.magazine_size">
                        </div>
                        <div class="form-group">
                            <label>换弹时间(s)</label>
                            <input type="number" step="0.1" v-model="form.reload_time">
                        </div>
                        <div class="form-group">
                            <label>精准度</label>
                            <input type="number" step="0.01" v-model="form.accuracy">
                        </div>
                        <div class="form-group">
                            <label>后坐力</label>
                            <input type="number" step="0.01" v-model="form.recoil">
                        </div>
                        <div class="form-group">
                            <label>价格</label>
                            <input type="number" v-model="form.price">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>描述</label>
                        <input type="text" v-model="form.description">
                    </div>
                    <button class="btn btn-primary" @click="saveWeapon">保存</button>
                </div>
            </div>
        </div>

        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
            {{ toast.message }}
        </div>
    `,
    setup() {
        const router = useRouter();
        const weapons = ref([]);
        const showAddModal = ref(false);
        const showEditModal = ref(false);
        const editingId = ref(null);
        const form = reactive({
            name: '',
            type: 'rifle',
            damage: 30,
            fire_rate: 0.1,
            magazine_size: 30,
            reload_time: 2.0,
            accuracy: 0.8,
            recoil: 0.2,
            price: 1000,
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
            form.type = 'rifle';
            form.damage = 30;
            form.fire_rate = 0.1;
            form.magazine_size = 30;
            form.reload_time = 2.0;
            form.accuracy = 0.8;
            form.recoil = 0.2;
            form.price = 1000;
            form.description = '';
        };

        const loadWeapons = async () => {
            const res = await API.weapon.getList(0, 100);
            if (res.code === 200) {
                weapons.value = res.data || [];
            }
        };

        const editWeapon = (weapon) => {
            editingId.value = weapon.id;
            Object.assign(form, weapon);
            showEditModal.value = true;
        };

        const closeModal = () => {
            showAddModal.value = false;
            showEditModal.value = false;
            editingId.value = null;
            resetForm();
        };

        const saveWeapon = async () => {
            if (!form.name) {
                showToast('请填写武器名称', 'error');
                return;
            }

            if (showAddModal.value) {
                const res = await API.weapon.create(form);
                if (res.code === 200) {
                    showToast('添加成功');
                    closeModal();
                    loadWeapons();
                } else {
                    showToast(res.message, 'error');
                }
            } else {
                const res = await API.weapon.update(editingId.value, form);
                if (res.code === 200) {
                    showToast('更新成功');
                    closeModal();
                    loadWeapons();
                } else {
                    showToast(res.message, 'error');
                }
            }
        };

        const deleteWeapon = async (id) => {
            if (!confirm('确定要删除该武器吗？')) return;
            const res = await API.weapon.delete(id);
            if (res.code === 200) {
                showToast('删除成功');
                loadWeapons();
            } else {
                showToast(res.message, 'error');
            }
        };

        const backToHome = () => {
            router.push('/home');
        };

        onMounted(() => {
            loadWeapons();
        });

        return {
            weapons, showAddModal, showEditModal, form, toast,
            editWeapon, closeModal, saveWeapon, deleteWeapon, backToHome
        };
    }
};
