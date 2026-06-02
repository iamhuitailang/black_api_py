const InstrumentSelectPage = {
    template: `
        <div>
            <div class="page-header">
                <h1 class="page-title">选择乐器</h1>
                <p class="page-subtitle">选择你想要演奏的乐器</p>
            </div>
            
            <div v-if="selectedSong" style="margin-bottom: 30px; padding: 20px; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 80px; height: 80px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 36px; background: linear-gradient(135deg, var(--neon-purple), var(--neon-cyan));">
                        {{ selectedSong.icon }}
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold;">{{ selectedSong.title }}</div>
                        <div style="color: var(--text-secondary);">{{ selectedSong.artist }} · BPM {{ selectedSong.bpm }}</div>
                    </div>
                </div>
            </div>
            
            <div v-if="loading" class="loading">
                <div class="loading-spinner"></div>
            </div>
            
            <div v-else class="instrument-grid">
                <div 
                    v-for="instrument in instruments" 
                    :key="instrument.id"
                    class="instrument-card"
                    :class="{ 
                        selected: selectedInstrument?.id === instrument.id,
                        locked: instrument.unlock_level > (userLevel || 1)
                    }"
                    :style="{ '--instrument-color': instrument.color }"
                    @click="selectInstrument(instrument)"
                >
                    <div class="instrument-icon">{{ instrument.icon }}</div>
                    <div class="instrument-name">{{ instrument.name }}</div>
                    <div class="instrument-keys">{{ instrument.key_count }} 键</div>
                    <div v-if="instrument.unlock_level > (userLevel || 1)" class="instrument-unlock">
                        🔒 Lv.{{ instrument.unlock_level }} 解锁
                    </div>
                    <div v-else style="color: var(--neon-green); font-size: 12px;">✓ 已解锁</div>
                </div>
            </div>
            
            <div class="game-controls">
                <button class="btn btn-secondary" @click="$emit('navigate', 'home')">
                    ← 返回
                </button>
                <button 
                    class="btn btn-primary" 
                    :disabled="!selectedInstrument"
                    @click="confirmInstrument"
                >
                    下一步 →
                </button>
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
    setup(props, { emit }) {
        const { ref, computed, onMounted } = Vue;
        
        const selectedSong = ref(Storage.get('selectedSong'));
        const selectedInstrument = ref(null);
        const loading = ref(true);
        const instruments = ref([]);
        
        const userLevel = computed(() => props.user?.level || 1);
        
        const demoInstruments = [
            { id: 1, name: '键盘', icon: '🎹', key_count: 4, color: '#ff3366', unlock_level: 1, keys: ['D', 'F', 'J', 'K'] },
            { id: 2, name: '吉他', icon: '🎸', key_count: 5, color: '#ff8800', unlock_level: 1, keys: ['S', 'D', 'F', 'J', 'K'] },
            { id: 3, name: '贝斯', icon: '🎸', key_count: 6, color: '#ffff00', unlock_level: 3, keys: ['S', 'D', 'F', 'J', 'K', 'L'] },
            { id: 4, name: '鼓', icon: '🥁', key_count: 7, color: '#00ff88', unlock_level: 5, keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L'] },
            { id: 5, name: '钢琴', icon: '🎼', key_count: 6, color: '#00f5ff', unlock_level: 8, keys: ['S', 'D', 'F', 'J', 'K', 'L'] },
            { id: 6, name: '小提琴', icon: '🎻', key_count: 5, color: '#8b5cf6', unlock_level: 10, keys: ['D', 'F', 'G', 'H', 'J'] },
            { id: 7, name: '电子琴', icon: '🎹', key_count: 7, color: '#ff00ff', unlock_level: 15, keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L'] },
            { id: 8, name: '古筝', icon: '🎵', key_count: 4, color: '#0088ff', unlock_level: 20, keys: ['D', 'F', 'J', 'K'] }
        ];
        
        const selectInstrument = (instrument) => {
            if (instrument.unlock_level <= userLevel.value) {
                selectedInstrument.value = instrument;
            }
        };
        
        const confirmInstrument = () => {
            if (selectedInstrument.value) {
                Storage.save('selectedInstrument', selectedInstrument.value);
                emit('navigate', 'difficulty-select');
            }
        };
        
        const loadInstruments = async () => {
            loading.value = true;
            try {
                const result = await ApiService.get('/jinwutuan/instrument/list/get');
                if (result && result.code === 0 && result.data && result.data.items && result.data.items.length > 0) {
                    instruments.value = result.data.items.map((ins, i) => ({
                        ...ins,
                        icon: demoInstruments[i % demoInstruments.length].icon,
                        color: demoInstruments[i % demoInstruments.length].color,
                        keys: demoInstruments[i % demoInstruments.length].keys
                    }));
                } else {
                    instruments.value = demoInstruments;
                }
            } catch (e) {
                instruments.value = demoInstruments;
            } finally {
                loading.value = false;
            }
        };
        
        onMounted(() => {
            if (!selectedSong.value) {
                emit('navigate', 'home');
                return;
            }
            loadInstruments();
        });
        
        return {
            selectedSong,
            selectedInstrument,
            loading,
            instruments,
            userLevel,
            selectInstrument,
            confirmInstrument
        };
    }
};
