import { useState, useEffect, useRef } from 'react'
import styles from './MinigamePage.module.css'

export default function MinigamePage({ compact = false }) {
  const [playing, setPlaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0) // 1 score = 1% market share
  const [activeMole, setActiveMole] = useState(null)
  const [highestScore, setHighestScore] = useState(
    parseInt(localStorage.getItem('ml_highscore') || '0')
  )

  const timerRef = useRef()
  const moleTimerRef = useRef()

  function startGame() {
    setPlaying(true)
    setTimeLeft(30)
    setScore(0)
    pickMole()

    // 1-second countdown loop
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (playing && timeLeft === 0) {
      endGame()
    }
  }, [playing, timeLeft])

  function endGame() {
    setPlaying(false)
    setActiveMole(null)
    clearInterval(timerRef.current)
    clearTimeout(moleTimerRef.current)
    
    setScore(finalScore => {
      if (finalScore > highestScore) {
        setHighestScore(finalScore)
        localStorage.setItem('ml_highscore', finalScore.toString())
      }
      return finalScore
    })
  }

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(moleTimerRef.current)
    }
  }, [])

  function pickMole() {
    // 9 squares (0 to 8)
    const randomSquare = Math.floor(Math.random() * 9)
    setActiveMole(randomSquare)

    // They pop up randomly between exactly 500ms and 1100ms
    const popTime = Math.random() * 600 + 500
    moleTimerRef.current = setTimeout(() => {
      if (playing) pickMole()
    }, popTime)
  }

  function smashMole(index) {
    if (activeMole === index && playing) {
      setScore(s => Math.min(s + 5, 100)) // Max 100% market share (5% per hit)
      setActiveMole(null) // Make it disappear instantly
      clearTimeout(moleTimerRef.current)
      pickMole() // spawn new one instantly
    }
  }

  const gameBoard = (
    <div className={styles.gameBoardCentered}>
      <div className={styles.gameStats}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Runway Time</span>
          <span className={`${styles.statValue} ${timeLeft <= 5 ? styles.urgent : ''}`}>
            {timeLeft}s
          </span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Market Share</span>
          <span className={styles.statValue} style={{ color: 'var(--emerald)' }}>
            {score}%
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {[...Array(9)].map((_, i) => (
          <div 
            key={i} 
            className={styles.hole}
            onMouseDown={() => smashMole(i)}
          >
            {activeMole === i && (
              <div className={styles.mole}>
                <div className={styles.moleFace}>
                  <span className={styles.moleEyeLeft}></span>
                  <span className={styles.moleEyeRight}></span>
                  <span className={styles.moleMouth}></span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overlays */}
      {!playing && timeLeft === 30 && (
        <div className={styles.overlayStart}>
          <div className={styles.ruleCard}>
            <h2>Ready to enter the market?</h2>
            <button className={styles.btnStart} onClick={startGame}>
              Start Crushing
            </button>
          </div>
        </div>
      )}

      {!playing && timeLeft === 0 && (
        <div className={styles.overlayEnd}>
          <div className={styles.ruleCard}>
            <h2>Runway ended!</h2>
            <p>You captured <strong>{score}%</strong> of the market.</p>
            {score >= 100 ? (
              <p className={styles.winText}>🔥 Unicorn Status! Absolute Domination. 🔥</p>
            ) : score >= 50 ? (
              <p className={styles.goodText}>Solid traction! You're an emerging force.</p>
            ) : (
              <p className={styles.badText}>Legacy incumbents outmaneuvered you...</p>
            )}
            <div style={{ margin: '15px 0' }}>
              <span className="tag tag-amber">High Score: {highestScore}%</span>
            </div>
            <button className={styles.btnStart} onClick={startGame}>
              Raise Next Round (Play Again)
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (compact) {
    return gameBoard
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <span className="tag tag-coral">Market Dominator</span>
          <h1 className={styles.title}>Crush the Competition</h1>
          <p className={styles.subtitle}>
            Legacy competitors are popping up. Crush them before your 30-second runway ends!
          </p>
        </div>
        {gameBoard}
      </div>
    </div>
  )
}
