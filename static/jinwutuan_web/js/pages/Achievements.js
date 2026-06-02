const AchievementsPage = {
    template: `
        <div>
            <div class="page-header">
                <h1 class="page-title">成就系统</h1>
                <p class="page-subtitle">完成挑战，获取丰厚奖励</p>
                
                <div style="margin-top: 15px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                    <div style="padding: 10px 20px; background: rgba(0, 245, 255, 0.1); border-radius: 8px; border: 1px solid var(--neon-cyan);">
                        <span style="color: var(--neon-cyan);">✓</span> 已解锁: {{ unlockedCount }} / {{ achievements.length }}
                    </div>
                    <div style="padding: 10px 20px; background: rgba(255, 255, 0, 0.1); border-radius: 8px; border: 1px solid var(--neon-yellow);">
                        <span style="color: var(--neon-yellow);">🪙</span> 累计奖励: {{ totalRewards }} 金币
                    </div>
                </div>
            </div>
            
            <div v-if="loading" class="loading">
                <div class="loading-spinner"></div>
            </div>
            
            <div v-else class="achievements-grid">
                <div 
                    v-for="achievement in achievements" 
                    :key="achievement.id"
                    class="achievement-card"
                    :class="{ unlocked: achievement.unlocked, locked: !achievement.unlocked }"
                >
                    <div class="achievement-icon">
                        {{ achievement.unlocked ? achievement.icon : '🔒' }}
                    </div>
                    <div class="achievement-name">{{ achievement.name }}</div>
                    <div class="achievement-description">{{ achievement.description }}</div>
                    
                    <div v-if="!achievement.unlocked && achievement.progress !== undefined" class="achievement-progress">
                        <div class="achievement-progress-bar">
                            <div class="achievement-progress-fill" :style="{ width: Math.min(100, achievement.progress) + '%' }"></div>
                        </div>
                        <div class="achievement-progress-text">
                            {{ achievement.current }} / {{ achievement.target }}
                        </div>
                    </div>
                    
                    <div class="achievement-reward">
                        <span>🪙</span>
                        <span>+{{ achievement.reward }}</span>
                        <span v-if="achievement.unlocked" style="color: var(--neon-green);">✓ 已领取</span>
                    </div>
                </div>
            </div>
            
            <div v-if="!loading && achievements.length === 0" class="empty-state">
                <div class="empty-state-icon">🏅</div>
                <div class="empty-state-text">暂无成就数据</div>
            </div>
        </div>
    `,
    props: {
        user: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['navigate'],
    setup(props) {
        const { ref, computed, onMounted } = Vue;
        
        const loading = ref(true);
        const achievements = ref([]);
        
        const demoAchievements = [
            { id: 1, name: '初出茅庐', description: '完成第一首歌曲', icon: '🎮', reward: 50, unlocked: true, progress: 100, current: 1, target: 1 },
            { id: 2, name: '连击新手', description: '达成50连击', icon: '🔥', reward: 100, unlocked: true, progress: 100, current: 50, target: 50 },
            { id: 3, name: '连击达人', description: '达成100连击', icon: '💥', reward: 200, unlocked: false, progress: 65, current: 65, target: 100 },
            { id: 4, name: '连击大师', description: '达成200连击', icon: '⚡', reward: 500, unlocked: false, progress: 32, current: 65, target: 200 },
            { id: 5, name: '完美演奏', description: '在任意歌曲中获得全Perfect', icon: '⭐', reward: 1000, unlocked: false, progress: 0, current: 0, target: 1 },
            { id: 6, name: 'S级评价', description: '获得S级评价', icon: '🏆', reward: 300, unlocked: true, progress: 100, current: 1, target: 1 },
            { id: 7, name: '全连高手', description: '任意歌曲Full Combo', icon: '🎯', reward: 500, unlocked: false, progress: 0, current: 0, target: 1 },
            { id: 8, name: '勤奋玩家', description: '累计游玩50次', icon: '🎵', reward: 200, unlocked: false, progress: 48, current: 24, target: 50 },
            { id: 9, name: '音乐收藏家', description: '游玩10首不同的歌曲', icon: '🎼', reward: 300, unlocked: false, progress: 70, current: 7, target: 10 },
            { id: 10, name: '升级达人', description: '达到20级', icon: '📈', reward: 500, unlocked: false, progress: 75, current: 15, target: 20 },
            { id: 11, name: '完美主义者', description: '累计获得100个Perfect', icon: '💯', reward: 200, unlocked: true, progress: 100, current: 156, target: 100 },
            { id: 12, name: '零失误', description: '任意难度无Miss完成歌曲', icon: '🎖️', reward: 400, unlocked: false, progress: 0, current: 0, target: 1 }
        ];
        
        const unlockedCount = computed(() => {
            return achievements.value.filter(a => a.unlocked).length;
        });
        
        const totalRewards = computed(() => {
            return achievements.value
                .filter(a => a.unlocked)
                .reduce((sum, a) => sum + a.reward, 0);
        });
        
        const loadAchievements = async () => {
            loading.value = true;
            try {
                const result = await ApiService.get('/jinwutuan/achievement/all/get');
                if (result && result.code === 0 && result.data && result.data.length > 0) {
                    achievements.value = result.data.map((a, i) => ({
                        ...a,
                        icon: demoAchievements[i % demoAchievements.length].icon,
                        reward: a.reward_coins || 100,
                        unlocked: false,
                        progress: 0,
                        current: 0,
                        target: a.condition_value || 1
                    }));
                } else {
                    achievements.value = demoAchievements;
                }
            } catch (e) {
                achievements.value = demoAchievements;
            } finally {
                loading.value = false;
            }
        };
        
        onMounted(() => {
            loadAchievements();
        });
        
        return {
            loading,
            achievements,
            unlockedCount,
            totalRewards
        };
    }
};
