const { createApp, ref, computed, onMounted, reactive } = Vue;
const { createRouter, createWebHashHistory, useRouter } = VueRouter;

const LoginPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h2 class="auth-title">快递驿站系统</h2>
                <div class="form-group">
                    <label class="form-label">账号</label>
                    <input type="text" class="form-input" v-model="form.phone" placeholder="请输入手机号或admin">
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input type="password" class="form-input" v-model="form.password" placeholder="请输入密码">
                </div>
                <button class="form-btn" @click="handleLogin" :disabled="loading">
                    {{ loading ? '登录中...' : '登录' }}
                </button>
                <div class="auth-switch">
                    还没有账号？<a @click="goRegister">立即注册</a>
                </div>
                <div style="margin-top: 15px; font-size: 12px; color: #999; text-align: center;">
                    管理员账号: admin / admin123
                </div>
            </div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const form = reactive({
            phone: '',
            password: ''
        });
        const loading = ref(false);

        const handleLogin = async () => {
            if (!form.phone || !form.password) {
                alert('请输入账号和密码');
                return;
            }

            loading.value = true;
            const result = await api.user.login(form);
            loading.value = false;

            if (result.code === 0) {
                api.setToken(result.data.token);
                localStorage.setItem('kuaidi_user', JSON.stringify(result.data.user));
                window.location.reload();
            } else {
                alert(result.msg);
            }
        };

        const goRegister = () => {
            router.push('/register');
        };

        return { form, loading, handleLogin, goRegister };
    }
};

const RegisterPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h2 class="auth-title">用户注册</h2>
                <div class="form-group">
                    <label class="form-label">手机号</label>
                    <input type="text" class="form-input" v-model="form.phone" placeholder="请输入手机号">
                </div>
                <div class="form-group">
                    <label class="form-label">昵称</label>
                    <input type="text" class="form-input" v-model="form.nickname" placeholder="请输入昵称">
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input type="password" class="form-input" v-model="form.password" placeholder="请输入密码（至少6位）">
                </div>
                <button class="form-btn" @click="handleRegister" :disabled="loading">
                    {{ loading ? '注册中...' : '注册' }}
                </button>
                <div class="auth-switch">
                    已有账号？<a @click="goLogin">立即登录</a>
                </div>
            </div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const form = reactive({
            phone: '',
            nickname: '',
            password: ''
        });
        const loading = ref(false);

        const handleRegister = async () => {
            if (!form.phone || !form.password) {
                alert('请填写完整信息');
                return;
            }

            loading.value = true;
            const result = await api.user.register(form);
            loading.value = false;

            if (result.code === 0) {
                api.setToken(result.data.token);
                localStorage.setItem('kuaidi_user', JSON.stringify(result.data.user));
                window.location.reload();
            } else {
                alert(result.msg);
            }
        };

        const goLogin = () => {
            router.push('/login');
        };

        return { form, loading, handleRegister, goLogin };
    }
};

const UserPackagesPage = {
    template: `
        <div class="page-card">
            <h2 class="page-title">我的快递</h2>
            <div class="search-bar">
                <select class="search-select" v-model="status" @change="loadData">
                    <option :value="null">全部状态</option>
                    <option value="1">已入库</option>
                    <option value="2">已取件</option>
                    <option value="3">已超时</option>
                    <option value="4">已退回</option>
                </select>
            </div>
            <table class="table" v-if="packages.length > 0">
                <thead>
                    <tr>
                        <th>快递单号</th>
                        <th>快递公司</th>
                        <th>取件码</th>
                        <th>状态</th>
                        <th>入库时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in packages" :key="item.id">
                        <td>{{ item.tracking_number }}</td>
                        <td>{{ item.courier_company || '-' }}</td>
                        <td v-if="item.pickup_code"><strong style="font-size: 20px; letter-spacing: 2px;">{{ item.pickup_code.code }}</strong></td>
                        <td v-else>-</td>
                        <td>
                            <span class="status-tag" :class="getStatusClass(item.status)">
                                {{ item.status_text }}
                            </span>
                        </td>
                        <td>{{ item.stored_at ? item.stored_at.slice(0, 16) : '-' }}</td>
                        <td>
                            <div class="action-buttons">
                                <button v-if="item.status === 1 && !item.pickup_code" class="btn btn-primary btn-small" @click="generateCode(item.id)">
                                    获取取件码
                                </button>
                                <button v-if="item.status === 1" class="btn btn-warning btn-small" @click="createProxy(item.id)">
                                    申请代取
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="empty-state" v-else>
                <div class="empty-icon">📦</div>
                <div>暂无快递记录</div>
            </div>
            <div class="pagination" v-if="total > 0">
                <button class="pagination-btn" @click="prevPage" :disabled="page <= 1">上一页</button>
                <span class="pagination-text">{{ page }} / {{ total_pages }}</span>
                <button class="pagination-btn" @click="nextPage" :disabled="page >= total_pages">下一页</button>
            </div>
            
            <div class="modal-overlay" v-if="showCodeModal" @click.self="showCodeModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">取件码</span>
                        <button class="modal-close" @click="showCodeModal = false">&times;</button>
                    </div>
                    <div class="pickup-code-display" v-if="pickupCode">
                        <div class="pickup-code-title">您的取件码</div>
                        <div class="pickup-code">{{ pickupCode.code }}</div>
                        <div class="pickup-code-expire">有效期至：{{ pickupCode.expires_at.slice(0, 16) }}</div>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" v-if="showProxyModal" @click.self="showProxyModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">申请代取</span>
                        <button class="modal-close" @click="showProxyModal = false">&times;</button>
                    </div>
                    <div class="form-group">
                        <label class="form-label">备注</label>
                        <input type="text" class="form-input" v-model="proxyRemark" placeholder="请输入备注（可选）">
                    </div>
                    <div class="modal-footer">
                        <button class="btn" @click="showProxyModal = false">取消</button>
                        <button class="btn btn-primary" @click="submitProxy">提交申请</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const packages = ref([]);
        const page = ref(1);
        const page_size = ref(10);
        const total = ref(0);
        const total_pages = ref(0);
        const status = ref(null);
        const showCodeModal = ref(false);
        const pickupCode = ref(null);
        const showProxyModal = ref(false);
        const proxyRemark = ref('');
        const selectedPackageId = ref(0);

        const loadData = async () => {
            const result = await api.package.getMyPackages({
                page: page.value,
                page_size: page_size.value,
                status: status.value
            });
            if (result.code === 0) {
                packages.value = result.data.items;
                total.value = result.data.total;
                total_pages.value = result.data.total_pages;
            }
        };

        const getStatusClass = (s) => {
            const map = { 1: 'status-info', 2: 'status-success', 3: 'status-danger', 4: 'status-default' };
            return map[s] || 'status-default';
        };

        const prevPage = () => {
            if (page.value > 1) {
                page.value--;
                loadData();
            }
        };

        const nextPage = () => {
            if (page.value < total_pages.value) {
                page.value++;
                loadData();
            }
        };

        const generateCode = async (packageId) => {
            const result = await api.pickup.generateCode({ package_id: packageId });
            if (result.code === 0) {
                pickupCode.value = result.data;
                showCodeModal.value = true;
            } else {
                alert(result.msg);
            }
        };

        const createProxy = (packageId) => {
            selectedPackageId.value = packageId;
            proxyRemark.value = '';
            showProxyModal.value = true;
        };

        const submitProxy = async () => {
            const result = await api.proxy.create({
                package_id: selectedPackageId.value,
                remark: proxyRemark.value
            });
            if (result.code === 0) {
                alert('申请成功');
                showProxyModal.value = false;
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadData();
        });

        return {
            packages, page, page_size, total, total_pages, status,
            showCodeModal, pickupCode, showProxyModal, proxyRemark,
            loadData, getStatusClass, prevPage, nextPage, generateCode, createProxy, submitProxy
        };
    }
};

const UserPickupPage = {
    template: `
        <div class="page-card">
            <h2 class="page-title">取件码</h2>
            <div class="search-bar">
                <select class="search-select" v-model="status" @change="loadData">
                    <option :value="null">全部状态</option>
                    <option value="0">未使用</option>
                    <option value="1">已使用</option>
                    <option value="2">已过期</option>
                </select>
            </div>
            <table class="table" v-if="codes.length > 0">
                <thead>
                    <tr>
                        <th>取件码</th>
                        <th>快递单号</th>
                        <th>状态</th>
                        <th>过期时间</th>
                        <th>使用时间</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in codes" :key="item.id">
                        <td><strong style="font-size: 20px; letter-spacing: 2px;">{{ item.code }}</strong></td>
                        <td>{{ item.package?.tracking_number || '-' }}</td>
                        <td>
                            <span class="status-tag" :class="getStatusClass(item.status)">
                                {{ item.status_text }}
                            </span>
                        </td>
                        <td>{{ item.expires_at ? item.expires_at.slice(0, 16) : '-' }}</td>
                        <td>{{ item.used_at ? item.used_at.slice(0, 16) : '-' }}</td>
                    </tr>
                </tbody>
            </table>
            <div class="empty-state" v-else>
                <div class="empty-icon">🎫</div>
                <div>暂无取件码记录</div>
            </div>
            <div class="pagination" v-if="total > 0">
                <button class="pagination-btn" @click="prevPage" :disabled="page <= 1">上一页</button>
                <span class="pagination-text">{{ page }} / {{ total_pages }}</span>
                <button class="pagination-btn" @click="nextPage" :disabled="page >= total_pages">下一页</button>
            </div>
        </div>
    `,
    setup() {
        const codes = ref([]);
        const page = ref(1);
        const page_size = ref(10);
        const total = ref(0);
        const total_pages = ref(0);
        const status = ref(null);

        const loadData = async () => {
            const result = await api.pickup.getMyCodes({
                page: page.value,
                page_size: page_size.value,
                status: status.value
            });
            if (result.code === 0) {
                codes.value = result.data.items;
                total.value = result.data.total;
                total_pages.value = result.data.total_pages;
            }
        };

        const getStatusClass = (s) => {
            const map = { 0: 'status-info', 1: 'status-success', 2: 'status-danger' };
            return map[s] || 'status-default';
        };

        const prevPage = () => {
            if (page.value > 1) {
                page.value--;
                loadData();
            }
        };

        const nextPage = () => {
            if (page.value < total_pages.value) {
                page.value++;
                loadData();
            }
        };

        onMounted(() => {
            loadData();
        });

        return { codes, page, page_size, total, total_pages, status, loadData, getStatusClass, prevPage, nextPage };
    }
};

const UserProxyPage = {
    template: `
        <div class="page-card">
            <h2 class="page-title">代取件</h2>
            <div class="tabs">
                <div class="tab-item" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'; loadData();">
                    我发起的
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'proxies' }" @click="activeTab = 'proxies'; loadData();">
                    我接收的
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'; loadData();">
                    待接单
                </div>
            </div>
            <table class="table" v-if="items.length > 0">
                <thead>
                    <tr>
                        <th>快递单号</th>
                        <th>发起人</th>
                        <th>接单人</th>
                        <th>状态</th>
                        <th>创建时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in items" :key="item.id">
                        <td>{{ item.package?.tracking_number || '-' }}</td>
                        <td>{{ item.requester?.nickname || '-' }}</td>
                        <td>{{ item.proxy_user?.nickname || '-' }}</td>
                        <td>
                            <span class="status-tag" :class="getStatusClass(item.status)">
                                {{ item.status_text }}
                            </span>
                        </td>
                        <td>{{ item.created_at ? item.created_at.slice(0, 16) : '-' }}</td>
                        <td>
                            <div class="action-buttons">
                                <button v-if="activeTab === 'requests' && item.status === 0" 
                                        class="btn btn-danger btn-small" @click="cancelProxy(item.id)">
                                    取消
                                </button>
                                <button v-if="activeTab === 'pending' && item.status === 0" 
                                        class="btn btn-success btn-small" @click="acceptProxy(item.id)">
                                    接单
                                </button>
                                <button v-if="activeTab === 'proxies' && item.status === 1" 
                                        class="btn btn-primary btn-small" @click="completeProxy(item.id)">
                                    完成
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="empty-state" v-else>
                <div class="empty-icon">🤝</div>
                <div>暂无记录</div>
            </div>
            <div class="pagination" v-if="total > 0">
                <button class="pagination-btn" @click="prevPage" :disabled="page <= 1">上一页</button>
                <span class="pagination-text">{{ page }} / {{ total_pages }}</span>
                <button class="pagination-btn" @click="nextPage" :disabled="page >= total_pages">下一页</button>
            </div>
        </div>
    `,
    setup() {
        const items = ref([]);
        const page = ref(1);
        const page_size = ref(10);
        const total = ref(0);
        const total_pages = ref(0);
        const activeTab = ref('requests');

        const loadData = async () => {
            let result;
            if (activeTab.value === 'requests') {
                result = await api.proxy.getMyRequests({ page: page.value, page_size: page_size.value });
            } else if (activeTab.value === 'proxies') {
                result = await api.proxy.getMyProxies({ page: page.value, page_size: page_size.value });
            } else {
                result = await api.proxy.getPending({ page: page.value, page_size: page_size.value });
            }
            if (result.code === 0) {
                items.value = result.data.items;
                total.value = result.data.total;
                total_pages.value = result.data.total_pages;
            }
        };

        const getStatusClass = (s) => {
            const map = { 0: 'status-warning', 1: 'status-info', 2: 'status-success', 3: 'status-danger', 4: 'status-default' };
            return map[s] || 'status-default';
        };

        const prevPage = () => {
            if (page.value > 1) {
                page.value--;
                loadData();
            }
        };

        const nextPage = () => {
            if (page.value < total_pages.value) {
                page.value++;
                loadData();
            }
        };

        const cancelProxy = async (id) => {
            if (!confirm('确定取消吗？')) return;
            const result = await api.proxy.cancel({ proxy_id: id });
            if (result.code === 0) {
                alert('取消成功');
                loadData();
            } else {
                alert(result.msg);
            }
        };

        const acceptProxy = async (id) => {
            const result = await api.proxy.accept({ proxy_id: id });
            if (result.code === 0) {
                alert('接单成功');
                loadData();
            } else {
                alert(result.msg);
            }
        };

        const completeProxy = async (id) => {
            const result = await api.proxy.complete({ proxy_id: id });
            if (result.code === 0) {
                alert('完成成功');
                loadData();
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadData();
        });

        return { items, page, page_size, total, total_pages, activeTab, loadData, getStatusClass, prevPage, nextPage, cancelProxy, acceptProxy, completeProxy };
    }
};

const UserMessagesPage = {
    template: `
        <div class="page-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 class="page-title" style="margin: 0;">消息中心</h2>
                <button class="btn btn-primary btn-small" @click="markAllRead">全部已读</button>
            </div>
            <div v-if="messages.length > 0">
                <div v-for="item in messages" :key="item.id" 
                     class="message-item" 
                     :class="{ unread: item.status === 0 }"
                     @click="readMessage(item)">
                    <div class="message-title">
                        {{ item.title }}
                        <span v-if="item.status === 0" class="badge">NEW</span>
                    </div>
                    <div class="message-content">{{ item.content }}</div>
                    <div class="message-time">{{ item.created_at ? item.created_at.slice(0, 16) : '' }}</div>
                </div>
            </div>
            <div class="empty-state" v-else>
                <div class="empty-icon">💬</div>
                <div>暂无消息</div>
            </div>
            <div class="pagination" v-if="total > 0">
                <button class="pagination-btn" @click="prevPage" :disabled="page <= 1">上一页</button>
                <span class="pagination-text">{{ page }} / {{ total_pages }}</span>
                <button class="pagination-btn" @click="nextPage" :disabled="page >= total_pages">下一页</button>
            </div>
        </div>
    `,
    setup() {
        const messages = ref([]);
        const page = ref(1);
        const page_size = ref(10);
        const total = ref(0);
        const total_pages = ref(0);

        const loadData = async () => {
            const result = await api.message.getMyMessages({
                page: page.value,
                page_size: page_size.value
            });
            if (result.code === 0) {
                messages.value = result.data.items;
                total.value = result.data.total;
                total_pages.value = result.data.total_pages;
            }
        };

        const readMessage = async (item) => {
            if (item.status === 0) {
                await api.message.markAsRead({ message_id: item.id });
                item.status = 1;
            }
        };

        const markAllRead = async () => {
            await api.message.markAllAsRead();
            messages.value.forEach(m => m.status = 1);
        };

        const prevPage = () => {
            if (page.value > 1) {
                page.value--;
                loadData();
            }
        };

        const nextPage = () => {
            if (page.value < total_pages.value) {
                page.value++;
                loadData();
            }
        };

        onMounted(() => {
            loadData();
        });

        return { messages, page, page_size, total, total_pages, loadData, readMessage, markAllRead, prevPage, nextPage };
    }
};

const AdminDashboardPage = {
    template: `
        <div>
            <h2 class="page-title">数据统计</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-title">快递总数</div>
                    <div class="stat-value stat-primary">{{ stats.total || 0 }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">待取件</div>
                    <div class="stat-value stat-warning">{{ stats.stored || 0 }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">已取件</div>
                    <div class="stat-value stat-success">{{ stats.picked || 0 }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">已超时</div>
                    <div class="stat-value stat-danger">{{ stats.overdue || 0 }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">今日入库</div>
                    <div class="stat-value stat-primary">{{ stats.today_stored || 0 }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">今日取件</div>
                    <div class="stat-value stat-success">{{ stats.today_picked || 0 }}</div>
                </div>
            </div>
            
            <div class="page-card" style="margin-top: 20px;">
                <h3 class="page-title">快速取件验证</h3>
                <div class="search-bar">
                    <input type="text" class="search-input" v-model="pickupCode" placeholder="请输入6位取件码" maxlength="6">
                    <button class="btn btn-primary" @click="verifyPickup">验证取件</button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const stats = ref({});
        const pickupCode = ref('');

        const loadData = async () => {
            const result = await api.package.getStatistics();
            if (result.code === 0) {
                stats.value = result.data;
            }
        };

        const verifyPickup = async () => {
            if (!pickupCode.value) {
                alert('请输入取件码');
                return;
            }
            const result = await api.pickup.verify({ code: pickupCode.value });
            if (result.code === 0) {
                alert('取件成功！');
                pickupCode.value = '';
                loadData();
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadData();
        });

        return { stats, pickupCode, verifyPickup };
    }
};

const AdminPackagesPage = {
    template: `
        <div class="page-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 class="page-title" style="margin: 0;">快递管理</h2>
                <button class="btn btn-primary" @click="showAddModal = true">录入快递</button>
            </div>
            <div class="search-bar">
                <input type="text" class="search-input" v-model="keyword" placeholder="搜索单号/姓名/电话">
                <select class="search-select" v-model="status" @change="loadData">
                    <option :value="null">全部状态</option>
                    <option value="1">已入库</option>
                    <option value="2">已取件</option>
                    <option value="3">已超时</option>
                    <option value="4">已退回</option>
                </select>
                <button class="btn btn-primary" @click="loadData">搜索</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>快递单号</th>
                        <th>快递公司</th>
                        <th>收件人</th>
                        <th>电话</th>
                        <th>取件码</th>
                        <th>状态</th>
                        <th>入库时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in packages" :key="item.id">
                        <td>{{ item.tracking_number }}</td>
                        <td>{{ item.courier_company || '-' }}</td>
                        <td>{{ item.recipient_name }}</td>
                        <td>{{ item.recipient_phone }}</td>
                        <td v-if="item.pickup_code"><strong style="font-size: 18px; letter-spacing: 2px;">{{ item.pickup_code.code }}</strong></td>
                        <td v-else>-</td>
                        <td>
                            <span class="status-tag" :class="getStatusClass(item.status)">
                                {{ item.status_text }}
                            </span>
                        </td>
                        <td>{{ item.stored_at ? item.stored_at.slice(0, 16) : '-' }}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-warning btn-small" @click="editPackage(item)">编辑</button>
                                <button v-if="item.status === 1" class="btn btn-danger btn-small" @click="deletePackage(item.id)">删除</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="pagination" v-if="total > 0">
                <button class="pagination-btn" @click="prevPage" :disabled="page <= 1">上一页</button>
                <span class="pagination-text">{{ page }} / {{ total_pages }}</span>
                <button class="pagination-btn" @click="nextPage" :disabled="page >= total_pages">下一页</button>
            </div>

            <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">{{ editingId ? '编辑快递' : '录入快递' }}</span>
                        <button class="modal-close" @click="closeModal">&times;</button>
                    </div>
                    <div class="form-group">
                        <label class="form-label">快递单号 *</label>
                        <input type="text" class="form-input" v-model="form.tracking_number" placeholder="请输入快递单号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">快递公司</label>
                        <input type="text" class="form-input" v-model="form.courier_company" placeholder="请输入快递公司">
                    </div>
                    <div class="form-group">
                        <label class="form-label">收件人姓名 *</label>
                        <input type="text" class="form-input" v-model="form.recipient_name" placeholder="请输入收件人姓名">
                    </div>
                    <div class="form-group">
                        <label class="form-label">收件人电话 *</label>
                        <input type="text" class="form-input" v-model="form.recipient_phone" placeholder="请输入收件人电话">
                    </div>
                    <div class="form-group">
                        <label class="form-label">柜号</label>
                        <input type="text" class="form-input" v-model="form.cabinet_number" placeholder="请输入柜号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">货架号</label>
                        <input type="text" class="form-input" v-model="form.shelf_number" placeholder="请输入货架号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">备注</label>
                        <input type="text" class="form-input" v-model="form.remark" placeholder="请输入备注">
                    </div>
                    <div class="modal-footer">
                        <button class="btn" @click="closeModal">取消</button>
                        <button class="btn btn-primary" @click="submitForm">{{ editingId ? '保存' : '录入' }}</button>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" v-if="showCodeResultModal" @click.self="showCodeResultModal = false">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">录入成功 - 取件码</span>
                        <button class="modal-close" @click="showCodeResultModal = false">&times;</button>
                    </div>
                    <div class="pickup-code-display" v-if="newPickupCode">
                        <div class="pickup-code-title">快递已入库，取件码如下</div>
                        <div class="pickup-code">{{ newPickupCode.code }}</div>
                        <div class="pickup-code-expire">有效期至：{{ newPickupCode.expires_at ? newPickupCode.expires_at.slice(0, 16) : '-' }}</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const packages = ref([]);
        const page = ref(1);
        const page_size = ref(10);
        const total = ref(0);
        const total_pages = ref(0);
        const keyword = ref('');
        const status = ref(null);
        const showAddModal = ref(false);
        const editingId = ref(0);
        const showCodeResultModal = ref(false);
        const newPickupCode = ref(null);
        const form = reactive({
            tracking_number: '',
            courier_company: '',
            recipient_name: '',
            recipient_phone: '',
            cabinet_number: '',
            shelf_number: '',
            remark: ''
        });

        const loadData = async () => {
            const result = await api.package.getList({
                page: page.value,
                page_size: page_size.value,
                keyword: keyword.value,
                status: status.value
            });
            if (result.code === 0) {
                packages.value = result.data.items;
                total.value = result.data.total;
                total_pages.value = result.data.total_pages;
            }
        };

        const getStatusClass = (s) => {
            const map = { 1: 'status-info', 2: 'status-success', 3: 'status-danger', 4: 'status-default' };
            return map[s] || 'status-default';
        };

        const prevPage = () => {
            if (page.value > 1) {
                page.value--;
                loadData();
            }
        };

        const nextPage = () => {
            if (page.value < total_pages.value) {
                page.value++;
                loadData();
            }
        };

        const editPackage = (item) => {
            editingId.value = item.id;
            form.tracking_number = item.tracking_number;
            form.courier_company = item.courier_company;
            form.recipient_name = item.recipient_name;
            form.recipient_phone = item.recipient_phone;
            form.cabinet_number = item.cabinet_number;
            form.shelf_number = item.shelf_number;
            form.remark = item.remark;
            showAddModal.value = true;
        };

        const closeModal = () => {
            showAddModal.value = false;
            editingId.value = 0;
            Object.keys(form).forEach(k => form[k] = '');
        };

        const submitForm = async () => {
            if (!form.tracking_number || !form.recipient_name || !form.recipient_phone) {
                alert('请填写必填项');
                return;
            }

            let result;
            if (editingId.value) {
                result = await api.package.update(form, { package_id: editingId.value });
            } else {
                result = await api.package.create(form);
            }

            if (result.code === 0) {
                if (!editingId.value && result.data && result.data.pickup_code) {
                    newPickupCode.value = result.data.pickup_code;
                    showCodeResultModal.value = true;
                } else {
                    alert(editingId.value ? '更新成功' : '录入成功');
                }
                closeModal();
                loadData();
            } else {
                alert(result.msg);
            }
        };

        const deletePackage = async (id) => {
            if (!confirm('确定删除吗？')) return;
            const result = await api.package.delete({ package_id: id });
            if (result.code === 0) {
                alert('删除成功');
                loadData();
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadData();
        });

        return {
            packages, page, page_size, total, total_pages, keyword, status,
            showAddModal, editingId, form, showCodeResultModal, newPickupCode,
            loadData, getStatusClass, prevPage, nextPage,
            editPackage, closeModal, submitForm, deletePackage
        };
    }
};

const AdminPickupPage = {
    template: `
        <div class="page-card">
            <h2 class="page-title">取件管理</h2>
            <div class="search-bar">
                <input type="text" class="search-input" v-model="pickupCode" placeholder="请输入6位取件码" maxlength="6">
                <button class="btn btn-primary" @click="verifyPickup">验证取件</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>取件码</th>
                        <th>快递单号</th>
                        <th>状态</th>
                        <th>生成时间</th>
                        <th>过期时间</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in codes" :key="item.id">
                        <td><strong style="font-size: 18px;">{{ item.code }}</strong></td>
                        <td>{{ item.package?.tracking_number || '-' }}</td>
                        <td>
                            <span class="status-tag" :class="getStatusClass(item.status)">
                                {{ item.status_text }}
                            </span>
                        </td>
                        <td>{{ item.created_at ? item.created_at.slice(0, 16) : '-' }}</td>
                        <td>{{ item.expires_at ? item.expires_at.slice(0, 16) : '-' }}</td>
                    </tr>
                </tbody>
            </table>
            <div class="pagination" v-if="total > 0">
                <button class="pagination-btn" @click="prevPage" :disabled="page <= 1">上一页</button>
                <span class="pagination-text">{{ page }} / {{ total_pages }}</span>
                <button class="pagination-btn" @click="nextPage" :disabled="page >= total_pages">下一页</button>
            </div>
        </div>
    `,
    setup() {
        const codes = ref([]);
        const page = ref(1);
        const page_size = ref(10);
        const total = ref(0);
        const total_pages = ref(0);
        const pickupCode = ref('');

        const loadData = async () => {
            const result = await api.pickup.getList({
                page: page.value,
                page_size: page_size.value
            });
            if (result.code === 0) {
                codes.value = result.data.items;
                total.value = result.data.total;
                total_pages.value = result.data.total_pages;
            }
        };

        const getStatusClass = (s) => {
            const map = { 0: 'status-info', 1: 'status-success', 2: 'status-danger' };
            return map[s] || 'status-default';
        };

        const prevPage = () => {
            if (page.value > 1) {
                page.value--;
                loadData();
            }
        };

        const nextPage = () => {
            if (page.value < total_pages.value) {
                page.value++;
                loadData();
            }
        };

        const verifyPickup = async () => {
            if (!pickupCode.value) {
                alert('请输入取件码');
                return;
            }
            const result = await api.pickup.verify({ code: pickupCode.value });
            if (result.code === 0) {
                alert('取件成功！');
                pickupCode.value = '';
                loadData();
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadData();
        });

        return { codes, page, page_size, total, total_pages, pickupCode, loadData, getStatusClass, prevPage, nextPage, verifyPickup };
    }
};

const AdminOverduePage = {
    template: `
        <div class="page-card">
            <h2 class="page-title">超时管理</h2>
            <div class="search-bar">
                <select class="search-select" v-model="days" @change="loadData">
                    <option :value="3">超期3天</option>
                    <option :value="7">超期7天</option>
                    <option :value="15">超期15天</option>
                    <option :value="30">超期30天</option>
                </select>
            </div>
            <table class="table" v-if="packages.length > 0">
                <thead>
                    <tr>
                        <th>快递单号</th>
                        <th>收件人</th>
                        <th>电话</th>
                        <th>入库时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in packages" :key="item.id">
                        <td>{{ item.tracking_number }}</td>
                        <td>{{ item.recipient_name }}</td>
                        <td>{{ item.recipient_phone }}</td>
                        <td>{{ item.stored_at ? item.stored_at.slice(0, 16) : '-' }}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-warning btn-small" @click="processOverdue(item.id)">标记超时</button>
                                <button class="btn btn-danger btn-small" @click="returnPackage(item.id)">退回</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="empty-state" v-else>
                <div class="empty-icon">✅</div>
                <div>暂无超期快递</div>
            </div>
            <div class="pagination" v-if="total > 0">
                <button class="pagination-btn" @click="prevPage" :disabled="page <= 1">上一页</button>
                <span class="pagination-text">{{ page }} / {{ total_pages }}</span>
                <button class="pagination-btn" @click="nextPage" :disabled="page >= total_pages">下一页</button>
            </div>
        </div>
    `,
    setup() {
        const packages = ref([]);
        const page = ref(1);
        const page_size = ref(10);
        const total = ref(0);
        const total_pages = ref(0);
        const days = ref(3);

        const loadData = async () => {
            const result = await api.package.getOverdueList({
                days: days.value,
                page: page.value,
                page_size: page_size.value
            });
            if (result.code === 0) {
                packages.value = result.data.items;
                total.value = result.data.total;
                total_pages.value = result.data.total_pages;
            }
        };

        const prevPage = () => {
            if (page.value > 1) {
                page.value--;
                loadData();
            }
        };

        const nextPage = () => {
            if (page.value < total_pages.value) {
                page.value++;
                loadData();
            }
        };

        const processOverdue = async (id) => {
            if (!confirm('确定标记为超时吗？')) return;
            const result = await api.package.processOverdue({ package_id: id });
            if (result.code === 0) {
                alert('处理成功');
                loadData();
            } else {
                alert(result.msg);
            }
        };

        const returnPackage = async (id) => {
            if (!confirm('确定退回该快递吗？')) return;
            const result = await api.package.returnPackage({ package_id: id });
            if (result.code === 0) {
                alert('退回成功');
                loadData();
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadData();
        });

        return { packages, page, page_size, total, total_pages, days, loadData, prevPage, nextPage, processOverdue, returnPackage };
    }
};

const AdminUsersPage = {
    template: `
        <div class="page-card">
            <h2 class="page-title">用户管理</h2>
            <div class="search-bar">
                <input type="text" class="search-input" v-model="keyword" placeholder="搜索手机号/昵称">
                <select class="search-select" v-model="status" @change="loadData">
                    <option :value="null">全部状态</option>
                    <option value="0">正常</option>
                    <option value="1">禁用</option>
                </select>
                <button class="btn btn-primary" @click="loadData">搜索</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>手机号</th>
                        <th>昵称</th>
                        <th>角色</th>
                        <th>状态</th>
                        <th>注册时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in users" :key="item.id">
                        <td>{{ item.id }}</td>
                        <td>{{ item.phone }}</td>
                        <td>{{ item.nickname }}</td>
                        <td>{{ item.role_text }}</td>
                        <td>
                            <span class="status-tag" :class="item.status === 0 ? 'status-success' : 'status-danger'">
                                {{ item.status_text }}
                            </span>
                        </td>
                        <td>{{ item.created_at ? item.created_at.slice(0, 16) : '-' }}</td>
                        <td>
                            <div class="action-buttons">
                                <button v-if="item.status === 0" class="btn btn-warning btn-small" @click="updateStatus(item.id, 1)">禁用</button>
                                <button v-if="item.status === 1" class="btn btn-success btn-small" @click="updateStatus(item.id, 0)">启用</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="pagination" v-if="total > 0">
                <button class="pagination-btn" @click="prevPage" :disabled="page <= 1">上一页</button>
                <span class="pagination-text">{{ page }} / {{ total_pages }}</span>
                <button class="pagination-btn" @click="nextPage" :disabled="page >= total_pages">下一页</button>
            </div>
        </div>
    `,
    setup() {
        const users = ref([]);
        const page = ref(1);
        const page_size = ref(10);
        const total = ref(0);
        const total_pages = ref(0);
        const keyword = ref('');
        const status = ref(null);

        const loadData = async () => {
            const result = await api.user.getList({
                page: page.value,
                page_size: page_size.value,
                keyword: keyword.value,
                status: status.value
            });
            if (result.code === 0) {
                users.value = result.data.items;
                total.value = result.data.total;
                total_pages.value = result.data.total_pages;
            }
        };

        const prevPage = () => {
            if (page.value > 1) {
                page.value--;
                loadData();
            }
        };

        const nextPage = () => {
            if (page.value < total_pages.value) {
                page.value++;
                loadData();
            }
        };

        const updateStatus = async (id, s) => {
            const result = await api.user.updateStatus({ user_id: id, status: s });
            if (result.code === 0) {
                alert('操作成功');
                loadData();
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadData();
        });

        return { users, page, page_size, total, total_pages, keyword, status, loadData, prevPage, nextPage, updateStatus };
    }
};

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/register', component: RegisterPage },
    { path: '/user/packages', component: UserPackagesPage },
    { path: '/user/pickup', component: UserPickupPage },
    { path: '/user/proxy', component: UserProxyPage },
    { path: '/user/messages', component: UserMessagesPage },
    { path: '/admin/dashboard', component: AdminDashboardPage },
    { path: '/admin/packages', component: AdminPackagesPage },
    { path: '/admin/pickup', component: AdminPickupPage },
    { path: '/admin/overdue', component: AdminOverduePage },
    { path: '/admin/users', component: AdminUsersPage }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

const App = {
    setup() {
        const isLoggedIn = ref(false);
        const userRole = ref(0);
        const userName = ref('');

        const checkAuth = () => {
            const token = localStorage.getItem('kuaidi_token');
            const userStr = localStorage.getItem('kuaidi_user');
            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    isLoggedIn.value = true;
                    userRole.value = user.role;
                    userName.value = user.nickname;
                    if (user.role === 1) {
                        router.push('/admin/dashboard');
                    } else {
                        router.push('/user/packages');
                    }
                } catch (e) {
                    isLoggedIn.value = false;
                }
            } else {
                isLoggedIn.value = false;
                router.push('/login');
            }
        };

        const logout = async () => {
            await api.user.logout();
            api.clearToken();
            localStorage.removeItem('kuaidi_user');
            window.location.reload();
        };

        const goHome = () => {
            if (userRole.value === 1) {
                router.push('/admin/dashboard');
            } else {
                router.push('/user/packages');
            }
        };

        onMounted(() => {
            checkAuth();
        });

        return { isLoggedIn, userRole, userName, logout, goHome };
    }
};

const app = createApp(App);
app.use(router);
app.mount('#app');
