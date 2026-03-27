import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './HistoryPage.module.css'

export default function HistoryPage() {
  const [reports, setReports] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('ml_reports') || '[]')
    setReports(saved)
  }, [])

  function loadReport(entry) {
    localStorage.setItem('ml_latest', JSON.stringify(entry))
    navigate('/dashboard')
  }

  function deleteReport(id) {
    const updated = reports.filter(r => r.id !== id)
    setReports(updated)
    localStorage.setItem('ml_reports', JSON.stringify(updated))
    const latest = JSON.parse(localStorage.getItem('ml_latest') || '{}')
    if (latest.id === id) localStorage.removeItem('ml_latest')
  }

  function clearAll() {
    if (window.confirm('Delete all saved reports?')) {
      setReports([])
      localStorage.removeItem('ml_reports')
      localStorage.removeItem('ml_latest')
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <span className="tag tag-blue" style={{ marginBottom: 14, display: 'inline-flex' }}>Research history</span>
            <h1 className={styles.title}>Your reports</h1>
            <p className={styles.subtitle}>
              {reports.length > 0
                ? `${reports.length} report${reports.length !== 1 ? 's' : ''} saved locally in your browser`
                : 'No reports saved yet'
              }
            </p>
          </div>
          <div className={styles.headerRight}>
            {reports.length > 0 && (
              <button className={styles.clearBtn} onClick={clearAll}>Clear all</button>
            )}
            <Link to="/research" className={styles.newBtn}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              New research
            </Link>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="var(--text3)" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="16" cy="16" r="4" stroke="var(--text3)" strokeWidth="1.5" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No research history yet</h3>
            <p className={styles.emptyDesc}>Your completed reports will appear here. Run your first research to get started.</p>
            <Link to="/research" className={styles.emptyBtn}>Start your first research →</Link>
          </div>
        ) : (
          <div className={styles.reportGrid}>
            {reports.map((r, i) => (
              <div key={r.id} className={styles.reportCard}>
                <div className={styles.reportCardTop}>
                  <div className={styles.reportMeta}>
                    <span className="tag tag-violet">{r.form.region}</span>
                    <span className={styles.reportDate}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <button className={styles.deleteBtn} onClick={() => deleteReport(r.id)} title="Delete report">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <h3 className={styles.reportIdea}>{r.form.idea}</h3>

                <div className={styles.reportSegment}>{r.form.segment}</div>

                {r.report && (
                  <div className={styles.reportKpis}>
                    {[
                      { l: 'TAM', v: r.report.marketSize?.tam },
                      { l: 'SAM', v: r.report.marketSize?.sam },
                      { l: 'Growth', v: r.report.marketSize?.growth },
                    ].filter(k => k.v).map(k => (
                      <div key={k.l} className={styles.reportKpi}>
                        <span className={styles.reportKpiVal}>{k.v}</span>
                        <span className={styles.reportKpiLabel}>{k.l}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button className={styles.loadBtn} onClick={() => loadReport(r)}>
                  View report
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}