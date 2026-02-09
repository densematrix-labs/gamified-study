import { useTranslation } from 'react-i18next'

const achievementIcons: Record<string, string> = {
  first_quiz: '🎯',
  perfect_score: '⭐',
  streak_5: '🔥',
  streak_10: '💥',
  level_5: '📚',
  level_10: '🎓',
  hundred_questions: '💯',
  thousand_xp: '💎'
}

interface AchievementBadgeProps {
  id: string
  isNew?: boolean
}

export default function AchievementBadge({ id, isNew }: AchievementBadgeProps) {
  const { t } = useTranslation()
  
  const icon = achievementIcons[id] || '🏆'
  const name = t(`achievements.${id}`)
  
  return (
    <div 
      className={`
        relative arcade-panel p-3 rounded-lg text-center
        ${isNew ? 'border-arcade-gold animate-pulse-glow' : 'border-arcade-border'}
      `}
      style={isNew ? { color: 'var(--arcade-gold)' } : {}}
    >
      {isNew && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-arcade-gold rounded-full flex items-center justify-center">
          <span className="font-pixel text-xs text-black">NEW</span>
        </div>
      )}
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-arcade text-xs">{name}</div>
    </div>
  )
}
