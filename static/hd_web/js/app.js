(function() {
const { createApp, h, reactive } = Vue;

let vueApp = null;

const appState = reactive({
    isTransitioning: false,
    currentPage: 'home'
});

const App = {
    init() {
        this.registerRoutes();
        Router.init();
        GameStore.init();
    },

    registerRoutes() {
        Router.register('login', (params) => {
            if (AuthService.isLoggedIn()) {
                Router.navigate('home');
                return;
            }
            this.renderPage(LoginPageWrapper, 'login', params);
        });

        Router.register('register', (params) => {
            if (AuthService.isLoggedIn()) {
                Router.navigate('home');
                return;
            }
            this.renderPage(RegisterPageWrapper, 'register', params);
        });

        Router.register('home', (params) => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.renderPage(HomePageWrapper, 'home', params);
        });

        Router.register('skills', (params) => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.renderPage(SkillsPageWrapper, 'skills', params);
        });

        Router.register('equipment', (params) => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.renderPage(EquipmentPageWrapper, 'equipment', params);
        });

        Router.register('tools', (params) => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.renderPage(ToolsPageWrapper, 'tools', params);
        });

        Router.register('levels', (params) => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.renderPage(LevelsPageWrapper, 'levels', params);
        });

        Router.register('missions', (params) => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.renderPage(MissionsPageWrapper, 'missions', params);
        });

        Router.register('battle', (params) => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.renderPage(BattlePageWrapper, 'battle', params);
        });

        Router.register('game', (params) => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.renderPage(GamePageWrapper, 'game', params);
        });

        Router.register('profile', (params) => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.renderPage(ProfilePageWrapper, 'profile', params);
        });
    },

    renderPage(PageComponent, pageId, params = {}) {
        if (appState.currentPage === pageId && vueApp && JSON.stringify(appState.pageParams) === JSON.stringify(params)) {
            return;
        }
        appState.pageParams = params;

        appState.isTransitioning = true;

        const appContainer = document.getElementById('app');
        
        if (appContainer) {
            appContainer.style.opacity = '0';
            appContainer.style.transform = 'translateY(10px)';
            appContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }

        setTimeout(() => {
            if (vueApp) {
                vueApp.unmount();
            }

            appState.currentPage = pageId;

            if (appContainer) {
                appContainer.innerHTML = '';
            }

            vueApp = createApp(PageComponent);
            
            vueApp.config.globalProperties.$router = Router;
            vueApp.config.globalProperties.$auth = AuthService;
            vueApp.config.globalProperties.$gameStore = GameStore;
            vueApp.config.globalProperties.$toast = Toast;
            vueApp.config.globalProperties.$storage = HdStorage;

            vueApp.mount(appContainer);

            requestAnimationFrame(() => {
                if (appContainer) {
                    appContainer.style.opacity = '1';
                    appContainer.style.transform = 'translateY(0)';
                }
                appState.isTransitioning = false;
            });
        }, 150);
    }
};

const checkAuthAndRedirect = () => {
    const hash = window.location.hash.slice(1) || 'home';
    const path = hash.split('/')[0];
    
    const publicRoutes = ['login', 'register'];
    const isPublicRoute = publicRoutes.includes(path);
    
    if (!AuthService.isLoggedIn() && !isPublicRoute) {
        Router.navigate('login');
        return false;
    }
    
    if (AuthService.isLoggedIn() && isPublicRoute) {
        Router.navigate('home');
        return false;
    }
    
    return true;
};

document.addEventListener('DOMContentLoaded', () => {
    GameStore.init();
    
    if (!window.hdAppStyles) {
        const style = document.createElement('style');
        style.id = 'hd-app-styles';
        style.textContent = `
            #app {
                min-height: 100vh;
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            
            .page-enter-active,
            .page-leave-active {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            
            .page-enter-from {
                opacity: 0;
                transform: translateY(10px);
            }
            
            .page-leave-to {
                opacity: 0;
                transform: translateY(-10px);
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                }
            }
            
            .animate-fade-in {
                animation: fadeInUp 0.4s ease forwards;
            }
            
            .animate-slide-in {
                animation: slideInRight 0.3s ease forwards;
            }
            
            .animate-pulse {
                animation: pulse 2s ease-in-out infinite;
            }
            
            .battle-page,
            .game-page,
            .profile-page {
                max-width: 1200px;
                margin: 0 auto;
                animation: fadeInUp 0.4s ease;
            }
            
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .section-subtitle {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .btn-sm {
                padding: 6px 12px;
                font-size: 12px;
            }
            
            .btn-secondary {
                background-color: var(--gray-color);
                color: white;
            }
            
            .btn-secondary:hover {
                background-color: #5a6268;
            }
            
            .btn-danger {
                background-color: var(--danger-color);
                color: white;
            }
            
            .btn-danger:hover {
                background-color: #c82333;
            }
            
            .battle-modes-grid,
            .game-modes-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .battle-mode-card,
            .game-mode-card {
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 20px 16px;
                text-align: center;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.3s ease;
                box-shadow: var(--shadow);
            }
            
            .battle-mode-card:hover,
            .game-mode-card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-lg);
            }
            
            .battle-mode-card.active,
            .game-mode-card.active {
                border-width: 2px;
                transform: translateY(-2px);
            }
            
            .mode-icon {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                margin: 0 auto 12px;
            }
            
            .mode-name {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
            }
            
            .mode-desc {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .quick-match-section {
                margin-bottom: 20px;
            }
            
            .quick-match-btn {
                font-size: 18px;
                padding: 16px;
            }
            
            .matching-progress {
                margin-top: 12px;
            }
            
            .matching-text {
                text-align: center;
                color: var(--text-secondary);
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .progress-bar {
                height: 8px;
                background-color: var(--bg-color);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-color), #ff8c5a);
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .stats-section {
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: var(--shadow);
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
            }
            
            .stat-card {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background-color: var(--bg-color);
                border-radius: var(--radius);
            }
            
            .stat-icon {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }
            
            .stat-info {
                flex: 1;
            }
            
            .stat-value {
                font-size: 20px;
                font-weight: 700;
                color: var(--text-primary);
            }
            
            .stat-label {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .user-rank-badge {
                margin-top: 16px;
                padding: 12px;
                background: linear-gradient(135deg, var(--primary-color), #ff8c5a);
                border-radius: var(--radius);
                text-align: center;
                color: white;
                font-weight: 600;
            }
            
            .online-players-section,
            .leaderboard-section,
            .battle-records-section {
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: var(--shadow);
            }
            
            .online-players-list,
            .leaderboard-list,
            .battle-records-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .player-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background-color: var(--bg-color);
                border-radius: var(--radius);
                transition: all 0.3s ease;
            }
            
            .player-item.offline {
                opacity: 0.5;
            }
            
            .player-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                flex-shrink: 0;
            }
            
            .player-info {
                flex: 1;
            }
            
            .player-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .online-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: var(--text-muted);
            }
            
            .online-status.online {
                background-color: var(--success-color);
            }
            
            .player-level {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .leaderboard-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background-color: var(--bg-color);
                border-radius: var(--radius);
            }
            
            .rank-badge {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 14px;
                background-color: var(--gray-color);
                color: white;
                flex-shrink: 0;
            }
            
            .rank-badge.rank-1 {
                background: linear-gradient(135deg, #ffd700, #ffb700);
            }
            
            .rank-badge.rank-2 {
                background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
            }
            
            .rank-badge.rank-3 {
                background: linear-gradient(135deg, #cd7f32, #b87333);
            }
            
            .win-rate {
                font-weight: 600;
                color: var(--primary-color);
                font-size: 14px;
            }
            
            .battle-record-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background-color: var(--bg-color);
                border-radius: var(--radius);
            }
            
            .record-result {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 14px;
                flex-shrink: 0;
            }
            
            .record-result.win {
                background-color: rgba(40, 167, 69, 0.1);
                color: var(--success-color);
            }
            
            .record-result.lose {
                background-color: rgba(220, 53, 69, 0.1);
                color: var(--danger-color);
            }
            
            .record-info {
                flex: 1;
            }
            
            .record-opponent {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .record-meta {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .record-rewards {
                display: flex;
                flex-direction: column;
                gap: 2px;
                align-items: flex-end;
            }
            
            .reward-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .battle-result-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.7);
            }
            
            .modal-content {
                position: relative;
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 24px;
                width: 90%;
                max-width: 400px;
                animation: fadeInUp 0.3s ease;
            }
            
            .result-header {
                text-align: center;
                padding: 20px;
                border-radius: var(--radius);
                margin-bottom: 20px;
            }
            
            .result-header.win {
                background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.2));
            }
            
            .result-header.lose {
                background: linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(220, 53, 69, 0.2));
            }
            
            .result-icon {
                font-size: 48px;
                margin-bottom: 8px;
            }
            
            .result-title {
                font-size: 24px;
                font-weight: 700;
                color: var(--text-primary);
            }
            
            .result-body {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .result-opponent {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                margin-bottom: 12px;
            }
            
            .opponent-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 18px;
            }
            
            .vs-text {
                font-size: 18px;
                font-weight: 700;
                color: var(--text-secondary);
            }
            
            .result-opponent-name {
                font-size: 14px;
                color: var(--text-secondary);
            }
            
            .result-rewards {
                background-color: var(--bg-color);
                border-radius: var(--radius);
                padding: 16px;
                margin-bottom: 20px;
            }
            
            .reward-title {
                text-align: center;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 12px;
            }
            
            .reward-items {
                display: flex;
                justify-content: center;
                gap: 24px;
            }
            
            .reward-item-large {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }
            
            .reward-icon {
                font-size: 24px;
            }
            
            .reward-value {
                font-size: 20px;
                font-weight: 700;
                color: var(--primary-color);
            }
            
            .reward-label {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .game-controls-info {
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: var(--shadow);
            }
            
            .controls-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
            }
            
            .control-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 12px;
                background-color: var(--bg-color);
                border-radius: var(--radius);
            }
            
            .key {
                display: inline-block;
                padding: 4px 10px;
                background-color: var(--dark-color);
                color: white;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                font-family: monospace;
            }
            
            .control-desc {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .start-game-btn {
                font-size: 18px;
                padding: 16px;
            }
            
            .game-container {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .game-hud {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 16px 20px;
                box-shadow: var(--shadow);
            }
            
            .hud-left,
            .hud-right {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .hud-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
            }
            
            .hud-icon {
                font-size: 18px;
            }
            
            .hud-value {
                font-weight: 700;
                color: var(--text-primary);
            }
            
            .hud-center {
                text-align: center;
            }
            
            .mission-info {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 4px;
            }
            
            .mission-title {
                font-size: 16px;
                font-weight: 700;
                color: var(--text-primary);
            }
            
            .mission-progress {
                font-size: 14px;
                font-weight: 600;
                color: var(--primary-color);
            }
            
            .mission-desc {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .chakra-bar {
                min-width: 200px;
            }
            
            .chakra-label {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-bottom: 4px;
            }
            
            .chakra-progress {
                height: 8px;
                background-color: var(--bg-color);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .chakra-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .chakra-fill.invisible {
                background: linear-gradient(90deg, #4ecdc4, #44a08d);
            }
            
            .invisible-status {
                text-align: center;
                font-size: 12px;
                color: #4ecdc4;
                font-weight: 600;
                padding: 4px 8px;
                background-color: rgba(78, 205, 196, 0.1);
                border-radius: 4px;
            }
            
            .detection-status {
                text-align: center;
                font-size: 12px;
                color: var(--danger-color);
                font-weight: 600;
            }
            
            .game-canvas-container {
                background-color: #1a1a2e;
                border-radius: var(--radius-lg);
                padding: 16px;
                box-shadow: var(--shadow-lg);
                display: flex;
                justify-content: center;
                overflow: hidden;
            }
            
            .game-canvas {
                border-radius: var(--radius);
                max-width: 100%;
                height: auto;
                cursor: crosshair;
            }
            
            .game-controls {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .skills-bar {
                display: flex;
                justify-content: center;
                gap: 12px;
                padding: 16px;
                background-color: white;
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow);
            }
            
            .skill-slot {
                position: relative;
                width: 60px;
                height: 60px;
                border-radius: var(--radius);
                background-color: var(--bg-color);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 2px solid transparent;
            }
            
            .skill-slot:hover {
                transform: translateY(-2px);
                border-color: var(--primary-color);
            }
            
            .skill-slot.empty {
                opacity: 0.3;
                cursor: not-allowed;
            }
            
            .skill-slot.cooldown {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .skill-icon {
                font-size: 28px;
            }
            
            .skill-key {
                position: absolute;
                top: 2px;
                right: 4px;
                font-size: 10px;
                font-weight: 700;
                color: var(--text-muted);
            }
            
            .skill-cooldown-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.7);
                border-radius: var(--radius);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: 700;
                color: white;
            }
            
            .skill-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                padding: 6px 10px;
                background-color: var(--dark-color);
                color: white;
                font-size: 12px;
                border-radius: 4px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s ease;
                margin-bottom: 4px;
            }
            
            .skill-slot:hover .skill-tooltip {
                opacity: 1;
            }
            
            .mobile-controls {
                display: none;
                justify-content: space-between;
                padding: 16px;
                background-color: white;
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow);
            }
            
            .direction-pad {
                display: flex;
                gap: 8px;
            }
            
            .dir-btn {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background-color: var(--bg-color);
                border: none;
                font-size: 20px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.1s ease;
            }
            
            .dir-btn:active {
                background-color: var(--primary-color);
                color: white;
                transform: scale(0.95);
            }
            
            .dir-btn.jump {
                background-color: var(--primary-color);
                color: white;
            }
            
            .action-pad {
                display: flex;
                gap: 8px;
            }
            
            .action-btn {
                padding: 8px 16px;
                border-radius: var(--radius);
                border: none;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.1s ease;
            }
            
            .action-btn.attack {
                background-color: var(--primary-color);
                color: white;
            }
            
            .action-btn.skill {
                background-color: #667eea;
                color: white;
            }
            
            .action-btn.assassinate {
                background-color: var(--danger-color);
                color: white;
            }
            
            .action-btn:active {
                transform: scale(0.95);
            }
            
            .game-result {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 60vh;
            }
            
            .result-card {
                width: 100%;
                max-width: 400px;
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 32px 24px;
                box-shadow: var(--shadow-lg);
                animation: fadeInUp 0.4s ease;
            }
            
            .result-card.win .result-header {
                background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.2));
            }
            
            .result-card.lose .result-header {
                background: linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(220, 53, 69, 0.2));
            }
            
            .result-stats {
                margin-bottom: 20px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid var(--border-color);
            }
            
            .stat-row:last-child {
                border-bottom: none;
            }
            
            .result-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .profile-header {
                display: flex;
                align-items: center;
                gap: 16px;
                background: linear-gradient(135deg, var(--primary-color), #ff8c5a);
                color: white;
                padding: 24px;
                border-radius: var(--radius-lg);
                margin-bottom: 20px;
                box-shadow: var(--shadow);
            }
            
            .profile-avatar-large {
                width: 72px;
                height: 72px;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                font-weight: 700;
            }
            
            .profile-info {
                flex: 1;
            }
            
            .profile-name {
                font-size: 20px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .profile-level {
                font-size: 12px;
                padding: 2px 8px;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                font-weight: 500;
            }
            
            .profile-username {
                font-size: 14px;
                opacity: 0.8;
                margin-top: 2px;
            }
            
            .exp-card {
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: var(--shadow);
            }
            
            .exp-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .exp-label {
                color: var(--text-secondary);
            }
            
            .exp-value {
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .exp-bar {
                height: 10px;
                background-color: var(--bg-color);
                border-radius: 5px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .exp-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-color), #ff8c5a);
                border-radius: 5px;
                transition: width 0.5s ease;
            }
            
            .exp-text {
                text-align: center;
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .profile-tabs {
                display: flex;
                gap: 4px;
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 4px;
                margin-bottom: 20px;
                box-shadow: var(--shadow);
                overflow-x: auto;
            }
            
            .tab-item {
                flex: 1;
                min-width: 80px;
                padding: 12px 16px;
                text-align: center;
                border-radius: var(--radius);
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-secondary);
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            
            .tab-item:hover {
                background-color: var(--bg-color);
            }
            
            .tab-item.active {
                background-color: var(--primary-color);
                color: white;
            }
            
            .tab-content {
                background-color: white;
                border-radius: var(--radius-lg);
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: var(--shadow);
                animation: fadeInUp 0.3s ease;
            }
            
            .info-section {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid var(--border-color);
            }
            
            .info-item:last-child {
                border-bottom: none;
            }
            
            .info-label {
                color: var(--text-secondary);
                font-size: 14px;
            }
            
            .info-value {
                font-weight: 600;
                color: var(--text-primary);
                font-size: 14px;
            }
            
            .edit-form .form-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            .attributes-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .attribute-card {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background-color: var(--bg-color);
                border-radius: var(--radius);
            }
            
            .attr-icon {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            .attr-name {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .attr-value {
                font-size: 20px;
                font-weight: 700;
                color: var(--text-primary);
            }
            
            .currency-section {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            .currency-card {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1));
                border-radius: var(--radius);
            }
            
            .currency-icon {
                font-size: 32px;
            }
            
            .currency-name {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .currency-value {
                font-size: 20px;
                font-weight: 700;
                color: var(--primary-color);
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .stat-card-large {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 24px 16px;
                background-color: var(--bg-color);
                border-radius: var(--radius-lg);
            }
            
            .stat-icon-large {
                font-size: 36px;
            }
            
            .stat-number {
                font-size: 28px;
                font-weight: 700;
                color: var(--primary-color);
            }
            
            .stat-label {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .achievement-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .achievement-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background-color: var(--bg-color);
                border-radius: var(--radius);
            }
            
            .achievement-icon {
                font-size: 32px;
                flex-shrink: 0;
            }
            
            .achievement-info {
                flex: 1;
            }
            
            .achievement-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
            }
            
            .achievement-desc {
                font-size: 12px;
                color: var(--text-secondary);
                margin-bottom: 8px;
            }
            
            .achievement-progress-bar {
                height: 6px;
                background-color: white;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .achievement-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-color), #ff8c5a);
                border-radius: 3px;
                transition: width 0.5s ease;
            }
            
            .achievement-status {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-secondary);
                flex-shrink: 0;
            }
            
            .achievement-status.done {
                color: var(--success-color);
            }
            
            .security-section {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .security-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px;
                background-color: var(--bg-color);
                border-radius: var(--radius);
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .security-item:hover {
                background-color: rgba(255, 107, 53, 0.05);
            }
            
            .security-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .security-icon {
                font-size: 28px;
            }
            
            .security-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .security-desc {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .security-arrow {
                font-size: 14px;
                color: var(--text-secondary);
            }
            
            .password-form {
                padding: 20px;
                background-color: var(--bg-color);
                border-radius: var(--radius);
                margin-top: -8px;
            }
            
            .logout-section {
                margin-top: 20px;
            }
            
            @media (max-width: 768px) {
                .battle-modes-grid,
                .game-modes-grid {
                    grid-template-columns: repeat(3, 1fr);
                }
                
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .controls-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .game-hud {
                    flex-direction: column;
                    gap: 12px;
                }
                
                .hud-center {
                    order: -1;
                }
                
                .mobile-controls {
                    display: flex;
                }
                
                .skills-bar {
                    overflow-x: auto;
                }
                
                .skill-slot {
                    min-width: 60px;
                }
                
                .attributes-grid,
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .profile-header {
                    flex-direction: column;
                    text-align: center;
                }
                
                .profile-tabs {
                    overflow-x: auto;
                }
                
                .tab-item {
                    flex-shrink: 0;
                }
            }
            
            @media (max-width: 480px) {
                .battle-modes-grid,
                .game-modes-grid {
                    grid-template-columns: 1fr;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .chakra-bar {
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(style);
        window.hdAppStyles = true;
    }
    
    App.init();
});

window.App = App;
})();
