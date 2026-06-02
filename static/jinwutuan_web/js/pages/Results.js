const ResultsPage = {
    template: `
        <div class="results-container">
            <div class="results-card">
                <h1 style="font-size: 28px; margin-bottom: 10px; background: linear-gradient(90deg, var(--neon-cyan), var(--neon-pink)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    演奏完成！
                </h1>
                
                <div v-if="results" style="margin-bottom: 20px; color: var(--text-secondary); font-size: 14px;">
                    {{ results.song?.title }} · {{ results.instrument?.name }} · {{ difficultyText }}
                </div>
                
                <div class="rank-display">{{ results?.rank || 'D' }}</div>
                
                <div class="results-score">
                    {{ (results?.score || 0).toLocaleString() }}
                </div>
                
                <div class="results-stats">
                    <div class="result-stat">
                        <div class="result-stat-label">Perfect</div>
                        <div class="result-stat-value perfect">{{ results?.judgments?.perfect || 0 }}</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-label">Great</div>
                        <div class="result-stat-value great">{{ results?.judgments?.great || 0 }}</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-label">Good</div>
                        <div class="result-stat-value good">{{ results?.judgments?.good || 0 }}</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-label">Miss</div>
                        <div class="result-stat-value miss">{{ results?.judgments?.miss || 0 }}</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px; font-size: 18px;">
                    最大连击: <span style="color: var(--neon-yellow); font-weight: bold;">{{ results?.maxCombo || 0 }}</span>
                </div>
                
                <div style="margin-bottom: 20px; font-size: 14px; color: var(--text-secondary);">
                    准确率: <span style="color: var(--neon-green); font-weight: bold;">{{ accuracy }}%</span>
                </div>
                
                <div class="results-rewards">
                    <div class="reward-item">
                        <div class="reward-icon">⭐</div>
                        <div class="reward-value">+{{ expEarned }}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">经验</div>
                    </div>
                    <div class="reward-item">
                        <div class="reward-icon">🪙</div>
                        <div class="reward-value">+{{ coinsEarned }}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">金币</div>
                    </div>
                </div>
                
                <div class="game-controls">
                    <button class="btn btn-secondary" @click="$emit('navigate', 'home')">
                        返回歌曲列表
                    </button>
                    <button class="btn btn-primary" @click="playAgain">
                        再来一次
                    </button>
                </div>
            </div>
        </div>
    `,
    emits: ['navigate'],
    setup(props, { emit }) {
        const { ref, computed, onMounted } = Vue;
        
        const results = ref(Storage.get('gameResults'));
        
        const difficultyText = computed(() => {
            const map = { easy: '简单', normal: '普通', hard: '困难' };
            return map[results.value?.difficulty] || '普通';
        });
        
        const accuracy = computed(() => {
            if (!results.value?.judgments) return '0.00';
            const j = results.value.judgments;
            const total = j.perfect + j.great + j.good + j.miss;
            if (total === 0) return '0.00';
            const acc = ((j.perfect * 100 + j.great * 80 + j.good * 50) / (total * 100)) * 100;
            return acc.toFixed(2);
        });
        
        const expEarned = computed(() => {
            if (!results.value) return 0;
            const baseExp = 50;
            const rankMultiplier = { S: 3, A: 2.5, B: 2, C: 1.5, D: 1 };
            const diffMultiplier = { easy: 1, normal: 1.5, hard: 2.5 };
            const rank = results.value.rank || 'D';
            const diff = results.value.difficulty || 'normal';
            return Math.floor(baseExp * (rankMultiplier[rank] || 1) * (diffMultiplier[diff] || 1));
        });
        
        const coinsEarned = computed(() => {
            if (!results.value) return 0;
            const baseCoins = 20;
            const rankMultiplier = { S: 5, A: 4, B: 3, C: 2, D: 1 };
            const diffMultiplier = { easy: 1, normal: 1.5, hard: 2.5 };
            const rank = results.value.rank || 'D';
            const diff = results.value.difficulty || 'normal';
            return Math.floor(baseCoins * (rankMultiplier[rank] || 1) * (diffMultiplier[diff] || 1));
        });
        
        const playAgain = () => {
            emit('navigate', 'difficulty-select');
        };
        
        onMounted(() => {
            if (!results.value) {
                emit('navigate', 'home');
            }
        });
        
        return {
            results,
            difficultyText,
            accuracy,
            expEarned,
            coinsEarned,
            playAgain
        };
    }
};
