import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { initFingerprint } from './lib/fingerprint'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import ResultsPage from './pages/ResultsPage'
import ProgressPage from './pages/ProgressPage'
import PricingPage from './pages/PricingPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'

function App() {
  useEffect(() => {
    initFingerprint()
  }, [])

  return (
    <div className="crt-effect noise-overlay">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="payment/success" element={<PaymentSuccessPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
