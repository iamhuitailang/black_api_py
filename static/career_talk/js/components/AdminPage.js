(function() {
    const ref = Vue.ref;
    const watch = Vue.watch;
    const onMounted = Vue.onMounted;

    const AdminPage = {
        name: 'AdminPage',
        setup() {
        const TALK_DRAFT_KEY = 'career_talk_admin_form';
        const talkList = ref([]);
        const loading = ref(false);
        const showModal = ref(false);
        const modalMode = ref('create');
        const currentTalk = ref(null);
        const formData = ref({
            company_name: '',
            talk_time: '',
            location: '',
            description: '',
            short_code: '',
            status: 1
        });

        const saveFormDraft = () => {
            if (modalMode.value !== 'create') return;
            localStorage.setItem(TALK_DRAFT_KEY, JSON.stringify({
                ...formData.value,
                timestamp: Date.now()
            }));
        };

        const loadFormDraft = () => {
            try {
                const raw = localStorage.getItem(TALK_DRAFT_KEY);
                if (!raw) return null;
                const draft = JSON.parse(raw);
                if (Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
                    localStorage.removeItem(TALK_DRAFT_KEY);
                    return null;
                }
                const { timestamp, ...data } = draft;
                return data;
            } catch (e) { return null; }
        };

        const clearFormDraft = () => {
            localStorage.removeItem(TALK_DRAFT_KEY);
        };

        watch(() => formData.value, saveFormDraft, { deep: true });
        watch(showModal, (val) => {
            if (!val) clearFormDraft();
        });

        const loadTalkList = async () => {
            loading.value = true;
            try {
                const result = await CareerTalkApi.getTalkList(1, 100);
                if (result.code === 0) {
                    talkList.value = result.data.items || [];
                }
            } catch (error) {
                Toast.error('加载失败');
            } finally {
                loading.value = false;
            }
        };

        const openCreateModal = () => {
            modalMode.value = 'create';
            const draft = loadFormDraft();
            formData.value = draft || {
                company_name: '',
                talk_time: '',
                location: '',
                description: '',
                short_code: '',
                status: 1
            };
            showModal.value = true;
        };

        const openEditModal = (talk) => {
            modalMode.value = 'edit';
            currentTalk.value = talk;
            formData.value = {
                company_name: talk.company_name,
                talk_time: talk.talk_time,
                location: talk.location,
                description: talk.description || '',
                short_code: talk.short_code || '',
                status: talk.status
            };
            showModal.value = true;
        };

        const handleSubmit = async () => {
            if (!formData.value.company_name.trim()) {
                Toast.error('请输入公司名称');
                return;
            }
            if (!formData.value.talk_time.trim()) {
                Toast.error('请输入宣讲时间');
                return;
            }
            if (!formData.value.location.trim()) {
                Toast.error('请输入宣讲地点');
                return;
            }

            loading.value = true;
            try {
                let result;
                if (modalMode.value === 'create') {
                    result = await CareerTalkApi.createTalk(formData.value);
                } else {
                    result = await CareerTalkApi.updateTalk({
                        id: currentTalk.value.id,
                        ...formData.value
                    });
                }

                if (result.code === 0) {
                    Toast.success(modalMode.value === 'create' ? '创建成功' : '更新成功');
                    clearFormDraft();
                    showModal.value = false;
                    loadTalkList();
                } else {
                    Toast.error(result.message || '操作失败');
                }
            } catch (error) {
                Toast.error('网络错误，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        const handleDelete = async (talk) => {
            if (!confirm(`确定要删除「${talk.company_name}」宣讲会吗？`)) {
                return;
            }

            try {
                const result = await CareerTalkApi.deleteTalk(talk.id);
                if (result.code === 0) {
                    Toast.success('删除成功');
                    loadTalkList();
                } else {
                    Toast.error(result.message || '删除失败');
                }
            } catch (error) {
                Toast.error('网络错误，请稍后重试');
            }
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        onMounted(() => {
            loadTalkList();
        });

        return {
            talkList,
            loading,
            showModal,
            modalMode,
            formData,
            loadTalkList,
            openCreateModal,
            openEditModal,
            handleSubmit,
            handleDelete,
            formatDate
        };
    },
    template: `
        <div>
            <div class="page-header">
                <h2>⚙️ 宣讲会管理</h2>
                <button class="btn btn-primary" @click="openCreateModal">
                    + 新增宣讲会
                </button>
            </div>

            <div class="card">
                <div class="card-body" style="padding: 0;">
                    <div v-if="loading" class="empty-state">
                        <p>加载中...</p>
                    </div>

                    <div v-else-if="talkList.length === 0" class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                        </svg>
                        <p>暂无宣讲会，请点击上方按钮新增</p>
                    </div>

                    <table v-else class="management-table">
                        <thead>
                            <tr>
                                <th>公司名称</th>
                                <th>宣讲时间</th>
                                <th>地点</th>
                                <th>短码</th>
                                <th>报名/签到</th>
                                <th>状态</th>
                                <th style="width: 160px;">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="talk in talkList" :key="talk.id">
                                <td>
                                    <strong>{{ talk.company_name }}</strong>
                                </td>
                                <td>{{ formatDate(talk.talk_time) }}</td>
                                <td>{{ talk.location }}</td>
                                <td>
                                    <span class="badge badge-info" style="font-family: monospace;">
                                        {{ talk.short_code }}
                                    </span>
                                </td>
                                <td>
                                    <span style="color: var(--primary-color);">{{ talk.registration_count }}</span>
                                    /
                                    <span style="color: var(--success-color);">{{ talk.checkin_count }}</span>
                                </td>
                                <td>
                                    <span 
                                        class="badge"
                                        :class="talk.status === 1 ? 'badge-success' : 'badge-danger'"
                                    >
                                        {{ talk.status === 1 ? '进行中' : '已结束' }}
                                    </span>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button 
                                            class="action-btn"
                                            @click="openEditModal(talk)"
                                        >
                                            编辑
                                        </button>
                                        <button 
                                            class="action-btn delete"
                                            @click="handleDelete(talk)"
                                        >
                                            删除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-if="showModal" class="modal-overlay show" @click.self="showModal = false">
                <div class="modal" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            {{ modalMode === 'create' ? '新增宣讲会' : '编辑宣讲会' }}
                        </h3>
                        <button class="modal-close" @click="showModal = false">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">
                                公司名称<span class="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="formData.company_name"
                                placeholder="请输入公司名称"
                            >
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">
                                    宣讲时间<span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="formData.talk_time"
                                    placeholder="例如：2024-07-01 14:00:00"
                                >
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    宣讲地点<span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="formData.location"
                                    placeholder="请输入宣讲地点"
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">
                                签到短码
                            </label>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="formData.short_code"
                                placeholder="留空则自动生成6位短码"
                                maxlength="10"
                                style="text-transform: uppercase; letter-spacing: 2px;"
                            >
                            <p style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">
                                短码用于学生快速签到，留空将自动生成6位随机短码
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">宣讲简介</label>
                            <textarea 
                                class="form-control" 
                                v-model="formData.description"
                                placeholder="请输入宣讲会简介"
                                rows="4"
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <select class="form-control" v-model="formData.status">
                                <option :value="1">进行中</option>
                                <option :value="0">已结束</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showModal = false">取消</button>
                        <button 
                            class="btn btn-primary" 
                            @click="handleSubmit"
                            :disabled="loading"
                        >
                            {{ loading ? '处理中...' : (modalMode === 'create' ? '创建' : '保存') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
    };

    window.AdminPage = AdminPage;
})();
