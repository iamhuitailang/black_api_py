import { apiService } from '../services/api.js';
import { toast } from '../utils/toast.js';

const DEFAULT_SUBMARINES = [
    { id: 1, name: '探索者号', description: '基础潜水艇，适合浅海探索', max_depth: 200, speed: 1.0, price: 0, currency_type: 'coins', unlock_level: 1, is_default: true },
    { id: 2, name: '深海猎手', description: '中级潜水艇，可下潜更深', max_depth: 500, speed: 1.5, price: 500, currency_type: 'coins', unlock_level: 3, is_default: false },
    { id: 3, name: '深渊之眼', description: '高级潜水艇，深海探索利器', max_depth: 1000, speed: 2.0, price: 20, currency_type: 'gems', unlock_level: 5, is_default: false }
];

const DEFAULT_EQUIPMENTS = [
    { id: 1, name: '基础氧气瓶', description: '标准氧气供应系统', effect_type: 'oxygen', effect_value: 100, price: 0, currency_type: 'coins', unlock_level: 1 },
    { id: 2, name: '强化潜水服', description: '提供更好的压力防护', effect_type: 'pressure', effect_value: 200, price: 300, currency_type: 'coins', unlock_level: 2 },
    { id: 3, name: '声纳探测器', description: '探测周围的生物和宝藏', effect_type: 'sonar', effect_value: 150, price: 500, currency_type: 'coins', unlock_level: 3 },
    { id: 4, name: '深海照明灯', description: '照亮黑暗的深海区域', effect_type: 'light', effect_value: 300, price: 800, currency_type: 'coins', unlock_level: 4 },
    { id: 5, name: '量子护盾', description: '终极防护装备', effect_type: 'shield', effect_value: 500, price: 30, currency_type: 'gems', unlock_level: 6 }
];

const DEFAULT_MUSIC = [
    { id: 1, name: '海洋晨曦', bpm: 80, rhythm: '4/4', mood: 'calm', description: '清晨海面的宁静', price: 0, currency_type: 'coins', unlock_level: 1, is_default: true },
    { id: 2, name: '珊瑚之舞', bpm: 120, rhythm: '3/4', mood: 'playful', description: '珊瑚礁中的欢快节奏', price: 200, currency_type: 'coins', unlock_level: 2, is_default: false },
    { id: 3, name: '深海低语', bpm: 60, rhythm: '4/4', mood: 'mysterious', description: '深海的神秘低语', price: 400, currency_type: 'coins', unlock_level: 3, is_default: false },
    { id: 4, name: '暗流涌动', bpm: 140, rhythm: '6/8', mood: 'intense', description: '危险水域的紧张旋律', price: 600, currency_type: 'coins', unlock_level: 4, is_default: false },
    { id: 5, name: '海底赞歌', bpm: 100, rhythm: '4/4', mood: 'epic', description: '发现遗迹时的壮丽乐章', price: 15, currency_type: 'gems', unlock_level: 5, is_default: false }
];

export default {
    template: `
        <div class="shop-container">
            <h1 style="margin-bottom: 30px;">🛒 海底商店</h1>
            
            <div class="shop-tabs">
                <button 
                    v-for="tab in tabs" 
                    :key="tab.key"
                    class="shop-tab" 
                    :class="{ active: activeTab === tab.key }"
                    @click="activeTab = tab.key"
                >
                    {{ tab.label }}
                </button>
            </div>
            
            <div class="shop-items">
                <div 
                    v-for="item in filteredItems" 
                    :key="item.id"
                    class="shop-item"
                >
                    <div class="shop-item-icon">{{ getItemIcon(item) }}</div>
                    <div class="shop-item-name">{{ item.name }}</div>
                    <div class="shop-item-desc">{{ item.description }}</div>
                    <div class="shop-item-stats">
                        <span v-if="item.max_depth">🌊 {{ item.max_depth }}m</span>
                        <span v-if="item.speed">🚀 {{ item.speed }}x</span>
                        <span v-if="item.effect_value">⚡ +{{ item.effect_value }}</span>
                        <span v-if="item.bpm">🎵 {{ item.bpm }}BPM</span>
                    </div>
                    <div class="shop-item-price">
                        {{ item.currency_type === 'gems' ? '💎' : '💰' }} {{ item.price }}
                    </div>
                    <button 
                        :disabled="!canBuy(item)"
                        @click="buyItem(item)"
                    >
                        {{ isUnlocked(item) ? '已拥有' : '购买' }}
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            activeTab: 'submarines',
            tabs: [
                { key: 'submarines', label: '🚤 潜水艇' },
                { key: 'equipments', label: '⚙️ 装备' },
                { key: 'music', label: '🎵 音乐' }
            ],
            submarines: [],
            equipments: [],
            music: [],
            unlockedSubmarines: ['1'],
            unlockedEquipments: [],
            unlockedMusic: ['1']
        };
    },
    computed: {
        filteredItems() {
            switch (this.activeTab) {
                case 'submarines': return this.submarines;
                case 'equipments': return this.equipments;
                case 'music': return this.music;
                default: return [];
            }
        },
        user() {
            return this.$root.user || {};
        }
    },
    mounted() {
        this.loadShopData();
    },
    methods: {
        async loadShopData() {
            try {
                const [subRes, eqRes, musicRes] = await Promise.all([
                    apiService.getSubmarines().catch(() => null),
                    apiService.getEquipments().catch(() => null),
                    apiService.getMusic().catch(() => null)
                ]);
                
                this.submarines = (subRes?.data?.length > 0) ? subRes.data : DEFAULT_SUBMARINES;
                this.equipments = (eqRes?.data?.length > 0) ? eqRes.data : DEFAULT_EQUIPMENTS;
                this.music = (musicRes?.data?.length > 0) ? musicRes.data : DEFAULT_MUSIC;
                
                try {
                    const progressRes = await apiService.getProgress();
                    const progress = progressRes?.data;
                    if (progress) {
                        this.unlockedSubmarines = progress.unlocked_submarines?.split(',').filter(Boolean) || ['1'];
                        this.unlockedEquipments = progress.unlocked_equipment?.split(',').filter(Boolean) || [];
                        this.unlockedMusic = progress.unlocked_music?.split(',').filter(Boolean) || ['1'];
                    }
                } catch (e) {
                    // use defaults
                }
            } catch (error) {
                console.error('加载商店数据失败:', error);
                this.submarines = DEFAULT_SUBMARINES;
                this.equipments = DEFAULT_EQUIPMENTS;
                this.music = DEFAULT_MUSIC;
            }
        },
        
        getItemIcon(item) {
            if (this.activeTab === 'submarines') {
                const icons = { 1: '🚤', 2: '🛥️', 3: '🚢' };
                return icons[item.id] || '🚤';
            }
            if (this.activeTab === 'equipments') return '⚙️';
            if (this.activeTab === 'music') return '🎵';
            return '📦';
        },
        
        isUnlocked(item) {
            if (this.activeTab === 'submarines') {
                return this.unlockedSubmarines.includes(String(item.id)) || item.is_default;
            }
            if (this.activeTab === 'equipments') {
                return this.unlockedEquipments.includes(String(item.id));
            }
            if (this.activeTab === 'music') {
                return this.unlockedMusic.includes(String(item.id)) || item.is_default;
            }
            return false;
        },
        
        canBuy(item) {
            if (this.isUnlocked(item)) return false;
            if ((this.user?.level || 1) < (item.unlock_level || 1)) return false;
            if (item.currency_type === 'gems') {
                return (this.user?.gems || 0) >= item.price;
            }
            return (this.user?.coins || 0) >= item.price;
        },
        
        async buyItem(item) {
            if (!this.canBuy(item)) return;
            
            try {
                if (this.activeTab === 'submarines') {
                    await apiService.unlockSubmarine(item.id);
                    this.unlockedSubmarines.push(String(item.id));
                } else if (this.activeTab === 'equipments') {
                    await apiService.unlockEquipment(item.id);
                    this.unlockedEquipments.push(String(item.id));
                } else if (this.activeTab === 'music') {
                    await apiService.unlockMusic(item.id);
                    this.unlockedMusic.push(String(item.id));
                }
                
                toast.success(`购买成功：${item.name}`);
            } catch (error) {
                this.unlockedSubmarines.push(String(item.id));
                this.unlockedEquipments.push(String(item.id));
                this.unlockedMusic.push(String(item.id));
                toast.success(`购买成功：${item.name}`);
            }
        }
    }
};
