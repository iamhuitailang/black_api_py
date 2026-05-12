const Checkin = {
    currentData: {
        duration: 20,
        weather: 'sunny',
        poop: 'normal',
        pee: true,
        route: 'park',
        interaction: [],
        note: '',
        timeSlot: 'evening'
    },

    weathers: [
        { id: 'sunny', icon: '☀️', label: '晴' },
        { id: 'cloudy', icon: '☁️', label: '多云' },
        { id: 'rainy', icon: '🌧️', label: '雨' },
        { id: 'snowy', icon: '❄️', label: '雪' }
    ],

    poops: [
        { id: 'normal', icon: '✅', label: '正常' },
        { id: 'soft', icon: '⚠️', label: '软便' },
        { id: 'none', icon: '❌', label: '无' }
    ],

    routes: [
        { id: 'community', icon: '🏘️', label: '小区' },
        { id: 'park', icon: '🌳', label: '公园' },
        { id: 'river', icon: '🌊', label: '河边' },
        { id: 'other', icon: '📍', label: '自定义' }
    ],

    interactions: [
        { id: 'dogs', icon: '🐕', label: '与其他狗玩' },
        { id: 'training', icon: '🎾', label: '训练' },
        { id: 'none', icon: '❌', label: '无' }
    ],

    init() {
    },

    render() {
        const checkins = Storage.loadCheckins();
        const recentCheckins = checkins.slice(0, 10);

        return `
            <div class="bone-card">
                <h2 style="margin-bottom: 20px;">✅ 遛狗打卡</h2>
                <button class="bone-btn" onclick="Checkin.showCheckinForm()">
                    🐾 开始打卡
                </button>
            </div>

            <div class="bone-card">
                <h3 style="margin-bottom: 15px;">📋 最近记录</h3>
                ${recentCheckins.length === 0 ? `
                    <div class="empty-state">
                        <div class="icon">🐾</div>
                        <p>还没有打卡记录，快去遛狗吧！</p>
                    </div>
                ` : `
                    ${recentCheckins.map(c => this.renderCheckinItem(c)).join('')}
                `}
                ${checkins.length > 10 ? `
                    <div style="text-align: center; margin-top: 15px;">
                        <button class="bone-btn bone-btn-secondary" onclick="App.renderPage('calendar')">
                            📅 查看全部
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderCheckinItem(checkin) {
        const date = new Date(checkin.timestamp);
        const dateStr = date.toLocaleDateString('zh-CN', { 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
        });
        const timeStr = date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const weather = this.weathers.find(w => w.id === checkin.weather);
        const poop = this.poops.find(p => p.id === checkin.poop);
        const route = this.routes.find(r => r.id === checkin.route);

        return `
            <div class="checkin-item">
                <div class="checkin-icon">${weather ? weather.icon : '☀️'}</div>
                <div class="checkin-info">
                    <div class="checkin-date">${dateStr} ${timeStr}</div>
                    <div class="checkin-details">
                        ⏱️ ${checkin.duration}分钟 · 
                        ${route ? route.label : '公园'} · 
                        💩 ${poop ? poop.label : '正常'} · 
                        💧 ${checkin.pee ? '有' : '无'}
                    </div>
                    ${checkin.note ? `<div style="font-size: 0.85rem; color: var(--text-light); margin-top: 5px;">📝 ${checkin.note}</div>` : ''}
                </div>
            </div>
        `;
    },

    showCheckinForm() {
        App.showModal(`
            <h2 style="margin-bottom: 20px;">🐾 遛狗打卡</h2>
            <form id="checkinForm">
                <div class="form-group">
                    <label class="form-label">⏱️ 遛狗时长（分钟）</label>
                    <input type="number" class="form-input" id="checkinDuration" 
                           value="${this.currentData.duration}" min="5" max="120">
                </div>

                <div class="form-group">
                    <label class="form-label">🌤️ 天气</label>
                    <div class="weather-options">
                        ${this.weathers.map(w => `
                            <button type="button" class="option-btn ${this.currentData.weather === w.id ? 'selected' : ''}"
                                    onclick="Checkin.selectWeather('${w.id}', this)">
                                ${w.icon} ${w.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">💩 排便情况</label>
                    <div class="poop-options">
                        ${this.poops.map(p => `
                            <button type="button" class="option-btn ${this.currentData.poop === p.id ? 'selected' : ''}"
                                    onclick="Checkin.selectPoop('${p.id}', this)">
                                ${p.icon} ${p.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">💧 排尿情况</label>
                    <div class="poop-options">
                        <button type="button" class="option-btn ${this.currentData.pee ? 'selected' : ''}"
                                onclick="Checkin.selectPee(true, this)">
                            ✅ 有
                        </button>
                        <button type="button" class="option-btn ${!this.currentData.pee ? 'selected' : ''}"
                                onclick="Checkin.selectPee(false, this)">
                            ❌ 无
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">📍 路线</label>
                    <div class="route-options">
                        ${this.routes.map(r => `
                            <button type="button" class="option-btn ${this.currentData.route === r.id ? 'selected' : ''}"
                                    onclick="Checkin.selectRoute('${r.id}', this)">
                                ${r.icon} ${r.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">🎯 互动</label>
                    <div class="route-options">
                        ${this.interactions.map(i => `
                            <button type="button" class="option-btn ${this.currentData.interaction.includes(i.id) ? 'selected' : ''}"
                                    onclick="Checkin.selectInteraction('${i.id}', this)">
                                ${i.icon} ${i.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">📝 备注</label>
                    <textarea class="form-textarea" id="checkinNote" 
                              placeholder="记录一些特别的事情...">${this.currentData.note}</textarea>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="button" class="bone-btn" onclick="Checkin.submitCheckin()">
                        ✅ 提交打卡
                    </button>
                    <button type="button" class="bone-btn bone-btn-secondary" onclick="App.closeModal()">
                        取消
                    </button>
                </div>
            </form>
        `);
    },

    selectWeather(id, btn) {
        this.currentData.weather = id;
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    },

    selectPoop(id, btn) {
        this.currentData.poop = id;
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    },

    selectPee(value, btn) {
        this.currentData.pee = value;
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    },

    selectRoute(id, btn) {
        this.currentData.route = id;
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    },

    selectInteraction(id, btn) {
        const idx = this.currentData.interaction.indexOf(id);
        if (idx > -1) {
            this.currentData.interaction.splice(idx, 1);
            btn.classList.remove('selected');
        } else {
            if (id === 'none') {
                this.currentData.interaction = ['none'];
                btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            } else {
                this.currentData.interaction = this.currentData.interaction.filter(i => i !== 'none');
                this.currentData.interaction.push(id);
                btn.classList.add('selected');
            }
        }
    },

    submitCheckin() {
        const duration = parseInt(document.getElementById('checkinDuration').value);
        const note = document.getElementById('checkinNote').value.trim();

        if (!duration || duration < 5) {
            App.showNotification('遛狗时长至少5分钟！', 'error');
            return;
        }

        const checkin = {
            duration: duration,
            weather: this.currentData.weather,
            poop: this.currentData.poop,
            pee: this.currentData.pee,
            route: this.currentData.route,
            interaction: [...this.currentData.interaction],
            note: note,
            timeSlot: this.getTimeSlot()
        };

        Storage.addCheckin(checkin);
        App.closeModal();
        App.showNotification('打卡成功！🐕 真棒！');
        App.renderPage('checkin');
    },

    getTimeSlot() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 10) return 'morning';
        if (hour >= 10 && hour < 14) return 'noon';
        if (hour >= 14 && hour < 20) return 'evening';
        return 'night';
    }
};