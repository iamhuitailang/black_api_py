const API_BASE = '/api';

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast ' + type;
    }, 2500);
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

        if (data.code === 0 && data.data) {
            const form = document.getElementById('edit-form');
            const info = data.data;
            form.student_name.value = info.student_name || '';
            form.class_name.value = info.class_name || '';
            form.parent_name.value = info.parent_name || '';
            form.relation.value = info.relation || '';
            form.new_phone.value = '';
            form.address.value = info.address || '';
            document.getElementById('edit-original-phone').value = phone;
            form.classList.remove('hidden');
            showToast('查询成功，请修改信息后保存', 'success');
        } else {
            showToast(data.message || '未找到该手机号的登记信息', 'error');
            document.getElementById('edit-form').classList.add('hidden');
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
        const formData = {
            phone: originalPhone,
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
