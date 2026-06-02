const DifficultySelectPage = {
    template: `
        <div class="difficulty-container">
            <div class="page-header">
                <h1 class="page-title">选择难度</h1>
                <p class="page-subtitle">选择适合你的难度等级</p>
            </div>
            
            <div v-if="selectedSong && selectedInstrument" style="margin-bottom: 30px; padding: 20px; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; background: linear-gradient(135deg, var(--neon-purple), var(--neon-cyan));">
                        {{ selectedSong.icon }}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 20px; font-weight: bold;">{{ selectedSong.title }}</div>
                        <div style="color: var(--text-secondary); font-size: 14px;">{{ selectedSong.artist }}</div>
                    </div>
                    <div style="width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; background: linear-gradient(135deg, #667eea, #764ba2);">
                        {{ selectedInstrument.icon }}
                    </div>
                </div>
            </div>
            
            <div class="difficulty-cards">
                <div 
                    v-if="selectedSong.easy_enabled"
                    class="difficulty-card easy"
                    :class="{ selected: selectedDifficulty === 'easy' }"
                    @click="selectedDifficulty = 'easy'"
                >
                    <div class="difficulty-info">
                        <div class="difficulty-level">{{ selectedSong.easy_level || 5 }}</div>
                        <div>
                            <div class="difficulty-name">简单 Easy</div>
                            <div class="difficulty-notes">{{ getNoteCount('easy') }} 音符 · 适合新手</div>
                        </div>
                    </div>
                    <div style="font-size: 24px;">😊</div>
                </div>
                
                <div 
                    v-if="selectedSong.normal_enabled"
                    class="difficulty-card normal"
                    :class="{ selected: selectedDifficulty === 'normal' }"
                    @click="selectedDifficulty = 'normal'"
                >
                    <div class="difficulty-info">
                        <div class="difficulty-level">{{ selectedSong.normal_level || 10 }}</div>
                        <div>
                            <div class="difficulty-name">普通 Normal</div>
                            <div class="difficulty-notes">{{ getNoteCount('normal') }} 音符 · 需要一定基础</div>
                        </div>
                    </div>
                    <div style="font-size: 24px;">😎</div>
                </div>
                
                <div 
                    v-if="selectedSong.hard_enabled"
                    class="difficulty-card hard"
                    :class="{ selected: selectedDifficulty === 'hard' }"
                    @click="selectedDifficulty = 'hard'"
                >
                    <div class="difficulty-info">
                        <div class="difficulty-level">{{ selectedSong.hard_level || 18 }}</div>
                        <div>
                            <div class="difficulty-name">困难 Hard</div>
                            <div class="difficulty-notes">{{ getNoteCount('hard') }} 音符 · 高手挑战</div>
                        </div>
                    </div>
                    <div style="font-size: 24px;">🔥</div>
                </div>
            </div>
            
            <div class="game-controls" style="margin-top: 30px;">
                <button class="btn btn-secondary" @click="$emit('navigate', 'instrument-select')">
                    ← 返回
                </button>
                <button 
                    class="btn btn-primary" 
                    :disabled="!selectedDifficulty"
                    @click="startGame"
                >
                    开始游戏 🎮
                </button>
            </div>
        </div>
    `,
    emits: ['navigate'],
    setup(props, { emit }) {
        const { ref, onMounted } = Vue;
        
        const selectedSong = ref(Storage.get('selectedSong'));
        const selectedInstrument = ref(Storage.get('selectedInstrument'));
        const selectedDifficulty = ref(null);
        
        const getNoteCount = (difficulty) => {
            const bpm = selectedSong.value?.bpm || 120;
            const duration = 60;
            const multiplier = difficulty === 'easy' ? 0.5 : difficulty === 'normal' ? 1 : 1.8;
            return Math.floor((bpm / 60) * duration * multiplier);
        };
        
        const generateNotes = () => {
            const bpm = selectedSong.value.bpm;
            const keyCount = selectedInstrument.value.key_count;
            const difficulty = selectedDifficulty.value;
            
            const beatInterval = 60000 / bpm;
            const duration = 60000;
            const totalNotes = getNoteCount(difficulty);
            
            const difficultyMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'normal' ? 1 : 1.3;
            
            const notes = [];
            let noteId = 0;
            
            const noteInterval = beatInterval / difficultyMultiplier;
            
            for (let time = 2000; time < duration; time += noteInterval) {
                const noteCount = difficulty === 'hard' ? (Math.random() > 0.7 ? 2 : 1) : 1;
                
                const usedLanes = new Set();
                for (let i = 0; i < noteCount; i++) {
                    let lane;
                    do {
                        lane = Math.floor(Math.random() * keyCount);
                    } while (usedLanes.has(lane));
                    usedLanes.add(lane);
                    
                    notes.push({
                        id: noteId++,
                        time: time,
                        lane: lane,
                        hit: false,
                        missed: false
                    });
                }
                
                if (difficulty === 'hard' && Math.random() > 0.8) {
                    time += noteInterval / 2;
                    const lane = Math.floor(Math.random() * keyCount);
                    notes.push({
                        id: noteId++,
                        time: time,
                        lane: lane,
                        hit: false,
                        missed: false
                    });
                }
            }
            
            return notes;
        };
        
        const startGame = () => {
            if (!selectedDifficulty.value) return;
            
            const notes = generateNotes();
            Storage.save('gameNotes', notes);
            Storage.save('selectedDifficulty', selectedDifficulty.value);
            Storage.save('noteCount', getNoteCount(selectedDifficulty.value));
            emit('navigate', 'game');
        };
        
        onMounted(() => {
            if (!selectedSong.value || !selectedInstrument.value) {
                emit('navigate', 'home');
                return;
            }
            selectedDifficulty.value = selectedSong.value.normal_enabled ? 'normal' : (selectedSong.value.easy_enabled ? 'easy' : 'hard');
        });
        
        return {
            selectedSong,
            selectedInstrument,
            selectedDifficulty,
            getNoteCount,
            startGame
        };
    }
};
