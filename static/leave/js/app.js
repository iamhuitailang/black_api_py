const API_BASE = '/api';

async function apiGet(path, params = {}) {
    const url = new URL(API_BASE + path, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v);
    });
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.code !== 0) {
        showToast(data.message || '操作失败', 'error');
        throw new Error(data.message);
    }
    return data.data;
}

async function apiPost(path, body = {}) {
    const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.code !== 0) {
        showToast(data.message || '操作失败', 'error');
        throw new Error(data.message);
    }
    return data.data;
}

function showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function todayStr() {
    return formatDate(new Date());
}

const LEAVE_TYPES = [
    { value: 'annual', label: '年假', color: '#67c23a' },
    { value: 'personal', label: '事假', color: '#e6a23c' },
    { value: 'sick', label: '病假', color: '#f56c6c' },
    { value: 'compensation', label: '调休', color: '#409eff' },
    { value: 'marriage', label: '婚假', color: '#eb6877' },
    { value: 'maternity', label: '产假', color: '#909399' },
];

const LEAVE_MAP = Object.fromEntries(LEAVE_TYPES.map(t => [t.value, t]));

function getLeaveTypeLabel(v) {
    return LEAVE_MAP[v]?.label || v;
}

const STATUS_MAP = {
    pending_manager: { label: '待直属上级审批', cls: 'tag-pending' },
    pending_hr: { label: '待部门经理审批', cls: 'tag-pending' },
    approved: { label: '已批准', cls: 'tag-approved' },
    rejected: { label: '已驳回', cls: 'tag-rejected' },
};

function getStatusHtml(status) {
    const s = STATUS_MAP[status] || { label: status, cls: 'tag-info' };
    return `<span class="status-tag ${s.cls}">${s.label}</span>`;
}

const AUTH_STORAGE_KEY = 'leave_user_auth';
const FORM_STORAGE_KEY = 'leave_form_draft';
let currentEmployee = null;
let currentRole = 'employee';
let allEmployees = [];
let calendarYear, calendarMonth;
let _tabsSetup = false;
let _leaveFormSetup = false;

function saveAuth(emp) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(emp));
}

function getAuth() {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function clearAuth() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(FORM_STORAGE_KEY);
}

function showLogin() {
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginName').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginName').focus();
}

function showApp() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('currentUserName').textContent = currentEmployee.name;
    document.getElementById('currentUserDept').textContent = currentEmployee.department;
    const roleMap = { employee: '普通员工', manager: '部门经理', hr: 'HR管理员', admin: '超级管理员' };
    document.getElementById('currentUserRole').textContent = roleMap[currentRole] || currentRole;

    const hrTab = document.getElementById('hrTab');
    if (currentRole === 'hr' || currentRole === 'admin') {
        hrTab.style.display = 'block';
    } else {
        hrTab.style.display = 'none';
        const activeTab = document.querySelector('.tab-item.active');
        if (activeTab && activeTab.dataset.tab === 'hr') {
            document.querySelector('[data-tab="employee"]').click();
        }
    }
}

async function doLogin(name, password) {
    try {
        const emp = await apiPost('/leave/login', { name, password });
        currentEmployee = emp;
        currentRole = emp.role || 'employee';
        saveAuth(emp);
        showApp();
        setupTabs();
        setupLeaveForm();
        refreshEmployeeView();
        refreshApprovalList();
        if (currentRole === 'hr' || currentRole === 'admin') {
            refreshHrStats();
        }
        showToast('登录成功', 'success');
        return true;
    } catch (e) {
        showToast(e.message || '登录失败', 'error');
        return false;
    }
}

function doLogout() {
    clearAuth();
    currentEmployee = null;
    currentRole = 'employee';
    showLogin();
    showToast('已退出登录', 'info');
}

async function initApp() {
    try {
        const seedRes = await apiPost('/leave/seed');
        console.log('Seed check:', seedRes);
    } catch (e) {
        console.error(e);
    }

    document.getElementById('loginBtn').onclick = async () => {
        const name = document.getElementById('loginName').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!name || !password) {
            showToast('请输入用户名和密码', 'error');
            return;
        }
        const ok = await doLogin(name, password);
        if (!ok) {
            showToast('用户名或密码错误', 'error');
        }
    };

    document.getElementById('loginPassword').onkeypress = (e) => {
        if (e.key === 'Enter') {
            document.getElementById('loginBtn').click();
        }
    };

    document.getElementById('logoutBtn').onclick = doLogout;

    document.getElementById('initDataBtn').onclick = async () => {
        try {
            await apiPost('/leave/seed');
            showToast('已初始化演示数据', 'success');
            if (currentEmployee) {
                refreshEmployeeView();
                refreshApprovalList();
                if (currentRole === 'hr' || currentRole === 'admin') {
                    refreshHrStats();
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saved = getAuth();
    if (saved) {
        currentEmployee = saved;
        currentRole = saved.role || 'employee';
        showApp();
        setupTabs();
        setupLeaveForm();
        refreshEmployeeView();
        refreshApprovalList();
        if (currentRole === 'hr' || currentRole === 'admin') {
            refreshHrStats();
        }
    } else {
        showLogin();
    }
}

function setupTabs() {
    if (_tabsSetup) return;
    _tabsSetup = true;
    const tabs = document.querySelectorAll('.tab-item');
    const panels = document.querySelectorAll('.tab-panel');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById(`panel-${target}`).classList.add('active');
            if (target === 'employee') refreshEmployeeView();
            if (target === 'approval') refreshApprovalList();
            if (target === 'hr' && (currentRole === 'hr' || currentRole === 'admin')) {
                refreshHrStats();
            }
        };
    });
}

function saveFormDraft() {
    if (!currentEmployee) return;
    const draft = {
        employee_id: currentEmployee.id,
        leave_type: document.getElementById('leaveType').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        reason: document.getElementById('leaveReason').value
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(draft));
}

function loadFormDraft() {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (!saved) return;
    try {
        const draft = JSON.parse(saved);
        if (currentEmployee && draft.employee_id === currentEmployee.id) {
            if (draft.leave_type) document.getElementById('leaveType').value = draft.leave_type;
            if (draft.start_date) document.getElementById('startDate').value = draft.start_date;
            if (draft.end_date) document.getElementById('endDate').value = draft.end_date;
            if (draft.reason) document.getElementById('leaveReason').value = draft.reason;
        }
    } catch (e) {
        localStorage.removeItem(FORM_STORAGE_KEY);
    }
}

function clearFormDraft() {
    localStorage.removeItem(FORM_STORAGE_KEY);
}

function setupLeaveForm() {
    if (_leaveFormSetup) return;
    _leaveFormSetup = true;
    const startEl = document.getElementById('startDate');
    const endEl = document.getElementById('endDate');
    const leaveTypeEl = document.getElementById('leaveType');
    const reasonEl = document.getElementById('leaveReason');
    const workDaysEl = document.getElementById('workDays');
    const today = todayStr();
    startEl.min = today;
    endEl.min = today;

    loadFormDraft();
    if (!startEl.value) startEl.value = today;

    async function updateWorkDays() {
        if (startEl.value && endEl.value) {
            try {
                const data = await apiGet('/leave/calc/workdays/get', {
                    start_date: startEl.value,
                    end_date: endEl.value
                });
                workDaysEl.textContent = data.work_days + ' 个工作日';
            } catch (e) {
                workDaysEl.textContent = '-';
            }
        }
        saveFormDraft();
    }

    leaveTypeEl.onchange = saveFormDraft;
    reasonEl.oninput = saveFormDraft;
    startEl.onchange = () => {
        endEl.min = startEl.value;
        if (endEl.value && endEl.value < startEl.value) endEl.value = startEl.value;
        updateWorkDays();
    };
    endEl.onchange = updateWorkDays;
    updateWorkDays();

    document.getElementById('submitLeaveBtn').onclick = async () => {
        if (!currentEmployee) return;
        const leave_type = leaveTypeEl.value;
        const start_date = startEl.value;
        const end_date = endEl.value;
        const reason = reasonEl.value.trim();

        if (!start_date || !end_date) {
            showToast('请选择起止日期', 'error');
            return;
        }
        if (!reason) {
            showToast('请填写请假事由', 'error');
            return;
        }

        try {
            await apiPost('/leave/submit', {
                employee_id: currentEmployee.id,
                leave_type,
                start_date,
                end_date,
                reason
            });
            showToast('请假申请已提交', 'success');
            clearFormDraft();
            reasonEl.value = '';
            startEl.value = today;
            endEl.value = '';
            workDaysEl.textContent = '0 个工作日';
            refreshEmployeeView();
        } catch (e) {
            console.error(e);
        }
    };
}

async function refreshEmployeeView() {
    if (!currentEmployee) return;
    const empId = currentEmployee.id;

    try {
        const balance = await apiGet('/leave/balance/get', { employee_id: empId });
        document.getElementById('balanceAnnual').textContent = balance.annual_remaining;
        document.getElementById('balanceComp').textContent = balance.compensation_remaining;
    } catch (e) {
        console.error(e);
    }

    try {
        const records = await apiGet('/leave/myleaves/getlist', { employee_id: empId });
        renderMyLeaves(records);
    } catch (e) {
        console.error(e);
    }

    if (!calendarYear) {
        const now = new Date();
        calendarYear = now.getFullYear();
        calendarMonth = now.getMonth() + 1;
    }
    renderCalendar();
}

function renderMyLeaves(records) {
    const tbody = document.getElementById('myLeavesTable');
    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">暂无请假记录</div>
            </div>
        </td></tr>`;
        return;
    }
    tbody.innerHTML = records.map(r => `
        <tr>
            <td>${getLeaveTypeLabel(r.leave_type)}</td>
            <td>${r.start_date}</td>
            <td>${r.end_date}</td>
            <td>${r.work_days}天</td>
            <td class="reason-text" title="${r.reason || ''}">${r.reason || '-'}</td>
            <td>${getStatusHtml(r.status)}</td>
            <td class="comment-text" title="${r.approve_comment || ''}">${r.approve_comment || '-'}</td>
        </tr>
    `).join('');
}

async function renderCalendar() {
    if (!currentEmployee) return;
    const titleEl = document.getElementById('calendarTitle');
    titleEl.textContent = `${calendarYear}年${calendarMonth}月`;

    document.getElementById('prevMonthBtn').onclick = () => {
        calendarMonth--;
        if (calendarMonth < 1) { calendarMonth = 12; calendarYear--; }
        renderCalendar();
    };
    document.getElementById('nextMonthBtn').onclick = () => {
        calendarMonth++;
        if (calendarMonth > 12) { calendarMonth = 1; calendarYear++; }
        renderCalendar();
    };

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach((d, i) => {
        const el = document.createElement('div');
        el.className = 'calendar-day-header' + (i === 0 || i === 6 ? ' weekend' : '');
        el.textContent = d;
        grid.appendChild(el);
    });

    const firstDay = new Date(calendarYear, calendarMonth - 1, 1);
    const lastDay = new Date(calendarYear, calendarMonth, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    let calendarData = {};
    try {
        calendarData = await apiGet('/leave/calendar/get', {
            employee_id: currentEmployee.id,
            year: calendarYear,
            month: calendarMonth
        });
    } catch (e) {
        console.error(e);
    }

    const prevMonthLastDay = new Date(calendarYear, calendarMonth - 1, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
        const d = prevMonthLastDay - i;
        grid.appendChild(createCalendarCell(d, true, null, []));
    }

    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(calendarYear, calendarMonth - 1, d);
        const dateKey = formatDate(dateObj);
        const isToday = dateObj.toDateString() === today.toDateString();
        const weekday = dateObj.getDay();
        grid.appendChild(createCalendarCell(d, false, isToday, calendarData[dateKey] || [], weekday));
    }

    const totalCells = startWeekday + daysInMonth;
    const remaining = (7 - totalCells % 7) % 7;
    for (let d = 1; d <= remaining; d++) {
        grid.appendChild(createCalendarCell(d, true, null, []));
    }
}

function createCalendarCell(day, isOtherMonth, isToday, leaves = [], weekday) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    if (isOtherMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');
    if (weekday === 0 || weekday === 6) cell.classList.add('weekend');

    const numEl = document.createElement('div');
    numEl.className = 'day-number';
    numEl.textContent = day;
    cell.appendChild(numEl);

    if (leaves.length > 0) {
        const leavesEl = document.createElement('div');
        leavesEl.className = 'day-leaves';
        leaves.slice(0, 2).forEach(lv => {
            const dot = document.createElement('span');
            const cls = lv.status === 'approved' ? '' : ' pending';
            dot.className = `leave-dot ${lv.type}${cls}`;
            dot.textContent = lv.type_name;
            dot.title = `${lv.type_name} (${lv.status_name})${lv.reason ? ' - ' + lv.reason : ''}`;
            leavesEl.appendChild(dot);
        });
        if (leaves.length > 2) {
            const more = document.createElement('span');
            more.className = 'leave-dot';
            more.style.background = '#909399';
            more.textContent = `+${leaves.length - 2}`;
            leavesEl.appendChild(more);
        }
        cell.appendChild(leavesEl);
    }
    return cell;
}

async function refreshApprovalList() {
    if (!currentEmployee) return;
    const tbody = document.getElementById('approvalTable');
    try {
        const records = await apiGet('/leave/pending/getlist', {
            approver_id: currentEmployee.id,
            approver_role: currentRole
        });
        if (!records || records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8">
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <div class="empty-state-text">暂无待审批的请假申请</div>
                </div>
            </td></tr>`;
            return;
        }
        tbody.innerHTML = records.map(r => `
            <tr>
                <td>${r.employee_name}</td>
                <td>${r.department}</td>
                <td>${getLeaveTypeLabel(r.leave_type)}</td>
                <td>${r.start_date} 至 ${r.end_date}</td>
                <td>${r.work_days}天</td>
                <td class="reason-text" title="${r.reason || ''}">${r.reason || '-'}</td>
                <td>${getStatusHtml(r.status)}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="openApproveModal(${r.id}, true)">批准</button>
                    <button class="btn btn-danger btn-sm" onclick="openApproveModal(${r.id}, false)" style="margin-left:6px;">驳回</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

let currentApproveRequestId = null;
let currentApproveIsApprove = true;

function openApproveModal(requestId, isApprove) {
    currentApproveRequestId = requestId;
    currentApproveIsApprove = isApprove;
    const modal = document.getElementById('approveModal');
    const title = document.getElementById('modalTitle');
    const info = document.getElementById('modalInfo');
    const commentInput = document.getElementById('modalComment');

    commentInput.value = '';
    title.textContent = isApprove ? '批准请假申请' : '驳回请假申请';
    info.style.display = 'none';

    const rows = document.querySelectorAll('#approvalTable tr');
    rows.forEach(row => {
        const btns = row.querySelectorAll('button');
        if (btns.length > 0) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 8) {
                const btn = btns[0];
                if (btn && btn.getAttribute('onclick')) {
                    const match = btn.getAttribute('onclick').match(/\d+/);
                    if (match && parseInt(match[0]) === requestId) {
                        info.innerHTML = `
                            <div class="modal-info-row"><span class="modal-info-label">员工:</span><span class="modal-info-value">${cells[0].textContent}</span></div>
                            <div class="modal-info-row"><span class="modal-info-label">类型:</span><span class="modal-info-value">${cells[2].textContent}</span></div>
                            <div class="modal-info-row"><span class="modal-info-label">日期:</span><span class="modal-info-value">${cells[3].textContent}</span></div>
                            <div class="modal-info-row"><span class="modal-info-label">天数:</span><span class="modal-info-value">${cells[4].textContent}</span></div>
                            <div class="modal-info-row"><span class="modal-info-label">事由:</span><span class="modal-info-value">${cells[5].getAttribute('title') || cells[5].textContent}</span></div>
                        `;
                        info.style.display = 'block';
                    }
                }
            }
        }
    });

    commentInput.style.display = isApprove ? 'none' : 'block';
    modal.classList.add('show');
}

function closeApproveModal() {
    document.getElementById('approveModal').classList.remove('show');
    currentApproveRequestId = null;
}

async function confirmApprove() {
    if (!currentApproveRequestId || !currentEmployee) return;
    const comment = document.getElementById('modalComment').value.trim();
    if (!currentApproveIsApprove && !comment) {
        showToast('请填写驳回理由', 'error');
        return;
    }
    try {
        const path = currentApproveIsApprove ? '/leave/approve' : '/leave/reject';
        await apiPost(path, {
            request_id: currentApproveRequestId,
            approver_id: currentEmployee.id,
            approver_role: currentRole,
            comment: comment || null
        });
        showToast(currentApproveIsApprove ? '已批准' : '已驳回', 'success');
        closeApproveModal();
        refreshApprovalList();
        refreshEmployeeView();
    } catch (e) {
        console.error(e);
    }
}

let statsYear, statsMonth, statsDept;

async function refreshHrStats() {
    if (!statsYear) {
        const now = new Date();
        statsYear = now.getFullYear();
        statsMonth = now.getMonth() + 1;
    }

    document.getElementById('statsYear').value = statsYear;
    document.getElementById('statsMonth').value = statsMonth;

    document.getElementById('statsYear').onchange = (e) => {
        statsYear = parseInt(e.target.value);
        refreshHrStats();
    };
    document.getElementById('statsMonth').onchange = (e) => {
        statsMonth = parseInt(e.target.value);
        refreshHrStats();
    };
    document.getElementById('exportCsvBtn').onclick = () => {
        if (currentRole !== 'hr' && currentRole !== 'admin') {
            showToast('权限不足，仅HR或管理员可导出报表', 'error');
            return;
        }
        window.location.href = `${API_BASE}/leave/export/get?year=${statsYear}&month=${statsMonth}&requester_role=${currentRole}`;
    };

    try {
        const depts = await apiGet('/leave/department/getlist');
        const deptSel = document.getElementById('statsDept');
        const curVal = deptSel.value || '';
        deptSel.innerHTML = '<option value="">全部部门</option>' +
            depts.map(d => `<option value="${d}">${d}</option>`).join('');
        if (curVal) deptSel.value = curVal;
        deptSel.onchange = (e) => {
            statsDept = e.target.value || null;
            renderStatsRecords();
        };
    } catch (e) {
        console.error(e);
    }

    try {
        const allData = await apiGet('/leave/statistics/get', {
            year: statsYear,
            month: statsMonth,
            requester_role: currentRole
        });
        renderStatsCharts(allData);
        window._allStatsData = allData;
        renderStatsRecords();
    } catch (e) {
        console.error(e);
    }
}

function renderStatsCharts(data) {
    const summary = document.getElementById('statsSummary');
    const records = data.records || [];
    const totalRequests = records.length;
    const totalDays = records.reduce((s, r) => s + r.work_days, 0);
    const approved = records.filter(r => r.status === 'approved').length;
    const pending = records.filter(r => r.status.startsWith('pending')).length;
    summary.innerHTML = `
        <div class="stat-item">
            <div class="stat-item-label">请假申请总数</div>
            <div class="stat-item-value">${totalRequests}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">请假总天数</div>
            <div class="stat-item-value">${totalDays}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">已批准</div>
            <div class="stat-item-value" style="color:#67c23a">${approved}</div>
        </div>
        <div class="stat-item">
            <div class="stat-item-label">审批中</div>
            <div class="stat-item-value" style="color:#e6a23c">${pending}</div>
        </div>
    `;

    const byType = data.by_type || {};
    const typeChart = document.getElementById('typeChart');
    const maxDays = Math.max(1, ...Object.values(byType));
    if (Object.keys(byType).length === 0) {
        typeChart.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无数据</div></div>';
    } else {
        typeChart.innerHTML = `<div class="bar-chart">${Object.entries(byType).map(([k, v]) => {
            const typeInfo = LEAVE_TYPES.find(t => t.label === k) || { color: '#409eff' };
            const pct = (v / maxDays * 100).toFixed(0);
            return `<div class="bar-item">
                <div class="bar-label">${k}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${pct}%;background:${typeInfo.color}">${v > 0 ? v : ''}</div>
                </div>
                <div class="bar-value">${v}天</div>
            </div>`;
        }).join('')}</div>`;
    }

    const byDept = data.by_department || {};
    const deptChart = document.getElementById('deptChart');
    let deptMax = 1;
    Object.values(byDept).forEach(dv => {
        const total = Object.values(dv).reduce((s, v) => s + v, 0);
        if (total > deptMax) deptMax = total;
    });
    if (Object.keys(byDept).length === 0) {
        deptChart.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无数据</div></div>';
    } else {
        deptChart.innerHTML = `<div class="bar-chart">${Object.entries(byDept).map(([dept, dv]) => {
            const total = Object.values(dv).reduce((s, v) => s + v, 0);
            const pct = (total / deptMax * 100).toFixed(0);
            return `<div class="bar-item">
                <div class="bar-label">${dept}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${pct}%;background:#409eff">${total > 0 ? total : ''}</div>
                </div>
                <div class="bar-value">${total}天</div>
            </div>`;
        }).join('')}</div>`;
    }

    const abnormal = data.abnormal || [];
    const abnormalEl = document.getElementById('abnormalList');
    if (abnormal.length === 0) {
        abnormalEl.innerHTML = '<div class="empty-state"><div class="empty-state-text">本月无异常请假（超过5天）</div></div>';
    } else {
        abnormalEl.innerHTML = abnormal.map(a => `
            <div style="background:#fffbe6;border-radius:6px;padding:10px 14px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <strong style="color:#e6a23c;">${a.employee}</strong>
                        <span style="color:#909399;font-size:12px;margin-left:8px;">${a.department}</span>
                    </div>
                    <div style="color:#f56c6c;font-weight:600;">${a.total_days}天</div>
                </div>
                <div style="margin-top:4px;font-size:12px;color:#606266;">
                    ${Object.entries(a.details).map(([k, v]) => `${getLeaveTypeLabel(k)} ${v}天`).join('，')}
                </div>
            </div>
        `).join('');
    }
}

function renderStatsRecords() {
    const data = window._allStatsData;
    if (!data) return;
    let records = data.records || [];
    if (statsDept) {
        records = records.filter(r => r.department === statsDept);
    }
    const tbody = document.getElementById('statsTable');
    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8">
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-text">暂无请假记录</div>
            </div>
        </td></tr>`;
        return;
    }
    const empTotals = {};
    records.forEach(r => {
        const k = r.employee_name;
        if (!empTotals[k]) empTotals[k] = 0;
        empTotals[k] += r.work_days;
    });
    tbody.innerHTML = records.map(r => `
        <tr class="${empTotals[r.employee_name] > 5 ? 'abnormal-row' : ''}">
            <td>${r.employee_name}</td>
            <td>${r.department}</td>
            <td>${getLeaveTypeLabel(r.leave_type)}</td>
            <td>${r.start_date}</td>
            <td>${r.end_date}</td>
            <td>${r.work_days}天</td>
            <td>${getStatusHtml(r.status)}</td>
            <td class="reason-text" title="${r.reason || ''}">${r.reason || '-'}</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', initApp);
