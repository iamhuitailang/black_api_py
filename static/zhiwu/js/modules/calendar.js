(function(global) {
    'use strict';

    const Calendar = {
        canvas: null,
        ctx: null,
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth(),
        onDateSelect: null,
        selectedDate: null,

        init: function(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return false;

            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.bindEvents();

            return true;
        },

        resize: function() {
            if (!this.canvas) return;

            const container = this.canvas.parentElement;
            const width = container.clientWidth;
            const height = Math.min(width * 0.8, 450);

            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';

            this.ctx.scale(dpr, dpr);
        },

        bindEvents: function() {
            if (!this.canvas) return;

            this.canvas.addEventListener('click', (e) => this.handleClick(e));

            window.addEventListener('resize', () => {
                this.resize();
                this.render();
            });
        },

        handleClick: function(e) {
            if (!this.ctx) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const dayCell = this.getDayCellAtPosition(x, y);
            if (dayCell && dayCell.date) {
                this.selectedDate = dayCell.date;
                if (this.onDateSelect) {
                    this.onDateSelect(dayCell.date, dayCell.plants);
                }
                this.render();
            }
        },

        getDayCellAtPosition: function(x, y) {
            if (!this.canvas) return null;

            const width = this.canvas.clientWidth;
            const height = this.canvas.clientHeight;

            const headerHeight = height * 0.15;
            const weekDayHeight = height * 0.08;
            const gridTop = headerHeight + weekDayHeight;
            const gridHeight = height - gridTop;
            const cellWidth = width / 7;
            const cellHeight = gridHeight / 6;

            if (y < gridTop) return null;

            const col = Math.floor(x / cellWidth);
            const row = Math.floor((y - gridTop) / cellHeight);

            const firstDay = new Date(this.currentYear, this.currentMonth, 1);
            const startDay = (firstDay.getDay() + 6) % 7;
            const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

            const dayIndex = row * 7 + col - startDay;

            if (dayIndex < 0 || dayIndex >= daysInMonth) {
                return null;
            }

            const date = new Date(this.currentYear, this.currentMonth, dayIndex + 1);
            const plants = this.getPlantsForDate(date);

            return {
                date: date,
                plants: plants,
                col: col,
                row: row,
                cellX: col * cellWidth,
                cellY: gridTop + row * cellHeight,
                cellWidth: cellWidth,
                cellHeight: cellHeight
            };
        },

        getPlantsForDate: function(date) {
            const plants = StorageModule ? StorageModule.getPlants() : [];
            const result = [];

            for (const plant of plants) {
                const nextWatering = ScheduleModule ? 
                    ScheduleModule.calculateNextWatering(plant, date) : null;

                if (nextWatering && ScheduleModule.isSameDay(nextWatering, date)) {
                    result.push(plant);
                }
            }

            return result;
        },

        setMonth: function(year, month) {
            this.currentYear = year;
            this.currentMonth = month;
            this.render();
        },

        prevMonth: function() {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.render();
        },

        nextMonth: function() {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.render();
        },

        goToToday: function() {
            const today = new Date();
            this.currentYear = today.getFullYear();
            this.currentMonth = today.getMonth();
            this.selectedDate = today;
            this.render();
        },

        getMonthName: function() {
            const months = ['一月', '二月', '三月', '四月', '五月', '六月',
                           '七月', '八月', '九月', '十月', '十一月', '十二月'];
            return `${this.currentYear}年 ${months[this.currentMonth]}`;
        },

        render: function() {
            if (!this.ctx || !this.canvas) return;

            const width = this.canvas.clientWidth;
            const height = this.canvas.clientHeight;

            this.ctx.clearRect(0, 0, width, height);

            this.drawBackground(width, height);
            this.drawHeader(width, height);
            this.drawWeekDays(width, height);
            this.drawDays(width, height);
        },

        drawBackground: function(width, height) {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#f5fdf5');
            gradient.addColorStop(1, '#e8f5e9');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.roundRect(0, 0, width, height, 16);
            this.ctx.fill();
        },

        drawHeader: function(width, height) {
            const headerHeight = height * 0.15;

            this.ctx.fillStyle = '#2E7D32';
            this.ctx.font = `bold ${Math.min(width * 0.05, 20)}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.getMonthName(), width / 2, headerHeight / 2);
        },

        drawWeekDays: function(width, height) {
            const headerHeight = height * 0.15;
            const weekDayHeight = height * 0.08;
            const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
            const cellWidth = width / 7;

            for (let i = 0; i < 7; i++) {
                const x = i * cellWidth + cellWidth / 2;
                const y = headerHeight + weekDayHeight / 2;

                this.ctx.fillStyle = (i >= 5) ? '#EF5350' : '#558B2F';
                this.ctx.font = `600 ${Math.min(width * 0.035, 14)}px sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(weekDays[i], x, y);
            }
        },

        drawDays: function(width, height) {
            const headerHeight = height * 0.15;
            const weekDayHeight = height * 0.08;
            const gridTop = headerHeight + weekDayHeight;
            const gridHeight = height - gridTop;
            const cellWidth = width / 7;
            const cellHeight = gridHeight / 6;

            const firstDay = new Date(this.currentYear, this.currentMonth, 1);
            const startDay = (firstDay.getDay() + 6) % 7;
            const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < daysInMonth; i++) {
                const date = new Date(this.currentYear, this.currentMonth, i + 1);
                const dayNum = i + 1;
                const col = (startDay + i) % 7;
                const row = Math.floor((startDay + i) / 7);

                const x = col * cellWidth;
                const y = gridTop + row * cellHeight;

                const plants = this.getPlantsForDate(date);
                const isToday = ScheduleModule.isSameDay(date, today);
                const isSelected = this.selectedDate && ScheduleModule.isSameDay(date, this.selectedDate);
                const isWeekend = col >= 5;

                this.drawDayCell(x, y, cellWidth, cellHeight, dayNum, plants, isToday, isSelected, isWeekend);
            }
        },

        drawDayCell: function(x, y, width, height, dayNum, plants, isToday, isSelected, isWeekend) {
            const padding = 4;

            if (isSelected) {
                this.ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
                this.ctx.beginPath();
                this.ctx.roundRect(x + padding / 2, y + padding / 2, 
                                   width - padding, height - padding, 8);
                this.ctx.fill();
            }

            if (isToday) {
                this.ctx.strokeStyle = '#4CAF50';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.roundRect(x + padding / 2, y + padding / 2, 
                                   width - padding, height - padding, 8);
                this.ctx.stroke();
            }

            let textColor = '#333';
            if (isWeekend) textColor = '#EF5350';
            if (isToday) textColor = '#2E7D32';

            const fontSize = Math.min(width * 0.18, 16);
            this.ctx.fillStyle = textColor;
            this.ctx.font = (isToday ? 'bold ' : 'normal ') + fontSize + 'px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';

            if (isToday) {
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.beginPath();
                this.ctx.arc(x + width / 2, y + padding + fontSize / 2 + 2, 
                             fontSize / 2 + 6, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#fff';
            }

            this.ctx.fillText(dayNum.toString(), x + width / 2, y + padding);

            if (plants.length > 0) {
                this.drawPlantIndicators(x, y, width, height, plants, isToday);
            }
        },

        drawPlantIndicators: function(x, y, width, height, plants, isToday) {
            const maxIndicators = 3;
            const indicatorSize = Math.min(width * 0.18, 12);
            const spacing = indicatorSize + 2;
            const totalWidth = Math.min(plants.length, maxIndicators) * spacing - 2;
            const startX = x + (width - totalWidth) / 2;
            const startY = y + height - indicatorSize - 6;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < Math.min(plants.length, maxIndicators); i++) {
                const plant = plants[i];
                const level = ScheduleModule.getWarningLevel(plant);

                let color = '#81C784';
                if (level === 'today') color = '#FFB74D';
                else if (level === 'warning') color = '#FF8A65';
                else if (level === 'danger') color = '#EF5350';

                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(startX + i * spacing + indicatorSize / 2, 
                            startY + indicatorSize / 2, 
                            indicatorSize / 2, 0, Math.PI * 2);
                this.ctx.fill();

                if (isToday && i === 0) {
                    const icon = IconsModule ? IconsModule.getIconById(plant.iconId) : null;
                    if (icon) {
                        this.ctx.font = `${indicatorSize}px sans-serif`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(icon.emoji, 
                                         startX + i * spacing + indicatorSize / 2,
                                         startY + indicatorSize / 2);
                    }
                }
            }

            if (plants.length > maxIndicators) {
                const moreText = '+' + (plants.length - maxIndicators);
                this.ctx.fillStyle = '#666';
                this.ctx.font = `${indicatorSize * 0.8}px sans-serif`;
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(moreText, 
                                 startX + maxIndicators * spacing,
                                 startY + indicatorSize / 2);
            }
        }
    };

    global.CalendarModule = Calendar;
})(window);
