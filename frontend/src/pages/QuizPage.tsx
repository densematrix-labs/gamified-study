import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { submitQuiz } from '../lib/api'
import { useQuizStore } from '../store/quizStore'

export default function QuizPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const {
    topic,
    questions,
    currentIndex,
    answers,
    setAnswer,
    nextQuestion,
    setResults
  } = useQuizStore()
  
  const [loading, setLoading] = useState(false)
  const [startTime] = useState(Date.now())
  
  useEffect(() => {
    if (questions.length === 0) {
      navigate('/')
    }
  }, [questions, navigate])
  
  if (questions.length === 0) return null
  
  const question = questions[currentIndex]
  const currentAnswer = answers[question.id] || ''
  const isLast = currentIndex === questions.length - 1
  const allAnswered = questions.every(q => answers[q.id])
  
  const handleSubmit = async () => {
    if (!allAnswered) return
    
    setLoading(true)
    try {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000)
      const result = await submitQuiz(
        topic,
        Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer })),
        questions,
        durationSeconds
      )
      setResults(result)
      navigate('/results')
    } catch (err) {
      console.error('Failed to submit quiz:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const renderQuestion = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map(option => (
              <button
                key={option.id}
                onClick={() => setAnswer(question.id, option.id)}
                className={`w-full p-4 text-left font-arcade border-2 transition-all ${
                  currentAnswer === option.id
                    ? 'border-arcade-cyan bg-arcade-cyan/20 text-arcade-cyan'
                    : 'border-arcade-border hover:border-arcade-cyan/50'
                }`}
              >
                <span className="font-pixel text-sm mr-3">{option.id}.</span>
                {option.text}
              </button>
            ))}
          </div>
        )
      
      case 'true_false':
        return (
          <div className="flex gap-4">
            {['True', 'False'].map((opt, i) => (
              <button
                key={opt}
                onClick={() => setAnswer(question.id, i === 0 ? 'A' : 'B')}
                className={`flex-1 p-6 font-pixel text-lg border-2 transition-all ${
                  (currentAnswer === 'A' && i === 0) || (currentAnswer === 'B' && i === 1)
                    ? i === 0 
                      ? 'border-arcade-green bg-arcade-green/20 text-arcade-green'
                      : 'border-arcade-red bg-arcade-red/20 text-arcade-red'
                    : 'border-arcade-border hover:border-arcade-cyan/50'
                }`}
              >
                {t(`quiz.${opt.toLowerCase()}`)}
              </button>
            ))}
          </div>
        )
      
      case 'fill_blank':
        return (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder={t('quiz.fillBlank')}
            className="arcade-input text-center text-xl"
          />
        )
      
      default:
        return null
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="font-pixel text-xs text-arcade-cyan">
            {t('quiz.question')} {currentIndex + 1} {t('quiz.of')} {questions.length}
          </span>
          <span className="font-arcade text-sm text-gray-400">{topic}</span>
        </div>
        <div className="h-2 bg-arcade-dark rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-arcade-cyan to-arcade-magenta transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Question card */}
      <div className="arcade-panel p-6 mb-6">
        <h2 className="font-arcade text-xl mb-6 text-center leading-relaxed">
          {question.question}
        </h2>
        
        {renderQuestion()}
      </div>
      
      {/* Navigation */}
      <div className="flex gap-4">
        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || loading}
            className={`flex-1 arcade-btn gold ${(!allAnswered || loading) && 'opacity-50 cursor-not-allowed'}`}
            data-testid="finish-btn"
          >
            {loading ? t('errors.loading') : t('quiz.finish')}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            disabled={!currentAnswer}
            className={`flex-1 arcade-btn ${!currentAnswer && 'opacity-50 cursor-not-allowed'}`}
          >
            {t('quiz.next')}
          </button>
        )}
      </div>
    </div>
  )
}
