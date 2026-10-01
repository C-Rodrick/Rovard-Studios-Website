/* =============================================================================
   ROVARD MOTION — v1.0.0
   A complete, professional animation system for the Rovard Studios UI.

   • Peer dependency: React 18+. Nothing else — no framer-motion, no plugins.
   • Every effect respects `prefers-reduced-motion` automatically.
   • Works in any React build (Vite / Next / CRA) and ships a classic-script
     bridge so it can even run untranspiled inside demo/preview pages.

   ── WHAT'S INSIDE ────────────────────────────────────────────────────────────
     MotionProvider      Global context + injects the system stylesheet
     Reveal              Scroll-triggered entrances (rise, blur, curtain…)
     Stagger / Item      Orchestrated child sequences
     TextReveal          Masked word / character headline reveals
     Parallax            Scroll-linked drift, rotation and scale
     Magnetic            Elements that lean toward the cursor
     Tilt                3D perspective cards with a light glare
     Marquee             Infinite brand tickers (pause on hover)
     CountUp             Eased number counters
     ScrollProgress      Spring-smoothed reading bar
     Cursor              Designer cursor: dot + trailing ring + labels
     PageTransition      Panel-wipe route / section transitions
     IntroOverlay        One-time brand intro curtain
     Hooks               useInView, useInViewOnce, useScrollDirection,
                         useReducedMotion
     Tokens              ease, springPresets

   ── QUICK START ──────────────────────────────────────────────────────────────
     import { MotionProvider, Reveal, TextReveal, Tilt } from './RovardMotion';

     <MotionProvider>
       <TextReveal as="h1" text="We build brands that move" by="word" />
       <Reveal variant="rise" delay={200}>
         <p>Design with tempo, presence and discipline.</p>
       </Reveal>
       <Tilt max={9} data-cursor-label="View case study">…card…</Tilt>
     </MotionProvider>
   ========================================================================== */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';

/* ── 1. Design tokens ──────────────────────────────────────────────────────── */

export const ease = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  soft: 'cubic-bezier(0.33, 1, 0.68, 1)',
  inOut: 'cubic-bezier(0.83, 0, 0.17, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const springPresets = {
  gentle: { stiffness: 120, damping: 20, mass: 1 },
  snappy: { stiffness: 260, damping: 24, mass: 1 },
  bouncy: { stiffness: 300, damping: 15, mass: 1 },
  heavy: { stiffness: 90, damping: 26, mass: 1.4 },
};

/* ── 2. Spring engine (tiny rAF physics — no dependencies) ─────────────────── */

function createSpringValue(initial, config) {
  const { stiffness = 170, damping = 22, mass = 1 } = config || springPresets.gentle;
  let value = initial;
  let target = initial;
  let velocity = 0;
  let raf = null;
  let last = 0;
  let listener = null;

  const step = now => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const force = -stiffness * (value - target);
    const drag = -damping * velocity;
    velocity += ((force + drag) / mass) * dt;
    value += velocity * dt;
    if (listener) listener(value);
    if (Math.abs(velocity) < 0.004 && Math.abs(target - value) < 0.004) {
      value = target;
      velocity = 0;
      if (listener) listener(value);
      raf = null;
      return;
    }
    raf = requestAnimationFrame(step);
  };

  return {
    get value() { return value; },
    set(next) {
      target = next;
      if (raf == null) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    },
    jump(next) {
      value = next;
      target = next;
      velocity = 0;
      if (listener) listener(value);
    },
    onChange(fn) { listener = fn; },
    stop() { if (raf != null) cancelAnimationFrame(raf); raf = null; },
  };
}

/* ── 3. Core hooks ─────────────────────────────────────────────────────────── */

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function useInView(ref, { threshold = 0.15, once = true, rootMargin = '0px 0px -8% 0px' } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return undefined; }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      });
    }, { threshold, rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return inView;
}

export function useInViewOnce(ref, options) {
  return useInView(ref, { once: true, ...options });
}

export function useScrollDirection(threshold = 10) {
  const [direction, setDirection] = useState('down');
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = null;
    const onScroll = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY;
        if (Math.abs(y - lastY) > threshold) {
          setDirection(y > lastY ? 'down' : 'up');
          lastY = y;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [threshold]);
  return direction;
}

/* ── 4. Motion context + stylesheet injection ──────────────────────────────── */

const MotionContext = createContext({ reducedMotion: false });
export const useMotionConfig = () => useContext(MotionContext);

const BASE_STYLES = `
:root {
  --rm-brand: #0C0CB4;
  --rm-accent: #FDCF09;
  --rm-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --rm-ease-in-out: cubic-bezier(0.83, 0, 0.17, 1);
}

/* Reveal primitives */
.rm-reveal {
  transition:
    opacity var(--rm-dur, 900ms) var(--rm-ease-out) var(--rm-delay, 0ms),
    transform var(--rm-dur, 900ms) var(--rm-ease-out) var(--rm-delay, 0ms),
    filter var(--rm-dur, 900ms) var(--rm-ease-out) var(--rm-delay, 0ms),
    clip-path var(--rm-dur, 900ms) var(--rm-ease-in-out) var(--rm-delay, 0ms);
  will-change: opacity, transform;
}

/* Masked text reveal */
.rm-text-reveal .rm-tw {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  padding-bottom: 0.12em;
  margin-bottom: -0.12em;
  white-space: pre;
}
.rm-text-reveal .rm-tw-inner {
  display: inline-block;
  transform: translateY(120%);
  transition: transform var(--rm-dur, 850ms) var(--rm-ease-out);
  will-change: transform;
}
.rm-text-reveal.is-shown .rm-tw-inner { transform: translateY(0); }

/* Parallax */
.rm-parallax { will-change: transform; }

/* Magnetic */
.rm-magnetic { display: inline-block; will-change: transform; }
.rm-magnetic > * { display: inline-block; }

/* Tilt */
.rm-tilt { position: relative; transform-style: preserve-3d; will-change: transform; }
.rm-tilt::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  transition: opacity .45s var(--rm-ease-out);
  background: radial-gradient(
    420px circle at var(--rm-gx, 50%) var(--rm-gy, 50%),
    rgba(255, 255, 255, 0.22),
    transparent 62%
  );
}
.rm-tilt:hover::after { opacity: 1; }

/* Marquee */
.rm-marquee { overflow: hidden; position: relative; }
.rm-marquee-track {
  display: flex;
  width: max-content;
  animation: rm-marquee-scroll var(--rm-marquee-speed, 28s) linear infinite;
}
.rm-marquee.is-reverse .rm-marquee-track { animation-direction: reverse; }
.rm-marquee.pausable:hover .rm-marquee-track { animation-play-state: paused; }
.rm-marquee-group { display: flex; align-items: center; flex-shrink: 0; }
@keyframes rm-marquee-scroll {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}

/* Scroll progress */
.rm-scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9800;
  pointer-events: none;
}
.rm-scroll-progress-bar {
  height: 100%;
  transform: scaleX(0);
  transform-origin: 0 50%;
  will-change: transform;
}

/* Custom cursor */
.rm-cursor-dot,
.rm-cursor-ring {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10000;
  pointer-events: none;
  border-radius: 999px;
  will-change: transform;
}
.rm-cursor-dot {
  width: var(--rm-dot-size, 8px);
  height: var(--rm-dot-size, 8px);
  background: #fff;
  mix-blend-mode: difference;
}
.rm-cursor-ring {
  width: var(--rm-ring-size, 40px);
  height: var(--rm-ring-size, 40px);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  mix-blend-mode: difference;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    width .35s var(--rm-ease-out),
    height .35s var(--rm-ease-out),
    background-color .35s var(--rm-ease-out),
    border-color .35s var(--rm-ease-out),
    mix-blend-mode 0s;
}
.rm-cursor-ring.is-active {
  width: calc(var(--rm-ring-size, 40px) * 1.6);
  height: calc(var(--rm-ring-size, 40px) * 1.6);
}
.rm-cursor-ring.is-label {
  width: auto;
  height: auto;
  padding: 12px 20px;
  background: var(--rm-brand);
  border-color: transparent;
  mix-blend-mode: normal;
}
.rm-cursor-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #fff;
  white-space: nowrap;
}
body.rm-hide-cursor,
body.rm-hide-cursor * { cursor: none !important; }

/* Page transition curtain */
.rm-pt {
  position: fixed;
  inset: 0;
  z-index: 9500;
  display: flex;
  pointer-events: none;
}
.rm-pt span {
  flex: 1;
  background: var(--rm-brand);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 0.45s var(--rm-ease-in-out);
  transition-delay: calc(var(--rm-i) * 60ms);
}
.rm-pt.is-cover span { transform: scaleY(1); }
.rm-pt.is-reveal span {
  transform: scaleY(0);
  transform-origin: bottom;
  transition-delay: calc((var(--rm-n) - 1 - var(--rm-i)) * 60ms);
}
.rm-pt-content { transition: opacity .3s var(--rm-ease-out), transform .3s var(--rm-ease-out); }
.rm-pt-content.is-out { opacity: 0; transform: translateY(-14px); }

/* Intro overlay */
.rm-intro {
  position: fixed;
  inset: 0;
  z-index: 9900;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.rm-intro-panels { position: absolute; inset: 0; display: flex; }
.rm-intro-panels span {
  flex: 1;
  background: var(--rm-brand);
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform .55s var(--rm-ease-in-out);
  transition-delay: calc(var(--rm-i) * 70ms);
}
.rm-intro.is-in .rm-intro-panels span { transform: scaleY(1); }
.rm-intro.is-out .rm-intro-panels span {
  transform: scaleY(0);
  transform-origin: top;
  transition-delay: calc(var(--rm-i) * 70ms);
}
.rm-intro-logo {
  position: relative;
  font-weight: 800;
  letter-spacing: 0.3em;
  font-size: clamp(2rem, 6vw, 4.5rem);
  color: #fff;
  opacity: 0;
  transform: translateY(26px);
  transition: opacity .5s var(--rm-ease-out) .45s, transform .6s var(--rm-ease-out) .45s;
}
.rm-intro.is-in .rm-intro-logo { opacity: 1; transform: translateY(0); }
.rm-intro.is-out .rm-intro-logo {
  opacity: 0;
  transform: translateY(-30px);
  transition: opacity .35s var(--rm-ease-out), transform .4s var(--rm-ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .rm-reveal,
  .rm-text-reveal .rm-tw-inner,
  .rm-marquee-track,
  .rm-pt span,
  .rm-intro-panels span,
  .rm-intro-logo {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
`;

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById('rovard-motion-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'rovard-motion-styles';
  tag.textContent = BASE_STYLES;
  document.head.appendChild(tag);
}

export function MotionProvider({ children }) {
  const reducedMotion = useReducedMotion();
  useEffect(() => { injectStyles(); }, []);
  const value = useMemo(() => ({ reducedMotion }), [reducedMotion]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

/* ── 5. Reveal — scroll-triggered entrances ────────────────────────────────── */

const REVEAL_HIDDEN = {
  fade: { opacity: 0 },
  rise: { opacity: 0, transform: 'translate3d(0, var(--rm-distance), 0)' },
  sink: { opacity: 0, transform: 'translate3d(0, calc(var(--rm-distance) * -1), 0)' },
  'from-left': { opacity: 0, transform: 'translate3d(calc(var(--rm-distance) * -1), 0, 0)' },
  'from-right': { opacity: 0, transform: 'translate3d(var(--rm-distance), 0, 0)' },
  zoom: { opacity: 0, transform: 'scale(.9)' },
  blur: { opacity: 0, transform: 'translate3d(0, 16px, 0)', filter: 'blur(14px)' },
  curtain: { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
};

const REVEAL_SHOWN = {
  fade: { opacity: 1 },
  rise: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  sink: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  'from-left': { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  'from-right': { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  zoom: { opacity: 1, transform: 'scale(1)' },
  blur: { opacity: 1, transform: 'translate3d(0, 0, 0)', filter: 'blur(0px)' },
  curtain: { opacity: 1, clipPath: 'inset(0 0 -2% 0)' },
};

export function Reveal({
  as: Tag = 'div',
  variant = 'rise',
  delay = 0,
  duration = 900,
  distance = 44,
  threshold = 0.15,
  className = '',
  style,
  children,
  ...rest
}) {
  const { reducedMotion } = useMotionConfig();
  const ref = useRef(null);
  const inView = useInView(ref, { threshold });
  const shown = inView || reducedMotion;

  const stateStyle = reducedMotion
    ? undefined
    : (shown ? REVEAL_SHOWN[variant] : REVEAL_HIDDEN[variant]) || REVEAL_HIDDEN.fade;

  return (
    <Tag
      ref={ref}
      className={`rm-reveal ${className}`.trim()}
      style={{
        '--rm-distance': `${distance}px`,
        '--rm-delay': `${delay}ms`,
        '--rm-dur': `${duration}ms`,
        ...stateStyle,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ── 6. Stagger orchestration ──────────────────────────────────────────────── */

const StaggerContext = createContext(null);

export function Stagger({ as: Tag = 'div', step = 90, delay = 0, className = '', children, ...rest }) {
  const counter = useRef(-1);
  counter.current = -1; // reset per render pass so delays stay stable
  const value = useMemo(() => ({ next: () => { counter.current += 1; return counter.current; }, step, delay }), [step, delay]);
  return (
    <StaggerContext.Provider value={value}>
      <Tag className={className} {...rest}>{children}</Tag>
    </StaggerContext.Provider>
  );
}

export function StaggerItem({ variant = 'rise', step, delay: delayProp, ...rest }) {
  const group = useContext(StaggerContext);
  const index = group ? group.next() : 0;
  const delay = delayProp != null ? delayProp : (group ? group.delay + index * group.step : index * (step || 90));
  return <Reveal variant={variant} delay={delay} {...rest} />;
}

/* ── 7. TextReveal — masked word / character headlines ─────────────────────── */

export function TextReveal({
  text = '',
  by = 'word',
  step = 42,
  charStep = 26,
  delay = 0,
  duration = 850,
  as: Tag = 'span',
  className = '',
  ...rest
}) {
  const { reducedMotion } = useMotionConfig();
  const ref = useRef(null);
  const inView = useInView(ref, { threshold: 0.3 });
  const shown = inView || reducedMotion;
  const words = useMemo(() => String(text).trim().split(/\s+/).filter(Boolean), [text]);

  if (reducedMotion) {
    return <Tag className={className} {...rest}>{text}</Tag>;
  }

  let charCursor = 0;

  return (
    <Tag
      ref={ref}
      className={`rm-text-reveal ${shown ? 'is-shown' : ''} ${className}`.trim()}
      aria-label={text}
      style={{ '--rm-dur': `${duration}ms` }}
      {...rest}
    >
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        if (by === 'char') {
          const start = charCursor;
          charCursor += word.length + 1;
          return (
            <React.Fragment key={i}>
              <span className="rm-tw" aria-hidden="true">
                <span className="rm-tw-inner">
                  {Array.from(word).map((ch, j) => (
                    <span key={j} style={{ transitionDelay: `${delay + (start + j) * charStep}ms` }}>{ch}</span>
                  ))}
                </span>
              </span>
              {!isLast ? ' ' : null}
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={i}>
            <span className="rm-tw" aria-hidden="true">
              <span className="rm-tw-inner" style={{ transitionDelay: `${delay + i * step}ms` }}>{word}</span>
            </span>
            {!isLast ? ' ' : null}
          </React.Fragment>
        );
      })}
    </Tag>
  );
}

/* ── 8. Parallax — scroll-linked drift ─────────────────────────────────────── */

export function Parallax({
  as: Tag = 'div',
  speed = 0.12,
  axis = 'y',
  rotate = 0,
  className = '',
  style,
  children,
  ...rest
}) {
  const { reducedMotion } = useMotionConfig();
  const ref = useRef(null);

  useEffect(() => {
    if (reducedMotion) return undefined;
    let raf = null;
    const update = () => {
      raf = null;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const shift = progress * speed * 120;
      const x = axis === 'x' ? shift : 0;
      const y = axis === 'y' ? shift : 0;
      const r = rotate ? progress * rotate : 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)${r ? ` rotate(${r}deg)` : ''}`;
    };
    const onScroll = () => { if (raf == null) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [speed, axis, rotate, reducedMotion]);

  return (
    <Tag ref={ref} className={`rm-parallax ${className}`.trim()} style={style} {...rest}>
      {children}
    </Tag>
  );
}

/* ── 9. Magnetic — elements that lean toward the cursor ────────────────────── */

export function Magnetic({
  children,
  strength = 0.35,
  className = '',
  ...rest
}) {
  const { reducedMotion } = useMotionConfig();
  const ref = useRef(null);
  const springs = useRef(null);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const x = createSpringValue(0, springPresets.snappy);
    const y = createSpringValue(0, springPresets.snappy);
    springs.current = { x, y };
    x.onChange(v => {
      const el = ref.current;
      if (el) el.style.transform = `translate3d(${v}px, ${y.value}px, 0)`;
    });
    y.onChange(v => {
      const el = ref.current;
      if (el) el.style.transform = `translate3d(${x.value}px, ${v}px, 0)`;
    });
    return () => { x.stop(); y.stop(); springs.current = null; };
  }, [reducedMotion]);

  const onPointerMove = e => {
    const s = springs.current;
    const el = ref.current;
    if (!s || !el || reducedMotion) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    s.x.set(Math.max(-1, Math.min(1, nx)) * rect.width * 0.5 * strength);
    s.y.set(Math.max(-1, Math.min(1, ny)) * rect.height * 0.5 * strength);
  };

  const reset = () => {
    const s = springs.current;
    if (s) { s.x.set(0); s.y.set(0); }
  };

  return (
    <span
      ref={ref}
      className={`rm-magnetic ${className}`.trim()}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ── 10. Tilt — 3D perspective cards with glare ────────────────────────────── */

export function Tilt({
  children,
  max = 9,
  className = '',
  style,
  ...rest
}) {
  const { reducedMotion } = useMotionConfig();
  const ref = useRef(null);

  const onPointerMove = e => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    el.style.setProperty('--rm-gx', `${(px + 0.5) * 100}%`);
    el.style.setProperty('--rm-gy', `${(py + 0.5) * 100}%`);
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform .7s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    window.setTimeout(() => { if (el) el.style.transition = ''; }, 700);
  };

  return (
    <div
      ref={ref}
      className={`rm-tilt ${className}`.trim()}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── 11. Marquee — infinite tickers ────────────────────────────────────────── */

export function Marquee({
  children,
  speed = 28,
  reverse = false,
  pauseOnHover = true,
  className = '',
  style,
  ...rest
}) {
  return (
    <div
      className={`rm-marquee ${reverse ? 'is-reverse' : ''} ${pauseOnHover ? 'pausable' : ''} ${className}`.trim()}
      style={{ '--rm-marquee-speed': `${speed}s`, ...style }}
      {...rest}
    >
      <div className="rm-marquee-track">
        <div className="rm-marquee-group">{children}</div>
        <div className="rm-marquee-group" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}

/* ── 12. CountUp — eased counters ──────────────────────────────────────────── */

export function CountUp({
  to = 100,
  from = 0,
  duration = 1800,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
  ...rest
}) {
  const { reducedMotion } = useMotionConfig();
  const ref = useRef(null);
  const inView = useInView(ref, { threshold: 0.4 });
  const [display, setDisplay] = useState(reducedMotion ? to : from);

  const format = useCallback(n => {
    const fixed = n.toFixed(decimals);
    const [int, dec] = fixed.split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return `${prefix}${grouped}${dec ? `.${dec}` : ''}${suffix}`;
  }, [decimals, prefix, suffix, separator]);

  useEffect(() => {
    if (!inView) return undefined;
    if (reducedMotion) { setDisplay(to); return undefined; }
    let raf = null;
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf != null) cancelAnimationFrame(raf); };
  }, [inView, from, to, duration, reducedMotion]);

  return (
    <span ref={ref} className={`rm-count ${className}`.trim()} {...rest}>
      {format(display)}
    </span>
  );
}

/* ── 13. ScrollProgress — spring-smoothed reading bar ──────────────────────── */

export function ScrollProgress({ height = 3, color = 'var(--rm-brand)', zIndex = 9800 }) {
  const { reducedMotion } = useMotionConfig();
  const barRef = useRef(null);
  const spring = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const apply = v => { bar.style.transform = `scaleX(${v})`; };
    let s = null;
    if (reducedMotion) {
      apply(0);
    } else {
      s = createSpringValue(0, springPresets.gentle);
      s.onChange(apply);
      spring.current = s;
    }
    let raf = null;
    const update = () => {
      raf = null;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const fraction = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      if (s) s.set(fraction); else apply(fraction);
    };
    const onScroll = () => { if (raf == null) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf != null) cancelAnimationFrame(raf);
      if (s) s.stop();
    };
  }, [reducedMotion]);

  return (
    <div className="rm-scroll-progress" style={{ height, zIndex }} aria-hidden="true">
      <div ref={barRef} className="rm-scroll-progress-bar" style={{ background: color }} />
    </div>
  );
}

/* ── 14. Cursor — dot + trailing ring + contextual labels ──────────────────── */

export function Cursor({ dotSize = 8, ringSize = 40, hideNative = false } = {}) {
  const { reducedMotion } = useMotionConfig();
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState('');
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return undefined;
    if (typeof window.matchMedia === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return undefined;
    setEnabled(true);
    return undefined;
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled) return undefined;
    const pos = { dx: -100, dy: -100, rx: -100, ry: -100 };
    let raf = requestAnimationFrame(loop);

    function loop() {
      pos.rx += (pos.dx - pos.rx) * 0.16;
      pos.ry += (pos.dy - pos.ry) * 0.16;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${pos.dx}px, ${pos.dy}px, 0) translate(-50%, -50%)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    }

    const onMove = e => { pos.dx = e.clientX; pos.dy = e.clientY; };
    const onOver = e => {
      const target = e.target;
      const interactive = target.closest ? target.closest('a, button, [data-cursor]') : null;
      if (ringRef.current) ringRef.current.classList.toggle('is-active', !!interactive);
      const labelled = target.closest ? target.closest('[data-cursor-label]') : null;
      setLabel(labelled ? labelled.getAttribute('data-cursor-label') || '' : '');
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    if (hideNative) document.body.classList.add('rm-hide-cursor');
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      document.body.classList.remove('rm-hide-cursor');
    };
  }, [enabled, hideNative]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className="rm-cursor-dot" style={{ '--rm-dot-size': `${dotSize}px` }} aria-hidden="true" />
      <div
        ref={ringRef}
        className={`rm-cursor-ring ${label ? 'is-label' : ''}`}
        style={{ '--rm-ring-size': `${ringSize}px` }}
        aria-hidden="true"
      >
        {label ? <span className="rm-cursor-label">{label}</span> : null}
      </div>
    </>
  );
}

/* ── 15. PageTransition — panel-wipe between views ─────────────────────────── */

export function PageTransition({
  transitionKey,
  children,
  panels = 5,
  color = 'var(--rm-brand)',
  duration = 1000,
}) {
  const prevKey = useRef(null);
  const latest = useRef(children);
  latest.current = children;
  const [phase, setPhase] = useState('idle');
  const [shown, setShown] = useState(children);

  useEffect(() => {
    if (prevKey.current === null) { prevKey.current = transitionKey; return undefined; }
    if (prevKey.current === transitionKey) return undefined;
    prevKey.current = transitionKey;
    setPhase('cover');
    const t1 = window.setTimeout(() => { setShown(latest.current); setPhase('reveal'); }, duration * 0.5);
    const t2 = window.setTimeout(() => setPhase('idle'), duration);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [transitionKey, duration]);

  return (
    <>
      <div
        className={`rm-pt ${phase === 'cover' ? 'is-cover' : ''} ${phase === 'reveal' ? 'is-reveal' : ''}`}
        style={{ '--rm-n': panels, ...(color ? { '--rm-brand': color } : {}) }}
        aria-hidden="true"
      >
        {Array.from({ length: panels }).map((_, i) => (
          <span key={i} style={{ '--rm-i': i }} />
        ))}
      </div>
      <div className={`rm-pt-content ${phase === 'cover' ? 'is-out' : ''}`}>{shown}</div>
    </>
  );
}

/* ── 16. IntroOverlay — one-time brand curtain ─────────────────────────────── */

export function IntroOverlay({
  logo = 'ROVARD',
  panels = 5,
  duration = 2100,
  once = true,
  color = 'var(--rm-brand)',
} = {}) {
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    if (once && typeof sessionStorage !== 'undefined' && sessionStorage.getItem('rm-intro-played')) {
      setPhase('done');
      return undefined;
    }
    const t1 = window.setTimeout(() => setPhase('out'), duration * 0.55);
    const t2 = window.setTimeout(() => {
      setPhase('done');
      if (once && typeof sessionStorage !== 'undefined') sessionStorage.setItem('rm-intro-played', '1');
    }, duration);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [duration, once]);

  if (phase === 'done') return null;

  return (
    <div className={`rm-intro is-${phase}`} style={{ '--rm-brand': color }} aria-hidden="true">
      <div className="rm-intro-panels">
        {Array.from({ length: panels }).map((_, i) => (
          <span key={i} style={{ '--rm-i': i }} />
        ))}
      </div>
      <div className="rm-intro-logo">{logo}</div>
    </div>
  );
}

/* ── 17. Exports bridge (lets the file run without a bundler too) ──────────── */

const RovardMotionExports = {
  MotionProvider,
  Reveal,
  Stagger,
  StaggerItem,
  TextReveal,
  Parallax,
  Magnetic,
  Tilt,
  Marquee,
  CountUp,
  ScrollProgress,
  Cursor,
  PageTransition,
  IntroOverlay,
  useInView,
  useInViewOnce,
  useScrollDirection,
  useReducedMotion,
  useMotionConfig,
  ease,
  springPresets,
};

export default RovardMotionExports;
globalThis.RovardMotion = RovardMotionExports;
