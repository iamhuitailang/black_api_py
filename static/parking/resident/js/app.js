const API_BASE = '/api/parking';
const STORAGE_KEY = 'parking_resident_form';

let currentTab = 'apply';

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    restoreFormData();
    setupFormAutoSave();
});

function saveFormData() {
    const data = {
        tab: currentTab,
        car_plate: document.getElementById('car_plate').value,
        applicant_name: document.getElementById('applicant_name').value,
        applicant_phone: document.getElementById('applicant_phone').value,
        applicant_address: document.getElementById('applicant_address').value,
        desired_spot_type: document.getElementById('desired_spot_type').value,
        query_phone: document.getElementById('query-phone').value,
        payment_query_type: document.getElementById('payment-query-type').value,
        payment_query_value: document.getElementById('payment-query-value').value
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
}

function restoreFormData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const data = JSON.parse(saved);

        if (data.car_plate) document.getElementById('car_plate').value = data.car_plate;
        if (data.applicant_name) document.getElementById('applicant_name').value = data.applicant_name;
        if (data.applicant_phone) document.getElementById('applicant_phone').value = data.applicant_phone;
        if (data.applicant_address) document.getElementById('applicant_address').value = data.applicant_address;
        if (data.desired_spot_type) document.getElementById('desired_spot_type').value = data.desired_spot_type;
        if (data.query_phone) document.getElementById('query-phone').value = data.query_phone;
        if (data.payment_query_type) {
            document.getElementById('payment-query-type').value = data.payment_query_type;
            changePaymentQueryType();
        }
        if (data.payment_query_value) document.getElementById('payment-query-value').value = data.payment_query_value;
        if (data.tab && data.tab !== currentTab) {
            switchTab(data.tab);
        }
    } catch (e) {}
}

function clearFormStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            const keep = {
                tab: 'myapps',
                query_phone: data.applicant_phone || '',
                payment_query_type: data.payment_query_type || 'phone',
                payment_query_value: data.payment_query_value || ''
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(keep));
        }
    } catch (e) {}
}

function setupFormAutoSave() {
    const formFields = ['car_plate', 'applicant_name', 'applicant_phone', 'applicant_address',
                        'desired_spot_type', 'query-phone', 'payment-query-type', 'payment-query-value'];
    formFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', saveFormData);
            el.addEventListener('change', saveFormData);
        }
    });
}

function initTabs() {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    saveFormData();
}

async function apiGet(url) {
    try {
        const res = await fetch(API_BASE + url);
        const data = await res.json();
        return data;
    } catch (e) {
        showToast('网络错误', 'error');
        return { code: -1, message: '网络错误' };
    }
}

async function apiPost(url, body) {
    try {
        const res = await fetch(API_BASE + url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return data;
    } catch (e) {
        showToast('网络错误', 'error');
        return { code: -1, message: '网络错误' };
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getStatusText(status) {
    const map = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝',
        'assigned': '已分配',
        'paid': '已缴费',
        'unpaid': '待缴费'
    };
    return map[status] || status;
}

function getStatusBadgeClass(status) {
    const map = {
        'pending': 'badge-pending',
        'approved': 'badge-approved',
        'rejected': 'badge-rejected',
        'assigned': 'badge-assigned',
        'paid': 'badge-paid',
        'unpaid': 'badge-unpaid'
    };
    return map[status] || '';
}

function getSpotTypeText(type) {
    const map = {
        'standard': '标准车位',
        'large': '大型车位',
        'ev': '新能源车位'
    };
    return map[type] || type;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function validateCarPlate(plate) {
    if (!plate) return false;
    plate = plate.trim().toUpperCase();
    const pattern = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/;
    if (pattern.test(plate)) return true;
    const pattern2 = /^[A-Z]{2}\d{5}$/;
    if (pattern2.test(plate)) return true;
    return false;
}

function validatePhone(phone) {
    if (!phone) return false;
    return /^1[3-9]\d{9}$/.test(phone.trim());
}

async function submitApplication(e) {
    e.preventDefault();
    
    const car_plate = document.getElementById('car_plate').value.trim();
    const applicant_name = document.getElementById('applicant_name').value.trim();
    const applicant_phone = document.getElementById('applicant_phone').value.trim();
    const applicant_address = document.getElementById('applicant_address').value.trim();
    const desired_spot_type = document.getElementById('desired_spot_type').value;
    
    if (!car_plate) {
        showToast('请输入车牌号', 'warning');
        return;
    }
    if (!validateCarPlate(car_plate)) {
        showToast('车牌号格式不正确，请输入正确的车牌号（如：京A12345）', 'warning');
        return;
    }
    if (!applicant_name) {
        showToast('请输入申请人姓名', 'warning');
        return;
    }
    if (!applicant_phone) {
        showToast('请输入联系电话', 'warning');
        return;
    }
    if (!validatePhone(applicant_phone)) {
        showToast('手机号格式不正确，请输入11位有效手机号', 'warning');
        return;
    }
    
    const result = await apiPost('/application/submit', {
        car_plate,
        applicant_name,
        applicant_phone,
        applicant_address: applicant_address || null,
        desired_spot_type
    });
    
    if (result.code === 0) {
        showToast('申请提交成功！', 'success');
        clearFormStorage();
        document.getElementById('application-form').reset();
        
        setTimeout(() => {
            switchTab('myapps');
            document.getElementById('query-phone').value = applicant_phone;
            saveFormData();
            queryMyApplications();
        }, 1500);
    } else {
        showToast(result.message || '提交失败', 'error');
    }
}

async function queryMyApplications() {
    const phone = document.getElementById('query-phone').value.trim();
    
    if (!phone) {
        showToast('请输入手机号', 'warning');
        return;
    }
    if (!validatePhone(phone)) {
        showToast('手机号格式不正确，请输入11位有效手机号', 'warning');
        return;
    }
    
    const result = await apiGet(`/application/getmy?phone=${encodeURIComponent(phone)}`);
    
    const container = document.getElementById('my-applications-list');
    
    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📋</div>
                <p>暂无申请记录</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = result.data.map(app => renderApplicationCard(app)).join('');
}

function renderApplicationCard(app) {
    let extraHtml = '';
    
    if (app.status === 'rejected' && app.reject_reason) {
        extraHtml = `
            <div class="info-row">
                <span class="info-label">拒绝原因</span>
                <span class="info-value" style="color: var(--danger);">${app.reject_reason}</span>
            </div>
        `;
    }
    
    let spotHtml = '';
    if (app.spot) {
        spotHtml = `
            <div class="spot-info">
                <div class="spot-title">🎉 车位已分配</div>
                <div class="spot-row">
                    <span>车位编号</span>
                    <strong>${app.spot.spot_number}</strong>
                </div>
                <div class="spot-row">
                    <span>车位类型</span>
                    <strong>${getSpotTypeText(app.spot.spot_type)}</strong>
                </div>
                <div class="spot-row">
                    <span>月租费用</span>
                    <strong>¥${app.spot.monthly_fee}/月</strong>
                </div>
                <div class="spot-row">
                    <span>车位位置</span>
                    <strong>${app.spot.location || '-'}</strong>
                </div>
                ${app.start_date ? `
                <div class="spot-row">
                    <span>开始日期</span>
                    <strong>${app.start_date}</strong>
                </div>` : ''}
                ${app.end_date ? `
                <div class="spot-row">
                    <span>结束日期</span>
                    <strong>${app.end_date}</strong>
                </div>` : ''}
            </div>
        `;
    }
    
    return `
        <div class="application-card">
            <div class="card-header">
                <span class="car-plate">${app.car_plate}</span>
                <span class="badge ${getStatusBadgeClass(app.status)}">${getStatusText(app.status)}</span>
            </div>
            <div class="applicant">${app.applicant_name} · ${app.applicant_phone}</div>
            <div class="info-row">
                <span class="info-label">车位类型</span>
                <span class="info-value">${getSpotTypeText(app.desired_spot_type)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">申请时间</span>
                <span class="info-value">${formatDate(app.created_at)}</span>
            </div>
            ${extraHtml}
            ${spotHtml}
        </div>
    `;
}

function changePaymentQueryType() {
    const type = document.getElementById('payment-query-type').value;
    const label = document.getElementById('payment-query-label');
    const input = document.getElementById('payment-query-value');
    
    if (type === 'phone') {
        label.textContent = '手机号';
        input.placeholder = '请输入手机号';
        input.type = 'tel';
    } else {
        label.textContent = '车牌号';
        input.placeholder = '请输入车牌号';
        input.type = 'text';
    }
}

async function queryMyPayments() {
    const type = document.getElementById('payment-query-type').value;
    const value = document.getElementById('payment-query-value').value.trim();
    
    if (!value) {
        showToast('请输入查询内容', 'warning');
        return;
    }
    
    if (type === 'phone' && !validatePhone(value)) {
        showToast('手机号格式不正确，请输入11位有效手机号', 'warning');
        return;
    }
    if (type === 'car_plate' && !validateCarPlate(value)) {
        showToast('车牌号格式不正确，请输入正确的车牌号', 'warning');
        return;
    }
    
    let url = '/payment/getmy?';
    if (type === 'phone') {
        url += `phone=${encodeURIComponent(value)}`;
    } else {
        url += `car_plate=${encodeURIComponent(value)}`;
    }
    
    const result = await apiGet(url);
    
    const container = document.getElementById('my-payments-list');
    
    if (result.code !== 0 || !result.data || result.data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">💰</div>
                <p>暂无缴费记录</p>
            </div>
        `;
        return;
    }
    
    const total = result.data.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paidCount = result.data.filter(p => p.status === 'paid').length;
    
    container.innerHTML = `
        <div class="payment-summary" style="background: var(--card-bg); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow-sm); display: flex; justify-content: space-around; text-align: center;">
            <div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">总记录</div>
                <div style="font-size: 20px; font-weight: 700; color: var(--text-primary);">${result.data.length}</div>
            </div>
            <div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">已缴费</div>
                <div style="font-size: 20px; font-weight: 700; color: var(--success);">${paidCount}</div>
            </div>
            <div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">总金额</div>
                <div style="font-size: 20px; font-weight: 700; color: var(--danger);">¥${total.toFixed(0)}</div>
            </div>
        </div>
        ${result.data.map(p => renderPaymentCard(p)).join('')}
    `;
}

function renderPaymentCard(payment) {
    return `
        <div class="payment-card">
            <div class="payment-left">
                <div class="payment-month">${payment.month} 月租费</div>
                <div class="payment-car">${payment.car_plate} · ${payment.applicant_name}</div>
            </div>
            <div class="payment-right">
                <div class="payment-amount">${payment.amount.toFixed(0)}</div>
                <span class="badge ${getStatusBadgeClass(payment.status)}">${getStatusText(payment.status)}</span>
            </div>
        </div>
    `;
}

function openModal(title, bodyHtml, buttons) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `btn ${btn.class}`;
        button.textContent = btn.text;
        button.onclick = btn.action;
        footer.appendChild(button);
    });
    
    document.getElementById('modal-overlay').classList.add('show');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        closeModal();
    }
});
