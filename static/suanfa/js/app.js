/**
 * 排序算法可视化应用 - 主入口文件
 * Sorting Algorithm Visualizer Application - Main Entry File
 */

import DataModule from './modules/data.js';
import RendererModule from './modules/renderer.js';
import AlgorithmsModule from './modules/algorithms.js';
import AnimationModule from './modules/animation.js';
import UIModule from './modules/ui.js';

const App = {
    dataModule: null,
    rendererModule: null,
    algorithmsModule: null,
    animationModule: null,
    uiModule: null,
    
    isInitialized: false,

    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        console.log('🚀 Initializing Sorting Algorithm Visualizer...');

        try {
            this.dataModule = DataModule;
            this.rendererModule = RendererModule;
            this.algorithmsModule = AlgorithmsModule;
            this.animationModule = AnimationModule;
            this.uiModule = UIModule;

            const canvas = document.getElementById('sortCanvas');
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            this.dataModule.init();

            this.rendererModule.init(canvas);

            this.animationModule.init(
                this.dataModule,
                this.rendererModule,
                this.algorithmsModule
            );

            this.uiModule.init(
                this.dataModule,
                this.animationModule,
                this.rendererModule,
                this.algorithmsModule
            );

            this.setupGlobalHandlers();

            this.isInitialized = true;

            console.log('✅ Sorting Algorithm Visualizer initialized successfully!');
            console.log('📊 Available algorithms:', this.algorithmsModule.getAllAlgorithms().map(a => a.name).join(', '));

        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError(error.message);
        }
    },

    setupGlobalHandlers() {
        window.addEventListener('beforeunload', (e) => {
            this.dataModule.saveState();
            if (this.animationModule.isAnimating()) {
                this.animationModule.stop();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.animationModule.isAnimating() && !this.animationModule.isAnimationPaused()) {
                    this.animationModule.pause();
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleSpaceKey();
            }
            if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.handleResetKey();
            }
        });
    },

    handleSpaceKey() {
        if (!this.isInitialized) return;

        const isAnimating = this.animationModule.isAnimating();
        const isPaused = this.animationModule.isAnimationPaused();

        if (isAnimating) {
            if (isPaused) {
                this.animationModule.resume();
            } else {
                this.animationModule.pause();
            }
        } else {
            const startBtn = document.getElementById('startBtn');
            if (startBtn && !startBtn.disabled) {
                startBtn.click();
            }
        }
    },

    handleResetKey() {
        if (!this.isInitialized) return;

        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.click();
        }
    },

    showError(message) {
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = '错误: ' + message;
            statusText.style.color = '#ff4444';
        }
        
        alert('初始化失败: ' + message);
    },

    getState() {
        return {
            data: this.dataModule.getState(),
            animation: {
                isRunning: this.animationModule.isAnimating(),
                isPaused: this.animationModule.isAnimationPaused()
            }
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    App.init();
}

export default App;