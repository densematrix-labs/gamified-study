import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getProgress, ProgressResponse } from '../lib/api'
import XPBar from '../components/XPBar'
import AchievementBadge from '../components/AchievementBadge'

export default function ProgressPage() {
  const { t } = useTranslation()
  
  const [progress, setProgress] = useState<ProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  useEffect(() => {
    loadProgress()
  }, [])
  
  const loadProgress = async () => {
    try {
      const data = await getProgress()
      setProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="font-pixel text-arcade-cyan animate-pulse">{t('errors.loading')}</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center">
        <p className="font-arcade text-arcade-red">{error}</p>
      </div>
    )
  }
  
  if (!progress) return null
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-pixel text-2xl glow-cyan text-center mb-8">{t('progress.title')}</h1>
      
      {/* Level and XP */}
      <div className="arcade-panel p-6 mb-6">
        <div className="mb-4">
          <span className="font-pixel text-xs text-arcade-cyan">{t('progress.level')}</span>
        </div>
        <XPBar 
          current={progress.xp_to_next_level > 0 ? progress.xp % (progress.xp + progress.xp_to_next_level) : progress.xp}
          max={progress.xp_to_next_level > 0 ? progress.xp + progress.xp_to_next_level : progress.xp || 100}
          level={progress.level}
        />
        <div className="text-center mt-4">
          <span className="font-arcade text-sm text-gray-400">
            {progress.xp_to_next_level} XP {t('progress.toNextLevel')}
          </span>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="arcade-panel p-4 text-center">
          <div className="text-3xl font-pixel glow-gold">{progress.xp}</div>
          <div className="font-arcade text-xs text-gray-400">{t('progress.xp')}</div>
        </div>
        <div className="arcade-panel p-4 text-center">
          <div className="text-3xl font-pixel glow-cyan">{progress.total_questions}</div>
          <div className="font-arcade text-xs text-gray-400">{t('progress.totalQuestions')}</div>
        </div>
        <div className="arcade-panel p-4 text-center">
          <div className={`text-3xl font-pixel ${
            progress.accuracy_percent >= 80 ? 'glow-green' : 
            progress.accuracy_percent >= 50 ? 'glow-gold' : 'text-arcade-red'
          }`}>
            {progress.accuracy_percent}%
          </div>
          <div className="font-arcade text-xs text-gray-400">{t('progress.accuracy')}</div>
        </div>
        <div className="arcade-panel p-4 text-center">
          <div className="text-3xl font-pixel glow-magenta">{progress.best_streak}</div>
          <div className="font-arcade text-xs text-gray-400">{t('progress.bestStreak')}</div>
        </div>
      </div>
      
      {/* Achievements */}
      <div className="arcade-panel p-6">
        <h2 className="font-pixel text-sm glow-cyan mb-4">{t('progress.achievements')}</h2>
        
        {progress.achievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {progress.achievements.map(id => (
              <AchievementBadge key={id} id={id} />
            ))}
          </div>
        ) : (
          <p className="font-arcade text-sm text-gray-500 text-center py-8">
            No achievements yet. Start playing to earn some!
          </p>
        )}
      </div>
    </div>
  )
}
