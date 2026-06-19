let currentPage = 'home';
let currentStatus = null;
let currentPageNum = 1;
let currentRole = 'publisher';
let isLoginMode = true;
let isPageLoaded = false;

function navigateTo(page) {
    currentPage = page;
    currentPageNum = 1;
    
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems && navItems.length > 0) {
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
    }
    
    const fabBtn = document.getElementById('fabBtn');
    if (fabBtn) {
        if (page === 'home') {
            fabBtn.style.display = 'flex';
        } else {
            fabBtn.style.display = 'none';
        }
    }
    
    renderPage();
}

function renderPage() {
    const container = document.getElementById('pageContainer');
    if (!container) {
        console.error('pageContainer 不存在');
        return;
    }
    
    switch (currentPage) {
        case 'home':
            renderHomePage();
            break;
        case 'rank':
            renderRankPage();
            break;
        case 'profile':
            renderProfilePage();
            break;
        default:
            renderHomePage();
    }
}

function renderHomePage() {
    const container = document.getElementById('pageContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">快递代收</h1>
            <p class="page-subtitle">邻里互助，让取快递更方便</p>
        </div>
        
        <div class="filter-bar">
            <div class="filter-tabs" id="statusTabs">
                <div class="filter-tab ${currentStatus === null ? 'active' : ''}" data-status="" onclick="filterByStatus('')">全部</div>
                <div class="filter-tab ${currentStatus === 'pending' ? 'active' : ''}" data-status="pending" onclick="filterByStatus('pending')">待接单</div>
                <div class="filter-tab ${currentStatus === 'accepted' ? 'active' : ''}" data-status="accepted" onclick="filterByStatus('accepted')">进行中</div>
                <div class="filter-tab ${currentStatus === 'delivered' ? 'active' : ''}" data-status="delivered" onclick="filterByStatus('delivered')">已完成</div>
            </div>
        </div>
        
        <div id="orderList" class="order-list">
            <div class="text-center"><div class="loading"></div><p style="margin-top: 10px; color: var(--text-secondary);">加载中...</p></div>
        </div>
        
        <div id="pagination" class="pagination"></div>
    `;
    
    loadOrderList();
}

function filterByStatus(status) {
    currentStatus = status || null;
    currentPageNum = 1;
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.status === (status || '')) {
            tab.classList.add('active');
        }
    });
    
    loadOrderList();
}

async function loadOrderList() {
    const listContainer = document.getElementById('orderList');
    const paginationContainer = document.getElementById('pagination');
    if (!listContainer || !paginationContainer) return;
    
    try {
        const result = await getOrderList(currentStatus, currentPageNum, 10);
        
        if (result.code !== 0) {
            listContainer.innerHTML = `
                <div class="card">
                    <div class="card-body text-center" style="color: var(--danger-color);">
                        加载失败：${escapeHtml(result.message || '未知错误')}
                    </div>
                </div>
            `;
            return;
        }
        
        const { items, total, page, page_size, total_pages } = result.data;
        
        if (!items || items.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <h3>暂无订单</h3>
                    <p>还没有人发布代收请求，快来发布第一个吧！</p>
                </div>
            `;
            paginationContainer.innerHTML = '';
            return;
        }
        
        listContainer.innerHTML = items.map(order => renderOrderCard(order)).join('');
        
        if (total_pages > 1) {
            paginationContainer.innerHTML = renderPagination(page, total_pages, total);
        } else {
            paginationContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('加载订单列表出错:', error);
        listContainer.innerHTML = `
            <div class="card">
                <div class="card-body text-center" style="color: var(--danger-color);">
                    加载失败，请刷新页面重试
                </div>
            </div>
        `;
    }
}

function renderOrderCard(order) {
    const statusClass = `badge-${order.status}`;
    const statusText = order.status_text;
    
    const estimatedArrival = formatDateTime(order.estimated_arrival);
    const pickupDeadline = formatDateTime(order.pickup_deadline);
    
    const publisherAvatar = order.publisher_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.publisher_id}`;
    const publisherName = order.publisher_nickname || '匿名用户';
    const reputation = order.publisher_reputation || 100;
    
    return `
        <div class="order-card" onclick="showOrderDetail(${order.id})">
            <div class="order-header">
                <div class="order-courier">
                    <div class="order-courier-icon">📦</div>
                    ${escapeHtml(order.courier_company)}
                </div>
                <div class="order-reward">${order.reward.toFixed(2)}</div>
            </div>
            <div class="order-meta">
                <div class="order-meta-item">
                    <span class="icon">📍</span>
                    ${escapeHtml(order.pickup_location)}
                </div>
                <div class="order-meta-item">
                    <span class="icon">🕐</span>
                    预计 ${estimatedArrival}
                </div>
                <div class="order-meta-item">
                    <span class="icon">⏰</span>
                    截止 ${pickupDeadline}
                </div>
            </div>
            <div class="order-footer">
                <div class="publisher-info">
                    <img src="${publisherAvatar}" alt="" class="publisher-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
                    <div>
                        <div class="publisher-name">${escapeHtml(publisherName)}</div>
                        <div class="reputation-badge">⭐ ${reputation} 信誉分</div>
                    </div>
                </div>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
        </div>
    `;
}

function renderPagination(currentPage, totalPages, total) {
    let pages = [];
    
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        if (currentPage <= 3) {
            pages = [1, 2, 3, 4, '...', totalPages];
        } else if (currentPage >= totalPages - 2) {
            pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
        }
    }
    
    return `
        <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
        ${pages.map(p => {
            if (p === '...') {
                return '<span style="padding: 0 8px; color: var(--text-light);">...</span>';
            }
            return `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
        }).join('')}
        <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
        <span class="pagination-info">共 ${total} 条</span>
    `;
}

function goToPage(page) {
    currentPageNum = page;
    loadOrderList();
}

async function renderRankPage() {
    const container = document.getElementById('pageContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">信誉排行榜</h1>
            <p class="page-subtitle">信誉越高，越值得信赖</p>
        </div>
        
        <div id="rankList" class="rank-list">
            <div class="text-center"><div class="loading"></div><p style="margin-top: 10px; color: var(--text-secondary);">加载中...</p></div>
        </div>
    `;
    
    try {
        const result = await getRankList(20);
        
        const rankListContainer = document.getElementById('rankList');
        if (!rankListContainer) return;
        
        if (result.code !== 0) {
            rankListContainer.innerHTML = `
                <div class="card">
                    <div class="card-body text-center" style="color: var(--danger-color);">
                        加载失败：${escapeHtml(result.message || '未知错误')}
                    </div>
                </div>
            `;
            return;
        }
        
        const rankList = result.data;
        
        if (!rankList || rankList.length === 0) {
            rankListContainer.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🏆</div>
                    <h3>暂无排行</h3>
                    <p>还没有人完成订单，快来成为第一名吧！</p>
                </div>
            `;
            return;
        }
        
        rankListContainer.innerHTML = rankList.map(item => {
            const rankClass = item.rank <= 3 ? `rank-${item.rank}` : 'rank-other';
            const avatar = item.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`;
            
            return `
                <div class="rank-item">
                    <div class="rank-number ${rankClass}">${item.rank}</div>
                    <img src="${avatar}" alt="" class="rank-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
                    <div class="rank-info">
                        <div class="rank-name">${escapeHtml(item.nickname)}</div>
                        <div class="rank-stats">完成 ${item.completed_orders} 单</div>
                    </div>
                    <div class="rank-reputation">⭐ ${item.reputation}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('加载排行榜出错:', error);
        const rankListContainer = document.getElementById('rankList');
        if (rankListContainer) {
            rankListContainer.innerHTML = `
                <div class="card">
                    <div class="card-body text-center" style="color: var(--danger-color);">
                        加载失败，请刷新页面重试
                    </div>
                </div>
            `;
        }
    }
}

async function renderProfilePage() {
    const container = document.getElementById('pageContainer');
    if (!container) return;
    
    if (!isLoggedIn()) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 80px 24px;">
                <div class="icon">👤</div>
                <h3>请先登录</h3>
                <p>登录后可查看个人中心、发布订单和接单</p>
                <button class="btn btn-primary mt-2" onclick="showLoginModal()">立即登录</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">个人中心</h1>
        </div>
        
        <div id="profileContent">
            <div class="text-center"><div class="loading"></div><p style="margin-top: 10px; color: var(--text-secondary);">加载中...</p></div>
        </div>
    `;
    
    try {
        const profileResult = await getProfile();
        
        const profileContent = document.getElementById('profileContent');
        if (!profileContent) return;
        
        if (profileResult.code !== 0 || !profileResult.data) {
            profileContent.innerHTML = `
                <div class="card">
                    <div class="card-body text-center" style="color: var(--danger-color);">
                        加载失败：${escapeHtml(profileResult.message || '未知错误')}
                    </div>
                </div>
            `;
            return;
        }
        
        let stats = { total: 0, pending: 0, accepted: 0, picked_up: 0, delivered: 0, cancelled: 0 };
        try {
            const statsResult = await getOrderStats('publisher');
            if (statsResult.code === 0 && statsResult.data) {
                stats = statsResult.data;
            }
        } catch (e) {
            console.error('加载统计数据出错:', e);
        }
        
        const profile = profileResult.data;
        
        const avatar = profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`;
        
        profileContent.innerHTML = `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="user-card">
                        <img src="${avatar}" alt="" class="user-card-avatar" id="profileAvatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
                        <div class="user-card-info">
                            <div class="user-card-name" id="profileNickname">${escapeHtml(profile.nickname)}</div>
                            <div class="user-card-stats">
                                <div class="user-card-stat">⭐ ${profile.reputation} 信誉分</div>
                                <div class="user-card-stat">📦 完成 ${profile.completed_orders} 单</div>
                                <div class="user-card-stat">💰 ¥${(profile.balance || 0).toFixed(2)}</div>
                            </div>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="showEditProfileModal()">编辑</button>
                    </div>
                </div>
            </div>
            
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.total || 0}</div>
                    <div class="stat-label">全部订单</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: var(--warning-color);">${stats.pending || 0}</div>
                    <div class="stat-label">待接单</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: var(--primary-color);">${stats.accepted || 0}</div>
                    <div class="stat-label">进行中</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" style="color: var(--success-color);">${stats.delivered || 0}</div>
                    <div class="stat-label">已完成</div>
                </div>
            </div>
            
            <div class="card">
                <div class="tabs">
                    <div class="tab ${currentRole === 'publisher' ? 'active' : ''}" data-role="publisher" onclick="switchProfileTab('publisher')">我发布的</div>
                    <div class="tab ${currentRole === 'taker' ? 'active' : ''}" data-role="taker" onclick="switchProfileTab('taker')">我接的</div>
                </div>
                <div class="card-body" id="myOrderList">
                    <div class="text-center"><div class="loading"></div></div>
                </div>
            </div>
            
            <div class="text-center mt-3">
                <button class="btn btn-secondary" onclick="handleLogout()">退出登录</button>
            </div>
        `;
        
        loadMyOrders(currentRole);
    } catch (error) {
        console.error('加载个人中心出错:', error);
        const profileContent = document.getElementById('profileContent');
        if (profileContent) {
            profileContent.innerHTML = `
                <div class="card">
                    <div class="card-body text-center" style="color: var(--danger-color);">
                        加载失败，请刷新页面重试
                    </div>
                </div>
            `;
        }
    }
}

function switchProfileTab(role) {
    currentRole = role;
    currentPageNum = 1;
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.role === role) {
            tab.classList.add('active');
        }
    });
    
    loadMyOrders(role);
}

async function loadMyOrders(role) {
    const listContainer = document.getElementById('myOrderList');
    if (!listContainer) return;
    
    try {
        const result = await getMyOrders(role, null, 1, 10);
        
        if (result.code !== 0) {
            listContainer.innerHTML = `
                <div class="text-center" style="color: var(--danger-color);">
                    加载失败：${escapeHtml(result.message || '未知错误')}
                </div>
            `;
            return;
        }
        
        const items = result.data.items;
        
        if (!items || items.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state" style="padding: 40px 24px;">
                    <div class="icon" style="font-size: 48px;">📭</div>
                    <h3>暂无订单</h3>
                    <p>${role === 'publisher' ? '还没有发布过订单' : '还没有接过订单'}</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = `
            <div class="order-list">
                ${items.map(order => renderOrderCard(order)).join('')}
            </div>
        `;
    } catch (error) {
        console.error('加载我的订单出错:', error);
        listContainer.innerHTML = `
            <div class="text-center" style="color: var(--danger-color);">
                加载失败，请刷新页面重试
            </div>
        `;
    }
}

function showLoginModal() {
    isLoginMode = true;
    updateLoginModal();
    document.getElementById('loginModal').classList.add('show');
    setTimeout(() => {
        const input = document.getElementById('loginUsername');
        if (input) input.focus();
    }, 100);
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    const form = document.getElementById('loginForm');
    if (form) form.reset();
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateLoginModal();
}

function updateLoginModal() {
    const title = document.getElementById('loginModalTitle');
    const btnText = document.getElementById('loginBtnText');
    const footer = document.querySelector('#loginModal .auth-footer');
    
    if (isLoginMode) {
        title.textContent = '登录';
        btnText.textContent = '登录';
        if (footer) footer.innerHTML = '没有账号？<a onclick="toggleAuthMode()">立即注册</a>';
    } else {
        title.textContent = '注册';
        btnText.textContent = '注册';
        if (footer) footer.innerHTML = '已有账号？<a onclick="toggleAuthMode()">立即登录</a>';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('loginBtnText');
    
    if (!username || !password) {
        showToast('请填写用户名和密码', 'warning');
        return;
    }
    
    btn.disabled = true;
    btnText.innerHTML = '<span class="loading"></span> 处理中...';
    
    let result;
    
    try {
        if (isLoginMode) {
            result = await login(username, password);
        } else {
            const registerResult = await register(username, password);
            if (registerResult.code === 0) {
                result = await login(username, password);
            } else {
                result = registerResult;
            }
        }
    } catch (error) {
        console.error('登录/注册出错:', error);
        result = { code: -1, message: '操作失败，请重试' };
    }
    
    btn.disabled = false;
    btnText.textContent = isLoginMode ? '登录' : '注册';
    
    if (result.code === 0) {
        showToast(isLoginMode ? '登录成功' : '注册成功', 'success');
        hideLoginModal();
        
        try {
            await loadUserProfile();
        } catch (e) {
            console.error('加载用户资料出错:', e);
        }
        
        updateUserArea();
        
        if (currentPage === 'profile') {
            renderProfilePage();
        }
    } else {
        showToast(result.message || '操作失败', 'error');
    }
}

function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        logout();
        updateUserArea();
        showToast('已退出登录', 'info');
        navigateTo('home');
    }
}

function updateUserArea() {
    const userArea = document.getElementById('userArea');
    if (!userArea) return;
    
    if (isLoggedIn()) {
        const profile = getCachedProfile();
        const user = getCachedUser();
        const userId = user?.id || 1;
        const avatar = profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
        
        userArea.innerHTML = `
            <img src="${avatar}" alt="" class="user-avatar-small" onclick="navigateTo('profile')" title="个人中心" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
        `;
    } else {
        userArea.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="showLoginModal()">登录</button>
        `;
    }
}

function showCreateOrderModal() {
    if (!isLoggedIn()) {
        showToast('请先登录后再发布订单', 'warning');
        showLoginModal();
        return;
    }
    
    document.getElementById('createOrderModal').classList.add('show');
    
    const draft = getOrderDraft();
    if (draft) {
        if (draft.courier_company) document.getElementById('courierCompany').value = draft.courier_company;
        if (draft.pickup_location) document.getElementById('pickupLocation').value = draft.pickup_location;
        if (draft.estimated_arrival) document.getElementById('estimatedArrival').value = draft.estimated_arrival;
        if (draft.pickup_deadline) document.getElementById('pickupDeadline').value = draft.pickup_deadline;
        if (draft.reward !== undefined && draft.reward !== null) document.getElementById('reward').value = draft.reward;
        if (draft.pickup_code) document.getElementById('pickupCode').value = draft.pickup_code;
        if (draft.remark) document.getElementById('remark').value = draft.remark;
    } else {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        
        document.getElementById('estimatedArrival').value = formatDateTimeLocal(tomorrow);
        document.getElementById('pickupDeadline').value = formatDateTimeLocal(dayAfter);
    }
    
    bindDraftAutoSave();
}

function bindDraftAutoSave() {
    const fields = ['courierCompany', 'pickupLocation', 'estimatedArrival', 'pickupDeadline', 'reward', 'pickupCode', 'remark'];
    fields.forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (el) {
            el.addEventListener('input', saveOrderDraft);
            el.addEventListener('change', saveOrderDraft);
        }
    });
}

function saveOrderDraft() {
    const draft = {
        courier_company: document.getElementById('courierCompany').value,
        pickup_location: document.getElementById('pickupLocation').value.trim(),
        estimated_arrival: document.getElementById('estimatedArrival').value,
        pickup_deadline: document.getElementById('pickupDeadline').value,
        reward: document.getElementById('reward').value,
        pickup_code: document.getElementById('pickupCode').value.trim(),
        remark: document.getElementById('remark').value.trim()
    };
    setOrderDraft(draft);
}

function hideCreateOrderModal() {
    document.getElementById('createOrderModal').classList.remove('show');
    document.getElementById('createOrderForm').reset();
    removeOrderDraft();
}

async function handleCreateOrder(event) {
    if (event) event.preventDefault();
    
    const courierCompany = document.getElementById('courierCompany').value;
    const pickupLocation = document.getElementById('pickupLocation').value.trim();
    const estimatedArrival = document.getElementById('estimatedArrival').value;
    const pickupDeadline = document.getElementById('pickupDeadline').value;
    const rewardVal = document.getElementById('reward').value;
    const reward = parseFloat(rewardVal);
    const pickupCode = document.getElementById('pickupCode').value.trim();
    const remark = document.getElementById('remark').value.trim();
    
    if (!courierCompany) {
        showToast('请选择快递公司', 'warning');
        return;
    }
    if (!pickupLocation) {
        showToast('请填写取件地点', 'warning');
        return;
    }
    if (!estimatedArrival) {
        showToast('请选择预计到达时间', 'warning');
        return;
    }
    if (!pickupDeadline) {
        showToast('请选择取件截止时间', 'warning');
        return;
    }
    if (!rewardVal || isNaN(reward) || reward < 0) {
        showToast('请填写有效的报酬金额', 'warning');
        return;
    }
    
    try {
        const result = await createOrder({
            courier_company: courierCompany,
            pickup_location: pickupLocation,
            estimated_arrival: new Date(estimatedArrival).toISOString(),
            pickup_deadline: new Date(pickupDeadline).toISOString(),
            reward: reward,
            pickup_code: pickupCode,
            remark: remark
        });
        
        if (result.code === 0) {
            showToast('发布成功', 'success');
            hideCreateOrderModal();
            
            if (currentPage === 'home') {
                loadOrderList();
            } else if (currentPage === 'profile') {
                renderProfilePage();
            }
        } else {
            showToast(result.message || '发布失败', 'error');
        }
    } catch (error) {
        console.error('创建订单出错:', error);
        showToast('发布失败，请重试', 'error');
    }
}

async function showOrderDetail(orderId) {
    const modal = document.getElementById('orderDetailModal');
    const body = document.getElementById('orderDetailBody');
    const footer = document.getElementById('orderDetailFooter');
    if (!modal || !body || !footer) return;
    
    body.innerHTML = '<div class="text-center"><div class="loading"></div><p style="margin-top: 10px; color: var(--text-secondary);">加载中...</p></div>';
    footer.innerHTML = '';
    
    modal.classList.add('show');
    
    try {
        const result = await getOrderDetail(orderId);
        
        if (result.code !== 0 || !result.data) {
            body.innerHTML = `
                <div class="text-center" style="color: var(--danger-color); padding: 40px 0;">
                    加载失败：${escapeHtml(result.message || '未知错误')}
                </div>
            `;
            footer.innerHTML = '<button class="btn btn-secondary" onclick="hideOrderDetailModal()">关闭</button>';
            return;
        }
        
        const order = result.data;
        const currentUser = getCachedUser();
        const isPublisher = currentUser && order.publisher_id === currentUser.id;
        const isTaker = currentUser && order.taker_id === currentUser.id;
        
        const publisherAvatar = order.publisher_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.publisher_id}`;
        const takerAvatar = order.taker_avatar || (order.taker_id ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.taker_id}` : null);
        
        const statusClass = `badge-${order.status}`;
        
        body.innerHTML = `
            <div class="detail-section">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <h2 style="font-size: 20px; font-weight: 600;">${escapeHtml(order.courier_company)}</h2>
                    <span class="badge ${statusClass}" style="font-size: 14px; padding: 6px 14px;">${order.status_text}</span>
                </div>
                <div style="font-size: 32px; font-weight: 700; color: var(--danger-color); margin-bottom: 20px;">
                    ¥${order.reward.toFixed(2)}
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-section-title">订单信息</div>
                <div class="detail-row">
                    <div class="detail-label">取件地点</div>
                    <div class="detail-value">${escapeHtml(order.pickup_location)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">预计到达</div>
                    <div class="detail-value">${formatDateTime(order.estimated_arrival)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">取件截止</div>
                    <div class="detail-value">${formatDateTime(order.pickup_deadline)}</div>
                </div>
                ${order.pickup_code ? `
                <div class="detail-row">
                    <div class="detail-label">取件码</div>
                    <div class="detail-value">${escapeHtml(order.pickup_code)}</div>
                </div>
                ` : ''}
                ${order.remark ? `
                <div class="detail-row">
                    <div class="detail-label">备注</div>
                    <div class="detail-value">${escapeHtml(order.remark)}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="detail-section">
                <div class="detail-section-title">发布人</div>
                <div class="user-card" style="padding: 12px;">
                    <img src="${publisherAvatar}" alt="" class="user-card-avatar" style="width: 44px; height: 44px;" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
                    <div class="user-card-info">
                        <div class="user-card-name" style="font-size: 14px;">${escapeHtml(order.publisher_nickname || '匿名用户')}</div>
                        <div class="user-card-stats">
                            <div class="user-card-stat">⭐ ${order.publisher_reputation || 100} 信誉</div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${order.taker_id ? `
            <div class="detail-section">
                <div class="detail-section-title">接单人</div>
                <div class="user-card" style="padding: 12px;">
                    <img src="${takerAvatar}" alt="" class="user-card-avatar" style="width: 44px; height: 44px;" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=default'">
                    <div class="user-card-info">
                        <div class="user-card-name" style="font-size: 14px;">${escapeHtml(order.taker_nickname || '匿名用户')}</div>
                        <div class="user-card-stats">
                            <div class="user-card-stat">⭐ ${order.taker_reputation || 100} 信誉</div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div class="detail-section">
                <div class="detail-section-title">时间线</div>
                <div class="detail-row">
                    <div class="detail-label">发布时间</div>
                    <div class="detail-value">${formatDateTime(order.created_at)}</div>
                </div>
                ${order.accepted_at ? `
                <div class="detail-row">
                    <div class="detail-label">接单时间</div>
                    <div class="detail-value">${formatDateTime(order.accepted_at)}</div>
                </div>
                ` : ''}
                ${order.picked_up_at ? `
                <div class="detail-row">
                    <div class="detail-label">取件时间</div>
                    <div class="detail-value">${formatDateTime(order.picked_up_at)}</div>
                </div>
                ` : ''}
                ${order.delivered_at ? `
                <div class="detail-row">
                    <div class="detail-label">送达时间</div>
                    <div class="detail-value">${formatDateTime(order.delivered_at)}</div>
                </div>
                ` : ''}
            </div>
        `;
        
        let footerButtons = '<button class="btn btn-secondary" onclick="hideOrderDetailModal()">关闭</button>';
        
        if (isLoggedIn()) {
            if (order.status === 'pending' && !isPublisher) {
                footerButtons = `
                    <button class="btn btn-secondary" onclick="hideOrderDetailModal()">取消</button>
                    <button class="btn btn-primary" onclick="handleAcceptOrder(${order.id})">我要接单</button>
                `;
            } else if (order.status === 'accepted' && isTaker) {
                footerButtons = `
                    <button class="btn btn-secondary" onclick="hideOrderDetailModal()">关闭</button>
                    <button class="btn btn-primary" onclick="handlePickUpOrder(${order.id})">标记已取件</button>
                `;
            } else if (order.status === 'picked_up' && isPublisher) {
                footerButtons = `
                    <button class="btn btn-secondary" onclick="hideOrderDetailModal()">关闭</button>
                    <button class="btn btn-success" onclick="handleConfirmDelivery(${order.id})">确认送达</button>
                `;
            } else if ((order.status === 'pending' || order.status === 'accepted') && isPublisher) {
                footerButtons = `
                    <button class="btn btn-secondary" onclick="hideOrderDetailModal()">关闭</button>
                    <button class="btn btn-danger" onclick="handleCancelOrder(${order.id})">取消订单</button>
                `;
            }
        }
        
        footer.innerHTML = footerButtons;
    } catch (error) {
        console.error('加载订单详情出错:', error);
        body.innerHTML = `
            <div class="text-center" style="color: var(--danger-color); padding: 40px 0;">
                加载失败，请刷新页面重试
            </div>
        `;
        footer.innerHTML = '<button class="btn btn-secondary" onclick="hideOrderDetailModal()">关闭</button>';
    }
}

function hideOrderDetailModal() {
    document.getElementById('orderDetailModal').classList.remove('show');
}

async function handleAcceptOrder(orderId) {
    if (!confirm('确定要接这个订单吗？')) {
        return;
    }
    
    try {
        const result = await acceptOrder(orderId);
        
        if (result.code === 0) {
            showToast('接单成功', 'success');
            showOrderDetail(orderId);
            
            if (currentPage === 'home') {
                loadOrderList();
            } else if (currentPage === 'profile') {
                renderProfilePage();
            }
        } else {
            showToast(result.message || '接单失败', 'error');
        }
    } catch (error) {
        console.error('接单出错:', error);
        showToast('接单失败，请重试', 'error');
    }
}

async function handlePickUpOrder(orderId) {
    if (!confirm('确定已经取到快递了吗？')) {
        return;
    }
    
    try {
        const result = await pickUpOrder(orderId);
        
        if (result.code === 0) {
            showToast('已标记取件', 'success');
            showOrderDetail(orderId);
            
            if (currentPage === 'home') {
                loadOrderList();
            } else if (currentPage === 'profile') {
                renderProfilePage();
            }
        } else {
            showToast(result.message || '操作失败', 'error');
        }
    } catch (error) {
        console.error('标记取件出错:', error);
        showToast('操作失败，请重试', 'error');
    }
}

async function handleConfirmDelivery(orderId) {
    if (!confirm('确定已经收到快递了吗？确认后将结算报酬给接单人。')) {
        return;
    }
    
    try {
        const result = await confirmDelivery(orderId);
        
        if (result.code === 0) {
            showToast('已确认送达，订单完成！', 'success');
            showOrderDetail(orderId);
            
            if (currentPage === 'home') {
                loadOrderList();
            } else if (currentPage === 'profile') {
                renderProfilePage();
            }
        } else {
            showToast(result.message || '操作失败', 'error');
        }
    } catch (error) {
        console.error('确认送达出错:', error);
        showToast('操作失败，请重试', 'error');
    }
}

async function handleCancelOrder(orderId) {
    if (!confirm('确定要取消这个订单吗？')) {
        return;
    }
    
    try {
        const result = await cancelOrder(orderId);
        
        if (result.code === 0) {
            showToast('订单已取消', 'success');
            showOrderDetail(orderId);
            
            if (currentPage === 'home') {
                loadOrderList();
            } else if (currentPage === 'profile') {
                renderProfilePage();
            }
        } else {
            showToast(result.message || '取消失败', 'error');
        }
    } catch (error) {
        console.error('取消订单出错:', error);
        showToast('取消失败，请重试', 'error');
    }
}

function showEditProfileModal() {
    const profile = getCachedProfile();
    
    const modalHtml = `
        <div class="modal-overlay" id="editProfileModal">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">编辑资料</h3>
                    <button class="modal-close" onclick="hideEditProfileModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input type="text" class="form-control" id="editNickname" value="${escapeHtml(profile?.nickname || '')}" placeholder="请输入昵称" maxlength="20">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="hideEditProfileModal()">取消</button>
                    <button class="btn btn-primary" onclick="handleUpdateProfile()">保存</button>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('editProfileModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        setTimeout(() => {
            document.getElementById('editProfileModal').addEventListener('click', (e) => {
                if (e.target.id === 'editProfileModal') {
                    hideEditProfileModal();
                }
            });
        }, 0);
    } else {
        document.getElementById('editNickname').value = profile?.nickname || '';
    }
    
    document.getElementById('editProfileModal').classList.add('show');
}

function hideEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function handleUpdateProfile() {
    const nickname = document.getElementById('editNickname').value.trim();
    
    if (!nickname) {
        showToast('昵称不能为空', 'warning');
        return;
    }
    
    try {
        const result = await updateProfile({ nickname });
        
        if (result.code === 0) {
            showToast('保存成功', 'success');
            hideEditProfileModal();
            setCachedProfile(result.data);
            updateUserArea();
            renderProfilePage();
        } else {
            showToast(result.message || '保存失败', 'error');
        }
    } catch (error) {
        console.error('更新资料出错:', error);
        showToast('保存失败，请重试', 'error');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDateTime(isoString) {
    if (!isoString) return '';
    
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        
        const now = new Date();
        
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        const isToday = date.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();
        
        if (isToday) {
            return `今天 ${hours}:${minutes}`;
        } else if (isTomorrow) {
            return `明天 ${hours}:${minutes}`;
        } else {
            return `${month}月${day}日 ${hours}:${minutes}`;
        }
    } catch (e) {
        return isoString;
    }
}

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {
    isPageLoaded = true;
    
    try {
        updateUserArea();
        
        if (isLoggedIn()) {
            try {
                await loadUserProfile();
            } catch (e) {
                console.error('初始化加载用户资料出错:', e);
            }
            updateUserArea();
        }
    } catch (e) {
        console.error('初始化用户区域出错:', e);
    }
    
    try {
        navigateTo('home');
    } catch (e) {
        console.error('初始化页面出错:', e);
        const container = document.getElementById('pageContainer');
        if (container) {
            container.innerHTML = '<div class="card"><div class="card-body text-center" style="color: var(--danger-color);">页面加载失败，请刷新重试</div></div>';
        }
    }
    
    try {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('show');
                }
            });
        });
    } catch (e) {
        console.error('绑定模态框事件出错:', e);
    }
});

window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason);
});
