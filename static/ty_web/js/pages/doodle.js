const DoodlePage = {
    components: {
        'doodle-canvas': DoodleCanvas
    },
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">✏️ 涂鸦创造</h1>
                <div class="nav-tabs">
                    <div class="nav-tab" @click="goBack">← 返回</div>
                </div>
            </div>

            <div class="grid grid-2">
                <div>
                    <div class="card mb-4">
                        <h2 class="text-lg font-bold mb-4">🎨 绘制你的武器</h2>
                        <doodle-canvas 
                            ref="doodleCanvas"
                            :width="canvasWidth" 
                            :height="canvasHeight"
                            :disabled="creating"
                            @drawing-complete="onDrawingComplete"
                        ></doodle-canvas>
                    </div>

                    <div class="card">
                        <h3 class="font-bold mb-3">📊 绘画分析</h3>
                        <div v-if="drawingAnalysis" class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-box-label">复杂度</div>
                                <div class="stat-box-value">{{ drawingAnalysis.complexity }}/10</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">颜色数</div>
                                <div class="stat-box-value">{{ drawingAnalysis.colorCount }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">覆盖率</div>
                                <div class="stat-box-value">{{ (drawingAnalysis.coverage * 100).toFixed(1) }}%</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">主风格</div>
                                <div class="stat-box-value">{{ getStyleText(drawingAnalysis.dominantStyle) }}</div>
                            </div>
                        </div>
                        <div v-else class="text-center text-gray-500 py-4">
                            完成绘画后自动分析
                        </div>
                    </div>
                </div>

                <div v-if="!createdWeapon">
                    <div class="card mb-4">
                        <h2 class="text-lg font-bold mb-4">⚔️ 武器配置</h2>
                        
                        <div class="form-group mb-4">
                            <label>武器名称</label>
                            <input 
                                type="text" 
                                class="input w-full" 
                                v-model="weaponName" 
                                placeholder="给你的武器起个名字"
                                :disabled="creating"
                                maxlength="20"
                            />
                        </div>

                        <div class="mb-4">
                            <label class="font-bold mb-2 block">属性分配 (总点数: {{ totalPoints }}/{{ maxPoints }})</label>
                            
                            <div class="form-group mb-3">
                                <div class="flex justify-between items-center mb-1">
                                    <span>⚔️ 攻击</span>
                                    <span class="font-bold text-danger">{{ attackPoints }}</span>
                                </div>
                                <input 
                                    type="range" 
                                    v-model.number="attackPoints" 
                                    min="0" 
                                    :max="maxPoints - defensePoints - speedPoints + attackPoints"
                                    :disabled="creating"
                                    class="w-full"
                                    @input="updateStats"
                                />
                            </div>

                            <div class="form-group mb-3">
                                <div class="flex justify-between items-center mb-1">
                                    <span>🛡️ 防御</span>
                                    <span class="font-bold text-primary">{{ defensePoints }}</span>
                                </div>
                                <input 
                                    type="range" 
                                    v-model.number="defensePoints" 
                                    min="0" 
                                    :max="maxPoints - attackPoints - speedPoints + defensePoints"
                                    :disabled="creating"
                                    class="w-full"
                                    @input="updateStats"
                                />
                            </div>

                            <div class="form-group mb-3">
                                <div class="flex justify-between items-center mb-1">
                                    <span>💨 速度</span>
                                    <span class="font-bold text-success">{{ speedPoints }}</span>
                                </div>
                                <input 
                                    type="range" 
                                    v-model.number="speedPoints" 
                                    min="0" 
                                    :max="maxPoints - attackPoints - defensePoints + speedPoints"
                                    :disabled="creating"
                                    class="w-full"
                                    @input="updateStats"
                                />
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="font-bold mb-2 block">🎭 武器风格</label>
                            <div class="style-selector">
                                <div 
                                    v-for="style in styles" 
                                    :key="style.value"
                                    class="style-option"
                                    :class="[style.value, { active: selectedStyle === style.value }]"
                                    @click="selectStyle(style.value)"
                                >
                                    {{ style.icon }} {{ style.label }}
                                </div>
                            </div>
                        </div>

                        <div class="card bg-white mb-4 p-4">
                            <h3 class="font-bold mb-3">📈 预估属性</h3>
                            <div class="stats-grid">
                                <div class="stat-box">
                                    <div class="stat-box-label">攻击</div>
                                    <div class="stat-box-value text-danger">{{ estimatedStats.attack }}</div>
                                </div>
                                <div class="stat-box">
                                    <div class="stat-box-label">防御</div>
                                    <div class="stat-box-value text-primary">{{ estimatedStats.defense }}</div>
                                </div>
                                <div class="stat-box">
                                    <div class="stat-box-label">速度</div>
                                    <div class="stat-box-value text-success">{{ estimatedStats.speed }}</div>
                                </div>
                                <div class="stat-box">
                                    <div class="stat-box-label">品质</div>
                                    <div class="stat-box-value">{{ getRarityText(estimatedStats.rarity) }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="card bg-white p-4 mb-4">
                            <h3 class="font-bold mb-3">💰 消耗资源</h3>
                            <div class="flex gap-4">
                                <div class="stat-item paint">
                                    <span>🎨</span>
                                    <span>{{ paintCost }} 颜料</span>
                                </div>
                                <div class="stat-item canvas">
                                    <span>🖼️</span>
                                    <span>{{ canvasCost }} 画布</span>
                                </div>
                            </div>
                            <div class="text-sm text-gray-500 mt-2">
                                当前拥有: 🎨 {{ userResources.paint || 0 }} | 🖼️ {{ userResources.canvas || 0 }}
                            </div>
                        </div>

                        <button 
                            class="btn btn-primary w-full" 
                            @click="createWeapon"
                            :disabled="!canCreate || creating"
                        >
                            <span v-if="creating">
                                <span class="loading-spinner" style="width: 16px; height: 16px; display: inline-block; margin-right: 8px;"></span>
                                创建中...
                            </span>
                            <span v-else>✨ 创建武器</span>
                        </button>
                    </div>
                </div>

                <div v-if="createdWeapon" class="card">
                        <h2 class="text-lg font-bold mb-4 text-success">🎉 创建成功！</h2>
                        <div class="weapon-preview">
                            <img :src="createdWeapon.image" :alt="createdWeapon.name" />
                        </div>
                        <h3 class="font-bold text-center text-lg mb-2">{{ createdWeapon.name }}</h3>
                        <div class="text-center mb-3">
                            <span class="rarity-badge" :class="createdWeapon.rarity">{{ getRarityText(createdWeapon.rarity) }}</span>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-box-label">攻击</div>
                                <div class="stat-box-value text-danger">{{ createdWeapon.attack }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">防御</div>
                                <div class="stat-box-value text-primary">{{ createdWeapon.defense }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">速度</div>
                                <div class="stat-box-value text-success">{{ createdWeapon.speed }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">风格</div>
                                <div class="stat-box-value">{{ getStyleText(createdWeapon.style) }}</div>
                            </div>
                        </div>
                        <div class="flex gap-3 mt-4">
                            <button class="btn btn-secondary flex-1" @click="resetForm">继续涂鸦</button>
                            <button class="btn btn-primary flex-1" @click="goToBackpack">查看背包</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            canvasWidth: 600,
            canvasHeight: 400,
            weaponName: '',
            attackPoints: 5,
            defensePoints: 5,
            speedPoints: 5,
            maxPoints: 30,
            selectedStyle: 'normal',
            drawingAnalysis: null,
            drawingImage: null,
            creating: false,
            createdWeapon: null,
            userResources: {
                paint: 0,
                canvas: 0
            },
            styles: [
                { value: 'normal', label: '普通', icon: '⚪' },
                { value: 'fire', label: '火焰', icon: '🔥' },
                { value: 'ice', label: '冰霜', icon: '❄️' },
                { value: 'lightning', label: '雷电', icon: '⚡' },
                { value: 'poison', label: '毒素', icon: '☠️' },
                { value: 'holy', label: '神圣', icon: '✨' },
                { value: 'shadow', label: '暗影', icon: '🌑' }
            ]
        };
    },
    computed: {
        totalPoints() {
            return this.attackPoints + this.defensePoints + this.speedPoints;
        },
        paintCost() {
            return 10 + Math.floor((this.drawingAnalysis?.complexity || 0) * 2);
        },
        canvasCost() {
            return 1;
        },
        estimatedStats() {
            const complexity = this.drawingAnalysis?.complexity || 0;
            const baseValue = 5 + complexity * 3;
            
            const rarity = this.calculateRarity(complexity);
            const rarityMultiplier = this.getRarityMultiplier(rarity);
            const styleBonus = this.getStyleBonus();
            
            return {
                attack: Math.floor((baseValue + this.attackPoints * 2) * rarityMultiplier * styleBonus.attack),
                defense: Math.floor((baseValue + this.defensePoints * 2) * rarityMultiplier * styleBonus.defense),
                speed: Math.floor((baseValue + this.speedPoints * 2) * rarityMultiplier * styleBonus.speed),
                rarity: rarity
            };
        },
        canCreate() {
            return (
                this.weaponName.trim().length > 0 &&
                this.drawingImage &&
                this.totalPoints <= this.maxPoints &&
                !this.createdWeapon
            );
        }
    },
    mounted() {
        this.checkAuth();
        this.restoreDraft();
    },
    watch: {
        weaponName(val) { this.saveDraft(); },
        attackPoints(val) { this.saveDraft(); },
        defensePoints(val) { this.saveDraft(); },
        speedPoints(val) { this.saveDraft(); },
        selectedStyle(val) { this.saveDraft(); },
        drawingImage(val) { this.saveDraft(); },
        drawingAnalysis(val) { this.saveDraft(); }
    },
    methods: {
        saveDraft() {
            try {
                const draft = {
                    weaponName: this.weaponName,
                    attackPoints: this.attackPoints,
                    defensePoints: this.defensePoints,
                    speedPoints: this.speedPoints,
                    selectedStyle: this.selectedStyle,
                    drawingImage: this.drawingImage,
                    drawingAnalysis: this.drawingAnalysis
                };
                localStorage.setItem('ty_doodle_draft', JSON.stringify(draft));
            } catch (e) {
                console.warn('保存草稿失败:', e);
            }
        },

        restoreDraft() {
            try {
                const saved = localStorage.getItem('ty_doodle_draft');
                if (saved) {
                    const draft = JSON.parse(saved);
                    if (draft.weaponName) this.weaponName = draft.weaponName;
                    if (draft.attackPoints) this.attackPoints = draft.attackPoints;
                    if (draft.defensePoints) this.defensePoints = draft.defensePoints;
                    if (draft.speedPoints) this.speedPoints = draft.speedPoints;
                    if (draft.selectedStyle) this.selectedStyle = draft.selectedStyle;
                    if (draft.drawingImage) this.drawingImage = draft.drawingImage;
                    if (draft.drawingAnalysis) this.drawingAnalysis = draft.drawingAnalysis;
                    this.$nextTick(() => {
                        if (draft.drawingImage && this.$refs.doodleCanvas) {
                            this.$refs.doodleCanvas.setImageData(draft.drawingImage);
                        }
                    });
                }
            } catch (e) {
                console.warn('恢复草稿失败:', e);
            }
        },

        clearDraft() {
            localStorage.removeItem('ty_doodle_draft');
        },

        checkAuth() {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.loadResources();
        },

        async loadResources() {
            try {
                const result = await API.resource.getMyResources({ page_size: 100 });
                if (result.code === 0 && result.data) {
                    const items = result.data.items || [];
                    const resMap = {};
                    items.forEach(item => {
                        resMap[item.resource_type] = (resMap[item.resource_type] || 0) + (item.quantity || 0);
                    });
                    const user = AuthService.getUser();
                    if (user) {
                        this.userResources = {
                            gold: user.gold || 0,
                            diamond: user.diamond || 0,
                            paint: resMap.paint || user.paint_count || 0,
                            canvas: resMap.canvas || user.canvas_count || 0
                        };
                    }
                }
            } catch (error) {
                console.error('加载资源失败:', error);
                const user = AuthService.getUser();
                if (user) {
                    this.userResources = {
                        gold: user.gold || 0,
                        diamond: user.diamond || 0,
                        paint: user.paint_count || 0,
                        canvas: user.canvas_count || 0
                    };
                }
            }
        },

        onDrawingComplete(imageData) {
            this.drawingImage = imageData;
            if (this.$refs.doodleCanvas) {
                this.drawingAnalysis = this.$refs.doodleCanvas.analyzeDrawing();
                if (this.drawingAnalysis.dominantStyle !== 'normal') {
                    this.selectedStyle = this.drawingAnalysis.dominantStyle;
                }
            }
        },

        updateStats() {
            this.attackPoints = Math.max(0, Math.min(this.maxPoints, this.attackPoints));
            this.defensePoints = Math.max(0, Math.min(this.maxPoints, this.defensePoints));
            this.speedPoints = Math.max(0, Math.min(this.maxPoints, this.speedPoints));
        },

        selectStyle(style) {
            if (!this.creating) {
                this.selectedStyle = style;
            }
        },

        calculateRarity(complexity) {
            const roll = Math.random() * 100;
            const complexityBonus = complexity * 2;
            
            if (roll < 5 + complexityBonus * 0.5) return 'legendary';
            if (roll < 20 + complexityBonus) return 'epic';
            if (roll < 50 + complexityBonus) return 'rare';
            return 'common';
        },

        getRarityMultiplier(rarity) {
            const multipliers = {
                common: 1,
                rare: 1.3,
                epic: 1.6,
                legendary: 2
            };
            return multipliers[rarity] || 1;
        },

        getStyleBonus() {
            const bonuses = {
                normal: { attack: 1, defense: 1, speed: 1 },
                fire: { attack: 1.3, defense: 0.9, speed: 1 },
                ice: { attack: 0.9, defense: 1.3, speed: 1 },
                lightning: { attack: 1.1, defense: 0.9, speed: 1.3 },
                poison: { attack: 1.2, defense: 1, speed: 0.9 },
                holy: { attack: 1, defense: 1.2, speed: 1 },
                shadow: { attack: 1.2, defense: 0.8, speed: 1.2 }
            };
            return bonuses[this.selectedStyle] || bonuses.normal;
        },

        async createWeapon() {
            if (!this.canCreate) return;
            
            this.creating = true;
            
            try {
                const result = await API.weapon.create({
                    name: this.weaponName.trim(),
                    doodle_data: this.drawingImage,
                    attack: this.estimatedStats.attack,
                    defense: this.estimatedStats.defense,
                    speed: this.estimatedStats.speed,
                    doodle_style: this.selectedStyle,
                    description: `${this.getStyleText(this.selectedStyle)}风格武器，复杂度${this.drawingAnalysis?.complexity || 0}`
                });
                
                if (result.code === 0 && result.data) {
                    this.createdWeapon = result.data;
                    Toast.success('武器创建成功！');
                    this.drawingImage = null;
                    this.drawingAnalysis = null;
                    this.weaponName = '';
                    this.clearDraft();
                    if (this.$refs.doodleCanvas) {
                        this.$refs.doodleCanvas.clearCanvas();
                    }
                    this.loadResources();
                } else {
                    Toast.error(result.msg || '创建失败');
                }
            } catch (error) {
                console.error('创建武器失败:', error);
                Toast.error(error.message || '创建失败，请重试');
                this.loadResources();
            } finally {
                this.creating = false;
            }
        },

        resetForm() {
            this.weaponName = '';
            this.attackPoints = 5;
            this.defensePoints = 5;
            this.speedPoints = 5;
            this.selectedStyle = 'normal';
            this.drawingAnalysis = null;
            this.drawingImage = null;
            this.createdWeapon = null;
            this.clearDraft();
            
            if (this.$refs.doodleCanvas) {
                this.$refs.doodleCanvas.clearCanvas();
            }
        },

        goBack() {
            Router.navigate('home');
        },

        goToBackpack() {
            Router.navigate('backpack');
        },

        getRarityText(rarity) {
            const map = {
                common: '普通',
                rare: '稀有',
                epic: '史诗',
                legendary: '传说'
            };
            return map[rarity] || '普通';
        },

        getStyleText(style) {
            const map = {
                normal: '⚪ 普通',
                fire: '🔥 火焰',
                ice: '❄️ 冰霜',
                lightning: '⚡ 雷电',
                poison: '☠️ 毒素',
                holy: '✨ 神圣',
                shadow: '🌑 暗影'
            };
            return map[style] || '普通';
        }
    }
};
