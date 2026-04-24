const TabManager = {
    currentTab: 1,

    init() {
        this.bindEvents();
        this.setActiveTab(this.currentTab, false);
        console.log('🌸 TabManager initialized');
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            const tabNavItem = e.target.closest('.tab-nav-item');
            if (tabNavItem) {
                const tabId = parseInt(tabNavItem.dataset.tab);
                if (tabId) {
                    e.preventDefault();
                    this.setActiveTab(tabId);
                }
                return;
            }

            const bottomNavItem = e.target.closest('.bottom-nav-item');
            if (bottomNavItem) {
                const tabId = parseInt(bottomNavItem.dataset.tab);
                if (tabId) {
                    e.preventDefault();
                    this.setActiveTab(tabId);
                }
                return;
            }

            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                const tabId = parseInt(menuItem.dataset.tab);
                if (tabId) {
                    e.preventDefault();
                    this.setActiveTab(tabId);
                    if (window.MenuManager) {
                        MenuManager.close();
                    }
                }
                return;
            }
        });
    },

    setActiveTab(tabId, animate = true) {
        const previousTab = this.currentTab;
        if (previousTab === tabId) return;
        
        this.currentTab = tabId;

        this.updateNavigation(tabId);
        this.updateContent(tabId, animate);
        this.updateBottomNav(tabId);
        this.updateSideMenu(tabId);

        if (animate && previousTab !== tabId) {
            this.smoothScrollToTop();
        }

        if (typeof this.onTabChange === 'function') {
            this.onTabChange(tabId, previousTab);
        }
    },

    smoothScrollToTop() {
        const headerHeight = 56;
        const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0;
        const tabNavHeight = 48;
        
        const targetY = headerHeight + safeTop;
        
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    },

    updateNavigation(tabId) {
        const tabItems = document.querySelectorAll('.tab-nav-item');
        tabItems.forEach((item) => {
            const itemTabId = parseInt(item.dataset.tab);
            if (itemTabId === tabId) {
                item.classList.add('active');
                item.setAttribute('aria-selected', 'true');
            } else {
                item.classList.remove('active');
                item.setAttribute('aria-selected', 'false');
            }
        });

        const activeTab = document.querySelector('.tab-nav-item.active');
        if (activeTab && activeTab.parentElement) {
            const scrollContainer = activeTab.closest('.tab-nav-scroll');
            if (scrollContainer) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const tabRect = activeTab.getBoundingClientRect();
                
                if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
                    activeTab.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            }
        }
    },

    updateContent(tabId, animate = true) {
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach((content) => {
            const contentTabId = parseInt(content.id.replace('tab-', ''));
            if (parseInt(contentTabId) === tabId) {
                if (animate) {
                    content.style.opacity = '0';
                    content.style.transform = 'translateX(20px)';
                    content.classList.add('active');
                    
                    requestAnimationFrame(() => {
                        content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        content.style.opacity = '1';
                        content.style.transform = 'translateX(0)';
                    });
                } else {
                    content.classList.add('active');
                }

                if (window.AnimationManager) {
                    AnimationManager.observeContent(content);
                }
            } else {
                content.classList.remove('active');
                content.style.opacity = '';
                content.style.transform = '';
                content.style.transition = '';
            }
        });
    },

    updateBottomNav(tabId) {
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomNavItems.forEach((item) => {
            const itemTabId = parseInt(item.dataset.tab);
            if (itemTabId === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    updateSideMenu(tabId) {
        const sideMenuItems = document.querySelectorAll('.menu-item');
        sideMenuItems.forEach((item) => {
            const itemTabId = parseInt(item.dataset.tab);
            if (itemTabId === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    getCurrentTab() {
        return this.currentTab;
    },

    goToTab(tabId) {
        this.setActiveTab(tabId);
    },

    nextTab() {
        const tabs = Array.from(document.querySelectorAll('.tab-nav-item')).map(item => parseInt(item.dataset.tab));
        const currentIndex = tabs.indexOf(this.currentTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        this.setActiveTab(tabs[nextIndex]);
    },

    prevTab() {
        const tabs = Array.from(document.querySelectorAll('.tab-nav-item')).map(item => parseInt(item.dataset.tab));
        const currentIndex = tabs.indexOf(this.currentTab);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        this.setActiveTab(tabs[prevIndex]);
    }
};

const MenuManager = {
    sideMenu: null,
    menuOverlay: null,
    menuBtn: null,
    closeBtn: null,
    isOpen: false,

    init() {
        this.sideMenu = document.getElementById('side-menu');
        this.menuOverlay = document.getElementById('menu-overlay');
        this.menuBtn = document.getElementById('menu-btn');
        this.closeBtn = document.getElementById('close-menu');

        this.bindEvents();
    },

    bindEvents() {
        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => {
                this.toggle();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.close();
            });
        }

        if (this.menuOverlay) {
            this.menuOverlay.addEventListener('click', () => {
                this.close();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    open() {
        if (this.isOpen) return;

        this.isOpen = true;

        if (this.sideMenu) {
            this.sideMenu.classList.add('open');
        }

        if (this.menuOverlay) {
            this.menuOverlay.classList.add('show');
        }

        document.body.style.overflow = 'hidden';

        if (typeof this.onOpen === 'function') {
            this.onOpen();
        }
    },

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;

        if (this.sideMenu) {
            this.sideMenu.classList.remove('open');
        }

        if (this.menuOverlay) {
            this.menuOverlay.classList.remove('show');
        }

        document.body.style.overflow = '';

        if (typeof this.onClose === 'function') {
            this.onClose();
        }
    },

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
};

window.TabManager = TabManager;
window.MenuManager = MenuManager;
