import React, { useEffect, useRef, useState } from 'react';

interface LandingPageProps { onEnter: () => void; }

const PILLARS = [
  {
    icon: '◎',
    title: 'Ancient Raga Science',
    body: 'Every track is rooted in a classical Indian raga — melodic frameworks refined over 3,000 years to move specific emotions. Bhairavi for dawn peace. Yaman for evening calm. Darbari for deep night.',
    color: '#7048E8',
  },
  {
    icon: '∿',
    title: 'Binaural Entrainment',
    body: 'Two slightly different tones — one in each ear — create a third phantom frequency inside your brain. Delta for deep sleep. Theta for lucid dreaming. Alpha for effortless focus.',
    color: '#3B5BDB',
  },
  {
    icon: '♡',
    title: 'Adaptive to You',
    body: 'Connect your heart rate monitor and the music breathes with you. Tempo, harmonic density, and layering shift in real time — no two sessions are ever the same.',
    color: '#0CA678',
  },
];

const STATS = [
  { value: '11', label: 'Curated Journeys' },
  { value: '432', label: 'Hz Foundation Tuning' },
  { value: '3000', label: 'Years of Raga Wisdom' },
  { value: '∞', label: 'Adaptive Permutations' },
];

const DIFFERENCES = [
  {
    them: 'Generic lo-fi or nature sounds',
    us: 'Live-generated raga melodies tuned to your brainwave state',
  },
  {
    them: 'Fixed 10-minute guided tracks',
    us: '15–32 minute immersive journeys that adapt to your heart rate',
  },
  {
    them: 'One-size-fits-all playlists',
    us: 'Choose your intention — Sleep, Focus, Heal, Dream — and the whole soundscape shifts',
  },
  {
    them: 'Passive listening',
    us: 'Your biology drives the music. You are the instrument.',
  },
];

function OrbHero({ entered }: { entered: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    canvas.style.width = `${S}px`;
    canvas.style.height = `${S}px`;
    ctx.scale(dpr, dpr);
    const cx = S / 2, cy = S / 2;

    const particles = Array.from({ length: 80 }, (_, i) => ({
      angle: (i / 80) * Math.PI * 2,
      r: S * 0.3 + Math.random() * S * 0.15,
      speed: 0.003 + Math.random() * 0.006,
      size: 1.5 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      hue: 260 + (Math.random() - 0.5) * 40,
    }));

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      tRef.current += 0.01;
      const t = tRef.current;
      ctx.clearRect(0, 0, S, S);

      const breathScale = 1 + 0.05 * Math.sin(t * 0.7);
      const orbR = S * 0.26 * breathScale;

      // Ambient outer glow
      for (let i = 4; i >= 1; i--) {
        const gr = orbR * (1 + i * 0.6);
        const grd = ctx.createRadialGradient(cx, cy, orbR * 0.5, cx, cy, gr);
        grd.addColorStop(0, `rgba(112,72,232,${0.06 / i})`);
        grd.addColorStop(1, 'rgba(112,72,232,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, gr, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Orb body — conic-like gradient via multiple stops
      const body = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR);
      body.addColorStop(0,    'hsl(270,40%,92%)');
      body.addColorStop(0.4,  'hsl(270,50%,82%)');
      body.addColorStop(0.78, 'hsl(270,65%,68%)');
      body.addColorStop(1,    'hsl(270,75%,60%)');
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();

      // Specular
      const hiGrd = ctx.createRadialGradient(
        cx - orbR * 0.3, cy - orbR * 0.35, 0,
        cx - orbR * 0.3, cy - orbR * 0.35, orbR * 0.5
      );
      hiGrd.addColorStop(0, 'rgba(255,255,255,0.5)');
      hiGrd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = hiGrd;
      ctx.fill();

      // Dashed orbit ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, orbR * 1.22, 0, Math.PI * 2);
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = 'rgba(112,72,232,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Corona particles
      particles.forEach(p => {
        p.angle += p.speed;
        const wobble = Math.sin(t * 1.6 + p.phase) * S * 0.025;
        const px = cx + Math.cos(p.angle) * (p.r + wobble);
        const py = cy + Math.sin(p.angle) * (p.r + wobble);
        const alpha = 0.25 + 0.2 * Math.sin(t * 2 + p.phase);
        const grd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.5);
        grd.addColorStop(0, `hsla(${p.hue},70%,72%,${alpha})`);
        grd.addColorStop(1, `hsla(${p.hue},70%,72%,0)`);
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // Centre text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `500 13px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = 'rgba(70,40,160,0.5)';
      ctx.fillText('अनाहत', cx, cy);
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: '50%',
        display: 'block',
        opacity: entered ? 1 : 0,
        transform: entered ? 'scale(1)' : 'scale(0.85)',
        transition: 'opacity 1.2s ease, transform 1.4s cubic-bezier(0.34,1.56,0.64,1)',
        filter: 'drop-shadow(0 16px 48px rgba(112,72,232,0.18))',
      }}
    />
  );
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [entered, setEntered] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setEntered(true), 100);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 300);

  return (
    <div
      ref={scrollRef}
      style={{
        position: 'fixed', inset: 0,
        overflowY: 'auto', overflowX: 'hidden',
        background: '#F7F4EE',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: '#17120A',
        WebkitOverflowScrolling: 'touch',
        zIndex: 100,
      }}
    >

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px 80px',
        position: 'relative', textAlign: 'center',
      }}>
        {/* Ambient blobs */}
        <div style={{
          position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(112,72,232,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(59,91,219,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13, fontWeight: 700, letterSpacing: '0.22em',
          color: '#3B5BDB', textTransform: 'uppercase',
          marginBottom: 48,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'all 0.8s ease 0.1s',
        }}>
          ANAHATA
        </div>

        {/* Orb */}
        <div style={{ marginBottom: 40 }}>
          <OrbHero entered={entered} />
        </div>

        {/* Tagline */}
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(32px, 8vw, 48px)',
          fontWeight: 700, lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: '#17120A', margin: '0 0 16px',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.9s ease 0.4s',
        }}>
          Sound is<br />
          <span style={{ color: '#7048E8' }}>Medicine.</span>
        </h1>

        <p style={{
          fontSize: 15, color: '#8C7D6C', lineHeight: 1.65,
          maxWidth: 320, margin: '0 0 40px',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.9s ease 0.55s',
        }}>
          Ancient Indian raga wisdom fused with modern neuroscience.
          Your heart rate shapes every note. No two sessions are ever the same.
        </p>

        <button
          onClick={onEnter}
          style={{
            padding: '16px 40px',
            borderRadius: 9999, border: 'none',
            background: 'linear-gradient(135deg, #7048E8, #3B5BDB)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '0.03em', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(112,72,232,0.35), 0 2px 8px rgba(112,72,232,0.2)',
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            transition: 'all 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.7s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Begin Your Journey →
        </button>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          fontSize: 10, letterSpacing: '0.15em', color: '#C2B5A3',
          opacity: heroOpacity * (entered ? 1 : 0),
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <span style={{ animation: 'bounce 2s ease-in-out infinite' }}>↓</span>
          <span>SCROLL TO EXPLORE</span>
        </div>
      </section>

      {/* ── WHAT IS ANAHATA ── */}
      <section style={{
        padding: '80px 24px',
        background: '#FFFFFF',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 14px', borderRadius: 9999,
            background: 'rgba(112,72,232,0.08)',
            color: '#7048E8', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            The Name
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 56, fontWeight: 700, color: '#7048E8',
            letterSpacing: '-0.02em', lineHeight: 1,
            marginBottom: 8,
          }}>
            अनाहत
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22, fontWeight: 600, color: '#17120A',
            letterSpacing: '0.08em', marginBottom: 24,
          }}>
            Anahata · अनाहत
          </div>
          <p style={{ fontSize: 15, color: '#4A3F32', lineHeight: 1.75 }}>
            In Sanskrit, <em>Anahata</em> means <strong>"unstruck"</strong> — the sound that exists
            without being struck. It is the fourth chakra, the heart centre, the frequency
            of pure unconditional love that hums beneath all existence.
          </p>
          <div style={{
            marginTop: 32, padding: '20px 24px',
            background: 'rgba(112,72,232,0.04)',
            borderRadius: 16, border: '1px solid rgba(112,72,232,0.1)',
          }}>
            <p style={{ fontSize: 13, color: '#8C7D6C', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
              "The unstruck sound — that is what we are made of.<br />
              Before the first breath, after the last — it remains."
            </p>
            <p style={{ fontSize: 11, color: '#C2B5A3', marginTop: 10, marginBottom: 0 }}>
              — Upanishads
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{
        padding: '60px 24px',
        background: '#F7F4EE',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 12, maxWidth: 400, margin: '0 auto',
        }}>
          {STATS.map(s => (
            <div key={s.label} style={{
              background: '#FFFFFF',
              borderRadius: 20, padding: '24px 20px',
              textAlign: 'center',
              border: '1px solid rgba(23,18,10,0.07)',
              boxShadow: '0 2px 12px rgba(23,18,10,0.06)',
            }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 36, fontWeight: 700,
                color: '#7048E8', lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#8C7D6C', marginTop: 6, fontWeight: 600, letterSpacing: '0.06em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THREE PILLARS ── */}
      <section style={{ padding: '80px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 14px', borderRadius: 9999,
              background: 'rgba(59,91,219,0.08)',
              color: '#3B5BDB', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              How It Works
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 28, fontWeight: 700,
              color: '#17120A', letterSpacing: '-0.02em',
              margin: 0,
            }}>
              Three pillars.<br />One experience.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PILLARS.map((p, i) => (
              <div key={i} style={{
                background: '#F7F4EE',
                borderRadius: 20, padding: '28px 24px',
                border: '1px solid rgba(23,18,10,0.07)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
                  background: p.color, borderRadius: '4px 0 0 4px',
                }} />
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 28, color: p.color, marginBottom: 10,
                }}>
                  {p.icon}
                </div>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 17, fontWeight: 700, color: '#17120A',
                  margin: '0 0 10px', letterSpacing: '-0.01em',
                }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: 13, color: '#4A3F32', lineHeight: 1.7, margin: 0 }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES US DIFFERENT ── */}
      <section style={{ padding: '80px 24px', background: '#F7F4EE' }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 14px', borderRadius: 9999,
              background: 'rgba(12,166,120,0.08)',
              color: '#0CA678', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              The Difference
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 28, fontWeight: 700,
              color: '#17120A', letterSpacing: '-0.02em', margin: 0,
            }}>
              Not just another<br />meditation app.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DIFFERENCES.map((d, i) => (
              <div key={i} style={{
                background: '#FFFFFF',
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(23,18,10,0.07)',
                boxShadow: '0 2px 8px rgba(23,18,10,0.05)',
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(194,181,163,0.1)',
                  borderBottom: '1px solid rgba(23,18,10,0.06)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 10, color: '#C2B5A3', fontWeight: 700, letterSpacing: '0.1em' }}>OTHERS</span>
                  <span style={{ fontSize: 12, color: '#8C7D6C' }}>{d.them}</span>
                </div>
                <div style={{
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    fontSize: 10, color: '#7048E8', fontWeight: 700,
                    letterSpacing: '0.1em', flexShrink: 0,
                  }}>US</span>
                  <span style={{ fontSize: 12, color: '#17120A', fontWeight: 500 }}>{d.us}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR BELIEF ── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(160deg, #1A1040 0%, #0F0820 100%)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow blobs on dark section */}
        <div style={{
          position: 'absolute', top: '-20%', left: '30%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(112,72,232,0.2) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '10%',
          width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,91,219,0.15) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 360, margin: '0 auto', position: 'relative' }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 52, color: 'rgba(255,255,255,0.08)',
            fontWeight: 900, marginBottom: -20,
            letterSpacing: '-0.04em',
          }}>❝</div>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22, fontWeight: 600, color: '#FFFFFF',
            lineHeight: 1.45, letterSpacing: '-0.01em',
            margin: '0 0 24px',
          }}>
            We believe every human being deserves access to the healing that
            <span style={{ color: '#C4B0F4' }}> sound has always known how to give.</span>
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
            Anahata was built for the person who has tried everything —
            the apps, the playlists, the guided voices — and felt something was still missing.
            What was missing was <em style={{ color: 'rgba(255,255,255,0.65)' }}>you</em>.
            Your biology. Your rhythm. Your frequency.
          </p>

          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap',
          }}>
            {['🧘 Meditators', '🎵 Musicians', '🧠 Biohackers', '😴 Insomniacs', '💆 Healers'].map(tag => (
              <span key={tag} style={{
                padding: '6px 14px', borderRadius: 9999,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600,
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        padding: '80px 24px 60px',
        background: '#F7F4EE',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 340, margin: '0 auto' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #C4B0F4, #8B6FED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(112,72,232,0.25)',
            fontSize: 24,
          }}>
            ♡
          </div>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28, fontWeight: 700,
            color: '#17120A', letterSpacing: '-0.02em',
            margin: '0 0 12px',
          }}>
            Ready to hear yourself?
          </h2>
          <p style={{ fontSize: 14, color: '#8C7D6C', lineHeight: 1.65, margin: '0 0 32px' }}>
            No subscription. No login required to start.
            Just you, your breath, and the unstruck sound.
          </p>
          <button
            onClick={onEnter}
            style={{
              width: '100%', padding: '18px 40px',
              borderRadius: 9999, border: 'none',
              background: 'linear-gradient(135deg, #7048E8, #3B5BDB)',
              color: '#fff', fontSize: 16, fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.02em', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(112,72,232,0.35)',
              marginBottom: 16,
            }}
          >
            Enter Anahata →
          </button>
          <p style={{ fontSize: 11, color: '#C2B5A3', margin: 0 }}>
            Free forever · No account needed to begin
          </p>
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
    </div>
  );
}
