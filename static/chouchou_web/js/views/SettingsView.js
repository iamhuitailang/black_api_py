
const SettingsView = Vue.defineComponent({
    name: 'SettingsView',
    setup() {
        const router = window.ChouchouRouter;
        
        const loading = Vue.ref(false);
        const settings = Vue.reactive({
            sound_enabled: true,
            music_enabled: true,
            animation_enabled: true,
            notification_enabled: true,
            auto_start_timer: true,
            show_player_role: true,
            volume: 80
        });

        const themes = [
            { id: 'carnival', name: '欢乐马戏城', emoji: '🎠', desc: '卡通童趣风，色彩鲜艳活泼' },
            { id: 'vintage', name: '复古马戏团', emoji: '🎩', desc: '怀旧欧式风，温暖复古质感' },
            { id: 'dark', name: '暗夜诡马戏', emoji: '🌑', desc: '悬疑暗黑风，神秘冷酷氛围' }
        ];

        const loadSettings = async () => {
            loading.value = true;
            try {
                const result = await API.setting.get();
                if (result) {
                    Object.assign(settings, result);
                }
            } finally {
                loading.value = false;
            }
        };

        const saveSettings = async () => {
            loading.value = true;
            try {
                const result = await API.setting.update(settings);
                if (result) {
                    Store.updateSettings(settings);
                    Utils.success('设置已保存');
                }
            } finally {
                loading.value = false;
            }
        };

        const selectTheme = async (themeId) => {
            Store.setTheme(themeId);
        };

        const resetSettings = () => {
            if (confirm('确定要恢复默认设置吗？')) {
                Object.assign(settings, {
                    sound_enabled: true,
                    music_enabled: true,
                    animation_enabled: true,
                    notification_enabled: true,
                    auto_start_timer: true,
                    show_player_role: true,
                    volume: 80
                });
                saveSettings();
            }
        };

        Vue.onMounted(() => {
            loadSettings();
        });

        return {
            Store,
            Utils,
            loading,
            settings,
            themes,
            loadSettings,
            saveSettings,
            selectTheme,
            resetSettings
        };
    },
    template: `
        <div>
            <header class="header">
                <h1>🎪 国王游戏 - 设置</h1>
                <nav>
                    <router-link to="/lobby">游戏大厅</router-link>
                    <router-link to="/leaderboard">排行榜</router-link>
                    <router-link to="/profile">个人中心</router-link>
                    <router-link to="/settings">设置</router-link>
                    <button @click="Store.logout()">退出</button>
                    <ThemeSwitcher />
                </nav>
            </header>

            <div class="container">
                <div class="settings-group">
                    <h3>🎭 主题设置</h3>
                    <div class="grid grid-3">
                        <div 
                            v-for="theme in themes" 
                            :key="theme.id"
                            :style="{
                                padding: '20px',
                                borderRadius: '12px',
                                border: Store.currentTheme === theme.id ? '3px solid var(--primary-color)' : '2px solid var(--border-color)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'var(--transition)',
                                background: Store.currentTheme === theme.id ? 'rgba(var(--primary-color-rgb), 0.05)' : 'transparent'
                            }"
                            @click="selectTheme(theme.id)"
                        >
                            <div style="font-size: 48px; margin-bottom: 12px;">{{ theme.emoji }}</div>
                            <div style="font-weight: bold; font-size: 18px; margin-bottom: 8px;">{{ theme.name }}</div>
                            <div style="font-size: 14px; color: var(--text-light);">{{ theme.desc }}</div>
                            <div v-if="Store.currentTheme === theme.id" style="margin-top: 12px;">
                                <span class="badge badge-success">当前使用</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h3>🔊 声音设置</h3>
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">音效</div>
                            <div class="setting-desc">开启/关闭游戏音效</div>
                        </div>
                        <div 
                            :class="['switch', { active: settings.sound_enabled }]"
                            @click="settings.sound_enabled = !settings.sound_enabled"
                        ></div>
                    </div>
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">背景音乐</div>
                            <div class="setting-desc">开启/关闭背景音乐</div>
                        </div>
                        <div 
                            :class="['switch', { active: settings.music_enabled }]"
                            @click="settings.music_enabled = !settings.music_enabled"
                        ></div>
                    </div>
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">音量: {{ settings.volume }}%</div>
                            <div class="setting-desc">调节游戏音量大小</div>
                        </div>
                        <input 
                            type="range" 
                            v-model="settings.volume" 
                            min="0" 
                            max="100" 
                            step="5"
                        />
                    </div>
                </div>

                <div class="settings-group">
                    <h3>🎮 游戏设置</h3>
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">自动开始计时</div>
                            <div class="setting-desc">指令发布后自动开始倒计时</div>
                        </div>
                        <div 
                            :class="['switch', { active: settings.auto_start_timer }]"
                            @click="settings.auto_start_timer = !settings.auto_start_timer"
                        ></div>
                    </div>
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">显示玩家身份</div>
                            <div class="setting-desc">在游戏中显示其他玩家的身份</div>
                        </div>
                        <div 
                            :class="['switch', { active: settings.show_player_role }]"
                            @click="settings.show_player_role = !settings.show_player_role"
                        ></div>
                    </div>
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">动画效果</div>
                            <div class="setting-desc">开启/关闭界面动画效果</div>
                        </div>
                        <div 
                            :class="['switch', { active: settings.animation_enabled }]"
                            @click="settings.animation_enabled = !settings.animation_enabled"
                        ></div>
                    </div>
                </div>

                <div class="settings-group">
                    <h3>🔔 通知设置</h3>
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">游戏通知</div>
                            <div class="setting-desc">接收游戏状态变更通知</div>
                        </div>
                        <div 
                            :class="['switch', { active: settings.notification_enabled }]"
                            @click="settings.notification_enabled = !settings.notification_enabled"
                        ></div>
                    </div>
                </div>

                <div style="display: flex; gap: 16px; margin-top: 32px; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-lg" :disabled="loading" @click="saveSettings">
                        {{ loading ? '保存中...' : '💾 保存设置' }}
                    </button>
                    <button class="btn btn-outline btn-lg" @click="resetSettings">
                        🔄 恢复默认
                    </button>
                </div>

                <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border-color); text-align: center; color: var(--text-light);">
                    <p>🎪 国王游戏 - 马戏对决 v1.0.0</p>
                    <p style="font-size: 12px; margin-top: 8px;">
                        参与马戏阵营国王对决，遵从国王指令完成趣味互动比拼
                    </p>
                </div>
            </div>
        </div>
    `
});

window.SettingsView = SettingsView;
