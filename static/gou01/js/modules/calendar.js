const Calendar = {
    currentDate: new Date(),
    selectedDate: null,

    weekDays: ['日', '一', '二', '三', '四', '五', '六'],

    init() {
    },

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        return `
            <div class="bone-card">
                <div class="calendar">
                    <div class="calendar-header">
                        <button class="calendar-nav" onclick="Calendar.prevMonth()">◀</button>
                        <h2 class="calendar-title">${year}年${month + 1}月</h2>
                        <button class="calendar-nav" onclick="Calendar.nextMonth()">▶</button>
                    </div>
                    
                    <div class="calendar-grid">
                        ${this.weekDays.map(day => `
                            <div class="calendar-day-header">${day}</div>
                        `).join('')}
                        ${this.renderCalendarDays(year, month)}
                    </div>
                </div>
            </div>

            ${this.selectedDate ? this.renderDayDetails() : `
                <div class="bone-card">
                    <div class="empty-state">
                        <div class="icon">📅</div>
                        <p>点击日期查看当天的遛狗记录</p>
                    </div>
                </div>
            `}
        `;
    },

    renderCalendarDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        
        let html = '';
        
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const checkins = Storage.getCheckinsByDate(dateStr);
            const isToday = isCurrentMonth && today.getDate() === day;
            const hasCheckins = checkins.length > 0;
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${hasCheckins ? 'checked' : ''}"
                     onclick="Calendar.selectDate('${dateStr}')">
                    <span>${day}</span>
                    ${hasCheckins ? '<span class="check-dot"></span>' : ''}
                </div>
            `;
        }
        
        return html;
    },

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        App.renderPage('calendar');
    },

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        App.renderPage('calendar');
    },

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        App.renderPage('calendar');
    },

    renderDayDetails() {
        const checkins = Storage.getCheckinsByDate(this.selectedDate);
        const date = new Date(this.selectedDate);
        const dateStr = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        return `
            <div class="bone-card">
                <h3 style="margin-bottom: 15px;">📅 ${dateStr}</h3>
                ${checkins.length === 0 ? `
                    <div class="empty-state">
                        <div class="icon">😢</div>
                        <p>这一天没有遛狗记录</p>
                    </div>
                ` : `
                    <div style="margin-bottom: 15px;">
                        <strong>遛狗次数：</strong> ${checkins.length} 次<br>
                        <strong>总时长：</strong> ${checkins.reduce((sum, c) => sum + c.duration, 0)} 分钟
                    </div>
                    ${checkins.map(c => Checkin.renderCheckinItem(c)).join('')}
                `}
            </div>
        `;
    }
};