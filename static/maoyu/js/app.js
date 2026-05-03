import { Storage } from './modules/storage.js';
import { Audio } from './modules/audio.js';
import { CatAnimation, HeartAnimation } from './modules/animation.js';
import { Share } from './modules/share.js';
import { UI } from './modules/ui.js';

const App = {
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeModules();
            this.bindGlobalEvents();
            this.saveStateOnUnload();
        });
    },

    initializeModules() {
        Audio.init();
        CatAnimation.init('catCanvas');
        Share.init('shareCanvas');
        UI.init();

        console.log('🐱 猫语翻译器已初始化！');
    },

    bindGlobalEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.restoreState();
            }
        });

        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                this.restoreState();
            }
        });
    },

    saveStateOnUnload() {
        window.addEventListener('beforeunload', () => {
            const state = {
                currentMode: UI.currentMode,
                timestamp: Date.now()
            };
            Storage.saveCurrentState(state);
        });
    },

    restoreState() {
        const savedState = Storage.getCurrentState();
        if (savedState) {
            const settings = Storage.getSettings();
            if (settings.currentMode && settings.currentMode !== UI.currentMode) {
                UI.switchMode(settings.currentMode);
            }
        }
    }
};

App.init();

export default App;
