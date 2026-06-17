let currentRole = 'consumer';
let currentFarmer = null;
let currentConsumer = null;
let filterCategory = '';
let filterRange = '';

function initApp() {
    currentRole = Storage.getRole();
    currentFarmer = Storage.getFarmer();
    currentConsumer = Storage.getConsumer();

    renderNavbar();

    if (!currentFarmer && !currentConsumer) {
        showAuthPage();
    } else {
        showPage('home');
    }
}

function switchRole(role) {
    currentRole = role;
    Storage.setRole(role);
    Storage.logout();
    currentFarmer = null;
    currentConsumer = null;
    renderNavbar();
    showAuthPage();
}

function renderNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    const isLoggedIn = !!(currentFarmer || currentConsumer);
    const userDisplay = currentFarmer ? currentFarmer.name : (currentConsumer ? currentConsumer.name : '');

    let tabsHtml = '';
    if (isLoggedIn) {
        if (currentRole === 'farmer' && currentFarmer) {
            tabsHtml = `
                <button class="nav-tab active" onclick="showPage('home')">🏠 工作台</button>
                <button class="nav-tab" onclick="showPage('products')">📦 我的产品</button>
                <button class="nav-tab" onclick="showPage('orders')">📋 我的订单</button>
                <button class="nav-tab" onclick="showPage('shop')">🏪 店铺设置</button>
            `;
        } else if (currentRole === 'consumer' && currentConsumer) {
            tabsHtml = `
                <button class="nav-tab active" onclick="showPage('home')">🛒 产品市场</button>
                <button class="nav-tab" onclick="showPage('orders')">📦 我的订单</button>
            `;
        } else if (currentRole === 'admin') {
            tabsHtml = `
                <button class="nav-tab active" onclick="showPage('home')">📊 数据概览</button>
                <button class="nav-tab" onclick="showPage('audit')">✅ 农户审核</button>
                <button class="nav-tab" onclick="showPage('orders')">📋 所有订单</button>
                <button class="nav-tab" onclick="showPage('stats')">📈 统计排行</button>
            `;
        }
    }

    const roleButtons = !isLoggedIn ? `
        <div class="role-switch">
            <button class="role-btn ${currentRole === 'consumer' ? 'active' : ''}" onclick="switchRole('consumer')">消费者</button>
            <button class="role-btn ${currentRole === 'farmer' ? 'active' : ''}" onclick="switchRole('farmer')">农户</button>
            <button class="role-btn ${currentRole === 'admin' ? 'active' : ''}" onclick="switchRole('admin')">管理员</button>
        </div>
    ` : '';

    const userArea = isLoggedIn ? `
        <div class="user-info">
            <span>👋 ${esc(userDisplay)}</span>
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;border:none;" onclick="logout()">退出</button>
        </div>
    ` : '';

    nav.innerHTML = `
        <div class="navbar-inner">
            <div class="logo" onclick="initApp()">
                <div class="logo-icon">🌱</div>
                <span>田园直供</span>
            </div>
            <div class="nav-tabs">${tabsHtml}</div>
            <div class="user-area">
                ${roleButtons}
                ${userArea}
            </div>
        </div>
    `;
}

function logout() {
    Storage.logout();
    currentFarmer = null;
    currentConsumer = null;
    renderNavbar();
    showAuthPage();
}

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    event && event.target && event.target.classList && event.target.classList.add('active');

    if (page === 'home') loadHomePage();
    else if (page === 'products') loadFarmerProducts();
    else if (page === 'orders') loadOrdersPage();
    else if (page === 'shop') loadShopPage();
    else if (page === 'audit') loadAuditPage();
    else if (page === 'stats') loadStatsPage();
}

function showAuthPage() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-auth');
    if (el) el.classList.add('active');
    renderAuthForm();
}

function renderAuthForm() {
    const container = document.getElementById('auth-content');
    if (!container) return;

    let title = '消费者';
    if (currentRole === 'farmer') title = '农户';
    else if (currentRole === 'admin') {
        container.innerHTML = `
            <div class="auth-logo">
                <div class="logo-icon" style="background:#8b6f47;">🌾</div>
                <h2>管理员登录</h2>
            </div>
            <div class="auth-form">
                <div class="form-group">
                    <label class="form-label">管理员密码</label>
                    <input type="password" class="form-input" id="admin-pwd" placeholder="请输入管理员密码（默认admin123）">
                </div>
                <button class="btn btn-primary btn-lg" onclick="adminLogin()">登 录</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="auth-logo">
            <div class="logo-icon">🌱</div>
            <h2>${title}${currentRole === 'farmer' ? '入驻' : '登录'}</h2>
        </div>
        <div class="auth-tabs">
            <button class="auth-tab active" id="auth-tab-login" onclick="switchAuthTab('login')">登录</button>
            <button class="auth-tab" id="auth-tab-register" onclick="switchAuthTab('register')">注册</button>
        </div>
        <div id="auth-form-area"></div>
    `;
    switchAuthTab('login');
}

function switchAuthTab(tab) {
    document.getElementById('auth-tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('auth-tab-register').classList.toggle('active', tab === 'register');

    const area = document.getElementById('auth-form-area');
    if (tab === 'login') {
        area.innerHTML = `
            <div class="form-group">
                <label class="form-label">手机号</label>
                <input type="tel" class="form-input" id="login-phone" placeholder="请输入手机号">
            </div>
            <div class="form-group">
                <label class="form-label">密码</label>
                <input type="password" class="form-input" id="login-pwd" placeholder="请输入密码">
            </div>
            <button class="btn btn-primary btn-lg" onclick="doLogin()">登 录</button>
            <div class="auth-footer">
                ${currentRole === 'farmer' ? '测试账号：13800138001 密码：123456' : '测试账号：13900139001 密码：123456'}
            </div>
        `;
    } else {
        if (currentRole === 'farmer') {
            area.innerHTML = `
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" class="form-input" id="reg-name" placeholder="请输入您的姓名">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">手机号</label>
                        <input type="tel" class="form-input" id="reg-phone" placeholder="登录手机号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" class="form-input" id="reg-pwd" placeholder="设置密码">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">种植地址</label>
                    <input type="text" class="form-input" id="reg-address" placeholder="详细地址，如：XX省XX市XX村">
                </div>
                <div class="form-group">
                    <label class="form-label">种植品类</label>
                    <input type="text" class="form-input" id="reg-categories" placeholder="如：蔬菜,西红柿,黄瓜（逗号分隔）">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">认证信息</label>
                        <select class="form-select" id="reg-cert">
                            <option value="none">暂无认证</option>
                            <option value="organic">有机认证</option>
                            <option value="green">绿色食品</option>
                            <option value="pollution_free">无公害</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">认证说明</label>
                        <input type="text" class="form-input" id="reg-cert-desc" placeholder="认证编号或说明">
                    </div>
                </div>
                <button class="btn btn-primary btn-lg" onclick="doRegister()">提交注册，等待审核</button>
                <div class="auth-footer">提交后管理员审核通过即可开通店铺</div>
            `;
        } else {
            area.innerHTML = `
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input type="text" class="form-input" id="reg-name" placeholder="请输入您的姓名">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">手机号</label>
                        <input type="tel" class="form-input" id="reg-phone" placeholder="登录手机号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" class="form-input" id="reg-pwd" placeholder="设置密码">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">配送地址</label>
                    <input type="text" class="form-input" id="reg-address" placeholder="常用配送地址">
                </div>
                <button class="btn btn-primary btn-lg" onclick="doRegister()">注 册</button>
            `;
        }
    }
}

async function doLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const pwd = document.getElementById('login-pwd').value;
    if (!phone) return showToast('请输入手机号', true);

    let res;
    if (currentRole === 'farmer') {
        res = await FarmerAPI.login({ phone, password: pwd });
        if (res.code === 0) {
            currentFarmer = res.data;
            Storage.setFarmer(res.data);
        }
    } else {
        res = await ConsumerAPI.login({ phone, password: pwd });
        if (res.code === 0) {
            currentConsumer = res.data;
            Storage.setConsumer(res.data);
        }
    }

    if (res.code === 0) {
        showToast('登录成功');
        renderNavbar();
        showPage('home');
    } else {
        showToast(res.message, true);
    }
}

function adminLogin() {
    const pwd = document.getElementById('admin-pwd').value;
    if (pwd === 'admin123') {
        currentFarmer = { id: 0, name: '管理员' };
        Storage.setFarmer(currentFarmer);
        showToast('登录成功');
        renderNavbar();
        showPage('home');
    } else {
        showToast('密码错误', true);
    }
}

async function doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pwd = document.getElementById('reg-pwd').value;
    if (!name || !phone) return showToast('请填写完整信息', true);

    let res;
    if (currentRole === 'farmer') {
        const address = document.getElementById('reg-address').value.trim();
        const categories = document.getElementById('reg-categories').value.trim();
        const cert = document.getElementById('reg-cert').value;
        const certDesc = document.getElementById('reg-cert-desc').value.trim();
        if (!address) return showToast('请填写种植地址', true);

        res = await FarmerAPI.register({
            name, phone, password: pwd, address, categories,
            certification: cert, certification_desc: certDesc
        });
    } else {
        const address = document.getElementById('reg-address').value.trim();
        res = await ConsumerAPI.register({ name, phone, password: pwd, address });
    }

    if (res.code === 0) {
        if (currentRole === 'farmer') {
            showToast('注册成功！等待管理员审核后开通店铺');
            switchAuthTab('login');
        } else {
            currentConsumer = res.data;
            Storage.setConsumer(res.data);
            showToast('注册成功');
            renderNavbar();
            showPage('home');
        }
    } else {
        showToast(res.message, true);
    }
}

async function loadHomePage() {
    const container = document.getElementById('page-home-content');
    if (!container) return;

    if (currentRole === 'admin') {
        const res = await StatsAPI.overview();
        const d = res.data || {};
        container.innerHTML = `
            <h2 class="page-title">📊 数据概览</h2>
            <div class="stat-cards">
                <div class="stat-card"><div class="stat-value">${d.farmer_count || 0}</div><div class="stat-label">已开店农户</div></div>
                <div class="stat-card"><div class="stat-value" style="color:#ef6c00;">${d.pending_farmer_count || 0}</div><div class="stat-label">待审核申请</div></div>
                <div class="stat-card"><div class="stat-value">${d.product_count || 0}</div><div class="stat-label">在售产品数</div></div>
                <div class="stat-card"><div class="stat-value" style="color:#c62828;">${d.order_count || 0}</div><div class="stat-label">总订单数</div></div>
            </div>
            <div class="card">
                <h3 class="section-title">✨ 快捷操作</h3>
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="showPage('audit')">前往审核农户 →</button>
                    <button class="btn btn-brown" onclick="showPage('stats')">查看统计排行 →</button>
                </div>
            </div>
        `;
    } else if (currentRole === 'farmer' && currentFarmer) {
        const [prodRes, orderRes] = await Promise.all([
            ProductAPI.getByFarmer(currentFarmer.id),
            OrderAPI.getByFarmer(currentFarmer.id)
        ]);
        const pendingOrders = (orderRes.data || []).filter(o => o.status === 'pending_confirm').length;
        container.innerHTML = `
            <h2 class="page-title">🏠 ${esc(currentFarmer.shop_name || currentFarmer.name + '的店铺')} <small style="font-size:14px;color:#999;margin-left:8px;">${renderCertBadge(currentFarmer.certification)}</small></h2>
            <div class="stat-cards">
                <div class="stat-card"><div class="stat-value">${(prodRes.data || []).length}</div><div class="stat-label">在售产品</div></div>
                <div class="stat-card"><div class="stat-value" style="color:#ef6c00;">${pendingOrders}</div><div class="stat-label">待处理订单</div></div>
                <div class="stat-card"><div class="stat-value">${(orderRes.data || []).length}</div><div class="stat-label">总订单数</div></div>
            </div>
            <div class="card">
                <h3 class="section-title">✨ 快捷操作</h3>
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="openAddProduct()">＋ 发布新产品</button>
                    <button class="btn btn-brown" onclick="showPage('orders')">查看待处理订单 →</button>
                    <button class="btn btn-outline" onclick="showPage('shop')">店铺设置 →</button>
                </div>
            </div>
        `;
    } else {
        loadConsumerMarket(container);
    }
}

async function loadConsumerMarket(container) {
    container.innerHTML = `
        <h2 class="page-title">🛒 新鲜农产品市场 <small style="font-size:14px;color:#999;margin-left:8px;font-weight:normal;">从田间到餐桌，新鲜直达</small></h2>
        <div class="filter-bar" id="market-filters">
            <div class="filter-item">
                <span class="filter-label">品类：</span>
                <select class="filter-select" id="filter-category" onchange="onFilterChange()">
                    <option value="">全部品类</option>
                </select>
            </div>
            <div class="filter-item">
                <span class="filter-label">配送至：</span>
                <select class="filter-select" id="filter-range" onchange="onFilterChange()">
                    <option value="">全部区域</option>
                </select>
            </div>
        </div>
        <div id="market-product-list" class="product-grid">
            <div class="empty-state"><div class="empty-state-icon">🌱</div>加载中...</div>
        </div>
    `;

    const filters = await ProductAPI.filters();
    const catSel = document.getElementById('filter-category');
    const rangeSel = document.getElementById('filter-range');
    (filters.data?.categories || []).forEach(c => {
        catSel.innerHTML += `<option value="${esc(c)}">${esc(c)}</option>`;
    });
    (filters.data?.delivery_ranges || []).forEach(r => {
        rangeSel.innerHTML += `<option value="${esc(r)}">${esc(r)}</option>`;
    });

    await refreshMarketList();
}

async function onFilterChange() {
    filterCategory = document.getElementById('filter-category').value;
    filterRange = document.getElementById('filter-range').value;
    await refreshMarketList();
}

async function refreshMarketList() {
    const listEl = document.getElementById('market-product-list');
    if (!listEl) return;
    const res = await ProductAPI.list(filterCategory, filterRange);
    const products = res.data || [];
    if (products.length === 0) {
        listEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🥬</div>暂无符合条件的产品</div>`;
        return;
    }
    listEl.innerHTML = products.map(renderProductCard).join('');
}

async function viewProduct(productId) {
    const res = await ProductAPI.get(productId);
    const p = res.data;
    if (!p) return showToast('产品不存在', true);

    const isConsumer = !!(currentRole === 'consumer' && currentConsumer);
    showModal(`
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
            <img src="${esc(p.image_url) || 'https://via.placeholder.com/280/e8dcc4/8b6f47'}" style="width:200px;height:200px;border-radius:8px;object-fit:cover;" onerror="this.src='https://via.placeholder.com/200/e8dcc4/8b6f47'">
            <div style="flex:1;min-width:200px;">
                <h3 style="font-size:22px;margin-bottom:10px;">${esc(p.name)}</h3>
                <div style="margin-bottom:10px;">${renderCertBadge(p.certification)} <span class="tag tag-category" style="margin-left:6px;">${esc(p.category)}</span></div>
                <div style="font-size:28px;font-weight:bold;color:#c62828;margin-bottom:12px;">¥${p.price} <small style="font-size:14px;color:#666;font-weight:normal;">${UNIT_TEXT[p.unit] || ''}</small></div>
                <p style="color:#666;margin-bottom:8px;">🌾 采摘日期：${esc(p.harvest_date)}</p>
                <p style="color:#666;margin-bottom:8px;">🚚 配送范围：${esc(p.delivery_range)}</p>
                <p style="color:#666;margin-bottom:8px;">📅 预计送达：${esc(p.expected_delivery)}</p>
                <p style="color:#666;margin-bottom:8px;">🏪 ${esc(p.shop_name || p.farmer_name || '')}</p>
                <p style="color:#555;margin-bottom:12px;">${esc(p.description)}</p>
                <p style="color:#999;margin-bottom:16px;">库存：${p.stock}</p>
                ${isConsumer ? `
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">数量（${p.unit === 'portion' ? '份' : '斤'}）</label>
                            <input type="number" class="form-input" id="buy-qty" value="1" min="1" max="${p.stock}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <input type="text" class="form-input" id="buy-remark" placeholder="选填">
                        </div>
                    </div>
                    <button class="btn btn-primary btn-lg" style="width:100%;" onclick="placeOrder(${p.id})">立即下单</button>
                ` : '<p style="color:#999;">请登录消费者账号后下单</p>'}
            </div>
        </div>
    `, p.name);
}

async function placeOrder(productId) {
    const qty = parseInt(document.getElementById('buy-qty').value) || 1;
    const remark = document.getElementById('buy-remark').value;
    const res = await OrderAPI.create({
        consumer_id: currentConsumer.id,
        consumer_name: currentConsumer.name,
        consumer_phone: currentConsumer.phone,
        delivery_address: currentConsumer.address || '请联系确认地址',
        product_id: productId,
        quantity: qty,
        remark
    });
    if (res.code === 0) {
        closeModal();
        showToast('下单成功！');
        await refreshMarketList();
    } else {
        showToast(res.message, true);
    }
}

async function loadFarmerProducts() {
    const container = document.getElementById('page-products-content');
    if (!container) return;
    if (!currentFarmer) return;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2 class="page-title" style="margin:0;">📦 我的产品</h2>
            <button class="btn btn-primary" onclick="openAddProduct()">＋ 发布新产品</button>
        </div>
        <div id="farmer-product-list" class="product-grid">加载中...</div>
    `;

    const res = await ProductAPI.getByFarmer(currentFarmer.id);
    const list = document.getElementById('farmer-product-list');
    const products = res.data || [];
    if (products.length === 0) {
        list.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🌱</div>还没有发布产品，点击右上角按钮发布第一个产品吧</div>`;
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="product-card">
            <img class="product-image" src="${esc(p.image_url) || 'https://via.placeholder.com/280x200/e8dcc4/8b6f47'}" onerror="this.src='https://via.placeholder.com/280x200/e8dcc4/8b6f47'">
            <div class="product-body">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div class="product-name" style="margin:0;">${esc(p.name)}</div>
                    <span class="tag ${p.is_active ? 'tag-leaf' : 'tag-category'}">${p.is_active ? '在售' : '下架'}</span>
                </div>
                <div class="product-freshness">🌾 ${esc(p.harvest_date)}</div>
                <div class="product-desc">${esc(p.description || '')}</div>
                <div class="product-footer">
                    <div class="product-price">¥${p.price}</div>
                    <div class="product-stock">库存 ${p.stock} · 已售 ${p.sold_count || 0}</div>
                </div>
                <div style="display:flex;gap:8px;margin-top:10px;">
                    <button class="btn btn-sm btn-outline" onclick="toggleProductActive(${p.id}, ${p.is_active ? 0 : 1})">${p.is_active ? '下架' : '上架'}</button>
                    <button class="btn btn-sm btn-brown" onclick="deleteProduct(${p.id})">删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

function openAddProduct() {
    showModal(`
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">产品名称</label>
                <input type="text" class="form-input" id="p-name" placeholder="如：有机西红柿">
            </div>
            <div class="form-group">
                <label class="form-label">品类</label>
                <input type="text" class="form-input" id="p-category" placeholder="如：蔬菜、水果">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">单价</label>
                <input type="number" step="0.01" class="form-input" id="p-price" placeholder="0.00">
            </div>
            <div class="form-group">
                <label class="form-label">计价单位</label>
                <select class="form-select" id="p-unit">
                    <option value="jin">按斤</option>
                    <option value="portion">按份</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">库存量</label>
                <input type="number" class="form-input" id="p-stock" placeholder="0">
            </div>
            <div class="form-group">
                <label class="form-label">采摘日期</label>
                <input type="date" class="form-input" id="p-harvest">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">配送范围</label>
                <input type="text" class="form-input" id="p-range" placeholder="如：朝阳区,海淀区（逗号分隔）">
            </div>
            <div class="form-group">
                <label class="form-label">预计送达</label>
                <input type="date" class="form-input" id="p-expected">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">产品描述</label>
            <textarea class="form-textarea" id="p-desc" placeholder="产品特色、口感等"></textarea>
        </div>
        <div class="form-group">
            <label class="form-label">产品图片URL（选填）</label>
            <input type="text" class="form-input" id="p-image" placeholder="https://...">
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="submitProduct()">发布产品</button>
        </div>
    `, '发布新产品');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    document.getElementById('p-harvest').value = today;
    document.getElementById('p-expected').value = tomorrow;
}

async function submitProduct() {
    const data = {
        farmer_id: currentFarmer.id,
        name: document.getElementById('p-name').value.trim(),
        category: document.getElementById('p-category').value.trim(),
        price: parseFloat(document.getElementById('p-price').value) || 0,
        unit: document.getElementById('p-unit').value,
        stock: parseInt(document.getElementById('p-stock').value) || 0,
        harvest_date: document.getElementById('p-harvest').value,
        delivery_range: document.getElementById('p-range').value.trim(),
        expected_delivery: document.getElementById('p-expected').value,
        description: document.getElementById('p-desc').value.trim(),
        image_url: document.getElementById('p-image').value.trim()
    };
    if (!data.name || !data.category || !data.price) return showToast('请填写完整的产品信息', true);

    const res = await ProductAPI.add(data);
    if (res.code === 0) {
        closeModal();
        showToast('发布成功');
        loadFarmerProducts();
    } else {
        showToast(res.message, true);
    }
}

async function toggleProductActive(id, isActive) {
    await ProductAPI.update({ product_id: id, is_active: isActive });
    showToast(isActive ? '已上架' : '已下架');
    loadFarmerProducts();
}

async function deleteProduct(id) {
    if (!confirm('确定删除该产品？')) return;
    await ProductAPI.delete(id);
    showToast('已删除');
    loadFarmerProducts();
}

async function loadOrdersPage() {
    const container = document.getElementById('page-orders-content');
    if (!container) return;

    let fetchFn;
    if (currentRole === 'farmer' && currentFarmer) fetchFn = () => OrderAPI.getByFarmer(currentFarmer.id);
    else if (currentRole === 'consumer' && currentConsumer) fetchFn = () => OrderAPI.getByConsumer(currentConsumer.id);
    else if (currentRole === 'admin') fetchFn = () => OrderAPI.list();
    else return;

    container.innerHTML = `
        <h2 class="page-title">📋 ${currentRole === 'farmer' ? '我的订单' : (currentRole === 'admin' ? '所有订单' : '我的订单')}</h2>
        <div class="tabs">
            <button class="tab-btn active" data-status="" onclick="filterOrders(this, '')">全部</button>
            <button class="tab-btn" data-status="pending_confirm" onclick="filterOrders(this, 'pending_confirm')">待确认</button>
            <button class="tab-btn" data-status="accepted" onclick="filterOrders(this, 'accepted')">已接单</button>
            <button class="tab-btn" data-status="picking" onclick="filterOrders(this, 'picking')">采摘中</button>
            <button class="tab-btn" data-status="delivering" onclick="filterOrders(this, 'delivering')">配送中</button>
            <button class="tab-btn" data-status="delivered" onclick="filterOrders(this, 'delivered')">已送达</button>
        </div>
        <div id="order-list">加载中...</div>
    `;

    const res = await fetchFn();
    window._allOrders = res.data || [];
    renderOrders('');
}

async function filterOrders(btn, status) {
    document.querySelectorAll('#page-orders-content .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderOrders(status);
}

function renderOrders(status) {
    const list = document.getElementById('order-list');
    if (!list) return;
    let orders = window._allOrders || [];
    if (status) orders = orders.filter(o => o.status === status);

    if (orders.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div>暂无订单</div>`;
        return;
    }
    const isFarmer = currentRole === 'farmer';
    list.innerHTML = orders.map(o => renderOrderCard(o, isFarmer)).join('');
}

async function advanceOrder(orderId) {
    const res = await OrderAPI.advance(orderId);
    showToast(res.message);
    if (res.code === 0) loadOrdersPage();
}

async function loadShopPage() {
    const container = document.getElementById('page-shop-content');
    if (!container || !currentFarmer) return;
    container.innerHTML = `
        <h2 class="page-title">🏪 店铺设置</h2>
        <div class="card">
            <h3 class="section-title">基本信息</h3>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">店主姓名</label>
                    <input type="text" class="form-input" value="${esc(currentFarmer.name)}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">手机号</label>
                    <input type="text" class="form-input" value="${esc(currentFarmer.phone)}" disabled>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">种植地址</label>
                <input type="text" class="form-input" value="${esc(currentFarmer.address)}" disabled>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">种植品类</label>
                    <input type="text" class="form-input" value="${esc(currentFarmer.categories)}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">认证信息</label>
                    <input type="text" class="form-input" value="${esc(CERT_TEXT[currentFarmer.certification] || currentFarmer.certification)}" disabled>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">审核状态</label>
                <span class="tag ${currentFarmer.status === 'approved' ? 'tag-leaf' : 'tag-fresh'}">
                    ${currentFarmer.status === 'approved' ? '已通过' : (currentFarmer.status === 'rejected' ? '已拒绝' : '审核中')}
                </span>
            </div>
        </div>
        <div class="card">
            <h3 class="section-title">店铺信息</h3>
            <div class="form-group">
                <label class="form-label">店铺名称</label>
                <input type="text" class="form-input" id="shop-name" value="${esc(currentFarmer.shop_name || '')}" placeholder="如：张大爷的有机菜园">
            </div>
            <div class="form-group">
                <label class="form-label">店铺描述</label>
                <textarea class="form-textarea" id="shop-desc" placeholder="介绍一下您的店铺和种植理念">${esc(currentFarmer.shop_description || '')}</textarea>
            </div>
            <button class="btn btn-primary" onclick="saveShop()">保存设置</button>
        </div>
    `;
}

async function saveShop() {
    const shopName = document.getElementById('shop-name').value.trim();
    const shopDesc = document.getElementById('shop-desc').value.trim();
    const res = await FarmerAPI.updateShop({ farmer_id: currentFarmer.id, shop_name: shopName, shop_description: shopDesc });
    if (res.code === 0) {
        currentFarmer = res.data;
        Storage.setFarmer(res.data);
        showToast('保存成功');
    } else {
        showToast(res.message, true);
    }
}

async function loadAuditPage() {
    const container = document.getElementById('page-audit-content');
    if (!container) return;
    container.innerHTML = `
        <h2 class="page-title">✅ 农户审核</h2>
        <div class="tabs">
            <button class="tab-btn active" onclick="filterAudit(this, 'pending')">待审核</button>
            <button class="tab-btn" onclick="filterAudit(this, 'approved')">已通过</button>
            <button class="tab-btn" onclick="filterAudit(this, 'rejected')">已拒绝</button>
        </div>
        <div id="audit-list">加载中...</div>
    `;
    await loadAuditList('pending');
}

async function filterAudit(btn, status) {
    document.querySelectorAll('#page-audit-content .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    await loadAuditList(status);
}

async function loadAuditList(status) {
    const res = await FarmerAPI.list(status);
    const list = document.getElementById('audit-list');
    const farmers = res.data || [];
    if (farmers.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌱</div>暂无数据</div>`;
        return;
    }
    list.innerHTML = farmers.map(f => `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                <div>
                    <h3 style="margin-bottom:8px;">${esc(f.name)} ${renderCertBadge(f.certification)}</h3>
                    <p style="color:#666;margin-bottom:4px;">📱 ${esc(f.phone)}</p>
                    <p style="color:#666;margin-bottom:4px;">📍 ${esc(f.address)}</p>
                    <p style="color:#666;margin-bottom:4px;">🌾 种植品类：${esc(f.categories)}</p>
                    ${f.certification_desc ? `<p style="color:#666;margin-bottom:4px;">📄 ${esc(f.certification_desc)}</p>` : ''}
                    ${f.shop_name ? `<p style="color:#666;">🏪 ${esc(f.shop_name)}</p>` : ''}
                </div>
                <div style="display:flex;gap:8px;">
                    ${f.status === 'pending' ? `
                        <button class="btn btn-primary btn-sm" onclick="approveFarmer(${f.id})">通过</button>
                        <button class="btn btn-danger btn-sm" onclick="rejectFarmer(${f.id})">拒绝</button>
                    ` : `<span class="tag ${f.status === 'approved' ? 'tag-leaf' : 'tag-category'}">${f.status === 'approved' ? '已通过' : '已拒绝'}</span>`}
                </div>
            </div>
        </div>
    `).join('');
}

async function approveFarmer(id) {
    const res = await FarmerAPI.approve(id);
    showToast(res.message);
    loadAuditList('pending');
}

async function rejectFarmer(id) {
    if (!confirm('确定拒绝该农户的入驻申请？')) return;
    await FarmerAPI.reject(id);
    showToast('已拒绝');
    loadAuditList('pending');
}

async function loadStatsPage() {
    const container = document.getElementById('page-stats-content');
    if (!container) return;
    container.innerHTML = `
        <h2 class="page-title">📈 统计排行</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="card">
                <h3 class="section-title">🥇 各品类销量排行</h3>
                <div id="sales-chart" class="sales-chart">加载中...</div>
            </div>
            <div class="card">
                <h3 class="section-title">🏆 农户发货及时率排行</h3>
                <ul id="ranking-list" class="ranking-list">加载中...</ul>
            </div>
        </div>
    `;

    const [salesRes, rankRes] = await Promise.all([StatsAPI.categorySales(), StatsAPI.farmerDelivery()]);

    const salesEl = document.getElementById('sales-chart');
    const sales = salesRes.data || [];
    if (sales.length === 0) {
        salesEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📊</div>暂无数据</div>`;
    } else {
        const max = Math.max(...sales.map(s => s.total_sold || 0), 1);
        salesEl.innerHTML = sales.map(s => `
            <div class="sales-item">
                <div class="sales-name">${esc(s.category)}</div>
                <div class="sales-bar-wrap">
                    <div class="sales-bar" style="width:${(s.total_sold || 0) / max * 100}%">${s.total_sold || 0}</div>
                </div>
                <div class="sales-value">${s.total_sold || 0} 件</div>
            </div>
        `).join('');
    }

    const rankEl = document.getElementById('ranking-list');
    const ranks = rankRes.data || [];
    if (ranks.length === 0) {
        rankEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏆</div>暂无数据</div>`;
    } else {
        rankEl.innerHTML = ranks.map((r, i) => `
            <li class="ranking-item">
                <div class="rank-num">${i + 1}</div>
                <div class="rank-info">
                    <div class="rank-name">${esc(r.shop_name || r.farmer_name)} ${renderCertBadge(r.certification)}</div>
                    <div class="rank-desc">完成${r.delivered_count}单 · 准时${r.on_time_count}单</div>
                </div>
                <div class="rank-rate">${r.on_time_rate}%</div>
            </li>
        `).join('');
    }
}
