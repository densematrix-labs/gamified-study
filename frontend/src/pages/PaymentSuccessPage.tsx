import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { verifyPayment } from '../lib/api'

export default function PaymentSuccessPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading')
  const [tokensAdded, setTokensAdded] = useState(0)
  
  useEffect(() => {
    const checkoutId = searchParams.get('checkout_id')
    if (checkoutId) {
      checkPayment(checkoutId)
    } else {
      setStatus('error')
    }
  }, [searchParams])
  
  const checkPayment = async (checkoutId: string) => {
    try {
      const result = await verifyPayment(checkoutId)
      if (result.status === 'completed') {
        setStatus('success')
        setTokensAdded(result.tokens_added || 0)
      } else {
        setStatus('pending')
        // Poll again after 2 seconds
        setTimeout(() => checkPayment(checkoutId), 2000)
      }
    } catch (err) {
      setStatus('error')
    }
  }
  
  if (status === 'loading' || status === 'pending') {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="arcade-panel p-8">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h1 className="font-pixel text-lg glow-cyan mb-2">
            {status === 'loading' ? t('errors.loading') : 'Processing...'}
          </h1>
          <p className="font-arcade text-gray-400">
            Please wait while we verify your payment
          </p>
        </div>
      </div>
    )
  }
  
  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="arcade-panel p-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="font-pixel text-lg text-arcade-red mb-4">
            {t('errors.somethingWrong')}
          </h1>
          <Link to="/" className="arcade-btn inline-block">
            {t('results.playAgain')}
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="arcade-panel p-8 border-2 border-arcade-green">
        <div className="text-6xl mb-4 animate-float">🎉</div>
        <h1 className="font-pixel text-xl glow-green mb-4">
          {t('payment.success')}
        </h1>
        <p className="font-arcade text-lg text-arcade-gold mb-6">
          {t('payment.tokensAdded', { count: tokensAdded })}
        </p>
        <Link to="/" className="arcade-btn gold inline-block">
          {t('payment.continue')}
        </Link>
      </div>
    </div>
  )
}
