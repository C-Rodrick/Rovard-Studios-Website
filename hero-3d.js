/* =============================================================================
   ROVARD HERO 3D — Kinetic Parametric Sculpture
   High-performance procedural 3D geometric ribbon & kinetic particle mesh.
   Zero dependencies. Hardware accelerated. 60–120 FPS.
   Features mouse-tilt physics, scroll-depth perspective flythrough,
   depth-cued rendering, and automatic dark/light theme calibration.
   ========================================================================== */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initHero3D() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let isVisible = true;
    let animId = null;

    // 3D Rotation State
    let angleX = 0.4;
    let angleY = 0.6;
    let angleZ = 0.1;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    let scrollZ = 0;
    let targetScrollZ = 0;

    // Color definitions
    const colors = {
      light: {
        ring1: 'rgba(22, 45, 175, 0.45)',     // #162DAF
        ring2: 'rgba(0, 9, 133, 0.35)',       // #000985
        particles: '#D8A901',                  // Gold
        glow: 'rgba(22, 45, 175, 0.08)'
      },
      dark: {
        ring1: 'rgba(154, 174, 255, 0.55)',   // Accent lavender/blue
        ring2: 'rgba(92, 126, 255, 0.38)',
        particles: '#F5CC00',                  // Bright electric gold
        glow: 'rgba(154, 174, 255, 0.12)'
      }
    };

    function isDark() {
      return document.documentElement.dataset.theme === 'dark';
    }

    /* ── Generate 3D Parametric Torus Möbius Mesh ────────────────────────── */
    const numRings = 48;
    const pointsPerRing = 16;
    const R = 185; // Major radius
    const r = 70;  // Minor radius

    const baseVertices = [];
    const lines = [];

    for (let i = 0; i < numRings; i++) {
      const u = (i / numRings) * Math.PI * 2;
      for (let j = 0; j < pointsPerRing; j++) {
        const v = (j / pointsPerRing) * Math.PI * 2;
        // Torus knot / Möbius modulation
        const modR = R + Math.sin(u * 3) * 15;
        const x = (modR + r * Math.cos(v)) * Math.cos(u);
        const y = (modR + r * Math.cos(v)) * Math.sin(u);
        const z = r * Math.sin(v) + Math.cos(u * 2) * 20;

        baseVertices.push({ x, y, z, u, v });

        // Connect along the ring
        const currentIdx = i * pointsPerRing + j;
        const nextInRing = i * pointsPerRing + ((j + 1) % pointsPerRing);
        lines.push([currentIdx, nextInRing, 'ring']);

        // Connect along the tube loop
        const nextRingIdx = ((i + 1) % numRings) * pointsPerRing + j;
        lines.push([currentIdx, nextRingIdx, 'tube']);
      }
    }

    // Floating stardust nodes
    const numDust = 36;
    const dustPoints = [];
    for (let k = 0; k < numDust; k++) {
      const rad = R * (0.8 + Math.random() * 0.9);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      dustPoints.push({
        x: rad * Math.cos(phi) * Math.cos(theta),
        y: rad * Math.cos(phi) * Math.sin(theta),
        z: rad * Math.sin(phi),
        size: Math.random() * 2.2 + 0.8,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        phase: Math.random() * Math.PI * 2
      });
    }

    /* ── Canvas Resize ─────────────────────────────────────────────────── */
    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    /* ── Mouse & Scroll Interaction ────────────────────────────────────── */
    window.addEventListener('mousemove', e => {
      if (prefersReduced) return;
      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      targetRotY = nx * 0.85;
      targetRotX = -ny * 0.65;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY < height * 1.2) {
        targetScrollZ = scrollY * 0.45;
      }
    }, { passive: true });

    let lastTime = performance.now();

    // Pause when offscreen
    const observer = new IntersectionObserver(entries => {
      isVisible = entries[0].isIntersecting;
      if (isVisible && !animId) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    }, { threshold: 0.05 });
    observer.observe(canvas);

    /* ── Main 3D Render Loop ───────────────────────────────────────────── */
    function render(now) {
      if (!isVisible) {
        animId = null;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Spring physics for mouse rotation and scroll
      currentRotX += (targetRotX - currentRotX) * 0.06;
      currentRotY += (targetRotY - currentRotY) * 0.06;
      scrollZ += (targetScrollZ - scrollZ) * 0.08;

      // Continuous autonomous idle drift
      const idleSpeed = prefersReduced ? 0.002 : 0.005;
      angleY += idleSpeed;
      angleX += idleSpeed * 0.4;
      angleZ += idleSpeed * 0.2;

      const totalRotX = angleX + currentRotX;
      const totalRotY = angleY + currentRotY;
      const totalRotZ = angleZ;

      // Rotation matrix components
      const cosX = Math.cos(totalRotX), sinX = Math.sin(totalRotX);
      const cosY = Math.cos(totalRotY), sinY = Math.sin(totalRotY);
      const cosZ = Math.cos(totalRotZ), sinZ = Math.sin(totalRotZ);

      // Project vertices to 2D
      const isMobile = width < 768;
      // Center slightly to the right of the hero text on desktop
      const cx = isMobile ? width * 0.5 : width * 0.68;
      const cy = height * 0.48;
      const scaleMultiplier = isMobile ? Math.min(width, height) / 800 : Math.min(width, height) / 680;
      const focalLength = 520;

      const projected = new Array(baseVertices.length);

      for (let i = 0; i < baseVertices.length; i++) {
        const v = baseVertices[i];

        // Apply scale
        let x = v.x * scaleMultiplier;
        let y = v.y * scaleMultiplier;
        let z = v.z * scaleMultiplier;

        // Rotation around Y
        let x1 = x * cosY + z * sinY;
        let z1 = -x * sinY + z * cosY;

        // Rotation around X
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        // Rotation around Z
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        // Apply scroll depth recession
        z2 -= scrollZ;

        const distance = focalLength + z2;
        const perspective = distance > 10 ? focalLength / distance : 0.001;

        projected[i] = {
          x: cx + x3 * perspective,
          y: cy + y3 * perspective,
          z: z2,
          perspective,
          alpha: Math.max(0.08, Math.min(0.85, (z2 + 250) / 450))
        };
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const activeColor = isDark() ? colors.dark : colors.light;

      // Render subtle central ambient glow behind sculpture
      const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260 * scaleMultiplier);
      glowGrad.addColorStop(0, activeColor.glow);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 260 * scaleMultiplier, 0, Math.PI * 2);
      ctx.fill();

      // Render wireframe lines with depth-cued alpha
      ctx.lineWidth = 1;

      for (let l = 0; l < lines.length; l++) {
        const [i1, i2, type] = lines[l];
        const p1 = projected[i1];
        const p2 = projected[i2];

        // Average depth
        const avgZ = (p1.z + p2.z) * 0.5;
        const alpha = Math.max(0.04, Math.min(0.75, (avgZ + 240) / 460));

        if (alpha <= 0.05) continue;

        ctx.strokeStyle = type === 'ring' ? activeColor.ring1 : activeColor.ring2;
        ctx.globalAlpha = type === 'ring' ? alpha : alpha * 0.65;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Render floating stardust particles
      ctx.fillStyle = activeColor.particles;
      for (let k = 0; k < dustPoints.length; k++) {
        const dp = dustPoints[k];
        dp.phase += dp.pulseSpeed;

        let x = dp.x * scaleMultiplier;
        let y = dp.y * scaleMultiplier;
        let z = dp.z * scaleMultiplier;

        // Apply Y and X rotations
        let x1 = x * cosY + z * sinY;
        let z1 = -x * sinY + z * cosY;
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        z2 -= scrollZ;
        const distance = focalLength + z2;
        if (distance <= 10) continue;

        const pers = focalLength / distance;
        const px = cx + x3 * pers;
        const py = cy + y3 * pers;

        const pulse = 0.5 + Math.sin(dp.phase) * 0.5;
        const size = dp.size * pers * (0.8 + pulse * 0.4);
        const alpha = Math.max(0.1, Math.min(0.9, (z2 + 200) / 380)) * (0.4 + pulse * 0.6);

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.8, size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    }

    lastTime = performance.now();
    animId = requestAnimationFrame(render);
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHero3D);
  } else {
    initHero3D();
  }
})();
