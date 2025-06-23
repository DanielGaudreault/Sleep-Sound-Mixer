document.addEventListener('DOMContentLoaded', function() {
    // Sound data
    const sounds = [
        { id: 'rain', name: 'Rain', icon: 'fa-cloud-rain', file: 'sounds/rain.mp3', volume: 0.5 },
        { id: 'waves', name: 'Ocean Waves', icon: 'fa-water', file: 'sounds/waves.mp3', volume: 0.5 },
        { id: 'thunder', name: 'Thunder', icon: 'fa-bolt', file: 'sounds/thunder.mp3', volume: 0.5 },
        { id: 'forest', name: 'Forest', icon: 'fa-tree', file: 'sounds/forest.mp3', volume: 0.5 },
        { id: 'whiteNoise', name: 'White Noise', icon: 'fa-wind', file: 'sounds/white-noise.mp3', volume: 0.5 },
        { id: 'fireplace', name: 'Fireplace', icon: 'fa-fire', file: 'sounds/fireplace.mp3', volume: 0.5 },
        { id: 'coffeeShop', name: 'Coffee Shop', icon: 'fa-coffee', file: 'sounds/coffee-shop.mp3', volume: 0.5 },
        { id: 'train', name: 'Distant Train', icon: 'fa-train', file: 'sounds/train.mp3', volume: 0.5 }
    ];

    // Preset configurations
    const presets = {
        deepSleep: {
            name: 'Deep Sleep',
            sounds: {
                thunder: 0.4,
                whiteNoise: 0.3,
                forest: 0.2
            }
        },
        focusFlow: {
            name: 'Focus Flow',
            sounds: {
                coffeeShop: 0.5,
                rain: 0.3
            }
        },
        meditation: {
            name: 'Meditation',
            sounds: {
                forest: 0.4,
                waves: 0.4,
                whiteNoise: 0.2
            }
        }
    };

    // Audio context and elements
    let audioContext;
    let masterGainNode;
    const audioBuffers = {};
    const soundSources = {};
    let isPlaying = false;
    let timerInterval;
    let timerDuration = 0;
    let timerRemaining = 0;

    // DOM elements
    const soundControlsContainer = document.querySelector('.sound-controls');
    const playAllBtn = document.getElementById('playAllBtn');
    const stopAllBtn = document.getElementById('stopAllBtn');
    const masterVolumeControl = document.getElementById('masterVolume');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const timerSelect = document.getElementById('timerSelect');
    const startTimerBtn = document.getElementById('startTimerBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Initialize the app
    initAudioContext();
    createSoundControls();
    setupEventListeners();

    // Functions
    function initAudioContext() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGainNode = audioContext.createGain();
            masterGainNode.gain.value = masterVolumeControl.value;
            masterGainNode.connect(audioContext.destination);
            
            // Load all sound files
            sounds.forEach(sound => {
                loadSound(sound.file, sound.id);
            });
        } catch (e) {
            alert('Web Audio API is not supported in this browser');
            console.error(e);
        }
    }

    function loadSound(url, id) {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                audioBuffers[id] = audioBuffer;
            })
            .catch(error => {
                console.error('Error loading sound:', error);
            });
    }

    function createSoundControls() {
        sounds.forEach(sound => {
            const soundCard = document.createElement('div');
            soundCard.className = 'sound-card';
            soundCard.innerHTML = `
                <div class="sound-name">
                    <i class="fas ${sound.icon} sound-icon"></i>
                    ${sound.name}
                </div>
                <div class="volume-control">
                    <label for="${sound.id}-volume">Volume:</label>
                    <input type="range" id="${sound.id}-volume" min="0" max="1" step="0.01" value="${sound.volume}">
                </div>
                <div class="sound-buttons">
                    <button class="control-btn play-btn" data-sound="${sound.id}">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button class="control-btn stop-btn" data-sound="${sound.id}">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                </div>
            `;
            soundControlsContainer.appendChild(soundCard);
        });
    }

    function setupEventListeners() {
        // Master volume control
        masterVolumeControl.addEventListener('input', function() {
            masterGainNode.gain.value = this.value;
        });

        // Play/stop all buttons
        playAllBtn.addEventListener('click', playAllSounds);
        stopAllBtn.addEventListener('click', stopAllSounds);

        // Preset buttons
        presetButtons.forEach(button => {
            button.addEventListener('click', function() {
                const presetName = this.getAttribute('data-preset');
                applyPreset(presetName);
            });
        });

        // Timer controls
        startTimerBtn.addEventListener('click', startTimer);

        // Dark mode toggle
        darkModeToggle.addEventListener('click', toggleDarkMode);

        // Dynamic event listeners for sound controls
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('play-btn') || e.target.parentElement.classList.contains('play-btn')) {
                const btn = e.target.classList.contains('play-btn') ? e.target : e.target.parentElement;
                const soundId = btn.getAttribute('data-sound');
                playSound(soundId);
            }
            
            if (e.target.classList.contains('stop-btn') || e.target.parentElement.classList.contains('stop-btn')) {
                const btn = e.target.classList.contains('stop-btn') ? e.target : e.target.parentElement;
                const soundId = btn.getAttribute('data-sound');
                stopSound(soundId);
            }
        });
    }

    function playSound(soundId) {
        if (soundSources[soundId]) {
            stopSound(soundId);
        }

        const buffer = audioBuffers[soundId];
        if (!buffer) return;

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gainNode = audioContext.createGain();
        const volumeControl = document.getElementById(`${soundId}-volume`);
        gainNode.gain.value = volumeControl.value;

        source.connect(gainNode);
        gainNode.connect(masterGainNode);

        source.start(0);
        soundSources[soundId] = { source, gainNode };

        // Update volume control to affect the gain node
        volumeControl.addEventListener('input', function() {
            gainNode.gain.value = this.value;
        });

        isPlaying = true;
    }

    function stopSound(soundId) {
        if (soundSources[soundId]) {
            soundSources[soundId].source.stop();
            delete soundSources[soundId];
        }
    }

    function playAllSounds() {
        sounds.forEach(sound => {
            if (!soundSources[sound.id]) {
                playSound(sound.id);
            }
        });
    }

    function stopAllSounds() {
        Object.keys(soundSources).forEach(soundId => {
            stopSound(soundId);
        });
        isPlaying = false;
        resetTimer();
    }

    function applyPreset(presetName) {
        const preset = presets[presetName];
        if (!preset) return;

        // Stop all sounds first
        stopAllSounds();

        // Apply the preset
        Object.keys(preset.sounds).forEach(soundId => {
            const volume = preset.sounds[soundId];
            const volumeControl = document.getElementById(`${soundId}-volume`);
            if (volumeControl) {
                volumeControl.value = volume;
                playSound(soundId);
            }
        });
    }

    function startTimer() {
        const minutes = parseInt(timerSelect.value);
        if (minutes <= 0) {
            resetTimer();
            return;
        }

        timerDuration = minutes * 60;
        timerRemaining = timerDuration;

        // Clear any existing timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // Start new timer
        timerInterval = setInterval(function() {
            timerRemaining--;
            
            if (timerRemaining <= 0) {
                stopAllSounds();
                resetTimer();
                alert('Timer has ended. Your sounds have been stopped.');
            }
        }, 1000);

        startTimerBtn.textContent = `Timer: ${formatTime(timerRemaining)}`;
        startTimerBtn.disabled = true;
        timerSelect.disabled = true;
    }

    function resetTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        startTimerBtn.textContent = '<i class="fas fa-hourglass-start"></i> Start Timer';
        startTimerBtn.disabled = false;
        timerSelect.disabled = false;
        timerSelect.value = '0';
        timerRemaining = 0;
        timerDuration = 0;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});
