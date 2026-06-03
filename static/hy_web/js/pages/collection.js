import { apiService } from '../services/api.js';

const DEFAULT_CREATURES = [
    { id: 1, name: '小丑鱼', rarity: 'common', is_dangerous: false, coins_value: 10 },
    { id: 2, name: '蓝唐王鱼', rarity: 'common', is_dangerous: false, coins_value: 15 },
    { id: 3, name: '狮子鱼', rarity: 'uncommon', is_dangerous: true, coins_value: 30 },
    { id: 4, name: '水母', rarity: 'uncommon', is_dangerous: true, coins_value: 25 },
    { id: 5, name: '巨型章鱼', rarity: 'rare', is_dangerous: true, coins_value: 50 },
    { id: 6, name: '大王乌贼', rarity: 'rare', is_dangerous: true, coins_value: 80 },
    { id: 7, name: '灯笼鱼', rarity: 'uncommon', is_dangerous: false, coins_value: 35 },
    { id: 8, name: '吞噬鳗', rarity: 'epic', is_dangerous: true, coins_value: 100 }
];

const DEFAULT_TREASURES = [
    { id: 1, name: '金币袋', rarity: 'common', coins_value: 50 },
    { id: 2, name: '珍珠', rarity: 'uncommon', coins_value: 100 },
    { id: 3, name: '海盗宝箱', rarity: 'rare', coins_value: 200 },
    { id: 4, name: '古代金币', rarity: 'uncommon', coins_value: 150 },
    { id: 5, name: '海洋之心', rarity: 'epic', coins_value: 500 },
    { id: 6, name: '沉船遗骸', rarity: 'rare', coins_value: 300 }
];

const RARITY_MAP = { common: '普通', uncommon: '稀有', rare: '珍稀', epic: '史诗', legendary: '传说' };

export default {
    template: `
        <div class="collection-container">
            <h1 style="margin-bottom: 30px;">📚 收集图鉴</h1>
            
            <div class="collection-tabs">
                <button 
                    v-for="tab in tabs" 
                    :key="tab.key"
                    class="collection-tab" 
                    :class="{ active: activeTab === tab.key }"
                    @click="activeTab = tab.key"
                >
                    {{ tab.label }}
                </button>
            </div>
            
            <div class="collection-grid">
                <div 
                    v-for="item in displayItems" 
                    :key="item.id"
                    class="collection-item"
                    :class="{ 
                        collected: isCollected(item),
                        locked: !isCollected(item)
                    }"
                >
                    <div class="collection-item-icon">{{ getItemEmoji(item) }}</div>
                    <div class="collection-item-name">
                        {{ isCollected(item) ? item.name : '???' }}
                    </div>
                    <div class="collection-item-count" v-if="isCollected(item)">
                        x{{ getCount(item) }}
                    </div>
                    <div v-if="isCollected(item)" style="font-size: 12px; color: #888;">
                        {{ RARITY_MAP[item.rarity] || item.rarity }}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #b8d4e8;">
                收集进度: {{ collectedCount }} / {{ totalCount }}
            </div>
        </div>
    `,
    data() {
        return {
            activeTab: 'creatures',
            tabs: [
                { key: 'creatures', label: '🐠 海洋生物' },
                { key: 'treasures', label: '💎 宝藏' }
            ],
            creatures: [],
            treasures: [],
            collections: [],
            RARITY_MAP
        };
    },
    computed: {
        displayItems() {
            return this.activeTab === 'creatures' ? this.creatures : this.treasures;
        },
        collectedCount() {
            return this.displayItems.filter(item => this.isCollected(item)).length;
        },
        totalCount() {
            return this.displayItems.length;
        }
    },
    mounted() {
        this.loadCollectionData();
    },
    methods: {
        async loadCollectionData() {
            try {
                const [creaturesRes, treasuresRes, collectionsRes] = await Promise.all([
                    apiService.getCreatures().catch(() => null),
                    apiService.getTreasures().catch(() => null),
                    apiService.getCollections().catch(() => null)
                ]);
                
                this.creatures = (creaturesRes?.data?.length > 0) ? creaturesRes.data : DEFAULT_CREATURES;
                this.treasures = (treasuresRes?.data?.length > 0) ? treasuresRes.data : DEFAULT_TREASURES;
                this.collections = collectionsRes?.data || [];
            } catch (error) {
                console.error('加载图鉴数据失败:', error);
                this.creatures = DEFAULT_CREATURES;
                this.treasures = DEFAULT_TREASURES;
            }
        },
        
        isCollected(item) {
            const itemType = this.activeTab === 'creatures' ? 'creature' : 'treasure';
            return this.collections.some(c => 
                c.item_type === itemType && c.item_id === item.id
            );
        },
        
        getCount(item) {
            const itemType = this.activeTab === 'creatures' ? 'creature' : 'treasure';
            const collection = this.collections.find(c => 
                c.item_type === itemType && c.item_id === item.id
            );
            return collection?.count || 1;
        },
        
        getItemEmoji(item) {
            if (this.activeTab === 'creatures') {
                const emojis = {
                    '小丑鱼': '🐠', '蓝唐王鱼': '🐟', '狮子鱼': '🦑',
                    '水母': '🪼', '巨型章鱼': '🐙', '大王乌贼': '🦑',
                    '灯笼鱼': '🐡', '吞噬鳗': '🐍'
                };
                return this.isCollected(item) ? (emojis[item.name] || '🐟') : '❓';
            } else {
                const emojis = {
                    '金币袋': '💰', '珍珠': '🔮', '海盗宝箱': '📦',
                    '古代金币': '🪙', '海洋之心': '💎', '沉船遗骸': '🚢'
                };
                return this.isCollected(item) ? (emojis[item.name] || '💎') : '❓';
            }
        }
    }
};
