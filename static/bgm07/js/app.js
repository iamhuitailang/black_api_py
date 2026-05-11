const App = {
    state: {
        isPlaying: false,
        isPaused: false,
        bpm: 120,
        masterVolume: 80,
        currentPreset: null,
        playbackTime: 0,
        currentStep: 0,
        chordIndex: 0,
        scheduledSteps: 0,
        accumulatedTime: 0
    },

    scheduler: null,
    nextNoteTime: 0,
    lookahead: 25.0,
    scheduleAheadTime: 0.1,
    stepInterval: null,
    startTime: 0,

    defaultChordProgression: [
        { root: 60, third: 64, fifth: 67 },
        { root: 55, third: 59, fifth: 62 },
        { root: 57, third: 61, fifth: 64 },
        { root: 52, third: 56, fifth: 59 }
    ],

    currentChordProgression: null,

    init() {
        console.log('🎧 BGM混音器启动中...');

        const savedState = Storage.load();
        this.state = { ...this.state, ...savedState };
        
        this.currentChordProgression = [...this.defaultChordProgression];

        if (savedState.currentPreset) {
            const chordProgression = Presets.getPresetChordProgression(savedState.currentPreset);
            if (chordProgression) {
                this.currentChordProgression = [...chordProgression];
            }
        }

        AudioEngine.init();
        Tracks.init(savedState.tracks);
        UI.init();
        CanvasRenderer.init();

        if (AudioEngine.audioContext) {
            Effects.init(AudioEngine.audioContext, AudioEngine.masterGain);
            Effects.applyEffectsState(savedState.effects);
        }

        this.state.isPlaying = false;
        this.state.isPaused = false;
        
        this.renderUI();
        this.bindEvents();
        this.saveStatePeriodically();

        console.log('🎧 BGM混音器初始化完成！');
    },

    renderUI() {
        UI.renderTracks(Tracks.getTracksData(), {
            onTrackVolumeChange: (trackId, value) => this.handleTrackVolumeChange(trackId, value),
            onTrackMuteToggle: (trackId) => this.handleTrackMuteToggle(trackId),
            onTrackSoloToggle: (trackId) => this.handleTrackSoloToggle(trackId)
        });

        UI.setBPM(this.state.bpm);
        UI.setMasterVolume(this.state.masterVolume);
        UI.setEffectsState(Effects.getEffectsState());
        
        if (this.state.currentPreset) {
            UI.setActivePreset(this.state.currentPreset);
        }

        AudioEngine.setMasterVolume(this.state.masterVolume);

        UI.updateStatus('stopped');
        UI.updatePlaybackPosition(this.state.playbackTime);

        CanvasRenderer.drawStaticVUMeter();
    },

    bindEvents() {
        UI.bindEvents({
            onPlay: () => this.startPlayback(),
            onPause: () => this.pausePlayback(),
            onStop: () => this.stopPlayback(),
            onBPMChange: (value) => this.handleBPMChange(value),
            onMasterVolumeChange: (value) => this.handleMasterVolumeChange(value),
            onEffectsChange: (effectsState) => this.handleEffectsChange(effectsState),
            onPresetChange: (presetName) => this.handlePresetChange(presetName)
        });
    },

    startPlayback() {
        if (this.state.isPlaying && !this.state.isPaused) {
            console.log('⚠️ 已经在播放中，忽略重复点击');
            return;
        }

        console.log('🎵 开始播放...');
        
        if (!AudioEngine.audioContext || !AudioEngine.isInitialized) {
            console.log('⚠️ 音频引擎未就绪，正在初始化...');
            AudioEngine.init(true);
        }

        if (!Effects.isInitialized) {
            console.log('⚠️ 效果器未初始化，正在初始化...');
            Effects.init(AudioEngine.audioContext, AudioEngine.masterGain);
        }

        if (AudioEngine.audioContext.state === 'suspended') {
            console.log('⚠️ AudioContext已暂停，尝试恢复...');
            AudioEngine.resume();
        }

        if (AudioEngine.audioContext.state === 'suspended') {
            console.log('⚠️ 仍处于suspended状态，强制恢复...');
            AudioEngine.audioContext.resume();
        }

        AudioEngine.unmute(this.state.masterVolume);

        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.startTime = AudioEngine.getCurrentTime() - this.state.playbackTime;
        this.nextNoteTime = AudioEngine.getCurrentTime() + 0.05;

        const secondsPerStep = (60 / this.state.bpm) / 4;
        this.state.currentStep = Math.floor(this.state.playbackTime / secondsPerStep);
        this.state.chordIndex = Math.floor((this.state.currentStep % 64) / 16);

        console.log(`⏱️ 从步骤 ${this.state.currentStep} 开始播放，BPM: ${this.state.bpm}`);
        console.log(`🔊 AudioContext状态: ${AudioEngine.audioContext.state}`);

        UI.updateStatus('playing');
        CanvasRenderer.start();
        
        if (this.scheduler) {
            clearInterval(this.scheduler);
        }
        this.scheduler = setInterval(() => this.scheduleNotes(), this.lookahead);

        this.saveCurrentState();
        console.log('✅ 播放已启动');
    },

    pausePlayback() {
        if (!this.state.isPlaying || this.state.isPaused) return;

        this.state.isPaused = true;
        this.state.playbackTime = AudioEngine.getCurrentTime() - this.startTime;

        if (this.scheduler) {
            clearInterval(this.scheduler);
            this.scheduler = null;
        }

        AudioEngine.mute();

        UI.updateStatus('paused');
        CanvasRenderer.stop();
        CanvasRenderer.drawStaticVUMeter();

        this.saveCurrentState();
    },

    stopPlayback() {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.currentStep = 0;
        this.state.chordIndex = 0;
        this.state.playbackTime = 0;
        Tracks.resetSteps();

        if (this.scheduler) {
            clearInterval(this.scheduler);
            this.scheduler = null;
        }

        if (AudioEngine.audioContext) {
            try {
                AudioEngine.audioContext.close();
            } catch (e) {}
        }

        AudioEngine.isInitialized = false;
        Effects.isInitialized = false;

        UI.updateStatus('stopped');
        UI.updatePlaybackPosition(0);
        CanvasRenderer.stop();
        CanvasRenderer.drawStaticVUMeter();

        this.saveCurrentState();
        console.log('⏹️ 播放已停止，AudioContext已关闭');
    },

    scheduleNotes() {
        const currentTime = AudioEngine.getCurrentTime();

        while (this.nextNoteTime < currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.state.currentStep, this.nextNoteTime);
            this.advanceNote();
        }

        const elapsed = currentTime - this.startTime;
        UI.updatePlaybackPosition(elapsed);
    },

    scheduleNote(stepNumber, time) {
        const chord = this.currentChordProgression[this.state.chordIndex];
        const effectsState = Effects.getEffectsState();

        Tracks.tracks.forEach(track => {
            if (!track.pattern[stepNumber % 16]) return;
            if (track.muted) return;
            if (Tracks.hasSolo && !track.solo) return;

            Tracks.scheduleStep(track.id, time, stepNumber, this.state.bpm, chord, effectsState);
        });
    },

    advanceNote() {
        const secondsPerStep = (60 / this.state.bpm) / 4;
        this.nextNoteTime += secondsPerStep;
        
        this.state.currentStep++;
        
        if (this.state.currentStep % 16 === 0) {
            this.state.chordIndex = (this.state.chordIndex + 1) % this.currentChordProgression.length;
        }
    },

    handleTrackVolumeChange(trackId, value) {
        Tracks.setVolume(trackId, value);
        this.saveCurrentState();
    },

    handleTrackMuteToggle(trackId) {
        Tracks.toggleMute(trackId);
        this.saveCurrentState();
    },

    handleTrackSoloToggle(trackId) {
        Tracks.toggleSolo(trackId);
        this.saveCurrentState();
    },

    handleBPMChange(value) {
        this.state.bpm = value;
        this.saveCurrentState();
    },

    handleMasterVolumeChange(value) {
        this.state.masterVolume = value;
        AudioEngine.setMasterVolume(value);
        this.saveCurrentState();
    },

    handleEffectsChange(effectsState) {
        Effects.setEQ(effectsState.eq.low, effectsState.eq.mid, effectsState.eq.high);
        Effects.setReverb(effectsState.reverb.roomSize, effectsState.reverb.mix);
        Effects.setDelay(effectsState.delay.time, effectsState.delay.feedback, effectsState.delay.mix);
        Effects.setFilter(
            effectsState.filter.type,
            effectsState.filter.cutoff,
            effectsState.filter.resonance
        );
        Effects.setDistortion(effectsState.distortion.gain, effectsState.distortion.amount);
        this.saveCurrentState();
    },

    handlePresetChange(presetName) {
        const preset = Presets.getPreset(presetName);
        if (!preset) return;

        this.state.currentPreset = presetName;
        this.state.bpm = preset.bpm;
        UI.setBPM(preset.bpm);

        const presetTracks = Presets.getPresetTracks(presetName);
        if (presetTracks) {
            Object.keys(presetTracks).forEach(trackId => {
                const track = Tracks.getTrackById(trackId);
                if (track) {
                    track.volume = presetTracks[trackId].volume;
                    track.muted = presetTracks[trackId].muted;
                    track.solo = presetTracks[trackId].solo;
                }
            });
            Tracks.updateSoloState();

            UI.renderTracks(Tracks.getTracksData(), {
                onTrackVolumeChange: (trackId, value) => this.handleTrackVolumeChange(trackId, value),
                onTrackMuteToggle: (trackId) => this.handleTrackMuteToggle(trackId),
                onTrackSoloToggle: (trackId) => this.handleTrackSoloToggle(trackId)
            });
        }

        const patterns = Presets.getPresetPatterns(presetName);
        if (patterns) {
            Object.keys(patterns).forEach(trackId => {
                Tracks.updatePattern(trackId, patterns[trackId]);
            });
        }

        const chordProgression = Presets.getPresetChordProgression(presetName);
        if (chordProgression) {
            this.currentChordProgression = [...chordProgression];
        }

        const presetEffects = Presets.getPresetEffects(presetName);
        if (presetEffects) {
            Effects.applyEffectsState(presetEffects);
            UI.setEffectsState(presetEffects);
        }

        this.saveCurrentState();
        console.log(`🎵 已应用预设: ${preset.name}`);
    },

    saveCurrentState() {
        let currentPlaybackTime = this.state.playbackTime;
        if (this.state.isPlaying && !this.state.isPaused && AudioEngine.audioContext) {
            currentPlaybackTime = AudioEngine.getCurrentTime() - this.startTime;
        }
        
        const stateToSave = {
            isPlaying: false,
            isPaused: false,
            bpm: this.state.bpm,
            masterVolume: this.state.masterVolume,
            currentPreset: this.state.currentPreset,
            playbackTime: currentPlaybackTime,
            tracks: Tracks.getTracksData(),
            effects: Effects.getEffectsState()
        };
        Storage.save(stateToSave);
    },

    saveStatePeriodically() {
        setInterval(() => {
            this.saveCurrentState();
        }, 5000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.addEventListener('beforeunload', () => {
    if (App.scheduler) {
        clearInterval(App.scheduler);
    }
    App.saveCurrentState();
});
