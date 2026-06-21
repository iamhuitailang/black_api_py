class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.viewMode = 'month';
        this.activities = [];
        this.filterType = '';
        this.filterDept = '';
        this.init();
    }

    init() {
        this.renderWeekdays();
        this.updateTitle();
        this.bindEvents();
        this.loadActivities();
        this.loadDepartments();
    }

    renderWeekdays() {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const container = document.getElementById('weekdays');
        container.innerHTML = weekdays.map(d => `<div>${d}</div>`).join('');
    }

    updateTitle() {
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth() + 1;
        document.getElementById('currentDate').textContent =
            this.viewMode === 'month' ? `${y}年${m}月` : `${y}年${m}月 第${this.getWeekNumber()}周`;
    }

    getWeekNumber() {
        const d = new Date(this.currentDate);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    bindEvents() {
        document.getElementById('prevMonth').onclick = () => this.shift(-1);
        document.getElementById('nextMonth').onclick = () => this.shift(1);
        document.getElementById('todayBtn').onclick = () => {
            this.currentDate = new Date();
            this.render();
            this.updateTitle();
            this.loadActivities();
        };
        document.getElementById('viewToggle').onclick = () => {
            this.viewMode = this.viewMode === 'month' ? 'week' : 'month';
            document.getElementById('viewToggle').textContent =
                this.viewMode === 'month' ? '周视图' : '月视图';
            this.render();
            this.updateTitle();
        };
        document.getElementById('filterType').onchange = (e) => {
            this.filterType = e.target.value;
            this.render();
        };
        document.getElementById('filterDept').onchange = (e) => {
            this.filterDept = e.target.value;
            this.render();
        };
    }

    shift(dir) {
        if (this.viewMode === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + dir);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + dir * 7);
        }
        this.render();
        this.updateTitle();
        this.loadActivities();
    }

    async loadDepartments() {
        const res = await API.student.list();
        if (res.code === 0) {
            const depts = [...new Set(res.data.map(s => s.department).filter(Boolean))];
            const sel = document.getElementById('filterDept');
            depts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d;
                sel.appendChild(opt);
            });
        }
    }

    async loadActivities() {
        let start, end;
        if (this.viewMode === 'month') {
            const y = this.currentDate.getFullYear();
            const m = this.currentDate.getMonth();
            start = new Date(y, m, 1).toISOString();
            end = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
        } else {
            const d = new Date(this.currentDate);
            const day = d.getDay();
            d.setDate(d.getDate() - day);
            start = new Date(d).toISOString();
            d.setDate(d.getDate() + 6);
            d.setHours(23, 59, 59);
            end = d.toISOString();
        }
        const res = await API.calendar.get({ start, end });
        if (res.code === 0) {
            this.activities = res.data;
            this.render();
        }
    }

    getFilteredActivities() {
        return this.activities.filter(a => {
            if (this.filterType && a.type !== this.filterType) return false;
            if (this.filterDept && a.organizer_department !== this.filterDept) return false;
            return true;
        });
    }

    render() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        grid.classList.toggle('week-view', this.viewMode === 'week');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activities = this.getFilteredActivities();

        if (this.viewMode === 'month') {
            this.renderMonth(grid, today, activities);
        } else {
            this.renderWeek(grid, today, activities);
        }
    }

    renderMonth(grid, today, activities) {
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth();
        const firstDay = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const daysInPrev = new Date(y, m, 0).getDate();

        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

        for (let i = 0; i < totalCells; i++) {
            let dayNum, cellDate, isOther = false;
            if (i < firstDay) {
                dayNum = daysInPrev - firstDay + i + 1;
                cellDate = new Date(y, m - 1, dayNum);
                isOther = true;
            } else if (i >= firstDay + daysInMonth) {
                dayNum = i - firstDay - daysInMonth + 1;
                cellDate = new Date(y, m + 1, dayNum);
                isOther = true;
            } else {
                dayNum = i - firstDay + 1;
                cellDate = new Date(y, m, dayNum);
            }

            const isToday = cellDate.getTime() === today.getTime();
            const dayActs = activities.filter(a => {
                const st = new Date(a.start_time);
                const dayStart = new Date(cellDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(cellDate);
                dayEnd.setHours(23, 59, 59, 999);
                return st >= dayStart && st <= dayEnd;
            });

            const cell = document.createElement('div');
            cell.className = 'calendar-cell' + (isOther ? ' other-month' : '') + (isToday ? ' today' : '');
            cell.innerHTML = `
                <div class="cell-date">${dayNum}</div>
                <div class="cell-events">
                    ${dayActs.slice(0, 3).map(a => `
                        <div class="event-chip type-${a.type}" data-id="${a.id}">
                            ${this.formatTime(a.start_time)} ${this.escape(a.name)}
                        </div>
                    `).join('')}
                    ${dayActs.length > 3 ? `<div class="event-chip" style="background:#94a3b8">+${dayActs.length - 3} 更多</div>` : ''}
                </div>
            `;
            cell.querySelectorAll('.event-chip[data-id]').forEach(chip => {
                chip.onclick = (e) => {
                    e.stopPropagation();
                    App.showActivityDetail(parseInt(chip.dataset.id));
                };
            });
            cell.onclick = () => {
                if (dayActs.length === 1) {
                    App.showActivityDetail(dayActs[0].id);
                }
            };
            grid.appendChild(cell);
        }
    }

    renderWeek(grid, today, activities) {
        const d = new Date(this.currentDate);
        const day = d.getDay();
        d.setDate(d.getDate() - day);

        for (let i = 0; i < 7; i++) {
            const cellDate = new Date(d);
            cellDate.setDate(d.getDate() + i);

            const isToday = cellDate.getTime() === today.getTime();
            const dayActs = activities.filter(a => {
                const st = new Date(a.start_time);
                const dayStart = new Date(cellDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(cellDate);
                dayEnd.setHours(23, 59, 59, 999);
                return st >= dayStart && st <= dayEnd;
            });

            const cell = document.createElement('div');
            cell.className = 'calendar-cell week-view' + (isToday ? ' today' : '');
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

            const hours = [];
            for (let h = 8; h <= 21; h++) {
                const hourActs = dayActs.filter(a => {
                    const st = new Date(a.start_time);
                    return st.getHours() === h;
                });
                hours.push(`
                    <div class="week-hour">
                        <span class="hour-label">${h}:00</span>
                        <div class="hour-events">
                            ${hourActs.map(a => `
                                <div class="event-chip type-${a.type}" data-id="${a.id}">
                                    ${this.formatTime(a.start_time)} ${this.escape(a.name)}
                                    <small>@${this.escape(a.venue_name || '')}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `);
            }

            cell.innerHTML = `
                <div class="cell-date">${cellDate.getMonth() + 1}/${cellDate.getDate()} 周${weekdays[cellDate.getDay()]}</div>
                <div class="cell-events" style="gap:2px">
                    ${hours.join('')}
                </div>
            `;
            cell.querySelectorAll('.event-chip[data-id]').forEach(chip => {
                chip.onclick = (e) => {
                    e.stopPropagation();
                    App.showActivityDetail(parseInt(chip.dataset.id));
                };
            });
            grid.appendChild(cell);
        }
    }

    formatTime(iso) {
        const d = new Date(iso);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    escape(s) {
        if (!s) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }
}
