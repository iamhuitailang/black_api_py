const MagicPage = {
    magics: [],
    currentType: 'all',
    currentRarity: 'all',
    selectedMagic: null,

    types: [
        { code: 'all', name: '全部' },
        { code: 'particle', name: '粒子' },
        { code: 'light', name: '光效' },
        { code: 'color', name: '色彩' },
        { code: 'wave', name: '音波' },
        { code: 'special', name: '特殊' }
    ],

    rarities: [
        { code: 'all', name: '全部' },
        { code: 'common', name: '普通' },
        { code: 'rare', name: '稀有' },
        { code: 'epic', name: '史诗' },
        { code: 'legendary', name: '传说' }
    ],

    mockMagics: [
        {
            id: 1,
            name: '星光粒子',
            type: 'particle',
            rarity: 'common',
            icon: '✨',
            owned: true,
            equipped: false,
            description: '简单的星星粒子效果，为演奏增添一点光芒'
        },
        {
            id: 2,
            name: '彩虹光效',
            type: 'light',
            rarity: 'rare',
            icon: '🌈',
            owned: true,
            equipped: true,
            description: '绚丽的彩虹光芒，让琴键闪耀七彩光辉'
        },
        {
            id: 3,
            name: '火焰色彩',
            type: 'color',
            rarity: 'epic',
            icon: '🔥',
            owned: true,
            equipped: false,
            description: '炽热的火焰色调，让演奏充满激情'
        },
        {
            id: 4,
            name: '音波纹',
            type: 'wave',
            rarity: 'rare',
            icon: '〰️',
            owned: true,
            equipped: false,
            description: '可视化的音波效果，让音乐看得见'
        },
        {
            id: 5,
            name: '极光风暴',
            type: 'special',
            rarity: 'legendary',
            icon: '🌌',
            owned: false,
            equipped: false,
            description: '传说级的极光特效，如同北极光般神秘美丽'
        },
        {
            id: 6,
            name: '雪花飞舞',
            type: 'particle',
            rarity: 'common',
            icon: '❄️',
            owned: true,
            equipped: false,
            description: '洁白的雪花飘落，带来冬日的宁静'
        },
        {
            id: 7,
            name: '霓虹光辉',
            type: 'light',
            rarity: 'epic',
            icon: '💡',
            owned: true,
            equipped: false,
            description: '赛博朋克风格的霓虹灯光效果'
        },
        {
            id: 8,
            name: '海洋蓝调',
            type: 'color',
            rarity: 'rare',
            icon: '🌊',
            owned: false,
            equipped: false,
            description: '深海般的蓝色调，带来平静与安宁'
        },
        {
            id: 9,
            name: '雷鸣波',
            type: 'wave',
            rarity: 'epic',
            icon: '⚡',
            owned: true,
            equipped: false,
            description: '震撼的雷声音波，气势磅礴'
        },
        {
            id: 10,
            name: '时间裂隙',
            type: 'special',
            rarity: 'legendary',
            icon: '🌀',
            owned: true,
            equipped: true,
            description: '扭曲时空的神秘特效，仿佛穿越时空'
        },
        {
            id: 11,
            name: '蝴蝶效应',
            type: 'particle',
            rarity: 'rare',
            icon: '🦋',
            owned: true,
            equipped: false,
            description: '翩翩飞舞的蝴蝶粒子，优雅而美丽'
        },
        {
            id: 12,
            name: '月光宝盒',
            type: 'light',
            rarity: 'legendary',
            icon: '🌙',
            owned: false,
            equipped: false,
            description: '神秘的月光效果，带来梦幻般的体验'
        }
    ],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <button class="header-back" onclick="Router.back()">←</button>
                    <h1 class="header-title">魔法特效收藏</h1>
                </header>

                <div class="magic-filters">
                    <div class="filter-tabs" id="typeTabs">
                        ${this.renderTypeTabs()}
                    </div>
                    <div class="filter-tabs" id="rarityTabs">
                        ${this.renderRarityTabs()}
                    </div>
                </div>

                <div class="magic-grid" id="magicGrid">
                    <div class="empty-state">
                        <div class="empty-state-icon">✨</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                <div id="magicDetailModal" class="magic-modal hidden">
                    <div class="magic-modal-overlay" onclick="MagicPage.closeDetail()"></div>
                    <div class="magic-modal-content">
                        <div id="magicDetailContent"></div>
                    </div>
                </div>

                ${Tabbar.render('magic')}
            </div>
        `;

        this.bindEvents();
        this.currentType = 'all';
        this.currentRarity = 'all';
        this.magics = [...this.mockMagics];
        await this.loadMagic();
    },

    renderTypeTabs() {
        return this.types.map(type => `
            <div class="filter-tab ${this.currentType === type.code ? 'active' : ''}" data-type="${type.code}">
                ${type.name}
            </div>
        `).join('');
    },

    renderRarityTabs() {
        return this.rarities.map(rarity => `
            <div class="filter-tab ${this.currentRarity === rarity.code ? 'active' : ''}" data-rarity="${rarity.code}">
                ${rarity.name}
            </div>
        `).join('');
    },

    renderMagicGrid() {
        const filteredMagics = this.magics.filter(magic => {
            const typeMatch = this.currentType === 'all' || magic.type === this.currentType;
            const rarityMatch = this.currentRarity === 'all' || magic.rarity === this.currentRarity;
            return typeMatch && rarityMatch;
        });

        if (filteredMagics.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">没有找到符合条件的魔法特效</div>
                </div>
            `;
        }

        return `<div class="magic-grid-inner">${filteredMagics.map(magic => this.renderMagicCard(magic)).join('')}</div>`;
    },

    renderMagicCard(magic) {
        const rarityClass = this.getRarityClass(magic.rarity);
        const rarityName = this.getRarityName(magic.rarity);
        const typeName = this.getTypeName(magic.type);

        return `
            <div class="magic-card ${magic.owned ? '' : 'locked'} ${magic.equipped ? 'equipped' : ''}" data-id="${magic.id}">
                <div class="magic-card-inner">
                    <div class="magic-icon">${magic.icon}</div>
                    <div class="magic-name">${magic.name}</div>
                    <div class="magic-type">${typeName}</div>
                    <div class="magic-rarity badge badge-${rarityClass}">${rarityName}</div>
                    ${magic.equipped ? '<div class="magic-equipped-badge">已装备</div>' : ''}
                    ${!magic.owned ? '<div class="magic-lock">🔒</div>' : ''}
                    <div class="magic-checkbox">
                        <input type="checkbox" ${magic.equipped ? 'checked' : ''} ${!magic.owned ? 'disabled' : ''} 
                               onclick="event.stopPropagation(); MagicPage.handleEquip(${magic.id})">
                        <span>装备</span>
                    </div>
                </div>
            </div>
        `;
    },

    getRarityClass(rarity) {
        const classes = {
            common: 'gray',
            rare: 'info',
            epic: 'purple',
            legendary: 'magic'
        };
        return classes[rarity] || 'gray';
    },

    getRarityName(rarity) {
        const names = {
            common: '普通',
            rare: '稀有',
            epic: '史诗',
            legendary: '传说'
        };
        return names[rarity] || '普通';
    },

    getTypeName(type) {
        const names = {
            particle: '粒子',
            light: '光效',
            color: '色彩',
            wave: '音波',
            special: '特殊'
        };
        return names[type] || '其他';
    },

    renderMagicDetail(magic) {
        const rarityClass = this.getRarityClass(magic.rarity);
        const rarityName = this.getRarityName(magic.rarity);
        const typeName = this.getTypeName(magic.type);

        return `
            <div class="magic-detail">
                <div class="magic-detail-header">
                    <div class="magic-detail-icon">${magic.icon}</div>
                    <div class="magic-detail-info">
                        <h2 class="magic-detail-name">${magic.name}</h2>
                        <div class="magic-detail-tags">
                            <span class="badge badge-${rarityClass}">${rarityName}</span>
                            <span class="badge badge-info">${typeName}</span>
                            ${magic.equipped ? '<span class="badge badge-success">已装备</span>' : ''}
                        </div>
                    </div>
                    <button class="magic-detail-close" onclick="MagicPage.closeDetail()">✕</button>
                </div>
                <div class="magic-detail-body">
                    <p class="magic-detail-desc">${magic.description}</p>
                    <div class="magic-detail-status">
                        <span class="status-label">状态:</span>
                        <span class="status-value ${magic.owned ? 'owned' : 'locked'}">
                            ${magic.owned ? '✓ 已拥有' : '🔒 未解锁'}
                        </span>
                    </div>
                </div>
                <div class="magic-detail-footer">
                    <button class="btn ${magic.equipped ? 'btn-outline' : 'btn-primary'} btn-block" 
                            onclick="MagicPage.handleEquip(${magic.id})" 
                            ${!magic.owned ? 'disabled' : ''}>
                        ${magic.equipped ? '卸下装备' : '装备魔法'}
                    </button>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('[data-type]').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentType = tab.dataset.type;
                this.updateTypeTabs();
                this.updateMagicGrid();
            });
        });

        document.querySelectorAll('[data-rarity]').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentRarity = tab.dataset.rarity;
                this.updateRarityTabs();
                this.updateMagicGrid();
            });
        });
    },

    bindMagicEvents() {
        document.querySelectorAll('.magic-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT') return;
                const magicId = card.dataset.id;
                const magic = this.magics.find(m => String(m.id) === String(magicId));
                if (magic) {
                    this.openDetail(magic);
                }
            });
        });
    },

    updateTypeTabs() {
        const tabs = document.querySelectorAll('[data-type]');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === this.currentType);
        });
    },

    updateRarityTabs() {
        const tabs = document.querySelectorAll('[data-rarity]');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.rarity === this.currentRarity);
        });
    },

    updateMagicGrid() {
        const magicGrid = document.getElementById('magicGrid');
        if (magicGrid) {
            magicGrid.innerHTML = this.renderMagicGrid();
            this.bindMagicEvents();
        }
    },

    openDetail(magic) {
        this.selectedMagic = magic;
        const modal = document.getElementById('magicDetailModal');
        const content = document.getElementById('magicDetailContent');
        content.innerHTML = this.renderMagicDetail(magic);
        modal.classList.remove('hidden');
    },

    closeDetail() {
        const modal = document.getElementById('magicDetailModal');
        modal.classList.add('hidden');
        this.selectedMagic = null;
    },

    async handleEquip(magic_id) {
        const magic = this.magics.find(m => String(m.id) === String(magic_id));
        if (!magic || !magic.owned) {
            Toast.info('该魔法特效尚未解锁');
            return;
        }

        try {
            let result;
            if (magic.equipped) {
                result = await ApiService.post('/gq/magic/unequip', { magic_id: magic_id });
            } else {
                result = await ApiService.post('/gq/magic/equip', { magic_id: magic_id });
            }

            if (result.code === 0) {
                magic.equipped = !magic.equipped;
                Toast.success(magic.equipped ? '装备成功' : '已卸下装备');
                this.updateMagicGrid();

                if (this.selectedMagic && String(this.selectedMagic.id) === String(magic_id)) {
                    this.selectedMagic.equipped = magic.equipped;
                    const content = document.getElementById('magicDetailContent');
                    if (content) {
                        content.innerHTML = this.renderMagicDetail(this.selectedMagic);
                    }
                }
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请重试');
        }
    },

    async loadMagic() {
        const magicGrid = document.getElementById('magicGrid');

        try {
            const result = await ApiService.get('/gq/magic/user/list/get');

            if (result.code === 0) {
                const newMagics = result.data.items || [];
                if (newMagics.length > 0) {
                    this.magics = newMagics.map(magic => ({
                        ...magic,
                        equipped: magic.is_equipped === 1
                    }));
                }
            }
        } catch (error) {
            console.log('加载魔法特效列表失败，使用模拟数据');
        }

        magicGrid.innerHTML = this.renderMagicGrid();
        this.bindMagicEvents();
    }
};
