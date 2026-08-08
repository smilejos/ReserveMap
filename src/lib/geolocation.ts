export interface CurrentCoordinates {
  lat: number
  lng: number
}

type GeolocationClient = Pick<Geolocation, 'getCurrentPosition'>

const positionOptions: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 30_000,
  timeout: 12_000,
}

export function getGeolocationErrorMessage(code: number) {
  switch (code) {
    case 1:
      return '無法取得位置權限，請在瀏覽器設定中允許 GPS 定位。'
    case 2:
      return '目前無法取得 GPS 位置，請移到訊號較好的地方再試一次。'
    case 3:
      return 'GPS 定位逾時，請再試一次。'
    default:
      return 'GPS 定位失敗，請稍後再試。'
  }
}

export function requestCurrentLocation(
  geolocation: GeolocationClient | undefined =
    typeof navigator === 'undefined' ? undefined : navigator.geolocation,
) {
  if (!geolocation) {
    return Promise.reject(new Error('此裝置或瀏覽器不支援 GPS 定位。'))
  }

  return new Promise<CurrentCoordinates>((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => reject(new Error(getGeolocationErrorMessage(error.code))),
      positionOptions,
    )
  })
}
