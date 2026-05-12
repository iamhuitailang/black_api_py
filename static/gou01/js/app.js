const App = {
    currentPage: 'profile',
    pageContainer: null,

    init() {
        this.pageContainer = document.getElementById('pageContainer');
        
        DogProfile.init();
        Schedule.init();
        Checkin.init();
        Calendar.init();
        Stats.init();
        
        if (NotificationManager.isSupported()) {
            NotificationManager.init();
        }
        
        BackgroundCanvas.init();
        
        this.bindEvents();
        
        const savedState = Storage.loadAppState();
        if (savedState.currentPage) {
            this.currentPage = savedState.currentPage;
        }
        
        this.renderPage(this.currentPage);
    },

    bindEvents() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.navigateTo(page);
            });
        });

        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        const modal = document.getElementById('modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    },

    navigateTo(page) {
        this.currentPage = page;
        Storage.saveAppState({
            currentPage: page,
            lastVisit: new Date().toISOString()
        });
        this.renderPage(page);
    },

    renderPage(page) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.page === page);
        });

        let content = '';
        switch (page) {
            case 'profile':
                content = DogProfile.render();
                break;
            case 'schedule':
                content = Schedule.render();
                break;
            case 'checkin':
                content = Checkin.render();
                break;
            case 'calendar':
                content = Calendar.render();
                break;
            case 'stats':
                content = Stats.render();
                break;
            default:
                content = DogProfile.render();
        }

        this.pageContainer.innerHTML = content;
    },

    showModal(content) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        if (modal && modalBody) {
            modalBody.innerHTML = content;
            modal.classList.add('active');
        }
    },

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});