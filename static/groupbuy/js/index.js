let currentTab = 'active';
let groupBuys = [];
let countdownTimers = [];
let pollTimer = null;
let lastOrderCounts = {};

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    renderList();
}

async function loadList() {
    const result = await apiGet('/list/get');
    if (result.code === 0) {
        const allItems = result.data.items || [];

        const activeCount = allItems.filter(i => i.status === 'active').length;
        const closedCount = allItems.filter(i => i.status === 'closed').length;
        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('closedCount').textContent = closedCount;

        groupBuys = allItems.filter(i => i.status === currentTab);

        groupBuys.forEach(gb => {
            lastOrderCounts[gb.id] = gb.total_quantity || 0;
        });

        renderList();
    }
}

function renderList() {
    const container = document.getElementById('groupBuyList');

    if (groupBuys.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <div class="empty-text">${currentTab === 'active' ? '暂无进行中的团购' : '暂无已截单的团购'}</div>
            </div>
        `;
        return;
    }

    countdownTimers.forEach(t => clearInterval(t));
    countdownTimers = [];

    container.innerHTML = groupBuys.map(gb => renderCard(gb)).join('');

    container.querySelectorAll('.group-buy-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            window.location.href = `detail.html?id=${id}`;
        });
    });

    startCountdowns();
}

function renderCard(gb) {
    const statusText = gb.status === 'active' ? '接龙中' : '已截单';
    const imageHtml = gb.image_url
        ? `<img src="${escapeHtml(gb.image_url)}" alt="">`
        : '🍎';

    return `
        <div class="group-buy-card ${gb.status}" data-id="${gb.id}">
            <div class="card-image">
                ${imageHtml}
                <div class="card-status-tag ${gb.status}">${statusText}</div>
            </div>
            <div class="card-body">
                <div class="card-title">${escapeHtml(gb.title)}</div>
                ${gb.spec ? `<div class="card-spec">📦 ${escapeHtml(gb.spec)}</div>` : ''}
                <div class="card-price">
                    <span class="price-unit">¥</span>${parseFloat(gb.price).toFixed(2)}
                    <span class="price-label">/份</span>
                </div>
                <div class="card-info-row">
                    <div class="card-countdown ${gb.status === 'active' ? '' : ''}" data-deadline="${gb.deadline}">
                        ⏰ <span class="countdown-text">计算中...</span>
                    </div>
                    <div class="card-orders">
                        👥 <span class="order-number" data-id="${gb.id}">${gb.total_quantity || 0}</span> 份
                    </div>
                </div>
            </div>
        </div>
    `;
}

function startCountdowns() {
    document.querySelectorAll('.card-countdown').forEach(el => {
        const deadline = el.dataset.deadline;
        if (!deadline) return;

        const updateCountdown = () => {
            const cd = getCountdown(deadline);
            if (cd.expired) {
                el.innerHTML = '⏰ <span class="countdown-box">已截止</span>';
                return;
            }
            if (cd.urgent) {
                el.classList.add('urgent');
                el.innerHTML = `⏰ 还剩 <span class="countdown-box">${cd.text}</span>`;
            } else {
                el.classList.remove('urgent');
                el.innerHTML = `⏰ 还剩 <span class="countdown-box">${cd.text}</span>`;
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        countdownTimers.push(timer);
    });
}

function animateOrderCount(id, newCount) {
    const el = document.querySelector(`.order-number[data-id="${id}"]`);
    if (!el) return;

    const oldCount = lastOrderCounts[id] || 0;
    if (newCount > oldCount) {
        el.textContent = newCount;
        el.classList.add('bump');
        setTimeout(() => el.classList.remove('bump'), 300);
    }
    lastOrderCounts[id] = newCount;
}

async function pollUpdates() {
    const result = await apiGet('/list/get');
    if (result.code === 0) {
        const allItems = result.data.items || [];

        const activeCount = allItems.filter(i => i.status === 'active').length;
        const closedCount = allItems.filter(i => i.status === 'closed').length;
        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('closedCount').textContent = closedCount;

        allItems.forEach(gb => {
            animateOrderCount(gb.id, gb.total_quantity || 0);
        });

        const currentItems = allItems.filter(i => i.status === currentTab);
        const currentIds = currentItems.map(i => i.id).sort().join(',');
        const oldIds = groupBuys.map(i => i.id).sort().join(',');

        if (currentIds !== oldIds) {
            groupBuys = currentItems;
            renderList();
        } else {
            groupBuys = currentItems;
        }
    }
}

function init() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    loadList();

    pollTimer = setInterval(pollUpdates, 5000);
}

document.addEventListener('DOMContentLoaded', init);
