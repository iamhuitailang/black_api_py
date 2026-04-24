const BannerSlider = {
    currentIndex: 0,
    autoPlayInterval: null,
    isPlaying: false,
    options: {
        autoPlay: true,
        interval: 4000,
        transitionDuration: 500,
        touchEnabled: true
    },

    defaultBanners: [
        {
            id: 1,
            image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20peonies%20flowers%20blooming%20chinese%20garden%20spring%20sunset&image_size=landscape_16_9',
            title: '牡丹盛开',
            description: '春日里牡丹绽放，国色天香'
        },
        {
            id: 2,
            image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luoyang%20peony%20festival%20chinese%20traditional%20culture%20colorful%20flowers&image_size=landscape_16_9',
            title: '洛阳牡丹节',
            description: '千年古都，牡丹花开动京城'
        },
        {
            id: 3,
            image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20traditional%20art%20peonies%20painting%20elegant%20pink%20red%20flowers&image_size=landscape_16_9',
            title: '牡丹文化',
            description: '传承千年的牡丹艺术与文化'
        },
        {
            id: 4,
            image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=peony%20products%20souvenirs%20chinese%20crafts%20colorful%20display&image_size=landscape_16_9',
            title: '牡丹特色',
            description: '牡丹衍生产品与文旅服务'
        }
    ],

    init(options = {}) {
        this.options = { ...this.options, ...options };
        this.banners = this.options.banners || this.defaultBanners;
        this.sliderElement = document.getElementById('banner-slider');
        this.indicatorsContainer = document.getElementById('banner-indicators');
        this.prevButton = document.getElementById('banner-prev');
        this.nextButton = document.getElementById('banner-next');

        if (!this.sliderElement) {
            console.warn('Banner slider element not found');
            return;
        }

        this.render();
        this.bindEvents();
        
        if (this.options.autoPlay) {
            this.startAutoPlay();
        }
    },

    render() {
        if (!this.sliderElement) return;

        this.sliderElement.innerHTML = '';
        this.indicatorsContainer.innerHTML = '';

        this.banners.forEach((banner, index) => {
            const slide = this.createSlide(banner, index);
            this.sliderElement.appendChild(slide);

            const indicator = this.createIndicator(index);
            this.indicatorsContainer.appendChild(indicator);
        });

        this.updateSlider();
    },

    createSlide(banner, index) {
        const slide = document.createElement('div');
        slide.className = 'banner-slide';
        slide.dataset.index = index;

        const img = document.createElement('img');
        img.src = banner.image_url;
        img.alt = banner.title || 'Banner';
        img.className = 'lazy-image';
        img.loading = 'lazy';

        img.onload = () => {
            img.classList.add('loaded');
        };

        slide.appendChild(img);

        if (banner.title || banner.description) {
            const overlay = document.createElement('div');
            overlay.className = 'banner-overlay';

            if (banner.title) {
                const title = document.createElement('h3');
                title.textContent = banner.title;
                overlay.appendChild(title);
            }

            if (banner.description) {
                const desc = document.createElement('p');
                desc.textContent = banner.description;
                overlay.appendChild(desc);
            }

            slide.appendChild(overlay);
        }

        return slide;
    },

    createIndicator(index) {
        const indicator = document.createElement('div');
        indicator.className = 'banner-dot';
        if (index === this.currentIndex) {
            indicator.classList.add('active');
        }
        indicator.dataset.index = index;

        indicator.addEventListener('click', () => {
            this.goToSlide(index);
            if (this.isPlaying) {
                this.stopAutoPlay();
                this.startAutoPlay();
            }
        });

        return indicator;
    },

    bindEvents() {
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => {
                this.prevSlide();
                if (this.isPlaying) {
                    this.stopAutoPlay();
                    this.startAutoPlay();
                }
            });
        }

        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                this.nextSlide();
                if (this.isPlaying) {
                    this.stopAutoPlay();
                    this.startAutoPlay();
                }
            });
        }

        if (this.options.touchEnabled && this.sliderElement) {
            let startX = 0;
            let endX = 0;
            let isDragging = false;

            this.sliderElement.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                if (this.isPlaying) {
                    this.stopAutoPlay();
                }
            }, { passive: true });

            this.sliderElement.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                endX = e.touches[0].clientX;
            }, { passive: true });

            this.sliderElement.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;

                const diff = startX - endX;
                const threshold = 50;

                if (Math.abs(diff) > threshold) {
                    if (diff > 0) {
                        this.nextSlide();
                    } else {
                        this.prevSlide();
                    }
                }

                if (this.options.autoPlay) {
                    this.startAutoPlay();
                }
            });
        }

        if (this.sliderElement) {
            this.sliderElement.addEventListener('mouseenter', () => {
                if (this.isPlaying) {
                    this.stopAutoPlay();
                }
            });

            this.sliderElement.addEventListener('mouseleave', () => {
                if (this.options.autoPlay) {
                    this.startAutoPlay();
                }
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoPlay();
            } else if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        });
    },

    updateSlider() {
        if (!this.sliderElement) return;

        const offset = -this.currentIndex * 100;
        this.sliderElement.style.transform = `translateX(${offset}%)`;
        this.sliderElement.style.transition = `transform ${this.options.transitionDuration}ms ease`;

        const indicators = this.indicatorsContainer.querySelectorAll('.banner-dot');
        indicators.forEach((indicator, index) => {
            if (index === this.currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    },

    goToSlide(index) {
        if (index < 0) {
            index = this.banners.length - 1;
        } else if (index >= this.banners.length) {
            index = 0;
        }

        this.currentIndex = index;
        this.updateSlider();
    },

    nextSlide() {
        this.goToSlide(this.currentIndex + 1);
    },

    prevSlide() {
        this.goToSlide(this.currentIndex - 1);
    },

    startAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }

        this.isPlaying = true;
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.options.interval);
    },

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        this.isPlaying = false;
    },

    destroy() {
        this.stopAutoPlay();
        
        if (this.sliderElement) {
            this.sliderElement.innerHTML = '';
        }
        
        if (this.indicatorsContainer) {
            this.indicatorsContainer.innerHTML = '';
        }
    },

    refresh(banners) {
        this.banners = banners || this.defaultBanners;
        this.currentIndex = 0;
        this.render();
    },

    getCurrentBanner() {
        return this.banners[this.currentIndex];
    },

    getCurrentIndex() {
        return this.currentIndex;
    }
};

window.BannerSlider = BannerSlider;
