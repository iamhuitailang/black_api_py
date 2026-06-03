const TracksPage = {
    tracks: [],
    currentDifficulty: 'all',
    currentCategory: 'all',

    difficulties: [
        { code: 'all', name: '全部' },
        { code: '1', name: '简单' },
        { code: '2', name: '普通' },
        { code: '3', name: '困难' },
        { code: '4', name: '专家' },
        { code: '5', name: '大师' }
    ],

    categories: [
        { code: 'all', name: '全部' },
        { code: 'classical', name: '古典' },
        { code: 'pop', name: '流行' },
        { code: 'rock', name: '摇滚' },
        { code: 'jazz', name: '爵士' },
        { code: 'electronic', name: '电子' }
    ],

    mockTracks: [
        {
            id: 1,
            title: '小星星',
            difficulty: 1,
            category: 'classical',
            bpm: 120,
            duration: 60,
            unlocked: true,
            best_score: 9850,
            best_stars: 3,
            icon: '⭐'
        },
        {
            id: 2,
            title: '致爱丽丝',
            difficulty: 2,
            category: 'classical',
            bpm: 100,
            duration: 180,
            unlocked: true,
            best_score: 8720,
            best_stars: 2,
            icon: '🎵'
        },
        {
            id: 3,
            title: '月光奏鸣曲',
            difficulty: 4,
            category: 'classical',
            bpm: 90,
            duration: 240,
            unlocked: true,
            best_score: 12450,
            best_stars: 3,
            icon: '🌙'
        },
        {
            id: 4,
            title: '欢乐颂',
            difficulty: 2,
            category: 'classical',
            bpm: 110,
            duration: 90,
            unlocked: true,
            best_score: 0,
            best_stars: 0,
            icon: '🎉'
        },
        {
            id: 5,
            title: '梦中的婚礼',
            difficulty: 3,
            category: 'pop',
            bpm: 85,
            duration: 150,
            unlocked: false,
            best_score: 0,
            best_stars: 0,
            icon: '💒'
        },
        {
            id: 6,
            title: '土耳其进行曲',
            difficulty: 3,
            category: 'classical',
            bpm: 126,
            duration: 120,
            unlocked: true,
            best_score: 7560,
            best_stars: 2,
            icon: '🇹🇷'
        },
        {
            id: 7,
            title: '卡农',
            difficulty: 3,
            category: 'classical',
            bpm: 95,
            duration: 180,
            unlocked: false,
            best_score: 0,
            best_stars: 0,
            icon: '🎼'
        },
        {
            id: 8,
            title: '晴天',
            difficulty: 2,
            category: 'pop',
            bpm: 115,
            duration: 210,
            unlocked: true,
            best_score: 9200,
            best_stars: 3,
            icon: '☀️'
        },
        {
            id: 9,
            title: '摇滚卡农',
            difficulty: 4,
            category: 'rock',
            bpm: 140,
            duration: 160,
            unlocked: false,
            best_score: 0,
            best_stars: 0,
            icon: '🎸'
        },
        {
            id: 10,
            title: '爵士乐即兴',
            difficulty: 5,
            category: 'jazz',
            bpm: 130,
            duration: 200,
            unlocked: false,
            best_score: 0,
            best_stars: 0,
            icon: '🎷'
        }
    ],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <button class="header-back" onclick="Router.back()">←</button>
                    <h1 class="header-title">曲目列表</h1>
                </header>

                <div class="tracks-filters">
                    <div class="filter-tabs" id="difficultyTabs">
                        ${this.renderDifficultyTabs()}
                    </div>
                    <div class="filter-tabs" id="categoryTabs">
                        ${this.renderCategoryTabs()}
                    </div>
                </div>

                <div class="track-list" id="trackList">
                    <div class="empty-state">
                        <div class="empty-state-icon">🎵</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                ${Tabbar.render('tracks')}
            </div>
        `;

        this.bindEvents();
        this.currentDifficulty = 'all';
        this.currentCategory = 'all';
        this.tracks = [...this.mockTracks];
        await this.loadTracks();
    },

    renderDifficultyTabs() {
        return this.difficulties.map(diff => `
            <div class="filter-tab ${this.currentDifficulty === diff.code ? 'active' : ''}" data-difficulty="${diff.code}">
                ${diff.name}
            </div>
        `).join('');
    },

    renderCategoryTabs() {
        return this.categories.map(cat => `
            <div class="filter-tab ${this.currentCategory === cat.code ? 'active' : ''}" data-category="${cat.code}">
                ${cat.name}
            </div>
        `).join('');
    },

    renderTrackList() {
        const filteredTracks = this.tracks.filter(track => {
            const diffMatch = this.currentDifficulty === 'all' || String(track.difficulty) === this.currentDifficulty;
            const catMatch = this.currentCategory === 'all' || track.category === this.currentCategory;
            return diffMatch && catMatch;
        });

        if (filteredTracks.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">没有找到符合条件的曲目</div>
                </div>
            `;
        }

        return filteredTracks.map(track => this.renderTrackCard(track)).join('');
    },

    renderTrackCard(track) {
        const stars = Utils.getDifficultyStars(track.difficulty);
        const categoryName = Utils.getCategoryName(track.category);
        const duration = Utils.formatDuration(track.duration);

        return `
            <div class="track-card ${track.unlocked ? '' : 'locked'}" data-id="${track.id}">
                <div class="track-header">
                    <div class="track-info">
                        <div class="track-title">${track.icon} ${track.title}</div>
                        <div class="track-meta">
                            <div class="track-difficulty">
                                ${this.renderStars(stars)}
                            </div>
                            <span class="track-category">${categoryName}</span>
                        </div>
                    </div>
                </div>
                <div class="track-score">
                    <div class="track-best">
                        ${track.best_score > 0 ? `
                            <span class="track-best-label">最佳:</span>
                            <span class="track-best-score">${track.best_score.toLocaleString()}</span>
                            <span class="track-best-stars">${'⭐'.repeat(track.best_stars)}${'☆'.repeat(3 - track.best_stars)}</span>
                        ` : `
                            <span class="track-best-label">未演奏</span>
                        `}
                    </div>
                    <div class="track-details">
                        <span>🎵 ${track.bpm} BPM</span>
                        <span>⏱️ ${duration}</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderStars(count) {
        return Array(6).fill(0).map((_, i) => `
            <span class="star ${i < count ? 'filled' : ''}">★</span>
        `).join('');
    },

    bindEvents() {
        document.querySelectorAll('[data-difficulty]').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentDifficulty = tab.dataset.difficulty;
                this.updateDifficultyTabs();
                this.updateTrackList();
            });
        });

        document.querySelectorAll('[data-category]').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentCategory = tab.dataset.category;
                this.updateCategoryTabs();
                this.updateTrackList();
            });
        });
    },

    bindTrackEvents() {
        document.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', () => {
                const trackId = card.dataset.id;
                const track = this.tracks.find(t => String(t.id) === String(trackId));
                
                if (track && !track.unlocked) {
                    Toast.info('该曲目尚未解锁');
                    return;
                }

                Router.navigate('piano', { track_id: trackId });
            });
        });
    },

    updateDifficultyTabs() {
        const tabs = document.querySelectorAll('[data-difficulty]');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.difficulty === this.currentDifficulty);
        });
    },

    updateCategoryTabs() {
        const tabs = document.querySelectorAll('[data-category]');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === this.currentCategory);
        });
    },

    updateTrackList() {
        const trackList = document.getElementById('trackList');
        if (trackList) {
            trackList.innerHTML = this.renderTrackList();
            this.bindTrackEvents();
        }
    },

    async loadTracks() {
        const trackList = document.getElementById('trackList');

        try {
            const result = await ApiService.get('/gq/track/user/list/get');

            if (result.code === 0) {
                const newTracks = result.data.items || [];
                if (newTracks.length > 0) {
                    this.tracks = newTracks.map(track => ({
                        ...track,
                        unlocked: track.is_unlocked === 1
                    }));
                }
            }
        } catch (error) {
            console.log('加载曲目列表失败，使用模拟数据');
        }

        trackList.innerHTML = this.renderTrackList();
        this.bindTrackEvents();
    }
};
