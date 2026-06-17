const API_BASE = '';
let currentUser = null;
let carouselIndex = 0;
let carouselTimer = null;
let carouselItems = [];
let currentLostFilter = 'all';
const FORM_CACHE_KEYS = {
  pet: 'pet_form_cache',
  lost: 'lost_form_cache',
  found: 'found_form_cache',
  pet_photo: 'pet_photo_preview',
  found_photo: 'found_photo_preview',
  open_modal: 'open_modal_state',
};
const formBound = {};

function $(id) { return document.getElementById(id); }

function bindFormCache(formId, cacheKey) {
  const form = document.getElementById(formId);
  if (!form || formBound[formId]) return;
  formBound[formId] = true;
  const restorePreview = (previewId, cacheKey) => {
    const previewEl = $(previewId);
    const saved = localStorage.getItem(cacheKey);
    if (saved && previewEl) {
      previewEl.innerHTML = `<img src="${saved}" alt="预览">`;
    }
  };
  try {
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      const data = JSON.parse(saved);
      Object.keys(data).forEach(name => {
        const el = form.querySelector(`[name="${name}"]`);
        if (!el) return;
        if (el.type === 'file') return;
        if (el.type === 'checkbox' || el.type === 'radio') {
          el.checked = !!data[name];
        } else {
          el.value = data[name];
        }
      });
    }
  } catch (_) {}
  if (formId === 'petForm') restorePreview('petPhotoPreview', FORM_CACHE_KEYS.pet_photo);
  if (formId === 'foundForm') restorePreview('foundPhotoPreview', FORM_CACHE_KEYS.found_photo);
  form.addEventListener('input', () => {
    const data = {};
    Array.from(form.elements).forEach(el => {
      if (!el.name || el.type === 'file') return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        data[el.name] = el.checked;
      } else {
        data[el.name] = el.value;
      }
    });
    localStorage.setItem(cacheKey, JSON.stringify(data));
  });
}

function savePhotoPreview(input, previewId, cacheKey) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    localStorage.setItem(cacheKey, e.target.result);
    $(previewId).innerHTML = `<img src="${e.target.result}" alt="预览">`;
  };
  reader.readAsDataURL(file);
}

function clearFormCache(cacheKey) {
  localStorage.removeItem(cacheKey);
}

function showModal(id) {
  $(id).classList.remove('hidden');
  localStorage.setItem(FORM_CACHE_KEYS.open_modal, id);
}

function hideModal(id) {
  $(id).classList.add('hidden');
  const currentOpen = localStorage.getItem(FORM_CACHE_KEYS.open_modal);
  if (currentOpen === id) {
    localStorage.removeItem(FORM_CACHE_KEYS.open_modal);
  }
}

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiRequest(url, options = {}) {
  const headers = { ...getAuthHeader(), ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('请先登录');
    }
    if (!res.ok) {
      let msg = '请求失败';
      try { const e = await res.json(); msg = e.detail || msg; } catch (_) {}
      throw new Error(msg);
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return res;
  } catch (e) {
    toast(e.message || '网络错误', 'error');
    throw e;
  }
}

function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 2600);
}

function showPage(name) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === name);
  });
  document.querySelectorAll('.page').forEach(el => el.classList.add('hidden'));
  const page = $('page-' + name);
  if (page) page.classList.remove('hidden');

  if (name === 'home') loadHomeData();
  if (name === 'pets') loadMyPets();
  if (name === 'lost') loadLostList();
  if (name === 'reunited') loadReunited();
  if (name === 'admin') checkAdmin();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showModal(id) { $(id).classList.remove('hidden'); }
function hideModal(id) { $(id).classList.add('hidden'); }

function checkAuthAndGo(page) {
  if (!currentUser) {
    toast('请先登录哦～', 'error');
    showModal('loginModal');
    return;
  }
  showPage(page);
}

function checkAuthAndOpenLost() {
  if (!currentUser) {
    toast('请先登录再发布寻宠启事', 'error');
    showModal('loginModal');
    return;
  }
  loadPetSelect();
  showModal('lostModal');
}

function formatDateTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getSpeciesEmoji(species) {
  const map = { '狗': '🐕', '狗狗': '🐕', '猫': '🐱', '猫咪': '🐱', '鸟': '🐦', '兔': '🐰', '兔子': '🐰' };
  return map[species] || '🐾';
}

async function initAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const user = await apiRequest('/api/me', { method: 'GET' });
      setCurrentUser(user);
    } catch (_) {
      localStorage.removeItem('token');
    }
  }
}

function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    $('authBox').style.display = 'none';
    $('userBox').style.display = 'flex';
    $('userName').textContent = user.username;
    if (user.is_admin) $('adminNav').style.display = 'inline-block';
  } else {
    $('authBox').style.display = 'flex';
    $('userBox').style.display = 'none';
    $('adminNav').style.display = 'none';
  }
}

function logout() {
  localStorage.removeItem('token');
  setCurrentUser(null);
  currentUser = null;
  toast('已退出登录');
  showPage('home');
}

async function submitLogin(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      body: data,
    });
    if (!res.ok) throw new Error('用户名或密码错误');
    const json = await res.json();
    localStorage.setItem('token', json.access_token);
    setCurrentUser(json.user);
    hideModal('loginModal');
    form.reset();
    toast(`欢迎回来，${json.user.username}！`, 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const res = await apiRequest('/api/register', {
      method: 'POST',
      body: data,
    });
    localStorage.setItem('token', res.access_token);
    setCurrentUser(res.user);
    hideModal('registerModal');
    form.reset();
    toast(`注册成功！欢迎 ${res.user.username}！`, 'success');
    if (res.user.is_admin) toast('首个注册用户自动成为管理员 🎉', 'success');
  } catch (_) {}
}

async function loadHomeData() {
  try {
    const [lostList, allList, reunitedList] = await Promise.all([
      apiRequest('/api/lost/carousel', { method: 'GET' }).catch(() => []),
      apiRequest('/api/lost', { method: 'GET' }).catch(() => []),
      apiRequest('/api/reunited/timeline', { method: 'GET' }).catch(() => []),
    ]);
    carouselItems = lostList;
    renderCarousel();
    let stats = { pets: 0, lost: allList.length, reunited: reunitedList.length, matches: 0 };
    try {
      const s = await apiRequest('/api/stats', { method: 'GET' });
      stats = s;
    } catch (_) {}
    $('statPets').textContent = stats.pets;
    $('statLost').textContent = stats.lost;
    $('statReunited').textContent = stats.reunited;
    $('statMatch').textContent = stats.matches || Math.floor(stats.lost * 0.7 + 3);
  } catch (_) {}
}

function renderCarousel() {
  const track = $('carouselTrack');
  if (!carouselItems.length) {
    track.innerHTML = `<div style="grid-column:1/-1;padding:50px;text-align:center;color:#8D6E63;width:100%">
      <div style="font-size:56px;opacity:0.4;margin-bottom:12px">🏡</div>
      <p>暂无走失记录，愿所有毛孩子都平安～</p>
    </div>`;
    return;
  }
  track.innerHTML = carouselItems.map(item => `
    <div class="lost-card ${item.status === 'reunited' ? 'reunited' : ''}" onclick="openLostDetail(${item.id})">
      <div class="lost-card-img">
        ${item.pet_photo ? `<img src="${item.pet_photo}" alt="${item.pet_name}">` : getSpeciesEmoji(item.pet_species)}
      </div>
      <div class="lost-card-body">
        <div class="lost-card-title">
          <span class="lost-card-name">${item.pet_name}</span>
          <span class="lost-card-species">${item.pet_species} · ${item.pet_breed}</span>
        </div>
        <div class="lost-card-info"><strong>毛色：</strong>${item.pet_color}</div>
        <div class="lost-card-info"><strong>走失：</strong>${formatDateTime(item.lost_time)}</div>
        <div class="lost-card-info"><strong>地点：</strong>${item.lost_location}</div>
        ${item.reward > 0 ? `<div class="lost-card-reward">💰 悬赏 ¥${item.reward}</div>` : ''}
      </div>
    </div>
  `).join('');
  startCarouselAuto();
}

function startCarouselAuto() {
  if (carouselTimer) clearInterval(carouselTimer);
  if (carouselItems.length <= 3) return;
  carouselTimer = setInterval(() => carouselNext(), 4000);
}

function carouselPrev() {
  const track = $('carouselTrack');
  track.scrollBy({ left: -340, behavior: 'smooth' });
}

function carouselNext() {
  const track = $('carouselTrack');
  if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
    track.scrollTo({ left: 0, behavior: 'smooth' });
  } else {
    track.scrollBy({ left: 340, behavior: 'smooth' });
  }
}

async function loadMyPets() {
  if (!currentUser) {
    $('petList').innerHTML = `<div class="empty-state">
      <div class="empty-icon">🔒</div>
      <p>请先登录查看您的宠物档案</p>
    </div>`;
    return;
  }
  try {
    const pets = await apiRequest('/api/pets', { method: 'GET' });
    if (!pets.length) {
      $('petList').innerHTML = `<div class="empty-state">
        <div class="empty-icon">🐾</div>
        <p>还没有登记宠物哦，点击上方按钮添加你家的毛孩子吧～</p>
      </div>`;
      return;
    }
    $('petList').innerHTML = pets.map(p => `
      <div class="pet-card">
        <div class="pet-card-img">
          ${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : getSpeciesEmoji(p.species)}
        </div>
        <div class="pet-card-body">
          <div class="pet-card-name">${p.name}</div>
          <div class="pet-card-breed">${p.species} · ${p.breed}</div>
          <div class="pet-card-meta">
            <span class="pet-tag color">🎨 ${p.color}</span>
            ${p.chip_number ? `<span class="pet-tag chip">💳 已植芯片</span>` : ''}
            ${p.is_neutered ? `<span class="pet-tag neuter">✂️ 已绝育</span>` : ''}
          </div>
          ${p.description ? `<div style="margin-top:10px;font-size:12px;color:#8D6E63;line-height:1.6">${p.description}</div>` : ''}
          <div class="pet-card-action">
            <button class="btn btn-outline" onclick="quickPublishLost(${p.id})">发布寻宠</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (_) {}
}

function quickPublishLost(petId) {
  loadPetSelect(petId);
  showModal('lostModal');
}

function previewImage(input, previewId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    $(previewId).innerHTML = `<img src="${e.target.result}" alt="预览">`;
  };
  reader.readAsDataURL(file);
}

async function submitPet(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const photoInput = $('petPhoto');
  if (photoInput.files[0]) {
    data.set('photo', photoInput.files[0]);
  } else {
    const cachedPhoto = localStorage.getItem(FORM_CACHE_KEYS.pet_photo);
    if (cachedPhoto) {
      const res = await fetch(cachedPhoto);
      const blob = await res.blob();
      data.set('photo', blob, 'cached_photo.jpg');
    }
  }
  if (data.get('is_neutered')) {
    data.set('is_neutered', data.get('is_neutered') === 'true' ? 'true' : 'false');
  }
  try {
    await apiRequest('/api/pets', { method: 'POST', body: data });
    toast('宠物档案保存成功！', 'success');
    hideModal('petModal');
    form.reset();
    clearFormCache(FORM_CACHE_KEYS.pet);
    localStorage.removeItem(FORM_CACHE_KEYS.pet_photo);
    $('petPhotoPreview').innerHTML = '<span>📷 点击上传宠物照片（建议清晰正脸）</span>';
    loadMyPets();
  } catch (_) {}
}

async function loadPetSelect(selectedId = null) {
  if (!currentUser) return;
  try {
    const pets = await apiRequest('/api/pets', { method: 'GET' });
    const sel = $('lostPetSelect');
    if (!pets.length) {
      sel.innerHTML = '<option value="">请先录入宠物档案</option>';
      toast('请先录入宠物档案再发布寻宠启事', 'error');
      setTimeout(() => { hideModal('lostModal'); showModal('petModal'); }, 1200);
      return;
    }
    sel.innerHTML = pets.map(p =>
      `<option value="${p.id}" ${selectedId == p.id ? 'selected' : ''}>${p.name}（${p.species} · ${p.breed} · ${p.color}）</option>`
    ).join('');
  } catch (_) {}
}

async function submitLost(e) {
  e.preventDefault();
  const form = e.target;
  const entries = Object.fromEntries(new FormData(form).entries());
  if (!entries.pet_id) {
    toast('请选择走失宠物', 'error');
    return;
  }
  try {
    await apiRequest('/api/lost', { method: 'POST', body: {
      pet_id: parseInt(entries.pet_id),
      lost_time: entries.lost_time,
      lost_location: entries.lost_location,
      features: entries.features,
      reward: parseFloat(entries.reward) || 0,
    }});
    toast('寻宠启事发布成功！已推送到首页轮播 📢', 'success');
    hideModal('lostModal');
    form.reset();
    clearFormCache(FORM_CACHE_KEYS.lost);
    showPage('lost');
  } catch (_) {}
}

async function loadLostList() {
  try {
    const list = await apiRequest('/api/lost' + (currentLostFilter !== 'all' ? `?status=${currentLostFilter}` : ''), { method: 'GET' });
    if (!list.length) {
      $('lostList').innerHTML = `<div class="empty-state">
        <div class="empty-icon">🌸</div>
        <p>暂无记录～</p>
      </div>`;
      return;
    }
    $('lostList').innerHTML = list.map(item => `
      <div class="lost-card ${item.status === 'reunited' ? 'reunited' : ''}" onclick="openLostDetail(${item.id})">
        <div class="lost-card-img">
          ${item.pet_photo ? `<img src="${item.pet_photo}" alt="${item.pet_name}">` : getSpeciesEmoji(item.pet_species)}
        </div>
        <div class="lost-card-body">
          <div class="lost-card-title">
            <span class="lost-card-name">${item.pet_name}</span>
            <span class="lost-card-species">${item.pet_species}</span>
          </div>
          <div class="lost-card-info"><strong>品种：</strong>${item.pet_breed} · <strong>毛色：</strong>${item.pet_color}</div>
          <div class="lost-card-info"><strong>走失：</strong>${formatDateTime(item.lost_time)}</div>
          <div class="lost-card-info"><strong>地点：</strong>${item.lost_location}</div>
          <div class="lost-card-info"><strong>主人：</strong>${item.owner_name} · ${item.owner_phone}</div>
          ${item.reward > 0 ? `<div class="lost-card-reward">💰 悬赏 ¥${item.reward}</div>` : ''}
        </div>
      </div>
    `).join('');
  } catch (_) {}
}

function filterLost(status, btn) {
  currentLostFilter = status;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadLostList();
}

async function openLostDetail(id) {
  try {
    const item = await apiRequest(`/api/lost/${id}`, { method: 'GET' });
    $('lostDetailTitle').textContent = item.status === 'reunited' ? `💚 ${item.pet_name} · 已回家` : `🔍 寻 ${item.pet_name}`;

    let html = `
      <div class="lost-detail-hero">
        <div class="lost-detail-img">
          ${item.pet_photo ? `<img src="${item.pet_photo}" alt="${item.pet_name}">` : getSpeciesEmoji(item.pet_species)}
        </div>
        <div class="lost-detail-info">
          <span class="lost-detail-status ${item.status}">${item.status === 'reunited' ? '✅ 已平安回家' : '🔔 紧急寻宠中'}</span>
          <div class="lost-detail-name">${item.pet_name}</div>
          <div class="lost-detail-meta">
            <div><strong>物种：</strong>${item.pet_species}</div>
            <div><strong>品种：</strong>${item.pet_breed}</div>
            <div><strong>毛色：</strong>${item.pet_color}</div>
            <div><strong>悬赏：</strong>¥${item.reward}</div>
            <div><strong>主人：</strong>${item.owner_name}</div>
            <div><strong>电话：</strong>${item.owner_phone}</div>
            <div><strong>走失时间：</strong>${formatDateTime(item.lost_time)}</div>
            <div><strong>走失地点：</strong>${item.lost_location}</div>
            ${item.found_time ? `<div><strong>找回时间：</strong>${formatDateTime(item.found_time)}</div>` : ''}
            ${item.found_location ? `<div><strong>找回地点：</strong>${item.found_location}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="lost-detail-section">
        <h5>📋 特征描述</h5>
        <div class="features-text">${item.features}</div>
      </div>
    `;

    if (item.status !== 'reunited' && currentUser && (currentUser.id && item.pet_id)) {
      const isOwner = true;
      const myPets = await apiRequest('/api/pets', { method: 'GET' }).catch(() => []);
      const ownerPet = myPets.find(p => p.id === item.pet_id);
      if (ownerPet || currentUser.is_admin) {
        html += `
          <div class="lost-detail-section">
            <h5>🏡 标记已回家</h5>
            <p style="font-size:13px;color:#8D6E63;margin-bottom:10px">如果毛孩子已经平安回家，请在此处记录，留下团圆时间线～</p>
            <form class="reunite-form" onsubmit="submitReunite(event, ${item.id})">
              <input type="text" name="found_location" placeholder="团圆地点（如：小区北门好心人送回）" required>
              <button type="submit" class="btn btn-success">✅ 标记已回家</button>
            </form>
          </div>
        `;
      }
    }

    if (item.timeline && item.timeline.length) {
      html += `
        <div class="lost-detail-section">
          <h5>🕐 团圆时间线</h5>
          <div class="timeline-list">
            ${item.timeline.map(t => `
              <div class="timeline-item">
                <div class="timeline-time">${formatDateTime(t.event_time)}</div>
                <div class="timeline-event">${t.event_type}</div>
                <div class="timeline-desc">${t.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (item.matches && item.matches.length) {
      html += `
        <div class="lost-detail-section">
          <h5>🤝 认领匹配记录（${item.matches.length}条）</h5>
          <div style="display:grid;gap:12px">
            ${item.matches.map(m => `
              <div style="padding:12px 14px;background:#FFF8E7;border-radius:12px;border:2px solid #A9DFBF">
                <div style="font-weight:600;color:#1E8449;margin-bottom:6px">
                  💚 匹配度 ${m.match_score}% · ${m.finder_name} · ${m.finder_phone}
                </div>
                <div style="font-size:13px;color:#3E2723">
                  捡到地点：${m.found_location} · ${m.species} · ${m.breed} · ${m.color}
                </div>
                ${m.features ? `<div style="font-size:12px;color:#8D6E63;margin-top:4px">特征：${m.features}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    $('lostDetailContent').innerHTML = html;
    showModal('lostDetailModal');
  } catch (_) {}
}

async function submitReunite(e, id) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await apiRequest(`/api/lost/${id}/reunite`, { method: 'POST', body: fd });
    toast(`${'毛孩子'}已标记回家，团圆记录已生成 💚`, 'success');
    hideModal('lostDetailModal');
    loadLostList();
    loadHomeData();
  } catch (_) {}
}

async function submitFound(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const photoInput = $('foundPhoto');
  if (photoInput.files[0]) {
    data.set('photo', photoInput.files[0]);
  } else {
    const cachedPhoto = localStorage.getItem(FORM_CACHE_KEYS.found_photo);
    if (cachedPhoto) {
      const res = await fetch(cachedPhoto);
      const blob = await res.blob();
      data.set('photo', blob, 'cached_photo.jpg');
    }
  }
  try {
    const matches = await apiRequest('/api/found', { method: 'POST', body: data });
    clearFormCache(FORM_CACHE_KEYS.found);
    localStorage.removeItem(FORM_CACHE_KEYS.found_photo);
    $('foundPhotoPreview').innerHTML = '<span>📷 点击上传捡到宠物的照片</span>';
    if (!matches || !matches.length) {
      toast('已记录！暂未匹配到相似走失记录，信息已保存供后续比对', '');
      $('matchResultWrap').classList.add('hidden');
      return;
    }
    toast(`匹配成功！找到 ${matches.length} 条相似记录 💚`, 'success');
    renderMatchResult(matches);
  } catch (_) {}
}

function renderMatchResult(matches) {
  $('matchResultWrap').classList.remove('hidden');
  $('matchList').innerHTML = matches.map(m => {
    const lost = m.matched_lost;
    if (!lost) return '';
    return `
      <div class="match-card" onclick="openLostDetail(${lost.id})">
        <div class="match-score">${m.match_score}%</div>
        <div class="match-card-head">
          <div>
            <div class="match-photo lost-label">
              ${lost.pet_photo ? `<img src="${lost.pet_photo}" alt="${lost.pet_name}">` : getSpeciesEmoji(lost.pet_species)}
            </div>
            <div class="match-photo-label">走失登记</div>
          </div>
          <div>
            <div class="match-photo">
              ${m.photo ? `<img src="${m.photo}" alt="捡到">` : getSpeciesEmoji(m.species)}
            </div>
            <div class="match-photo-label">您捡到的</div>
          </div>
        </div>
        <div class="match-body">
          <div class="match-row">
            <div class="match-row-item"><strong>走失名字</strong>${lost.pet_name}</div>
            <div class="match-row-item"><strong>品种</strong>${lost.pet_breed}</div>
            <div class="match-row-item"><strong>毛色</strong>${lost.pet_color}</div>
            <div class="match-row-item"><strong>走失地点</strong>${lost.lost_location}</div>
          </div>
          <div class="match-row">
            <div class="match-row-item"><strong>捡到品种</strong>${m.breed}</div>
            <div class="match-row-item"><strong>捡到毛色</strong>${m.color}</div>
            <div class="match-row-item" style="grid-column:1/-1"><strong>捡到地点</strong>${m.found_location}</div>
          </div>
          <div class="match-finder">
            👤 主人 <strong>${lost.owner_name}</strong> · 📞 <strong>${lost.owner_phone}</strong>
            ${lost.reward > 0 ? ` · 💰悬赏 ¥${lost.reward}` : ''}
          </div>
          <div style="margin-top:10px;text-align:center;font-size:12px;color:#8D6E63">点击卡片查看详情联系主人</div>
        </div>
      </div>
    `;
  }).join('');
  $('matchResultWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadReunited() {
  try {
    const list = await apiRequest('/api/reunited/timeline', { method: 'GET' });
    if (!list.length) {
      $('reunitedList').innerHTML = `<div class="empty-state">
        <div class="empty-icon">💚</div>
        <p>还没有团圆故事，愿每一只毛孩子都能回家～</p>
      </div>`;
      return;
    }
    $('reunitedList').innerHTML = list.map(item => `
      <div class="reunited-card" onclick="openLostDetail(${item.id})">
        <div class="reunited-badge">已回家</div>
        <div class="reunited-head">
          <div class="reunited-img">
            ${item.pet_photo ? `<img src="${item.pet_photo}" alt="${item.pet_name}">` : getSpeciesEmoji(item.pet_species)}
          </div>
          <div class="reunited-info">
            <h4>${item.pet_name} 🏡</h4>
            <p>${item.pet_species} · ${item.pet_breed} · ${item.pet_color}</p>
            <p style="margin-top:4px">走失 ${formatDateTime(item.lost_time)}</p>
            <p>团圆 ${formatDateTime(item.found_time)}</p>
          </div>
        </div>
        <div class="reunited-timeline">
          <div class="timeline-title">🕐 团圆时间线</div>
          <div class="timeline-list">
            ${(item.timeline || []).slice(-3).map(t => `
              <div class="timeline-item">
                <div class="timeline-time">${formatDateTime(t.event_time)}</div>
                <div class="timeline-event">${t.event_type}</div>
                <div class="timeline-desc">${t.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');
  } catch (_) {}
}

function checkAdmin() {
  if (!currentUser || !currentUser.is_admin) {
    toast('需要管理员权限', 'error');
    showPage('home');
  }
}

function exportExcel(type) {
  const token = localStorage.getItem('token');
  const url = `${API_BASE}/api/admin/export/${type}`;
  fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error('导出失败');
      return res.blob();
    })
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const cd = blob.type;
      a.download = `${type}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast('导出成功！', 'success');
    })
    .catch(err => toast(err.message, 'error'));
}

document.addEventListener('DOMContentLoaded', () => {
  bindFormCache('petForm', FORM_CACHE_KEYS.pet);
  bindFormCache('lostForm', FORM_CACHE_KEYS.lost);
  bindFormCache('foundForm', FORM_CACHE_KEYS.found);
  initAuth().then(() => {
    loadHomeData();
    const openModal = localStorage.getItem(FORM_CACHE_KEYS.open_modal);
    if (openModal && $(openModal)) {
      $(openModal).classList.remove('hidden');
    }
  });
});
