import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuizStore } from '../store/quizStore'
import AchievementBadge from '../components/AchievementBadge'

export default function ResultsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const { results, questions, answers, reset } = useQuizStore()
  
  useEffect(() => {
    if (!results) {
      navigate('/')
    }
  }, [results, navigate])
  
  if (!results) return null
  
  const scorePercent = Math.round((results.correct_count / results.total_count) * 100)
  
  const handlePlayAgain = () => {
    reset()
    navigate('/')
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Score display */}
      <div className="text-center mb-8">
        <h1 className="font-pixel text-2xl glow-cyan mb-6">{t('results.title')}</h1>
        
        <div className="inline-block arcade-panel p-8 border-4 border-arcade-cyan">
          <div className="text-6xl font-pixel glow-cyan mb-2">
            {results.correct_count}/{results.total_count}
          </div>
          <div className={`font-arcade text-xl ${
            scorePercent >= 80 ? 'glow-green' : scorePercent >= 50 ? 'glow-gold' : 'text-arcade-red'
          }`}>
            {scorePercent}%
          </div>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="arcade-panel p-4 text-center">
          <div className="text-3xl font-pixel glow-gold">{results.xp_earned}</div>
          <div className="font-arcade text-sm text-gray-400">{t('results.xpEarned')}</div>
        </div>
        <div className="arcade-panel p-4 text-center">
          <div className="text-3xl font-pixel glow-magenta">{results.streak}</div>
          <div className="font-arcade text-sm text-gray-400">{t('results.streak')}</div>
        </div>
      </div>
      
      {/* New achievements */}
      {results.new_achievements.length > 0 && (
        <div className="mb-8">
          <h3 className="font-pixel text-sm glow-gold text-center mb-4">
            {t('results.newAchievements')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {results.new_achievements.map(id => (
              <AchievementBadge key={id} id={id} isNew />
            ))}
          </div>
        </div>
      )}
      
      {/* Question results */}
      <div className="arcade-panel p-4 mb-8">
        <h3 className="font-pixel text-xs text-arcade-cyan mb-4">{t('results.title')}</h3>
        <div className="space-y-3">
          {results.results.map((result, i) => {
            const question = questions[i]
            // const userAnswer = answers[question.id]
            
            return (
              <div 
                key={result.question_id}
                className={`p-4 rounded border-2 ${
                  result.correct 
                    ? 'border-arcade-green bg-arcade-green/10' 
                    : 'border-arcade-red bg-arcade-red/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`font-pixel text-lg ${result.correct ? 'text-arcade-green' : 'text-arcade-red'}`}>
                    {result.correct ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <p className="font-arcade text-sm mb-2">{question.question}</p>
                    {!result.correct && (
                      <p className="font-arcade text-xs text-gray-400">
                        {t('results.correct')}: {result.correct_answer}
                      </p>
                    )}
                    <p className="font-arcade text-xs text-arcade-cyan mt-2">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={handlePlayAgain} className="flex-1 arcade-btn">
          {t('results.playAgain')}
        </button>
        <Link to="/progress" className="flex-1 arcade-btn gold">
          {t('results.viewProgress')}
        </Link>
      </div>
    </div>
  )
}
