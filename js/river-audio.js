/**
 * OTN-PB - Web Audio Synthesizer para Ríos y Naturaleza + Funcionalidades de Cabecera
 * Generador procedural mediante Web Audio API: Sonido de Agua de Río y Canto de Aves.
 * Configuración: Reproducción Automática por Defecto (Río + Aves), Fecha Automática y Traductor a Inglés.
 */

(function () {
    'use strict';

    // Estado del Sistema Audio (Auto-play por defecto con Sonido de Río y Pájaros)
    const state = {
        isPlaying: false,
        isMutedByUser: false, // Si el usuario hizo clic en Desconectar/Silenciar
        masterGainVal: 0.65,
        waterVol: 0.70,   // Sonido de Río activo (70%)
        windVol: 0.00,    // Viento deshabilitado por defecto (0%)
        birdsVol: 0.45,   // Canto de Pájaros activo (45%)
        birdsEnabled: true,
        currentPreset: 'rio_pajaros'
    };

    // Cargar preferencia guardada en localStorage
    function loadSavedState() {
        try {
            const savedState = localStorage.getItem('otnpb_river_audio_state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                state.isMutedByUser = parsed.isMutedByUser ?? false;
                state.masterGainVal = parsed.masterGainVal ?? 0.65;
                state.waterVol = parsed.waterVol ?? 0.70;
                state.windVol = parsed.windVol ?? 0.00;
                state.birdsVol = parsed.birdsVol ?? 0.45;
                state.birdsEnabled = parsed.birdsEnabled ?? true;
                state.currentPreset = parsed.currentPreset ?? 'rio_pajaros';
            }
        } catch (e) {
            console.warn('OTN-PB Audio: No se pudo acceder a localStorage', e);
        }
    }

    function saveState() {
        try {
            localStorage.setItem('otnpb_river_audio_state', JSON.stringify({
                isMutedByUser: state.isMutedByUser,
                masterGainVal: state.masterGainVal,
                waterVol: state.waterVol,
                windVol: state.windVol,
                birdsVol: state.birdsVol,
                birdsEnabled: state.birdsEnabled,
                currentPreset: state.currentPreset
            }));
        } catch (e) {}
    }

    // Nodos Web Audio API
    let audioCtx = null;
    let masterGainNode = null;

    // Nodos de Agua
    let waterGainNode = null;
    let waterNoiseSource = null;
    let waterFilterLFO = null;
    let waterHighGainNode = null;

    // Nodos de Viento
    let windGainNode = null;
    let windNoiseSource = null;
    let windFilterLFO = null;

    // Intervalo de Aves
    let birdsInterval = null;

    // Inicialización del AudioContext
    function initAudioContext() {
        if (!audioCtx) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioCtxClass();
            masterGainNode = audioCtx.createGain();
            masterGainNode.gain.setValueAtTime(state.isMutedByUser ? 0 : state.masterGainVal, audioCtx.currentTime);
            masterGainNode.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended' && !state.isMutedByUser) {
            audioCtx.resume().catch(() => {});
        }
    }

    // Generador de Ruido Rosa/Marrón para textura de agua y viento
    function createNoiseBuffer(ctx, durationSec) {
        const bufferSize = ctx.sampleRate * durationSec;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // normalizado suave
            b6 = white * 0.115926;
        }
        return buffer;
    }

    // Iniciar Sintetizador de Agua de Río
    function startWaterSynth() {
        if (!audioCtx) return;

        const noiseBuffer = createNoiseBuffer(audioCtx, 6);
        waterNoiseSource = audioCtx.createBufferSource();
        waterNoiseSource.buffer = noiseBuffer;
        waterNoiseSource.loop = true;

        // Filtro Principal de Agua (Río profundo)
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(650, audioCtx.currentTime);

        const bandpass = audioCtx.createBiquadFilter();
        bandpass.type = 'peaking';
        bandpass.frequency.setValueAtTime(380, audioCtx.currentTime);
        bandpass.gain.setValueAtTime(6, audioCtx.currentTime);
        bandpass.Q.setValueAtTime(1.5, audioCtx.currentTime);

        // LFO para Simular Movimiento de Olitas y Flujo de Agua
        waterFilterLFO = audioCtx.createOscillator();
        waterFilterLFO.type = 'sine';
        waterFilterLFO.frequency.setValueAtTime(0.22, audioCtx.currentTime);

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(180, audioCtx.currentTime);

        waterFilterLFO.connect(lfoGain);
        lfoGain.connect(lowpass.frequency);

        // Ganancia de Agua
        waterGainNode = audioCtx.createGain();
        waterGainNode.gain.setValueAtTime(state.waterVol * 0.8, audioCtx.currentTime);

        // Capa de Detalle Agudo de Agua (Salpicaduras suaves)
        const highpass = audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(1800, audioCtx.currentTime);

        waterHighGainNode = audioCtx.createGain();
        waterHighGainNode.gain.setValueAtTime(state.waterVol * 0.15, audioCtx.currentTime);

        // Conexiones de Audio
        waterNoiseSource.connect(lowpass);
        lowpass.connect(bandpass);
        bandpass.connect(waterGainNode);
        waterGainNode.connect(masterGainNode);

        waterNoiseSource.connect(highpass);
        highpass.connect(waterHighGainNode);
        waterHighGainNode.connect(masterGainNode);

        waterNoiseSource.start(0);
        waterFilterLFO.start(0);
    }

    // Iniciar Sintetizador de Viento (si está activo)
    function startWindSynth() {
        if (!audioCtx || state.windVol <= 0) return;

        const noiseBuffer = createNoiseBuffer(audioCtx, 8);
        windNoiseSource = audioCtx.createBufferSource();
        windNoiseSource.buffer = noiseBuffer;
        windNoiseSource.loop = true;

        const windFilter = audioCtx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(280, audioCtx.currentTime);
        windFilter.Q.setValueAtTime(1.8, audioCtx.currentTime);

        windFilterLFO = audioCtx.createOscillator();
        windFilterLFO.type = 'sine';
        windFilterLFO.frequency.setValueAtTime(0.09, audioCtx.currentTime);

        const windLfoGain = audioCtx.createGain();
        windLfoGain.gain.setValueAtTime(140, audioCtx.currentTime);

        windFilterLFO.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);

        windGainNode = audioCtx.createGain();
        windGainNode.gain.setValueAtTime(state.windVol * 0.5, audioCtx.currentTime);

        windNoiseSource.connect(windFilter);
        windFilter.connect(windGainNode);
        windGainNode.connect(masterGainNode);

        windNoiseSource.start(0);
        windFilterLFO.start(0);
    }

    // Sintetizador de Canto de Aves de Río
    function playSingleBirdChirp() {
        if (!audioCtx || !state.isPlaying || state.isMutedByUser || !state.birdsEnabled || state.birdsVol <= 0) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const birdGain = audioCtx.createGain();

        const baseFreq = 2200 + Math.random() * 800;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);

        osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, now + 0.16);

        birdGain.gain.setValueAtTime(0, now);
        birdGain.gain.linearRampToValueAtTime(state.birdsVol * 0.25, now + 0.03);
        birdGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(birdGain);
        birdGain.connect(masterGainNode);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    function startBirdsSchedule() {
        stopBirdsSchedule();
        birdsInterval = setInterval(() => {
            if (Math.random() < 0.70) {
                playSingleBirdChirp();
            }
        }, 3500);
    }

    function stopBirdsSchedule() {
        if (birdsInterval) {
            clearInterval(birdsInterval);
            birdsInterval = null;
        }
    }

    function playSplashSFX() {
        if (!audioCtx || !state.isPlaying || state.isMutedByUser) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const splashGain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 400, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

        splashGain.gain.setValueAtTime(state.masterGainVal * 0.15, now);
        splashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(splashGain);
        splashGain.connect(masterGainNode);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    // Iniciar Sonido
    function startAudio() {
        initAudioContext();
        if (state.isPlaying) return;

        startWaterSynth();
        if (state.windVol > 0) {
            startWindSynth();
        }
        startBirdsSchedule();

        state.isPlaying = true;
        updateGains();
        updateUIState();
    }

    // Detener Sonido
    function stopAudio() {
        if (!state.isPlaying) return;

        if (waterNoiseSource) {
            try { waterNoiseSource.stop(); } catch (e) {}
            waterNoiseSource = null;
        }
        if (waterFilterLFO) {
            try { waterFilterLFO.stop(); } catch (e) {}
            waterFilterLFO = null;
        }
        if (windNoiseSource) {
            try { windNoiseSource.stop(); } catch (e) {}
            windNoiseSource = null;
        }
        if (windFilterLFO) {
            try { windFilterLFO.stop(); } catch (e) {}
            windFilterLFO = null;
        }

        stopBirdsSchedule();

        state.isPlaying = false;
        updateUIState();
    }

    // Alternar Desconectar / Silenciar (Mute Toggle)
    function toggleMute() {
        state.isMutedByUser = !state.isMutedByUser;
        saveState();

        if (state.isMutedByUser) {
            if (masterGainNode && audioCtx) {
                masterGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            }
        } else {
            if (!state.isPlaying) {
                startAudio();
            }
            if (masterGainNode && audioCtx) {
                masterGainNode.gain.setValueAtTime(state.masterGainVal, audioCtx.currentTime);
            }
        }
        updateUIState();
    }

    // Actualizar Ganancias en Tiempo Real
    function updateGains() {
        if (!audioCtx || !masterGainNode) return;

        const now = audioCtx.currentTime;
        const currentGain = state.isMutedByUser ? 0 : state.masterGainVal;
        masterGainNode.gain.setValueAtTime(currentGain, now);

        if (waterGainNode) {
            waterGainNode.gain.setValueAtTime(state.waterVol * 0.8, now);
        }
        if (waterHighGainNode) {
            waterHighGainNode.gain.setValueAtTime(state.waterVol * 0.15, now);
        }
        if (windGainNode) {
            windGainNode.gain.setValueAtTime(state.windVol * 0.5, now);
        }
    }

    // Intentar Reproducción Automática al Abrir la Página
    function tryAutoplay() {
        if (state.isMutedByUser) return;

        initAudioContext();
        if (!state.isPlaying) {
            startAudio();
        }

        // Escuchadores para desbloquear AudioContext en la primera interacción del usuario si el navegador lo requiere
        const unlockAudio = () => {
            if (audioCtx && audioCtx.state === 'suspended' && !state.isMutedByUser) {
                audioCtx.resume().then(() => {
                    updateUIState();
                }).catch(() => {});
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('scroll', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('mousemove', unlockAudio);
            window.removeEventListener('pointerdown', unlockAudio);
        };

        window.addEventListener('click', unlockAudio, { passive: true });
        window.addEventListener('scroll', unlockAudio, { passive: true });
        window.addEventListener('keydown', unlockAudio, { passive: true });
        window.addEventListener('touchstart', unlockAudio, { passive: true });
        window.addEventListener('mousemove', unlockAudio, { passive: true });
        window.addEventListener('pointerdown', unlockAudio, { passive: true });
    }

    // Construir la Interfaz de Usuario (UI Widget)
    function createAudioUI() {
        if (document.getElementById('river-audio-float-btn')) return;

        const container = document.createElement('div');
        container.id = 'river-audio-container';
        container.innerHTML = `
            <!-- Botón Flotante Principal para Desconectar/Conectar Sonido -->
            <button id="river-audio-float-btn" class="river-audio-float-btn" title="Haga clic para silenciar/desconectar o activar el sonido de río y pájaros">
                <div class="river-audio-eq">
                    <span></span><span></span><span></span>
                </div>
                <span id="river-audio-btn-text">🔊 Desconectar Río y Pájaros</span>
                <span id="river-audio-settings-trigger" class="river-audio-settings-btn" title="Ajustes de Volumen"><i class="fa fa-sliders"></i></span>
            </button>

            <!-- Panel de Ajustes Avanzados -->
            <div id="river-audio-panel" class="river-audio-panel">
                <div class="river-audio-header">
                    <h6><i class="fa fa-tint" style="color: #0077b6;"></i> Sonido Ambiental de Ríos y Pájaros</h6>
                    <button id="river-audio-close" class="river-audio-close" title="Cerrar">&times;</button>
                </div>

                <!-- Master Switch -->
                <div class="river-audio-master-row">
                    <span class="river-audio-master-label">Sonido de Río y Naturaleza</span>
                    <label class="river-audio-switch">
                        <input type="checkbox" id="river-audio-master-toggle" checked>
                        <span class="river-audio-slider-round"></span>
                    </label>
                </div>

                <!-- Control Agua -->
                <div class="river-audio-track">
                    <div class="river-audio-track-label">
                        <span>🌊 Agua / Río Pilcomayo - Bermejo</span>
                        <span id="river-water-val">${Math.round(state.waterVol * 100)}%</span>
                    </div>
                    <input type="range" id="river-water-range" class="river-audio-range" min="0" max="100" value="${Math.round(state.waterVol * 100)}">
                </div>

                <!-- Control Aves -->
                <div class="river-audio-track">
                    <div class="river-audio-track-label">
                        <span>🐦 Canto de Aves de Rivera</span>
                        <span id="river-birds-val">${Math.round(state.birdsVol * 100)}%</span>
                    </div>
                    <input type="range" id="river-birds-range" class="river-audio-range" min="0" max="100" value="${Math.round(state.birdsVol * 100)}">
                </div>

                <!-- Control Viento -->
                <div class="river-audio-track">
                    <div class="river-audio-track-label">
                        <span>🍃 Brisa / Viento</span>
                        <span id="river-wind-val">${Math.round(state.windVol * 100)}%</span>
                    </div>
                    <input type="range" id="river-wind-range" class="river-audio-range" min="0" max="100" value="${Math.round(state.windVol * 100)}">
                </div>

                <!-- Presets Rápidos -->
                <div class="river-audio-presets">
                    <button class="river-audio-preset-btn active" data-preset="rio_pajaros">🌊 Río + 🐦 Pájaros</button>
                    <button class="river-audio-preset-btn" data-preset="rio">🌊 Solo Río</button>
                    <button class="river-audio-preset-btn" data-preset="brisa">🍃 Con Brisa</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Referencias
        const floatBtn = document.getElementById('river-audio-float-btn');
        const settingsTrigger = document.getElementById('river-audio-settings-trigger');
        const panel = document.getElementById('river-audio-panel');
        const closeBtn = document.getElementById('river-audio-close');
        const masterToggle = document.getElementById('river-audio-master-toggle');

        const waterRange = document.getElementById('river-water-range');
        const windRange = document.getElementById('river-wind-range');
        const birdsRange = document.getElementById('river-birds-range');

        const waterValTxt = document.getElementById('river-water-val');
        const windValTxt = document.getElementById('river-wind-val');
        const birdsValTxt = document.getElementById('river-birds-val');

        // Evento Principal: Clic en el botón para DESCONECTAR/DESSILENCIAR
        floatBtn.addEventListener('click', (e) => {
            if (settingsTrigger.contains(e.target)) {
                e.stopPropagation();
                panel.classList.toggle('is-open');
                return;
            }
            toggleMute();
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.remove('is-open');
        });

        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !floatBtn.contains(e.target)) {
                panel.classList.remove('is-open');
            }
        });

        masterToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (state.isMutedByUser) toggleMute();
            } else {
                if (!state.isMutedByUser) toggleMute();
            }
        });

        waterRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            state.waterVol = val / 100;
            waterValTxt.textContent = `${val}%`;
            updateGains();
            saveState();
        });

        windRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            state.windVol = val / 100;
            windValTxt.textContent = `${val}%`;
            if (state.windVol > 0 && !windNoiseSource && state.isPlaying) {
                startWindSynth();
            }
            updateGains();
            saveState();
        });

        birdsRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            state.birdsVol = val / 100;
            state.birdsEnabled = val > 0;
            birdsValTxt.textContent = `${val}%`;
            updateGains();
            saveState();
        });

        document.querySelectorAll('.river-audio-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.getAttribute('data-preset');
                applyPreset(preset);
            });
        });

        document.querySelectorAll('.fh5co_img_special_relative, .card, .fh5co_hover_news_img').forEach(el => {
            el.addEventListener('mouseenter', () => {
                playSplashSFX();
            });
        });
    }

    function applyPreset(name) {
        state.currentPreset = name;
        if (name === 'rio_pajaros') {
            state.waterVol = 0.70;
            state.windVol = 0.00;
            state.birdsVol = 0.45;
        } else if (name === 'rio') {
            state.waterVol = 0.85;
            state.windVol = 0.00;
            state.birdsVol = 0.00;
        } else if (name === 'brisa') {
            state.waterVol = 0.60;
            state.windVol = 0.35;
            state.birdsVol = 0.30;
        }
        state.birdsEnabled = state.birdsVol > 0;

        const waterRange = document.getElementById('river-water-range');
        const windRange = document.getElementById('river-wind-range');
        const birdsRange = document.getElementById('river-birds-range');

        if (waterRange) {
            waterRange.value = Math.round(state.waterVol * 100);
            windRange.value = Math.round(state.windVol * 100);
            birdsRange.value = Math.round(state.birdsVol * 100);

            document.getElementById('river-water-val').textContent = `${waterRange.value}%`;
            document.getElementById('river-wind-val').textContent = `${windRange.value}%`;
            document.getElementById('river-birds-val').textContent = `${birdsRange.value}%`;
        }

        document.querySelectorAll('.river-audio-preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-preset') === name);
        });

        updateGains();
        saveState();
    }

    function updateUIState() {
        const floatBtn = document.getElementById('river-audio-float-btn');
        const masterToggle = document.getElementById('river-audio-master-toggle');
        const btnText = document.getElementById('river-audio-btn-text');

        if (floatBtn && masterToggle) {
            if (!state.isMutedByUser) {
                floatBtn.classList.add('is-playing');
                floatBtn.classList.remove('is-muted');
                masterToggle.checked = true;
                btnText.textContent = '🔊 Desconectar Río y Pájaros';
            } else {
                floatBtn.classList.remove('is-playing');
                floatBtn.classList.add('is-muted');
                masterToggle.checked = false;
                btnText.textContent = '🔇 Activar Río y Pájaros';
            }
        }
    }

    // ─── FECHA AUTOMÁTICA EN EL HEADER ───
    function initAutomaticDate() {
        const dateElements = document.querySelectorAll('.auto-header-date');
        if (dateElements.length > 0) {
            const now = new Date();
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            const formatted = now.toLocaleDateString('es-ES', options).toUpperCase();
            dateElements.forEach(el => {
                el.textContent = formatted;
            });
        }
    }

    // ─── TRADUCTOR GOOGLE TRANSLATE (Español, Inglés, Portugués, Alemán) ───
    const langNames = {
        'es': 'Español',
        'en': 'English',
        'pt': 'Português',
        'de': 'Deutsch'
    };

    function getCurrentLanguage() {
        const cookies = document.cookie;
        const match = cookies.match(/googtrans=\/es\/([a-z]{2})/i);
        if (match && match[1]) {
            return match[1].toLowerCase();
        }
        return 'es';
    }

    function updateTranslateButtonLabel(langCode) {
        const label = document.getElementById('translate-btn-label');
        if (label) {
            label.textContent = langNames[langCode] || 'Español';
        }
        document.querySelectorAll('.lang-select-item').forEach(item => {
            const itemLang = item.getAttribute('data-lang');
            if (itemLang === langCode) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function setGoogleTranslateLanguage(langCode) {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
            updateTranslateButtonLabel(langCode);
        } else {
            if (langCode === 'es') {
                document.cookie = 'googtrans=/es/es; path=/;';
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            } else {
                document.cookie = `googtrans=/es/${langCode}; path=/;`;
            }
            window.location.reload();
        }
    }

    function initGoogleTranslate() {
        if (!document.getElementById('google_translate_element')) {
            const translateDiv = document.createElement('div');
            translateDiv.id = 'google_translate_element';
            translateDiv.style.cssText = 'position:absolute; opacity:0; pointer-events:none; width:0; height:0; overflow:hidden; z-index:-1;';
            document.body.appendChild(translateDiv);
        }

        if (!window.googleTranslateElementInit) {
            window.googleTranslateElementInit = function() {
                try {
                    new window.google.translate.TranslateElement({
                        pageLanguage: 'es',
                        includedLanguages: 'es,en,pt,de',
                        autoDisplay: false
                    }, 'google_translate_element');
                } catch(e) {}
            };
        }

        if (!document.getElementById('google_translate_script')) {
            const s = document.createElement('script');
            s.id = 'google_translate_script';
            s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            document.body.appendChild(s);
        }

        // Listener global para clics en opciones de idioma y en el botón del menú
        document.addEventListener('click', function(e) {
            const langItem = e.target.closest('.lang-select-item');
            if (langItem) {
                e.preventDefault();
                const langCode = langItem.getAttribute('data-lang');
                if (langCode) {
                    setGoogleTranslateLanguage(langCode);
                    const menu = langItem.closest('.lang-dropdown-menu');
                    if (menu) menu.classList.remove('show');
                }
                return;
            }

            const toggleBtn = e.target.closest('#dropdownLang, #btn-translate-lang');
            const wrapper = e.target.closest('.lang-selector-wrapper');
            if (toggleBtn && wrapper) {
                e.preventDefault();
                const menu = wrapper.querySelector('.lang-dropdown-menu');
                if (menu) {
                    menu.classList.toggle('show');
                }
            } else if (!e.target.closest('.lang-selector-wrapper')) {
                document.querySelectorAll('.lang-dropdown-menu').forEach(m => m.classList.remove('show'));
            }
        });

        // Actualizar etiqueta según idioma guardado en la cookie
        setTimeout(() => {
            const initialLang = getCurrentLanguage();
            updateTranslateButtonLabel(initialLang);
        }, 100);
    }

    // Inicialización del script
    document.addEventListener('DOMContentLoaded', () => {
        loadSavedState();
        createAudioUI();
        tryAutoplay();
        updateUIState();
        initAutomaticDate();
        initGoogleTranslate();
    });

    window.OTN_RiverAudio = {
        start: startAudio,
        stop: stopAudio,
        toggleMute: toggleMute,
        setWaterVolume: (v) => { state.waterVol = v; updateGains(); },
        setWindVolume: (v) => { state.windVol = v; updateGains(); }
    };

})();
