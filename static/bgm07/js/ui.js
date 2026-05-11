const UI = {
    elements: {},
    state: null,

    init() {
        this.cacheElements();
        console.log('UI模块初始化成功');
    },

    cacheElements() {
        this.elements = {
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            stopBtn: document.getElementById('stopBtn'),
            bpmSlider: document.getElementById('bpmSlider'),
            bpmValue: document.getElementById('bpmValue'),
            masterVolume: document.getElementById('masterVolume'),
            masterVolumeValue: document.getElementById('masterVolumeValue'),
            tracksContainer: document.getElementById('tracksContainer'),
            statusIndicator: document.getElementById('statusIndicator'),
            playbackPosition: document.getElementById('playbackPosition'),
            presetButtons: document.querySelectorAll('.preset-btn'),
            eqLow: document.getElementById('eqLow'),
            eqLowValue: document.getElementById('eqLowValue'),
            eqMid: document.getElementById('eqMid'),
            eqMidValue: document.getElementById('eqMidValue'),
            eqHigh: document.getElementById('eqHigh'),
            eqHighValue: document.getElementById('eqHighValue'),
            reverbRoom: document.getElementById('reverbRoom'),
            reverbRoomValue: document.getElementById('reverbRoomValue'),
            reverbMix: document.getElementById('reverbMix'),
            reverbMixValue: document.getElementById('reverbMixValue'),
            delayTime: document.getElementById('delayTime'),
            delayTimeValue: document.getElementById('delayTimeValue'),
            delayFeedback: document.getElementById('delayFeedback'),
            delayFeedbackValue: document.getElementById('delayFeedbackValue'),
            delayMix: document.getElementById('delayMix'),
            delayMixValue: document.getElementById('delayMixValue'),
            filterType: document.getElementById('filterType'),
            filterCutoff: document.getElementById('filterCutoff'),
            filterCutoffValue: document.getElementById('filterCutoffValue'),
            filterResonance: document.getElementById('filterResonance'),
            filterResonanceValue: document.getElementById('filterResonanceValue'),
            distortionGain: document.getElementById('distortionGain'),
            distortionGainValue: document.getElementById('distortionGainValue'),
            distortionAmount: document.getElementById('distortionAmount'),
            distortionAmountValue: document.getElementById('distortionAmountValue')
        };
    },

    bindEvents(callbacks) {
        this.elements.playBtn.addEventListener('click', () => {
            this.elements.playBtn.classList.add('active');
            setTimeout(() => this.elements.playBtn.classList.remove('active'), 200);
            callbacks.onPlay();
        });

        this.elements.pauseBtn.addEventListener('click', () => {
            this.elements.pauseBtn.classList.add('active');
            setTimeout(() => this.elements.pauseBtn.classList.remove('active'), 200);
            callbacks.onPause();
        });

        this.elements.stopBtn.addEventListener('click', () => {
            this.elements.stopBtn.classList.add('active');
            setTimeout(() => this.elements.stopBtn.classList.remove('active'), 200);
            callbacks.onStop();
        });

        this.elements.bpmSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.bpmValue.textContent = value;
            callbacks.onBPMChange(value);
        });

        this.elements.masterVolume.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.masterVolumeValue.textContent = value + '%';
            callbacks.onMasterVolumeChange(value);
        });

        this.bindEffectControls(callbacks);
        this.bindPresetButtons(callbacks);
    },

    bindEffectControls(callbacks) {
        this.elements.eqLow.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.eqLowValue.textContent = value + ' dB';
            this.updateEffects(callbacks);
        });

        this.elements.eqMid.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.eqMidValue.textContent = value + ' dB';
            this.updateEffects(callbacks);
        });

        this.elements.eqHigh.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.eqHighValue.textContent = value + ' dB';
            this.updateEffects(callbacks);
        });

        this.elements.reverbRoom.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.reverbRoomValue.textContent = value.toFixed(1) + 's';
            this.updateEffects(callbacks);
        });

        this.elements.reverbMix.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.reverbMixValue.textContent = value + '%';
            this.updateEffects(callbacks);
        });

        this.elements.delayTime.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.delayTimeValue.textContent = value.toFixed(2) + 's';
            this.updateEffects(callbacks);
        });

        this.elements.delayFeedback.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.delayFeedbackValue.textContent = value + '%';
            this.updateEffects(callbacks);
        });

        this.elements.delayMix.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.delayMixValue.textContent = value + '%';
            this.updateEffects(callbacks);
        });

        this.elements.filterType.addEventListener('change', () => {
            this.updateEffects(callbacks);
        });

        this.elements.filterCutoff.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.filterCutoffValue.textContent = value + 'Hz';
            this.updateEffects(callbacks);
        });

        this.elements.filterResonance.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.filterResonanceValue.textContent = value.toFixed(1);
            this.updateEffects(callbacks);
        });

        this.elements.distortionGain.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.distortionGainValue.textContent = value + '%';
            this.updateEffects(callbacks);
        });

        this.elements.distortionAmount.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.distortionAmountValue.textContent = value + '%';
            this.updateEffects(callbacks);
        });
    },

    updateEffects(callbacks) {
        const effectsState = this.getEffectsState();
        callbacks.onEffectsChange(effectsState);
    },

    getEffectsState() {
        return {
            eq: {
                low: parseInt(this.elements.eqLow.value),
                mid: parseInt(this.elements.eqMid.value),
                high: parseInt(this.elements.eqHigh.value)
            },
            reverb: {
                roomSize: parseFloat(this.elements.reverbRoom.value),
                mix: parseInt(this.elements.reverbMix.value)
            },
            delay: {
                time: parseFloat(this.elements.delayTime.value),
                feedback: parseInt(this.elements.delayFeedback.value),
                mix: parseInt(this.elements.delayMix.value)
            },
            filter: {
                type: this.elements.filterType.value,
                cutoff: parseInt(this.elements.filterCutoff.value),
                resonance: parseFloat(this.elements.filterResonance.value)
            },
            distortion: {
                gain: parseInt(this.elements.distortionGain.value),
                amount: parseInt(this.elements.distortionAmount.value)
            }
        };
    },

    bindPresetButtons(callbacks) {
        this.elements.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.presetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const presetName = btn.dataset.preset;
                callbacks.onPresetChange(presetName);
            });
        });
    },

    renderTracks(tracks, callbacks) {
        this.elements.tracksContainer.innerHTML = '';

        tracks.forEach(track => {
            const trackElement = this.createTrackElement(track);
            this.elements.tracksContainer.appendChild(trackElement);

            const volumeSlider = trackElement.querySelector('.volume-slider');
            const muteBtn = trackElement.querySelector('.btn-mute');
            const soloBtn = trackElement.querySelector('.btn-solo');

            volumeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                trackElement.querySelector('.volume-value').textContent = value + '%';
                callbacks.onTrackVolumeChange(track.id, value);
            });

            muteBtn.addEventListener('click', () => {
                muteBtn.classList.toggle('active');
                callbacks.onTrackMuteToggle(track.id);
            });

            soloBtn.addEventListener('click', () => {
                soloBtn.classList.toggle('active');
                callbacks.onTrackSoloToggle(track.id);
            });
        });
    },

    createTrackElement(track) {
        const div = document.createElement('div');
        div.className = 'track';
        div.dataset.trackId = track.id;

        div.innerHTML = `
            <div class="track-info">
                <span class="track-icon">${track.icon}</span>
                <span class="track-name">${track.name}</span>
            </div>
            <div class="volume-control">
                <input type="range" class="volume-slider" min="0" max="100" value="${track.volume}">
                <span class="volume-value">${track.volume}%</span>
            </div>
            <button class="btn-track btn-mute ${track.muted ? 'active' : ''}" title="静音">🔇</button>
            <button class="btn-track btn-solo ${track.solo ? 'active' : ''}" title="独奏">S</button>
        `;

        return div;
    },

    updateStatus(status) {
        let text = '已停止';
        let color = '#888';

        switch (status) {
            case 'playing':
                text = '播放中';
                color = '#00c853';
                break;
            case 'paused':
                text = '已暂停';
                color = '#ffab00';
                break;
            case 'stopped':
            default:
                text = '已停止';
                color = '#888';
                break;
        }

        this.elements.statusIndicator.textContent = text;
        this.elements.statusIndicator.style.color = color;
    },

    updatePlaybackPosition(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        this.elements.playbackPosition.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    setBPM(value) {
        this.elements.bpmSlider.value = value;
        this.elements.bpmValue.textContent = value;
    },

    setMasterVolume(value) {
        this.elements.masterVolume.value = value;
        this.elements.masterVolumeValue.textContent = value + '%';
    },

    setEffectsState(effects) {
        if (effects.eq) {
            this.elements.eqLow.value = effects.eq.low;
            this.elements.eqLowValue.textContent = effects.eq.low + ' dB';
            this.elements.eqMid.value = effects.eq.mid;
            this.elements.eqMidValue.textContent = effects.eq.mid + ' dB';
            this.elements.eqHigh.value = effects.eq.high;
            this.elements.eqHighValue.textContent = effects.eq.high + ' dB';
        }

        if (effects.reverb) {
            this.elements.reverbRoom.value = effects.reverb.roomSize;
            this.elements.reverbRoomValue.textContent = effects.reverb.roomSize.toFixed(1) + 's';
            this.elements.reverbMix.value = effects.reverb.mix;
            this.elements.reverbMixValue.textContent = effects.reverb.mix + '%';
        }

        if (effects.delay) {
            this.elements.delayTime.value = effects.delay.time;
            this.elements.delayTimeValue.textContent = effects.delay.time.toFixed(2) + 's';
            this.elements.delayFeedback.value = effects.delay.feedback;
            this.elements.delayFeedbackValue.textContent = effects.delay.feedback + '%';
            this.elements.delayMix.value = effects.delay.mix;
            this.elements.delayMixValue.textContent = effects.delay.mix + '%';
        }

        if (effects.filter) {
            this.elements.filterType.value = effects.filter.type;
            this.elements.filterCutoff.value = effects.filter.cutoff;
            this.elements.filterCutoffValue.textContent = effects.filter.cutoff + 'Hz';
            this.elements.filterResonance.value = effects.filter.resonance;
            this.elements.filterResonanceValue.textContent = effects.filter.resonance.toFixed(1);
        }

        if (effects.distortion) {
            this.elements.distortionGain.value = effects.distortion.gain;
            this.elements.distortionGainValue.textContent = effects.distortion.gain + '%';
            this.elements.distortionAmount.value = effects.distortion.amount;
            this.elements.distortionAmountValue.textContent = effects.distortion.amount + '%';
        }
    },

    setActivePreset(presetName) {
        this.elements.presetButtons.forEach(btn => {
            if (btn.dataset.preset === presetName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
};
