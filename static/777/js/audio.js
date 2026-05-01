/**
 * 幸运777老虎机游戏 - 音频模块
 * 负责管理游戏音效，使用Web Audio API生成音效
 * 不依赖外部音频文件，全部通过代码生成
 */

const Audio = (function() {
    'use strict';

    let audioContext = null;
    let masterGain = null;
    let isMuted = false;
    let isInitialized = false;

    /**
     * 初始化音频上下文
     * 需要在用户交互后调用（如点击按钮）
     */
    function init() {
        if (isInitialized) {
            return;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('Web Audio API 不受支持');
                return;
            }

            audioContext = new AudioContext();
            masterGain = audioContext.createGain();
            masterGain.gain.value = 0.3;
            masterGain.connect(audioContext.destination);

            isInitialized = true;
            console.log('音频系统初始化成功');
        } catch (e) {
            console.error('音频初始化失败:', e);
        }
    }

    /**
     * 恢复音频上下文（在自动暂停后）
     */
    function resume() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    /**
     * 播放简单的音调
     * @param {number} frequency - 频率（Hz）
     * @param {number} duration - 持续时间（秒）
     * @param {string} type - 波形类型 ('sine', 'square', 'sawtooth', 'triangle')
     * @param {number} volume - 音量（0-1）
     */
    function playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!isInitialized || isMuted) {
            return;
        }

        resume();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    /**
     * 播放旋转音效
     */
    function playSpinSound() {
        if (!isInitialized || isMuted) {
            return;
        }

        resume();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(400, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    }

    /**
     * 播放转盘停止音效
     * @param {number} reelIndex - 转盘索引（0-2）
     */
    function playStopSound(reelIndex = 0) {
        const baseFreq = 300 + reelIndex * 50;
        playTone(baseFreq, 0.1, 'triangle', 0.4);

        setTimeout(() => {
            playTone(baseFreq + 100, 0.05, 'sine', 0.3);
        }, 50);
    }

    /**
     * 播放普通中奖音效
     */
    function playWinSound() {
        if (!isInitialized || isMuted) {
            return;
        }

        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                playTone(freq, 0.2, 'sine', 0.3);
            }, index * 100);
        });
    }

    /**
     * 播放大奖音效（777）
     */
    function playJackpotSound() {
        if (!isInitialized || isMuted) {
            return;
        }

        const notes = [262, 330, 392, 523, 659, 784, 1047, 784, 1047];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                playTone(freq, 0.3, 'square', 0.25);
                playTone(freq * 2, 0.2, 'sine', 0.15);
            }, index * 120);
        });

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                playTone(880 + i * 100, 0.1, 'sawtooth', 0.1);
            }, i * 50 + 1000);
        }
    }

    /**
     * 播放未中奖音效
     */
    function playLoseSound() {
        playTone(200, 0.3, 'sawtooth', 0.2);
        setTimeout(() => {
            playTone(150, 0.4, 'sawtooth', 0.15);
        }, 150);
    }

    /**
     * 播放按钮点击音效
     */
    function playClickSound() {
        playTone(800, 0.05, 'sine', 0.2);
    }

    /**
     * 播放金币音效
     */
    function playCoinSound() {
        playTone(1200, 0.1, 'sine', 0.3);
        setTimeout(() => {
            playTone(1500, 0.08, 'sine', 0.25);
        }, 50);
    }

    /**
     * 切换静音状态
     * @returns {boolean} 当前是否静音
     */
    function toggleMute() {
        isMuted = !isMuted;
        return isMuted;
    }

    /**
     * 设置音量
     * @param {number} volume - 音量（0-1）
     */
    function setVolume(volume) {
        if (masterGain) {
            masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * 获取当前静音状态
     * @returns {boolean} 是否静音
     */
    function isAudioMuted() {
        return isMuted;
    }

    /**
     * 检查音频是否已初始化
     * @returns {boolean} 是否已初始化
     */
    function isAudioInitialized() {
        return isInitialized;
    }

    return {
        init,
        resume,
        playTone,
        playSpinSound,
        playStopSound,
        playWinSound,
        playJackpotSound,
        playLoseSound,
        playClickSound,
        playCoinSound,
        toggleMute,
        setVolume,
        isMuted: isAudioMuted,
        isInitialized: isAudioInitialized
    };
})();

window.Audio = Audio;
