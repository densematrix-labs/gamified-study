import { create } from 'zustand'
import { QuizQuestion, QuizSubmitResponse } from '../lib/api'

interface QuizState {
  topic: string
  questions: QuizQuestion[]
  currentIndex: number
  answers: Record<string, string>
  results: QuizSubmitResponse | null
  isFreeTrial: boolean
  tokensRemaining: number | null
  
  setTopic: (topic: string) => void
  setQuestions: (questions: QuizQuestion[], isFreeTrial: boolean, tokens: number | null) => void
  setAnswer: (questionId: string, answer: string) => void
  nextQuestion: () => void
  prevQuestion: () => void
  setResults: (results: QuizSubmitResponse) => void
  reset: () => void
}

export const useQuizStore = create<QuizState>((set) => ({
  topic: '',
  questions: [],
  currentIndex: 0,
  answers: {},
  results: null,
  isFreeTrial: false,
  tokensRemaining: null,
  
  setTopic: (topic) => set({ topic }),
  
  setQuestions: (questions, isFreeTrial, tokens) => set({
    questions,
    isFreeTrial,
    tokensRemaining: tokens,
    currentIndex: 0,
    answers: {},
    results: null
  }),
  
  setAnswer: (questionId, answer) => set((state) => ({
    answers: { ...state.answers, [questionId]: answer }
  })),
  
  nextQuestion: () => set((state) => ({
    currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1)
  })),
  
  prevQuestion: () => set((state) => ({
    currentIndex: Math.max(state.currentIndex - 1, 0)
  })),
  
  setResults: (results) => set({ results }),
  
  reset: () => set({
    topic: '',
    questions: [],
    currentIndex: 0,
    answers: {},
    results: null,
    isFreeTrial: false,
    tokensRemaining: null
  })
}))
