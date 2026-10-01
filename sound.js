/* =============================================================================
   ROVARD SOUND ENGINE — vanilla Web Audio API
   Tactile, immersive micro-sound design synthesized in pure code.
   Zero external audio files, zero latency, zero bandwidth overhead.
   Features haptic ticks, snappy clicks, relay toggle, atmospheric swooshes,
   and harmonic chimes. Fully accessible with a persistent state toggle.
   ========================================================================== */

(() => {
  'use strict';

  let audioCtx = null;
  let masterGain = null;
  let isSoundEnabled = false;
  let lastHoverTime = 0;

  const STORAGE_KEY = 'rovard-sound';

  // Check if reduced motion is requested
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Web Audio Initialization ─────────────────────────────────────────── */
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  let currentPan = 0;
  window.addEventListener('mousemove', e => {
    const w = window.innerWidth || 1;
    currentPan = Math.max(-0.75, Math.min(0.75, (e.clientX / w) * 1.5 - 0.75));
  }, { passive: true });

  function getPanner(ctx) {
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(currentPan, ctx.currentTime);
      panner.connect(masterGain);
      return panner;
    }
    return masterGain;
  }

  /* ── Apple-Calibrated Acoustic Synthesizers with 3D Spatial Panning ──────── */

  /**
   * 1. Apple Taptic Engine Micro-Tap (Hover / Selection)
   * Recreates the iconic iOS haptic keyboard & wheel picker "tock".
   * Warm acoustic resonance with a micro-transient contact impulse.
   */
  function playHover() {
    if (!isSoundEnabled) return;
    const now = Date.now();
    if (now - lastHoverTime < 40) return; // Rate-limit rapid sweeps
    lastHoverTime = now;

    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    const t = ctx.currentTime;
    const out = getPanner(ctx);

    // Body: Damped acoustic pulse (iOS picker wheel resonance)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.014);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.014);

    osc.connect(gain);
    gain.connect(out);

    osc.start(t);
    osc.stop(t + 0.015);

    // Transient: Tiny filtered click for glass contact feel
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(820, t);
    oscClick.frequency.exponentialRampToValueAtTime(400, t + 0.006);

    gainClick.gain.setValueAtTime(0.0001, t);
    gainClick.gain.linearRampToValueAtTime(0.03, t + 0.001);
    gainClick.gain.exponentialRampToValueAtTime(0.0001, t + 0.006);

    oscClick.connect(gainClick);
    gainClick.connect(out);

    oscClick.start(t);
    oscClick.stop(t + 0.007);
  }

  /**
   * 2. Apple Force Touch Trackpad Click (Button / Primary Action)
   * Recreates the MacBook Force Touch & iOS button haptic press.
   * Deep, cushioned, tactile "thock" with release damping.
   */
  function playClick() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const t = ctx.currentTime;
    const out = getPanner(ctx);

    // Layer 1: Low-frequency Force Touch solenoid thud
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(190, t);
    osc1.frequency.exponentialRampToValueAtTime(65, t + 0.028);

    gain1.gain.setValueAtTime(0.0001, t);
    gain1.gain.linearRampToValueAtTime(0.09, t + 0.0015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);

    osc1.connect(gain1);
    gain1.connect(out);
    osc1.start(t);
    osc1.stop(t + 0.03);

    // Layer 2: Tactile glass snap (MacBook trackpad click impulse)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(560, t);
    osc2.frequency.exponentialRampToValueAtTime(220, t + 0.012);

    gain2.gain.setValueAtTime(0.0001, t);
    gain2.gain.linearRampToValueAtTime(0.07, t + 0.001);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);

    osc2.connect(gain2);
    gain2.connect(out);
    osc2.start(t);
    osc2.stop(t + 0.015);
  }

  /**
   * 3. Apple iOS Switch Toggle (Theme Switcher / Toggle)
   * The tactile spring-latch sound of iOS Settings switches.
   */
  function playToggle(isOn = true) {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const t = ctx.currentTime;
    const out = getPanner(ctx);

    if (isOn) {
      // Toggle ON: Pre-slip tick + crisp upward latch
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(420, t);
      osc1.frequency.exponentialRampToValueAtTime(240, t + 0.01);
      gain1.gain.setValueAtTime(0.0001, t);
      gain1.gain.linearRampToValueAtTime(0.05, t + 0.001);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.01);
      osc1.connect(gain1);
      gain1.connect(out);
      osc1.start(t);
      osc1.stop(t + 0.012);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(840, t + 0.018);
      osc2.frequency.exponentialRampToValueAtTime(1320, t + 0.038);
      gain2.gain.setValueAtTime(0.0001, t + 0.018);
      gain2.gain.linearRampToValueAtTime(0.07, t + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      osc2.connect(gain2);
      gain2.connect(out);
      osc2.start(t + 0.018);
      osc2.stop(t + 0.05);
    } else {
      // Toggle OFF: Downward unlatch
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1180, t);
      osc1.frequency.exponentialRampToValueAtTime(540, t + 0.024);
      gain1.gain.setValueAtTime(0.0001, t);
      gain1.gain.linearRampToValueAtTime(0.065, t + 0.002);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);
      osc1.connect(gain1);
      gain1.connect(out);
      osc1.start(t);
      osc1.stop(t + 0.03);
    }
  }

  /**
   * 4. Apple visionOS Glass Air Swoosh (Modal / Menu Open & Close)
   * Spatial, refined glass/air glide from visionOS window transitions.
   */
  function playSwoosh() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const t = ctx.currentTime;
    const out = getPanner(ctx);
    const dur = 0.18;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, t);
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.08);
    filter.frequency.exponentialRampToValueAtTime(320, t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(out);

    whiteNoise.start(t);
    whiteNoise.stop(t + dur);

    // Subtle visionOS crystal ping harmonic
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1568, t); // G6
    oscGain.gain.setValueAtTime(0.0001, t);
    oscGain.gain.linearRampToValueAtTime(0.015, t + 0.01);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(oscGain);
    oscGain.connect(out);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * 5. Apple Crystal Glass Chime (Case Study & Project Card Open)
   * Pure, acoustic glass resonance inspired by visionOS object expansion.
   */
  function playChime() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const t = ctx.currentTime;
    const out = getPanner(ctx);
    // Harmonic glass triad: E5 (659.25Hz) + B5 (987.77Hz) + E6 (1318.51Hz)
    const tones = [
      { freq: 659.25, gain: 0.045, decay: 0.28 },
      { freq: 987.77, gain: 0.03,  decay: 0.22 },
      { freq: 1318.51, gain: 0.018, decay: 0.18 }
    ];

    tones.forEach(({ freq, gain: peakGain, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(peakGain, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

      osc.connect(gain);
      gain.connect(out);

      osc.start(t);
      osc.stop(t + decay + 0.02);
    });
  }

  /**
   * 6. Apple Watch Digital Crown Notch (Sliders & Carousel Steps)
   * The ultra-crisp physical detent tick of the Apple Watch Digital Crown.
   */
  function playSliderTick() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const t = ctx.currentTime;
    const out = getPanner(ctx);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(460, t);
    osc.frequency.exponentialRampToValueAtTime(210, t + 0.01);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.01);

    osc.connect(gain);
    gain.connect(out);

    osc.start(t);
    osc.stop(t + 0.012);
  }

  /**
   * 7. Apple Pay / Face ID Success Chime (Form Submission Success)
   * The world's most satisfying two-tone confirmation chime:
   * Tone 1: F#5 (740 Hz), followed by Tone 2: C#6 (1109 Hz) with pure acoustic decay.
   */
  function playSuccess() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const t = ctx.currentTime;
    const out = getPanner(ctx);

    // Tone 1: F#5 (740 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(740, t);

    gain1.gain.setValueAtTime(0.0001, t);
    gain1.gain.linearRampToValueAtTime(0.065, t + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

    osc1.connect(gain1);
    gain1.connect(out);
    osc1.start(t);
    osc1.stop(t + 0.18);

    // Tone 2: C#6 (1109 Hz) — arrives 0.08s later with pure ringing decay
    const t2 = t + 0.085;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1109, t2);

    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.linearRampToValueAtTime(0.075, t2 + 0.012);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.55);

    osc2.connect(gain2);
    gain2.connect(out);
    osc2.start(t2);
    osc2.stop(t2 + 0.6);

    // Harmonic shimmer octave (C#7) for Apple's signature luxury sparkle
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2218, t2);
    gain3.gain.setValueAtTime(0.0001, t2);
    gain3.gain.linearRampToValueAtTime(0.02, t2 + 0.012);
    gain3.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.35);
    osc3.connect(gain3);
    gain3.connect(out);
    osc3.start(t2);
    osc3.stop(t2 + 0.38);
  }

  /* ── Sound Toggle UI & Preference ─────────────────────────────────────── */

  function setSoundEnabled(enabled, triggerFeedback = true) {
    isSoundEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    } catch { }

    const soundToggles = document.querySelectorAll('.sound-toggle');
    soundToggles.forEach(toggle => {
      toggle.setAttribute('aria-checked', String(enabled));
      toggle.setAttribute('aria-label', enabled ? 'Turn sound off' : 'Turn sound on');
      toggle.setAttribute('title', enabled ? 'Turn sound off' : 'Turn sound on');
      const label = toggle.querySelector('.sound-toggle-label');
      if (label) {
        label.textContent = enabled ? 'Sound On' : 'Sound Off';
      }
    });

    if (enabled && triggerFeedback) {
      getAudioContext();
      playToggle(true);
    }
  }

  function initSoundToggle() {
    const saved = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    })();

    // Default to ON unless user has explicitly saved 'off' or requested reduced motion
    const initialEnabled = saved !== 'off' && !prefersReduced;
    setSoundEnabled(initialEnabled, false);

    // Browsers require a user gesture to resume AudioContext.
    // Listen for the very first interaction on the page to seamlessly unlock sound.
    const unlockAudio = () => {
      if (isSoundEnabled) {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
      ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
        window.removeEventListener(evt, unlockAudio, { passive: true });
      });
    };
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlockAudio, { passive: true, once: true });
    });

    document.querySelectorAll('.sound-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        getAudioContext();
        setSoundEnabled(!isSoundEnabled, true);
      });
    });
  }

  /* ── Interactive Sound Wiring ─────────────────────────────────────────── */

  function wireInteractions() {
    // 1. Hover ticks on interactive elements
    const hoverSelector = [
      '.desktop-nav a',
      '.mobile-menu a',
      '.header-cta',
      '.primary-button',
      '.text-button',
      '.theme-toggle',
      '.sound-toggle',
      '.menu-toggle',
      '.slider-arrow',
      '#prevQuote',
      '#nextQuote',
      '.service',
      '.faq-item summary',
      '.project-trigger',
      '.portfolio-card',
      '.round-link',
      '.footer-links a'
    ].join(', ');

    document.addEventListener('mouseover', e => {
      const target = e.target.closest(hoverSelector);
      if (target) {
        playHover();
      }
    }, { passive: true });

    // 2. Click taps on buttons and links
    const clickSelector = [
      '.primary-button',
      '.text-button',
      '.header-cta',
      '.desktop-nav a',
      '.mobile-menu a',
      '.round-link',
      '#nextStep',
      '#prevStep',
      '.faq-item summary'
    ].join(', ');

    document.addEventListener('click', e => {
      const target = e.target.closest(clickSelector);
      if (target) {
        playClick();
      }
    });

    // 3. Theme Toggle hook
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(() => {
          const isDark = document.documentElement.dataset.theme === 'dark';
          playToggle(isDark);
        }, 15);
      });
    });

    // 4. Menu Toggle (Mobile)
    document.querySelectorAll('.menu-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        playSwoosh();
      });
    });

    // 5. Slider & Quote changes
    document.querySelectorAll('.slider-arrow, #prevQuote, #nextQuote, .gallery-lightbox-nav').forEach(btn => {
      btn.addEventListener('click', () => {
        playSliderTick();
      });
    });

    // 6. Case study / Project trigger opens
    document.addEventListener('click', e => {
      const projectCard = e.target.closest('.portfolio-card, .project-trigger');
      if (projectCard) {
        playChime();
      }
      const closeBtn = e.target.closest('.modal-close, .inquiry-close, .gallery-lightbox-close');
      if (closeBtn) {
        playSwoosh();
      }
    });

    // 7. Inquiry modal open
    const openInquiry = document.getElementById('openInquiry');
    if (openInquiry) {
      openInquiry.addEventListener('click', () => {
        playChime();
      });
    }

    // 8. Form submit hook
    const form = document.getElementById('projectForm');
    if (form) {
      form.addEventListener('submit', () => {
        // Validation check happens in script.js; success chime triggers on completion
        setTimeout(() => {
          if (!document.getElementById('formError')?.textContent) {
            playSuccess();
          }
        }, 300);
      });
    }

    // 9. Escape key modal close sound
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const hasOpenModal = document.querySelector('.case-modal.open, .inquiry-modal.open, .mobile-menu.open, .gallery-lightbox.open');
        if (hasOpenModal) {
          playSwoosh();
        }
      }
    });
  }

  // Public API
  window.RovardSound = {
    hover: playHover,
    click: playClick,
    toggle: playToggle,
    swoosh: playSwoosh,
    chime: playChime,
    sliderTick: playSliderTick,
    success: playSuccess,
    setEnabled: setSoundEnabled,
    isEnabled: () => isSoundEnabled
  };

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSoundToggle();
      wireInteractions();
    });
  } else {
    initSoundToggle();
    wireInteractions();
  }
})();
