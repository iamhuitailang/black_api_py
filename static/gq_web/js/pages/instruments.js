const InstrumentsPage = {
    instruments: [],
    currentType: 'all',
    currentRarity: 'all',
    selectedInstrument: null,
    equippedInstrumentId: null,

    types: [
        { code: 'all', name: '全部' },
        { code: 'piano', name: '钢琴' },
        { code: 'keyboard', name: '键盘' },
        { code: 'harp', name: '竖琴' },
        { code: 'organ', name: '管风琴' },
        { code: 'synthesizer', name: '合成器' }
    ],

    rarities: [
        { code: 'all', name: '全部' },
        { code: 'common', name: '普通' },
        { code: 'rare', name: '稀有' },
        { code: 'epic', name: '史诗' },
        { code: 'legendary', name: '传说' }
    ],

    mockInstruments: [
        {
            id: 1,
            name: '经典钢琴',
            type: 'piano',
            rarity: 'common',
            icon: '🎹',
            owned: true,
            equipped: true,
            description: '经典的三角钢琴音色，温暖而优雅'
        },
        {
            id: 2,
            name: '电钢琴',
            type: 'keyboard',
            rarity: 'rare',
            icon: '🎵',
            owned: true,
            equipped: false,
            description: '现代电钢琴音色，明亮而富有穿透力'
        },
        {
            id: 3,
            name: '天使竖琴',
            type: 'harp',
            rarity: 'epic',
            icon: '🎼',
            owned: true,
            equipped: false,
            description: '如同天使弹奏的竖琴，音色清澈如水'
        },
        {
            id: 4,
            name: '教堂管风琴',
            type: 'organ',
            rarity: 'rare',
            icon: '⛪',
            owned: true,
            equipped: false,
            description: '庄严的管风琴音色，震撼人心'
        },
        {
            id: 5,
            name: '宇宙合成器',
            type: 'synthesizer',
            rarity: 'legendary',
            icon: '🚀',
            owned: false,
            equipped: false,
            description: '来自未来的合成器，创造出太空般的音色'
        },
        {
            id: 6,
            name: '爵士钢琴',
            type: 'piano',
            rarity: 'rare',
            icon: '🎷',
            owned: true,
            equipped: false,
            description: '充满爵士风格的钢琴音色，即兴演奏的最佳选择'
        },
        {
            id: 7,
            name: 'MIDI键盘',
            type: 'keyboard',
            rarity: 'common',
            icon: '⌨️',
            owned: true,
            equipped: false,
            description: '标准MIDI键盘，适合各种音乐制作'
        },
        {
            id: 8,
            name: '精灵竖琴',
            type: 'harp',
            rarity: 'legendary',
            icon: '🧚',
            owned: false,
            equipped: false,
            description: '传说中精灵使用的竖琴，音色如梦似幻'
        },
        {
            id: 9,
            name: '巴洛克管风琴',
            type: 'organ',
            rarity: 'epic',
            icon: '🏛️',
            owned: true,
            equipped: false,
            description: '巴洛克时期的管风琴，古典音乐的灵魂'
        },
        {
            id: 10,
            name: '复古合成器',
            type: 'synthesizer',
            rarity: 'epic',
            icon: '📻',
            owned: true,
            equipped: false,
            description: '80年代复古合成器音色，怀旧与现代的完美结合'
        },
        {
            id: 11,
            name: '水晶钢琴',
            type: 'piano',
            rarity: 'legendary',
            icon: '💎',
            owned: true,
            equipped: false,
            description: '由水晶打造的钢琴，音色如钻石般璀璨'
        },
        {
            id: 12,
            name: '合成器工作站',
            type: 'synthesizer',
            rarity: 'rare',
            icon: '🎛️',
            owned: false,
            equipped: false,
            description: '专业级合成器工作站，无限的音色可能'
        }
    ],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <button class="header-back" onclick="Router.back()">←</button>
                    <h1 class="header-title">乐器收藏</h1>
                </header>

                <div class="instruments-filters">
                    <div class="filter-tabs" id="typeTabs">
                        ${this.renderTypeTabs()}
                    </div>
                    <div class="filter-tabs" id="rarityTabs">
                        ${this.renderRarityTabs()}
                    </div>
                </div>

                <div class="instruments-grid" id="instrumentsGrid">
                    <div class="empty-state">
                        <div class="empty-state-icon">🎹</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                <div id="instrumentDetailModal" class="instrument-modal hidden">
                    <div class="instrument-modal-overlay" onclick="InstrumentsPage.closeDetail()"></div>
                    <div class="instrument-modal-content">
                        <div id="instrumentDetailContent"></div>
                    </div>
                </div>

                ${Tabbar.render('instruments')}
            </div>
        `;

        this.bindEvents();
        this.currentType = 'all';
        this.currentRarity = 'all';
        this.instruments = [...this.mockInstruments];
        this.updateEquippedId();
        await this.loadInstruments();
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

    renderInstrumentsGrid() {
        const filteredInstruments = this.instruments.filter(instrument => {
            const typeMatch = this.currentType === 'all' || instrument.type === this.currentType;
            const rarityMatch = this.currentRarity === 'all' || instrument.rarity === this.currentRarity;
            return typeMatch && rarityMatch;
        });

        if (filteredInstruments.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">没有找到符合条件的乐器</div>
                </div>
            `;
        }

        return `<div class="instruments-grid-inner">${filteredInstruments.map(instrument => this.renderInstrumentCard(instrument)).join('')}</div>`;
    },

    renderInstrumentCard(instrument) {
        const rarityClass = this.getRarityClass(instrument.rarity);
        const rarityName = this.getRarityName(instrument.rarity);
        const typeName = this.getTypeName(instrument.type);

        return `
            <div class="instrument-card ${instrument.owned ? '' : 'locked'} ${instrument.equipped ? 'equipped' : ''}" data-id="${instrument.id}">
                <div class="instrument-card-inner">
                    <div class="instrument-icon">${instrument.icon}</div>
                    <div class="instrument-name">${instrument.name}</div>
                    <div class="instrument-type">${typeName}</div>
                    <div class="instrument-rarity badge badge-${rarityClass}">${rarityName}</div>
                    ${instrument.equipped ? '<div class="instrument-equipped-badge">当前装备</div>' : ''}
                    ${!instrument.owned ? '<div class="instrument-lock">🔒</div>' : ''}
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
            piano: '钢琴',
            keyboard: '键盘',
            harp: '竖琴',
            organ: '管风琴',
            synthesizer: '合成器'
        };
        return names[type] || '其他';
    },

    renderInstrumentDetail(instrument) {
        const rarityClass = this.getRarityClass(instrument.rarity);
        const rarityName = this.getRarityName(instrument.rarity);
        const typeName = this.getTypeName(instrument.type);
        const isEquipped = instrument.equipped;

        return `
            <div class="instrument-detail">
                <div class="instrument-detail-header">
                    <div class="instrument-detail-icon">${instrument.icon}</div>
                    <div class="instrument-detail-info">
                        <h2 class="instrument-detail-name">${instrument.name}</h2>
                        <div class="instrument-detail-tags">
                            <span class="badge badge-${rarityClass}">${rarityName}</span>
                            <span class="badge badge-info">${typeName}</span>
                            ${isEquipped ? '<span class="badge badge-success">已装备</span>' : ''}
                        </div>
                    </div>
                    <button class="instrument-detail-close" onclick="InstrumentsPage.closeDetail()">✕</button>
                </div>
                <div class="instrument-detail-body">
                    <p class="instrument-detail-desc">${instrument.description}</p>
                    <div class="instrument-detail-status">
                        <span class="status-label">状态:</span>
                        <span class="status-value ${instrument.owned ? 'owned' : 'locked'}">
                            ${instrument.owned ? '✓ 已拥有' : '🔒 未解锁'}
                        </span>
                    </div>
                </div>
                <div class="instrument-detail-footer">
                    <button class="btn ${isEquipped ? 'btn-outline' : 'btn-primary'} btn-block" 
                            onclick="InstrumentsPage.handleEquip(${instrument.id})" 
                            ${!instrument.owned ? 'disabled' : ''}>
                        ${isEquipped ? '已装备' : '装备乐器'}
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
                this.updateInstrumentsGrid();
            });
        });

        document.querySelectorAll('[data-rarity]').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentRarity = tab.dataset.rarity;
                this.updateRarityTabs();
                this.updateInstrumentsGrid();
            });
        });
    },

    bindInstrumentEvents() {
        document.querySelectorAll('.instrument-card').forEach(card => {
            card.addEventListener('click', () => {
                const instrumentId = card.dataset.id;
                const instrument = this.instruments.find(i => String(i.id) === String(instrumentId));
                if (instrument) {
                    this.openDetail(instrument);
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

    updateInstrumentsGrid() {
        const instrumentsGrid = document.getElementById('instrumentsGrid');
        if (instrumentsGrid) {
            instrumentsGrid.innerHTML = this.renderInstrumentsGrid();
            this.bindInstrumentEvents();
        }
    },

    updateEquippedId() {
        const equipped = this.instruments.find(i => i.equipped);
        this.equippedInstrumentId = equipped ? equipped.id : null;
    },

    openDetail(instrument) {
        this.selectedInstrument = instrument;
        const modal = document.getElementById('instrumentDetailModal');
        const content = document.getElementById('instrumentDetailContent');
        content.innerHTML = this.renderInstrumentDetail(instrument);
        modal.classList.remove('hidden');
    },

    closeDetail() {
        const modal = document.getElementById('instrumentDetailModal');
        modal.classList.add('hidden');
        this.selectedInstrument = null;
    },

    async handleEquip(instrument_id) {
        const instrument = this.instruments.find(i => String(i.id) === String(instrument_id));
        if (!instrument || !instrument.owned) {
            Toast.info('该乐器尚未解锁');
            return;
        }

        try {
            let result;
            if (instrument.equipped) {
                result = await ApiService.post('/gq/instrument/unequip', { instrument_id: instrument_id });
            } else {
                result = await ApiService.post('/gq/instrument/equip', { instrument_id: instrument_id });
            }

            if (result.code === 0) {
                if (instrument.equipped) {
                    instrument.equipped = false;
                    this.equippedInstrumentId = null;
                    Toast.success('已卸下装备');
                } else {
                    this.equipInstrument(instrument_id);
                    Toast.success('装备成功');
                }
                this.updateInstrumentsGrid();

                if (this.selectedInstrument) {
                    this.selectedInstrument = this.instruments.find(i => String(i.id) === String(this.selectedInstrument.id));
                    const content = document.getElementById('instrumentDetailContent');
                    if (content && this.selectedInstrument) {
                        content.innerHTML = this.renderInstrumentDetail(this.selectedInstrument);
                    }
                }
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请重试');
        }
    },

    equipInstrument(instrument_id) {
        this.instruments.forEach(i => {
            i.equipped = String(i.id) === String(instrument_id);
        });
        this.equippedInstrumentId = instrument_id;
    },

    async loadInstruments() {
        const instrumentsGrid = document.getElementById('instrumentsGrid');

        try {
            const result = await ApiService.get('/gq/instrument/user/list/get');

            if (result.code === 0) {
                const newInstruments = result.data.items || [];
                if (newInstruments.length > 0) {
                    this.instruments = newInstruments.map(instr => ({
                        ...instr,
                        equipped: instr.is_equipped === 1
                    }));
                    this.updateEquippedId();
                }
            }
        } catch (error) {
            console.log('加载乐器列表失败，使用模拟数据');
        }

        instrumentsGrid.innerHTML = this.renderInstrumentsGrid();
        this.bindInstrumentEvents();
    }
};
