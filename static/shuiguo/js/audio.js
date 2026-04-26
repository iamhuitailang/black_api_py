/**
 * 音效系统模块
 * 使用Web Audio API生成各种游戏音效
 */

const AudioManager = {
    // AudioContext实例
    audioContext: null,
    
    // 是否启用音效
    enabled: true,
    
    // 主音量
    masterVolume: 0.5,
    
    // 初始化
    init: function() {
        try {
            // 创建AudioContext
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // 从存储中读取设置
            const settings = Storage.getSettings();
            this.enabled = settings.soundEnabled;
            
            console.log('AudioManager initialized');
        } catch (e) {
            console.error('Web Audio API not supported:', e);
            this.enabled = false;
        }
    },
    
    /**
     * 恢复AudioContext(在用户交互后)
     */
    resume: function() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },
    
    /**
     * 切割音效 - 清脆的"唰"声 + 轻微的"噗"声
     */
    playSliceSound: function() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 1. 唰声 - 带通滤波器的白噪声
        const noiseBuffer = this.createNoiseBuffer(0.1);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(500, now + 0.1);
        noiseFilter.Q.setValueAtTime(1, now);
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        noiseSource.start(now);
        noiseSource.stop(now + 0.1);
        
        // 2. 噗声 - 快速衰减的正弦波
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        
        oscGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.05);
    },
    
    /**
     * 爆炸音效 - 爆炸声
     */
    playExplosionSound: function() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 创建噪声缓冲
        const noiseBuffer = this.createNoiseBuffer(0.5);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        // 低通滤波器 - 爆炸的低频特性
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        
        // 包络
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        // 连接
        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // 播放
        noiseSource.start(now);
        noiseSource.stop(now + 0.5);
        
        // 添加一个低频冲击
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        
        oscGain.gain.setValueAtTime(0.4 * this.masterVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.3);
    },
    
    /**
     * 连击音效 - 上升音调
     * @param {number} combo - 连击数
     */
    playComboSound: function(combo) {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 基础频率随连击数增加
        const baseFreq = 400 + combo * 50;
        
        // 创建三个振荡器产生和弦效果
        const oscillators = [
            { type: 'sine', freq: baseFreq, detune: 0 },
            { type: 'sine', freq: baseFreq * 1.25, detune: 0 },
            { type: 'sine', freq: baseFreq * 1.5, detune: 0 }
        ];
        
        oscillators.forEach((oscConfig, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = oscConfig.type;
            osc.frequency.setValueAtTime(oscConfig.freq, now);
            osc.frequency.linearRampToValueAtTime(oscConfig.freq * 1.5, now + 0.2);
            osc.detune.setValueAtTime(oscConfig.detune, now);
            
            const volume = 0.15 * this.masterVolume / oscillators.length;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + index * 0.05);
            osc.stop(now + 0.3 + index * 0.05);
        });
    },
    
    /**
     * 游戏结束音效
     */
    playGameOverSound: function() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 下降的音调
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1);
        
        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 1);
    },
    
    /**
     * 新纪录音效
     */
    playNewHighScoreSound: function() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 播放一系列上升的音符
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.15);
            
            gain.gain.setValueAtTime(0, now + index * 0.15);
            gain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + index * 0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + 0.4);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + index * 0.15);
            osc.stop(now + index * 0.15 + 0.4);
        });
    },
    
    /**
     * 按钮点击音效
     */
    playButtonSound: function() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.05);
        
        gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    },
    
    /**
     * 创建噪声缓冲
     * @param {number} duration - 持续时间(秒)
     * @returns {AudioBuffer} 噪声缓冲
     */
    createNoiseBuffer: function(duration) {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    },
    
    /**
     * 设置音效开关
     * @param {boolean} enabled - 是否启用
     */
    setEnabled: function(enabled) {
        this.enabled = enabled;
        Storage.saveSettings({ soundEnabled: enabled });
    },
    
    /**
     * 设置主音量
     * @param {number} volume - 音量(0-1)
     */
    setVolume: function(volume) {
        this.masterVolume = Utils.clamp(volume, 0, 1);
    }
};

// 导出到全局对象
window.AudioManager = AudioManager;
