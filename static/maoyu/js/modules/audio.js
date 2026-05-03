import { Storage } from './storage.js';

export const Audio = {
    audioContext: null,
    isMuted: false,
    currentSound: null,
    mediaRecorder: null,
    audioChunks: [],

    init() {
        this.isMuted = !Storage.getSettings().soundEnabled;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        Storage.saveSettings({ soundEnabled: !this.isMuted });
        return !this.isMuted;
    },

    isSoundEnabled() {
        return !this.isMuted;
    },

    playMeowSound(type = 'short') {
        if (this.isMuted) return Promise.resolve();

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        return new Promise((resolve) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            const now = this.audioContext.currentTime;

            switch (type) {
                case 'short':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(800, now);
                    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.15);
                    gainNode.gain.setValueAtTime(0.3, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    oscillator.start(now);
                    oscillator.stop(now + 0.2);
                    break;

                case 'long':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(700, now);
                    oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.8);
                    gainNode.gain.setValueAtTime(0.3, now);
                    gainNode.gain.setValueAtTime(0.3, now + 0.6);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                    oscillator.start(now);
                    oscillator.stop(now + 0.8);
                    break;

                case 'low':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(300, now);
                    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3);
                    gainNode.gain.setValueAtTime(0.2, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                    oscillator.start(now);
                    oscillator.stop(now + 0.35);
                    break;

                case 'rapid':
                    for (let i = 0; i < 4; i++) {
                        const osc = this.audioContext.createOscillator();
                        const gain = this.audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(this.audioContext.destination);
                        const t = now + i * 0.15;
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(900, t);
                        osc.frequency.exponentialRampToValueAtTime(700, t + 0.1);
                        gain.gain.setValueAtTime(0.3, t);
                        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
                        osc.start(t);
                        osc.stop(t + 0.12);
                    }
                    break;

                case 'high':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(1200, now);
                    oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.2);
                    gainNode.gain.setValueAtTime(0.25, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                    oscillator.start(now);
                    oscillator.stop(now + 0.25);
                    break;

                case 'purr':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(100, now);
                    oscillator.frequency.linearRampToValueAtTime(120, now + 0.5);
                    oscillator.frequency.linearRampToValueAtTime(100, now + 1);
                    gainNode.gain.setValueAtTime(0.15, now);
                    gainNode.gain.setValueAtTime(0.15, now + 0.8);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);
                    oscillator.start(now);
                    oscillator.stop(now + 1);
                    break;

                case 'hiss':
                    const bufferSize = this.audioContext.sampleRate * 0.3;
                    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    const noise = this.audioContext.createBufferSource();
                    noise.buffer = buffer;
                    const noiseGain = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'highpass';
                    filter.frequency.setValueAtTime(2000, now);
                    noise.connect(filter);
                    filter.connect(noiseGain);
                    noiseGain.connect(this.audioContext.destination);
                    noiseGain.gain.setValueAtTime(0.2, now);
                    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    noise.start(now);
                    noise.stop(now + 0.3);
                    setTimeout(resolve, 300);
                    return;

                case 'playful':
                    for (let i = 0; i < 3; i++) {
                        const osc = this.audioContext.createOscillator();
                        const gain = this.audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(this.audioContext.destination);
                        const t = now + i * 0.3;
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(600 + i * 200, t);
                        osc.frequency.exponentialRampToValueAtTime(400 + i * 100, t + 0.25);
                        gain.gain.setValueAtTime(0.25, t);
                        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
                        osc.start(t);
                        osc.stop(t + 0.28);
                    }
                    break;

                case 'sad':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(400, now);
                    oscillator.frequency.linearRampToValueAtTime(300, now + 0.6);
                    gainNode.gain.setValueAtTime(0.2, now);
                    gainNode.gain.setValueAtTime(0.2, now + 0.4);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
                    oscillator.start(now);
                    oscillator.stop(now + 0.7);
                    break;

                default:
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(800, now);
                    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.15);
                    gainNode.gain.setValueAtTime(0.3, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    oscillator.start(now);
                    oscillator.stop(now + 0.2);
            }

            setTimeout(resolve, type === 'rapid' || type === 'playful' ? 600 : 300);
        });
    },

    async startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('录音功能不支持');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.start();
            return true;
        } catch (e) {
            console.error('录音启动失败:', e);
            throw e;
        }
    },

    stopRecording() {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
        });
    },

    playSuccessSound() {
        if (this.isMuted) return;
        this.playMeowSound('short');
    },

    playClickSound() {
        if (this.isMuted) return;
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        const now = this.audioContext.currentTime;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        oscillator.start(now);
        oscillator.stop(now + 0.08);
    }
};

export default Audio;
