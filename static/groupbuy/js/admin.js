let groupBuys = [];

async function loadList() {
    const result = await apiGet('/list/get');
    if (result.code === 0) {
        groupBuys = result.data.items || [];
        renderList();
    } else {
        document.getElementById('adminList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <div class="empty-text">${result.message}</div>
            </div>
        `;
    }
}

function renderList() {
    const container = document.getElementById('adminList');

    if (groupBuys.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <div class="empty-text">还没有团购，点击上方按钮发布第一个吧！</div>
            </div>
        `;
        return;
    }

    container.innerHTML = groupBuys.map(gb => {
        const isActive = gb.status === 'active';
        const statusText = isActive ? '接龙中' : '已截单';

        return `
            <div class="admin-card">
                <div class="admin-card-header">
                    <div class="admin-card-title">${escapeHtml(gb.title)}</div>
                    <div class="admin-card-price">
                        <span class="unit">¥</span>${parseFloat(gb.price).toFixed(2)}
                    </div>
                </div>
                ${gb.spec ? `<div class="admin-card-spec">📦 ${escapeHtml(gb.spec)}</div>` : ''}
                <div class="admin-card-stats">
                    <div class="admin-stat">
                        <div class="admin-stat-label">接龙人数</div>
                        <div class="admin-stat-value">${gb.order_count || 0}人</div>
                    </div>
                    <div class="admin-stat">
                        <div class="admin-stat-label">总份数</div>
                        <div class="admin-stat-value">${gb.total_quantity || 0}份</div>
                    </div>
                    <div class="admin-stat">
                        <div class="admin-stat-label">总金额</div>
                        <div class="admin-stat-value amount">¥${parseFloat(gb.total_amount || 0).toFixed(2)}</div>
                    </div>
                </div>
                <div class="admin-card-deadline">
                    📅 ${formatDateTime(gb.deadline)}
                    <span class="status-tag ${gb.status}">${statusText}</span>
                </div>
                <div class="admin-card-actions">
                    <button class="btn-action view" onclick="viewDetail(${gb.id})">👁️ 查看</button>
                    <button class="btn-action edit" onclick="openEditModal(${gb.id})" ${isActive ? '' : 'disabled'}>✏️ 编辑</button>
                    <button class="btn-action close" onclick="closeGroupBuy(${gb.id})" ${isActive ? '' : 'disabled'}>🚫 截单</button>
                    <button class="btn-action export" onclick="exportCSV(${gb.id})">📥 导出</button>
                    <button class="btn-action delete" onclick="deleteGroupBuy(${gb.id})">🗑️ 删除</button>
                </div>
            </div>
        `;
    }).join('');
}

function viewDetail(id) {
    window.location.href = `detail.html?id=${id}`;
}

function openCreateModal() {
    document.getElementById('modalTitle').textContent = '发布新团购';
    document.getElementById('editId').value = '';
    document.getElementById('title').value = '';
    document.getElementById('spec').value = '';
    document.getElementById('price').value = '';
    document.getElementById('description').value = '';
    document.getElementById('image_url').value = '';

    const now = new Date();
    now.setDate(now.getDate() + 1);
    now.setHours(18, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const defaultDeadline = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    document.getElementById('deadline').value = defaultDeadline;

    document.getElementById('editModal').classList.add('active');
}

function openEditModal(id) {
    const gb = groupBuys.find(g => g.id === id);
    if (!gb) return;

    document.getElementById('modalTitle').textContent = '编辑团购';
    document.getElementById('editId').value = gb.id;
    document.getElementById('title').value = gb.title;
    document.getElementById('spec').value = gb.spec || '';
    document.getElementById('price').value = gb.price;
    document.getElementById('description').value = gb.description || '';
    document.getElementById('image_url').value = gb.image_url || '';

    if (gb.deadline) {
        const d = new Date(gb.deadline);
        const pad = (n) => String(n).padStart(2, '0');
        document.getElementById('deadline').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function submitForm(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const title = document.getElementById('title').value.trim();
    const spec = document.getElementById('spec').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const description = document.getElementById('description').value.trim();
    const image_url = document.getElementById('image_url').value.trim();
    const deadlineValue = document.getElementById('deadline').value;

    if (!title) {
        showToast('请填写商品名称');
        return;
    }
    if (isNaN(price) || price < 0) {
        showToast('请填写正确的价格');
        return;
    }
    if (!deadlineValue) {
        showToast('请设置截单时间');
        return;
    }

    const deadline = new Date(deadlineValue).toISOString().replace('Z', '');

    if (id) {
        const result = await apiPost('/update', {
            id: parseInt(id),
            title,
            spec,
            price,
            description,
            image_url,
            deadline
        });
        if (result.code === 0) {
            showToast('更新成功！');
            closeEditModal();
            loadList();
        } else {
            showToast(result.message);
        }
    } else {
        const result = await apiPost('/create', {
            title,
            spec,
            price,
            description,
            image_url,
            deadline
        });
        if (result.code === 0) {
            showToast('发布成功！');
            closeEditModal();
            loadList();
        } else {
            showToast(result.message);
        }
    }
}

async function closeGroupBuy(id) {
    if (!confirm('确定要提前截单吗？截单后邻居们将无法再接龙。')) {
        return;
    }

    const result = await apiPost(`/close?id=${id}`);
    if (result.code === 0) {
        showToast('截单成功！');
        loadList();
    } else {
        showToast(result.message);
    }
}

function exportCSV(id) {
    window.open(`${API_BASE}/export/get?id=${id}`, '_blank');
}

async function deleteGroupBuy(id) {
    if (!confirm('确定要删除这个团购吗？所有接龙记录都会被删除，此操作不可恢复！')) {
        return;
    }

    const result = await apiDelete(`/delete?id=${id}`);
    if (result.code === 0) {
        showToast('删除成功！');
        loadList();
    } else {
        showToast(result.message);
    }
}

function init() {
    document.getElementById('editForm').addEventListener('submit', submitForm);

    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') {
            closeEditModal();
        }
    });

    loadList();
}

document.addEventListener('DOMContentLoaded', init);
