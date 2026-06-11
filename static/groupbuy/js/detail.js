let currentGroupBuy = null;
let countdownTimer = null;
let pollTimer = null;
let lastQuantity = 0;

function getGroupBuyId() {
    return getQueryParam('id');
}

async function loadDetail() {
    const id = getGroupBuyId();
    if (!id) {
        document.getElementById('detailContent').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <div class="empty-text">参数错误</div>
            </div>
        `;
        return;
    }

    const result = await apiGet(`/detail/get?id=${id}`);
    if (result.code === 0) {
        currentGroupBuy = result.data;
        lastQuantity = currentGroupBuy.total_quantity || 0;
        renderDetail();
    } else {
        document.getElementById('detailContent').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <div class="empty-text">${result.message}</div>
            </div>
        `;
    }
}

function renderDetail() {
    if (!currentGroupBuy) return;

    const gb = currentGroupBuy;
    const isActive = gb.status === 'active';
    const statusText = isActive ? '接龙中' : '已截单';
    const imageHtml = gb.image_url
        ? `<img src="${escapeHtml(gb.image_url)}" alt="">`
        : '🍎';

    const ordersHtml = (gb.orders || []).map(order => `
        <div class="order-item">
            <div class="order-left">
                <div class="order-building">
                    🏠 ${escapeHtml(order.building)}
                    ${order.room ? `<span class="room">${escapeHtml(order.room)}</span>` : ''}
                </div>
                <div class="order-phone">📱 ${formatPhone(order.phone)}</div>
            </div>
            <div class="order-right">
                <div class="order-quantity">${order.quantity}<span class="unit">份</span></div>
                <div class="order-amount">${formatPrice(order.amount)}</div>
            </div>
        </div>
    `).join('') || `
        <div class="empty-state" style="padding: 30px;">
            <div class="empty-icon" style="font-size: 40px;">🤷</div>
            <div class="empty-text" style="font-size: 14px;">还没有人接龙，快来第一个吧！</div>
        </div>
    `;

    document.getElementById('detailContent').innerHTML = `
        <div class="detail-container">
            <div class="detail-card">
                <div class="detail-image">
                    ${imageHtml}
                    <div class="detail-status ${gb.status}">${statusText}</div>
                </div>
                <div class="detail-body">
                    <div class="detail-title">${escapeHtml(gb.title)}</div>
                    ${gb.spec ? `<div class="detail-spec">📦 ${escapeHtml(gb.spec)}</div>` : ''}
                    <div class="detail-price">
                        <span class="price-unit">¥</span>${parseFloat(gb.price).toFixed(2)}
                        <span style="font-size: 16px; color: #999; font-weight: 500;">/份</span>
                    </div>
                    ${gb.description ? `<div class="detail-description">${escapeHtml(gb.description)}</div>` : ''}
                    
                    <div class="detail-info-grid">
                        <div class="info-box primary">
                            <div class="info-label">接龙份数</div>
                            <div class="info-value" id="displayQuantity">${gb.total_quantity || 0}<span class="info-unit">份</span></div>
                        </div>
                        <div class="info-box">
                            <div class="info-label">总金额</div>
                            <div class="info-value">¥${parseFloat(gb.total_amount || 0).toFixed(2)}</div>
                        </div>
                    </div>

                    <div class="detail-deadline" id="deadlineBox" data-deadline="${gb.deadline}">
                        📅 截单时间：<span class="deadline-time">${formatDateTime(gb.deadline)}</span>
                        <span id="countdownText">（计算中...）</span>
                    </div>
                </div>
                <div class="action-bar">
                    <button class="btn-jielong" ${isActive ? '' : 'disabled'} onclick="openOrderModal()">
                        ${isActive ? '🛒 我要接龙' : '已截单'}
                    </button>
                </div>
            </div>

            <div class="orders-section">
                <div class="section-title">
                    📋 接龙明细
                    <span class="badge">${gb.order_count || 0}人</span>
                </div>
                <div class="orders-list">
                    ${ordersHtml}
                </div>
            </div>
        </div>
    `;

    startCountdown();
}

function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);

    const update = () => {
        const box = document.getElementById('deadlineBox');
        const text = document.getElementById('countdownText');
        if (!box || !text) return;

        const deadline = box.dataset.deadline;
        const cd = getCountdown(deadline);

        if (cd.expired) {
            box.classList.add('urgent');
            text.textContent = '（已截止）';
        } else if (cd.urgent) {
            box.classList.add('urgent');
            text.textContent = `（还剩 ${cd.text}，马上截止！）`;
        } else {
            box.classList.remove('urgent');
            text.textContent = `（还剩 ${cd.text}）`;
        }
    };

    update();
    countdownTimer = setInterval(update, 1000);
}

function openOrderModal() {
    if (!currentGroupBuy || currentGroupBuy.status !== 'active') {
        showToast('该团购已截单');
        return;
    }
    document.getElementById('building').value = '';
    document.getElementById('room').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('quantity').value = '1';
    updateTotalPrice();
    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

function changeQuantity(delta) {
    const input = document.getElementById('quantity');
    let val = parseInt(input.value) || 1;
    val = Math.max(1, val + delta);
    input.value = val;
    updateTotalPrice();
}

function updateTotalPrice() {
    const qty = parseInt(document.getElementById('quantity').value) || 0;
    const price = parseFloat(currentGroupBuy?.price || 0);
    document.getElementById('totalPrice').textContent = formatPrice(qty * price);
}

async function submitOrder(e) {
    e.preventDefault();

    const building = document.getElementById('building').value.trim();
    const room = document.getElementById('room').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value) || 1;

    if (!building) {
        showToast('请填写楼栋号');
        return;
    }
    if (!phone || !/^1\d{10}$/.test(phone)) {
        showToast('请填写正确的手机号');
        return;
    }

    const result = await apiPost('/order', {
        group_buy_id: currentGroupBuy.id,
        building,
        room,
        phone,
        quantity
    });

    if (result.code === 0) {
        showToast('接龙成功！');
        closeOrderModal();
        currentGroupBuy = result.data;
        renderDetail();
    } else {
        showToast(result.message);
    }
}

async function pollUpdates() {
    if (!currentGroupBuy) return;
    const id = currentGroupBuy.id;
    const result = await apiGet(`/detail/get?id=${id}`);
    if (result.code === 0) {
        const newData = result.data;
        const newQty = newData.total_quantity || 0;

        if (newQty > lastQuantity) {
            const displayEl = document.getElementById('displayQuantity');
            if (displayEl) {
                displayEl.textContent = newQty;
                displayEl.style.transform = 'scale(1.3)';
                displayEl.style.transition = 'transform 0.3s';
                setTimeout(() => {
                    displayEl.style.transform = 'scale(1)';
                }, 300);
            }
        }
        lastQuantity = newQty;

        if (newData.order_count !== currentGroupBuy.order_count) {
            currentGroupBuy = newData;
            renderDetail();
        } else {
            currentGroupBuy = newData;
        }
    }
}

function init() {
    document.getElementById('orderForm').addEventListener('submit', submitOrder);
    document.getElementById('quantity').addEventListener('change', updateTotalPrice);

    document.getElementById('orderModal').addEventListener('click', (e) => {
        if (e.target.id === 'orderModal') {
            closeOrderModal();
        }
    });

    loadDetail();

    pollTimer = setInterval(pollUpdates, 3000);
}

document.addEventListener('DOMContentLoaded', init);
