function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr2 = formatDate(d);
    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);

    if (dateStr2 === todayStr) {
        return '今天';
    } else if (dateStr2 === tomorrowStr) {
        return '明天';
    }

    const month = d.getMonth();
    const day = d.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month + 1}月${day}日 ${weekDays[d.getDay()]}`;
}

function formatPrice(price) {
    return `¥${parseFloat(price).toFixed(2)}`;
}

function getMealTypeName(type) {
    const names = {
        'breakfast': '早餐',
        'lunch': '午餐',
        'dinner': '晚餐'
    };
    return names[type] || type;
}

function getStatusName(status) {
    const names = {
        'pending': '待取餐',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    return names[status] || status;
}