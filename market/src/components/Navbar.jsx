import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

import styles from './Navbar.module.css'

export default function Navbar() {
  const loc = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [loc.pathname])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/research', label: 'Research' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/history', label: 'History' },
  ]

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="9" cy="9" r="2.5" fill="currentColor" opacity="0.8" />
            </svg>
          </div>
          <span className={styles.logoText}>MarketLens</span>
          <span className={styles.logoBeta}>Beta</span>
        </Link>

        {/* Desktop nav */}
        <div className={styles.links}>
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`${styles.link} ${loc.pathname === to ? styles.active : ''}`}
            >
              {label}
              {loc.pathname === to && <span className={styles.activeDot} />}
            </Link>
          ))}
        </div>

        <div className={styles.right}>
          {user ? (
            <div className={styles.userArea}>
              <span className={styles.userName}>
                <span className={styles.userAvatar}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
                {user.name.split(' ')[0]}
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className={styles.signinBtn}>Log in</Link>
              <Link to="/signup" className={styles.cta}>
                <span>Sign Up</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`${styles.mobileLink} ${loc.pathname === to ? styles.mobileLinkActive : ''}`}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <button className={styles.mobileLogout} onClick={handleLogout}>
              Sign out ({user.name})
            </button>
          ) : (
            <>
              <Link to="/login" className={styles.mobileLink}>Log in</Link>
              <Link to="/signup" className={styles.mobileCta}>
                Sign up →
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}