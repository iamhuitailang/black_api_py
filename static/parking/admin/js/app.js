const API_BASE = '/api/parking';

let currentTab = 'application';
let applicationPage = 1;
let applicationPageSize = 10;
let paymentPage = 1;
let paymentPageSize = 10;
let selectedApplicationId = null;
let selectedSpotId = null;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadApplicationStats();
    loadApplications();
    loadSpotStats();
    loadApprovedApplications();
    loadSpots();
    loadPaymentStats();
    loadPayments();
});

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

    if (tabName === 'application') {
        loadApplicationStats();
        loadApplications();
    } else if (tabName === 'assign') {
        loadSpotStats();
        loadApprovedApplications();
        loadSpots();
    } else if (tabName === 'payment') {
        loadPaymentStats();
        loadPayments();
    }
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
        toast.style.transform = 'translateX(100%)';
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
        'unpaid': '待缴费',
        'available': '可用',
        'occupied': '已占用',
        'maintenance': '维护中'
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
        'unpaid': 'badge-unpaid',
        'available': 'badge-available',
        'occupied': 'badge-occupied'
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

async function loadApplicationStats() {
    const result = await apiGet('/application/getstatistics');
    if (result.code === 0 && result.data) {
        document.getElementById('stat-pending').textContent = result.data.pending || 0;
        document.getElementById('stat-approved').textContent = result.data.approved || 0;
        document.getElementById('stat-rejected').textContent = result.data.rejected || 0;
        document.getElementById('stat-assigned').textContent = result.data.assigned || 0;
    }
}

async function loadApplications() {
    const status = document.getElementById('filter-status').value;
    const keyword = document.getElementById('search-keyword').value;
    
    let url = `/application/getlist?page=${applicationPage}&page_size=${applicationPageSize}`;
    if (status) url += `&status=${status}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    
    const result = await apiGet(url);
    if (result.code === 0 && result.data) {
        renderApplications(result.data.items || []);
        renderPagination('application-pagination', result.data, (page) => {
            applicationPage = page;
            loadApplications();
        });
    }
}

function renderApplications(items) {
    const tbody = document.getElementById('application-list');
    
    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="icon">📭</div><p>暂无数据</p></div></td></tr>`;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td><strong>${item.car_plate}</strong></td>
            <td>${item.applicant_name}</td>
            <td>${item.applicant_phone}</td>
            <td>${getSpotTypeText(item.desired_spot_type)}</td>
            <td><span class="badge ${getStatusBadgeClass(item.status)}">${getStatusText(item.status)}</span></td>
            <td>${formatDate(item.created_at)}</td>
            <td>
                <div class="table-actions">
                    ${item.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="approveApplication(${item.id})">通过</button>
                        <button class="btn btn-sm btn-danger" onclick="showRejectModal(${item.id})">拒绝</button>
                    ` : ''}
                    ${item.status === 'approved' ? `
                        <button class="btn btn-sm btn-primary" onclick="goToAssign(${item.id})">分配车位</button>
                    ` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="viewApplication(${item.id})">详情</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function renderPagination(containerId, data, onChange) {
    const container = document.getElementById(containerId);
    const { total, page, page_size, total_pages } = data;
    
    if (total_pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    window[`pageChange_${containerId}`] = onChange;
    
    let html = '';
    html += `<button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} onclick="window.pageChange_${containerId}(${page - 1})">‹</button>`;
    
    for (let i = 1; i <= total_pages; i++) {
        if (i === 1 || i === total_pages || (i >= page - 2 && i <= page + 2)) {
            html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="window.pageChange_${containerId}(${i})">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += `<span style="padding: 0 4px; color: var(--text-secondary);">...</span>`;
        }
    }
    
    html += `<button class="pagination-btn" ${page >= total_pages ? 'disabled' : ''} onclick="window.pageChange_${containerId}(${page + 1})">›</button>`;
    html += `<span class="pagination-info">共 ${total} 条</span>`;
    
    container.innerHTML = html;
}

async function approveApplication(id) {
    if (!confirm('确定通过该申请吗？')) return;
    
    const result = await apiPost('/application/approve?id=' + id, {});
    if (result.code === 0) {
        showToast('审批通过', 'success');
        loadApplicationStats();
        loadApplications();
    } else {
        showToast(result.message || '操作失败', 'error');
    }
}

function showRejectModal(id) {
    selectedApplicationId = id;
    openModal('拒绝申请', `
        <div class="form-group">
            <label>拒绝原因</label>
            <textarea class="form-control" id="reject-reason" placeholder="请输入拒绝原因"></textarea>
        </div>
    `, [
        { text: '取消', class: 'btn-secondary', action: closeModal },
        { text: '确认拒绝', class: 'btn-danger', action: () => rejectApplication(id) }
    ]);
}

async function rejectApplication(id) {
    const reason = document.getElementById('reject-reason').value;
    if (!reason.trim()) {
        showToast('请输入拒绝原因', 'warning');
        return;
    }
    
    const result = await apiPost('/application/reject', { id, reject_reason: reason });
    if (result.code === 0) {
        showToast('已拒绝申请', 'success');
        closeModal();
        loadApplicationStats();
        loadApplications();
    } else {
        showToast(result.message || '操作失败', 'error');
    }
}

async function viewApplication(id) {
    const result = await apiGet('/application/get?id=' + id);
    if (result.code !== 0 || !result.data) {
        showToast('获取详情失败', 'error');
        return;
    }
    
    const app = result.data;
    let html = `
        <div style="display: grid; gap: 12px;">
            <div><strong>车牌号：</strong>${app.car_plate}</div>
            <div><strong>申请人：</strong>${app.applicant_name}</div>
            <div><strong>联系电话：</strong>${app.applicant_phone}</div>
            <div><strong>住址：</strong>${app.applicant_address || '-'}</div>
            <div><strong>期望车位类型：</strong>${getSpotTypeText(app.desired_spot_type)}</div>
            <div><strong>状态：</strong><span class="badge ${getStatusBadgeClass(app.status)}">${getStatusText(app.status)}</span></div>
            <div><strong>申请时间：</strong>${formatDate(app.created_at)}</div>
    `;
    
    if (app.reject_reason) {
        html += `<div><strong>拒绝原因：</strong>${app.reject_reason}</div>`;
    }
    
    if (app.spot) {
        html += `
            <hr style="border: none; border-top: 1px solid var(--border); margin: 8px 0;">
            <div><strong>分配车位：</strong>${app.spot.spot_number} (${getSpotTypeText(app.spot.spot_type)})</div>
            <div><strong>月租费用：</strong>¥${app.spot.monthly_fee}/月</div>
            <div><strong>开始日期：</strong>${app.start_date || '-'}</div>
            <div><strong>结束日期：</strong>${app.end_date || '-'}</div>
        `;
    }
    
    if (app.payments && app.payments.length > 0) {
        html += `
            <hr style="border: none; border-top: 1px solid var(--border); margin: 8px 0;">
            <div><strong>缴费记录：</strong></div>
            ${app.payments.map(p => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed var(--border);">
                    <span>${p.month}</span>
                    <span>¥${p.amount}</span>
                    <span class="badge ${getStatusBadgeClass(p.status)}">${getStatusText(p.status)}</span>
                </div>
            `).join('')}
        `;
    }
    
    html += '</div>';
    
    openModal('申请详情', html, [
        { text: '关闭', class: 'btn-secondary', action: closeModal }
    ]);
}

function goToAssign(applicationId) {
    selectedApplicationId = applicationId;
    switchTab('assign');
    setTimeout(() => {
        const item = document.querySelector(`.approved-item[data-id="${applicationId}"]`);
        if (item) {
            item.click();
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

async function loadSpotStats() {
    const result = await apiGet('/spot/getstatistics');
    if (result.code === 0 && result.data) {
        document.getElementById('spot-total').textContent = result.data.total || 0;
        document.getElementById('spot-available').textContent = result.data.available || 0;
        document.getElementById('spot-occupied').textContent = result.data.occupied || 0;
        document.getElementById('spot-maintenance').textContent = result.data.maintenance || 0;
    }
}

async function loadApprovedApplications() {
    const result = await apiGet('/application/getlist?page=1&page_size=50&status=approved');
    const result2 = await apiGet('/application/getlist?page=1&page_size=50&status=assigned');
    
    let items = [];
    if (result.code === 0 && result.data) {
        items = items.concat(result.data.items || []);
    }
    if (result2.code === 0 && result2.data) {
        items = items.concat(result2.data.items || []);
    }
    
    renderApprovedList(items);
}

function renderApprovedList(items) {
    const container = document.getElementById('approved-list');
    
    if (!items || items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="icon">📋</div><p>暂无待分配申请</p></div>`;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="approved-item ${selectedApplicationId === item.id ? 'selected' : ''}" data-id="${item.id}" onclick="selectApplication(${item.id})">
            <div class="car-plate">${item.car_plate}</div>
            <div class="applicant">${item.applicant_name} · ${item.applicant_phone}</div>
            <div class="spot-type">${getSpotTypeText(item.desired_spot_type)} · ${getStatusText(item.status)}</div>
        </div>
    `).join('');
}

function selectApplication(id) {
    selectedApplicationId = id;
    document.querySelectorAll('.approved-item').forEach(item => {
        item.classList.toggle('selected', parseInt(item.dataset.id) === id);
    });
}

async function loadSpots() {
    const spotType = document.getElementById('spot-type-filter').value;
    let url = '/spot/getall?status=available';
    if (spotType) url += `&spot_type=${spotType}`;
    
    const result = await apiGet(url);
    if (result.code === 0 && result.data) {
        renderSpots(result.data || []);
    }
}

function renderSpots(spots) {
    const container = document.getElementById('spot-grid');
    
    if (!spots || spots.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><div class="icon">🅿️</div><p>暂无可用车位</p></div>`;
        return;
    }
    
    container.innerHTML = spots.map(spot => `
        <div class="spot-item ${selectedSpotId === spot.id ? 'selected' : ''}" 
             data-id="${spot.id}" 
             onclick="selectSpot(${spot.id})"
             title="${spot.spot_number} - ${getSpotTypeText(spot.spot_type)} - ¥${spot.monthly_fee}/月">
            <div class="spot-number">${spot.spot_number}</div>
            <div class="spot-type-label">¥${spot.monthly_fee}</div>
        </div>
    `).join('');
    
    const assignBtn = document.getElementById('assign-btn');
    if (assignBtn) {
        assignBtn.disabled = !selectedApplicationId || !selectedSpotId;
    }
}

function selectSpot(id) {
    selectedSpotId = id;
    document.querySelectorAll('.spot-item').forEach(item => {
        item.classList.toggle('selected', parseInt(item.dataset.id) === id);
    });
    
    if (selectedApplicationId && selectedSpotId) {
        showAssignConfirm();
    }
}

function showAssignConfirm() {
    if (!selectedApplicationId || !selectedSpotId) return;
    
    openModal('确认分配车位', `
        <div style="text-align: center; padding: 20px 0;">
            <p>确定要将车位分配给该申请人吗？</p>
            <div style="margin: 16px 0; display: grid; gap: 8px;">
                <div class="form-group">
                    <label>租赁月数</label>
                    <select class="form-control" id="assign-months">
                        <option value="1">1 个月</option>
                        <option value="3">3 个月</option>
                        <option value="6">6 个月</option>
                        <option value="12">12 个月</option>
                    </select>
                </div>
            </div>
            <p style="color: var(--text-secondary); font-size: 13px;">分配后将自动生成对应月份的缴费记录</p>
        </div>
    `, [
        { text: '取消', class: 'btn-secondary', action: closeModal },
        { text: '确认分配', class: 'btn-primary', action: doAssign }
    ]);
}

async function doAssign() {
    const months = parseInt(document.getElementById('assign-months').value) || 1;
    
    const result = await apiPost('/application/assignspot', {
        application_id: selectedApplicationId,
        spot_id: selectedSpotId,
        months: months
    });
    
    if (result.code === 0) {
        showToast('车位分配成功', 'success');
        closeModal();
        selectedApplicationId = null;
        selectedSpotId = null;
        loadSpotStats();
        loadApprovedApplications();
        loadSpots();
    } else {
        showToast(result.message || '分配失败', 'error');
    }
}

async function loadPaymentStats() {
    const result = await apiGet('/payment/getstatistics');
    if (result.code === 0 && result.data) {
        document.getElementById('payment-total').textContent = result.data.total_count || 0;
        document.getElementById('payment-paid').textContent = result.data.paid_count || 0;
        document.getElementById('payment-unpaid').textContent = result.data.unpaid_count || 0;
        document.getElementById('payment-amount').textContent = '¥' + (result.data.paid_amount || 0).toFixed(0);
    }
}

async function loadPayments() {
    const status = document.getElementById('payment-status-filter').value;
    const keyword = document.getElementById('payment-search').value;
    
    let url = `/payment/getlist?page=${paymentPage}&page_size=${paymentPageSize}`;
    if (status) url += `&status=${status}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    
    const result = await apiGet(url);
    if (result.code === 0 && result.data) {
        renderPayments(result.data.items || []);
        renderPagination('payment-pagination', result.data, (page) => {
            paymentPage = page;
            loadPayments();
        });
    }
}

function renderPayments(items) {
    const tbody = document.getElementById('payment-list');
    
    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="icon">💰</div><p>暂无缴费记录</p></div></td></tr>`;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td><strong>${item.car_plate}</strong></td>
            <td>${item.applicant_name}</td>
            <td>${item.month}</td>
            <td>¥${item.amount}</td>
            <td><span class="badge ${getStatusBadgeClass(item.status)}">${getStatusText(item.status)}</span></td>
            <td>${item.paid_time ? formatDate(item.paid_time) : '-'}</td>
            <td>
                <div class="table-actions">
                    ${item.status === 'unpaid' ? `
                        <button class="btn btn-sm btn-success" onclick="markPaid(${item.id})">标记已缴</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function markPaid(id) {
    if (!confirm('确定标记该记录为已缴费吗？')) return;
    
    const result = await apiPost('/payment/markpaid', { id, payment_method: 'cash' });
    if (result.code === 0) {
        showToast('已标记为缴费', 'success');
        loadPaymentStats();
        loadPayments();
    } else {
        showToast(result.message || '操作失败', 'error');
    }
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
