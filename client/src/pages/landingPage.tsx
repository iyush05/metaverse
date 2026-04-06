import { useEffect, useRef, useState } from 'react';
import '../components/Landing/Landing.css';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

function DiamondDivider() {
  return (
    <div className="diamond-divider">
      <div className="line" />
      <div className="diamond" />
      <div className="line" />
    </div>
  )
}

function GeometricCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  return <div className={`geo-corner geo-corner--${pos}`} aria-hidden="true" />
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  
  const [createName, setCreateName] = useState("")
  const [joinName, setJoinName] = useState("")
  const [roomIdInput, setRoomIdInput] = useState("")
  const heroSection = useInView(0.1)
  const aboutSection = useInView(0.15)
  const servicesSection = useInView(0.1)
  const gallerySection = useInView(0.1)
  const ctaSection = useInView(0.2)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const id = crypto.randomUUID().slice(0, 8);
    const params = new URLSearchParams();
    if (createName.trim()) params.append("name", createName.trim());
    const query = params.toString() ? `?${params.toString()}` : '';
    window.location.href = `/playground/${id}${query}`;
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;
    const params = new URLSearchParams();
    if (joinName.trim()) params.append("name", joinName.trim());
    const query = params.toString() ? `?${params.toString()}` : '';
    window.location.href = `/playground/${roomIdInput.trim()}${query}`;
  };

  return (
    <div className="page">
      <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
        <div className="nav__inner">
          <div className="nav__logo">
            <span className="nav__logo-text">METAVERSE</span>
          </div>
          <button className={`nav__hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <ul className={`nav__links${menuOpen ? ' nav__links--open' : ''}`}>
            {['World', 'Features', 'Highlights', 'Join'].map(l => (
              <li key={l}><a href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{l}</a></li>
            ))}
          </ul>
        </div>
      </nav>

      <section className="hero" id="world" ref={heroSection.ref}>
        <div className="hero__bg-pattern" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="fan" style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
        <div className={`hero__content${heroSection.inView ? ' animate-in' : ''}`}>
          <p className="hero__eyebrow">Real-Time · 2D WebGL</p>
          <div className="hero__title-wrap">
            <h1 className="hero__title">
              <span className="hero__title-line">Step Into</span>
              <span className="hero__title-line hero__title-line--italic">the Pixel</span>
              <span className="hero__title-line">Dimension</span>
            </h1>
          </div>
          <DiamondDivider />
          <p className="hero__sub">
            A living virtual world built for spontaneous connection.<br />Wander the pixel landscape, gather around, and let the stories unfold.
          </p>
          <div className="hero__ctas">
            <a href="/playground/room-1" onClick={(e) => {
              e.preventDefault();
              const randomName = `Hero_${Math.floor(Math.random() * 10000)}`;
              window.location.href = `/playground/room-1?name=${randomName}`;
            }} className="btn btn--primary">Enter Playground</a>
            <a href="#join" className="btn btn--ghost">Join Session</a>
          </div>
        </div>
        <div className="hero__scroll-hint" aria-hidden="true">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
        <GeometricCorner pos="tl" />
        <GeometricCorner pos="tr" />
        <GeometricCorner pos="bl" />
        <GeometricCorner pos="br" />
      </section>

      <section className="about" id="about" ref={aboutSection.ref}>
        <div className={`about__inner${aboutSection.inView ? ' animate-in' : ''}`}>
          <div className="about__text">
            <span className="section-label">Vision</span>
            <h2 className="section-title">Where Connections<br /><em>Come Alive</em></h2>
            <p className="body-text">
              We inhabit the space between highly scalable network code and tactile visual beauty — where every pixel frame carries intention, and every websocket packet whispers of grand connectivity. Our 2D metaverse engine transforms browsers into thriving digital hubs.
            </p>
            <p className="body-text">
              Each room is automatically synchronized using React, PixiJS, and Socket.io. Jump in instantly, form circles, communicate locally, and explore dynamic collisions over a curated grid.
            </p>
            <a href="#features" className="link-arrow">Discover the Engine →</a>
          </div>
          <div className="about__ornament" aria-hidden="true">
            <svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="50" y="50" width="200" height="300" stroke="#C9A84C" strokeWidth="1" opacity="0.4"/>
              <rect x="70" y="70" width="160" height="260" stroke="#C9A84C" strokeWidth="0.5" opacity="0.3"/>
              <polygon points="150,30 270,200 150,370 30,200" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
              <circle cx="150" cy="200" r="60" stroke="#C9A84C" strokeWidth="1" opacity="0.4"/>
              <circle cx="150" cy="200" r="40" stroke="#C9A84C" strokeWidth="0.5" opacity="0.3"/>
              <line x1="150" y1="30" x2="150" y2="370" stroke="#C9A84C" strokeWidth="0.5" opacity="0.2"/>
              <line x1="30" y1="200" x2="270" y2="200" stroke="#C9A84C" strokeWidth="0.5" opacity="0.2"/>
              <polygon points="150,140 210,200 150,260 90,200" fill="#C9A84C" opacity="0.08"/>
            </svg>
          </div>
        </div>
      </section>

      <section className="services" id="features" ref={servicesSection.ref}>
        <div className={`services__inner${servicesSection.inView ? ' animate-in' : ''}`}>
          <div className="services__header">
            <span className="section-label centered-label">Core Tech</span>
            <h2 className="section-title centered">Engine<br /><em>Features</em></h2>
          </div>
          <div className="services__grid">
            {[
              { num: 'I', title: 'Proximity Chat', desc: 'Conversations happen organically. Walk up to a cluster of players to seamlessly merge and instantiate local contextual communication graphs.' },
              { num: 'II', title: 'Video Conferencing', desc: 'Face-to-face spatial video streams. Approach other players to instantly open robust WebRTC video and audio channels securely.' },
              { num: 'III', title: 'Real-Time Sync', desc: 'Silky-smooth pixel movement rendering at optimal frame rates, maintaining low latency alignment across the entire active network pool.' },
              { num: 'IV', title: 'Dynamic Collisions', desc: 'Navigate over meticulously crafted tile grids loaded dynamically from map data featuring robust structural occlusion and environment bounds.' },
            ].map(s => (
              <div className="service-card" key={s.num}>
                <div className="service-card__num">{s.num}</div>
                <GeometricCorner pos="tl" />
                <GeometricCorner pos="br" />
                <h3 className="service-card__title">{s.title}</h3>
                <p className="service-card__desc">{s.desc}</p>
                <a href="#join" className="service-card__link">Join Now →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gallery" id="highlights" ref={gallerySection.ref}>
        <div className={`gallery__inner${gallerySection.inView ? ' animate-in' : ''}`}>
          <span className="section-label centered-label">World Highlights</span>
          <h2 className="section-title centered">A Glimpse into<br /><em>The Net</em></h2>
          <div className="gallery__grid">
            {[
              { label: 'Map · 2024', title: 'The Meadow Span', color: '#1a1206' },
              { label: 'Feature · 2024', title: 'Local Group Sync', color: '#0d1a12' },
              { label: 'Engine · 2024', title: 'Interpolation Frame', color: '#1a0d0d' },
              { label: 'UI · 2024', title: 'Glassmorphism', color: '#0d0d1a' },
              { label: 'Multi · 2024', title: 'Socket Hubs', color: '#1a1a0d' },
              { label: 'Data · 2024', title: 'Tilemap Collisions', color: '#0d1a1a' },
            ].map((item, i) => (
              <div className="gallery__item" key={i} style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}>
                <div className="gallery__thumb" style={{ background: item.color }}>
                  <div className="gallery__thumb-pattern">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                      <rect x="20" y="20" width="160" height="160" stroke="#C9A84C" strokeWidth="1" fill="none" opacity="0.3"/>
                      <polygon points="100,10 190,100 100,190 10,100" stroke="#C9A84C" strokeWidth="0.7" fill="none" opacity="0.4"/>
                      <circle cx="100" cy="100" r="45" stroke="#C9A84C" strokeWidth="0.7" fill="none" opacity="0.3"/>
                      <circle cx="100" cy="100" r="5" fill="#C9A84C" opacity="0.5"/>
                    </svg>
                  </div>
                  <div className="gallery__overlay">
                    <span>View Case Study →</span>
                  </div>
                </div>
                <div className="gallery__meta">
                  <span className="gallery__label">{item.label}</span>
                  <span className="gallery__title">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonial">
        <div className="testimonial__inner">
          <div className="testimonial__mark">&ldquo;</div>
          <blockquote className="testimonial__quote">
            Playing on this engine was a revelation — it encapsulates exactly what makes lightweight, web-first multiplayer games so engaging. No downloads, no barriers, just instant gratification.
          </blockquote>
          <DiamondDivider />
          <cite className="testimonial__cite">Open Source Community</cite>
        </div>
      </section>

      <section className="cta-section" id="join" ref={ctaSection.ref}>
        <div className={`cta-section__inner${ctaSection.inView ? ' animate-in' : ''}`}>
          <GeometricCorner pos="tl" />
          <GeometricCorner pos="tr" />
          <GeometricCorner pos="bl" />
          <GeometricCorner pos="br" />
          <span className="section-label centered-label">Begin</span>
          <h2 className="cta-section__title">Your Digital<br /><em>Presence Awaits</em></h2>
          <p className="cta-section__sub">
            The playground is open and actively receiving socket connections.<br />Invite your friends and start exploring.
          </p>
          <div className="cta-forms-container">
            <form className="cta-form" onSubmit={handleCreate}>
              <h3 className="cta-form__title">Create New Room</h3>
              <div className="cta-form__field">
                <label htmlFor="create-name">Hero Name</label>
                <input id="create-name" type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Anonymous" />
              </div>
              <button type="submit" className="btn btn--primary btn--full" style={{ marginTop: 'auto' }}>Generate & Enter</button>
            </form>

            <form className="cta-form" onSubmit={handleJoin}>
              <h3 className="cta-form__title">Join Existing Room</h3>
              <div className="cta-form__field">
                <label htmlFor="join-name">Hero Name</label>
                <input id="join-name" type="text" value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Anonymous" />
              </div>
              <div className="cta-form__field">
                <label htmlFor="join-room">Room ID</label>
                <input id="join-room" type="text" value={roomIdInput} onChange={e => setRoomIdInput(e.target.value)} placeholder="e.g. 1a2b3c4d" required />
              </div>
              <button type="submit" className="btn btn--ghost btn--full">Join Session</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__logo">METAVERSE</div>
          <DiamondDivider />
          <p className="footer__tagline">Open Source WebGL Sandbox</p>
          <div className="footer__links">
            {[
              { label: 'GitHub', href: 'https://github.com/iyush05/metaverse' },
              { label: 'Email Me', href: 'mailto:ayushkannaujiya@gmail.com' },
              { label: 'Twitter', href: 'https://x.com/iyush05' }
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
            ))}
          </div>
          <p className="footer__copy">© 2026 Metaverse Playground. MIT Licensed.</p>
        </div>
      </footer>
    </div>
  )
}
