const WorkshopPage = {
    name: 'WorkshopPage',
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">🎨 创意工坊</h1>
                <button class="btn btn-secondary" @click="goBack">返回</button>
            </div>

            <div class="nav-tabs mb-4">
                <div 
                    v-for="filter in filters" 
                    :key="filter.code"
                    class="nav-tab" 
                    :class="{ active: currentFilter === filter.code }"
                    @click="switchFilter(filter.code)"
                >
                    {{ filter.icon }} {{ filter.name }}
                </div>
                <button class="btn btn-primary" style="margin-left: auto;" @click="showPublishModal = true">+ 发布作品</button>
            </div>

            <div v-if="!loading && works.length > 0" class="grid grid-2 grid-3">
                <div 
                    v-for="work in works" 
                    :key="work.id"
                    class="item-card bg-white"
                    @click="viewDetail(work)"
                >
                    <div class="weapon-preview">
                        <span style="font-size: 48px;">🗡️</span>
                    </div>
                    <div class="font-bold text-lg mb-2">{{ work.title }}</div>
                    <div class="text-sm text-gray-500 mb-2">
                        {{ work.description || '暂无描述' }}
                    </div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-500">
                            👤 {{ work.user_nickname || '匿名' }}
                        </span>
                        <span class="rarity-badge" :class="getRarityClass(work.rarity)">
                            {{ getRarityName(work.rarity) }}
                        </span>
                    </div>
                    <div class="flex gap-4 text-sm text-gray-500">
                        <span>❤️ {{ work.like_count || 0 }}</span>
                        <span>👁️ {{ work.view_count || 0 }}</span>
                    </div>
                    <div class="flex gap-2 mt-3" @click.stop>
                        <button 
                            class="btn btn-secondary"
                            style="padding: 8px 12px; font-size: 14px;"
                            @click="toggleLike(work.id)"
                        >
                            {{ work.is_liked ? '❤️' : '🤍' }} {{ work.like_count || 0 }}
                        </button>
                        <button 
                            class="btn btn-primary"
                            style="padding: 8px 12px; font-size: 14px;"
                            @click="showCopyConfirm(work)"
                        >
                            📋 复制
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="!loading && works.length === 0" class="empty-state">
                <div class="empty-state-icon">🎨</div>
                <div class="empty-state-text">暂无作品，快来发布第一个吧</div>
            </div>

            <div v-if="hasMore && !loading && works.length > 0" class="text-center mt-4">
                <button class="btn btn-secondary" @click="loadMore">加载更多</button>
            </div>

            <div v-if="loading" class="loading">
                <div class="loading-spinner"></div>
            </div>

            <div v-if="showDetail" class="modal-overlay" @click.self="closeDetail">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">{{ selectedWork?.title }}</h3>
                        <button class="modal-close" @click="closeDetail">×</button>
                    </div>
                    <div class="weapon-preview">
                        <span style="font-size: 80px;">🗡️</span>
                    </div>
                    <div class="text-center mb-4">
                        <span class="rarity-badge" :class="getRarityClass(selectedWork?.rarity)">
                            {{ getRarityName(selectedWork?.rarity) }}
                        </span>
                    </div>
                    <p class="mb-4 text-sm text-gray-500">{{ selectedWork?.description || '暂无描述' }}</p>
                    <div class="stats-grid mb-4">
                        <div class="stat-box">
                            <div class="stat-box-label">攻击</div>
                            <div class="stat-box-value">{{ selectedWork?.weapon_attack || selectedWork?.attack || 0 }}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-label">防御</div>
                            <div class="stat-box-value">{{ selectedWork?.weapon_defense || selectedWork?.defense || 0 }}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-label">速度</div>
                            <div class="stat-box-value">{{ selectedWork?.weapon_speed || selectedWork?.speed || 0 }}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-label">点赞</div>
                            <div class="stat-box-value">{{ selectedWork?.like_count || 0 }}</div>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button 
                            class="btn btn-secondary flex-1"
                            @click="toggleLike(selectedWork?.id)"
                        >
                            {{ selectedWork?.is_liked ? '❤️ 已点赞' : '🤍 点赞' }}
                        </button>
                        <button 
                            class="btn btn-primary flex-1"
                            @click="showCopyConfirm(selectedWork)"
                        >
                            📋 复制武器
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showCopyModal" class="modal-overlay" @click.self="closeCopyModal">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3 class="modal-title">复制武器</h3>
                        <button class="modal-close" @click="closeCopyModal">×</button>
                    </div>
                    <p class="mb-4">确定要复制 <strong>{{ copyingWork?.title }}</strong> 吗？</p>
                    <p class="text-sm text-gray-500 mb-4">将消耗颜料和画布资源</p>
                    <div class="flex gap-3">
                        <button class="btn btn-secondary flex-1" @click="closeCopyModal">取消</button>
                        <button class="btn btn-primary flex-1" @click="confirmCopy">确认复制</button>
                    </div>
                </div>
            </div>

            <div v-if="showPublishModal" class="modal-overlay" @click.self="closePublishModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">发布作品</h3>
                        <button class="modal-close" @click="closePublishModal">×</button>
                    </div>
                    <div class="auth-form">
                        <div class="form-group">
                            <label>选择武器</label>
                            <select v-model="publishForm.weapon_id" class="input w-full">
                                <option value="">请选择要发布的武器</option>
                                <option v-for="weapon in myWeapons" :key="weapon.id" :value="weapon.id">
                                    {{ weapon.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>作品标题</label>
                            <input 
                                v-model="publishForm.title" 
                                type="text" 
                                class="input w-full"
                                placeholder="给你的武器起个响亮的名字"
                                maxlength="30"
                            />
                        </div>
                        <div class="form-group">
                            <label>作品描述</label>
                            <textarea 
                                v-model="publishForm.description" 
                                class="input w-full"
                                placeholder="介绍一下你的武器吧..."
                                rows="3"
                                maxlength="200"
                                style="resize: vertical;"
                            ></textarea>
                        </div>
                    </div>
                    <div class="flex gap-3 mt-4">
                        <button class="btn btn-secondary flex-1" @click="closePublishModal">取消</button>
                        <button 
                            class="btn btn-primary flex-1" 
                            :disabled="!canPublish"
                            @click="publishWork"
                        >
                            发布
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            filters: [
                { code: 'hot', name: '热门', icon: '🔥' },
                { code: 'latest', name: '最新', icon: '🆕' }
            ],
            rarities: [
                { code: 'all', name: '全部' },
                { code: 'common', name: '普通' },
                { code: 'rare', name: '稀有' },
                { code: 'epic', name: '史诗' },
                { code: 'legendary', name: '传说' }
            ],
            currentFilter: 'hot',
            currentRarity: 'all',
            works: [],
            myWeapons: [],
            myResources: {
                paint: 0,
                canvas: 0
            },
            page: 1,
            pageSize: 10,
            hasMore: true,
            loading: false,
            showDetail: false,
            selectedWork: null,
            showCopyModal: false,
            copyingWork: null,
            showPublishModal: false,
            publishForm: {
                weapon_id: '',
                title: '',
                description: ''
            },
            copyCost: {
                paint: 10,
                canvas: 5
            }
        };
    },
    computed: {
        canCopy() {
            return this.myResources.paint >= this.copyCost.paint &&
                   this.myResources.canvas >= this.copyCost.canvas;
        },
        canPublish() {
            return this.publishForm.weapon_id &&
                   this.publishForm.title.trim() &&
                   this.publishForm.description.trim();
        },
        selectedWeaponPreview() {
            if (this.publishForm.weapon_id) {
                return this.myWeapons.find(w => w.id == this.publishForm.weapon_id);
            }
            return null;
        }
    },
    mounted() {
        this.loadData();
    },
    methods: {
        async loadData() {
            this.loading = true;
            try {
                await Promise.all([
                    this.loadWorks(),
                    this.loadMyWeapons(),
                    this.loadMyResources()
                ]);
            } catch (error) {
                console.error('加载数据失败:', error);
            } finally {
                this.loading = false;
            }
        },

        async loadWorks(reset = false) {
            if (reset) {
                this.page = 1;
                this.hasMore = true;
                this.works = [];
            }

            try {
                const params = {
                    sort_by: this.currentFilter === 'hot' ? 'like_count' : 'created_at',
                    page: this.page,
                    page_size: this.pageSize
                };

                const result = await API.workshop.getList(params);
                if (result.code === 0) {
                    const newWorks = result.data.items || [];
                    if (newWorks.length < this.pageSize) {
                        this.hasMore = false;
                    }
                    this.works = reset ? newWorks : [...this.works, ...newWorks];
                }
            } catch (error) {
                console.error('加载作品列表失败:', error);
            }
        },

        async loadMyWeapons() {
            try {
                const result = await API.weapon.getMyList();
                if (result.code === 0) {
                    this.myWeapons = result.data.items || [];
                }
            } catch (error) {
                console.error('加载我的武器失败:', error);
            }
        },

        async loadMyResources() {
            try {
                const result = await API.resource.getMyResources({ page_size: 100 });
                if (result.code === 0 && result.data) {
                    const items = result.data.items || [];
                    const resMap = {};
                    items.forEach(item => {
                        resMap[item.resource_type] = (resMap[item.resource_type] || 0) + (item.quantity || 0);
                    });
                    const user = AuthService.getUser();
                    this.myResources = {
                        paint: resMap.paint || user?.paint_count || 0,
                        canvas: resMap.canvas || user?.canvas_count || 0
                    };
                }
            } catch (error) {
                console.error('加载我的资源失败:', error);
                const user = AuthService.getUser();
                this.myResources = {
                    paint: user?.paint_count || 0,
                    canvas: user?.canvas_count || 0
                };
            }
        },

        switchFilter(filter) {
            this.currentFilter = filter;
            this.loadWorks(true);
        },

        switchRarity(rarity) {
            this.currentRarity = rarity;
            this.loadWorks(true);
        },

        getRarityName(code) {
            const map = {
                1: '普通', 2: '稀有', 3: '史诗', 4: '传说',
                'common': '普通', 'rare': '稀有', 'epic': '史诗', 'legendary': '传说'
            };
            return map[code] || code || '普通';
        },

        getRarityClass(rarity) {
            const map = {
                1: 'common', 2: 'rare', 3: 'epic', 4: 'legendary',
                'common': 'common', 'rare': 'rare', 'epic': 'epic', 'legendary': 'legendary'
            };
            return map[rarity] || 'common';
        },

        formatTime(time) {
            if (!time) return '';
            const date = new Date(time);
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            if (hours < 24) return `${hours}小时前`;
            if (days < 30) return `${days}天前`;
            return date.toLocaleDateString();
        },

        viewDetail(work) {
            this.selectedWork = work;
            this.showDetail = true;
            API.workshop.getById(work.id).then(result => {
                if (result.code === 0) {
                    this.selectedWork = result.data;
                }
            }).catch(error => {
                console.error('加载作品详情失败:', error);
            });
        },

        closeDetail() {
            this.showDetail = false;
            this.selectedWork = null;
        },

        async toggleLike(workId) {
            try {
                const result = await API.workshop.like(workId);
                if (result.code === 0) {
                    const work = this.works.find(w => w.id === workId);
                    if (work) {
                        work.is_liked = !work.is_liked;
                        work.like_count = (work.like_count || 0) + (work.is_liked ? 1 : -1);
                    }
                    if (this.selectedWork && this.selectedWork.id === workId) {
                        this.selectedWork.is_liked = !this.selectedWork.is_liked;
                        this.selectedWork.like_count = (this.selectedWork.like_count || 0) + (this.selectedWork.is_liked ? 1 : -1);
                    }
                    Toast.success(result.data?.is_liked ? '点赞成功' : '已取消点赞');
                }
            } catch (error) {
                Toast.error('操作失败: ' + (error.message || '未知错误'));
            }
        },

        showCopyConfirm(work) {
            this.copyingWork = work;
            this.showCopyModal = true;
        },

        closeCopyModal() {
            this.showCopyModal = false;
            this.copyingWork = null;
        },

        async confirmCopy() {
            if (!this.copyingWork) return;

            try {
                const result = await API.workshop.copyWeapon(this.copyingWork.id);
                if (result.code === 0) {
                    Toast.success('武器复制成功！已加入你的武器库');
                    this.closeCopyModal();
                    this.loadMyResources();
                }
            } catch (error) {
                Toast.error('复制失败: ' + (error.message || '未知错误'));
            }
        },

        closePublishModal() {
            this.showPublishModal = false;
            this.publishForm = {
                weapon_id: '',
                title: '',
                description: ''
            };
        },

        async publishWork() {
            if (!this.canPublish) return;

            try {
                const result = await API.workshop.publish({
                    weapon_id: this.publishForm.weapon_id,
                    title: this.publishForm.title,
                    description: this.publishForm.description
                });
                if (result.code === 0) {
                    Toast.success('作品发布成功！');
                    this.closePublishModal();
                    this.loadWorks(true);
                }
            } catch (error) {
                Toast.error('发布失败: ' + (error.message || '未知错误'));
            }
        },

        loadMore() {
            if (!this.hasMore) return;
            this.page++;
            this.loadWorks();
        },

        goBack() {
            Router.back();
        }
    }
};
