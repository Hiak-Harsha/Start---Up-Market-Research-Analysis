import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import styles from './DashboardPage.module.css'
import { askFollowUp } from '../utils/api.js'
import { exportPDF } from '../utils/export.js'

/* ─── Sample report (shown when no real report is saved) ─────────────────── */
const SAMPLE_REPORT = {
  form: {
    idea: 'AI-powered HR onboarding tool for startups',
    region: 'India',
    segment: 'B2B — Mid-market (50–500 employees)',
  },
  createdAt: new Date().toISOString(),
  report: {
    marketSize: {
      summary: 'The HR tech market in India is valued at approximately $1.2B in 2024 and is projected to grow at 18% CAGR through 2029, driven by rapid startup growth and increasing demand for automation.',
      tam: '$1.2B', sam: '$340M', som: '$28M', growth: '18% CAGR',
      year: '2024', projectedYear: '2029', projectedTam: '$2.8B',
      keyDrivers: ['Rapid startup ecosystem growth', 'Digital transformation mandates', 'Remote work adoption', 'Compliance automation demand'],
    },
    competitors: [
      { name: 'Darwinbox', pricing: '$6–12/user/mo', strength: 'Enterprise features', weakness: 'Complex for SMBs', market: 'India-first', founded: '2015', funding: '$72M Series D', userBase: '2M+ employees' },
      { name: 'Keka HR', pricing: '$4–8/user/mo', strength: 'Strong payroll module', weakness: 'Weak onboarding UX', market: 'India', founded: '2015', funding: '$57M Series A', userBase: '8,000+ companies' },
      { name: 'GreytHR', pricing: '$3–7/user/mo', strength: 'Compliance focus', weakness: 'Dated interface', market: 'India', founded: '2012', funding: 'Bootstrapped', userBase: '20,000+ companies' },
      { name: 'Rippling', pricing: '$8/user/mo', strength: 'Global payroll', weakness: 'Expensive for startups', market: 'US-centric', founded: '2016', funding: '$1.2B Series E', userBase: '5,000+ companies' },
      { name: 'Zoho People', pricing: '$1–3/user/mo', strength: 'Affordable bundled', weakness: 'Limited AI features', market: 'Global', founded: '2008', funding: 'Bootstrapped', userBase: '50,000+ companies' },
    ],
    pricingModels: [
      { model: 'Per-seat SaaS', usage: 72, desc: 'Monthly fee per employee.', avgPrice: '$4–12/user/mo', bestFor: 'Growing teams' },
      { model: 'Freemium', usage: 38, desc: 'Free up to N employees.', avgPrice: 'Free + $8/extra', bestFor: 'Early-stage startups' },
      { model: 'Module-based', usage: 55, desc: 'Pay for modules you use.', avgPrice: '$50–200/module', bestFor: 'Specific needs' },
      { model: 'Annual contract', usage: 44, desc: 'Discounted annual deal.', avgPrice: '20–30% discount', bestFor: 'Established teams' },
    ],
    painPoints: [
      { point: 'Manual document collection', severity: 'high', freq: 89, detail: 'HR teams spend 8+ hours per new hire collecting and organising documents.', opportunity: 'AI-powered document collection & verification in under 10 minutes.' },
      { point: 'Compliance tracking', severity: 'high', freq: 82, detail: 'Companies struggle with state-specific labour law compliance during onboarding.', opportunity: 'Automated compliance checklist generation based on employee location.' },
      { point: 'Training schedule creation', severity: 'medium', freq: 71, detail: 'HR manually builds role-specific training schedules for every new hire.', opportunity: 'AI generates personalised training plans based on role and department.' },
      { point: 'IT provisioning delays', severity: 'medium', freq: 64, detail: 'New hires wait 2–5 days for IT access, reducing early productivity.', opportunity: 'Auto-trigger IT provisioning workflows on hire confirmation.' },
      { point: 'Poor onboarding experience', severity: 'low', freq: 58, detail: '35% of new hires report feeling unprepared in their first week.', opportunity: 'Guided onboarding journey with milestones, buddy system, and check-ins.' },
    ],
    entryStrategy: {
      summary: 'Launch with a focused onboarding module targeting seed-to-Series A startups in Bengaluru and Mumbai. Offer a free tier for companies under 25 employees to build word-of-mouth. Differentiate on AI automation speed — promise under 10 minutes per new hire vs industry average of 3+ hours.',
      tactics: [
        'Product Hunt + LinkedIn launch targeting HR managers at funded startups',
        'White-glove onboarding migration service from competitors',
        'Partner with startup accelerators (YC India, Surge, Antler) for distribution',
        'Publish benchmark data on onboarding time saved to drive inbound SEO content',
      ],
      timeline: [
        { phase: 'Month 1–3', goal: 'PMF validation', action: 'Land 20 design partners, iterate on feedback, hit <10min onboarding claim' },
        { phase: 'Month 4–6', goal: 'Growth engine', action: 'Launch freemium tier, content marketing, first 100 paying customers' },
        { phase: 'Month 7–12', goal: 'Scale', action: 'Raise seed round, hire sales team, expand to NCR and Pune markets' },
      ],
      channels: ['Product Hunt', 'LinkedIn outreach', 'Accelerator partnerships', 'Content / SEO'],
      riskFactors: ['Entrenched incumbents with enterprise lock-in', 'Long HR software procurement cycles'],
    },
    investmentSignals: {
      vcActivity: 'Indian HR tech is attracting significant Series A/B capital in 2024, with investors focused on AI-native platforms that can demonstrate measurable ROI.',
      recentFunding: 'Darwinbox raised $72M, multiple seed rounds in HR automation this year',
      hotTopics: ['AI-native HR', 'Compliance automation', 'Employee experience', 'Workforce analytics'],
      sentiment: 'bullish',
      score: 78,
    },
    targetCustomerProfile: {
      primaryBuyer: 'HR Manager / People Ops Lead',
      companySize: '50–500 employees',
      budget: '$500–2,000/month',
      buyingProcess: 'Champion-led evaluation → IT security review → CFO approval',
      topPriorities: ['Time savings', 'Compliance coverage', 'Employee experience'],
      preferredChannels: ['LinkedIn', 'Peer recommendations', 'G2/Capterra reviews'],
    },
    sources: [
      'NASSCOM India HR Tech Report 2024', 'Tracxn Startup Database — HR Category',
      'LinkedIn HR Survey India Q3 2024', 'Crunchbase funding data', 'G2 HR software reviews 2024',
    ],
  },
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function safeArr(val) { return Array.isArray(val) ? val : [] }
function safeStr(val, fallback = '—') { return val && typeof val === 'string' ? val : fallback }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10,
      padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 13,
    }}>
      <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--accent2)' }}>
          {p.name}: {p.value}{p.unit || ''}
        </p>
      ))}
    </div>
  )
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className={styles.tabs}>
      {tabs.map(t => (
        <button
          key={t.id}
          className={`${styles.tab} ${active === t.id ? styles.tabActive : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

const SENTIMENT_COLORS = {
  bullish: 'var(--emerald)',
  neutral: 'var(--amber)',
  bearish: 'var(--rose)',
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [entry, setEntry] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedCompetitor, setExpandedCompetitor] = useState(null)
  const [expandedPain, setExpandedPain] = useState(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('ml_latest')
    setEntry(saved ? JSON.parse(saved) : SAMPLE_REPORT)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  async function handleChat(e) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const q = chatInput.trim()
    setChatInput('')
    setChatError(null)
    setChatMessages(m => [...m, { role: 'user', text: q }])
    setChatLoading(true)
    try {
      const answer = await askFollowUp(q, entry?.report)
      setChatMessages(m => [...m, { role: 'assistant', text: answer }])
    } catch (err) {
      setChatError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setChatLoading(false)
    }
  }

  if (!entry) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptySpinner} />
        <p>Loading report…</p>
      </div>
    )
  }

  const r = entry.report
  const isSample = !localStorage.getItem('ml_latest') || entry === SAMPLE_REPORT

  /* ── Tab panels ──────────────────────────────────────────────────────── */
  const tabContent = {

    /* ── OVERVIEW ── */
    overview: (
      <>
        {/* KPI Row */}
        <div className={styles.kpiRow}>
          {[
            { label: 'TAM', value: safeStr(r.marketSize?.tam), color: 'emerald', icon: '◈' },
            { label: 'SAM', value: safeStr(r.marketSize?.sam), color: 'sky', icon: '◉' },
            { label: 'SOM', value: safeStr(r.marketSize?.som), color: 'violet', icon: '◎' },
            { label: 'Growth', value: safeStr(r.marketSize?.growth), color: 'amber', icon: '↗' },
            { label: 'Competitors', value: safeArr(r.competitors).length, color: 'rose', icon: '⊕' },
          ].map(k => (
            <div key={k.label} className={styles.kpi} style={{ '--kc': `var(--${k.color})` }}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiIcon}>{k.icon}</span>
                <span className={styles.kpiLabel}>{k.label}</span>
              </div>
              <span className={styles.kpiValue}>{k.value}</span>
            </div>
          ))}
        </div>

        <div className={styles.grid}>
          {/* Market Summary */}
          {r.marketSize && (
            <section className={`${styles.card} ${styles.wide}`}>
              <div className={styles.cardHead}>
                <span className="tag tag-green">Market size</span>
                <div className={styles.cardMeta}>
                  <span className={styles.cardMetaItem}>
                    <span className={styles.cardMetaDot} style={{ background: 'var(--emerald)' }} />
                    {safeStr(r.marketSize.year, '2024')} baseline
                  </span>
                  {r.marketSize.projectedTam && (
                    <span className={styles.cardMetaItem}>
                      Projected {r.marketSize.projectedTam} by {safeStr(r.marketSize.projectedYear, '2029')}
                    </span>
                  )}
                </div>
              </div>
              <p className={styles.cardBody}>{safeStr(r.marketSize.summary, 'No summary available.')}</p>
              {safeArr(r.marketSize.keyDrivers).length > 0 && (
                <div className={styles.drivers}>
                  <span className={styles.driversLabel}>Key growth drivers</span>
                  <div className={styles.driversList}>
                    {r.marketSize.keyDrivers.map((d, i) => (
                      <span key={i} className={styles.driverChip}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Investor Signals */}
          {r.investmentSignals && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <span className="tag tag-amber">Investor signals</span>
                <span className={styles.sentimentBadge} style={{ color: SENTIMENT_COLORS[r.investmentSignals.sentiment] || 'var(--text2)' }}>
                  {safeStr(r.investmentSignals.sentiment)}
                </span>
              </div>
              <div className={styles.scoreRing}>
                <svg viewBox="0 0 64 64" width="80" height="80" style={{ flexShrink: 0 }}>
                  <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke="var(--amber)" strokeWidth="4"
                    strokeDasharray={`${((r.investmentSignals.score || 0) / 100) * 175.9} 175.9`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                  <text x="32" y="37" textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="700" fontFamily="var(--font-display)">
                    {r.investmentSignals.score || 0}
                  </text>
                </svg>
                <div>
                  <p className={styles.scoreLabel}>Market score</p>
                  <p className={styles.cardBody} style={{ fontSize: 13 }}>{safeStr(r.investmentSignals.vcActivity)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {safeArr(r.investmentSignals.hotTopics).map((t, i) => (
                  <span key={i} className="tag tag-amber">{t}</span>
                ))}
              </div>
            </section>
          )}

          {/* Customer Profile */}
          {r.targetCustomerProfile && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <span className="tag tag-blue">Customer profile</span>
              </div>
              <div className={styles.profileGrid}>
                {[
                  { label: 'Primary buyer', value: r.targetCustomerProfile.primaryBuyer },
                  { label: 'Company size', value: r.targetCustomerProfile.companySize },
                  { label: 'Budget', value: r.targetCustomerProfile.budget },
                  { label: 'Buying process', value: r.targetCustomerProfile.buyingProcess },
                ].map(({ label, value }) => (
                  <div key={label} className={styles.profileItem}>
                    <span className={styles.profileLabel}>{label}</span>
                    <span className={styles.profileValue}>{safeStr(value)}</span>
                  </div>
                ))}
              </div>
              {safeArr(r.targetCustomerProfile.topPriorities).length > 0 && (
                <div className={styles.drivers}>
                  <span className={styles.driversLabel}>Top priorities</span>
                  <div className={styles.driversList}>
                    {r.targetCustomerProfile.topPriorities.map((p, i) => (
                      <span key={i} className="tag tag-blue">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </>
    ),

    /* ── COMPETITORS ── */
    competitors: (
      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.wide}`}>
          <div className={styles.cardHead}>
            <span className="tag tag-violet">Competitor landscape</span>
            <span className={styles.competitorCount}>{safeArr(r.competitors).length} competitors mapped</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Pricing</th>
                  <th>Strength</th>
                  <th>Weakness</th>
                  <th>Market</th>
                  <th>Funding</th>
                </tr>
              </thead>
              <tbody>
                {safeArr(r.competitors).map((c, i) => (
                  <>
                    <tr
                      key={`row-${i}`}
                      className={`${styles.tableRow} ${expandedCompetitor === i ? styles.tableRowActive : ''}`}
                      onClick={() => setExpandedCompetitor(expandedCompetitor === i ? null : i)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className={styles.compCell}>
                          <div className={styles.compAvatar}>{(c.name || '?')[0]}</div>
                          <div>
                            <span className={styles.compName}>{safeStr(c.name)}</span>
                            {c.founded && <span className={styles.compFounded}>est. {c.founded}</span>}
                          </div>
                        </div>
                      </td>
                      <td><span className="tag tag-amber">{safeStr(c.pricing)}</span></td>
                      <td className={styles.strengthCell}>{safeStr(c.strength)}</td>
                      <td className={styles.weaknessCell}>{safeStr(c.weakness)}</td>
                      <td><span className={styles.marketBadge}>{safeStr(c.market)}</span></td>
                      <td className={styles.fundingCell}>{safeStr(c.funding)}</td>
                    </tr>
                    {expandedCompetitor === i && (
                      <tr key={`exp-${i}`} className={styles.expandedRow}>
                        <td colSpan={6}>
                          <div className={styles.expandedContent}>
                            <div className={styles.expandedItem}>
                              <span className={styles.expandedLabel}>User base</span>
                              <span className={styles.expandedValue}>{safeStr(c.userBase)}</span>
                            </div>
                            <div className={styles.expandedItem}>
                              <span className={styles.expandedLabel}>Funding</span>
                              <span className={styles.expandedValue}>{safeStr(c.funding)}</span>
                            </div>
                            <div className={styles.expandedItem}>
                              <span className={styles.expandedLabel}>Key weakness to exploit</span>
                              <span className={styles.expandedValue} style={{ color: 'var(--rose)' }}>{safeStr(c.weakness)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.tableHint}>↑ Click a row to expand competitor details</p>
        </section>

        {/* Competitor market presence bar chart */}
        {safeArr(r.competitors).length > 0 && (
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className="tag tag-violet">Competitor market presence</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={r.competitors.map((c, i) => ({ name: c.name, score: Math.max(10, 90 - i * 14) }))}
                barCategoryGap="30%"
              >
                <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Market presence">
                  {r.competitors.map((_, i) => (
                    <Cell key={i} fill={['#a78bfa', '#7c6af5', '#5d52d4', '#38bdf8', '#6ee7b7'][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Pricing comparison */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <span className="tag tag-amber">Pricing landscape</span>
          </div>
          <div className={styles.pricingTable}>
            {safeArr(r.competitors).map((c, i) => (
              <div key={i} className={styles.pricingRow}>
                <span className={styles.pricingCompany}>{safeStr(c.name)}</span>
                <span className="tag tag-amber">{safeStr(c.pricing)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    ),

    /* ── MARKET & PAIN ── */
    market: (
      <div className={styles.grid}>
        {/* Pricing models */}
        {safeArr(r.pricingModels).length > 0 && (
          <section className={`${styles.card} ${styles.wide}`}>
            <div className={styles.cardHead}>
              <span className="tag tag-amber">Pricing model adoption</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.pricingModels} barCategoryGap="28%">
                <XAxis dataKey="model" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="usage" radius={[5, 5, 0, 0]} name="Adoption">
                  {r.pricingModels.map((_, i) => (
                    <Cell key={i} fill={['#6ee7b7', '#a78bfa', '#f59e0b', '#38bdf8'][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className={styles.pricingDetails}>
              {r.pricingModels.map((p, i) => (
                <div key={i} className={styles.pricingDetail}>
                  <div className={styles.pricingDetailHeader}>
                    <span className={styles.pricingDetailName}>{safeStr(p.model)}</span>
                    <span className={styles.pricingDetailAdoption}>{p.usage ?? 0}% adoption</span>
                  </div>
                  <p className={styles.pricingDetailDesc}>{safeStr(p.desc)}</p>
                  <div className={styles.pricingDetailMeta}>
                    {p.avgPrice && <span className="tag tag-amber">{p.avgPrice}</span>}
                    {p.bestFor && <span className={styles.pricingBestFor}>Best for: {p.bestFor}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pain points */}
        {safeArr(r.painPoints).length > 0 && (
          <section className={`${styles.card} ${styles.wide}`}>
            <div className={styles.cardHead}>
              <span className="tag tag-coral">Customer pain points</span>
              <span className={styles.painCount}>{r.painPoints.length} pain points identified</span>
            </div>
            <div className={styles.painList}>
              {r.painPoints.map((p, i) => (
                <div
                  key={i}
                  className={styles.painItem}
                  onClick={() => setExpandedPain(expandedPain === i ? null : i)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.painTop}>
                    <div className={styles.painLeft}>
                      <span className={`tag tag-${p.severity === 'high' ? 'coral' : p.severity === 'medium' ? 'amber' : 'blue'}`}>
                        {safeStr(p.severity, 'medium')}
                      </span>
                      <span className={styles.painLabel}>{safeStr(p.point)}</span>
                    </div>
                    <div className={styles.painRight}>
                      <span className={styles.painFreqNum}>{p.freq ?? 0}%</span>
                      <svg
                        width="14" height="14" viewBox="0 0 14 14" fill="none"
                        style={{ transform: expandedPain === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text3)' }}
                      >
                        <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.painBar}>
                    <div
                      className={styles.painFill}
                      style={{
                        width: `${p.freq ?? 0}%`,
                        background: p.severity === 'high' ? 'var(--rose)' : p.severity === 'medium' ? 'var(--amber)' : 'var(--sky)',
                      }}
                    />
                  </div>
                  <span className={styles.painFreq}>{p.freq ?? 0}% of target customers report this pain</span>
                  {expandedPain === i && (
                    <div className={styles.painExpanded}>
                      <div className={styles.painExpandedItem}>
                        <span className={styles.painExpandedLabel}>Problem detail</span>
                        <p className={styles.painExpandedText}>{safeStr(p.detail)}</p>
                      </div>
                      <div className={styles.painExpandedItem}>
                        <span className={styles.painExpandedLabel}>Your opportunity</span>
                        <p className={styles.painExpandedText} style={{ color: 'var(--emerald)' }}>{safeStr(p.opportunity)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    ),

    /* ── STRATEGY ── */
    strategy: (
      <div className={styles.grid}>
        {/* Entry strategy */}
        {r.entryStrategy && (
          <section className={`${styles.card} ${styles.wide} ${styles.strategyCard}`}>
            <div className={styles.cardHead}>
              <span className="tag tag-blue">Market entry strategy</span>
            </div>
            <p className={styles.cardBody}>{safeStr(r.entryStrategy.summary)}</p>
            <div className={styles.tacticsList}>
              {safeArr(r.entryStrategy.tactics).map((t, i) => (
                <div key={i} className={styles.tactic}>
                  <span className={styles.tacticNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={styles.tacticText}>{t}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Timeline */}
        {safeArr(r.entryStrategy?.timeline).length > 0 && (
          <section className={`${styles.card} ${styles.wide}`}>
            <div className={styles.cardHead}>
              <span className="tag tag-violet">Go-to-market timeline</span>
            </div>
            <div className={styles.timeline}>
              {r.entryStrategy.timeline.map((t, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.timelineMarker}>
                    <div className={styles.timelineDot} />
                    {i < r.entryStrategy.timeline.length - 1 && <div className={styles.timelineLine} />}
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelinePhase}>{safeStr(t.phase)}</span>
                      {t.goal && <span className="tag tag-violet">{t.goal}</span>}
                    </div>
                    <p className={styles.timelineAction}>{safeStr(t.action)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Channels + Risks */}
        {safeArr(r.entryStrategy?.channels).length > 0 && (
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className="tag tag-green">Acquisition channels</span>
            </div>
            <div className={styles.channelsList}>
              {r.entryStrategy.channels.map((c, i) => (
                <div key={i} className={styles.channelItem}>
                  <div className={styles.channelDot} />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {safeArr(r.entryStrategy?.riskFactors).length > 0 && (
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className="tag tag-coral">Risk factors</span>
            </div>
            <div className={styles.risksList}>
              {r.entryStrategy.riskFactors.map((risk, i) => (
                <div key={i} className={styles.riskItem}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M7 2L13 11H1L7 2Z" stroke="var(--rose)" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M7 6V8M7 9.5V10" stroke="var(--rose)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {safeArr(r.sources).length > 0 && (
          <section className={`${styles.card} ${styles.wide}`}>
            <div className={styles.cardHead}>
              <span className="tag tag-green">Research sources</span>
            </div>
            <div className={styles.sources}>
              {r.sources.map((s, i) => (
                <div key={i} className={styles.source}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="10" height="10" rx="2" stroke="var(--text3)" strokeWidth="1.25" />
                    <path d="M4 6H8M4 4H8M4 8H6" stroke="var(--text3)" strokeWidth="1.25" strokeLinecap="round" />
                  </svg>
                  {s}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    ),
  }

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page} id="report-root">
      <div className="container">

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {isSample && <span className="tag tag-amber">Sample report</span>}
            <h1 className={styles.title}>{safeStr(entry.form?.idea, 'Market Research Report')}</h1>
            <div className={styles.meta}>
              {entry.form?.region && <span className="tag tag-violet">{entry.form.region}</span>}
              {entry.form?.segment && <span className="tag tag-blue">{entry.form.segment}</span>}
              <span className={styles.date}>
                {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.exportBtn} onClick={() => exportPDF('report-root', entry.form?.idea)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V9M4 6L7 9L10 6M2 11H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export PDF
            </button>
            <Link to="/research" className={styles.newBtn}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              New research
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'competitors', label: 'Competitors' },
            { id: 'market', label: 'Market & Pain' },
            { id: 'strategy', label: 'Strategy' },
          ]}
          active={activeTab}
          onChange={(id) => { setActiveTab(id); setExpandedCompetitor(null); setExpandedPain(null) }}
        />

        {/* Tab content */}
        <div className={styles.tabContent}>
          {tabContent[activeTab]}
        </div>

        {/* Follow-up chat */}
        <section className={styles.chatSection}>
          <div className={styles.chatHeader}>
            <div>
              <h2 className={styles.chatTitle}>Ask follow-up questions</h2>
              <p className={styles.chatSub}>The AI has full context of your report. Ask anything.</p>
            </div>
            <span className="tag tag-green">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse-dot 1.2s ease infinite' }} />
              AI Ready
            </span>
          </div>

          <div className={styles.chatBox}>
            <div className={styles.messages}>
              {chatMessages.length === 0 && (
                <div className={styles.chatEmpty}>
                  <p className={styles.chatEmptyLabel}>Suggested questions</p>
                  {[
                    'What is the biggest competitive gap I can exploit?',
                    'Which pricing model should I start with?',
                    'How should I approach the first 10 customers?',
                    "What's the fastest path to product-market fit?",
                  ].map(q => (
                    <button
                      key={q}
                      className={styles.suggestion}
                      onClick={() => { setChatInput(q); }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6H10M6.5 2.5L10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {chatMessages.map((m, i) => (
                <div key={i} className={`${styles.message} ${m.role === 'user' ? styles.userMsg : styles.assistantMsg}`}>
                  <span className={styles.msgRole}>{m.role === 'user' ? 'You' : 'MarketLens AI'}</span>
                  <div className={styles.msgText}>{m.text}</div>
                </div>
              ))}

              {chatLoading && (
                <div className={`${styles.message} ${styles.assistantMsg}`}>
                  <span className={styles.msgRole}>MarketLens AI</span>
                  <div className={styles.typingDots}>
                    <span /><span /><span />
                  </div>
                </div>
              )}

              {chatError && (
                <div className={`${styles.message} ${styles.assistantMsg}`}>
                  <span className={styles.msgRole}>Error</span>
                  <div className={styles.msgText} style={{ color: 'var(--rose)', borderColor: 'rgba(251,113,133,0.2)', background: 'rgba(251,113,133,0.04)' }}>
                    {chatError}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <form className={styles.chatForm} onSubmit={handleChat}>
              <input
                className={styles.chatInput}
                placeholder="Ask anything about your market…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button type="submit" className={styles.chatSend} disabled={chatLoading || !chatInput.trim()}>
                {chatLoading
                  ? <span className={styles.sendSpinner} />
                  : <>Send <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6H10M6.5 2.5L10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg></>
                }
              </button>
            </form>
          </div>
        </section>

      </div>
    </div>
  )
}