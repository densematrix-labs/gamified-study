import { create } from 'zustand'

interface TokenState {
  tokensRemaining: number
  hasFreeTrial: boolean
  freeTrialUsed: boolean
  isLoading: boolean
  
  setTokenStatus: (tokens: number, hasFreeTrial: boolean, freeTrialUsed: boolean) => void
  setLoading: (loading: boolean) => void
}

export const useTokenStore = create<TokenState>((set) => ({
  tokensRemaining: 0,
  hasFreeTrial: true,
  freeTrialUsed: false,
  isLoading: true,
  
  setTokenStatus: (tokensRemaining, hasFreeTrial, freeTrialUsed) => set({
    tokensRemaining,
    hasFreeTrial,
    freeTrialUsed,
    isLoading: false
  }),
  
  setLoading: (isLoading) => set({ isLoading })
}))
