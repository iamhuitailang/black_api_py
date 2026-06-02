const GamePage = {
    template: `
        <div class="game-container">
            <div class="page-header" style="margin-bottom: 15px;">
                <h1 class="page-title" style="font-size: 24px;">{{ selectedSong?.title }}</h1>
                <p class="page-subtitle">{{ selectedSong?.artist }} · {{ selectedInstrument?.name }} · {{ difficultyText }}</p>
            </div>
            
            <div class="game-header">
                <div class="game-stats">
                    <div class="game-stat">
                        <div class="stat-label">分数</div>
                        <div class="stat-value">{{ score.toLocaleString() }}</div>
                    </div>
                    <div class="game-stat">
                        <div class="stat-label">连击</div>
                        <div class="stat-value combo">{{ combo }}</div>
                    </div>
                    <div class="game-stat">
                        <div class="stat-label">最大连击</div>
                        <div class="stat-value">{{ maxCombo }}</div>
                    </div>
                </div>
                <div class="game-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                    </div>
                </div>
                <button class="btn btn-secondary btn-small" @click="togglePause">
                    {{ isPaused ? '继续' : '暂停' }}
                </button>
            </div>
            
            <div class="game-area" ref="gameArea">
                <div class="game-lanes">
                    <div 
                        v-for="(lane, laneIndex) in lanes" 
                        :key="laneIndex"
                        class="game-lane"
                    >
                        <div 
                            v-for="note in getLaneNotes(laneIndex)" 
                            :key="note.id"
                            class="note"
                            :style="{ 
                                top: note.position + 'px',
                                '--note-color': lane.color 
                            }"
                        ></div>
                        <div 
                            class="lane-key"
                            :class="{ pressed: pressedKeys[lane.key] }"
                            :style="{ '--lane-color': lane.color }"
                        >
                            {{ lane.key }}
                        </div>
                    </div>
                </div>
                <div class="hit-zone"></div>
                
                <div v-if="currentJudgment" class="judgment-display" :class="'judgment-' + currentJudgment.toLowerCase()">
                    {{ currentJudgment }}
                </div>
                
                <div v-if="isPaused && !isGameOver" class="game-pause-overlay">
                    <h2>游戏暂停</h2>
                    <div class="game-controls">
                        <button class="btn btn-primary" @click="togglePause">继续游戏</button>
                        <button class="btn btn-secondary" @click="quitGame">退出游戏</button>
                    </div>
                </div>
                
                <div v-if="isGameOver" class="game-pause-overlay">
                    <h2>游戏结束</h2>
                    <div style="font-size: 48px; font-weight: bold; color: var(--neon-cyan); margin: 20px 0;">
                        {{ finalRank }}
                    </div>
                    <div style="font-size: 24px; margin-bottom: 30px;">
                        最终得分: {{ score.toLocaleString() }}
                    </div>
                    <div class="game-controls">
                        <button class="btn btn-primary" @click="showResults">查看结果</button>
                        <button class="btn btn-secondary" @click="quitGame">返回选歌</button>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center; color: var(--text-muted); font-size: 14px;">
                按键提示: {{ lanes.map(l => l.key).join(' / ') }} · ESC 暂停
            </div>
        </div>
    `,
    props: {
        user: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['navigate', 'game-complete'],
    setup(props, { emit }) {
        const { ref, reactive, computed, onMounted, onUnmounted, nextTick } = Vue;
        
        const gameArea = ref(null);
        const selectedSong = ref(Storage.get('selectedSong'));
        const selectedInstrument = ref(Storage.get('selectedInstrument'));
        const selectedDifficulty = ref(Storage.get('selectedDifficulty'));
        const noteCount = ref(Storage.get('noteCount') || 0);
        
        const gameHeight = ref(500);
        const hitZoneY = ref(430);
        const noteSpeed = ref(0.4);
        
        const score = ref(0);
        const combo = ref(0);
        const maxCombo = ref(0);
        const progress = ref(0);
        const isPaused = ref(false);
        const isGameOver = ref(false);
        const currentJudgment = ref('');
        const frameCount = ref(0);
        
        const judgments = reactive({
            perfect: 0,
            great: 0,
            good: 0,
            miss: 0
        });
        
        const pressedKeys = reactive({});
        
        let notesData = [];
        let animationFrameId = null;
        let startTime = null;
        let pausedTime = 0;
        let totalPausedTime = 0;
        let gameDuration = 60000;
        let judgmentTimer = null;
        
        const laneColors = ['#ff3366', '#ff8800', '#ffff00', '#00ff88', '#00f5ff', '#0088ff', '#8b5cf6'];
        
        const lanes = computed(() => {
            if (!selectedInstrument.value) return [];
            const keys = selectedInstrument.value.keys || ['D', 'F', 'J', 'K'];
            return keys.map((key, i) => ({
                key: key,
                color: laneColors[i % laneColors.length]
            }));
        });
        
        const difficultyText = computed(() => {
            const map = { easy: '简单', normal: '普通', hard: '困难' };
            return map[selectedDifficulty.value] || '普通';
        });
        
        const finalRank = computed(() => {
            const totalNotes = judgments.perfect + judgments.great + judgments.good + judgments.miss;
            if (totalNotes === 0) return 'D';
            const accuracy = (judgments.perfect * 100 + judgments.great * 80 + judgments.good * 50) / (totalNotes * 100);
            if (accuracy >= 0.95) return 'S';
            if (accuracy >= 0.85) return 'A';
            if (accuracy >= 0.70) return 'B';
            if (accuracy >= 0.50) return 'C';
            return 'D';
        });
        
        const getLaneNotes = (laneIndex) => {
            frameCount.value;
            return notesData.filter(n => 
                n.lane === laneIndex && 
                !n.hit && 
                !n.missed && 
                n.position > -50 && 
                n.position < gameHeight.value + 50
            );
        };
        
        const calculateNotePosition = (note, elapsedTime) => {
            const timeUntilHit = note.time - elapsedTime;
            return hitZoneY.value - (timeUntilHit * noteSpeed.value);
        };
        
        const showJudgment = (type) => {
            currentJudgment.value = type;
            if (judgmentTimer) clearTimeout(judgmentTimer);
            judgmentTimer = setTimeout(() => {
                currentJudgment.value = '';
            }, 400);
        };
        
        const handleKeyPress = (key) => {
            if (isPaused.value || isGameOver.value) return;
            
            const upperKey = key.toUpperCase();
            const laneIndex = lanes.value.findIndex(l => l.key === upperKey);
            
            if (laneIndex === -1) return;
            
            pressedKeys[upperKey] = true;
            
            const currentTime = Date.now() - startTime - totalPausedTime;
            const elapsedTime = currentTime;
            
            let closestNote = null;
            let closestDistance = Infinity;
            
            notesData.forEach(note => {
                if (note.lane !== laneIndex || note.hit || note.missed) return;
                
                const notePosition = calculateNotePosition(note, elapsedTime);
                const distance = Math.abs(notePosition - hitZoneY.value);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestNote = note;
                }
            });
            
            const hitZonePixelThreshold = 80;
            
            if (closestNote && closestDistance < hitZonePixelThreshold) {
                const timeOffset = Math.abs(closestNote.time - elapsedTime);
                
                let judgment, points;
                if (timeOffset <= 50) {
                    judgment = 'Perfect';
                    points = 1000;
                    judgments.perfect++;
                } else if (timeOffset <= 100) {
                    judgment = 'Great';
                    points = 800;
                    judgments.great++;
                } else {
                    judgment = 'Good';
                    points = 500;
                    judgments.good++;
                }
                
                closestNote.hit = true;
                combo.value++;
                maxCombo.value = Math.max(maxCombo.value, combo.value);
                score.value += Math.floor(points * (1 + combo.value * 0.01));
                
                showJudgment(judgment);
            }
            
            setTimeout(() => {
                pressedKeys[upperKey] = false;
            }, 100);
        };
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                togglePause();
                return;
            }
            
            if (!e.repeat) {
                handleKeyPress(e.key);
            }
        };
        
        let lastUpdateTime = 0;
        const gameLoop = () => {
            if (isPaused.value || isGameOver.value) {
                animationFrameId = requestAnimationFrame(gameLoop);
                return;
            }
            
            const currentTime = Date.now() - startTime;
            const elapsedTime = currentTime - totalPausedTime;
            
            progress.value = Math.min(100, (elapsedTime / gameDuration) * 100);
            
            let allProcessed = true;
            notesData.forEach(note => {
                if (note.hit || note.missed) return;
                
                allProcessed = false;
                note.position = calculateNotePosition(note, elapsedTime);
                
                if (note.position > hitZoneY.value + 60) {
                    note.missed = true;
                    combo.value = 0;
                    judgments.miss++;
                    showJudgment('Miss');
                }
            });
            
            const now = Date.now();
            if (now - lastUpdateTime > 16) {
                frameCount.value++;
                lastUpdateTime = now;
            }
            
            if (allProcessed || elapsedTime >= gameDuration + 2000) {
                endGame();
                return;
            }
            
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        const startGame = async () => {
            const loadedNotes = Storage.get('gameNotes');
            if (!loadedNotes || loadedNotes.length === 0) {
                emit('navigate', 'home');
                return;
            }
            
            notesData = loadedNotes.map(n => ({ ...n, position: -50, hit: false, missed: false }));
            
            const bpm = selectedSong.value?.bpm || 120;
            noteSpeed.value = 0.4 + (bpm / 800);
            
            if (selectedSong.value?.duration) {
                gameDuration = selectedSong.value.duration * 1000;
            }
            
            await nextTick();
            
            startTime = Date.now();
            totalPausedTime = 0;
            
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        const togglePause = () => {
            if (isGameOver.value) return;
            
            isPaused.value = !isPaused.value;
            
            if (isPaused.value) {
                pausedTime = Date.now();
            } else {
                totalPausedTime += Date.now() - pausedTime;
            }
        };
        
        const endGame = () => {
            isGameOver.value = true;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };
        
        const showResults = () => {
            const results = {
                score: score.value,
                maxCombo: maxCombo.value,
                judgments: { ...judgments },
                rank: finalRank.value,
                song: selectedSong.value,
                instrument: selectedInstrument.value,
                difficulty: selectedDifficulty.value,
                noteCount: noteCount.value
            };
            
            Storage.save('gameResults', results);
            emit('game-complete', results);
            emit('navigate', 'results');
        };
        
        const quitGame = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            emit('navigate', 'home');
        };
        
        onMounted(() => {
            if (!selectedSong.value || !selectedInstrument.value) {
                emit('navigate', 'home');
                return;
            }
            
            window.addEventListener('keydown', handleKeyDown);
            
            startGame();
        });
        
        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            if (judgmentTimer) {
                clearTimeout(judgmentTimer);
            }
        });
        
        return {
            gameArea,
            selectedSong,
            selectedInstrument,
            selectedDifficulty,
            score,
            combo,
            maxCombo,
            progress,
            isPaused,
            isGameOver,
            currentJudgment,
            lanes,
            difficultyText,
            finalRank,
            pressedKeys,
            getLaneNotes,
            togglePause,
            showResults,
            quitGame
        };
    }
};
