/* ========= 首页：物品列表 ========= */
async function renderHomePage() {
  let overdueHtml = '';
  if (api.isLoggedIn()) {
    const or = await api.getMyOverdue();
    if (or.code === 0 && or.data && or.data.length > 0) {
      overdueHtml = `
        <div class="reminder-banner">
          <span class="reminder-icon">⚠️</span>
          <div class="reminder-text">
            <strong>您有 ${or.data.length} 条超时提醒</strong>
            <span>请尽快归还物品，以免影响您的信誉</span>
          </div>
          <button class="btn btn-sm btn-danger" onclick="navigate('records',{tab:'borrow'})">查看</button>
        </div>`;
    }
  }

  const f = AppState.listFilter;
  const categoryChips = CATEGORIES.map(c =>
    `<span class="chip ${f.category===c.value?'active':''}" onclick="setFilter('category','${c.value}')">${c.icon} ${c.label}</span>`
  ).join('');
  const condChips = CONDITIONS.map(c =>
    `<span class="chip ${f.condition===c.value?'active':''}" onclick="setFilter('condition','${c.value}')">${c.label}</span>`
  ).join('');

  setHtml('main-content', `
    ${overdueHtml}
    <div class="card" style="margin-bottom:20px;">
      <div class="filter-bar">
        <input class="search-input" value="${esc(f.keyword)}" placeholder="搜索物品名称..."
               onkeyup="if(event.key==='Enter'){AppState.listFilter.keyword=this.value;loadList(1);}">
        <div class="filter-group"><span class="filter-label">类别</span>${categoryChips}</div>
      </div>
      <div class="filter-bar" style="margin-bottom:0;">
        <div class="filter-group"><span class="filter-label">成色</span>${condChips}</div>
        <div class="filter-group" style="margin-left:auto;">
          <button class="btn btn-primary" onclick="requireLogin('publish')">＋ 发布物品</button>
        </div>
      </div>
    </div>
    <div class="page-title" style="margin-top:8px;">
      <span>邻里好物</span>
      <span id="list-total" style="font-size:13px;color:#999;font-weight:normal;margin-left:8px;">加载中...</span>
    </div>
    <div id="list-items"></div>
    <div id="list-pager" style="display:flex;justify-content:center;gap:8px;margin-top:24px;"></div>
  `);
  loadList(f.page);
}

function setFilter(key, val) {
  AppState.listFilter[key] = val;
  loadList(1);
  renderHomePage();
}

async function loadList(page) {
  AppState.listFilter.page = page;
  const f = AppState.listFilter;
  const res = await api.getItemList({
    category: f.category || undefined,
    condition: f.condition || undefined,
    keyword: f.keyword || undefined,
    page: page,
    page_size: 8
  });
  const itemsEl = document.getElementById('list-items');
  const totalEl = document.getElementById('list-total');
  const pagerEl = document.getElementById('list-pager');
  if (!itemsEl) return;

  if (res.code !== 0) {
    itemsEl.innerHTML = emptyHtml('❌', res.message || '加载失败');
    return;
  }
  const { items = [], total = 0 } = res.data || {};
  totalEl.textContent = `共 ${total} 件`;

  if (items.length === 0) {
    itemsEl.innerHTML = emptyHtml('🏷️', '还没有符合条件的物品',
      `<p style="font-size:13px;color:#aaa;margin-top:6px;">发布第一件闲置物品吧～</p>
       <button class="btn btn-primary" style="margin-top:16px;" onclick="requireLogin('publish')">立即发布</button>`);
    pagerEl.innerHTML = '';
    return;
  }

  itemsEl.innerHTML = `<div class="items-grid">${items.map(itemCardHtml).join('')}</div>`;
  const pageSize = 8;
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages > 1) {
    pagerEl.innerHTML = `
      <button class="btn btn-sm btn-secondary" ${page<=1?'disabled':''} onclick="loadList(${page-1})">上一页</button>
      <span style="display:flex;align-items:center;color:#666;font-size:14px;">第 ${page} / ${totalPages} 页</span>
      <button class="btn btn-sm btn-secondary" ${page>=totalPages?'disabled':''} onclick="loadList(${page+1})">下一页</button>
    `;
  } else {
    pagerEl.innerHTML = '';
  }
}

/* ========= 物品详情页 ========= */
async function renderDetailPage() {
  const id = AppState.params.id;
  if (!id) { navigate('home'); return; }
  setHtml('main-content', `<div style="margin-bottom:16px;"><button class="btn btn-sm btn-secondary" onclick="navigate('home')">← 返回列表</button></div>
    <div class="empty-state"><div class="empty-icon">📦</div><p>加载中...</p></div>`);

  const res = await api.getItemDetail(id);
  if (res.code !== 0 || !res.data) {
    setHtml('main-content', `<div style="margin-bottom:16px;"><button class="btn btn-sm btn-secondary" onclick="navigate('home')">← 返回列表</button></div>
      ${emptyHtml('❌', '物品不存在')}`);
    return;
  }
  const it = res.data;
  const cat = CATEGORY_MAP[it.category] || { icon: '', label: it.category };
  const owner = it.owner || {};
  const isOwner = api.isLoggedIn() && Number(it.owner_id) === Number(api.userId);
  const canBorrow = api.isLoggedIn() && it.status === 'available' && !isOwner;
  const guestCantBorrow = !api.isLoggedIn() && it.status === 'available';

  let currentStep = 0;
  let contactInfo = null;
  if (api.isLoggedIn() && !isOwner) {
    const mr = await api.getMyBorrowRequests();
    if (mr.code === 0) {
      const matched = (mr.data || []).find(r => Number(r.item_id) === Number(id) && r.status === 'approved');
      if (matched && matched.record) {
        const cr = await api.getContact(matched.record.id);
        if (cr.code === 0) contactInfo = cr.data;
        currentStep = Math.max(currentStep, 2);
      } else if (matched) {
        currentStep = 1;
      } else {
        const pend = (mr.data || []).find(r => Number(r.item_id) === Number(id) && r.status === 'pending');
        if (pend) currentStep = 1;
      }
    }
  }

  const today = new Date().toISOString().slice(0,10);
  const timesHtml = (it.available_times || []).map(t =>
    `<span class="times-pill">🕐 ${esc(t.day)} ${esc(t.time)}</span>`
  ).join('') || '<span style="color:#999;">请联系发布者咨询</span>';

  const reviewsHtml = (it.reviews || []).map(r => {
    const rv = r.reviewer || {};
    return `
      <div class="review-card">
        <div class="review-header">
          <div class="reviewer-avatar">
            <img src="${esc(rv.avatar_url)}" onerror="this.src='/static/community/images/avatar1.svg'">
          </div>
          <div class="reviewer-info">
            <div class="reviewer-name">${esc(rv.nickname || '匿名用户')}</div>
            <div class="review-date"><span class="stars">${renderStars(r.rating)}</span>
              <span style="margin-left:8px;">${esc(String(r.created_at).slice(0,16))}</span></div>
          </div>
        </div>
        ${r.comment ? `<div class="review-comment">${esc(r.comment)}</div>` : ''}
      </div>`;
  }).join('');

  const ownerRating = (it.owner_rating && it.owner_rating.avg_rating) || owner.credit_score || 5;
  const ownerRatingCount = (it.owner_rating && it.owner_rating.total_count) || 0;
  const contactHtml = contactInfo ? `
    <div style="margin-top:16px;">
      <div class="contact-info">
        <div style="font-size:13px;color:#2e7d32;font-weight:600;margin-bottom:8px;">📞 对方联系方式</div>
        <div class="contact-row"><span class="contact-icon">👤</span>昵称：${esc(contactInfo.nickname)}</div>
        <div class="contact-row"><span class="contact-icon">🆔</span>账号：${esc(contactInfo.username)}</div>
        <div style="font-size:11px;color:#888;margin-top:8px;">请在双方约定的时间地点完成物品交接</div>
      </div>
    </div>` : '';

  let actionHtml = '';
  if (canBorrow || guestCantBorrow) {
    actionHtml = `
      <div class="borrow-form-section">
        <div class="form-group">
          <label class="form-label">借用起止日期</label>
          <div class="date-input-row">
            <input type="date" id="bf-start" class="form-input" value="${today}">
            <input type="date" id="bf-end" class="form-input" value="${today}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">留言给发布者</label>
          <textarea id="bf-msg" class="form-textarea" placeholder="简单说明使用用途..."></textarea>
        </div>
        <button class="btn btn-primary btn-block" onclick="submitBorrow(${it.id})">✨ 我想借</button>
      </div>`;
  } else if (isOwner) {
    actionHtml = `<div style="text-align:center;padding:12px 0;color:#666;font-size:13px;">
      这是您发布的物品
      <div style="margin-top:10px;">
        <button class="btn btn-sm btn-secondary" onclick="navigate('records',{tab:'lent'})">管理借出记录</button>
      </div></div>`;
  } else {
    actionHtml = `<div style="text-align:center;padding:16px 0;color:#e65100;font-size:14px;">
      该物品当前「借出中」，暂时无法借用
      <div style="margin-top:8px;font-size:12px;color:#999;">稍后再来看看吧～</div></div>`;
  }

  setHtml('main-content', `
    <div style="margin-bottom:16px;"><button class="btn btn-sm btn-secondary" onclick="navigate('home')">← 返回列表</button></div>
    <div class="detail-layout">
      <div class="detail-main card">
        <div class="image-gallery">
          ${it.image_url ? `<img src="${esc(it.image_url)}" onerror="this.style.display='none'">` : ''}
        </div>
        <div class="detail-info">
          <h2>${esc(it.name)}</h2>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
            <span class="item-category" style="font-size:13px;">${cat.icon} ${esc(cat.label)}</span>
            <span class="condition-tag condition-${it.condition}">${esc(CONDITION_MAP[it.condition] || it.condition)}</span>
            <span class="chip ${it.status==='available'?'active':''}">${STATUS_MAP[it.status] || it.status}</span>
          </div>
          <div class="detail-section"><h3>物品描述</h3><p>${esc(it.description)}</p></div>
          <div class="detail-section"><h3>借用规则</h3><p>${esc(it.borrow_rule)}</p></div>
          <div class="detail-section"><h3>可出借时间</h3><div>${timesHtml}</div></div>
          ${it.reviews && it.reviews.length ? `<div class="detail-section"><h3>相关评价 (${it.reviews.length})</h3>${reviewsHtml}</div>` : ''}
        </div>
      </div>
      <div class="detail-side">
        <div class="card owner-card" style="margin-bottom:16px;">
          <div class="avatar-lg">
            <img src="${esc(owner.avatar_url)}" onerror="this.src='/static/community/images/avatar1.svg'">
          </div>
          <div class="name">${esc(owner.nickname || '邻居')}</div>
          <div class="rating-display">
            <span class="stars">${renderStars(ownerRating)}</span>
            <strong style="color:#43a047;">${String(Number(ownerRating).toFixed(1))}</strong>
            <span style="color:#999;font-size:12px;">分</span>
          </div>
          <div style="font-size:12px;color:#888;">${ownerRatingCount} 条评价</div>
          <button class="btn btn-secondary btn-sm" style="margin-top:6px;" onclick="navigate('profile',{id:${it.owner_id}})">查看主页 →</button>
        </div>
        <div class="card">
          <h3 style="font-size:16px;color:#2e7d32;margin-bottom:14px;padding-left:10px;border-left:3px solid #81c784;">借用流程</h3>
          ${stepsHtml(currentStep)}
          ${actionHtml}
          ${contactHtml}
        </div>
      </div>
    </div>
  `);
}

async function submitBorrow(itemId) {
  if (!api.isLoggedIn()) { showLoginModal(); toast('请先登录', 'error'); return; }
  const s = document.getElementById('bf-start').value;
  const e = document.getElementById('bf-end').value;
  const msg = document.getElementById('bf-msg').value;
  if (!s) { toast('请选择起始日期', 'error'); return; }
  if (!e) { toast('请选择归还日期', 'error'); return; }
  if (e < s) { toast('归还日期不能早于起始日期', 'error'); return; }
  const res = await api.submitBorrowRequest({
    item_id: itemId,
    date_range: { start: s, end: e },
    message: msg || undefined
  });
  if (res.code === 0) {
    toast('申请已提交，请等待发布者审批');
    setTimeout(() => navigate('records', { tab: 'borrow' }), 1200);
  } else {
    toast(res.message || '提交失败', 'error');
  }
}

/* ========= 发布物品弹窗 ========= */
function showPublishModal() {
  AppState.publish = { name:'', category:'', condition:'', description:'', borrowRule:'', times:[], imageUrl:'', timeDay:'', timeVal:'' };
  renderPublishModal();
  document.getElementById('publish-modal').style.display = 'block';
}

function closePublishModal() {
  document.getElementById('publish-modal').style.display = 'none';
}

function renderPublishModal() {
  const p = AppState.publish;
  const cats = CATEGORIES.filter(c => c.value).map(c =>
    `<label class="radio-option ${p.category===c.value?'selected':''}">
       <input type="radio" ${p.category===c.value?'checked':''} onchange="AppState.publish.category='${c.value}';renderPublishModal();">
       <span>${c.icon} ${c.label}</span>
     </label>`
  ).join('');
  const conds = CONDITIONS.filter(c => c.value).map(c =>
    `<label class="radio-option ${p.condition===c.value?'selected':''}">
       <input type="radio" ${p.condition===c.value?'checked':''} onchange="AppState.publish.condition='${c.value}';renderPublishModal();">
       <span>${c.label}</span>
     </label>`
  ).join('');
  const days = ['周一','周二','周三','周四','周五','周六','周日','工作日','周末','每天'];
  const timesPills = p.times.map((t, i) =>
    `<span class="times-pill">🕐 ${esc(t.day)} ${esc(t.time)}
       <span class="remove" onclick="AppState.publish.times.splice(${i},1);renderPublishModal();">×</span>
     </span>`
  ).join('');
  const daysOpts = days.map(d => `<option ${p.timeDay===d?'selected':''}>${d}</option>`).join('');

  const html = `
    <div class="modal-backdrop" onclick="if(event.target===this)closePublishModal()">
      <div class="modal" style="max-width:720px;">
        <div class="modal-header">
          <div class="modal-title">发布闲置物品</div>
          <button class="modal-close" onclick="closePublishModal()">×</button>
        </div>
        <div class="modal-body">
          <div style="padding:8px 14px;background:#f1f8e9;border-radius:10px;margin-bottom:24px;font-size:13px;color:#2e7d32;">
            💡 提示：请如实填写物品信息，良好的信誉能让您更容易借到东西哦～
          </div>
          <div class="form-group">
            <label class="form-label">物品名称<span class="required">*</span></label>
            <input class="form-input" value="${esc(p.name)}" placeholder="例如：露营帐篷4人套装"
                   oninput="AppState.publish.name=this.value">
          </div>
          <div class="form-group">
            <label class="form-label">物品类别<span class="required">*</span></label>
            <div class="radio-group">${cats}</div>
          </div>
          <div class="form-group">
            <label class="form-label">物品成色<span class="required">*</span></label>
            <div class="radio-group">${conds}</div>
          </div>
          <div class="form-group">
            <label class="form-label">物品描述<span class="required">*</span></label>
            <textarea class="form-textarea" placeholder="详细描述物品的品牌、尺寸、使用情况..."
                      oninput="AppState.publish.description=this.value">${esc(p.description)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">借用规则<span class="required">*</span></label>
            <input class="form-input" value="${esc(p.borrowRule)}" placeholder="例如：免费借用，押金200元，3天内归还"
                   oninput="AppState.publish.borrowRule=this.value">
          </div>
          <div class="form-group">
            <label class="form-label">可出借时间段</label>
            <div style="margin-bottom:8px;">${timesPills}</div>
            <div class="time-input-row">
              <select class="form-select" onchange="AppState.publish.timeDay=this.value">
                <option value="">选择日期</option>${daysOpts}
              </select>
              <input class="form-input" placeholder="时间段（全天、18:00-22:00）" value="${esc(p.timeVal)}"
                     oninput="AppState.publish.timeVal=this.value">
              <button class="btn btn-secondary btn-sm" type="button" onclick="addPublishTime()">添加</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">物品图片 URL</label>
            <input class="form-input" value="${esc(p.imageUrl)}" placeholder="可留空，https开头图片链接"
                   oninput="AppState.publish.imageUrl=this.value">
            ${p.imageUrl ? `<div style="margin-top:10px;">
              <div style="width:140px;height:140px;border-radius:12px;overflow:hidden;border:2px dashed #a5d6a7;">
                <img src="${esc(p.imageUrl)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
              </div></div>` : ''}
          </div>
          <div style="display:flex;gap:12px;margin-top:24px;">
            <button class="btn btn-secondary" style="flex:1;" onclick="closePublishModal()">取消</button>
            <button class="btn btn-primary" style="flex:2;" onclick="submitPublish()">✨ 确认发布</button>
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('publish-modal').innerHTML = html;
}

function addPublishTime() {
  const p = AppState.publish;
  if (!p.timeDay || !p.timeVal) { toast('请填写日期和时间段', 'error'); return; }
  p.times.push({ day: p.timeDay, time: p.timeVal });
  p.timeDay = ''; p.timeVal = '';
  renderPublishModal();
}

async function submitPublish() {
  if (!api.isLoggedIn()) { showLoginModal(); toast('请先登录', 'error'); return; }
  const p = AppState.publish;
  if (!p.name) { toast('请填写物品名称', 'error'); return; }
  if (!p.category) { toast('请选择物品类别', 'error'); return; }
  if (!p.condition) { toast('请选择物品成色', 'error'); return; }
  if (!p.description) { toast('请填写物品描述', 'error'); return; }
  if (!p.borrowRule) { toast('请填写借用规则', 'error'); return; }
  const res = await api.publishItem({
    name: p.name, category: p.category, condition: p.condition,
    description: p.description, borrow_rule: p.borrowRule,
    available_times: p.times, image_url: p.imageUrl || undefined
  });
  if (res.code === 0) {
    closePublishModal();
    toast('发布成功！');
    navigate('detail', { id: res.data.id });
  } else {
    toast(res.message || '发布失败', 'error');
  }
}

/* ========= 借用中心 ========= */
let _recordsCache = { borrow: null, lent: null, requests: null, myrequests: null };
let _reviewTarget = null;
let _contactTarget = null;

async function renderRecordsPage() {
  if (!api.isLoggedIn()) { showLoginModal(); toast('请先登录', 'error'); navigate('home'); return; }
  const tab = AppState.params.tab || 'borrow';
  AppState.records.tab = tab;
  AppState.records.status = '';
  _recordsCache = { borrow: null, lent: null, requests: null, myrequests: null };

  const statusFilters = [
    {v:'',l:'全部'},{v:'pending',l:'待处理'},{v:'approved',l:'已同意'},
    {v:'borrowed',l:'借用中'},{v:'overdue',l:'已超时'},{v:'returned',l:'已归还'},{v:'rejected',l:'已拒绝'}
  ];
  const statusChips = statusFilters.map(s =>
    `<span class="chip ${AppState.records.status===s.v?'active':''}" onclick="filterRecords('${s.v}')">${s.l}</span>`
  ).join('');

  setHtml('main-content', `
    <div class="page-title">借用中心</div>
    <div class="card" style="margin-bottom:18px;">
      <div class="tabs">
        <div class="tab ${tab==='borrow'?'active':''}" onclick="switchRecordsTab('borrow')">📥 我借入的</div>
        <div class="tab ${tab==='lent'?'active':''}" onclick="switchRecordsTab('lent')">📤 我借出的</div>
        <div class="tab ${tab==='requests'?'active':''}" onclick="switchRecordsTab('requests')">📋 收到的申请</div>
        <div class="tab ${tab==='myrequests'?'active':''}" onclick="switchRecordsTab('myrequests')">📝 我的申请</div>
      </div>
      <div class="filter-bar" style="margin-bottom:0;">
        <div class="filter-group"><span class="filter-label">状态</span>${statusChips}</div>
      </div>
    </div>
    <div id="records-body">
      <div class="empty-state"><div class="empty-icon">⏳</div><p>加载中...</p></div>
    </div>
    <div id="review-modal" style="display:none;"></div>
    <div id="contact-modal" style="display:none;"></div>
  `);
  loadRecords();
}

function switchRecordsTab(tab) {
  AppState.records.tab = tab;
  AppState.records.status = '';
  navigate('records', { tab });
}

async function filterRecords(status) {
  AppState.records.status = status;
  renderRecordsTabsOnly();
  loadRecords();
}

function renderRecordsTabsOnly() {
  const tab = AppState.records.tab;
  const statusFilters = [
    {v:'',l:'全部'},{v:'pending',l:'待处理'},{v:'approved',l:'已同意'},
    {v:'borrowed',l:'借用中'},{v:'overdue',l:'已超时'},{v:'returned',l:'已归还'},{v:'rejected',l:'已拒绝'}
  ];
  const statusChips = statusFilters.map(s =>
    `<span class="chip ${AppState.records.status===s.v?'active':''}" onclick="filterRecords('${s.v}')">${s.l}</span>`
  ).join('');
  document.querySelector('.tabs').innerHTML = `
    <div class="tab ${tab==='borrow'?'active':''}" onclick="switchRecordsTab('borrow')">📥 我借入的</div>
    <div class="tab ${tab==='lent'?'active':''}" onclick="switchRecordsTab('lent')">📤 我借出的</div>
    <div class="tab ${tab==='requests'?'active':''}" onclick="switchRecordsTab('requests')">📋 收到的申请</div>
    <div class="tab ${tab==='myrequests'?'active':''}" onclick="switchRecordsTab('myrequests')">📝 我的申请</div>
  `;
  const fb = document.querySelector('.filter-bar');
  if (fb) fb.innerHTML = `<div class="filter-group"><span class="filter-label">状态</span>${statusChips}</div>`;
}

function recordCardImg(item) {
  return `<div class="record-item-img">
    ${item && item.image_url ? `<img src="${esc(item.image_url)}" onerror="this.style.display='none'">` : ''}
  </div>`;
}

function metaRow(parts) {
  return `<div class="record-meta-row">${parts.map(p => `<span>${p}</span>`).join('')}</div>`;
}

function renderBorrowRecords(records) {
  if (records.length === 0) return emptyHtml('📭', '还没有借入记录', `<button class="btn btn-primary" style="margin-top:16px;" onclick="navigate('home')">去逛逛</button>`);
  return `<div class="record-list">${records.map(r => {
    const item = r.item || {};
    const owner = r.owner || {};
    const isOverdue = r.status === 'overdue';
    const actions = [];
    if (r.status === 'borrowed' || r.status === 'overdue') {
      actions.push(`<button class="btn btn-sm btn-secondary" onclick="showContactModal(${r.id})">查看联系方式</button>`);
    }
    if (r.status === 'returned' && !r.reviewed_by_me) {
      actions.push(`<button class="btn btn-sm btn-primary" onclick="showReviewModal(${r.id})">✏️ 去评价</button>`);
    }
    return `<div class="card record-card">
      ${recordCardImg(item)}
      <div class="record-content">
        <div class="record-title-row">
          <div class="record-title" onclick="navigate('detail',{id:${r.item_id}})">${esc(item.name || '物品')}</div>
          <span class="status-badge status-${r.status}">${STATUS_MAP[r.status] || r.status}</span>
        </div>
        ${metaRow([
          '📅 借用：' + (r.borrow_date || '-'),
          '🎯 约定归还：' + (r.expected_return_date || '-'),
          r.return_date ? '✅ 实际归还：' + r.return_date : '',
          isOverdue ? '<span style="color:#e53935;font-weight:600;">⚠️ 已超时</span>' : ''
        ].filter(Boolean))}
        ${owner ? `<div class="record-meta-row" style="color:#2e7d32;">借出方：${ownerHtml(owner)}</div>` : ''}
        ${actions.length ? `<div class="record-actions">${actions.join('')}</div>` : ''}
        ${r.status === 'returned' && r.reviewed_by_me ? '<div style="color:#888;font-size:12px;margin-top:auto;">✅ 已完成评价</div>' : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

function renderLentRecords(records) {
  if (records.length === 0) return emptyHtml('📤', '还没有借出记录', `<button class="btn btn-primary" style="margin-top:16px;" onclick="showPublishModal()">发布物品</button>`);
  return `<div class="record-list">${records.map(r => {
    const item = r.item || {};
    const br = r.borrower || {};
    const actions = [];
    if (r.status === 'approved') {
      actions.push(`<button class="btn btn-sm btn-primary" onclick="doMarkBorrowed(${r.id})">标记已借出</button>`);
    }
    if (r.status === 'borrowed' || r.status === 'overdue') {
      actions.push(`<button class="btn btn-sm btn-warning" onclick="doMarkReturned(${r.id})">标记已归还</button>`);
      actions.push(`<button class="btn btn-sm btn-secondary" onclick="showContactModal(${r.id})">查看联系方式</button>`);
    }
    if (r.status === 'returned' && !r.reviewed_by_me) {
      actions.push(`<button class="btn btn-sm btn-primary" onclick="showReviewModal(${r.id})">✏️ 去评价</button>`);
    }
    return `<div class="card record-card">
      ${recordCardImg(item)}
      <div class="record-content">
        <div class="record-title-row">
          <div class="record-title" onclick="navigate('detail',{id:${r.item_id}})">${esc(item.name || '物品')}</div>
          <span class="status-badge status-${r.status}">${STATUS_MAP[r.status] || r.status}</span>
        </div>
        ${metaRow([
          '📅 借出：' + (r.borrow_date || '-'),
          '🎯 约定归还：' + (r.expected_return_date || '-'),
          r.return_date ? '✅ 实际归还：' + r.return_date : '',
          r.status === 'overdue' ? '<span style="color:#e53935;font-weight:600;">⚠️ 已超时</span>' : ''
        ].filter(Boolean))}
        ${br ? `<div class="record-meta-row" style="color:#2e7d32;">借入方：
          <div class="owner-row" style="gap:6px;">
            <div class="owner-avatar-sm"><img src="${esc(br.avatar_url)}" onerror="this.style.display='none'"></div>
            <span>${esc(br.nickname)}</span>
            <span class="stars">${renderStars(br.credit_score)}</span>
          </div></div>` : ''}
        ${r.message ? `<div style="background:#f1f8e9;padding:6px 10px;border-radius:6px;font-size:12px;color:#388e3c;">💬 ${esc(r.message)}</div>` : ''}
        ${actions.length ? `<div class="record-actions">${actions.join('')}</div>` : ''}
        ${r.status === 'returned' && r.reviewed_by_me ? '<div style="color:#888;font-size:12px;margin-top:auto;">✅ 已完成评价</div>' : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

function renderRequests(reqs, isReceived) {
  const empty = isReceived
    ? emptyHtml('📋', '暂无新的借用申请')
    : emptyHtml('📝', '您还没有提交过借用申请', `<button class="btn btn-primary" style="margin-top:16px;" onclick="navigate('home')">去逛逛</button>`);
  if (reqs.length === 0) return empty;
  return `<div class="record-list">${reqs.map(r => {
    const item = r.item || {};
    const dr = r.date_range || {};
    let extraInfo = '';
    let actions = [];
    if (isReceived) {
      const br = r.borrower || {};
      const bRating = r.borrower_rating || {};
      extraInfo = `<div class="record-meta-row" style="color:#2e7d32;">申请人：
        <div class="owner-row" style="gap:6px;">
          <div class="owner-avatar-sm"><img src="${esc(br.avatar_url)}" onerror="this.style.display='none'"></div>
          <span>${esc(br.nickname)}</span>
          <span class="stars">${renderStars(br.credit_score)}</span>
          <strong style="color:#43a047;">${String(Number(br.credit_score).toFixed(1))}</strong>
        </div></div>
        ${bRating.total_count > 0 ? `<div style="font-size:12px;color:#666;margin-top:4px;">
          📊 历史评价：${bRating.total_count} 次，平均 ${bRating.avg_rating} 分
          ${bRating.avg_rating >= 4 ? '<span style="color:#43a047;font-weight:600;">⭐ 信誉高，优先出借推荐</span>' : ''}
        </div>` : ''}`;
      if (r.status === 'pending') {
        actions.push(`<button class="btn btn-sm btn-primary" onclick="doApprove(${r.id})">✅ 同意出借</button>`);
        actions.push(`<button class="btn btn-sm btn-danger" onclick="doReject(${r.id})">❌ 拒绝</button>`);
      }
    } else {
      const o = r.owner || {};
      extraInfo = `<div class="record-meta-row">借出方：${o.nickname ? `<div class="owner-row" style="gap:6px;">
        <div class="owner-avatar-sm"><img src="${esc(o.avatar_url)}" onerror="this.style.display='none'"></div>
        <span>${esc(o.nickname)}</span></div>` : ''}</div>`;
      if (r.status === 'approved' && r.record) {
        actions.push(`<button class="btn btn-sm btn-primary" onclick="showContactModal(${r.record.id})">查看联系方式</button>`);
      }
      if (r.status === 'pending') {
        actions.push(`<button class="btn btn-sm btn-secondary" onclick="doCancel(${r.id})">取消申请</button>`);
      }
    }
    return `<div class="card record-card">
      ${recordCardImg(item)}
      <div class="record-content">
        <div class="record-title-row">
          <div class="record-title" onclick="navigate('detail',{id:${r.item_id}})">${esc(item.name || '物品')}</div>
          <span class="status-badge status-${r.status}">${STATUS_MAP[r.status] || r.status}</span>
        </div>
        ${metaRow([
          `📅 ${dr.start || '-'} ~ ${dr.end || '-'}`,
        ].filter(Boolean))}
        ${extraInfo}
        ${r.message ? `<div style="background:#f1f8e9;padding:6px 10px;border-radius:6px;font-size:12px;color:#388e3c;">💬 ${isReceived ? '留言' : '我的留言'}：${esc(r.message)}</div>` : ''}
        ${actions.length ? `<div class="record-actions">${actions.join('')}</div>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

async function loadRecords() {
  const body = document.getElementById('records-body');
  if (!body) return;
  body.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><p>加载中...</p></div>`;
  const tab = AppState.records.tab;
  const sf = AppState.records.status || undefined;
  let html = '';
  if (tab === 'borrow') {
    const r = await api.getMyBorrowRecords(sf);
    html = r.code === 0 ? renderBorrowRecords(r.data || []) : emptyHtml('❌', r.message);
  } else if (tab === 'lent') {
    const r = await api.getMyLentRecords(sf);
    html = r.code === 0 ? renderLentRecords(r.data || []) : emptyHtml('❌', r.message);
  } else if (tab === 'requests') {
    const r = await api.getReceivedBorrowRequests(sf);
    html = r.code === 0 ? renderRequests(r.data || [], true) : emptyHtml('❌', r.message);
  } else {
    const r = await api.getMyBorrowRequests(sf);
    html = r.code === 0 ? renderRequests(r.data || [], false) : emptyHtml('❌', r.message);
  }
  body.innerHTML = html;
}

async function doApprove(id) {
  const r = await api.approveRequest(id);
  if (r.code === 0) { toast('已同意出借，双方可查看联系方式'); loadRecords(); }
  else toast(r.message || '操作失败', 'error');
}
async function doReject(id) {
  const r = await api.rejectRequest(id);
  if (r.code === 0) { toast('已拒绝'); loadRecords(); }
  else toast(r.message || '操作失败', 'error');
}
async function doCancel(id) {
  const r = await api.cancelRequest(id);
  if (r.code === 0) { toast('已取消申请'); loadRecords(); }
  else toast(r.message || '操作失败', 'error');
}
async function doMarkBorrowed(id) {
  const r = await api.markBorrowed(id);
  if (r.code === 0) { toast('已标记借出'); loadRecords(); }
  else toast(r.message || '操作失败', 'error');
}
async function doMarkReturned(id) {
  const r = await api.markReturned(id);
  if (r.code === 0) { toast('已标记归还，快去评价对方吧～'); loadRecords(); }
  else toast(r.message || '操作失败', 'error');
}

function showReviewModal(recordId) {
  _reviewTarget = recordId;
  AppState.review.rating = 5;
  AppState.review.comment = '';
  const html = `
    <div class="modal-backdrop" onclick="if(event.target===this)closeReviewModal()">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">评价对方</div>
          <button class="modal-close" onclick="closeReviewModal()">×</button>
        </div>
        <div class="modal-body">
          ${ratingInputHtml('modal-review', 5)}
          <div class="form-group">
            <label class="form-label">评价文字（可选）</label>
            <textarea id="review-comment" class="form-textarea" placeholder="说说这次借用的体验、物品状况、对方的态度..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeReviewModal()">取消</button>
          <button class="btn btn-primary" onclick="submitReview()">提交评价</button>
        </div>
      </div>
    </div>`;
  const el = document.getElementById('review-modal');
  el.innerHTML = html;
  el.style.display = 'block';
}
function closeReviewModal() { document.getElementById('review-modal').style.display = 'none'; }

async function submitReview() {
  const rating = getRating('modal-review');
  const comment = document.getElementById('review-comment').value;
  const r = await api.submitReview({ record_id: _reviewTarget, rating, comment: comment || undefined });
  if (r.code === 0) {
    closeReviewModal();
    toast('评价成功！信誉分已更新');
    loadRecords();
  } else toast(r.message || '评价失败', 'error');
}

async function showContactModal(recordId) {
  const c = await api.getContact(recordId);
  if (c.code !== 0) { toast(c.message || '获取失败', 'error'); return; }
  const info = c.data || {};
  const html = `
    <div class="modal-backdrop" onclick="if(event.target===this)closeContactModal()">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">对方联系方式</div>
          <button class="modal-close" onclick="closeContactModal()">×</button>
        </div>
        <div class="modal-body">
          <div style="text-align:center;">
            <img src="${esc(info.avatar_url)}" style="width:80px;height:80px;border-radius:50%;border:3px solid #a5d6a7;" onerror="this.src='/static/community/images/avatar1.svg'">
            <div style="font-size:20px;font-weight:600;margin-top:10px;">${esc(info.nickname)}</div>
            <div class="stars" style="font-size:18px;margin:6px 0;">
              ${renderStars(info.credit_score)} <span style="color:#43a047;">${String(Number(info.credit_score).toFixed(1))}</span>
            </div>
            <div class="contact-info" style="text-align:left;">
              <div class="contact-row"><span class="contact-icon">👤</span>昵称：${esc(info.nickname)}</div>
              <div class="contact-row"><span class="contact-icon">🆔</span>账号：${esc(info.username)}</div>
            </div>
            <div style="font-size:12px;color:#888;margin-top:12px;">请双方协商好交接时间地点，注意物品安全哦～</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="closeContactModal()">知道了</button>
        </div>
      </div>
    </div>`;
  const el = document.getElementById('contact-modal');
  el.innerHTML = html;
  el.style.display = 'block';
}
function closeContactModal() { document.getElementById('contact-modal').style.display = 'none'; }

/* ========= 用户主页 ========= */
let _profileSubTab = 'reviews';
let _profileItemsLoaded = false;

async function renderProfilePage() {
  const id = AppState.params.id || api.userId;
  if (!id) { navigate('home'); return; }
  setHtml('main-content', `<div class="empty-state"><div class="empty-icon">👤</div><p>加载中...</p></div>`);

  const r = await api.getUserCredit(id);
  if (r.code !== 0 || !r.data) {
    setHtml('main-content', emptyHtml('❌', '用户不存在'));
    return;
  }
  const p = r.data;
  const isMe = api.isLoggedIn() && Number(id) === Number(api.userId);
  const avg = Number(p.avg_rating || p.credit_score || 5);
  const totalRev = p.total_count || 0;
  let joinDays = 1;
  try { joinDays = Math.max(1, Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000)); } catch(e) {}

  const ratingMap = { 5: p.five_star||0, 4: p.four_star||0, 3: p.three_star||0, 2: p.two_star||0, 1: p.one_star||0 };
  const bars = [5,4,3,2,1].map(n => {
    const cnt = ratingMap[n];
    const pct = totalRev ? Math.round((cnt / totalRev) * 100) : 0;
    return `<div class="rating-bar-row"><span>${n}星</span>
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div><span>${cnt}</span></div>`;
  }).join('');

  const reviews = (p.reviews || []).map(rv => {
    const rv2 = rv.reviewer || {};
    const hiTag = (rv2.credit_score || 0) >= 4 ? '<span class="chip active" style="font-size:11px;padding:1px 8px;margin-left:6px;">⭐ 高信誉</span>' : '';
    return `<div class="review-card">
      <div class="review-header">
        <div class="reviewer-avatar">
          <img src="${esc(rv2.avatar_url)}" onerror="this.src='/static/community/images/avatar1.svg'">
        </div>
        <div class="reviewer-info">
          <div class="reviewer-name">${esc(rv2.nickname || '邻居')}${hiTag}</div>
          <div class="review-date"><span class="stars">${renderStars(rv.rating)}</span>
            <span style="margin-left:8px;">${esc(String(rv.created_at).slice(0,16))}</span></div>
        </div>
      </div>
      ${rv.comment ? `<div class="review-comment">${esc(rv.comment)}</div>` : ''}
    </div>`;
  }).join('') || `<div class="empty-state" style="padding:30px 20px;"><div class="empty-icon">💭</div><p>暂无评价</p></div>`;

  const hiUser = avg >= 4 ? '<div style="margin-top:10px;"><span class="chip active" style="font-size:12px;">⭐ 高信誉用户</span></div>' : '';

  const meHtml = isMe ? `<button class="btn btn-secondary btn-block" style="margin-top:14px;" onclick="navigate('records')">📋 管理我的记录</button>` : '';

  setHtml('main-content', `
    <div class="profile-layout">
      <div class="profile-sidebar">
        <div class="card profile-card">
          <div class="profile-avatar">
            <img src="${esc(p.avatar_url)}" onerror="this.src='/static/community/images/avatar1.svg'">
          </div>
          <div class="profile-name">${esc(p.nickname)}</div>
          <div class="rating-display" style="justify-content:center;margin-top:4px;">
            <span class="stars" style="font-size:20px;">${renderStars(avg)}</span>
            <strong style="color:#43a047;font-size:18px;">${avg.toFixed(1)}</strong>
          </div>
          <div style="font-size:12px;color:#888;margin-top:2px;">${totalRev} 条评价</div>
          ${hiUser}
          <div class="profile-stats">
            <div class="stat-item"><div class="stat-value">${p.items_count || 0}</div><div class="stat-label">发布物品</div></div>
            <div class="stat-item"><div class="stat-value">${ratingMap[5]}</div><div class="stat-label">五星好评</div></div>
            <div class="stat-item"><div class="stat-value">${joinDays}</div><div class="stat-label">加入天数</div></div>
          </div>
          ${totalRev ? `<div class="rating-bars">${bars}</div>` : ''}
          ${meHtml}
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:18px;">
          <div class="tabs">
            <div class="tab ${_profileSubTab==='reviews'?'active':''}" onclick="switchProfileSub('reviews')">💬 收到的评价 (${totalRev})</div>
            <div class="tab ${_profileSubTab==='items'?'active':''}" onclick="switchProfileSub('items',${p.id})">📦 发布的物品 (${p.items_count || 0})</div>
          </div>
          <div id="profile-sub">
            ${_profileSubTab === 'reviews' ? reviews : `<div class="empty-state"><div class="empty-icon">⏳</div><p>加载中...</p></div>`}
          </div>
        </div>
      </div>
    </div>
  `);
  _profileItemsLoaded = false;
  if (_profileSubTab === 'items') loadProfileItems(p.id);
}

function switchProfileSub(tab, userId) {
  _profileSubTab = tab;
  const p = AppState.params.id;
  renderProfilePage();
}

async function loadProfileItems(userId) {
  if (_profileItemsLoaded) return;
  const sub = document.getElementById('profile-sub');
  if (!sub) return;
  _profileItemsLoaded = true;
  sub.innerHTML = `<div class="empty-state" style="padding:30px;"><div class="empty-icon">⏳</div><p>加载中...</p></div>`;
  const r = await api.getItemList({ owner_id: userId, page_size: 100 });
  if (r.code !== 0) {
    sub.innerHTML = emptyHtml('❌', r.message || '加载失败');
    return;
  }
  const items = (r.data && r.data.items) || [];
  if (items.length === 0) {
    sub.innerHTML = `<div class="empty-state" style="padding:30px;"><div class="empty-icon">📦</div><p>还没有发布物品</p></div>`;
    return;
  }
  sub.innerHTML = `<div class="items-grid">${items.map(itemCardHtml).join('')}</div>`;
}
