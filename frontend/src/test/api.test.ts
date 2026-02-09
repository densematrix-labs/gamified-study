import { describe, it, expect, vi, beforeEach } from 'vitest'

// Reset mocks before importing
beforeEach(() => {
  vi.resetModules()
  global.fetch = vi.fn()
})

describe('API error handling', () => {
  it('handles string error detail', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: "Something went wrong" })
    })
    global.fetch = mockFetch
    
    const { generateQuiz } = await import('../lib/api')
    
    await expect(generateQuiz('test', 5, 'medium', 'en'))
      .rejects.toThrow("Something went wrong")
  })

  it('handles object error detail with error field', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({ 
        detail: { error: "No tokens remaining", code: "payment_required" }
      })
    })
    global.fetch = mockFetch
    
    const { generateQuiz } = await import('../lib/api')
    
    await expect(generateQuiz('test', 5, 'medium', 'en'))
      .rejects.toThrow("No tokens remaining")
  })

  it('handles object error detail with message field', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ 
        detail: { message: "Invalid input" }
      })
    })
    global.fetch = mockFetch
    
    const { generateQuiz } = await import('../lib/api')
    
    await expect(generateQuiz('test', 5, 'medium', 'en'))
      .rejects.toThrow("Invalid input")
  })

  it('never throws [object Object]', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({ 
        detail: { error: "Payment required", code: "402" }
      })
    })
    global.fetch = mockFetch
    
    const { generateQuiz } = await import('../lib/api')
    
    try {
      await generateQuiz('test', 5, 'medium', 'en')
    } catch (e) {
      const error = e as Error
      expect(error.message).not.toContain('[object Object]')
      expect(error.message).not.toContain('object Object')
    }
  })

  it('handles unknown detail format gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ 
        detail: { unknown_field: "something" }
      })
    })
    global.fetch = mockFetch
    
    const { generateQuiz } = await import('../lib/api')
    
    await expect(generateQuiz('test', 5, 'medium', 'en'))
      .rejects.toThrow("Request failed")
  })
})

describe('API success cases', () => {
  it('generates quiz successfully', async () => {
    const mockResponse = {
      topic: 'Math',
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'What is 2+2?',
          options: [{ id: 'A', text: '4' }],
          correct_answer: 'A',
          explanation: 'Basic math'
        }
      ],
      is_free_trial: true,
      tokens_remaining: null
    }
    
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    global.fetch = mockFetch
    
    const { generateQuiz } = await import('../lib/api')
    const result = await generateQuiz('Math', 5, 'medium', 'en')
    
    expect(result.topic).toBe('Math')
    expect(result.questions).toHaveLength(1)
    expect(result.is_free_trial).toBe(true)
  })

  it('submits quiz successfully', async () => {
    const mockResponse = {
      correct_count: 3,
      total_count: 5,
      xp_earned: 40,
      new_total_xp: 100,
      new_level: 2,
      streak: 3,
      new_achievements: ['first_quiz'],
      results: []
    }
    
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    global.fetch = mockFetch
    
    const { submitQuiz } = await import('../lib/api')
    const result = await submitQuiz('Math', [], [], 60)
    
    expect(result.correct_count).toBe(3)
    expect(result.xp_earned).toBe(40)
  })

  it('gets progress successfully', async () => {
    const mockResponse = {
      xp: 500,
      level: 3,
      xp_to_next_level: 250,
      total_questions: 50,
      correct_answers: 40,
      accuracy_percent: 80.0,
      current_streak: 5,
      best_streak: 10,
      achievements: ['first_quiz', 'perfect_score']
    }
    
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    global.fetch = mockFetch
    
    const { getProgress } = await import('../lib/api')
    const result = await getProgress()
    
    expect(result.xp).toBe(500)
    expect(result.level).toBe(3)
    expect(result.achievements).toContain('perfect_score')
  })

  it('gets token status successfully', async () => {
    const mockResponse = {
      tokens_remaining: 10,
      has_free_trial: false,
      free_trial_used: true
    }
    
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    global.fetch = mockFetch
    
    const { getTokenStatus } = await import('../lib/api')
    const result = await getTokenStatus()
    
    expect(result.tokens_remaining).toBe(10)
    expect(result.has_free_trial).toBe(false)
  })

  it('creates checkout successfully', async () => {
    const mockResponse = {
      checkout_url: 'https://creem.io/checkout/123',
      checkout_id: 'checkout_123'
    }
    
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })
    global.fetch = mockFetch
    
    const { createCheckout } = await import('../lib/api')
    const result = await createCheckout('quiz_5', 'https://example.com/success')
    
    expect(result.checkout_url).toContain('creem.io')
    expect(result.checkout_id).toBe('checkout_123')
  })
})
