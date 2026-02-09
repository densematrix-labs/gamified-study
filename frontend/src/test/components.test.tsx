import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Components
import XPBar from '../components/XPBar'
import AchievementBadge from '../components/AchievementBadge'
import LanguageSwitcher from '../components/LanguageSwitcher'

describe('XPBar', () => {
  it('renders level correctly', () => {
    render(<XPBar current={50} max={100} level={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders XP values', () => {
    render(<XPBar current={75} max={100} level={3} />)
    expect(screen.getByText('75 XP')).toBeInTheDocument()
    expect(screen.getByText('100 XP')).toBeInTheDocument()
  })

  it('handles zero max value', () => {
    render(<XPBar current={0} max={0} level={1} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})

describe('AchievementBadge', () => {
  it('renders achievement icon and name', () => {
    render(<AchievementBadge id="first_quiz" />)
    expect(screen.getByText('🎯')).toBeInTheDocument()
    expect(screen.getByText('achievements.first_quiz')).toBeInTheDocument()
  })

  it('shows NEW badge when isNew is true', () => {
    render(<AchievementBadge id="perfect_score" isNew />)
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })

  it('does not show NEW badge when isNew is false', () => {
    render(<AchievementBadge id="streak_5" isNew={false} />)
    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
  })

  it('renders default icon for unknown achievement', () => {
    render(<AchievementBadge id="unknown_achievement" />)
    expect(screen.getByText('🏆')).toBeInTheDocument()
  })
})

describe('LanguageSwitcher', () => {
  it('renders current language', () => {
    render(
      <BrowserRouter>
        <LanguageSwitcher />
      </BrowserRouter>
    )
    expect(screen.getByText('🇺🇸')).toBeInTheDocument()
  })

  it('opens dropdown on click', () => {
    render(
      <BrowserRouter>
        <LanguageSwitcher />
      </BrowserRouter>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Should show all language options
    expect(screen.getByText('中文')).toBeInTheDocument()
    expect(screen.getByText('日本語')).toBeInTheDocument()
    expect(screen.getByText('Deutsch')).toBeInTheDocument()
  })

  it('has accessible label', () => {
    render(
      <BrowserRouter>
        <LanguageSwitcher />
      </BrowserRouter>
    )
    
    expect(screen.getByLabelText('Change language')).toBeInTheDocument()
  })
})
