import { Outlet, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

export default function Layout() {
  const { t } = useTranslation()
  const location = useLocation()
  
  const isActive = (path: string) => location.pathname === path
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="arcade-panel border-b-4 border-arcade-cyan">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="text-3xl animate-float">🎮</div>
              <div>
                <h1 className="font-pixel text-lg glow-cyan">{t('app.title')}</h1>
                <p className="font-arcade text-sm text-arcade-magenta">{t('app.subtitle')}</p>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className={`font-pixel text-xs transition-colors ${
                  isActive('/') ? 'glow-cyan' : 'text-gray-400 hover:text-arcade-cyan'
                }`}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/progress"
                className={`font-pixel text-xs transition-colors ${
                  isActive('/progress') ? 'glow-cyan' : 'text-gray-400 hover:text-arcade-cyan'
                }`}
              >
                {t('nav.progress')}
              </Link>
              <Link
                to="/pricing"
                className={`font-pixel text-xs transition-colors ${
                  isActive('/pricing') ? 'glow-gold' : 'text-gray-400 hover:text-arcade-gold'
                }`}
              >
                {t('nav.pricing')}
              </Link>
              
              <LanguageSwitcher />
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="arcade-panel border-t-2 border-arcade-border py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="font-arcade text-sm text-gray-500">
            © 2025 Study Quest • Powered by AI • 
            <a 
              href="https://densematrix.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-arcade-cyan hover:glow-cyan ml-1"
            >
              DenseMatrix
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
