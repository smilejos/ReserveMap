let googleMapsPromise: Promise<typeof google> | null = null

declare global {
  interface Window {
    __reserveMapGoogleReady?: () => void
    gm_authFailure?: () => void
  }
}

export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (window.google?.maps) return Promise.resolve(window.google)
  if (googleMapsPromise) return googleMapsPromise

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__reserveMapGoogleReady'
    const script = document.createElement('script')
    const timeout = window.setTimeout(() => {
      reject(new Error('Google 地圖載入逾時，請稍後再試。'))
    }, 20_000)

    window[callbackName] = () => {
      window.clearTimeout(timeout)
      delete window[callbackName]
      resolve(window.google)
    }
    window.gm_authFailure = () => {
      window.clearTimeout(timeout)
      reject(new Error('Google Maps API 金鑰無效或未允許此網站。'))
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error('無法連線至 Google 地圖服務。'))
    }
    script.async = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=marker&loading=async&language=zh-TW&callback=${callbackName}`
    document.head.append(script)
  })

  return googleMapsPromise
}
