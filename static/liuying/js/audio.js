const AudioManager = (function() {
    let audioContext = null;
    let bgmOscillator = null;
    let bgmGain = null;
    let settings = {
        correct: true,
        wrong: true,
        combo: true,
        bgm: false
    };

    function init() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API 不支持');
        }
    }

    function setSettings(newSettings) {
        settings = { ...settings, ...newSettings };
    }

    function playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!audioContext || !settings.correct && !settings.wrong && !settings.combo) return;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            console.warn('播放音效失败:', e);
        }
    }

    function playCorrect() {
        if (!settings.correct) return;
        playTone(880, 0.15, 'sine', 0.25);
        setTimeout(() => playTone(1100, 0.15, 'sine', 0.2), 100);
    }

    function playWrong() {
        if (!settings.wrong) return;
        playTone(200, 0.3, 'sawtooth', 0.2);
    }

    function playCombo(comboCount) {
        if (!settings.combo) return;
        const baseFreq = 440 + (comboCount * 50);
        playTone(Math.min(baseFreq, 1200), 0.1, 'square', 0.15);
    }

    function playLevelUp() {
        playTone(523, 0.15, 'sine', 0.3);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 150);
        setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 300);
    }

    function playGameOver() {
        playTone(400, 0.2, 'sawtooth', 0.2);
        setTimeout(() => playTone(300, 0.2, 'sawtooth', 0.2), 200);
        setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.2), 400);
    }

    function startBGM() {
        if (!audioContext || !settings.bgm || bgmOscillator) return;
        
        try {
            bgmOscillator = audioContext.createOscillator();
            bgmGain = audioContext.createGain();
            
            bgmOscillator.connect(bgmGain);
            bgmGain.connect(audioContext.destination);
            
            bgmOscillator.frequency.value = 220;
            bgmOscillator.type = 'sine';
            
            bgmGain.gain.value = 0.05;
            
            bgmOscillator.start();
        } catch (e) {
            console.warn('播放BGM失败:', e);
        }
    }

    function stopBGM() {
        if (bgmOscillator) {
            bgmOscillator.stop();
            bgmOscillator = null;
            bgmGain = null;
        }
    }

    function toggleBGM(enabled) {
        settings.bgm = enabled;
        if (enabled) {
            startBGM();
        } else {
            stopBGM();
        }
    }

    function resume() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    return {
        init,
        setSettings,
        playCorrect,
        playWrong,
        playCombo,
        playLevelUp,
        playGameOver,
        startBGM,
        stopBGM,
        toggleBGM,
        resume
    };
})();
