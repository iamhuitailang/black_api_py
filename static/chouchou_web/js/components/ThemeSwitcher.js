
const ThemeSwitcher = Vue.defineComponent({
    name: 'ThemeSwitcher',
    setup() {
        const currentTheme = Vue.computed(() => Store.currentTheme);

        const themes = [
            { id: 'carnival', name: '欢乐马戏城', emoji: '🎠' },
            { id: 'vintage', name: '复古马戏团', emoji: '🎩' },
            { id: 'dark', name: '暗夜诡马戏', emoji: '🌑' }
        ];

        const switchTheme = (themeId) => {
            Store.setTheme(themeId);
            Utils.success(`已切换到${Utils.getThemeName(themeId)}`);
        };

        return {
            currentTheme,
            themes,
            switchTheme
        };
    },
    template: `
        <div class="theme-switcher">
            <button
                v-for="theme in themes"
                :key="theme.id"
                :class="['theme-btn', theme.id, { active: currentTheme === theme.id }]"
                :title="theme.name"
                @click="switchTheme(theme.id)"
            >
                {{ theme.emoji }}
            </button>
        </div>
    `
});

window.ThemeSwitcher = ThemeSwitcher;
