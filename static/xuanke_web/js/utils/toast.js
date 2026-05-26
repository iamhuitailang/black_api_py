const Toast = {
    success(message, duration = 2000) {
        ElementPlus.ElMessage({
            message: message,
            type: 'success',
            duration: duration
        });
    },

    error(message, duration = 3000) {
        ElementPlus.ElMessage({
            message: message,
            type: 'error',
            duration: duration
        });
    },

    warning(message, duration = 2000) {
        ElementPlus.ElMessage({
            message: message,
            type: 'warning',
            duration: duration
        });
    },

    info(message, duration = 2000) {
        ElementPlus.ElMessage({
            message: message,
            type: 'info',
            duration: duration
        });
    },

    confirm(message, title = '确认', type = 'warning') {
        return ElementPlus.ElMessageBox.confirm(message, title, {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: type
        });
    }
};
