const CATEGORIES = [
  { value: '', label: '全部类别', icon: '📦' },
  { value: 'tool', label: '工具', icon: '🔧' },
  { value: 'outdoor', label: '户外', icon: '🏕️' },
  { value: 'kitchen', label: '厨具', icon: '🍳' },
  { value: 'electronic', label: '电子', icon: '📱' },
  { value: 'sport', label: '运动', icon: '⚽' },
  { value: 'other', label: '其他', icon: '📌' },
];

const CONDITIONS = [
  { value: '', label: '全部状态' },
  { value: 'new', label: '全新' },
  { value: 'like_new', label: '九成新' },
  { value: 'usable', label: '可用' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));
const CONDITION_MAP = Object.fromEntries(CONDITIONS.map(c => [c.value, c.label]));

const STATUS_MAP = {
  available: '可借用', borrowed: '借出中', unavailable: '暂不可用',
  pending: '待审批', approved: '已同意', rejected: '已拒绝', cancelled: '已取消',
  returned: '已归还', overdue: '已超时'
};

const AppState = {
  view: 'home',
  params: {},
  listFilter: { category: '', condition: '', keyword: '', page: 1 },
  records: { tab: 'borrow', status: '' },
  publish: (() => {
    try {
      const saved = localStorage.getItem('community_publish_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || '', category: parsed.category || '', condition: parsed.condition || '',
          description: parsed.description || '', borrowRule: parsed.borrowRule || '',
          times: parsed.times || [], imageUrl: parsed.imageUrl || '',
          timeDay: '', timeVal: ''
        };
      }
    } catch(e) {}
    return {
      name: '', category: '', condition: '', description: '',
      borrowRule: '', times: [], imageUrl: '', timeDay: '', timeVal: ''
    };
  })(),
  review: { recordId: 0, rating: 5, comment: '' },
  borrow: { startDate: '', endDate: '', message: '' }
};

function savePublishDraft() {
  try {
    const p = AppState.publish;
    localStorage.setItem('community_publish_draft', JSON.stringify({
      name: p.name, category: p.category, condition: p.condition,
      description: p.description, borrowRule: p.borrowRule,
      times: p.times, imageUrl: p.imageUrl
    }));
  } catch(e) {}
}

function clearPublishDraft() {
  try { localStorage.removeItem('community_publish_draft'); } catch(e) {}
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])
  );
}

function renderStars(rating) {
  const r = Math.round(Number(rating) || 0);
  return '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.className = 'toast ' + type;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function requireLogin(target) {
  if (!api.isLoggedIn()) {
    showLoginModal();
    toast('请先登录', 'error');
    return false;
  }
  if (target) navigate(target);
  return true;
}

function navigate(view, params = {}) {
  AppState.view = view;
  AppState.params = params || {};
  window.scrollTo(0, 0);
  renderApp();
}

function renderUserArea() {
  const el = document.getElementById('user-area');
  const notifEl = document.getElementById('notification-area');
  if (api.isLoggedIn()) {
    const u = api.userInfo || {};
    const unread = window.__unreadCount || 0;
    notifEl.innerHTML = `
      <div class="notification-trigger" onclick="toggleNotifications()" title="消息通知">
        <span style="position:relative;cursor:pointer;font-size:22px;">🔔</span>
        ${unread > 0 ? `<span class="notif-badge">${unread > 99 ? '99+' : unread}</span>` : ''}
      </div>
      <div id="notification-panel" class="notification-panel hidden">
        <div class="notif-header">
          <div style="font-weight:600;">消息通知</div>
          <a href="javascript:;" onclick="markAllNotifsRead()" style="font-size:12px;color:#66bb6a;">全部已读</a>
        </div>
        <div id="notification-list" class="notif-list"></div>
      </div>
    `;
    el.innerHTML = `
      <div class="user-avatar" title="${esc(u.nickname)}" onclick="navigate('profile',{id:${u.id}})">
        <img src="${esc(u.avatar_url)}" onerror="this.src='/static/community/images/avatar1.svg'">
      </div>
      <div style="color:white;font-size:13px;">
        ${esc(u.nickname)}
        <div style="font-size:11px;color:#fff59d;">${renderStars(u.credit_score)}</div>
      </div>
      <button class="nav-btn" onclick="doLogout()">退出</button>
    `;
  } else {
    notifEl.innerHTML = '';
    el.innerHTML = `<button class="login-btn" onclick="showLoginModal()">登录 / 注册</button>`;
  }
  document.getElementById('nav-home').classList.toggle('active', AppState.view === 'home');
  document.getElementById('nav-records').classList.toggle('active', AppState.view === 'records');
}

function doLogout() {
  api.logout();
  window.__unreadCount = 0;
  if (window.__notifTimer) clearInterval(window.__notifTimer);
  renderUserArea();
  navigate('home');
  toast('已退出登录');
}

/* ========= 通知相关 ========= */
const NOTIF_ICONS = {
  overdue: '⏰',
  request: '📩',
  approved: '✅',
  rejected: '❌'
};

function toggleNotifications() {
  const panel = document.getElementById('notification-panel');
  if (!panel) return;
  const isHidden = panel.classList.contains('hidden');
  if (isHidden) {
    panel.classList.remove('hidden');
    loadNotifications();
    document.addEventListener('click', closeNotifPanelOnOutside, { once: true });
  } else {
    panel.classList.add('hidden');
  }
}

function closeNotifPanelOnOutside(e) {
  const panel = document.getElementById('notification-panel');
  const trigger = document.querySelector('.notification-trigger');
  if (panel && !panel.contains(e.target) && !trigger.contains(e.target)) {
    panel.classList.add('hidden');
  } else {
    document.addEventListener('click', closeNotifPanelOnOutside, { once: true });
  }
}

async function loadNotifications() {
  const listEl = document.getElementById('notification-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">加载中...</div>';
  const res = await api.getNotifications(false);
  if (res.code === 0 && res.data) {
    const notifs = res.data;
    if (notifs.length === 0) {
      listEl.innerHTML = '<div class="notif-empty">🔔 暂无消息</div>';
    } else {
      listEl.innerHTML = notifs.map(n => {
        const icon = NOTIF_ICONS[n.type] || '📬';
        const time = n.created_at ? new Date(n.created_at.replace(' ', 'T')).toLocaleString('zh-CN', {
          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        }) : '';
        return `
          <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="handleNotifClick(${n.id}, ${n.related_id}, '${n.type}')">
            <span class="notif-icon">${icon}</span>
            <div class="notif-content">
              <div class="notif-title">${esc(n.title)}</div>
              <div class="notif-text">${esc(n.content || '')}</div>
              <div class="notif-time">${time}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  } else {
    listEl.innerHTML = '<div class="notif-empty">加载失败</div>';
  }
}

async function handleNotifClick(notifId, relatedId, type) {
  await api.markNotifRead(notifId);
  await refreshUnreadCount();
  if (type === 'request' || type === 'approved' || type === 'rejected') {
    navigate('records', { tab: relatedId ? 'requests' : 'myrequests' });
  } else if (type === 'overdue') {
    navigate('records', { tab: 'borrow' });
  }
  const panel = document.getElementById('notification-panel');
  if (panel) panel.classList.add('hidden');
}

async function markAllNotifsRead() {
  await api.markAllNotifsRead();
  await refreshUnreadCount();
  loadNotifications();
}

async function refreshUnreadCount() {
  if (!api.isLoggedIn()) { window.__unreadCount = 0; return; }
  const res = await api.getUnreadCount();
  if (res.code === 0 && res.data) {
    const oldCount = window.__unreadCount || 0;
    window.__unreadCount = res.data.unread_count || 0;
    if (oldCount !== window.__unreadCount) {
      renderUserArea();
    }
  }
}

function startNotifPolling() {
  if (window.__notifTimer) clearInterval(window.__notifTimer);
  refreshUnreadCount();
  window.__notifTimer = setInterval(refreshUnreadCount, 30000);
}

function showLoginModal() {
  const demoUsers = [
    { u: 'admin', p: 'admin123', n: '管理员', a: '/static/community/images/avatar1.svg' },
    { u: 'neighbor1', p: '123456', n: '小明', a: '/static/community/images/avatar1.svg' },
    { u: 'neighbor2', p: '123456', n: '李阿姨', a: '/static/community/images/avatar2.svg' },
    { u: 'neighbor3', p: '123456', n: '王叔叔', a: '/static/community/images/avatar3.svg' },
    { u: 'neighbor4', p: '123456', n: '张姐', a: '/static/community/images/avatar4.svg' },
  ];
  const html = `
    <div class="modal-backdrop" onclick="if(event.target===this)closeLoginModal()">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">登录 / 注册</div>
          <button class="modal-close" onclick="closeLoginModal()">×</button>
        </div>
        <div class="modal-body">
          <div style="padding:10px 14px;background:linear-gradient(135deg,#e8f5e9,#f1f8e9);border-radius:10px;margin-bottom:18px;font-size:13px;color:#2e7d32;">
            👋 欢迎来到邻里共享！点击头像快速登录：
          </div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;">
            ${demoUsers.map(d => `
              <button class="quick-login-btn" title="${esc(d.n)}"
                      onclick="doLogin('${d.u}','${d.p}')"
                      style="flex-direction:column;padding:8px;background:none;border:none;cursor:pointer;">
                <img src="${d.a}" style="width:48px;height:48px;border-radius:50%;border:2px solid #c8e6c9;">
                <div style="font-weight:600;font-size:12px;margin-top:4px;color:#333;">${esc(d.n)}</div>
              </button>
            `).join('')}
          </div>
          <div style="text-align:center;color:#999;font-size:12px;margin-bottom:14px;">—— 或手动输入（默认密码 123456） ——</div>
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input id="login-user" class="form-input" placeholder="输入用户名">
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input id="login-pass" type="password" class="form-input" placeholder="输入密码"
                   onkeyup="if(event.key==='Enter')manualLogin()">
          </div>
          <div id="login-err" style="display:none;padding:8px 12px;background:#ffebee;border-radius:8px;font-size:13px;color:#e53935;margin-bottom:14px;"></div>
          <button class="btn btn-primary btn-block" onclick="manualLogin()">🔐 登录 / 注册</button>
          <div style="font-size:11px;color:#999;text-align:center;margin-top:12px;">
            账号不存在时自动注册，密码 123456 即可快速体验
          </div>
        </div>
      </div>
    </div>
  `;
  const el = document.getElementById('login-modal');
  el.innerHTML = html;
  el.style.display = 'block';
}

function closeLoginModal() {
  document.getElementById('login-modal').style.display = 'none';
}

async function doLogin(username, password) {
  document.getElementById('login-err').style.display = 'none';
  const res = await api.login(username, password);
  if (res.code === 0 && res.data) {
    const u = res.data.user;
    const user = {
      id: u.id, username: u.username,
      nickname: u.nickname || u.username,
      avatar_url: u.avatar_url || `/static/community/images/avatar${(u.id % 4) + 1}.svg`,
      credit_score: u.credit_score || 5.0
    };
    api.setUser(user);
    closeLoginModal();
    startNotifPolling();
    renderUserArea();
    toast('登录成功，欢迎 ' + user.nickname);
    renderApp();
  } else {
    const el = document.getElementById('login-err');
    el.textContent = res.message || '登录失败';
    el.style.display = 'block';
  }
}

function manualLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  if (!u) { const e=document.getElementById('login-err');e.textContent='请输入用户名';e.style.display='block';return; }
  if (!p) { const e=document.getElementById('login-err');e.textContent='请输入密码';e.style.display='block';return; }
  doLogin(u, p);
}

function ownerHtml(o) {
  if (!o) return '';
  return `
    <div class="owner-row">
      <div class="owner-avatar-sm">
        <img src="${esc(o.avatar_url)}" onerror="this.src='/static/community/images/avatar1.svg'">
      </div>
      <span>${esc(o.nickname)}</span>
    </div>
  `;
}

function itemCardHtml(it) {
  const cat = CATEGORY_MAP[it.category] || { icon: '', label: it.category };
  const condClass = 'condition-' + it.condition;
  const unavail = it.status !== 'available' ? 'unavailable' : '';
  const owner = it.owner || {};
  const ovr = esc(String(owner.credit_score || 5).slice(0,3));
  return `
    <div class="card item-card ${unavail}" onclick="navigate('detail',{id:${it.id}})">
      ${unavail ? '<div style="position:absolute;top:10px;right:10px;background:#757575;color:white;padding:3px 10px;border-radius:10px;font-size:12px;z-index:2;">借出中</div>' : ''}
      <div class="item-image">
        ${it.image_url ? `<img src="${esc(it.image_url)}" onerror="this.style.display='none'">` : ''}
      </div>
      <div class="item-info">
        <div class="item-name">${esc(it.name)}</div>
        <span class="item-category">${cat.icon} ${esc(cat.label)}</span>
        <div class="item-desc">${esc(it.description)}</div>
        <div class="item-meta">
          <span class="condition-tag ${condClass}">${esc(CONDITION_MAP[it.condition] || it.condition)}</span>
          ${owner ? ownerHtml(owner) : ''}
          ${owner ? `<div class="stars">${renderStars(owner.credit_score)} <span style="color:#888;font-size:11px;">${ovr}</span></div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function emptyHtml(icon, text, extra = '') {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <p>${esc(text)}</p>
      ${extra}
    </div>
  `;
}

function stepsHtml(step) {
  const labels = ['提交申请', '发布者审批', '线下交接', '归还评价'];
  let html = '<div class="steps">';
  for (let i = 0; i < 4; i++) {
    const cls = i < step ? 'done' : i === step ? 'active' : '';
    const lineCls = i > 0 && i <= step ? 'done' : '';
    if (i > 0) html += `<div class="step-line ${lineCls}"></div>`;
    html += `
      <div class="step ${cls}">
        <div class="step-circle">${i + 1}</div>
        <div class="step-label">${labels[i]}</div>
      </div>
    `;
  }
  html += '</div>';
  return html;
}

function ratingInputHtml(name, val = 5) {
  const labels = ['很不满意','不太满意','一般般','比较满意','非常满意'];
  let html = `<div id="ri-${name}" data-value="${val}">
    <div style="text-align:center;margin-bottom:10px;">
      <div style="font-size:14px;color:#666;margin-bottom:10px;">您对这次借用满意吗？请打个分吧</div>
      <div class="rating-input" style="justify-content:center;">`;
  for (let i = 1; i <= 5; i++) {
    html += `<button type="button" class="star-btn ${i<=val?'filled':''}" data-n="${i}" onclick="setRating('${name}',${i})">★</button>`;
  }
  html += `</div>
      <div style="color:#ffb300;font-size:13px;margin-top:6px;" id="ri-label-${name}">${labels[val-1]||''}</div>
    </div>
  </div>`;
  return html;
}

function setRating(name, n) {
  const cont = document.getElementById('ri-' + name);
  if (!cont) return;
  cont.dataset.value = n;
  const btns = cont.querySelectorAll('.star-btn');
  btns.forEach((b, i) => b.classList.toggle('filled', i < n));
  const labels = ['很不满意','不太满意','一般般','比较满意','非常满意'];
  const lb = document.getElementById('ri-label-' + name);
  if (lb) lb.textContent = labels[n - 1] || '';
  AppState.review.rating = n;
}

function getRating(name) {
  const cont = document.getElementById('ri-' + name);
  return cont ? Number(cont.dataset.value || 5) : 5;
}
