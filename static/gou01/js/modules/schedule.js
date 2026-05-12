const Schedule = {
    schedule: null,

    slotKeys: ['morning', 'noon', 'evening', 'night'],

    init() {
        this.schedule = Storage.loadSchedule();
    },

    render() {
        return `
            <div class="bone-card">
                <h2 style="margin-bottom: 20px;">⏰ 遛狗时间设置</h2>
                <p style="color: var(--text-light); margin-bottom: 20px;">
                    为狗狗规划每天的遛狗时间，到点会收到提醒通知哦！
                </p>
                <div class="grid-2">
                    ${this.slotKeys.map(key => this.renderTimeSlot(key)).join('')}
                </div>
                <br>
                <button class="bone-btn" onclick="Schedule.saveSchedule()">💾 保存设置</button>
            </div>
            
            <div class="bone-card">
                <h3 style="margin-bottom: 15px;">🔔 提醒通知</h3>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span>启用浏览器通知提醒</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="notificationEnabled" 
                               ${Notification.permission === 'granted' ? 'checked' : ''}
                               onchange="Schedule.toggleNotification(this)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <p style="color: var(--text-light); font-size: 0.9rem; margin-top: 10px;">
                    启用后，到遛狗时间会收到浏览器通知
                </p>
            </div>
        `;
    },

    renderTimeSlot(key) {
        const slot = this.schedule[key];
        return `
            <div class="time-slot ${key}">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                    <span class="time-icon">${slot.icon}</span>
                    <label class="toggle-switch">
                        <input type="checkbox" class="slot-enabled" data-slot="${key}" 
                               ${slot.enabled ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="time-name">${slot.name}</div>
                <div class="form-group" style="margin-top: 15px;">
                    <label class="form-label" style="font-size: 0.9rem;">⏰ 时间</label>
                    <input type="time" class="form-input slot-time" data-slot="${key}" 
                           value="${slot.time}">
                </div>
                <div class="form-group">
                    <label class="form-label" style="font-size: 0.9rem;">⏱️ 预计时长（分钟）</label>
                    <input type="number" class="form-input slot-duration" data-slot="${key}" 
                           value="${slot.duration}" min="5" max="120">
                </div>
            </div>
        `;
    },

    saveSchedule() {
        document.querySelectorAll('.slot-enabled').forEach(input => {
            const key = input.dataset.slot;
            this.schedule[key].enabled = input.checked;
        });

        document.querySelectorAll('.slot-time').forEach(input => {
            const key = input.dataset.slot;
            this.schedule[key].time = input.value;
        });

        document.querySelectorAll('.slot-duration').forEach(input => {
            const key = input.dataset.slot;
            this.schedule[key].duration = parseInt(input.value) || 15;
        });

        Storage.saveSchedule(this.schedule);
        App.showNotification('遛狗时间设置已保存！⏰');
        
        if (window.NotificationManager) {
            NotificationManager.updateAlarms();
        }
    },

    toggleNotification(checkbox) {
        if (checkbox.checked) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    App.showNotification('通知已启用！🔔');
                    if (window.NotificationManager) {
                        NotificationManager.updateAlarms();
                    }
                } else {
                    checkbox.checked = false;
                    App.showNotification('请在浏览器设置中允许通知', 'error');
                }
            });
        } else {
            App.showNotification('通知已关闭');
        }
    }
};