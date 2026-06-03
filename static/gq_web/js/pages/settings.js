const SettingsPage = {
    settings: {
        soundEnabled: true,
        musicVolume: 80,
        magicEffects: true,
        effectIntensity: 70,
        showFPS: false
    },

    render() {
        this.loadSettings();
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <button class="header-back" onclick="Router.back()">‹</button>
                    <h1 class="header-title">设置</h1>
                </header>

                <div class="settings-container">
                    <div class="settings-section">
                        <div class="settings-section-title">音频设置</div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-name">音效开关</div>
                                <div class="setting-desc">开启/关闭游戏音效</div>
                            </div>
                            <div class="setting-toggle ${this.settings.soundEnabled ? 'active' : ''}" id="soundToggle">
                                <div class="toggle-knob"></div>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-name">音乐音量</div>
                                <div class="setting-desc">调整背景音乐音量</div>
                            </div>
                            <div class="setting-value" id="musicVolumeValue">${this.settings.musicVolume}%</div>
                        </div>
                        <div class="setting-slider-container">
                            <input type="range" class="setting-slider" id="musicVolumeSlider" min="0" max="100" value="${this.settings.musicVolume}">
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="settings-section-title">魔法特效</div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-name">魔法特效开关</div>
                                <div class="setting-desc">开启/关闭演奏时的魔法特效</div>
                            </div>
                            <div class="setting-toggle ${this.settings.magicEffects ? 'active' : ''}" id="magicToggle">
                                <div class="toggle-knob"></div>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-name">特效强度</div>
                                <div class="setting-desc">调整魔法特效的显示强度</div>
                            </div>
                            <div class="setting-value" id="effectIntensityValue">${this.settings.effectIntensity}%</div>
                        </div>
                        <div class="setting-slider-container">
                            <input type="range" class="setting-slider" id="effectIntensitySlider" min="0" max="100" value="${this.settings.effectIntensity}">
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="settings-section-title">性能设置</div>
                        
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-name">显示FPS</div>
                                <div class="setting-desc">在演奏时显示帧率信息</div>
                            </div>
                            <div class="setting-toggle ${this.settings.showFPS ? 'active' : ''}" id="fpsToggle">
                                <div class="toggle-knob"></div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-footer">
                        <button class="btn btn-primary btn-block" onclick="SettingsPage.saveSettings()">保存设置</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.toggleSetting('soundEnabled');
        });

        document.getElementById('magicToggle').addEventListener('click', () => {
            this.toggleSetting('magicEffects');
        });

        document.getElementById('fpsToggle').addEventListener('click', () => {
            this.toggleSetting('showFPS');
        });

        document.getElementById('musicVolumeSlider').addEventListener('input', (e) => {
            this.settings.musicVolume = parseInt(e.target.value);
            document.getElementById('musicVolumeValue').textContent = `${this.settings.musicVolume}%`;
        });

        document.getElementById('effectIntensitySlider').addEventListener('input', (e) => {
            this.settings.effectIntensity = parseInt(e.target.value);
            document.getElementById('effectIntensityValue').textContent = `${this.settings.effectIntensity}%`;
        });
    },

    toggleSetting(key) {
        this.settings[key] = !this.settings[key];
        const toggleEl = {
            soundEnabled: 'soundToggle',
            magicEffects: 'magicToggle',
            showFPS: 'fpsToggle'
        }[key];
        
        if (toggleEl) {
            const el = document.getElementById(toggleEl);
            if (this.settings[key]) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        }
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem('gq_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.log('加载设置失败，使用默认值');
        }
    },

    saveSettings() {
        try {
            localStorage.setItem('gq_settings', JSON.stringify(this.settings));
            Toast.success('设置已保存');
        } catch (error) {
            Toast.error('保存失败，请重试');
        }
    },

    getSetting(key) {
        return this.settings[key];
    }
};
