const AnimationManager = {
    observedElements: [],
    intersectionObserver: null,
    lazyImages: [],
    petalInterval: null,
    isInitialized: false,

    init() {
        if (this.isInitialized) return;
        
        this.setupIntersectionObserver();
        this.setupLazyLoading();
        this.setupScrollAnimations();
        this.setupImageFadeIn();
        
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            this.observeContent(activeTab);
        }
        
        this.isInitialized = true;
        console.log('🌸 AnimationManager initialized');
    },

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, options);
    },

    observeContent(contentElement) {
        const animatedElements = contentElement.querySelectorAll(
            '.animate-on-scroll, .reveal-left, .reveal-right, .reveal-up, .reveal-zoom, .stagger-children, .content-card, .variety-item, .product-card, .meaning-item, .info-item, .story-card, .legend-card, .culture-card, .attraction-item, .specialty-item'
        );

        animatedElements.forEach((element, index) => {
            if (!element.classList.contains('animate-on-scroll')) {
                element.classList.add('animate-on-scroll');
            }
            element.style.transitionDelay = `${index * 0.05}s`;
            this.intersectionObserver.observe(element);
        });

        const staggerContainers = contentElement.querySelectorAll('.stagger-children');
        staggerContainers.forEach((container) => {
            const children = container.children;
            Array.from(children).forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`;
            });
        });
    },

    animateElement(element) {
        element.classList.add('visible');
        
        const animationClass = this.getAnimationClass(element);
        if (animationClass) {
            element.classList.add(animationClass);
        }
    },

    getAnimationClass(element) {
        if (element.classList.contains('reveal-left')) return 'fade-in-left';
        if (element.classList.contains('reveal-right')) return 'fade-in-right';
        if (element.classList.contains('reveal-up')) return 'fade-in-up';
        if (element.classList.contains('reveal-zoom')) return 'scale-in';
        return 'fade-in-up';
    },

    setupLazyLoading() {
        this.lazyImages = document.querySelectorAll('.lazy-image');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.handleImageVisibility(entry.target);
                    imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px 0px'
        });

        this.lazyImages.forEach((img) => {
            if (img.dataset.src) {
                imageObserver.observe(img);
            } else {
                this.handleImageDirectSrc(img);
            }
        });
    },

    handleImageDirectSrc(img) {
        if (img.complete) {
            this.handleImageLoaded(img);
        } else {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.6s ease';
            
            img.addEventListener('load', () => {
                this.handleImageLoaded(img);
            });
            
            img.addEventListener('error', () => {
                console.warn('Image failed to load:', img.src);
                img.style.opacity = '1';
            });
        }
    },

    handleImageVisibility(img) {
        if (img.dataset.src) {
            img.src = img.dataset.src;
        }
        
        if (img.complete) {
            this.handleImageLoaded(img);
        } else {
            img.addEventListener('load', () => {
                this.handleImageLoaded(img);
            });
            
            img.addEventListener('error', () => {
                console.warn('Image failed to load:', img.src);
                img.classList.add('loaded');
            });
        }
    },

    handleImageLoaded(img) {
        requestAnimationFrame(() => {
            img.classList.add('loaded');
        });
    },

    setupScrollAnimations() {
        let lastScrollTop = 0;
        let ticking = false;

        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
            
            lastScrollTop = scrollTop;
            
            this.updateHeaderOnScroll(scrollTop, scrollDirection);
            this.updateParallaxElements(scrollTop);
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    },

    updateHeaderOnScroll(scrollTop, direction) {
        const header = document.querySelector('.app-header');
        const tabNav = document.querySelector('.tab-nav-section');
        
        if (!header) return;

        if (scrollTop > 10) {
            header.style.boxShadow = 'var(--shadow-md)';
        } else {
            header.style.boxShadow = '';
        }
    },

    updateParallaxElements(scrollTop) {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach((element) => {
            const speed = parseFloat(element.dataset.speed) || 0.5;
            const yPos = -(scrollTop * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    },

    setupImageFadeIn() {
        const images = document.querySelectorAll('img:not(.lazy-image)');
        
        images.forEach((img) => {
            if (img.complete) {
                img.style.opacity = '1';
            } else {
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.5s ease';
                
                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                });
            }
        });
    },

    createPetalRain(count = 10) {
        const petals = ['🌸', '🌺', '🌷', '💮', '🏵️'];
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createSinglePetal(petals);
            }, i * 300);
        }
    },

    createSinglePetal(petals) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.textContent = Utils.randomChoice(petals);
        
        const startX = Utils.randomFloat(0, window.innerWidth);
        const duration = Utils.randomFloat(3, 6);
        const rotation = Utils.random(0, 720);
        const size = Utils.randomFloat(16, 28);
        
        petal.style.left = `${startX}px`;
        petal.style.fontSize = `${size}px`;
        petal.style.animationDuration = `${duration}s`;
        petal.style.animationDelay = `${Utils.randomFloat(0, 0.5)}s`;
        
        document.body.appendChild(petal);
        
        setTimeout(() => {
            petal.remove();
        }, (duration + 1) * 1000);
    },

    startPetalRain() {
        if (this.petalInterval) return;
        
        this.petalInterval = setInterval(() => {
            this.createSinglePetal(['🌸', '🌺', '🌷']);
        }, 2000);
    },

    stopPetalRain() {
        if (this.petalInterval) {
            clearInterval(this.petalInterval);
            this.petalInterval = null;
        }
    },

    addRippleEffect(element, event) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    },

    setupRippleButtons() {
        const rippleButtons = document.querySelectorAll('.ripple, .btn');
        
        rippleButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                this.addRippleEffect(button, e);
            });
        });
    },

    pulseElement(element, duration = 1000) {
        element.style.animation = `pulse ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    },

    shakeElement(element, duration = 500) {
        element.style.animation = `shake ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    },

    bounceElement(element, duration = 1000) {
        element.style.animation = `bounce ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    },

    fadeIn(element, duration = 300) {
        return new Promise((resolve) => {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
            
            setTimeout(resolve, duration);
        });
    },

    fadeOut(element, duration = 300) {
        return new Promise((resolve) => {
            element.style.opacity = '1';
            element.style.transition = `opacity ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '0';
            });
            
            setTimeout(resolve, duration);
        });
    },

    slideUp(element, duration = 300) {
        return new Promise((resolve) => {
            element.style.transform = 'translateY(100%)';
            element.style.transition = `transform ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.transform = 'translateY(0)';
            });
            
            setTimeout(resolve, duration);
        });
    },

    slideDown(element, duration = 300) {
        return new Promise((resolve) => {
            element.style.transform = 'translateY(0)';
            element.style.transition = `transform ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.transform = 'translateY(100%)';
            });
            
            setTimeout(resolve, duration);
        });
    },

    getScrollProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    },

    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        this.stopPetalRain();
    }
};

window.AnimationManager = AnimationManager;
