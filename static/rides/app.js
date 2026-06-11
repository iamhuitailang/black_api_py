const API = '/api/rides';
const STORAGE_KEY = 'carpool_draft';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentAction = null;
let currentRideId = null;

function showToast(msg, type = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.classList.remove('show'), 2200);
}

function openModal(id) { $('#' + id).classList.add('show'); }
function closeModal(id) { $('#' + id).classList.remove('show'); }

$$('[data-close]').forEach(el => {
    el.addEventListener('click', () => closeModal(el.dataset.close));
});

$$('.modal-mask').forEach(mask => {
    mask.addEventListener('click', (e) => {
        if (e.target === mask) mask.classList.remove('show');
    });
});

function validateContact(val) {
    val = val.trim();
    if (!val) return '联系方式不能为空';
    const digits = val.replace(/[\s\-]/g, '');
    if (/^\d+$/.test(digits)) {
        if (!/^1[3-9]\d{9}$/.test(digits)) {
            return '手机号格式不正确（应为11位且1开头），微信号请加前缀如"微信:xxx"';
        }
    }
    return '';
}

function saveDraft() {
    const form = $('#form-publish');
    if (!form) return;
    const fd = new FormData(form);
    const data = {};
    for (const [k, v] of fd.entries()) {
        data[k] = v;
    }
    data.weekdays = form.querySelector('[name=weekdays]').checked;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadDraft() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        const form = $('#form-publish');
        if (!form) return;
        for (const [k, v] of Object.entries(data)) {
            const el = form.querySelector(`[name="${k}"]`);
            if (!el) continue;
            if (el.type === 'checkbox') {
                el.checked = !!v;
            } else {
                el.value = v;
            }
        }
    } catch(e) {}
}

function clearDraft() {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
}

function formatTime(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        const pad = n => String(n).padStart(2, '0');
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        if (diffMin < 1) return '刚刚';
        if (diffMin < 60) return diffMin + '分钟前';
        if (diffHr < 24) return diffHr + '小时前';
        if (diffDay < 7) return diffDay + '天前';
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    } catch { return ''; }
}

function buildCard(r) {
    const isFull = r.status === 'full';
    const available = r.available_seats;
    const total = r.seats;

    return `
    <div class="ride-card ${isFull ? 'full' : ''}" data-id="${r.id}">
        <div class="card-top">
            <div class="route">
                <span>${escapeHtml(r.from_location)}</span>
                <span class="arrow">→</span>
                <span>${escapeHtml(r.to_location)}</span>
                ${r.weekdays ? '<span class="route-badge">工作日</span>' : ''}
                ${isFull ? '<span class="route-badge full-badge">已满</span>' : ''}
            </div>
            <div class="time-box">
                <div class="time-big">${escapeHtml(r.departure_time)}</div>
                ${r.weekdays ? '<div class="time-weekdays">周一至周五</div>' : ''}
                <div class="time-created">发布于 ${formatTime(r.created_at)}</div>
            </div>
        </div>

        <div class="card-mid">
            <div class="seats-circle ${isFull ? 'full-circle' : ''}">
                <div class="seats-num">${available}</div>
                <div class="seats-label">剩余座位</div>
            </div>
            <div class="seats-text">
                全车 <strong>${total}</strong> 座 · 已拼 <strong>${total - available}</strong> 人
            </div>
            ${r.remark ? `<div class="remark-box">💬 ${escapeHtml(r.remark)}</div>` : ''}
        </div>

        <div class="card-bottom">
            <div class="contact-box">
                <span class="contact-icon">📞</span>
                <span>联系方式：</span>
                <span class="contact-value">${escapeHtml(r.contact)}</span>
            </div>
            <div class="card-actions">
                ${isFull
                    ? `<button class="btn btn-warn" data-act="active" data-id="${r.id}">恢复可约</button>`
                    : `<button class="btn btn-warn" data-act="full" data-id="${r.id}">标记已满</button>`
                }
                <button class="btn btn-danger" data-act="delete" data-id="${r.id}">删除</button>
            </div>
        </div>
    </div>`;
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

async function loadList() {
    const from = $('#filter-from').value.trim();
    const to = $('#filter-to').value.trim();
    const status = $('#filter-status').value;

    const params = new URLSearchParams();
    if (from) params.set('from_location', from);
    if (to) params.set('to_location', to);
    if (status) params.set('status', status);

    const res = await fetch(`${API}/list/get?${params.toString()}`);
    const json = await res.json();

    $('#list-count').textContent = `共 ${(json.data && json.data.count) || 0} 条拼车信息`;

    const list = $('#ride-list');
    const items = (json.data && json.data.items) || [];
    if (!items.length) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🚗</div>
                <p>还没有拼车信息</p>
                <p class="empty-sub">快点击右下角按钮发布第一条吧！</p>
            </div>`;
        return;
    }
    list.innerHTML = items.map(buildCard).join('');
}

$('#btn-search').addEventListener('click', loadList);
$('#btn-reset').addEventListener('click', () => {
    $('#filter-from').value = '';
    $('#filter-to').value = '';
    $('#filter-status').value = 'active';
    loadList();
});
['#filter-from', '#filter-to'].forEach(sel => {
    $(sel).addEventListener('keydown', e => { if (e.key === 'Enter') loadList(); });
});
$('#filter-status').addEventListener('change', loadList);

$('#btn-fab').addEventListener('click', () => {
    loadDraft();
    openModal('modal-publish');
});

$('#form-publish').addEventListener('input', saveDraft);
$('#form-publish').addEventListener('change', saveDraft);

$('#btn-submit-publish').addEventListener('click', async () => {
    const form = $('#form-publish');
    if (!form.reportValidity()) return;

    const contactVal = form.querySelector('[name="contact"]').value;
    const contactErr = validateContact(contactVal);
    if (contactErr) {
        showToast(contactErr, 'error');
        form.querySelector('[name="contact"]').focus();
        return;
    }

    const fd = new FormData(form);
    const data = {
        from_location: fd.get('from_location'),
        to_location: fd.get('to_location'),
        departure_time: fd.get('departure_time'),
        weekdays: fd.get('weekdays') === 'on',
        seats: Number(fd.get('seats')),
        contact: fd.get('contact'),
        password: fd.get('password'),
        remark: fd.get('remark') || ''
    };
    const av = fd.get('available_seats');
    if (av !== '' && av != null) data.available_seats = Number(av);

    try {
        const res = await fetch(`${API}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.code === 0) {
            showToast('发布成功！', 'success');
            clearDraft();
            form.reset();
            closeModal('modal-publish');
            loadList();
        } else {
            showToast(json.message || '发布失败', 'error');
        }
    } catch (e) {
        showToast('网络错误，请稍后重试', 'error');
    }
});

$('#ride-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    currentAction = btn.dataset.act;
    currentRideId = Number(btn.dataset.id);

    let title = '';
    let sub = '';
    if (currentAction === 'full') {
        title = '标记为已满';
        sub = '验证后将标记为已满，其他人仍可看到但会标注';
    } else if (currentAction === 'active') {
        title = '恢复为可约';
        sub = '验证后将重新标记为可约状态';
    } else if (currentAction === 'delete') {
        title = '删除拼车信息';
        sub = '删除后不可恢复，请确认';
    }
    $('#pwd-title').textContent = title;
    $('#pwd-subtitle').textContent = sub;
    $('#pwd-input').value = '';
    openModal('modal-password');
    setTimeout(() => $('#pwd-input').focus(), 100);
});

$('#btn-confirm-pwd').addEventListener('click', async () => {
    const pwd = $('#pwd-input').value;
    if (!pwd) { showToast('请输入密码', 'warn'); return; }
    if (!currentRideId) return;

    let url = '';
    if (currentAction === 'full') url = `${API}/full`;
    else if (currentAction === 'active') url = `${API}/active`;
    else if (currentAction === 'delete') url = `${API}/delete`;
    else return;

    try {
        const res = await fetch(url, {
            method: currentAction === 'delete' ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentRideId, password: pwd })
        });
        const json = await res.json();
        if (json.code === 0) {
            if (currentAction === 'delete') showToast('删除成功', 'success');
            else if (currentAction === 'full') showToast('已标记为已满', 'success');
            else showToast('已恢复为可约', 'success');
            closeModal('modal-password');
            loadList();
        } else if (json.code === 2) {
            showToast(json.message || '密码错误', 'error');
            $('#pwd-input').select();
        } else {
            showToast(json.message || '操作失败', 'error');
        }
    } catch (e) {
        showToast('网络错误，请稍后重试', 'error');
    }
});

$('#pwd-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('#btn-confirm-pwd').click();
});

loadList();
