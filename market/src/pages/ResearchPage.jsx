import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ResearchPage.module.css'
import { runMarketResearch } from '../utils/api.js'

const REGIONS = [
  'India', 'United States', 'United Kingdom', 'Southeast Asia',
  'Europe', 'Middle East', 'Africa', 'Latin America', 'Global'
]

const SEGMENTS = [
  'B2B — Small businesses (1–50 employees)',
  'B2B — Mid-market (50–500 employees)',
  'B2B — Enterprise (500+ employees)',
  'B2C — Gen Z (18–26)',
  'B2C — Millennials (27–42)',
  'B2C — Working professionals',
  'B2C — Students',
  'B2B2C — Platform/Marketplace',
]

const RESEARCH_STAGES = [
  { id: 'market', label: 'Market sizing & TAM', tag: 'green', icon: '◈', desc: 'Calculating total addressable market' },
  { id: 'competitors', label: 'Competitor landscape', tag: 'violet', icon: '◉', desc: 'Mapping competitive intelligence' },
  { id: 'pricing', label: 'Pricing models', tag: 'amber', icon: '◎', desc: 'Analysing revenue models & benchmarks' },
  { id: 'painpoints', label: 'Customer pain points', tag: 'coral', icon: '◑', desc: 'Discovering unmet needs & frustrations' },
  { id: 'synthesis', label: 'Synthesising report', tag: 'blue', icon: '◐', desc: 'Compiling insights into your report' },
]

const EXAMPLE_IDEAS = [
  'AI-powered HR onboarding tool for startups',
  'No-code analytics platform for e-commerce brands',
  'Mental health app for remote workers',
  'B2B invoice financing for SMEs',
]

// Stage timing in ms — total must leave headroom for the real API call (~30–60s)
const STAGE_DURATIONS = [9000, 9000, 8000, 8000, 4000] // 38s total

export default function ResearchPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ idea: '', region: '', segment: '' })
  const [errors, setErrors] = useState({})
  const [phase, setPhase] = useState('form') // 'form' | 'loading' | 'done'
  const [completedStages, setCompletedStages] = useState([])
  const [activeStage, setActiveStage] = useState(null)

  // Clear errors when navigating away and coming back
  useEffect(() => {
    setErrors({})
  }, [])

  function validate() {
    const e = {}
    if (!form.idea.trim() || form.idea.trim().length < 10)
      e.idea = 'Please describe your idea in at least 10 characters.'
    if (!form.region) e.region = 'Please select a target region.'
    if (!form.segment) e.segment = 'Please select a customer segment.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setPhase('loading')
    setCompletedStages([])
    setActiveStage(null)

    // Progress animation — runs in parallel with the real API call.
    // If the API resolves before all stages complete, the remaining stages
    // fast-forward so UX doesn't feel stuck.
    let apiResolved = false
    let apiReport = null
    let apiError = null

    const progressAnimation = async () => {
      for (let i = 0; i < RESEARCH_STAGES.length; i++) {
        const stage = RESEARCH_STAGES[i]
        setActiveStage(stage.id)

        const duration = STAGE_DURATIONS[i]
        const tickMs = 100
        const ticks = duration / tickMs
        for (let t = 0; t < ticks; t++) {
          // If API already resolved on later stages, fast-forward
          if (apiResolved && i >= 3) {
            break
          }
          await new Promise(r => setTimeout(r, tickMs))
        }
        setCompletedStages(prev => [...prev, stage.id])
      }
    }

    const apiCall = async () => {
      try {
        apiReport = await runMarketResearch(form.idea, form.region, form.segment)
      } catch (err) {
        apiError = err
      } finally {
        apiResolved = true
      }
    }

    await Promise.all([progressAnimation(), apiCall()])

    if (apiError) {
      setPhase('form')
      setErrors({ api: apiError.message || 'Something went wrong. Please check your backend is running and try again.' })
      return
    }

    // Save to localStorage
    const entry = {
      id: Date.now(),
      form,
      report: apiReport,
      createdAt: new Date().toISOString(),
    }
    try {
      const existing = JSON.parse(localStorage.getItem('ml_reports') || '[]')
      existing.unshift(entry)
      localStorage.setItem('ml_reports', JSON.stringify(existing.slice(0, 10)))
      localStorage.setItem('ml_latest', JSON.stringify(entry))
    } catch {
      // localStorage quota exceeded — still navigate
    }

    setPhase('done')
    setTimeout(() => navigate('/dashboard'), 800)
  }

  /* ── Loading Screen ──────────────────────────────────────────────────── */
  if (phase === 'loading' || phase === 'done') {
    const totalStages = RESEARCH_STAGES.length
    const doneCount = completedStages.length
    const progressPct = Math.round((doneCount / totalStages) * 100)

    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingTop}>
            <div className={styles.loadingIconWrap}>
              <div className={styles.loadingPulse} />
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 4L24 9V19L14 24L4 19V9L14 4Z" stroke="var(--accent2)" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="14" cy="14" r="4" fill="var(--accent2)" opacity="0.8" />
              </svg>
            </div>
            <div>
              {phase === 'done'
                ? <span className="tag tag-green">
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse-dot 1.2s ease infinite' }} />
                  Report complete
                </span>
                : <span className="tag tag-purple">
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent2)', display: 'inline-block', animation: 'pulse-dot 1.2s ease infinite' }} />
                  Agent running
                </span>
              }
            </div>
          </div>

          <div className={styles.loadingHeader}>
            <h2 className={styles.loadingTitle}>
              {phase === 'done' ? 'Research complete!' : 'Researching your market…'}
            </h2>
            <p className={styles.loadingSub}>
              <em>"{form.idea.length > 60 ? form.idea.slice(0, 60) + '…' : form.idea}"</em>
              <span className="tag tag-violet" style={{ marginLeft: 8 }}>{form.region}</span>
            </p>
          </div>

          {/* Progress bar */}
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <span className={styles.progressLabel}>{progressPct}%</span>
          </div>

          <div className={styles.stages}>
            {RESEARCH_STAGES.map((s) => {
              const done = completedStages.includes(s.id)
              const active = activeStage === s.id && !done
              return (
                <div
                  key={s.id}
                  className={`${styles.stage} ${done ? styles.stageDone : ''} ${active ? styles.stageActive : ''}`}
                >
                  <div className={styles.stageLeft}>
                    <div className={styles.stageIconWrap}>
                      {done
                        ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        : active
                          ? <span className={styles.spinner} />
                          : <span className={styles.stageDot} />
                      }
                    </div>
                    <div>
                      <span className={styles.stageLabel}>{s.label}</span>
                      <span className={styles.stageDesc}>{s.desc}</span>
                    </div>
                  </div>
                  {(done || active) && (
                    <span className={`tag tag-${s.tag}`}>
                      {done ? 'Done' : 'Live…'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {phase === 'done' && (
            <div className={styles.doneMsg}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L6.5 11.5L13 4.5" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Redirecting to your dashboard…
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ── Form ────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <span className="tag tag-purple">New Research</span>
          <h1 className={styles.title}>Tell us about your startup</h1>
          <p className={styles.subtitle}>
            Our AI agent will research the market across five dimensions and deliver a report in ~60 seconds.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Form card */}
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit} className={styles.form} noValidate>

              {/* Idea field */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="idea">
                  Startup idea <span className={styles.req}>*</span>
                </label>
                <p className={styles.hint}>Describe your product or service clearly. The more specific, the better the research.</p>
                <textarea
                  id="idea"
                  className={`${styles.textarea} ${errors.idea ? styles.inputErr : ''}`}
                  placeholder="e.g. An AI-powered HR onboarding tool that automates paperwork, training schedules and compliance checks for growing startups…"
                  rows={4}
                  maxLength={500}
                  value={form.idea}
                  onChange={e => { setForm(f => ({ ...f, idea: e.target.value })); setErrors(er => ({ ...er, idea: null })) }}
                />
                <div className={styles.fieldMeta}>
                  {errors.idea ? <span className={styles.errMsg}>{errors.idea}</span> : <span />}
                  <span className={styles.charCount}>{form.idea.length} / 500</span>
                </div>
              </div>

              {/* Example ideas */}
              <div className={styles.examples}>
                <span className={styles.examplesLabel}>Try an example:</span>
                <div className={styles.examplesList}>
                  {EXAMPLE_IDEAS.map(ex => (
                    <button
                      key={ex}
                      type="button"
                      className={styles.exampleBtn}
                      onClick={() => setForm(f => ({ ...f, idea: ex }))}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region + Segment */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="region">
                    Target region <span className={styles.req}>*</span>
                  </label>
                  <p className={styles.hint}>Where will you launch first?</p>
                  <div className={styles.selectWrap}>
                    <select
                      id="region"
                      className={`${styles.select} ${errors.region ? styles.inputErr : ''}`}
                      value={form.region}
                      onChange={e => { setForm(f => ({ ...f, region: e.target.value })); setErrors(er => ({ ...er, region: null })) }}
                    >
                      <option value="">Select a region…</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <svg className={styles.selectArrow} width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {errors.region && <span className={styles.errMsg}>{errors.region}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="segment">
                    Customer segment <span className={styles.req}>*</span>
                  </label>
                  <p className={styles.hint}>Who is your primary buyer or user?</p>
                  <div className={styles.selectWrap}>
                    <select
                      id="segment"
                      className={`${styles.select} ${errors.segment ? styles.inputErr : ''}`}
                      value={form.segment}
                      onChange={e => { setForm(f => ({ ...f, segment: e.target.value })); setErrors(er => ({ ...er, segment: null })) }}
                    >
                      <option value="">Select a segment…</option>
                      {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <svg className={styles.selectArrow} width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {errors.segment && <span className={styles.errMsg}>{errors.segment}</span>}
                </div>
              </div>

              {/* API / backend error */}
              {errors.api && (
                <div className={styles.apiErr}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="var(--rose)" strokeWidth="1.5" />
                    <path d="M8 5V8.5M8 10.5V11" stroke="var(--rose)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {errors.api}
                </div>
              )}

              {/* Report scope preview */}
              <div className={styles.scopeBox}>
                <p className={styles.scopeTitle}>Your report will cover</p>
                <div className={styles.scopeTags}>
                  <span className="tag tag-green">Market size</span>
                  <span className="tag tag-violet">Competitors</span>
                  <span className="tag tag-amber">Pricing</span>
                  <span className="tag tag-coral">Pain points</span>
                  <span className="tag tag-blue">Entry strategy</span>
                  <span className="tag tag-mint">Investor signals</span>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L14 5V11L8 14L2 11V5L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <circle cx="8" cy="8" r="2.5" fill="currentColor" opacity="0.8" />
                </svg>
                Launch Research Agent
              </button>
            </form>
          </div>

          {/* Aside */}
          <aside className={styles.aside}>
            <div className={styles.asideSection}>
              <h3 className={styles.asideTitle}>What the agent does</h3>
              {[
                ['01', 'Breaks your idea into 4 parallel research tracks'],
                ['02', 'Searches Tavily\'s live web index for each track'],
                ['03', 'Cross-validates findings across multiple sources'],
                ['04', 'Synthesises a structured report with Claude AI'],
                ['05', 'Generates a personalised market entry strategy'],
              ].map(([n, t]) => (
                <div key={n} className={styles.asideStep}>
                  <span className={styles.asideNum}>{n}</span>
                  <span className={styles.asideText}>{t}</span>
                </div>
              ))}
            </div>

            <div className={styles.asideTip}>
              <span className="tag tag-amber" style={{ marginBottom: 10, width: 'fit-content' }}>Pro tip</span>
              <p>Be specific: include your product's core mechanic, not just the category. "AI-powered invoice reconciliation for logistics companies" beats "fintech tool".</p>
            </div>

            <div className={styles.asideStats}>
              {[
                { v: '~60s', l: 'Average report time' },
                { v: '20+', l: 'Sources per report' },
                { v: '100%', l: 'Data from live web' },
              ].map(({ v, l }) => (
                <div key={l} className={styles.asideStat}>
                  <span className={styles.asideStatVal}>{v}</span>
                  <span className={styles.asideStatLabel}>{l}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}