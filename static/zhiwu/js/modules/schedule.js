(function(global) {
    'use strict';

    const Schedule = {
        isToday: function(date) {
            const today = new Date();
            return date.getDate() === today.getDate() &&
                   date.getMonth() === today.getMonth() &&
                   date.getFullYear() === today.getFullYear();
        },

        isSameDay: function(date1, date2) {
            return date1.getDate() === date2.getDate() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getFullYear() === date2.getFullYear();
        },

        isDatePassed: function(date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            return checkDate < today;
        },

        getDaysSinceLastWatering: function(plant) {
            if (!plant.lastWatered) return Infinity;
            const lastWatered = new Date(plant.lastWatered);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            lastWatered.setHours(0, 0, 0, 0);
            const diffTime = today - lastWatered;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        },

        calculateNextWatering: function(plant, fromDate = new Date()) {
            const waterType = plant.waterType;
            const settings = plant.waterSettings || {};
            const startDate = new Date(fromDate);
            startDate.setHours(0, 0, 0, 0);

            if (!plant.lastWatered) {
                return this.calculateFirstWatering(plant, startDate);
            }

            const lastWatered = new Date(plant.lastWatered);
            lastWatered.setHours(0, 0, 0, 0);

            let nextDate = new Date(lastWatered);

            switch (waterType) {
                case 'daily':
                    nextDate.setDate(nextDate.getDate() + 1);
                    break;

                case 'every_n_days':
                    nextDate.setDate(nextDate.getDate() + (settings.days || 3));
                    break;

                case 'weekly_days':
                    nextDate = this.getNextWeeklyDay(lastWatered, settings.days || [1, 3]);
                    break;

                case 'every_n_weeks':
                    nextDate.setDate(nextDate.getDate() + (settings.weeks || 2) * 7);
                    break;

                case 'monthly_days':
                    nextDate = this.getNextMonthlyDay(lastWatered, settings.days || [1, 15]);
                    break;

                default:
                    nextDate.setDate(nextDate.getDate() + 7);
            }

            while (nextDate < startDate) {
                nextDate = this.calculateNextWatering(plant, new Date(nextDate.getTime() + 86400000));
            }

            return nextDate;
        },

        calculateFirstWatering: function(plant, startDate) {
            const waterType = plant.waterType;
            const settings = plant.waterSettings || {};

            switch (waterType) {
                case 'daily':
                    return startDate;

                case 'every_n_days':
                    return startDate;

                case 'weekly_days':
                    return this.getNextWeeklyDay(startDate, settings.days || [1, 3], true);

                case 'every_n_weeks':
                    const weekDay = settings.weekday || 1;
                    let firstDate = new Date(startDate);
                    const currentDay = firstDate.getDay();
                    const targetDay = weekDay % 7;
                    const diff = (targetDay - currentDay + 7) % 7;
                    firstDate.setDate(firstDate.getDate() + diff);
                    if (firstDate < startDate) {
                        firstDate.setDate(firstDate.getDate() + 7);
                    }
                    return firstDate;

                case 'monthly_days':
                    return this.getNextMonthlyDay(startDate, settings.days || [1, 15], true);

                default:
                    return startDate;
            }
        },

        getNextWeeklyDay: function(fromDate, weekDays, includeToday = false) {
            const startDate = new Date(fromDate);
            startDate.setHours(0, 0, 0, 0);

            let checkDate = new Date(startDate);
            if (!includeToday) {
                checkDate.setDate(checkDate.getDate() + 1);
            }

            for (let i = 0; i < 14; i++) {
                const dayOfWeek = checkDate.getDay();
                if (weekDays.includes(dayOfWeek)) {
                    return new Date(checkDate);
                }
                checkDate.setDate(checkDate.getDate() + 1);
            }

            return checkDate;
        },

        getNextMonthlyDay: function(fromDate, monthDays, includeToday = false) {
            const startDate = new Date(fromDate);
            startDate.setHours(0, 0, 0, 0);

            const currentMonth = startDate.getMonth();
            const currentYear = startDate.getFullYear();
            const currentDay = startDate.getDate();

            const sortedDays = [...monthDays].sort((a, b) => a - b);

            let nextDay = null;

            for (const day of sortedDays) {
                if ((includeToday && day >= currentDay) || day > currentDay) {
                    nextDay = day;
                    break;
                }
            }

            if (nextDay) {
                const nextDate = new Date(currentYear, currentMonth, nextDay);
                if (nextDate >= startDate || includeToday) {
                    return nextDate;
                }
            }

            const firstDay = sortedDays[0];
            let nextMonth = currentMonth + 1;
            let nextYear = currentYear;

            if (nextMonth > 11) {
                nextMonth = 0;
                nextYear++;
            }

            return new Date(nextYear, nextMonth, firstDay);
        },

        shouldWaterToday: function(plant) {
            const nextWatering = this.calculateNextWatering(plant);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            nextWatering.setHours(0, 0, 0, 0);
            return this.isSameDay(nextWatering, today);
        },

        isOverdue: function(plant) {
            const nextWatering = this.calculateNextWatering(plant);
            return this.isDatePassed(nextWatering);
        },

        getOverdueDays: function(plant) {
            const nextWatering = this.calculateNextWatering(plant);
            if (!this.isDatePassed(nextWatering)) return 0;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            nextWatering.setHours(0, 0, 0, 0);

            const diffTime = today - nextWatering;
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        },

        getWateringDatesForMonth: function(plant, year, month) {
            const dates = [];
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            let currentDate = new Date(firstDay);

            if (!plant.lastWatered) {
                let firstWatering = this.calculateFirstWatering(plant, currentDate);
                if (firstWatering >= firstDay && firstWatering <= lastDay) {
                    dates.push(new Date(firstWatering));
                }

                for (let i = 0; i < 60; i++) {
                    currentDate = new Date(firstWatering);
                    currentDate.setDate(currentDate.getDate() + 1);
                    const nextDate = this.calculateNextWatering({
                        ...plant,
                        lastWatered: firstWatering.toISOString()
                    }, currentDate);

                    if (nextDate > lastDay) break;
                    if (nextDate >= firstDay && nextDate <= lastDay) {
                        dates.push(new Date(nextDate));
                    }
                    firstWatering = nextDate;
                }

                return dates;
            }

            const history = StorageModule ? StorageModule.getPlantHistory(plant.id) : [];

            for (const record of history) {
                const recordDate = new Date(record.date);
                if (recordDate >= firstDay && recordDate <= lastDay) {
                    dates.push(new Date(recordDate));
                }
            }

            let lastDate = plant.lastWatered ? new Date(plant.lastWatered) : new Date(firstDay);
            lastDate.setHours(0, 0, 0, 0);

            for (let i = 0; i < 60; i++) {
                const nextDate = this.calculateNextWatering({
                    ...plant,
                    lastWatered: lastDate.toISOString()
                }, new Date(lastDate.getTime() + 86400000));

                if (nextDate > lastDay) break;
                if (nextDate >= firstDay) {
                    dates.push(new Date(nextDate));
                }
                lastDate = nextDate;
            }

            const uniqueDates = [];
            const seen = new Set();
            for (const d of dates) {
                const key = d.toDateString();
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueDates.push(d);
                }
            }

            return uniqueDates.sort((a, b) => a - b);
        },

        getPlantsNeedingWaterToday: function(plants) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return plants.filter(plant => {
                const nextWatering = this.calculateNextWatering(plant);
                nextWatering.setHours(0, 0, 0, 0);
                return this.isSameDay(nextWatering, today) || this.isOverdue(plant);
            }).sort((a, b) => {
                const overdueA = this.getOverdueDays(a);
                const overdueB = this.getOverdueDays(b);
                return overdueB - overdueA;
            });
        },

        getWarningLevel: function(plant) {
            const overdueDays = this.getOverdueDays(plant);

            if (overdueDays === 0) {
                if (this.shouldWaterToday(plant)) {
                    return 'today';
                }
                return 'ok';
            } else if (overdueDays === 1) {
                return 'warning';
            } else if (overdueDays >= 2) {
                return 'danger';
            }

            return 'ok';
        }
    };

    global.ScheduleModule = Schedule;
})(window);
