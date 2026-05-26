const { computed, onMounted, onBeforeUnmount, ref } = Vue;

const PlayerComponent = {
    template: `
        <div class="player-bar">
            <div class="player-info">
                <div class="player-cover">{{ s.currentSong?.cover || '🎵' }}</div>
                <div class="player-song-info">
                    <span class="player-song-title">{{ s.currentSong?.title || '未选择歌曲' }}</span>
                    <span class="player-song-artist">{{ s.currentSong?.artist || '' }}</span>
                </div>
                <span
                    class="player-like-btn"
                    @click="handleToggleFavorite"
                    :title="isFavorited ? '取消喜欢' : '喜欢'"
                >{{ isFavorited ? '❤️' : '🤍' }}</span>
            </div>

            <div class="player-controls">
                <div class="control-buttons">
                    <button class="control-btn" @click="handlePrev" title="上一首">⏮</button>
                    <button class="control-btn play-main" @click="handleTogglePlay" :title="s.isPlaying ? '暂停' : '播放'">
                        {{ s.isPlaying ? '⏸' : '▶️' }}
                    </button>
                    <button class="control-btn" @click="handleNext" title="下一首">⏭</button>
                </div>
                <div class="progress-container">
                    <span class="progress-time">{{ formatTime(s.currentTime) }}</span>
                    <div class="progress-bar" @click="handleSeek">
                        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                    </div>
                    <span class="progress-time">{{ formatTime(s.duration) }}</span>
                </div>
            </div>

            <div class="player-extras">
                <span class="mode-btn" :class="{ active: s.playMode !== 'sequence' }" @click="cycleMode" :title="playModeText">
                    {{ playModeIcon }}
                </span>
                <div class="volume-control">
                    <span class="volume-icon" @click="toggleMute">{{ s.volume > 0 ? '🔊' : '🔇' }}</span>
                    <div class="volume-slider" @click="handleVolumeChange">
                        <div class="volume-fill" :style="{ width: (s.volume * 100) + '%' }"></div>
                    </div>
                </div>
                <span class="mode-btn" @click="togglePlaylist" title="播放列表">📋</span>
            </div>

            <div class="playlist-panel" v-if="s.showPlaylist">
                <div class="playlist-panel-header">
                    <span class="playlist-panel-title">播放列表 ({{ s.playList.length }})</span>
                    <span class="playlist-panel-close" @click="togglePlaylist">✕</span>
                </div>
                <div class="playlist-panel-content">
                    <div
                        v-for="(song, index) in s.playList"
                        :key="song.id"
                        class="playlist-item"
                        :class="{ active: index === s.currentIndex }"
                        @click="playIndex(index)"
                    >
                        <span class="playlist-item-index">{{ index + 1 }}</span>
                        <div class="playlist-item-info">
                            <span class="playlist-item-title">{{ song.title }}</span>
                            <span class="playlist-item-artist">{{ song.artist }}</span>
                        </div>
                        <span class="playlist-item-duration">{{ song.duration }}</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const s = AudioStore.state;
        const _prevVolume = ref(0.8);
        let progressTimer = null;

        const isFavorited = computed(() => {
            if (!s.currentSong) return false;
            return s.favoriteIds.includes(s.currentSong.id);
        });

        const progressPercent = computed(() => {
            if (s.duration === 0) return 0;
            return (s.currentTime / s.duration) * 100;
        });

        const playModeText = computed(() => {
            const texts = { sequence: '顺序播放', single: '单曲循环', random: '随机播放' };
            return texts[s.playMode] || '顺序播放';
        });

        const playModeIcon = computed(() => {
            const icons = { sequence: '🔁', single: '🔂', random: '🔀' };
            return icons[s.playMode] || '🔁';
        });

        function formatTime(seconds) {
            return AudioStore.formatTime(seconds);
        }

        function handleTogglePlay() {
            AudioStore.togglePlay();
        }

        function handlePrev() {
            AudioStore.playPrev();
        }

        function handleNext() {
            AudioStore.playNext();
        }

        function handleSeek(event) {
            const rect = event.currentTarget.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            const newTime = percent * s.duration;
            AudioStore.setCurrentTime(Math.max(0, Math.min(newTime, s.duration)));
        }

        function handleVolumeChange(event) {
            const rect = event.currentTarget.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            AudioStore.setVolume(Math.max(0, Math.min(percent, 1)));
        }

        function toggleMute() {
            if (s.volume > 0) {
                _prevVolume.value = s.volume;
                AudioStore.setVolume(0);
            } else {
                AudioStore.setVolume(_prevVolume.value || 0.8);
            }
        }

        function cycleMode() {
            const modes = ['sequence', 'single', 'random'];
            const currentIdx = modes.indexOf(s.playMode);
            const nextMode = modes[(currentIdx + 1) % modes.length];
            AudioStore.setPlayMode(nextMode);
        }

        function togglePlaylist() {
            AudioStore.toggleShowPlaylist();
        }

        async function handleToggleFavorite() {
            if (s.currentSong) {
                await AudioStore.toggleFavorite(s.currentSong.id);
            }
        }

        function playIndex(index) {
            const song = s.playList[index];
            if (song) {
                AudioStore.playSong(song, index);
            }
        }

        function startProgressTimer() {
            stopProgressTimer();
            progressTimer = setInterval(() => {
                if (s.isPlaying && s.duration > 0) {
                    let newTime = s.currentTime + 1;
                    if (newTime >= s.duration) {
                        newTime = 0;
                        if (s.playMode === 'single') {
                            AudioStore.setCurrentTime(0);
                        } else {
                            AudioStore.playNext();
                        }
                    } else {
                        AudioStore.setCurrentTime(newTime);
                    }
                }
            }, 1000);
        }

        function stopProgressTimer() {
            if (progressTimer) {
                clearInterval(progressTimer);
                progressTimer = null;
            }
        }

        onMounted(() => {
            startProgressTimer();
        });

        onBeforeUnmount(() => {
            stopProgressTimer();
        });

        return {
            s,
            isFavorited,
            progressPercent,
            playModeText,
            playModeIcon,
            formatTime,
            handleTogglePlay,
            handlePrev,
            handleNext,
            handleSeek,
            handleVolumeChange,
            toggleMute,
            cycleMode,
            togglePlaylist,
            handleToggleFavorite,
            playIndex
        };
    }
};