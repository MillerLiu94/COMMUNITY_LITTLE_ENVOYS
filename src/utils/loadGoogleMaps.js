let loadingPromise = null

export function loadGoogleMaps(apiKey) {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps)
  }
  if (loadingPromise) {
    return loadingPromise
  }
  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = (err) => {
      loadingPromise = null
      console.error('Google Maps 腳本載入失敗:', err)
      reject(new Error('Google Maps API 載入失敗（請檢查 API Key 與網路連線）'))
    }
    document.head.appendChild(script)
  })
  return loadingPromise
}
