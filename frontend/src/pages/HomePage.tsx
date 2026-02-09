import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { generateQuiz, getTokenStatus } from '../lib/api'
import { useQuizStore } from '../store/quizStore'
import { useTokenStore } from '../store/tokenStore'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { setQuestions, setTopic: saveQuizTopic } = useQuizStore()
  const { tokensRemaining, hasFreeTrial, freeTrialUsed, setTokenStatus, isLoading } = useTokenStore()
  
  useEffect(() => {
    loadTokenStatus()
  }, [])
  
  const loadTokenStatus = async () => {
    try {
      const status = await getTokenStatus()
      setTokenStatus(status.tokens_remaining, status.has_free_trial, status.free_trial_used)
    } catch (err) {
      console.error('Failed to load token status:', err)
    }
  }
  
  const handleStart = async () => {
    if (!topic.trim()) {
      setError(t('errors.somethingWrong'))
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const result = await generateQuiz(topic, numQuestions, difficulty, i18n.language)
      saveQuizTopic(topic)
      setQuestions(result.questions, result.is_free_trial, result.tokens_remaining)
      navigate('/quiz')
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.somethingWrong')
      if (message.includes('token') || message.includes('payment')) {
        navigate('/pricing')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }
  
  const canPlay = !isLoading && (hasFreeTrial || tokensRemaining > 0)
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4 animate-float">📚</div>
        <h2 className="font-pixel text-xl glow-cyan mb-2">{t('home.welcome')}</h2>
        
        {/* Token status */}
        {!isLoading && (
          <div className="mt-4">
            {hasFreeTrial ? (
              <span className="inline-block px-4 py-2 bg-arcade-green/20 border border-arcade-green rounded font-arcade text-arcade-green">
                {t('home.freeTrialBadge')}
              </span>
            ) : tokensRemaining > 0 ? (
              <span className="inline-block px-4 py-2 bg-arcade-gold/20 border border-arcade-gold rounded font-arcade text-arcade-gold">
                {t('home.tokensRemaining', { count: tokensRemaining })}
              </span>
            ) : (
              <span className="inline-block px-4 py-2 bg-arcade-red/20 border border-arcade-red rounded font-arcade text-arcade-red">
                {t('errors.noTokens')}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Quiz setup form */}
      <div className="arcade-panel p-6 space-y-6">
        {/* Topic input */}
        <div>
          <label className="block font-pixel text-xs text-arcade-cyan mb-2">
            {t('home.topicPlaceholder')}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('home.topicPlaceholder')}
            className="arcade-input"
            disabled={loading}
            data-testid="topic-input"
          />
        </div>
        
        {/* Number of questions */}
        <div>
          <label className="block font-pixel text-xs text-arcade-cyan mb-2">
            {t('home.numQuestions')}
          </label>
          <div className="flex gap-2">
            {[3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => setNumQuestions(n)}
                className={`flex-1 py-3 font-pixel text-sm border-2 transition-all ${
                  numQuestions === n
                    ? 'border-arcade-cyan bg-arcade-cyan/20 text-arcade-cyan'
                    : 'border-arcade-border text-gray-400 hover:border-arcade-cyan/50'
                }`}
                disabled={loading}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        
        {/* Difficulty */}
        <div>
          <label className="block font-pixel text-xs text-arcade-cyan mb-2">
            {t('home.difficulty')}
          </label>
          <div className="flex gap-2">
            {['easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-3 font-pixel text-xs border-2 transition-all ${
                  difficulty === d
                    ? d === 'easy' ? 'border-arcade-green bg-arcade-green/20 text-arcade-green'
                    : d === 'medium' ? 'border-arcade-gold bg-arcade-gold/20 text-arcade-gold'
                    : 'border-arcade-red bg-arcade-red/20 text-arcade-red'
                    : 'border-arcade-border text-gray-400 hover:border-arcade-border'
                }`}
                disabled={loading}
              >
                {t(`home.${d}`)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="p-4 bg-arcade-red/20 border border-arcade-red rounded">
            <p className="font-arcade text-arcade-red text-center">{error}</p>
          </div>
        )}
        
        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={loading || !canPlay}
          className={`w-full arcade-btn ${canPlay ? 'gold' : 'opacity-50 cursor-not-allowed'}`}
          data-testid="start-btn"
        >
          {loading ? t('errors.loading') : t('home.startQuiz')}
        </button>
        
        {!canPlay && !isLoading && (
          <p className="text-center font-arcade text-sm text-gray-400">
            {t('errors.noTokens')}
          </p>
        )}
      </div>
    </div>
  )
}
