import { useEffect, useState } from 'react'
import styles from './SplashScreen.module.css'

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    // Start fading out after 2.2 seconds (giving it time to be seen)
    const fadeTimer = setTimeout(() => setIsFading(true), 2200)
    
    // Completely remove from DOM after the fade transition finishes
    const completeTimer = setTimeout(() => {
      setIsVisible(false)
    }, 2800) 
    
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className={`${styles.splash} ${isFading ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <div className={styles.glow} />
          <h1 className={styles.teamName}>
            Team Beginners
          </h1>
        </div>
      </div>
    </div>
  )
}
