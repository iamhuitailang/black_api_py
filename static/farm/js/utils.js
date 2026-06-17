const ORDER_STATUS_FLOW = ['pending_confirm', 'accepted', 'picking', 'delivering', 'delivered'];
const ORDER_STATUS_TEXT = {
    pending_confirm: '待确认',
    accepted: '已接单',
    picking: '采摘中',
    delivering: '配送中',
    delivered: '已送达',
    cancelled: '已取消'
};
const ORDER_STATUS_STEP_NAMES = ['待确认', '已接单', '采摘中', '配送中', '已送达'];

const CERT_TEXT = {
    organic: '有机认证',
    green: '绿色食品',
    pollution_free: '无公害',
    none: ''
};

const UNIT_TEXT = {
    jin: '元/斤',
    portion: '元/份'
};

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function formatDate(d) {
    if (!d) return '';
    return d.split('T')[0];
}

function renderStatusTag(status) {
    const cls = 'status-' + status;
    return `<span class="order-status ${cls}">${ORDER_STATUS_TEXT[status] || status}</span>`;
}

function renderCertBadge(cert) {
    if (!cert || cert === 'none') return '';
    return `<span class="leaf-badge">${CERT_TEXT[cert] || cert}</span>`;
}

function renderProgressSteps(status) {
    if (status === 'cancelled') {
        return `<div style="text-align:center;padding:20px;color:#c62828;font-weight:500;">订单已取消</div>`;
    }
    const curIdx = ORDER_STATUS_FLOW.indexOf(status);
    const percent = curIdx < 0 ? 0 : (curIdx / (ORDER_STATUS_FLOW.length - 1)) * 100;

    let html = `<div class="progress-steps">
        <div class="progress-bar" style="width:${percent}%"></div>`;
    ORDER_STATUS_STEP_NAMES.forEach((name, i) => {
        let cls = 'step';
        if (i < curIdx) cls += ' done';
        else if (i === curIdx) cls += ' active';
        html += `<div class="${cls}">
            <div class="step-circle">${i < curIdx ? '✓' : i + 1}</div>
            <div class="step-label">${name}</div>
        </div>`;
    });
    html += `</div>`;
    return html;
}

function renderProductCard(p) {
    const harvestDays = p.harvest_date ? Math.max(0, Math.ceil((new Date() - new Date(p.harvest_date)) / 86400000)) : 0;
    const freshnessText = harvestDays === 0 ? '今日采摘' : `${harvestDays}天前采摘`;
    return `
    <div class="product-card" onclick="viewProduct(${p.id})">
        <img class="product-image" src="${esc(p.image_url) || 'https://via.placeholder.com/280x200/e8dcc4/8b6f47?text=Fresh'}" alt="${esc(p.name)}" onerror="this.src='https://via.placeholder.com/280x200/e8dcc4/8b6f47?text=Fresh'">
        <div class="product-body">
            <div class="product-name">${esc(p.name)}</div>
            <div class="product-tags">
                ${renderCertBadge(p.certification)}
                <span class="tag tag-category">${esc(p.category)}</span>
            </div>
            <div class="product-freshness">
                🌾 ${freshnessText} · ${esc(p.harvest_date)}
            </div>
            <div class="product-desc">${esc(p.description || p.shop_name || '')}</div>
            <div class="product-footer">
                <div class="product-price">¥${p.price}<small>/${UNIT_TEXT[p.unit] || '元'}</small></div>
                <div class="product-stock">库存 ${p.stock || 0}</div>
            </div>
        </div>
    </div>`;
}

function renderOrderCard(o, isFarmer = false) {
    return `
    <div class="order-card">
        <div class="order-header">
            <div>
                <span class="order-no">订单号：${esc(o.order_no)}</span>
                <span style="margin-left:12px;font-size:13px;color:#666;">${esc(formatDate(o.created_at))}</span>
            </div>
            ${renderStatusTag(o.status)}
        </div>
        ${renderProgressSteps(o.status)}
        <div class="order-body">
            <img class="order-product-img" src="${esc(o.product_image) || 'https://via.placeholder.com/100/e8dcc4/8b6f47'}" alt="${esc(o.product_name)}" onerror="this.src='https://via.placeholder.com/100/e8dcc4/8b6f47'">
            <div class="order-info">
                <h4>${esc(o.product_name)}</h4>
                <p>单价：¥${o.unit_price} × ${o.quantity} ${o.unit === 'portion' ? '份' : '斤'}</p>
                ${isFarmer ? `<p>收货人：${esc(o.consumer_name)} · ${esc(o.consumer_phone)}</p><p>地址：${esc(o.delivery_address)}</p>` : `<p>店铺：${esc(o.shop_name || o.farmer_name || '')}</p>`}
                ${o.remark ? `<p>备注：${esc(o.remark)}</p>` : ''}
            </div>
            <div class="order-total">
                <div class="price">¥${o.total_price}</div>
            </div>
        </div>
        ${isFarmer && o.status !== 'delivered' && o.status !== 'cancelled' ? `
        <div class="order-actions">
            <button class="btn btn-primary btn-sm" onclick="advanceOrder(${o.id})">推进状态 →</button>
        </div>` : ''}
    </div>`;
}

function showModal(html, title = '') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal">
        ${title ? `<h3 class="modal-title">${title}</h3>` : ''}
        <div class="modal-body">${html}</div>
    </div>`;
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    return overlay;
}

function closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
}
