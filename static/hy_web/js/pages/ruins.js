import { apiService } from '../services/api.js';
import { toast } from '../utils/toast.js';

const DEFAULT_RUINS = [
    { id: 1, name: '沉没的灯塔', description: '一座古老灯塔的残骸，据说里面藏着航海家的宝藏', depth: 100, difficulty: 'easy', required_level: 1, treasure_reward: 100, exp_reward: 50 },
    { id: 2, name: '亚特兰蒂斯前哨', description: '传说中亚特兰蒂斯文明的前哨站遗迹', depth: 300, difficulty: 'medium', required_level: 3, treasure_reward: 300, exp_reward: 150 },
    { id: 3, name: '深海神殿', description: '神秘的海底神殿，充满了未知的危险和宝藏', depth: 600, difficulty: 'hard', required_level: 5, treasure_reward: 600, exp_reward: 300 },
    { id: 4, name: '深渊之门', description: '通往海底最深处的神秘门户，只有最勇敢的探险者才敢接近', depth: 900, difficulty: 'extreme', required_level: 8, treasure_reward: 1000, exp_reward: 500 }
];

export default {
    template: `
        <div class="ruins-container">
            <h1 style="margin-bottom: 30px;">🏛️ 深海遗迹</h1>
            
            <div class="ruins-list">
                <div 
                    v-for="ruin in ruins" 
                    :key="ruin.id"
                    class="ruin-card"
                    :class="{ 
                        discovered: isDiscovered(ruin),
                        locked: !canExplore(ruin)
                    }"
                >
                    <div class="ruin-header">
                        <div class="ruin-name">{{ ruin.name }}</div>
                        <div class="ruin-difficulty" :class="ruin.difficulty">
                            {{ getDifficultyLabel(ruin.difficulty) }}
                        </div>
                    </div>
                    
                    <div class="ruin-depth">📍 深度: {{ ruin.depth }} 米</div>
                    <div class="ruin-description">{{ ruin.description }}</div>
                    
                    <div class="ruin-rewards">
                        <span class="ruin-reward">💰 {{ ruin.treasure_reward }}</span>
                        <span class="ruin-reward">⭐ {{ ruin.exp_reward }} EXP</span>
                    </div>
                    
                    <div style="font-size: 12px; color: #b8d4e8; margin-bottom: 15px;">
                        需要等级: Lv.{{ ruin.required_level }}
                    </div>
                    
                    <button 
                        :disabled="!canExplore(ruin)"
                        @click="exploreRuin(ruin)"
                    >
                        {{ isDiscovered(ruin) ? '再次探索' : '开始探索' }}
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            ruins: [],
            discoveredRuins: []
        };
    },
    computed: {
        user() {
            return this.$root.user || {};
        }
    },
    mounted() {
        this.loadRuinsData();
    },
    methods: {
        async loadRuinsData() {
            try {
                const [ruinsRes, progressRes] = await Promise.all([
                    apiService.getRuins().catch(() => null),
                    apiService.getProgress().catch(() => null)
                ]);
                
                this.ruins = (ruinsRes?.data?.length > 0) ? ruinsRes.data : DEFAULT_RUINS;
                const progress = progressRes?.data;
                if (progress) {
                    this.discoveredRuins = progress.discovered_ruins?.split(',').filter(Boolean) || [];
                }
            } catch (error) {
                console.error('加载遗迹数据失败:', error);
                this.ruins = DEFAULT_RUINS;
            }
        },
        
        getDifficultyLabel(difficulty) {
            const labels = { 'easy': '简单', 'medium': '中等', 'hard': '困难', 'extreme': '极限' };
            return labels[difficulty] || difficulty;
        },
        
        isDiscovered(ruin) {
            return this.discoveredRuins.includes(String(ruin.id));
        },
        
        canExplore(ruin) {
            return (this.user?.level || 1) >= ruin.required_level;
        },
        
        async exploreRuin(ruin) {
            if (!this.canExplore(ruin)) {
                toast.error('等级不足！');
                return;
            }
            
            try {
                if (!this.isDiscovered(ruin)) {
                    await apiService.discoverRuin(ruin.id).catch(() => {});
                    this.discoveredRuins.push(String(ruin.id));
                }
                
                toast.success(`探索了 ${ruin.name}！获得 ${ruin.treasure_reward} 金币，${ruin.exp_reward} 经验`);
            } catch (error) {
                toast.error('探索失败');
            }
        }
    }
};
