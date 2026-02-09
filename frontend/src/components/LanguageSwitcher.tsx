import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]
  
  const handleSelect = (code: string) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }
  
  return (
    <div className="relative" data-testid="lang-switcher">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded border border-arcade-border hover:border-arcade-cyan transition-colors"
        aria-label="Change language"
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="font-arcade text-sm hidden sm:inline">{currentLang.name}</span>
        <span className="text-arcade-cyan">▼</span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 arcade-panel border border-arcade-cyan z-50 py-2">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-arcade-dark transition-colors ${
                  lang.code === i18n.language ? 'text-arcade-cyan' : 'text-gray-300'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-arcade">{lang.name}</span>
                {lang.code === i18n.language && (
                  <span className="ml-auto text-arcade-cyan">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
