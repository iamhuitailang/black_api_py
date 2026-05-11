var Audio = (function() {
    var audioContext = null;
    var isInitialized = false;
    
    function init() {
        if (isInitialized) return;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            isInitialized = true;
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }
    
    function playBeep(frequency, duration, type) {
        if (!isInitialized) {
            init();
        }
        if (!audioContext) return;
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type || 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    function playHit() {
        playBeep(800, 0.1, 'square');
        setTimeout(function() {
            playBeep(1200, 0.15, 'sine');
        }, 50);
    }
    
    function playMiss() {
        playBeep(300, 0.1, 'sine');
    }
    
    function playMissedDuck() {
        if (!isInitialized) {
            init();
        }
        if (!audioContext) return;
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    function playGameOver() {
        playBeep(400, 0.2, 'square');
        setTimeout(function() {
            playBeep(300, 0.3, 'square');
        }, 150);
    }
    
    function playStart() {
        playBeep(600, 0.1, 'sine');
        setTimeout(function() {
            playBeep(800, 0.15, 'sine');
        }, 100);
    }
    
    return {
        init: init,
        playHit: playHit,
        playMiss: playMiss,
        playMissedDuck: playMissedDuck,
        playGameOver: playGameOver,
        playStart: playStart
    };
})();
