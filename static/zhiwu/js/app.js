(function(global) {
    'use strict';

    const App = {
        currentTab: 'today',
        selectedPlantId: null,
        selectedIconId: 'pothos',
        selectedWaterType: 'every_n_days',
        selectedWeekDays: [1, 3],
        selectedSingleWeekDay: 1,
        selectedMonthDays: [1, 15],
        tempPhotoData: null,
        notificationCheckInterval: null,

        init: function() {
            this.bindEvents();
            this.initIconSelector();
            this.initMonthDaySelector();
            this.initCalendar();
            this.updateTodayDate();
            this.renderAll();
            this.initNotifications();
            this.startPeriodicCheck();

            if (NotificationModule && NotificationModule.isGranted()) {
                const btn = document.getElementById('enableNotifications');
                if (btn) {
                    btn.classList.add('enabled');
                    btn.textContent = '🔔 通知已启用';
                }
            }
        },

        bindEvents: function() {
            const tabBtns = document.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.switchTab(btn.dataset.tab);
                });
            });

            const addPlantBtn = document.getElementById('addPlantBtn');
            if (addPlantBtn) {
                addPlantBtn.addEventListener('click', () => this.openAddPlantModal());
            }

            const modalCloseBtns = document.querySelectorAll('.modal-close');
            modalCloseBtns.forEach(btn => {
                btn.addEventListener('click', () => this.closeAllModals());
            });

            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeAllModals();
                    }
                });
            });

            const plantForm = document.getElementById('plantForm');
            if (plantForm) {
                plantForm.addEventListener('submit', (e) => this.handlePlantSubmit(e));
            }

            const waterTypeBtns = document.querySelectorAll('.water-type-btn');
            waterTypeBtns.forEach(btn => {
                btn.addEventListener('click', () => this.selectWaterType(btn.dataset.type));
            });

            document.querySelectorAll('.num-btn.decrease').forEach(btn => {
                btn.addEventListener('click', () => this.adjustNumber(btn.dataset.target, -1));
            });
            document.querySelectorAll('.num-btn.increase').forEach(btn => {
                btn.addEventListener('click', () => this.adjustNumber(btn.dataset.target, 1));
            });

            document.querySelectorAll('.quick-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    const input = document.getElementById('everyNDays');
                    if (input) input.value = btn.dataset.value;
                });
            });

            document.querySelectorAll('.weekday-btn').forEach(btn => {
                btn.addEventListener('click', () => this.toggleWeekDay(btn));
            });

            const setTodayBtn = document.getElementById('setTodayBtn');
            if (setTodayBtn) {
                setTodayBtn.addEventListener('click', () => {
                    const today = new Date().toISOString().split('T')[0];
                    const input = document.getElementById('lastWateredDate');
                    if (input) input.value = today;
                });
            }

            const photoInput = document.getElementById('plantPhoto');
            if (photoInput) {
                photoInput.addEventListener('change', (e) => this.handlePhotoSelect(e));
            }

            const prevMonthBtn = document.getElementById('prevMonth');
            const nextMonthBtn = document.getElementById('nextMonth');
            const goToTodayBtn = document.getElementById('goToToday');

            if (prevMonthBtn) {
                prevMonthBtn.addEventListener('click', () => {
                    if (CalendarModule) CalendarModule.prevMonth();
                    this.updateCalendarTitle();
                });
            }
            if (nextMonthBtn) {
                nextMonthBtn.addEventListener('click', () => {
                    if (CalendarModule) CalendarModule.nextMonth();
                    this.updateCalendarTitle();
                });
            }
            if (goToTodayBtn) {
                goToTodayBtn.addEventListener('click', () => {
                    if (CalendarModule) CalendarModule.goToToday();
                    this.updateCalendarTitle();
                });
            }

            const historyFilter = document.getElementById('historyPlantFilter');
            if (historyFilter) {
                historyFilter.addEventListener('change', () => this.renderHistory());
            }

            const enableNotificationsBtn = document.getElementById('enableNotifications');
            if (enableNotificationsBtn) {
                enableNotificationsBtn.addEventListener('click', () => this.enableNotifications());
            }

            const waterNowBtn = document.getElementById('waterNowBtn');
            if (waterNowBtn) {
                waterNowBtn.addEventListener('click', () => this.waterPlantNow());
            }

            const editPlantBtn = document.getElementById('editPlantBtn');
            if (editPlantBtn) {
                editPlantBtn.addEventListener('click', () => this.editSelectedPlant());
            }

            const deletePlantBtn = document.getElementById('deletePlantBtn');
            if (deletePlantBtn) {
                deletePlantBtn.addEventListener('click', () => this.confirmDeletePlant());
            }

            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', () => this.executeDeletePlant());
            }

            const shareBtn = document.getElementById('shareBtn');
            if (shareBtn) {
                shareBtn.addEventListener('click', () => this.openShareModal());
            }

            const copyToClipboardBtn = document.getElementById('copyToClipboardBtn');
            if (copyToClipboardBtn) {
                copyToClipboardBtn.addEventListener('click', () => this.copyToClipboard());
            }

            const nativeShareBtn = document.getElementById('nativeShareBtn');
            if (nativeShareBtn) {
                if ('share' in navigator) {
                    nativeShareBtn.style.display = 'block';
                }
                nativeShareBtn.addEventListener('click', () => this.nativeShare());
            }
        },

        initIconSelector: function() {
            const container = document.getElementById('iconSelector');
            if (!container || !IconsModule) return;

            container.innerHTML = '';
            const icons = IconsModule.getAllIcons();

            icons.forEach(icon => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'icon-option' + (icon.id === this.selectedIconId ? ' selected' : '');
                btn.textContent = icon.emoji;
                btn.dataset.iconId = icon.id;
                btn.title = icon.name;
                btn.addEventListener('click', () => this.selectIcon(icon.id));
                container.appendChild(btn);
            });
        },

        initMonthDaySelector: function() {
            const container = document.querySelector('.monthday-selector');
            if (!container) return;

            container.innerHTML = '';
            for (let i = 1; i <= 31; i++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'monthday-btn' + (this.selectedMonthDays.includes(i) ? ' selected' : '');
                btn.textContent = i;
                btn.dataset.day = i;
                btn.addEventListener('click', () => this.toggleMonthDay(btn));
                container.appendChild(btn);
            }
        },

        initCalendar: function() {
            if (!CalendarModule) return;

            CalendarModule.init('calendarCanvas');
            CalendarModule.onDateSelect = (date, plants) => {
                this.showCalendarDateDetail(date, plants);
            };
            this.updateCalendarTitle();

            setTimeout(() => {
                if (CalendarModule) {
                    CalendarModule.resize();
                    CalendarModule.render();
                }
            }, 100);
        },

        updateCalendarTitle: function() {
            const titleEl = document.getElementById('calendarTitle');
            if (titleEl && CalendarModule) {
                titleEl.textContent = CalendarModule.getMonthName();
            }
        },

        showCalendarDateDetail: function(date, plants) {
            const detailEl = document.getElementById('calendarDetail');
            if (!detailEl) return;

            if (plants.length === 0) {
                const dateStr = this.formatDate(date);
                detailEl.innerHTML = `<p class="detail-placeholder">${dateStr} 没有需要浇水的植物</p>`;
                return;
            }

            let html = `<div class="calendar-detail-plants">
                <div class="calendar-detail-date">${this.formatDate(date)} 需要浇水的植物</div>`;

            plants.forEach(plant => {
                const icon = IconsModule ? IconsModule.getIconById(plant.iconId) : null;
                const schedule = IconsModule ? IconsModule.formatWaterSchedule(plant) : '';
                const level = ScheduleModule ? ScheduleModule.getWarningLevel(plant) : 'ok';
                
                let statusClass = '';
                if (level === 'today') statusClass = 'task-status today';
                else if (level === 'warning') statusClass = 'task-status overdue-1';
                else if (level === 'danger') statusClass = 'task-status overdue-2';

                html += `
                    <div class="calendar-plant-item">
                        <span class="calendar-plant-icon">${icon ? icon.emoji : '🌿'}</span>
                        <div class="calendar-plant-info">
                            <div class="calendar-plant-name">${plant.name}</div>
                            <div class="calendar-plant-schedule">${schedule}</div>
                        </div>
                        ${statusClass ? `<span class="${statusClass}">${this.getStatusText(level)}</span>` : ''}
                    </div>
                `;
            });

            html += '</div>';
            detailEl.innerHTML = html;
        },

        getStatusText: function(level) {
            switch (level) {
                case 'today': return '今日待浇';
                case 'warning': return '逾期1天';
                case 'danger': return '逾期2天+';
                default: return '';
            }
        },

        initNotifications: function() {
            if (!NotificationModule) return;

            if (NotificationModule.isSupported() && !NotificationModule.isGranted()) {
            }

            if (NotificationModule.isGranted()) {
                setTimeout(() => {
                    NotificationModule.checkAndNotify();
                }, 1000);
            }
        },

        enableNotifications: function() {
            if (!NotificationModule) return;

            if (!NotificationModule.isSupported()) {
                alert('您的浏览器不支持通知功能');
                return;
            }

            NotificationModule.requestPermission().then(permission => {
                const btn = document.getElementById('enableNotifications');
                if (permission === 'granted') {
                    if (btn) {
                        btn.classList.add('enabled');
                        btn.textContent = '🔔 通知已启用';
                    }
                    NotificationModule.testNotification();
                } else {
                    alert('通知权限被拒绝，您可以在浏览器设置中手动开启');
                }
            });
        },

        startPeriodicCheck: function() {
            if (NotificationModule) {
                this.notificationCheckInterval = NotificationModule.startPeriodicCheck(60000);
            }
        },

        updateTodayDate: function() {
            const el = document.getElementById('todayDate');
            if (el) {
                const now = new Date();
                el.textContent = this.formatLongDate(now);
            }
        },

        formatDate: function(date) {
            const d = new Date(date);
            return `${d.getMonth() + 1}月${d.getDate()}日`;
        },

        formatLongDate: function(date) {
            const d = new Date(date);
            const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
        },

        formatDateTime: function(date) {
            const d = new Date(date);
            return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        },

        switchTab: function(tabName) {
            this.currentTab = tabName;

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });

            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.toggle('active', content.id === `tab-${tabName}`);
            });

            if (tabName === 'calendar') {
                setTimeout(() => {
                    if (CalendarModule) {
                        CalendarModule.resize();
                        CalendarModule.render();
                    }
                }, 50);
            }

            if (tabName === 'history') {
                this.updateHistoryFilter();
            }

            this.renderAll();
        },

        renderAll: function() {
            this.renderTodayTasks();
            this.renderPlants();
            this.renderHistory();
            this.updateHistoryFilter();

            if (CalendarModule && this.currentTab === 'calendar') {
                CalendarModule.render();
            }
        },

        renderTodayTasks: function() {
            const container = document.getElementById('todayTasks');
            if (!container || !StorageModule || !ScheduleModule) return;

            const plants = StorageModule.getPlants();
            const plantsNeedingWater = ScheduleModule.getPlantsNeedingWaterToday(plants);

            if (plantsNeedingWater.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">🌿</span>
                        <p>今天没有需要浇水的植物</p>
                    </div>
                `;
                return;
            }

            let html = '';
            plantsNeedingWater.forEach(plant => {
                const icon = IconsModule ? IconsModule.getIconById(plant.iconId) : null;
                const schedule = IconsModule ? IconsModule.formatWaterSchedule(plant) : '';
                const overdueDays = ScheduleModule.getOverdueDays(plant);
                
                let statusClass = 'today';
                let statusText = '今日待浇';
                let cardClass = '';

                if (overdueDays === 1) {
                    statusClass = 'overdue-1';
                    statusText = '逾期1天';
                    cardClass = 'overdue-1';
                } else if (overdueDays >= 2) {
                    statusClass = 'overdue-2';
                    statusText = `逾期${overdueDays}天`;
                    cardClass = 'overdue-2';
                }

                const lastWateredText = plant.lastWatered 
                    ? this.formatDate(new Date(plant.lastWatered)) 
                    : '从未';

                html += `
                    <div class="task-card ${cardClass}" data-plant-id="${plant.id}">
                        ${plant.photo 
                            ? `<img src="${plant.photo}" alt="${plant.name}" class="task-photo">`
                            : `<span class="task-icon">${icon ? icon.emoji : '🌿'}</span>`
                        }
                        <div class="task-info">
                            <div class="task-name">${plant.name}</div>
                            <div class="task-meta">
                                <span class="task-schedule">${schedule}</span>
                                <span class="task-last-watered">上次: ${lastWateredText}</span>
                                <span class="task-status ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="btn btn-success btn-sm water-now-btn" data-plant-id="${plant.id}">
                                💧 浇水
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

            container.querySelectorAll('.water-now-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.waterPlant(btn.dataset.plantId);
                });
            });

            container.querySelectorAll('.task-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.water-now-btn')) {
                        this.openPlantDetail(card.dataset.plantId);
                    }
                });
            });
        },

        renderPlants: function() {
            const container = document.getElementById('plantsList');
            if (!container || !StorageModule || !ScheduleModule) return;

            const plants = StorageModule.getPlants();

            if (plants.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">🌵</span>
                        <p>还没有添加任何植物</p>
                        <p class="empty-hint">点击"添加植物"开始记录</p>
                    </div>
                `;
                return;
            }

            let html = '';
            plants.forEach(plant => {
                const icon = IconsModule ? IconsModule.getIconById(plant.iconId) : null;
                const schedule = IconsModule ? IconsModule.formatWaterSchedule(plant) : '';
                const level = ScheduleModule.getWarningLevel(plant);

                let statusClass = '';
                if (level === 'today') statusClass = 'status-today';
                else if (level === 'warning') statusClass = 'status-warning';
                else if (level === 'danger') statusClass = 'status-danger';

                html += `
                    <div class="plant-card ${statusClass}" data-plant-id="${plant.id}">
                        <span class="warning-badge"></span>
                        ${plant.photo 
                            ? `<img src="${plant.photo}" alt="${plant.name}" class="plant-photo">`
                            : `<span class="plant-icon">${icon ? icon.emoji : '🌿'}</span>`
                        }
                        <div class="plant-name">${plant.name}</div>
                        <div class="plant-schedule">${schedule}</div>
                    </div>
                `;
            });

            container.innerHTML = html;

            container.querySelectorAll('.plant-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.openPlantDetail(card.dataset.plantId);
                });
            });
        },

        renderHistory: function() {
            const container = document.getElementById('historyList');
            const filter = document.getElementById('historyPlantFilter');
            if (!container || !StorageModule) return;

            const filterValue = filter ? filter.value : 'all';
            let history = StorageModule.getHistory();

            if (filterValue !== 'all') {
                history = history.filter(h => h.plantId === filterValue);
            }

            history.sort((a, b) => b.timestamp - a.timestamp);

            if (history.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">📝</span>
                        <p>还没有浇水记录</p>
                        <p class="empty-hint">给植物浇水后会显示在这里</p>
                    </div>
                `;
                return;
            }

            let html = '';
            history.forEach(record => {
                const icon = IconsModule ? IconsModule.getIconById('pothos') : null;
                
                html += `
                    <div class="timeline-item">
                        <div class="timeline-date">${this.formatDateTime(record.date)}</div>
                        <div class="timeline-content">
                            <span class="timeline-icon">${icon ? icon.emoji : '🌿'}</span>
                            <div class="timeline-plant">
                                <div class="timeline-plant-name">${record.plantName}</div>
                                <div class="timeline-time">已浇水</div>
                            </div>
                            <span class="detail-history-icon">💧</span>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        },

        updateHistoryFilter: function() {
            const filter = document.getElementById('historyPlantFilter');
            if (!filter || !StorageModule) return;

            const currentValue = filter.value;
            const plants = StorageModule.getPlants();

            let html = '<option value="all">全部植物</option>';
            plants.forEach(plant => {
                html += `<option value="${plant.id}" ${plant.id === currentValue ? 'selected' : ''}>${plant.name}</option>`;
            });

            filter.innerHTML = html;
        },

        openAddPlantModal: function() {
            this.selectedPlantId = null;
            this.selectedIconId = 'pothos';
            this.selectedWaterType = 'every_n_days';
            this.selectedWeekDays = [1, 3];
            this.selectedSingleWeekDay = 1;
            this.selectedMonthDays = [1, 15];
            this.tempPhotoData = null;

            const modalTitle = document.getElementById('modalTitle');
            if (modalTitle) modalTitle.textContent = '添加植物';

            const plantForm = document.getElementById('plantForm');
            if (plantForm) plantForm.reset();

            const editPlantId = document.getElementById('editPlantId');
            if (editPlantId) editPlantId.value = '';

            const everyNDays = document.getElementById('everyNDays');
            if (everyNDays) everyNDays.value = 3;

            const everyNWeeks = document.getElementById('everyNWeeks');
            if (everyNWeeks) everyNWeeks.value = 2;

            this.resetPhotoPreview();
            this.selectIcon(this.selectedIconId);
            this.selectWaterType(this.selectedWaterType);
            this.updateWeekDayButtons();
            this.updateMonthDayButtons();

            const modal = document.getElementById('addPlantModal');
            if (modal) modal.classList.add('active');
        },

        openPlantDetail: function(plantId) {
            if (!StorageModule || !ScheduleModule) return;

            const plant = StorageModule.getPlantById(plantId);
            if (!plant) return;

            this.selectedPlantId = plantId;

            const nameEl = document.getElementById('detailPlantName');
            const scheduleEl = document.getElementById('detailSchedule');
            const lastWateredEl = document.getElementById('detailLastWatered');
            const nextWateredEl = document.getElementById('detailNextWatered');
            const warningEl = document.getElementById('detailWarning');
            const warningTextEl = document.getElementById('detailWarningText');
            const iconEl = document.getElementById('detailIcon');
            const photoEl = document.getElementById('detailPhoto');
            const historyListEl = document.getElementById('detailHistoryList');

            if (nameEl) nameEl.textContent = plant.name;

            const schedule = IconsModule ? IconsModule.formatWaterSchedule(plant) : '';
            if (scheduleEl) scheduleEl.textContent = schedule;

            const lastWateredText = plant.lastWatered 
                ? this.formatLongDate(new Date(plant.lastWatered)) 
                : '从未';
            if (lastWateredEl) lastWateredEl.textContent = lastWateredText;

            const nextWatering = ScheduleModule.calculateNextWatering(plant);
            if (nextWateredEl) nextWateredEl.textContent = this.formatLongDate(nextWatering);

            const overdueDays = ScheduleModule.getOverdueDays(plant);
            if (warningEl && warningTextEl) {
                if (overdueDays > 0) {
                    warningEl.style.display = 'flex';
                    warningTextEl.textContent = `逾期 ${overdueDays} 天`;
                } else {
                    warningEl.style.display = 'none';
                }
            }

            if (photoEl && iconEl) {
                photoEl.classList.remove('has-photo');
                if (plant.photo) {
                    photoEl.innerHTML = `<img src="${plant.photo}" class="preview-image" alt="${plant.name}">`;
                    photoEl.classList.add('has-photo');
                } else {
                    const icon = IconsModule ? IconsModule.getIconById(plant.iconId) : null;
                    iconEl.textContent = icon ? icon.emoji : '🌿';
                    photoEl.innerHTML = `<span class="detail-icon" id="detailIcon">${icon ? icon.emoji : '🌿'}</span>`;
                }
            }

            const history = StorageModule.getPlantHistory(plantId);
            if (historyListEl) {
                if (history.length === 0) {
                    historyListEl.innerHTML = '<p class="no-history">暂无记录</p>';
                } else {
                    let html = '';
                    history.slice(0, 10).forEach(record => {
                        html += `
                            <div class="detail-history-item">
                                <span class="detail-history-date">${this.formatDateTime(record.date)}</span>
                                <span class="detail-history-icon">💧</span>
                            </div>
                        `;
                    });
                    historyListEl.innerHTML = html;
                }
            }

            const modal = document.getElementById('plantDetailModal');
            if (modal) modal.classList.add('active');
        },

        editSelectedPlant: function() {
            if (!this.selectedPlantId || !StorageModule) return;

            const plant = StorageModule.getPlantById(this.selectedPlantId);
            if (!plant) return;

            this.closeAllModals();

            this.selectedPlantId = plant.id;
            this.selectedIconId = plant.iconId || 'pothos';
            this.selectedWaterType = plant.waterType || 'every_n_days';
            this.tempPhotoData = plant.photo || null;

            const modalTitle = document.getElementById('modalTitle');
            if (modalTitle) modalTitle.textContent = '编辑植物';

            const plantName = document.getElementById('plantName');
            if (plantName) plantName.value = plant.name;

            const editPlantId = document.getElementById('editPlantId');
            if (editPlantId) editPlantId.value = plant.id;

            const settings = plant.waterSettings || {};
            const everyNDays = document.getElementById('everyNDays');
            const everyNWeeks = document.getElementById('everyNWeeks');

            if (everyNDays && settings.days) everyNDays.value = settings.days;
            if (everyNWeeks && settings.weeks) everyNWeeks.value = settings.weeks;

            this.selectedWeekDays = settings.days || (this.selectedWaterType === 'weekly_days' ? [1, 3] : []);
            this.selectedSingleWeekDay = settings.weekday || 1;
            this.selectedMonthDays = settings.days || (this.selectedWaterType === 'monthly_days' ? [1, 15] : []);

            const lastWateredDate = document.getElementById('lastWateredDate');
            if (lastWateredDate && plant.lastWatered) {
                lastWateredDate.value = new Date(plant.lastWatered).toISOString().split('T')[0];
            } else if (lastWateredDate) {
                lastWateredDate.value = '';
            }

            if (this.tempPhotoData) {
                const preview = document.getElementById('photoPreview');
                if (preview) {
                    preview.innerHTML = `<img src="${this.tempPhotoData}" class="preview-image">`;
                    preview.classList.add('has-photo');
                }
            } else {
                this.resetPhotoPreview();
            }

            this.selectIcon(this.selectedIconId);
            this.selectWaterType(this.selectedWaterType);
            this.updateWeekDayButtons();
            this.updateMonthDayButtons();

            const modal = document.getElementById('addPlantModal');
            if (modal) modal.classList.add('active');
        },

        confirmDeletePlant: function() {
            const confirmModal = document.getElementById('confirmModal');
            if (confirmModal) confirmModal.classList.add('active');
        },

        executeDeletePlant: function() {
            if (!this.selectedPlantId || !StorageModule) return;

            StorageModule.deletePlant(this.selectedPlantId);
            StorageModule.deletePlantHistory(this.selectedPlantId);

            this.closeAllModals();
            this.selectedPlantId = null;
            this.renderAll();
        },

        closeAllModals: function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        },

        selectIcon: function(iconId) {
            this.selectedIconId = iconId;

            document.querySelectorAll('.icon-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.iconId === iconId);
            });
        },

        selectWaterType: function(type) {
            this.selectedWaterType = type;

            document.querySelectorAll('.water-type-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === type);
            });

            document.querySelectorAll('[class*="settings-"]').forEach(el => {
                el.classList.add('hidden');
            });

            const targetEl = document.querySelector(`.settings-${type}`);
            if (targetEl) targetEl.classList.remove('hidden');
        },

        adjustNumber: function(targetId, delta) {
            const input = document.getElementById(targetId);
            if (!input) return;

            let value = parseInt(input.value) || 0;
            const min = parseInt(input.min) || 1;
            const max = parseInt(input.max) || 30;

            value += delta;
            value = Math.max(min, Math.min(max, value));
            input.value = value;
        },

        toggleWeekDay: function(btn) {
            const day = parseInt(btn.dataset.day);
            const isSingleSelect = btn.closest('.single-select') !== null;

            if (isSingleSelect) {
                this.selectedSingleWeekDay = day;
                document.querySelectorAll('#weekdaySingle .weekday-btn').forEach(b => {
                    b.classList.toggle('selected', b === btn);
                });
            } else {
                const index = this.selectedWeekDays.indexOf(day);
                if (index === -1) {
                    this.selectedWeekDays.push(day);
                    btn.classList.add('selected');
                } else {
                    this.selectedWeekDays.splice(index, 1);
                    btn.classList.remove('selected');
                }
            }
        },

        toggleMonthDay: function(btn) {
            const day = parseInt(btn.dataset.day);
            const index = this.selectedMonthDays.indexOf(day);

            if (index === -1) {
                this.selectedMonthDays.push(day);
                btn.classList.add('selected');
            } else {
                this.selectedMonthDays.splice(index, 1);
                btn.classList.remove('selected');
            }
        },

        updateWeekDayButtons: function() {
            document.querySelectorAll('.weekday-btn:not(.single-select .weekday-btn)').forEach(btn => {
                const day = parseInt(btn.dataset.day);
                btn.classList.toggle('selected', this.selectedWeekDays.includes(day));
            });

            document.querySelectorAll('#weekdaySingle .weekday-btn').forEach(btn => {
                const day = parseInt(btn.dataset.day);
                btn.classList.toggle('selected', day === this.selectedSingleWeekDay);
            });
        },

        updateMonthDayButtons: function() {
            document.querySelectorAll('.monthday-btn').forEach(btn => {
                const day = parseInt(btn.dataset.day);
                btn.classList.toggle('selected', this.selectedMonthDays.includes(day));
            });
        },

        handlePhotoSelect: function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                this.tempPhotoData = event.target.result;
                const preview = document.getElementById('photoPreview');
                if (preview) {
                    preview.innerHTML = `<img src="${this.tempPhotoData}" class="preview-image">`;
                    preview.classList.add('has-photo');
                }
            };
            reader.readAsDataURL(file);
        },

        resetPhotoPreview: function() {
            const preview = document.getElementById('photoPreview');
            if (preview) {
                preview.innerHTML = '<span class="photo-placeholder">📷 点击上传照片</span>';
                preview.classList.remove('has-photo');
            }
        },

        handlePlantSubmit: function(e) {
            e.preventDefault();
            if (!StorageModule) return;

            const plantName = document.getElementById('plantName');
            const editPlantId = document.getElementById('editPlantId');
            const lastWateredDate = document.getElementById('lastWateredDate');
            const everyNDays = document.getElementById('everyNDays');
            const everyNWeeks = document.getElementById('everyNWeeks');

            if (!plantName || !plantName.value.trim()) {
                alert('请输入植物名称');
                return;
            }

            let waterSettings = {};
            switch (this.selectedWaterType) {
                case 'every_n_days':
                    waterSettings = { days: parseInt(everyNDays?.value) || 3 };
                    break;
                case 'weekly_days':
                    if (this.selectedWeekDays.length === 0) {
                        alert('请至少选择一个浇水日');
                        return;
                    }
                    waterSettings = { days: [...this.selectedWeekDays] };
                    break;
                case 'every_n_weeks':
                    waterSettings = { 
                        weeks: parseInt(everyNWeeks?.value) || 2,
                        weekday: this.selectedSingleWeekDay
                    };
                    break;
                case 'monthly_days':
                    if (this.selectedMonthDays.length === 0) {
                        alert('请至少选择一个日期');
                        return;
                    }
                    waterSettings = { days: [...this.selectedMonthDays] };
                    break;
            }

            const plantData = {
                name: plantName.value.trim(),
                iconId: this.selectedIconId,
                waterType: this.selectedWaterType,
                waterSettings: waterSettings,
                lastWatered: lastWateredDate?.value 
                    ? new Date(lastWateredDate.value).toISOString() 
                    : null,
                photo: this.tempPhotoData
            };

            if (editPlantId && editPlantId.value) {
                StorageModule.updatePlant(editPlantId.value, plantData);
            } else {
                StorageModule.addPlant(plantData);
            }

            this.closeAllModals();
            this.renderAll();
        },

        waterPlant: function(plantId) {
            if (!StorageModule) return;

            const plant = StorageModule.getPlantById(plantId);
            if (!plant) return;

            const now = new Date();
            StorageModule.updatePlant(plantId, { lastWatered: now.toISOString() });
            StorageModule.addWateringRecord(plantId, plant.name, now);

            this.renderAll();
        },

        waterPlantNow: function() {
            if (!this.selectedPlantId) return;
            this.waterPlant(this.selectedPlantId);
            this.closeAllModals();
        },

        openShareModal: function() {
            const shareText = this.generateShareText();
            
            const previewEl = document.getElementById('shareTextPreview');
            if (previewEl) {
                previewEl.textContent = shareText;
            }

            const successEl = document.getElementById('shareSuccess');
            if (successEl) {
                successEl.style.display = 'none';
            }

            const modal = document.getElementById('shareModal');
            if (modal) modal.classList.add('active');
        },

        generateShareText: function() {
            if (!StorageModule || !ScheduleModule) {
                return '暂无需要浇水的植物：\n\n暂无数据';
            }

            const plants = StorageModule.getPlants();
            const plantsNeedingWater = ScheduleModule.getPlantsNeedingWaterToday(plants);

            const now = new Date();
            const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

            let text = `🌿 植物浇水日历\n`;
            text += `📅 ${dateStr}\n\n`;

            if (plantsNeedingWater.length === 0) {
                text += `✅ 太棒了！今天所有植物都已浇过水了~\n\n`;
            } else {
                const overduePlants = [];
                const todayPlants = [];

                plantsNeedingWater.forEach(plant => {
                    const overdueDays = ScheduleModule.getOverdueDays(plant);
                    const icon = IconsModule ? IconsModule.getIconById(plant.iconId) : null;
                    const schedule = IconsModule ? IconsModule.formatWaterSchedule(plant) : '';
                    
                    const plantInfo = {
                        name: plant.name,
                        icon: icon ? icon.emoji : '🌿',
                        schedule: schedule,
                        overdueDays: overdueDays
                    };

                    if (overdueDays > 0) {
                        overduePlants.push(plantInfo);
                    } else {
                        todayPlants.push(plantInfo);
                    }
                });

                if (overduePlants.length > 0) {
                    text += `⚠️ 【逾期未浇水（${overduePlants.length}株）\n`;
                    text += `────────────────\n`;
                    overduePlants.forEach((plant, index) => {
                        text += `${index + 1}. ${plant.icon} ${plant.name}\n`;
                        text += `   浇水频率：${plant.schedule}\n`;
                        text += `   ⚠️ 逾期 ${plant.overdueDays} 天\n`;
                        if (index < overduePlants.length - 1) text += '\n';
                    });
                    text += '\n';
                }

                if (todayPlants.length > 0) {
                    text += `💧 【今日待浇水（${todayPlants.length}株）\n`;
                    text += `────────────────\n`;
                    todayPlants.forEach((plant, index) => {
                        text += `${index + 1}. ${plant.icon} ${plant.name}\n`;
                        text += `   浇水频率：${plant.schedule}\n`;
                        if (index < todayPlants.length - 1) text += '\n';
                    });
                }
            }

            const totalPlants = plants.length;
            const wateredCount = totalPlants - plantsNeedingWater.length;
            text += `\n────────────────\n`;
            text += `📊 统计：共 ${totalPlants} 株植物\n`;
            text += `   ✅ 已浇水：${wateredCount} 株\n`;
            text += `   ❌ 待浇水：${plantsNeedingWater.length} 株\n`;
            text += `\n`;
            text += `————————————\n`;
            text += `来自 🌿 植物浇水日历\n`;
            text += `帮助你照顾好每一株植物~`;

            return text;
        },

        copyToClipboard: function() {
            const shareText = this.generateShareText();

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareText).then(() => {
                    this.showCopySuccess();
                }).catch(err => {
                    console.error('复制失败:', err);
                    this.fallbackCopy(shareText);
                });
            } else {
                this.fallbackCopy(shareText);
            }
        },

        fallbackCopy: function(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                this.showCopySuccess();
            } catch (err) {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            }

            document.body.removeChild(textArea);
        },

        showCopySuccess: function() {
            const successEl = document.getElementById('shareSuccess');
            if (successEl) {
                successEl.style.display = 'block';
                
                setTimeout(() => {
                    if (successEl) {
                        successEl.style.display = 'none';
                    }
                }, 2000);
            }
        },

        nativeShare: function() {
            if (!('share' in navigator)) return;

            const shareText = this.generateShareText();

            try {
                navigator.share({
                    title: '🌿 植物浇水日历',
                    text: shareText
                }).then(() => {
                    console.log('分享成功');
                }).catch(err => {
                    console.log('分享取消或失败:', err);
                });
            } catch (err) {
                console.error('分享失败:', err);
            }
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });

    global.App = App;
})(window);
