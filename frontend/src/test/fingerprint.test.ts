import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('fingerprint module', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('getDeviceId returns stored value', async () => {
    const { getDeviceId } = await import('../lib/fingerprint')
    expect(getDeviceId()).toBe('test-device-id')
  })

  it('initFingerprint resolves', async () => {
    const { initFingerprint } = await import('../lib/fingerprint')
    const result = await initFingerprint()
    expect(result).toBe('test-device-id')
  })
})
