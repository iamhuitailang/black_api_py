var AudioManager = (function() {
    'use strict';

    var audioContext = null;
    var masterGain = null;
    var enabled = true;
    var volume = 0.5;

    var heartbeatOscillator = null;
    var heartbeatGain = null;
    var heartbeatInterval = null;
    var isHeartbeatPlaying = false;

    function init() {
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            masterGain = audioContext.createGain();
            masterGain.gain.value = volume;
            masterGain.connect(audioContext.destination);
            
            console.log('AudioManager initialized successfully');
            return true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            enabled = false;
            return false;
        }
    }

    function ensureAudioContext() {
        if (!audioContext) {
            return init();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return enabled;
    }

    function setEnabled(value) {
        enabled = value;
    }

    function isEnabled() {
        return enabled;
    }

    function setVolume(value) {
        volume = Utils.clamp(value, 0, 1);
        if (masterGain) {
            masterGain.gain.value = volume;
        }
    }

    function getVolume() {
        return volume;
    }

    function playTone(frequency, duration, type, volume) {
        if (!ensureAudioContext()) return;

        var osc = audioContext.createOscillator();
        var gain = audioContext.createGain();

        osc.type = type || 'sine';
        osc.frequency.value = frequency;

        gain.gain.value = volume || 0.3;
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + duration);

        return osc;
    }

    function playChord(frequencies, duration, type) {
        if (!ensureAudioContext()) return;

        frequencies.forEach(function(freq, index) {
            setTimeout(function() {
                playTone(freq, duration, type, 0.2);
            }, index * 50);
        });
    }

    function playCollectCheese() {
        if (!enabled) return;

        var frequencies = [523.25, 659.25, 783.99, 1046.50];
        
        frequencies.forEach(function(freq, index) {
            setTimeout(function() {
                playTone(freq, 0.15, 'sine', 0.3);
            }, index * 60);
        });

        setTimeout(function() {
            playTone(1318.51, 0.4, 'sine', 0.4);
        }, frequencies.length * 60);
    }

    function playGameOver() {
        if (!enabled) return;

        stopHeartbeat();

        var frequencies = [
            392.00, 349.23, 329.63, 293.66, 
            261.63, 246.94, 220.00, 196.00
        ];

        frequencies.forEach(function(freq, index) {
            setTimeout(function() {
                var osc = audioContext.createOscillator();
                var gain = audioContext.createGain();
                
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                
                gain.gain.value = 0.3;
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                osc.connect(gain);
                gain.connect(masterGain);
                
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.5);
            }, index * 150);
        });
    }

    function playStartGame() {
        if (!enabled) return;

        var frequencies = [261.63, 329.63, 392.00, 523.25];

        frequencies.forEach(function(freq, index) {
            setTimeout(function() {
                playTone(freq, 0.2, 'square', 0.2);
            }, index * 100);
        });
    }

    function playPause() {
        if (!enabled) return;
        
        stopHeartbeat();
        playTone(440, 0.1, 'triangle', 0.2);
    }

    function playResume() {
        if (!enabled) return;
        
        playTone(660, 0.1, 'triangle', 0.2);
    }

    function playClick() {
        if (!enabled) return;
        playTone(800, 0.05, 'sine', 0.15);
    }

    function startHeartbeat(intensity) {
        if (!ensureAudioContext()) return;
        if (!enabled) return;

        intensity = Utils.clamp(intensity || 1, 0.5, 2);

        if (isHeartbeatPlaying) {
            updateHeartbeatIntensity(intensity);
            return;
        }

        isHeartbeatPlaying = true;

        var beatInterval = Math.max(200, 800 / intensity);

        function beat() {
            if (!isHeartbeatPlaying || !enabled) return;

            var osc1 = audioContext.createOscillator();
            var gain1 = audioContext.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(80, audioContext.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.15);

            gain1.gain.setValueAtTime(0.4 * intensity, audioContext.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

            osc1.connect(gain1);
            gain1.connect(masterGain);

            osc1.start(audioContext.currentTime);
            osc1.stop(audioContext.currentTime + 0.15);

            setTimeout(function() {
                if (!isHeartbeatPlaying || !enabled) return;

                var osc2 = audioContext.createOscillator();
                var gain2 = audioContext.createGain();

                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(60, audioContext.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.1);

                gain2.gain.setValueAtTime(0.3 * intensity, audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                osc2.connect(gain2);
                gain2.connect(masterGain);

                osc2.start(audioContext.currentTime);
                osc2.stop(audioContext.currentTime + 0.1);
            }, 150);
        }

        beat();
        heartbeatInterval = setInterval(beat, beatInterval);
    }

    function updateHeartbeatIntensity(intensity) {
        if (!isHeartbeatPlaying) return;

        intensity = Utils.clamp(intensity || 1, 0.5, 2);
        var newInterval = Math.max(200, 800 / intensity);

        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }

        var lastBeatTime = 0;
        function beat() {
            if (!isHeartbeatPlaying || !enabled) return;

            var now = Utils.now();
            if (now - lastBeatTime < newInterval * 0.8) {
                heartbeatInterval = setTimeout(beat, 50);
                return;
            }
            lastBeatTime = now;

            var osc1 = audioContext.createOscillator();
            var gain1 = audioContext.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(80, audioContext.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.15);

            gain1.gain.setValueAtTime(0.4 * intensity, audioContext.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

            osc1.connect(gain1);
            gain1.connect(masterGain);

            osc1.start(audioContext.currentTime);
            osc1.stop(audioContext.currentTime + 0.15);

            setTimeout(function() {
                if (!isHeartbeatPlaying || !enabled) return;

                var osc2 = audioContext.createOscillator();
                var gain2 = audioContext.createGain();

                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(60, audioContext.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.1);

                gain2.gain.setValueAtTime(0.3 * intensity, audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                osc2.connect(gain2);
                gain2.connect(masterGain);

                osc2.start(audioContext.currentTime);
                osc2.stop(audioContext.currentTime + 0.1);
            }, 150);

            heartbeatInterval = setTimeout(beat, newInterval);
        }

        beat();
    }

    function stopHeartbeat() {
        isHeartbeatPlaying = false;
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
        if (heartbeatOscillator) {
            try {
                heartbeatOscillator.stop();
            } catch (e) {}
            heartbeatOscillator = null;
        }
    }

    function isHeartbeatActive() {
        return isHeartbeatPlaying;
    }

    function playCatApproachWarning() {
        if (!enabled) return;
        playTone(200, 0.1, 'sawtooth', 0.1);
    }

    return {
        init: init,
        setEnabled: setEnabled,
        isEnabled: isEnabled,
        setVolume: setVolume,
        getVolume: getVolume,
        playCollectCheese: playCollectCheese,
        playGameOver: playGameOver,
        playStartGame: playStartGame,
        playPause: playPause,
        playResume: playResume,
        playClick: playClick,
        startHeartbeat: startHeartbeat,
        updateHeartbeatIntensity: updateHeartbeatIntensity,
        stopHeartbeat: stopHeartbeat,
        isHeartbeatActive: isHeartbeatActive,
        playCatApproachWarning: playCatApproachWarning
    };
})();
