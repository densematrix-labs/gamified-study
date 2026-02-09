import { getDeviceId } from './fingerprint'

const API_BASE = '/api/v1'

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'true_false' | 'fill_blank'
  question: string
  options: QuizOption[] | null
  correct_answer: string
  explanation: string
}

export interface QuizResponse {
  topic: string
  questions: QuizQuestion[]
  is_free_trial: boolean
  tokens_remaining: number | null
}

export interface QuizResult {
  question_id: string
  correct: boolean
  correct_answer: string
  explanation: string
}

export interface QuizSubmitResponse {
  correct_count: number
  total_count: number
  xp_earned: number
  new_total_xp: number
  new_level: number
  streak: number
  new_achievements: string[]
  results: QuizResult[]
}

export interface ProgressResponse {
  xp: number
  level: number
  xp_to_next_level: number
  total_questions: number
  correct_answers: number
  accuracy_percent: number
  current_streak: number
  best_streak: number
  achievements: string[]
}

export interface TokenResponse {
  tokens_remaining: number
  has_free_trial: boolean
  free_trial_used: boolean
}

export interface CheckoutResponse {
  checkout_url: string
  checkout_id: string
}

function extractErrorMessage(detail: unknown): string {
  if (typeof detail === 'string') {
    return detail
  }
  if (typeof detail === 'object' && detail !== null) {
    const obj = detail as Record<string, unknown>
    if (typeof obj.error === 'string') return obj.error
    if (typeof obj.message === 'string') return obj.message
  }
  return 'Request failed'
}

export async function generateQuiz(
  topic: string,
  numQuestions: number,
  difficulty: string,
  language: string
): Promise<QuizResponse> {
  const response = await fetch(`${API_BASE}/quiz/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId()
    },
    body: JSON.stringify({
      topic,
      num_questions: numQuestions,
      difficulty,
      language
    })
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data.detail))
  }
  
  return response.json()
}

export async function submitQuiz(
  topic: string,
  answers: { question_id: string; answer: string }[],
  questions: QuizQuestion[],
  durationSeconds?: number
): Promise<QuizSubmitResponse> {
  const response = await fetch(`${API_BASE}/quiz/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId()
    },
    body: JSON.stringify({
      topic,
      answers,
      questions,
      duration_seconds: durationSeconds
    })
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data.detail))
  }
  
  return response.json()
}

export async function getProgress(): Promise<ProgressResponse> {
  const response = await fetch(`${API_BASE}/progress`, {
    headers: {
      'X-Device-Id': getDeviceId()
    }
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data.detail))
  }
  
  return response.json()
}

export async function getTokenStatus(): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE}/tokens`, {
    headers: {
      'X-Device-Id': getDeviceId()
    }
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data.detail))
  }
  
  return response.json()
}

export async function createCheckout(
  productSku: string,
  successUrl: string
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE}/payment/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_sku: productSku,
      device_id: getDeviceId(),
      success_url: successUrl
    })
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data.detail))
  }
  
  return response.json()
}

export async function verifyPayment(checkoutId: string): Promise<{
  status: string
  tokens_added?: number
  tokens_remaining?: number
}> {
  const response = await fetch(`${API_BASE}/payment/success?checkout_id=${checkoutId}`, {
    headers: {
      'X-Device-Id': getDeviceId()
    }
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data.detail))
  }
  
  return response.json()
}
