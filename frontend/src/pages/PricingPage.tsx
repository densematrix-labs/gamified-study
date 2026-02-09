import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createCheckout } from '../lib/api'

const products = [
  { sku: 'quiz_5', quizzes: 5, price: '$2.99', pricePerQuiz: '$0.60' },
  { sku: 'quiz_20', quizzes: 20, price: '$7.99', pricePerQuiz: '$0.40', popular: true },
  { sku: 'quiz_50', quizzes: 50, price: '$14.99', pricePerQuiz: '$0.30' }
]

export default function PricingPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState<string | null>(null)
  
  const handleBuy = async (sku: string) => {
    setLoading(sku)
    try {
      const successUrl = `${window.location.origin}/payment/success`
      const result = await createCheckout(sku, successUrl)
      window.location.href = result.checkout_url
    } catch (err) {
      console.error('Checkout failed:', err)
      setLoading(null)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="font-pixel text-2xl glow-gold mb-2">{t('pricing.title')}</h1>
        <p className="font-arcade text-gray-400">{t('pricing.subtitle')}</p>
      </div>
      
      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {products.map(product => (
          <div 
            key={product.sku}
            className={`arcade-panel p-6 relative ${
              product.popular ? 'border-2 border-arcade-gold' : ''
            }`}
          >
            {product.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 bg-arcade-gold text-black font-pixel text-xs">
                  {t('pricing.popular')}
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">
                {product.quizzes === 5 ? '🎮' : product.quizzes === 20 ? '🎯' : '🏆'}
              </div>
              <div className="font-pixel text-2xl glow-cyan mb-2">
                {product.quizzes}
              </div>
              <div className="font-arcade text-gray-400 text-sm">
                QUIZZES
              </div>
            </div>
            
            <div className="text-center mb-6">
              <div className="font-pixel text-3xl glow-gold">{product.price}</div>
              <div className="font-arcade text-xs text-gray-500">
                {product.pricePerQuiz} {t('pricing.perQuiz')}
              </div>
            </div>
            
            <button
              onClick={() => handleBuy(product.sku)}
              disabled={loading !== null}
              className={`w-full arcade-btn ${product.popular ? 'gold' : ''}`}
            >
              {loading === product.sku ? t('errors.loading') : t('pricing.buy')}
            </button>
          </div>
        ))}
      </div>
      
      {/* Features */}
      <div className="arcade-panel p-6">
        <h3 className="font-pixel text-sm glow-cyan mb-4 text-center">ALL PLANS INCLUDE</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {['aiQuestions', 'anyTopic', 'instantFeedback', 'xpProgress'].map(feature => (
            <div key={feature} className="flex items-center gap-3">
              <span className="text-arcade-green">✓</span>
              <span className="font-arcade">{t(`pricing.features.${feature}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
