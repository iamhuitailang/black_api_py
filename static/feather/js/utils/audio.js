const Audio = (() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioContext = null;

    const init = () => {
        if (!audioContext) {
            audioContext = new AudioContext();
        }
    };

    const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
        if (!audioContext) init();
        
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
    };

    const playWind = () => {
        if (!audioContext) init();
        
        const bufferSize = 2 * audioContext.sampleRate;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.05;
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        whiteNoise.start();
        whiteNoise.stop(audioContext.currentTime + 0.3);
    };

    const playFeatherMove = () => {
        playTone(800, 0.1, 'sine', 0.1);
    };

    const playCollectPowerup = () => {
        playTone(523, 0.1, 'sine', 0.3);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.3), 100);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 200);
    };

    const playGameOver = () => {
        playTone(300, 0.3, 'sawtooth', 0.2);
        setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.2), 200);
    };

    const playLevelComplete = () => {
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => playTone(note, 0.2, 'sine', 0.3), i * 150);
        });
    };

    const playClick = () => {
        playTone(600, 0.05, 'sine', 0.2);
    };

    return {
        init,
        playWind,
        playFeatherMove,
        playCollectPowerup,
        playGameOver,
        playLevelComplete,
        playClick
    };
})();