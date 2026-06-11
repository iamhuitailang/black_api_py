const API_BASE = '/api/groupbuy';

async function apiGet(url) {
    try {
        const res = await fetch(API_BASE + url);
        const data = await res.json();
        return data;
    } catch (e) {
        return { code: 1, message: '网络错误，请稍后重试', data: null };
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
        return { code: 1, message: '网络错误，请稍后重试', data: null };
    }
}

async function apiDelete(url) {
    try {
        const res = await fetch(API_BASE + url, { method: 'DELETE' });
        const data = await res.json();
        return data;
    } catch (e) {
        return { code: 1, message: '网络错误，请稍后重试', data: null };
    }
}

function showToast(message, duration = 2000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

function formatPrice(price) {
    return `¥${parseFloat(price || 0).toFixed(2)}`;
}

function formatPhone(phone) {
    if (!phone) return '';
    if (phone.length === 11) {
        return phone.slice(0, 3) + '****' + phone.slice(7);
    }
    return phone;
}

function getCountdown(deadlineStr) {
    const deadline = new Date(deadlineStr).getTime();
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) {
        return { expired: true, text: '已截止', days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let text = '';
    if (days > 0) {
        text = `${days}天${hours}小时${minutes}分`;
    } else if (hours > 0) {
        text = `${hours}小时${minutes}分${seconds}秒`;
    } else {
        text = `${minutes}分${seconds}秒`;
    }

    const urgent = diff < 1000 * 60 * 60;

    return { expired: false, text, days, hours, minutes, seconds, urgent };
}

function formatDateTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}
