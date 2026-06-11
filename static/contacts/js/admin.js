const API_BASE = '/api';

const state = {
    students: [],
    currentPage: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
    keyword: '',
    class_name: '',
    classes: [],
    allContacts: []
};

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast ' + type; }, 2500);
}

async function loadClasses() {
    try {
        const res = await fetch(`${API_BASE}/contact/teacher/classes/get`);
        const data = await res.json();
        if (data.code === 0 && data.data) {
            state.classes = data.data;
            const select = document.getElementById('search-class');
            state.classes.forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls;
                opt.textContent = cls;
                select.appendChild(opt);
            });
        }
    } catch (e) {}
}

async function loadStudents(resetPage = true) {
    if (resetPage) state.currentPage = 1;

    const params = new URLSearchParams({
        page: state.currentPage,
        page_size: state.pageSize
    });
    if (state.keyword) params.append('keyword', state.keyword);
    if (state.class_name) params.append('class_name', state.class_name);

    try {
        const res = await fetch(`${API_BASE}/contact/teacher/students/get?${params.toString()}`);
        const data = await res.json();
        if (data.code === 0 && data.data) {
            state.students = data.data.items || [];
            state.total = data.data.total || 0;
            state.totalPages = data.data.total_pages || 0;
            renderStudents();
            renderStats();
            renderPagination();
        }
    } catch (e) {
        showToast('加载失败，请刷新重试', 'error');
    }
}

function renderStats() {
    const row = document.getElementById('stats-row');
    const classCount = new Set(state.students.map(s => s.class_name)).size;
    const contactCount = state.students.reduce((a, s) => a + (s.contact_count || 0), 0);

    row.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">学生总数</div>
            <div class="stat-value">${state.total}</div>
        </div>
        <div class="stat-card" style="border-left-color:#059669">
            <div class="stat-label">涉及班级</div>
            <div class="stat-value">${classCount}</div>
        </div>
        <div class="stat-card" style="border-left-color:#d97706">
            <div class="stat-label">联系人数量</div>
            <div class="stat-value">${contactCount}</div>
        </div>
        <div class="stat-card" style="border-left-color:#dc2626">
            <div class="stat-label">当前筛选</div>
            <div class="stat-value" style="font-size:16px;">${state.class_name || '全部'}</div>
        </div>
    `;

    document.getElementById('total-badge').textContent = `共 ${state.total} 名学生`;
}

function renderStudents() {
    const tbody = document.getElementById('student-tbody');
    if (!state.students.length) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <p>没有找到匹配的学生</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const startIdx = (state.currentPage - 1) * state.pageSize;
    tbody.innerHTML = state.students.map((s, i) => `
        <tr>
            <td>${startIdx + i + 1}</td>
            <td><span style="padding:2px 8px;background:#eef2ff;color:#4338ca;border-radius:6px;font-size:12px;">${escapeHtml(s.class_name)}</span></td>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td>
                <span style="font-weight:600;color:${s.contact_count ? '#16a34a' : '#9ca3af'}">${s.contact_count || 0}</span> 位
            </td>
            <td>
                <button class="action-btn" data-id="${s.id}">查看详情</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => openDetail(parseInt(btn.dataset.id)));
    });
}

function renderPagination() {
    const wrap = document.getElementById('pagination');
    if (state.totalPages <= 1) { wrap.innerHTML = ''; return; }

    let html = '';
    html += `<button class="page-btn" ${state.currentPage === 1 ? 'disabled' : ''} data-page="prev">上一页</button>`;

    const maxShow = 7;
    let start = Math.max(1, state.currentPage - 3);
    let end = Math.min(state.totalPages, start + maxShow - 1);
    if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1);

    for (let p = start; p <= end; p++) {
        html += `<button class="page-btn ${p === state.currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }

    html += `<button class="page-btn" ${state.currentPage === state.totalPages ? 'disabled' : ''} data-page="next">下一页</button>`;
    wrap.innerHTML = html;

    wrap.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = btn.dataset.page;
            if (p === 'prev') state.currentPage = Math.max(1, state.currentPage - 1);
            else if (p === 'next') state.currentPage = Math.min(state.totalPages, state.currentPage + 1);
            else state.currentPage = parseInt(p);
            loadStudents(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

async function openDetail(studentId) {
    try {
        const res = await fetch(`${API_BASE}/contact/teacher/studentcontacts/get?student_id=${studentId}`);
        const data = await res.json();
        if (data.code !== 0 || !data.data) {
            showToast('加载详情失败', 'error');
            return;
        }

        const { student, contacts } = data.data;
        document.getElementById('modal-student-name').textContent = '👦 ' + student.name;
        document.getElementById('modal-class-name').textContent = '🏫 ' + student.class_name;

        renderContacts(contacts);
        document.getElementById('detail-modal').classList.add('show');
    } catch (e) {
        showToast('网络错误', 'error');
    }
}

function renderContacts(contacts) {
    const list = document.getElementById('contacts-list');
    if (!contacts.length) {
        list.innerHTML = `
            <div class="empty-state" style="padding:30px 0;">
                <div class="empty-icon">📞</div>
                <p>该学生暂无家长联系信息</p>
            </div>
        `;
        return;
    }

    list.innerHTML = contacts.map(c => `
        <div class="contact-card ${c.is_emergency ? 'emergency' : ''}" data-id="${c.id}">
            <div class="contact-card-header">
                <div class="contact-name-row">
                    <span class="contact-name">${escapeHtml(c.parent_name)}</span>
                    <span class="contact-relation">${escapeHtml(c.relation)}</span>
                    ${c.is_emergency ? '<span class="emergency-tag">🚨 紧急联系人</span>' : ''}
                </div>
                <label class="emergency-toggle">
                    <input type="checkbox" ${c.is_emergency ? 'checked' : ''} data-emergency="${c.id}">
                    <span>设为紧急联系人</span>
                </label>
            </div>
            <div class="contact-info">
                <div class="info-row phone">
                    <span class="info-label">📱 手机</span>
                    <span class="info-value"><a href="tel:${escapeHtml(c.phone)}">${escapeHtml(c.phone)}</a></span>
                </div>
                ${c.address ? `
                <div class="info-row">
                    <span class="info-label">📍 地址</span>
                    <span class="info-value">${escapeHtml(c.address)}</span>
                </div>` : ''}
            </div>
            <div class="note-area">
                <label>📝 家访备注</label>
                <textarea data-note="${c.id}" placeholder="可填写家访情况、学生情况、特殊说明等...">${escapeHtml(c.note || '')}</textarea>
                <div class="note-save-row">
                    <button class="btn-save-note" data-save="${c.id}">保存备注</button>
                </div>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('[data-emergency]').forEach(cb => {
        cb.addEventListener('change', (e) => updateContact(parseInt(cb.dataset.emergency), {
            is_emergency: e.target.checked ? 1 : 0
        }));
    });

    list.querySelectorAll('[data-save]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.save);
            const note = list.querySelector(`[data-note="${id}"]`).value;
            updateContact(id, { note });
        });
    });
}

async function updateContact(contactId, payload) {
    try {
        const res = await fetch(`${API_BASE}/contact/teacher/updatecontact/put`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_id: contactId, ...payload })
        });
        const data = await res.json();
        if (data.code === 0) {
            showToast('✅ 保存成功', 'success');
            if (payload.is_emergency !== undefined) {
                const card = document.querySelector(`.contact-card[data-id="${contactId}"]`);
                if (card) {
                    const nameRow = card.querySelector('.contact-name-row');
                    let tag = nameRow.querySelector('.emergency-tag');
                    if (payload.is_emergency) {
                        card.classList.add('emergency');
                        if (!tag) {
                            tag = document.createElement('span');
                            tag.className = 'emergency-tag';
                            tag.textContent = '🚨 紧急联系人';
                            nameRow.appendChild(tag);
                        }
                    } else {
                        card.classList.remove('emergency');
                        if (tag) tag.remove();
                    }
                }
            }
        } else {
            showToast(data.message || '保存失败', 'error');
        }
    } catch (e) {
        showToast('网络错误', 'error');
    }
}

document.getElementById('btn-search').addEventListener('click', () => {
    state.keyword = document.getElementById('search-keyword').value.trim();
    state.class_name = document.getElementById('search-class').value;
    loadStudents(true);
});

document.getElementById('search-keyword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-search').click();
});

document.getElementById('btn-export').addEventListener('click', () => {
    const params = new URLSearchParams();
    if (state.keyword) params.append('keyword', state.keyword);
    if (state.class_name) params.append('class_name', state.class_name);
    const url = `${API_BASE}/contact/teacher/exportcsv/get${params.toString() ? '?' + params.toString() : ''}`;
    window.open(url, '_blank');
});

document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.dataset.close !== undefined) {
        document.getElementById('detail-modal').classList.remove('show');
    }
});

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

(async function init() {
    await loadClasses();
    await loadStudents(true);
})();
