
window.AudioManager = (function() {
    let audioContext = null;
    let masterGain = null;
    let initialized = false;

    function initAudioContext() {
        if (initialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            masterGain = audioContext.createGain();
            masterGain.connect(audioContext.destination);
            masterGain.gain.value = 0.5;
            initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    function playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!initialized) initAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    function playClick() {
        if (!initialized) initAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.08);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.08);
    }

    function playBell() {
        if (!initialized) initAudioContext();
        if (!audioContext) return;

        const frequencies = [880, 1320, 1760];
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(masterGain);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

                gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6 - index * 0.1);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.6 - index * 0.1);
            }, index * 80);
        });
    }

    function playError() {
        if (!initialized) initAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(150, audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);

        setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();

            oscillator2.connect(gainNode2);
            gainNode2.connect(masterGain);

            oscillator2.type = 'sawtooth';
            oscillator2.frequency.setValueAtTime(180, audioContext.currentTime);
            oscillator2.frequency.linearRampToValueAtTime(130, audioContext.currentTime + 0.15);

            gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.15);
        }, 120);
    }

    function playCheer() {
        if (!initialized) initAudioContext();
        if (!audioContext) return;

        const notes = [523, 659, 784, 1047];
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(masterGain);

                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, index * 100);
        });
    }

    function playUnlock() {
        if (!initialized) initAudioContext();
        if (!audioContext) return;

        const notes = [523, 659, 784, 659, 784, 1047];
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(masterGain);

                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

                gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
            }, index * 120);
        });
    }

    function playPop() {
        if (!initialized) initAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    return {
        init: function() {
            initAudioContext();
            
            const firstInteraction = () => {
                initAudioContext();
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                document.removeEventListener('click', firstInteraction);
                document.removeEventListener('touchstart', firstInteraction);
            };
            
            document.addEventListener('click', firstInteraction, { once: true });
            document.addEventListener('touchstart', firstInteraction, { once: true });
        },

        select: function() {
            playClick();
        },

        confirm: function() {
            playBell();
        },

        error: function() {
            playError();
        },

        combo: function() {
            playCheer();
        },

        unlock: function() {
            playUnlock();
        },

        pop: function() {
            playPop();
        }
    };
})();
