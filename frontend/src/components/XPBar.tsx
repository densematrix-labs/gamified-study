interface XPBarProps {
  current: number
  max: number
  level: number
}

export default function XPBar({ current, max, level }: XPBarProps) {
  const progress = max > 0 ? Math.min((current / max) * 100, 100) : 0
  
  return (
    <div className="flex items-center gap-4">
      {/* Level badge */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-arcade-dark border-2 border-arcade-gold flex items-center justify-center shadow-neon-gold">
        <span className="font-pixel text-lg glow-gold">{level}</span>
      </div>
      
      {/* XP bar */}
      <div className="flex-1">
        <div className="xp-bar rounded">
          <div 
            className="xp-bar-fill rounded transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-arcade text-xs text-arcade-gold">{current} XP</span>
          <span className="font-arcade text-xs text-gray-500">{max} XP</span>
        </div>
      </div>
    </div>
  )
}
