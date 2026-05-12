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