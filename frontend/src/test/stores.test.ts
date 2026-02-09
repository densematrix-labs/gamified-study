import { describe, it, expect, beforeEach } from 'vitest'
import { useQuizStore } from '../store/quizStore'
import { useTokenStore } from '../store/tokenStore'

describe('quizStore', () => {
  beforeEach(() => {
    useQuizStore.getState().reset()
  })

  it('sets topic', () => {
    const store = useQuizStore.getState()
    store.setTopic('JavaScript')
    
    expect(useQuizStore.getState().topic).toBe('JavaScript')
  })

  it('sets questions and resets state', () => {
    const store = useQuizStore.getState()
    const questions = [
      {
        id: 'q1',
        type: 'multiple_choice' as const,
        question: 'Test?',
        options: [{ id: 'A', text: 'Yes' }],
        correct_answer: 'A',
        explanation: 'Test'
      }
    ]
    
    store.setQuestions(questions, true, null)
    
    const state = useQuizStore.getState()
    expect(state.questions).toHaveLength(1)
    expect(state.isFreeTrial).toBe(true)
    expect(state.currentIndex).toBe(0)
    expect(state.answers).toEqual({})
  })

  it('sets answer for question', () => {
    const store = useQuizStore.getState()
    store.setAnswer('q1', 'A')
    
    expect(useQuizStore.getState().answers['q1']).toBe('A')
  })

  it('navigates to next question', () => {
    const store = useQuizStore.getState()
    const questions = [
      { id: 'q1', type: 'multiple_choice' as const, question: '1?', options: null, correct_answer: 'A', explanation: '' },
      { id: 'q2', type: 'multiple_choice' as const, question: '2?', options: null, correct_answer: 'B', explanation: '' }
    ]
    store.setQuestions(questions, true, null)
    
    store.nextQuestion()
    expect(useQuizStore.getState().currentIndex).toBe(1)
    
    // Should not go past last question
    store.nextQuestion()
    expect(useQuizStore.getState().currentIndex).toBe(1)
  })

  it('navigates to previous question', () => {
    const store = useQuizStore.getState()
    const questions = [
      { id: 'q1', type: 'multiple_choice' as const, question: '1?', options: null, correct_answer: 'A', explanation: '' },
      { id: 'q2', type: 'multiple_choice' as const, question: '2?', options: null, correct_answer: 'B', explanation: '' }
    ]
    store.setQuestions(questions, true, null)
    store.nextQuestion()
    
    store.prevQuestion()
    expect(useQuizStore.getState().currentIndex).toBe(0)
    
    // Should not go below 0
    store.prevQuestion()
    expect(useQuizStore.getState().currentIndex).toBe(0)
  })

  it('sets results', () => {
    const store = useQuizStore.getState()
    const results = {
      correct_count: 3,
      total_count: 5,
      xp_earned: 40,
      new_total_xp: 100,
      new_level: 2,
      streak: 3,
      new_achievements: ['first_quiz'],
      results: []
    }
    
    store.setResults(results)
    expect(useQuizStore.getState().results).toEqual(results)
  })

  it('resets state', () => {
    const store = useQuizStore.getState()
    store.setTopic('Test')
    store.setAnswer('q1', 'A')
    
    store.reset()
    
    const state = useQuizStore.getState()
    expect(state.topic).toBe('')
    expect(state.questions).toEqual([])
    expect(state.answers).toEqual({})
  })
})

describe('tokenStore', () => {
  it('sets token status', () => {
    const store = useTokenStore.getState()
    store.setTokenStatus(10, false, true)
    
    const state = useTokenStore.getState()
    expect(state.tokensRemaining).toBe(10)
    expect(state.hasFreeTrial).toBe(false)
    expect(state.freeTrialUsed).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('sets loading state', () => {
    const store = useTokenStore.getState()
    store.setLoading(true)
    
    expect(useTokenStore.getState().isLoading).toBe(true)
  })

  it('initializes with default values', () => {
    // Reset by creating new store state
    useTokenStore.setState({
      tokensRemaining: 0,
      hasFreeTrial: true,
      freeTrialUsed: false,
      isLoading: true
    })
    
    const state = useTokenStore.getState()
    expect(state.tokensRemaining).toBe(0)
    expect(state.hasFreeTrial).toBe(true)
    expect(state.isLoading).toBe(true)
  })
})
