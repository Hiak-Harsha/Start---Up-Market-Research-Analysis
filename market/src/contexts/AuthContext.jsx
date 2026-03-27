import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load existing session
  useEffect(() => {
    try {
      const activeSession = localStorage.getItem('ml_active_user')
      if (activeSession) {
        setUser(JSON.parse(activeSession))
      }
    } catch (err) {
      console.error("Could not load session", err)
    } finally {
      setLoading(false)
    }
  }, [])

  function getUsers() {
    return JSON.parse(localStorage.getItem('ml_users') || '[]')
  }

  function login(email, password) {
    const users = getUsers()
    const found = users.find(u => u.email === email && u.password === password)
    
    if (!found) {
      throw new Error('Invalid email or password')
    }

    // Save session
    localStorage.setItem('ml_active_user', JSON.stringify(found))
    setUser(found)
    return found
  }

  function register(name, email, password) {
    const users = getUsers()
    if (users.some(u => u.email === email)) {
      throw new Error('An account with this email already exists')
    }

    const newUser = { id: Date.now().toString(), name, email, password }
    users.push(newUser)
    
    // Save to DB
    localStorage.setItem('ml_users', JSON.stringify(users))
    
    // Auto-login
    localStorage.setItem('ml_active_user', JSON.stringify(newUser))
    setUser(newUser)
    return newUser
  }

  function logout() {
    localStorage.removeItem('ml_active_user')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
