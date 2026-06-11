const API_BASE = '/api';
const DRAFT_KEY = 'contact_parent_draft';
let currentContacts = [];

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast ' + type;
    }, 2500);
}

function saveDraft() {
    const form = document.getElementById('submit-form');
    if (!form) return;
    const data = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.name) data[el.name] = el.value;
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        const form = document.getElementById('submit-form');
        if (!form) return;
        for (const key in data) {
            const el = form.querySelector(`[name="${key}"]`);
            if (el) el.value = data[key] || '';
        }
    } catch (e) {}
}

function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}

function fillEditForm(contact) {
    const form = document.getElementById('edit-form');
    form.student_name.value = contact.student_name || '';
    form.class_name.value = contact.class_name || '';
    form.parent_name.value = contact.parent_name || '';
    form.relation.value = contact.relation || '';
    form.new_phone.value = '';
    form.address.value = contact.address || '';
    document.getElementById('edit-original-phone').value = contact.phone || '';
    document.getElementById('edit-contact-id').value = contact.id || '';
    form.classList.remove('hidden');
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
    });
});

document.getElementById('submit-form').addEventListener('input', () => {
    saveDraft();
});

document.addEventListener('DOMContentLoaded', () => {
    loadDraft();
});

document.getElementById('submit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '提交中...';

    try {
        const formData = {
            student_name: form.student_name.value.trim(),
            class_name: form.class_name.value.trim(),
            parent_name: form.parent_name.value.trim(),
            relation: form.relation.value,
            phone: form.phone.value.trim(),
            address: form.address.value.trim() || null
        };

        const res = await fetch(`${API_BASE}/contact/parent/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();

        if (data.code === 0) {
            showToast('🎉 提交成功！感谢您的配合', 'success');
            form.reset();
            clearDraft();
        } else {
            showToast(data.message || '提交失败', 'error');
        }
    } catch (err) {
        showToast('网络错误，请重试', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

document.getElementById('btn-verify').addEventListener('click', async () => {
    const phone = document.getElementById('verify-phone').value.trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        showToast('请输入正确的11位手机号', 'error');
        return;
    }

    const btn = document.getElementById('btn-verify');
    btn.disabled = true;
    btn.textContent = '查询中...';

    try {
        const res = await fetch(`${API_BASE}/contact/parent/query/get?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();

        document.getElementById('contact-selector').classList.add('hidden');
        document.getElementById('edit-form').classList.add('hidden');

        if (data.code === 0 && data.data && data.data.length > 0) {
            currentContacts = data.data;

            if (currentContacts.length === 1) {
                fillEditForm(currentContacts[0]);
                showToast('查询成功，请修改信息后保存', 'success');
            } else {
                const listEl = document.getElementById('contact-list');
                listEl.innerHTML = currentContacts.map(c => `
                    <label class="contact-option">
                        <input type="radio" name="contact_choose" value="${c.id}">
                        <div class="contact-option-info">
                            <div class="contact-option-name">
                                👦 ${escapeHtml(c.student_name)}
                                <span class="badge-sm">${escapeHtml(c.class_name)}</span>
                            </div>
                            <div class="contact-option-sub">
                                👨 ${escapeHtml(c.parent_name)}（${escapeHtml(c.relation)}）
                            </div>
                        </div>
                    </label>
                `).join('');
                document.getElementById('contact-selector').classList.remove('hidden');

                listEl.querySelectorAll('input[name="contact_choose"]').forEach(rb => {
                    rb.addEventListener('change', () => {
                        const contact = currentContacts.find(c => c.id === parseInt(rb.value));
                        if (contact) {
                            fillEditForm(contact);
                        }
                    });
                });
                showToast(`该手机号绑定了${currentContacts.length}个孩子，请选择要修改的记录`, 'success');
            }
        } else {
            showToast(data.message || '未找到该手机号的登记信息', 'error');
        }
    } catch (err) {
        showToast('网络错误，请重试', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '查询';
    }
});

document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
        const originalPhone = document.getElementById('edit-original-phone').value;
        const contactId = document.getElementById('edit-contact-id').value;
        const formData = {
            phone: originalPhone,
            contact_id: contactId ? parseInt(contactId) : null,
            student_name: form.student_name.value.trim() || null,
            class_name: form.class_name.value.trim() || null,
            parent_name: form.parent_name.value.trim() || null,
            relation: form.relation.value || null,
            new_phone: form.new_phone.value.trim() || null,
            address: form.address.value !== undefined ? (form.address.value.trim() || null) : null
        };

        const res = await fetch(`${API_BASE}/contact/parent/modify/put`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();

        if (data.code === 0) {
            showToast('✅ 修改成功！', 'success');
        } else if (data.code === 300 && data.data && data.data.contacts) {
            currentContacts = data.data.contacts;
            const listEl = document.getElementById('contact-list');
            listEl.innerHTML = currentContacts.map(c => `
                <label class="contact-option">
                    <input type="radio" name="contact_choose" value="${c.id}">
                    <div class="contact-option-info">
                        <div class="contact-option-name">
                            👦 ${escapeHtml(c.student_name)}
                            <span class="badge-sm">${escapeHtml(c.class_name)}</span>
                        </div>
                        <div class="contact-option-sub">
                            👨 ${escapeHtml(c.parent_name)}（${escapeHtml(c.relation)}）
                        </div>
                    </div>
                </label>
            `).join('');
            document.getElementById('contact-selector').classList.remove('hidden');
            document.getElementById('edit-form').classList.add('hidden');

            listEl.querySelectorAll('input[name="contact_choose"]').forEach(rb => {
                rb.addEventListener('change', () => {
                    const contact = currentContacts.find(c => c.id === parseInt(rb.value));
                    if (contact) {
                        fillEditForm(contact);
                    }
                });
            });
            showToast(data.message, 'error');
        } else {
            showToast(data.message || '修改失败', 'error');
        }
    } catch (err) {
        showToast('网络错误，请重试', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
