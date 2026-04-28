(function() {
    'use strict';

    const STORAGE_KEYS = {
        STORIES: 'gushi_stories',
        THEME: 'gushi_theme',
        STATE: 'gushi_state'
    };

    const DEFAULT_STORIES = [
        {
            id: 'default_1',
            title: '小兔子找月亮',
            cover: '🐰',
            content: '在一个宁静的夜晚，小兔子睡不着觉，她看着窗外圆圆的月亮，心里想："月亮上面是什么样子呢？"\n\n小兔子穿好衣服，走出了家门。她走过了青草地，草地在月光下闪闪发光，像撒了一地的银粉。她走过了小池塘，池塘里的月亮倒影跟着她一起移动。\n\n"小兔子，这么晚了，你要去哪里呀？"猫头鹰爷爷从树上探出头来问。\n\n"猫头鹰爷爷，我想去月亮上看看！"小兔子兴奋地说。\n\n猫头鹰爷爷笑着说："月亮离我们很远很远，但是如果你愿意，我们可以一起聊聊月亮的故事。"\n\n于是，小兔子坐在猫头鹰爷爷旁边，听他讲了好多好多关于月亮的传说。有嫦娥奔月，有吴刚伐桂，还有玉兔捣药的故事。\n\n小兔子听着听着，眼睛开始犯困了。她打了个大大的哈欠，说："猫头鹰爷爷，月亮上的故事真好听。我现在想回家睡觉了，也许我会在梦里飞到月亮上去呢。"\n\n猫头鹰爷爷点点头，说："去吧，好孩子。做个好梦。"\n\n小兔子回到家里，躺到柔软的小床上，很快就进入了甜甜的梦乡。在梦里，她真的飞到了月亮上，和小玉兔一起玩耍呢。',
            isFavorite: true,
            createdAt: Date.now() - 86400000 * 3
        },
        {
            id: 'default_2',
            title: '小熊的蜂蜜罐',
            cover: '🐻',
            content: '小熊有一个心爱的蜂蜜罐，那是奶奶在他生日那天送给他的礼物。蜂蜜罐是金黄色的，上面画着可爱的小蜜蜂图案。\n\n每天早上，小熊都会打开蜂蜜罐，用小小的木勺舀出一勺甜甜的蜂蜜，抹在面包上吃。那蜂蜜甜滋滋的，带着花朵的清香，是小熊最喜欢的味道。\n\n有一天，小熊发现蜂蜜罐快要空了。他想："我得去森林里找更多的蜂蜜。"\n\n于是，小熊带上他的小篮子，出发去森林深处。他走着走着，听到了嗡嗡嗡的声音。抬头一看，树上有一个大大的蜂巢！\n\n"太好了！"小熊兴奋地想。但是他想起妈妈说过，不能随便拿蜜蜂的蜂蜜，因为那是蜜蜂们辛苦劳动的成果。\n\n小熊想了想，决定去找蜜蜂们商量。他对着蜂巢大声说："蜜蜂朋友们，你们好！我是小熊，我可以用我的东西和你们交换一些蜂蜜吗？"\n\n蜜蜂们听到了，飞出来围着小熊转了几圈。蜂王说："小熊，我们需要很多很多的花朵来酿蜜。如果你能帮我们找到一片开满鲜花的草地，我们就送给你一些蜂蜜。"\n\n小熊高兴地答应了。他找啊找，终于在山脚下找到了一片美丽的花田，那里开满了各种各样的鲜花，有向日葵、有蒲公英、还有紫罗兰。\n\n蜜蜂们跟着小熊来到花田，开心地采起蜜来。作为感谢，蜜蜂们送给小熊满满一罐香甜的蜂蜜。\n\n小熊抱着蜂蜜罐，高高兴兴地回家了。他明白了，只有通过自己的努力和帮助别人，才能得到最甜美的果实。',
            isFavorite: false,
            createdAt: Date.now() - 86400000 * 2
        },
        {
            id: 'default_3',
            title: '星星的愿望',
            cover: '🌟',
            content: '在高高的天空上，住着一颗小星星。每天晚上，小星星都会眨着眼睛，看着下面的世界。\n\n小星星看到小朋友们在院子里数星星，听到他们说："看那颗最亮的星星！它一定是在对着我们笑呢。"\n\n小星星听了，心里暖暖的。但是它也有一个小小的愿望：它想亲自去下面的世界看看，看看小朋友们的家是什么样子的，看看他们的玩具是什么样子的。\n\n有一天，小星星问月亮婆婆："月亮婆婆，我可以去下面的世界看看吗？"\n\n月亮婆婆温柔地说："小星星，我们住在天上，是不能随便去下面的世界的。但是，如果你愿意，你可以成为一颗流星，许一个愿望。"\n\n小星星想了想，说："我希望能让一个小朋友的愿望成真。"\n\n月亮婆婆笑了，说："好孩子，那你就准备好，当你划过天空的时候，会有人对你许愿的。"\n\n那天晚上，小星星鼓起勇气，从天上跳了下来。它变成了一颗闪亮的流星，拖着长长的尾巴划过夜空。\n\n就在这时，一个小女孩正躺在床上，看着窗外。她看到了流星，赶紧闭上眼睛许愿："我希望我的奶奶能快点好起来。"\n\n小星星听到了这个愿望，它感到自己的光芒变得更亮了。它把所有的力量都集中起来，送到了小女孩奶奶的身边。\n\n第二天，小女孩的奶奶真的感觉好多了。医生说这是一个奇迹。\n\n小星星虽然回到了天上，但它知道自己完成了一个美好的使命。从此以后，每天晚上，它都会更加努力地闪烁，为每一个许愿的人送去祝福。\n\n因为小星星明白了，最美好的愿望，就是让别人快乐。',
            isFavorite: true,
            createdAt: Date.now() - 86400000
        }
    ];

    const Utils = {
        generateId() {
            return 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        formatDate(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            const days = Math.floor(diff / 86400000);
            
            if (days === 0) return '今天';
            if (days === 1) return '昨天';
            if (days < 7) return `${days}天前`;
            return date.toLocaleDateString('zh-CN');
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        formatContent(content) {
            return content
                .split('\n\n')
                .map(p => `<p>${this.escapeHtml(p)}</p>`)
                .join('');
        }
    };

    const Storage = {
        getStories() {
            try {
                const data = localStorage.getItem(STORAGE_KEYS.STORIES);
                if (data) {
                    return JSON.parse(data);
                }
            } catch (e) {
                console.error('读取故事失败:', e);
            }
            return [...DEFAULT_STORIES];
        },

        saveStories(stories) {
            try {
                localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
            } catch (e) {
                console.error('保存故事失败:', e);
            }
        },

        getTheme() {
            return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
        },

        saveTheme(theme) {
            localStorage.setItem(STORAGE_KEYS.THEME, theme);
        },

        getState() {
            try {
                const data = localStorage.getItem(STORAGE_KEYS.STATE);
                if (data) {
                    return JSON.parse(data);
                }
            } catch (e) {
                console.error('读取状态失败:', e);
            }
            return {
                currentFilter: 'all',
                scrollPosition: 0,
                activeModal: null,
                currentStoryId: null,
                editingStoryId: null,
                formDraft: {
                    title: '',
                    content: '',
                    cover: '🐻'
                },
                readingScrollPosition: 0
            };
        },

        saveState(state) {
            try {
                localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
            } catch (e) {
                console.error('保存状态失败:', e);
            }
        }
    };

    const CanvasBackground = {
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        stars: [],
        clouds: [],
        moon: null,
        animationId: null,
        isDark: false,

        init() {
            this.canvas = document.getElementById('bg-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.initElements();
            this.startAnimation();

            window.addEventListener('resize', Utils.debounce(() => {
                this.resize();
                this.initElements();
            }, 250));
        },

        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width * window.devicePixelRatio;
            this.canvas.height = this.height * window.devicePixelRatio;
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        },

        setTheme(isDark) {
            this.isDark = isDark;
        },

        initElements() {
            this.stars = [];
            this.clouds = [];

            const starCount = Math.floor(this.width * this.height / 15000);
            for (let i = 0; i < starCount; i++) {
                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height * 0.6,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random(),
                    speed: Math.random() * 0.02 + 0.005,
                    phase: Math.random() * Math.PI * 2
                });
            }

            const cloudCount = Math.floor(this.width / 300) + 2;
            for (let i = 0; i < cloudCount; i++) {
                this.clouds.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height * 0.3 + 20,
                    width: Math.random() * 150 + 100,
                    speed: Math.random() * 0.3 + 0.1
                });
            }

            this.moon = {
                x: this.width * 0.8,
                y: this.height * 0.12,
                radius: Math.min(this.width, this.height) * 0.04,
                glow: 0
            };
        },

        startAnimation() {
            const animate = () => {
                this.draw();
                this.animationId = requestAnimationFrame(animate);
            };
            animate();
        },

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            if (this.isDark) {
                const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#1a1625');
                gradient.addColorStop(0.5, '#2d2640');
                gradient.addColorStop(1, '#3d344d');
                ctx.fillStyle = gradient;
            } else {
                const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#FFF8F0');
                gradient.addColorStop(0.5, '#FFE4E1');
                gradient.addColorStop(1, '#F5EBE0');
                ctx.fillStyle = gradient;
            }
            ctx.fillRect(0, 0, this.width, this.height);

            this.drawClouds(ctx);
            this.drawStars(ctx);
            this.drawMoon(ctx);
        },

        drawStars(ctx) {
            const time = Date.now() / 1000;
            
            this.stars.forEach(star => {
                const opacity = 0.3 + 0.7 * Math.abs(Math.sin(time * star.speed + star.phase));
                const size = star.size * (0.8 + 0.4 * Math.sin(time * star.speed * 2 + star.phase));
                
                ctx.beginPath();
                ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
                
                if (this.isDark) {
                    ctx.fillStyle = `rgba(255, 255, 200, ${opacity})`;
                } else {
                    ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.3})`;
                }
                ctx.fill();
            });
        },

        drawClouds(ctx) {
            this.clouds.forEach(cloud => {
                cloud.x += cloud.speed;
                if (cloud.x > this.width + cloud.width) {
                    cloud.x = -cloud.width;
                }

                ctx.beginPath();
                const y = cloud.y;
                const w = cloud.width;
                const h = w * 0.4;

                if (this.isDark) {
                    ctx.fillStyle = 'rgba(61, 52, 77, 0.5)';
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                }

                ctx.beginPath();
                ctx.arc(cloud.x + w * 0.2, y + h * 0.6, h * 0.5, 0, Math.PI * 2);
                ctx.arc(cloud.x + w * 0.4, y + h * 0.4, h * 0.6, 0, Math.PI * 2);
                ctx.arc(cloud.x + w * 0.6, y + h * 0.5, h * 0.55, 0, Math.PI * 2);
                ctx.arc(cloud.x + w * 0.8, y + h * 0.6, h * 0.45, 0, Math.PI * 2);
                ctx.fill();
            });
        },

        drawMoon(ctx) {
            if (!this.moon) return;

            const { x, y, radius } = this.moon;
            const time = Date.now() / 1000;
            
            const glowRadius = radius * (2 + 0.3 * Math.sin(time * 0.5));
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
            
            if (this.isDark) {
                glowGradient.addColorStop(0, 'rgba(255, 250, 200, 0.4)');
                glowGradient.addColorStop(0.5, 'rgba(255, 250, 200, 0.1)');
                glowGradient.addColorStop(1, 'rgba(255, 250, 200, 0)');
            } else {
                glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.2)');
                glowGradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.05)');
                glowGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            }

            ctx.beginPath();
            ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            
            if (this.isDark) {
                const moonGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
                moonGradient.addColorStop(0, '#FFFACD');
                moonGradient.addColorStop(1, '#F0E68C');
                ctx.fillStyle = moonGradient;
            } else {
                const moonGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
                moonGradient.addColorStop(0, '#FFFEF0');
                moonGradient.addColorStop(1, '#FFF8DC');
                ctx.fillStyle = moonGradient;
            }
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x + radius * 0.3, y - radius * 0.2, radius * 0.1, 0, Math.PI * 2);
            ctx.arc(x - radius * 0.2, y + radius * 0.3, radius * 0.08, 0, Math.PI * 2);
            ctx.fillStyle = this.isDark ? 'rgba(240, 230, 140, 0.5)' : 'rgba(255, 248, 220, 0.5)';
            ctx.fill();
        }
    };

    const Toast = {
        container: null,

        init() {
            this.container = document.getElementById('toast-container');
        },

        show(message, type = 'info') {
            const icons = {
                success: '✓',
                error: '✗',
                warning: '⚠',
                info: 'ℹ'
            };

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${Utils.escapeHtml(message)}</span>
            `;

            this.container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'toastSlideIn 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    };

    const App = {
        stories: [],
        currentFilter: 'all',
        currentStory: null,
        editingStory: null,
        selectedCover: '🐻',
        deleteTargetId: null,

        elements: {},

        init() {
            this.cacheElements();
            this.loadData();
            this.applyTheme();
            CanvasBackground.init();
            CanvasBackground.setTheme(Storage.getTheme() === 'dark');
            Toast.init();
            this.render();
            this.bindEvents();
            this.restoreScrollPosition();
            this.restoreSavedState();

            console.log('🌙 宝宝叫故事 - 已初始化');
        },

        cacheElements() {
            this.elements = {
                themeToggle: document.getElementById('theme-toggle'),
                themeIcon: document.querySelector('.theme-icon'),
                randomCard: document.getElementById('random-card'),
                addStoryBtn: document.getElementById('add-story-btn'),
                filterTabs: document.querySelectorAll('.filter-tab'),
                storyCount: document.getElementById('story-count'),
                storyList: document.getElementById('story-list'),
                emptyState: document.getElementById('empty-state'),
                
                storyModal: document.getElementById('story-modal'),
                modalOverlay: document.getElementById('modal-overlay'),
                modalCover: document.getElementById('modal-cover'),
                modalTitle: document.getElementById('modal-title'),
                modalContent: document.getElementById('modal-content'),
                modalFavoriteBtn: document.getElementById('modal-favorite-btn'),
                modalShakeBtn: document.getElementById('modal-shake-btn'),
                modalCloseBtn: document.getElementById('modal-close-btn'),
                
                formModal: document.getElementById('form-modal'),
                formOverlay: document.getElementById('form-overlay'),
                formTitle: document.getElementById('form-title'),
                formCloseBtn: document.getElementById('form-close-btn'),
                formCancelBtn: document.getElementById('form-cancel-btn'),
                storyForm: document.getElementById('story-form'),
                storyTitleInput: document.getElementById('story-title-input'),
                storyContentInput: document.getElementById('story-content-input'),
                coverPreview: document.getElementById('cover-preview'),
                coverIcons: document.getElementById('cover-icons'),
                
                confirmModal: document.getElementById('confirm-modal'),
                confirmOverlay: document.getElementById('confirm-overlay'),
                confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
                confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
                
                shakeAnimation: document.getElementById('shake-animation')
            };
        },

        loadData() {
            this.stories = Storage.getStories();
            const savedState = Storage.getState();
            this.currentFilter = savedState.currentFilter || 'all';
            this.savedState = savedState;
        },

        saveData() {
            Storage.saveStories(this.stories);
        },

        saveCurrentState() {
            const state = {
                currentFilter: this.currentFilter,
                scrollPosition: window.scrollY,
                activeModal: null,
                currentStoryId: null,
                editingStoryId: null,
                formDraft: {
                    title: '',
                    content: '',
                    cover: '🐻'
                },
                readingScrollPosition: 0
            };

            if (this.elements.storyModal && !this.elements.storyModal.classList.contains('hidden') && this.currentStory) {
                state.activeModal = 'story';
                state.currentStoryId = this.currentStory.id;
                if (this.elements.modalContent) {
                    state.readingScrollPosition = this.elements.modalContent.scrollTop;
                }
            }

            if (this.elements.formModal && !this.elements.formModal.classList.contains('hidden')) {
                state.activeModal = 'form';
                if (this.editingStory) {
                    state.editingStoryId = this.editingStory.id;
                }
                state.formDraft = {
                    title: this.elements.storyTitleInput ? this.elements.storyTitleInput.value : '',
                    content: this.elements.storyContentInput ? this.elements.storyContentInput.value : '',
                    cover: this.selectedCover
                };
            }

            Storage.saveState(state);
        },

        restoreScrollPosition() {
            if (this.savedState && this.savedState.scrollPosition) {
                setTimeout(() => {
                    window.scrollTo(0, this.savedState.scrollPosition);
                }, 100);
            }
        },

        restoreSavedState() {
            if (!this.savedState) return;

            const { activeModal, currentStoryId, editingStoryId, formDraft, readingScrollPosition } = this.savedState;

            if (activeModal === 'story' && currentStoryId) {
                const story = this.stories.find(s => s.id === currentStoryId);
                if (story) {
                    this.openStory(story, false);
                    setTimeout(() => {
                        if (this.elements.modalContent) {
                            this.elements.modalContent.scrollTop = readingScrollPosition || 0;
                        }
                        this.saveCurrentState();
                    }, 100);
                }
            }

            if (activeModal === 'form') {
                if (editingStoryId) {
                    const story = this.stories.find(s => s.id === editingStoryId);
                    if (story) {
                        this.openEditForm(story, false);
                        if (formDraft) {
                            if (this.elements.storyTitleInput) {
                                this.elements.storyTitleInput.value = formDraft.title || story.title;
                            }
                            if (this.elements.storyContentInput) {
                                this.elements.storyContentInput.value = formDraft.content || story.content;
                            }
                            if (formDraft.cover) {
                                this.selectedCover = formDraft.cover;
                                this.updateCoverPreview();
                                this.updateCoverButtons();
                            }
                        }
                        this.saveCurrentState();
                    }
                } else {
                    this.openAddForm(false);
                    if (formDraft) {
                        if (this.elements.storyTitleInput) {
                            this.elements.storyTitleInput.value = formDraft.title || '';
                        }
                        if (this.elements.storyContentInput) {
                            this.elements.storyContentInput.value = formDraft.content || '';
                        }
                        if (formDraft.cover) {
                            this.selectedCover = formDraft.cover;
                            this.updateCoverPreview();
                            this.updateCoverButtons();
                        }
                    }
                    this.saveCurrentState();
                }
            }
        },

        applyTheme() {
            const theme = Storage.getTheme();
            document.documentElement.setAttribute('data-theme', theme);
            this.updateThemeIcon(theme);
        },

        updateThemeIcon(theme) {
            if (this.elements.themeIcon) {
                this.elements.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
            }
        },

        toggleTheme() {
            const currentTheme = Storage.getTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            Storage.saveTheme(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            this.updateThemeIcon(newTheme);
            CanvasBackground.setTheme(newTheme === 'dark');
            
            Toast.show(newTheme === 'dark' ? '已切换到夜间模式 🌙' : '已切换到日间模式 ☀️', 'info');
        },

        render() {
            this.renderFilterTabs();
            this.renderStoryList();
            this.updateStoryCount();
        },

        renderFilterTabs() {
            this.elements.filterTabs.forEach(tab => {
                const filter = tab.getAttribute('data-filter');
                tab.classList.toggle('active', filter === this.currentFilter);
            });
        },

        renderStoryList() {
            let filteredStories = [...this.stories];

            if (this.currentFilter === 'favorite') {
                filteredStories = filteredStories.filter(s => s.isFavorite);
            }

            filteredStories.sort((a, b) => b.createdAt - a.createdAt);

            if (filteredStories.length === 0) {
                this.elements.storyList.innerHTML = '';
                this.elements.emptyState.classList.remove('hidden');
                return;
            }

            this.elements.emptyState.classList.add('hidden');

            this.elements.storyList.innerHTML = filteredStories.map(story => `
                <div class="story-card" data-id="${story.id}">
                    <div class="story-card-favorite ${story.isFavorite ? 'is-favorite' : ''}" data-action="favorite">
                        ${story.isFavorite ? '❤️' : '🤍'}
                    </div>
                    <div class="story-card-actions">
                        <button class="story-card-action-btn" data-action="edit" title="编辑">✏️</button>
                        <button class="story-card-action-btn" data-action="delete" title="删除">🗑️</button>
                    </div>
                    <div class="story-card-cover">${story.cover}</div>
                    <div class="story-card-title">${Utils.escapeHtml(story.title)}</div>
                    <div class="story-card-preview">${Utils.escapeHtml(story.content.substring(0, 50))}...</div>
                </div>
            `).join('');
        },

        updateStoryCount() {
            const count = this.currentFilter === 'favorite' 
                ? this.stories.filter(s => s.isFavorite).length 
                : this.stories.length;
            this.elements.storyCount.textContent = `共 ${count} 个故事`;
        },

        setFilter(filter) {
            this.currentFilter = filter;
            this.saveCurrentState();
            this.render();
        },

        openStory(story, saveState = true) {
            this.currentStory = story;
            
            this.elements.modalCover.innerHTML = `<span class="cover-placeholder">${story.cover}</span>`;
            this.elements.modalTitle.textContent = story.title;
            this.elements.modalContent.innerHTML = Utils.formatContent(story.content);
            
            this.updateFavoriteButton(story.isFavorite);
            
            this.elements.storyModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (saveState) {
                this.saveCurrentState();
            }
        },

        closeStoryModal() {
            this.elements.storyModal.classList.add('hidden');
            this.currentStory = null;
            document.body.style.overflow = '';
            this.render();
            this.saveCurrentState();
        },

        updateFavoriteButton(isFavorite) {
            const btn = this.elements.modalFavoriteBtn;
            const icon = btn.querySelector('.footer-btn-icon');
            const text = btn.querySelector('span:last-child');
            
            btn.classList.toggle('is-favorite', isFavorite);
            icon.textContent = isFavorite ? '❤️' : '🤍';
            text.textContent = isFavorite ? '已收藏' : '收藏';
        },

        toggleCurrentStoryFavorite() {
            if (!this.currentStory) return;
            
            const story = this.stories.find(s => s.id === this.currentStory.id);
            if (story) {
                story.isFavorite = !story.isFavorite;
                this.currentStory.isFavorite = story.isFavorite;
                this.saveData();
                this.updateFavoriteButton(story.isFavorite);
                Toast.show(story.isFavorite ? '已添加到收藏 ❤️' : '已取消收藏', 'info');
            }
        },

        openAddForm(saveState = true) {
            this.editingStory = null;
            this.selectedCover = '🐻';
            this.elements.formTitle.textContent = '写一个新故事';
            this.elements.storyTitleInput.value = '';
            this.elements.storyContentInput.value = '';
            this.updateCoverPreview();
            this.updateCoverButtons();
            
            this.elements.formModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            this.elements.storyTitleInput.focus();
            if (saveState) {
                this.saveCurrentState();
            }
        },

        openEditForm(story, saveState = true) {
            this.editingStory = story;
            this.selectedCover = story.cover;
            this.elements.formTitle.textContent = '编辑故事';
            this.elements.storyTitleInput.value = story.title;
            this.elements.storyContentInput.value = story.content;
            this.updateCoverPreview();
            this.updateCoverButtons();
            
            this.elements.formModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (saveState) {
                this.saveCurrentState();
            }
        },

        closeFormModal() {
            this.elements.formModal.classList.add('hidden');
            this.editingStory = null;
            document.body.style.overflow = '';
            this.saveCurrentState();
        },

        updateCoverPreview() {
            this.elements.coverPreview.innerHTML = `<span class="cover-placeholder">${this.selectedCover}</span>`;
        },

        updateCoverButtons() {
            const buttons = this.elements.coverIcons.querySelectorAll('.cover-icon-btn');
            buttons.forEach(btn => {
                const icon = btn.getAttribute('data-icon');
                btn.classList.toggle('active', icon === this.selectedCover);
            });
        },

        selectCover(icon) {
            this.selectedCover = icon;
            this.updateCoverPreview();
            this.updateCoverButtons();
            this.saveCurrentState();
        },

        saveStory(e) {
            e.preventDefault();
            
            const title = this.elements.storyTitleInput.value.trim();
            const content = this.elements.storyContentInput.value.trim();
            
            if (!title) {
                Toast.show('请输入故事标题', 'warning');
                return;
            }
            
            if (!content) {
                Toast.show('请输入故事内容', 'warning');
                return;
            }

            if (this.editingStory) {
                const story = this.stories.find(s => s.id === this.editingStory.id);
                if (story) {
                    story.title = title;
                    story.content = content;
                    story.cover = this.selectedCover;
                }
                Toast.show('故事已更新 ✨', 'success');
            } else {
                const newStory = {
                    id: Utils.generateId(),
                    title: title,
                    cover: this.selectedCover,
                    content: content,
                    isFavorite: false,
                    createdAt: Date.now()
                };
                this.stories.push(newStory);
                Toast.show('新故事已添加 📖', 'success');
            }

            this.saveData();
            this.closeFormModal();
            this.render();
        },

        confirmDelete(storyId) {
            this.deleteTargetId = storyId;
            this.elements.confirmModal.classList.remove('hidden');
        },

        closeConfirmModal() {
            this.elements.confirmModal.classList.add('hidden');
            this.deleteTargetId = null;
        },

        deleteStory() {
            if (!this.deleteTargetId) return;
            
            this.stories = this.stories.filter(s => s.id !== this.deleteTargetId);
            this.saveData();
            this.closeConfirmModal();
            this.render();
            Toast.show('故事已删除', 'info');
        },

        async randomStory() {
            if (this.stories.length === 0) {
                Toast.show('还没有故事呢，先添加一个吧 📖', 'warning');
                return;
            }

            this.elements.randomCard.classList.add('shaking');
            this.elements.shakeAnimation.classList.remove('hidden');

            await new Promise(resolve => setTimeout(resolve, 800));

            this.elements.randomCard.classList.remove('shaking');
            this.elements.shakeAnimation.classList.add('hidden');

            const randomIndex = Math.floor(Math.random() * this.stories.length);
            const story = this.stories[randomIndex];
            
            this.openStory(story);
        },

        async shakeNextStory() {
            if (this.stories.length <= 1) {
                Toast.show('只有一个故事，摇不出来新的啦 😄', 'info');
                return;
            }

            this.elements.shakeAnimation.classList.remove('hidden');

            await new Promise(resolve => setTimeout(resolve, 600));

            this.elements.shakeAnimation.classList.add('hidden');

            let availableStories = this.stories.filter(s => s.id !== this.currentStory?.id);
            if (availableStories.length === 0) {
                availableStories = this.stories;
            }

            const randomIndex = Math.floor(Math.random() * availableStories.length);
            const story = availableStories[randomIndex];
            
            this.currentStory = story;
            this.elements.modalCover.innerHTML = `<span class="cover-placeholder">${story.cover}</span>`;
            this.elements.modalTitle.textContent = story.title;
            this.elements.modalContent.innerHTML = Utils.formatContent(story.content);
            this.updateFavoriteButton(story.isFavorite);
            
            this.elements.modalContent.scrollTop = 0;
        },

        toggleStoryFavorite(storyId) {
            const story = this.stories.find(s => s.id === storyId);
            if (story) {
                story.isFavorite = !story.isFavorite;
                this.saveData();
                this.render();
                Toast.show(story.isFavorite ? '已添加到收藏 ❤️' : '已取消收藏', 'info');
            }
        },

        bindEvents() {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

            this.elements.randomCard.addEventListener('click', () => this.randomStory());
            this.elements.addStoryBtn.addEventListener('click', () => this.openAddForm());

            this.elements.filterTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const filter = tab.getAttribute('data-filter');
                    this.setFilter(filter);
                });
            });

            this.elements.storyList.addEventListener('click', (e) => {
                const card = e.target.closest('.story-card');
                if (!card) return;
                
                const storyId = card.getAttribute('data-id');
                const action = e.target.getAttribute('data-action') || 
                              e.target.closest('[data-action]')?.getAttribute('data-action');

                if (action === 'favorite') {
                    e.stopPropagation();
                    this.toggleStoryFavorite(storyId);
                } else if (action === 'edit') {
                    e.stopPropagation();
                    const story = this.stories.find(s => s.id === storyId);
                    if (story) this.openEditForm(story);
                } else if (action === 'delete') {
                    e.stopPropagation();
                    this.confirmDelete(storyId);
                } else {
                    const story = this.stories.find(s => s.id === storyId);
                    if (story) this.openStory(story);
                }
            });

            this.elements.modalOverlay.addEventListener('click', () => this.closeStoryModal());
            this.elements.modalCloseBtn.addEventListener('click', () => this.closeStoryModal());
            this.elements.modalFavoriteBtn.addEventListener('click', () => this.toggleCurrentStoryFavorite());
            this.elements.modalShakeBtn.addEventListener('click', () => this.shakeNextStory());

            this.elements.formOverlay.addEventListener('click', () => this.closeFormModal());
            this.elements.formCloseBtn.addEventListener('click', () => this.closeFormModal());
            this.elements.formCancelBtn.addEventListener('click', () => this.closeFormModal());
            this.elements.storyForm.addEventListener('submit', (e) => this.saveStory(e));

            this.elements.coverIcons.addEventListener('click', (e) => {
                const btn = e.target.closest('.cover-icon-btn');
                if (btn) {
                    const icon = btn.getAttribute('data-icon');
                    this.selectCover(icon);
                }
            });

            this.elements.confirmOverlay.addEventListener('click', () => this.closeConfirmModal());
            this.elements.confirmCancelBtn.addEventListener('click', () => this.closeConfirmModal());
            this.elements.confirmDeleteBtn.addEventListener('click', () => this.deleteStory());

            if (this.elements.storyTitleInput) {
                this.elements.storyTitleInput.addEventListener('input', Utils.debounce(() => {
                    this.saveCurrentState();
                }, 300));
            }

            if (this.elements.storyContentInput) {
                this.elements.storyContentInput.addEventListener('input', Utils.debounce(() => {
                    this.saveCurrentState();
                }, 300));
            }

            if (this.elements.modalContent) {
                this.elements.modalContent.addEventListener('scroll', Utils.debounce(() => {
                    this.saveCurrentState();
                }, 100));
            }

            window.addEventListener('scroll', Utils.debounce(() => {
                this.saveCurrentState();
            }, 100));

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (!this.elements.confirmModal.classList.contains('hidden')) {
                        this.closeConfirmModal();
                    } else if (!this.elements.formModal.classList.contains('hidden')) {
                        this.closeFormModal();
                    } else if (!this.elements.storyModal.classList.contains('hidden')) {
                        this.closeStoryModal();
                    }
                }
            });

            const handleModalKeydown = (e, callback) => {
                if (e.key === 'Enter' && !e.target.matches('textarea, input[type="text"]')) {
                    e.preventDefault();
                }
            };

            this.elements.formModal.addEventListener('keydown', handleModalKeydown);
            this.elements.storyModal.addEventListener('keydown', handleModalKeydown);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });

    window.GushiApp = App;
})();
