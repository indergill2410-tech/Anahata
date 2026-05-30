import React, { useEffect, useRef, useState, useCallback } from 'react';
import AnahataOrb from '../components/AnahataOrb';

interface LandingPageProps { onEnter: () => void; }

const PILLARS = [
  { icon: '◎', title: 'Ancient Raga Science', body: 'Every track is rooted in a classical Indian raga — melodic frameworks refined over 3,000 years to move specific emotions. Bhairavi for dawn peace. Yaman for evening calm. Darbari for deep night.', color: '#7048E8', orbId: 'el-ether' as const },
  { icon: '∿', title: 'Binaural Entrainment',  body: 'Two slightly different tones — one in each ear — create a third phantom frequency inside your brain. Delta for deep sleep. Theta for lucid dreaming. Alpha for effortless focus.',                   color: '#3B5BDB', orbId: 'bw-theta' as const },
  { icon: '♡', title: 'Adaptive to You',       body: 'Connect your heart rate monitor and the music breathes with you. Tempo, harmonic density, and layering shift in real time — no two sessions are ever the same.',                    color: '#0CA678', orbId: 'int-heal' as const },
];

const STATS = [
  { value: 11,   display: '11',   label: 'Curated Journeys',     orbId: 'int-peace'     as const },
  { value: 432,  display: '432',  label: 'Hz Foundation Tuning', orbId: 'bw-alpha'      as const },
  { value: 3000, display: '3000', label: 'Years of Raga Wisdom', orbId: 'el-ether'      as const },
  { value: 0,    display: '∞',    label: 'Adaptive Permutations',orbId: 'mood-blissful' as const },
];

const DIFFERENCES = [
  { them: 'Generic lo-fi or nature sounds',       us: 'Live-generated raga melodies tuned to your brainwave state' },
  { them: 'Fixed 10-minute guided tracks',         us: '15–32 minute immersive journeys that adapt to your heart rate' },
  { them: 'One-size-fits-all playlists',           us: 'Choose your intention — Sleep, Focus, Heal, Dream — and the whole soundscape shifts' },
  { them: 'Passive listening',                     us: 'Your biology drives the music. You are the instrument.' },
];

const AUDIENCE = ['Meditators', 'Musicians', 'Biohackers', 'Insomniacs', 'Healers', 'Athletes', 'Creators'];

// ── Hook: fire once when element enters viewport ──
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Animated counter ──
function Counter({ target, duration = 1600 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(target * ease));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{val.toLocaleString()}</span>;
}

// ── Typewriter ──
function Typewriter({ words, speed = 80, pause = 1800 }: { words: string[]; speed?: number; pause?: number }) {
  const [text, setText] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length - 1 === 0) { setDeleting(false); setWordIdx((wordIdx + 1) % words.length); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, wordIdx, words, speed, pause]);

  return (
    <span style={{ color: '#7048E8' }}>
      {text}
      <span style={{ borderRight: '2px solid #7048E8', marginLeft: 1, animation: 'blink 1s step-end infinite' }} />
    </span>
  );
}

// ── Hero Canvas Orb ──
function OrbHero({ entered }: { entered: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);
  const tRef      = useRef(0);
  const mouseRef  = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = S * dpr; canvas.height = S * dpr;
    canvas.style.width = `${S}px`; canvas.style.height = `${S}px`;
    ctx.scale(dpr, dpr);
    const cx = S / 2, cy = S / 2;

    type ParticleColor = 'violet' | 'amber' | 'teal';
    const particles = Array.from({ length: 200 }, (_, i) => {
      const rnd = Math.random();
      let color: ParticleColor;
      let hue: number;
      if (rnd < 0.7) { color = 'violet'; hue = 255 + Math.random() * 50; }
      else if (rnd < 0.9) { color = 'amber'; hue = 35 + Math.random() * 20; }
      else { color = 'teal'; hue = 190 + Math.random() * 20; }
      return {
        angle: (i / 200) * Math.PI * 2,
        r: S * 0.28 + Math.random() * S * 0.18,
        speed: 0.002 + Math.random() * 0.007,
        size: 1.2 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2,
        hue,
        color,
        layer: Math.floor(Math.random() * 3),
      };
    });

    // floating debris
    const debris = Array.from({ length: 50 }, () => ({
      x: Math.random() * S, y: Math.random() * S,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: 0.5 + Math.random() * 1.5, hue: 250 + Math.random() * 60, alpha: Math.random() * 0.4 + 0.1,
    }));

    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const src = 'touches' in e ? e.touches[0] : e;
      mouseRef.current = { x: (src.clientX - rect.left) * (S / rect.width), y: (src.clientY - rect.top) * (S / rect.height) };
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove as EventListener, { passive: true });

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      tRef.current += 0.012;
      const t = tRef.current;
      ctx.clearRect(0, 0, S, S);

      const breathScale = 1 + 0.055 * Math.sin(t * 0.65);
      const orbR = S * 0.25 * breathScale;

      // far ambient rings
      for (let i = 6; i >= 1; i--) {
        const gr = orbR * (1 + i * 0.55);
        const a = 0.055 / i;
        const grd = ctx.createRadialGradient(cx, cy, orbR * 0.4, cx, cy, gr);
        grd.addColorStop(0, `rgba(112,72,232,${a * 2.2})`);
        grd.addColorStop(0.5, `rgba(90,60,200,${a})`);
        grd.addColorStop(1, 'rgba(112,72,232,0)');
        ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
      }

      // rotating orbit rings
      for (let r = 0; r < 3; r++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * (0.15 + r * 0.08) * (r % 2 === 0 ? 1 : -1));
        ctx.beginPath();
        ctx.ellipse(0, 0, orbR * (1.35 + r * 0.28), orbR * (0.45 + r * 0.12), r * 0.6, 0, Math.PI * 2);
        ctx.setLineDash(r === 1 ? [3, 6] : []);
        ctx.strokeStyle = `rgba(112,72,232,${0.12 - r * 0.03})`;
        ctx.lineWidth = r === 0 ? 1 : 0.6;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // breathing ring (4th ring — physiological breath cycle 4s inhale, 4s hold, 6s exhale)
      {
        const cycleDuration = 14; // 4+4+6
        const cyclePos = t % cycleDuration;
        let breathNorm: number;
        if (cyclePos < 4) { breathNorm = cyclePos / 4; }           // inhale
        else if (cyclePos < 8) { breathNorm = 1; }                  // hold
        else { breathNorm = 1 - (cyclePos - 8) / 6; }              // exhale
        const breathRingR = orbR * 2.2 + breathNorm * (orbR * 2.6 - orbR * 2.2);
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, breathRingR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(112,72,232,0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // orb body
      const body = ctx.createRadialGradient(cx - orbR * 0.15, cy - orbR * 0.15, 0, cx, cy, orbR);
      body.addColorStop(0,    'hsl(270,45%,94%)');
      body.addColorStop(0.3,  'hsl(268,52%,84%)');
      body.addColorStop(0.65, 'hsl(265,62%,70%)');
      body.addColorStop(0.85, 'hsl(262,72%,60%)');
      body.addColorStop(1,    'hsl(258,78%,52%)');
      ctx.beginPath(); ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = body; ctx.fill();

      // inner energy pulse
      const pulseR = orbR * (0.35 + 0.08 * Math.sin(t * 3.2));
      const pulse = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
      pulse.addColorStop(0, `rgba(220,200,255,${0.5 + 0.2 * Math.sin(t * 2.5)})`);
      pulse.addColorStop(1, 'rgba(180,140,255,0)');
      ctx.beginPath(); ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = pulse; ctx.fill();

      // specular
      const hi = ctx.createRadialGradient(cx - orbR * 0.3, cy - orbR * 0.35, 0, cx - orbR * 0.3, cy - orbR * 0.35, orbR * 0.52);
      hi.addColorStop(0, 'rgba(255,255,255,0.55)');
      hi.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = hi; ctx.fill();

      // plasma inner glow (two counter-rotating radial gradients)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.3);
      const plasma1 = ctx.createRadialGradient(-orbR * 0.2, -orbR * 0.2, 0, 0, 0, orbR * 0.85);
      plasma1.addColorStop(0, `rgba(140,80,255,0.22)`);
      plasma1.addColorStop(0.5, `rgba(112,72,232,0.18)`);
      plasma1.addColorStop(1, 'rgba(112,72,232,0)');
      ctx.beginPath(); ctx.arc(0, 0, orbR, 0, Math.PI * 2);
      ctx.fillStyle = plasma1; ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-t * 0.22);
      const plasma2 = ctx.createRadialGradient(orbR * 0.25, orbR * 0.1, 0, 0, 0, orbR * 0.85);
      plasma2.addColorStop(0, `rgba(0,210,180,0.18)`);
      plasma2.addColorStop(0.4, `rgba(240,160,40,0.12)`);
      plasma2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(0, 0, orbR, 0, Math.PI * 2);
      ctx.fillStyle = plasma2; ctx.fill();
      ctx.restore();

      // mouse parallax highlight
      const { x: mx, y: my } = mouseRef.current;
      const dx = (mx - cx) / S, dy = (my - cy) / S;
      const mHi = ctx.createRadialGradient(cx + dx * 20, cy + dy * 20, 0, cx + dx * 20, cy + dy * 20, orbR * 0.6);
      mHi.addColorStop(0, `rgba(255,255,255,${0.08 + Math.abs(dx + dy) * 0.06})`);
      mHi.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = mHi; ctx.fill();

      // corona particles (3 layers, different speeds)
      particles.forEach(p => {
        const speedMult = [1, 0.6, 1.5][p.layer];
        p.angle += p.speed * speedMult;
        const wobble = Math.sin(t * 1.8 + p.phase) * S * 0.028;
        const px = cx + Math.cos(p.angle) * (p.r + wobble);
        const py = cy + Math.sin(p.angle) * (p.r + wobble);
        const alpha = (0.2 + 0.25 * Math.sin(t * 2.2 + p.phase)) * [0.9, 0.6, 1.1][p.layer];
        const grd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.2);
        grd.addColorStop(0, `hsla(${p.hue},75%,72%,${Math.min(alpha, 1)})`);
        grd.addColorStop(1, `hsla(${p.hue},75%,72%,0)`);
        ctx.beginPath(); ctx.arc(px, py, p.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
      });

      // floating debris
      debris.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = S; if (d.x > S) d.x = 0;
        if (d.y < 0) d.y = S; if (d.y > S) d.y = 0;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${d.hue},60%,70%,${d.alpha * (0.5 + 0.5 * Math.sin(t + d.r))})`;
        ctx.fill();
      });

      // Sanskrit centre
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `500 ${Math.round(S * 0.045)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = `rgba(90,50,180,${0.3 + 0.15 * Math.sin(t * 0.4)})`;
      ctx.fillText('अनाहत', cx, cy);
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onMove as EventListener);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      borderRadius: '50%', display: 'block',
      opacity: entered ? 1 : 0,
      transform: entered ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(40px)',
      transition: 'opacity 1.4s ease, transform 1.6s cubic-bezier(0.34,1.56,0.64,1)',
      filter: 'drop-shadow(0 20px 60px rgba(112,72,232,0.35)) drop-shadow(0 4px 20px rgba(112,72,232,0.25))',
      cursor: 'crosshair',
    }} />
  );
}

// ── Reveal wrapper ──
function Reveal({ children, delay = 0, y = 32 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity 0.8s ease ${delay}s, transform 0.9s cubic-bezier(0.34,1.56,0.64,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ── Floating orb decoration ──
function FloatOrb({ orbId, size, top, left, right, delay = 0 }: { orbId: Parameters<typeof AnahataOrb>[0]['id']; size: number; top?: string | number; left?: string | number; right?: string | number; delay?: number }) {
  return (
    <div style={{
      position: 'absolute', top, left, right,
      opacity: 0.18, pointerEvents: 'none',
      animation: `floatOrb${Math.round(delay * 10)} 6s ease-in-out ${delay}s infinite`,
    }}>
      <AnahataOrb id={orbId} size={size} />
    </div>
  );
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [entered, setEntered]   = useState(false);
  const [scrollY, setScrollY]   = useState(0);
  const [heartbeat, setHeartbeat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTimeout(() => setEntered(true), 120); }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // heartbeat pulse
  useEffect(() => {
    const id = setInterval(() => { setHeartbeat(true); setTimeout(() => setHeartbeat(false), 180); }, 900);
    return () => clearInterval(id);
  }, []);

  // Anahata sound on landing load
  useEffect(() => {
    const playAnahataSound = () => {
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const audioCtx = new AudioContextCtor();

      const master = audioCtx.createGain();
      master.connect(audioCtx.destination);
      master.gain.setValueAtTime(0.0, audioCtx.currentTime);
      master.gain.linearRampToValueAtTime(0.55, audioCtx.currentTime + 1.2);
      master.gain.setValueAtTime(0.55, audioCtx.currentTime + 1.2 + 0.8);
      master.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2 + 0.8 + 2.5);

      const oscDefs: { freq: number; gain: number }[] = [
        { freq: 528, gain: 0.35 },
        { freq: 1056, gain: 0.12 },
        { freq: 264, gain: 0.08 },
      ];

      oscDefs.forEach(({ freq, gain }) => {
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        oscGain.gain.value = gain;
        osc.connect(oscGain);
        oscGain.connect(master);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 4.5);
      });

      setTimeout(() => { audioCtx.close(); }, 5000);
    };

    const timer = setTimeout(() => {
      try {
        playAnahataSound();
      } catch {
        const onFirstClick = () => {
          playAnahataSound();
          document.removeEventListener('click', onFirstClick);
        };
        document.addEventListener('click', onFirstClick, { once: true });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const heroOpacity  = Math.max(0, 1 - scrollY / 320);
  const heroParallax = scrollY * 0.35;

  const btnRef = useRef<HTMLButtonElement>(null);
  const handleEnterHover = useCallback((e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
    e.currentTarget.style.transform = enter ? 'scale(1.05) translateY(-2px)' : 'scale(1) translateY(0)';
    e.currentTarget.style.boxShadow = enter
      ? '0 16px 48px rgba(112,72,232,0.5), 0 4px 16px rgba(112,72,232,0.3)'
      : '0 8px 32px rgba(112,72,232,0.35), 0 2px 8px rgba(112,72,232,0.2)';
  }, []);

  return (
    <div ref={scrollRef} style={{
      position: 'fixed', inset: 0,
      overflowY: 'auto', overflowX: 'hidden',
      background: '#F7F4EE',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      color: '#17120A',
      WebkitOverflowScrolling: 'touch',
      zIndex: 100,
    }}>

      {/* ════ HERO ════ */}
      <section style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px 80px', position: 'relative', textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Parallax ambient blobs */}
        <div style={{
          position: 'absolute', top: `${-10 - heroParallax * 0.3}%`, left: '50%',
          transform: 'translateX(-50%)',
          width: 560, height: 560, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(112,72,232,0.09) 0%, transparent 65%)',
          pointerEvents: 'none', transition: 'top 0.1s linear',
        }} />
        <div style={{
          position: 'absolute', bottom: `${5 + heroParallax * 0.15}%`, right: '-15%',
          width: 340, height: 340, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(59,91,219,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '20%', left: '-8%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(12,166,120,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Floating bg orbs */}
        <FloatOrb orbId="bw-theta"      size={40} top="12%"  left="8%"   delay={0} />
        <FloatOrb orbId="el-ether"      size={32} top="18%"  right="6%"  delay={1.2} />
        <FloatOrb orbId="mood-blissful" size={28} top="70%"  left="5%"   delay={2.4} />
        <FloatOrb orbId="int-sleep"     size={36} top="72%"  right="7%"  delay={0.7} />
        <FloatOrb orbId="bw-alpha"      size={24} top="42%"  left="2%"   delay={3.1} />

        {/* Logo */}
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12, fontWeight: 700, letterSpacing: '0.28em',
          color: '#3B5BDB', textTransform: 'uppercase', marginBottom: 40,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(-16px)',
          transition: 'all 0.9s ease 0.1s',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#7048E8',
            boxShadow: '0 0 10px rgba(112,72,232,0.7)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          ANAHATA
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#3B5BDB',
            boxShadow: '0 0 10px rgba(59,91,219,0.7)',
            animation: 'pulse 2s ease-in-out 0.5s infinite',
          }} />
        </div>

        {/* Orb */}
        <div style={{
          marginBottom: 36,
          transform: `translateY(${-heroParallax * 0.08}px)`,
          transition: 'transform 0.05s linear',
        }}>
          <OrbHero entered={entered} />
        </div>

        {/* Tagline with typewriter */}
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(28px, 7vw, 44px)',
          fontWeight: 700, lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: '#17120A', margin: '0 0 8px',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.9s ease 0.45s',
        }}>
          Sound is
        </h1>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(28px, 7vw, 44px)',
          fontWeight: 700, lineHeight: 1.1,
          letterSpacing: '-0.03em',
          margin: '0 0 20px', minHeight: '1.2em',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.9s ease 0.55s',
        }}>
          {entered && <Typewriter words={['Medicine.', 'Ancient.', 'Alive.', 'Yours.']} />}
        </h1>

        <p style={{
          fontSize: 14, color: '#8C7D6C', lineHeight: 1.7,
          maxWidth: 300, margin: '0 0 36px',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.9s ease 0.65s',
        }}>
          Ancient Indian raga wisdom fused with modern neuroscience.
          Your heart rate shapes every note.
        </p>

        <button
          ref={btnRef}
          onClick={onEnter}
          onMouseEnter={e => handleEnterHover(e, true)}
          onMouseLeave={e => handleEnterHover(e, false)}
          style={{
            padding: '16px 44px', borderRadius: 9999, border: 'none',
            background: 'linear-gradient(135deg, #7048E8 0%, #3B5BDB 100%)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '0.03em', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(112,72,232,0.35), 0 2px 8px rgba(112,72,232,0.2)',
            opacity: entered ? 1 : 0,
            transform: entered ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(20px)',
            transition: 'opacity 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.8s, transform 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.8s, box-shadow 0.2s ease',
          }}
        >
          Begin Your Journey →
        </button>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          fontSize: 10, letterSpacing: '0.16em', color: '#C2B5A3',
          opacity: heroOpacity * (entered ? 1 : 0),
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          pointerEvents: 'none',
        }}>
          <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, transparent, #C2B5A3)', marginBottom: 4 }} />
          <span>SCROLL</span>
        </div>
      </section>

      {/* ════ WHAT IS ANAHATA ════ */}
      <section style={{ padding: '80px 24px', background: '#FFFFFF', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-30%', right: '-10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(112,72,232,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 9999,
              background: 'rgba(112,72,232,0.08)', color: '#7048E8',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              marginBottom: 24,
            }}>The Name</div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 64, fontWeight: 700, color: '#7048E8',
              letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6,
              textShadow: '0 4px 32px rgba(112,72,232,0.18)',
            }}>अनाहत</div>
          </Reveal>
          <Reveal delay={0.2}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20, fontWeight: 600, color: '#17120A',
              letterSpacing: '0.06em', marginBottom: 24,
            }}>Anahata · The Unstruck Sound</div>
          </Reveal>
          <Reveal delay={0.3}>
            <p style={{ fontSize: 15, color: '#4A3F32', lineHeight: 1.8, marginBottom: 28 }}>
              In Sanskrit, <em>Anahata</em> means <strong style={{ color: '#17120A' }}>"unstruck"</strong> — the sound that exists without being struck.
              The fourth chakra. The heart centre. The frequency of pure unconditional love that hums beneath all existence.
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <div style={{
              padding: '22px 24px', background: 'rgba(112,72,232,0.04)',
              borderRadius: 18, border: '1px solid rgba(112,72,232,0.1)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                background: '#FFFFFF', padding: '0 8px',
              }}>
                <AnahataOrb id="mood-blissful" size={28} />
              </div>
              <p style={{ fontSize: 14, color: '#8C7D6C', lineHeight: 1.75, margin: 0, fontStyle: 'italic' }}>
                "The unstruck sound — that is what we are made of.<br />
                Before the first breath, after the last — it remains."
              </p>
              <p style={{ fontSize: 11, color: '#C2B5A3', marginTop: 10, marginBottom: 0 }}>— Upanishads</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════ STATS ════ */}
      <section style={{ padding: '64px 24px', background: '#F7F4EE' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 400, margin: '0 auto' }}>
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div style={{
                background: '#FFFFFF', borderRadius: 22, padding: '22px 16px',
                textAlign: 'center',
                border: '1px solid rgba(23,18,10,0.07)',
                boxShadow: '0 2px 16px rgba(23,18,10,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(23,18,10,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(23,18,10,0.06)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <AnahataOrb id={s.orbId} size={32} />
                </div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 34, fontWeight: 700, color: '#7048E8', lineHeight: 1,
                }}>
                  {s.value > 0 ? <Counter target={s.value} /> : '∞'}
                </div>
                <div style={{ fontSize: 11, color: '#8C7D6C', marginTop: 5, fontWeight: 600, letterSpacing: '0.05em', lineHeight: 1.3 }}>
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════ THREE PILLARS ════ */}
      <section style={{ padding: '80px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 9999,
                background: 'rgba(59,91,219,0.08)', color: '#3B5BDB',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                marginBottom: 14,
              }}>How It Works</div>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 28, fontWeight: 700, color: '#17120A',
                letterSpacing: '-0.02em', margin: 0,
              }}>Three pillars.<br />One experience.</h2>
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PILLARS.map((p, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div style={{
                  background: '#F7F4EE', borderRadius: 22, padding: '26px 22px 22px 26px',
                  border: '1px solid rgba(23,18,10,0.07)',
                  position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(23,18,10,0.09)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
                    background: `linear-gradient(to bottom, ${p.color}, ${p.color}88)`,
                    borderRadius: '4px 0 0 4px',
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <AnahataOrb id={p.orbId} size={36} />
                    <h3 style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 16, fontWeight: 700, color: '#17120A',
                      margin: 0, letterSpacing: '-0.01em',
                    }}>{p.title}</h3>
                  </div>
                  <p style={{ fontSize: 13, color: '#4A3F32', lineHeight: 1.72, margin: 0 }}>{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════ DIFFERENCE ════ */}
      <section style={{ padding: '80px 24px', background: '#F7F4EE' }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 9999,
                background: 'rgba(12,166,120,0.08)', color: '#0CA678',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                marginBottom: 14,
              }}>The Difference</div>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 28, fontWeight: 700, color: '#17120A',
                letterSpacing: '-0.02em', margin: 0,
              }}>Not just another<br />meditation app.</h2>
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DIFFERENCES.map((d, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{
                  background: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
                  border: '1px solid rgba(23,18,10,0.07)',
                  boxShadow: '0 2px 8px rgba(23,18,10,0.05)',
                  transition: 'transform 0.2s ease',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.015)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'}
                >
                  <div style={{
                    padding: '11px 16px', background: 'rgba(194,181,163,0.08)',
                    borderBottom: '1px solid rgba(23,18,10,0.05)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 9, color: '#C2B5A3', fontWeight: 700, letterSpacing: '0.12em', flexShrink: 0 }}>OTHERS</span>
                    <span style={{ fontSize: 12, color: '#8C7D6C' }}>{d.them}</span>
                  </div>
                  <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, color: '#7048E8', fontWeight: 700, letterSpacing: '0.12em', flexShrink: 0 }}>US</span>
                    <span style={{ fontSize: 12, color: '#17120A', fontWeight: 500 }}>{d.us}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════ BELIEF (DARK) ════ */}
      <section style={{
        padding: '88px 24px',
        background: 'linear-gradient(160deg, #1A1040 0%, #0D0620 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* animated bg glow */}
        <div style={{
          position: 'absolute', top: '-20%', left: '20%',
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(112,72,232,0.22) 0%, transparent 65%)',
          pointerEvents: 'none', animation: 'slowDrift 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '5%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,91,219,0.18) 0%, transparent 65%)',
          pointerEvents: 'none', animation: 'slowDrift 9s ease-in-out 3s infinite reverse',
        }} />

        <div style={{ maxWidth: 360, margin: '0 auto', position: 'relative' }}>
          {/* heartbeat orb */}
          <Reveal>
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 32,
              transform: heartbeat ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.18s cubic-bezier(0.34,1.8,0.64,1)',
            }}>
              <AnahataOrb id="int-heal" size={56} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 48, color: 'rgba(255,255,255,0.06)',
              fontWeight: 900, marginBottom: -16, letterSpacing: '-0.04em',
            }}>❝</div>
            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20, fontWeight: 600, color: '#FFFFFF',
              lineHeight: 1.5, letterSpacing: '-0.01em', margin: '0 0 20px',
            }}>
              We believe every human being deserves access to the healing that{' '}
              <span style={{ color: '#C4B0F4' }}>sound has always known how to give.</span>
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.75, margin: '0 0 36px' }}>
              Anahata was built for the person who has tried everything — the apps, the playlists, the guided voices — and felt something was still missing.
              What was missing was <em style={{ color: 'rgba(255,255,255,0.65)' }}>you</em>. Your biology. Your rhythm. Your frequency.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {AUDIENCE.map((tag, i) => (
                <span key={tag} style={{
                  padding: '6px 14px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600,
                  animation: `tagFloat 4s ease-in-out ${i * 0.3}s infinite`,
                }}>{tag}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section style={{ padding: '80px 24px 64px', background: '#F7F4EE', textAlign: 'center' }}>
        <div style={{ maxWidth: 340, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 24,
              animation: 'floatY 4s ease-in-out infinite',
            }}>
              <AnahataOrb id="mood-blissful" size={64} />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 30, fontWeight: 700, color: '#17120A',
              letterSpacing: '-0.02em', margin: '0 0 12px',
            }}>Ready to hear yourself?</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p style={{ fontSize: 14, color: '#8C7D6C', lineHeight: 1.7, margin: '0 0 32px' }}>
              No subscription. No login required to start.<br />
              Just you, your breath, and the unstruck sound.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <button
              onClick={onEnter}
              style={{
                width: '100%', padding: '18px 40px',
                borderRadius: 9999, border: 'none',
                background: 'linear-gradient(135deg, #7048E8 0%, #3B5BDB 100%)',
                color: '#fff', fontSize: 16, fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.02em', cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(112,72,232,0.35)',
                marginBottom: 14,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.02)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 16px 48px rgba(112,72,232,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(112,72,232,0.35)'; }}
            >
              Enter Anahata →
            </button>
            <p style={{ fontSize: 11, color: '#C2B5A3', margin: 0 }}>Free forever · No account needed to begin</p>
          </Reveal>
        </div>
      </section>

      <style>{`
        @keyframes pulse      { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.6} }
        @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes floatY     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes slowDrift  { 0%,100%{transform:translate(0,0)} 33%{transform:translate(20px,-15px)} 66%{transform:translate(-15px,10px)} }
        @keyframes tagFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes floatOrb0  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(8deg)} }
        @keyframes floatOrb12 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(-6deg)} }
        @keyframes floatOrb24 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(10deg)} }
        @keyframes floatOrb7  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(-8deg)} }
        @keyframes floatOrb31 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(5deg)} }
      `}</style>
    </div>
  );
}
