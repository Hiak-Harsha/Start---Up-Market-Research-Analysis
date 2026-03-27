import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import styles from './HomePage.module.css'

const FEATURES = [
  { icon: '◈', color: 'violet', title: 'Autonomous AI Research', desc: 'Our agent searches across 20+ sources simultaneously, validates findings, and structures insights into actionable intelligence.' },
  { icon: '◈', color: 'green', title: 'Real-Time Web Search', desc: 'Powered by Tavily\'s advanced search API — live market data, fresh competitor intel, and current pricing models.' },
  { icon: '◈', color: 'amber', title: 'Competitor Intelligence', desc: 'Deep analysis of your competitive landscape: pricing, weaknesses, market positioning, and exploitable gaps.' },
  { icon: '◈', color: 'blue', title: 'Investor Signals', desc: 'Track VC activity, recent funding rounds, and sentiment scores to understand where smart money is flowing.' },
  { icon: '◈', color: 'coral', title: 'Customer Profile Builder', desc: 'Understand your ideal buyer\'s budget, decision process, pain hierarchy, and preferred acquisition channels.' },
  { icon: '◈', color: 'mint', title: 'Follow-Up AI Chat', desc: 'Ask unlimited follow-up questions. The AI has full context of your report and answers like a seasoned analyst.' },
]

const STEPS = [
  { num: '01', label: 'Describe your idea', desc: 'Tell us your product concept, target region, and customer segment. Be specific for better results.' },
  { num: '02', label: 'Agent researches', desc: 'Our AI simultaneously runs 4 research tracks: market sizing, competitor mapping, pricing analysis, and pain point discovery.' },
  { num: '03', label: 'Review your report', desc: 'A live dashboard with TAM/SAM/SOM, competitor tables, charts, and a personalised go-to-market strategy.' },
]

const STATS = [
  { value: '60s', label: 'Average report time' },
  { value: '20+', label: 'Sources per report' },
  { value: '6', label: 'Report sections' },
  { value: '∞', label: 'Follow-up questions' },
]

function AnimatedCounter({ target, suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const isNum = !isNaN(parseFloat(target))
        if (!isNum) { setDisplay(target); return }
        const end = parseFloat(target)
        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setDisplay(Math.floor(ease * end).toString())
          if (p < 1) requestAnimationFrame(tick)
          else setDisplay(target)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{display}{suffix}</span>
}

export default function HomePage() {
  return (
    <div className={styles.page}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
          <div className={styles.grid} />
        </div>

        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              <span>AI-Powered Market Research</span>
            </div>

            <h1 className={styles.heroTitle}>
              Know your market
              <br />
              <em className={styles.heroEm}>before you build.</em>
            </h1>

            <p className={styles.heroSub}>
              Enter your startup idea. Our AI agent autonomously researches market size, maps competitors,
              analyses pricing, and surfaces customer pain points — delivering a report in under 60 seconds.
            </p>

            <div className={styles.heroCtas}>
              <Link to="/research" className={styles.btnPrimary}>
                Launch Research Agent
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7H11M7.5 3.5L11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link to="/dashboard" className={styles.btnSecondary}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="8" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="2" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="8" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Sample Report
              </Link>
            </div>

            <p className={styles.heroNote}>
              <span>Results in ~60 seconds</span>
              <span className={styles.dot}>·</span>
              <span>Free to use</span>
            </p>

            {/* Preview card */}
            <div className={styles.heroPreview}>
              <div className={styles.previewBar}>
                <div className={styles.previewDots}>
                  <span style={{ background: '#f87171' }} />
                  <span style={{ background: '#fbbf24' }} />
                  <span style={{ background: '#34d399' }} />
                </div>
                <span className={styles.previewTitle}>MarketLens — Dashboard</span>
              </div>
              <div className={styles.previewContent}>
                <div className={styles.previewKpis}>
                  {[
                    { l: 'TAM', v: '$4.2B', c: 'emerald' },
                    { l: 'SAM', v: '$890M', c: 'sky' },
                    { l: 'SOM', v: '$65M', c: 'violet' },
                    { l: 'Growth', v: '22% CAGR', c: 'amber' },
                  ].map(k => (
                    <div key={k.l} className={styles.previewKpi} style={{ '--kc': `var(--${k.c})` }}>
                      <span className={styles.previewKpiVal}>{k.v}</span>
                      <span className={styles.previewKpiLabel}>{k.l}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.previewBars}>
                  {[85, 70, 55, 40, 30].map((w, i) => (
                    <div key={i} className={styles.previewBarRow}>
                      <span className={styles.previewBarLabel}>Competitor {i + 1}</span>
                      <div className={styles.previewBarTrack}>
                        <div className={styles.previewBarFill} style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((s, i) => (
              <div key={i} className={styles.statItem} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className={styles.statValue}>
                  <AnimatedCounter target={s.value} duration={1000 + i * 200} />
                </span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.steps}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="tag tag-purple">How it works</span>
            <h2 className={styles.sectionTitle}>From idea to insights in three steps</h2>
            <p className={styles.sectionSub}>No forms to fill, no analyst to hire. Just describe your idea and let the agent work.</p>
          </div>
          <div className={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <div key={i} className={styles.stepCard} style={{ animationDelay: `${i * 0.12}s` }}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNum}>{s.num}</span>
                  {i < STEPS.length - 1 && (
                    <div className={styles.stepConnector}>
                      <div className={styles.stepConnectorLine} />
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.stepArrowIcon}>
                        <path d="M3 8H13M9 4L13 8L9 12" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className={styles.stepLabel}>{s.label}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="tag tag-amber">Everything included</span>
            <h2 className={styles.sectionTitle}>Every dimension of your market</h2>
            <p className={styles.sectionSub}>Six research tracks, synthesised into one actionable report.</p>
          </div>
          <div className={styles.featGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={styles.featCard} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={`${styles.featIcon} tag-${f.color}`}>{f.icon}</div>
                <h3 className={styles.featTitle}>{f.title}</h3>
                <p className={styles.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaInner}>
            <div className={styles.ctaBg} />
            <div className={styles.ctaContent}>
              <span className="tag tag-green" style={{ marginBottom: 20 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse-dot 1.2s ease infinite' }} />
                Agent Ready
              </span>
              <h2 className={styles.ctaTitle}>
                Your market is waiting.<br />
                <em className={styles.ctaEm}>Research it now.</em>
              </h2>
              <p className={styles.ctaSub}>
                Join thousands of founders who've stopped guessing and started building with data.
              </p>
              <Link to="/research" className={styles.btnPrimary} style={{ marginTop: 8 }}>
                Start Free Research →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}