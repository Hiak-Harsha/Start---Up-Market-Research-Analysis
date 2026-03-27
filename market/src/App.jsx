import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import ResearchPage from './pages/ResearchPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import SplashScreen from './components/SplashScreen.jsx'

export default function App() {
  return (
    <AuthProvider>
      <SplashScreen />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* All other pages use the Navbar layout */}
        <Route path="/*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/research" element={<ResearchPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Route>
            </Routes>
          </>
        } />
      </Routes>
    </AuthProvider>
  )
}