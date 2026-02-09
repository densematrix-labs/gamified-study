import FingerprintJS from '@fingerprintjs/fingerprintjs'

let deviceId: string | null = null

export async function initFingerprint(): Promise<string> {
  if (deviceId) return deviceId
  
  // Try localStorage first
  const stored = localStorage.getItem('device_id')
  if (stored) {
    deviceId = stored
    return deviceId
  }
  
  // Generate new fingerprint
  try {
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    deviceId = result.visitorId
    localStorage.setItem('device_id', deviceId)
    return deviceId
  } catch (error) {
    // Fallback to random ID
    deviceId = 'fp_' + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('device_id', deviceId)
    return deviceId
  }
}

export function getDeviceId(): string {
  if (deviceId) return deviceId
  
  const stored = localStorage.getItem('device_id')
  if (stored) {
    deviceId = stored
    return deviceId
  }
  
  // Generate sync fallback
  deviceId = 'fp_' + Math.random().toString(36).substring(2, 15)
  localStorage.setItem('device_id', deviceId)
  return deviceId
}
