import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    
    try {
      login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Link to="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <circle cx="9" cy="9" r="2.5" fill="currentColor" opacity="0.8" />
                </svg>
              </div>
              <span className={styles.logoText}>MarketLens</span>
            </Link>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to access your research reports.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorBanner}>{error}</div>
            )}
            
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email address</label>
              <input 
                type="email" 
                id="email"
                className={styles.input}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <a href="#" className={styles.forgotPass}>Forgot password?</a>
              </div>
              <input 
                type="password" 
                id="password"
                className={styles.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              Sign In
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 6 }}>
                <path d="M3 7H11M7.5 3.5L11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>

          <p className={styles.footer}>
            Don't have an account? <Link to="/signup" className={styles.link}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
