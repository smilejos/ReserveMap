import { describe, expect, it, vi } from 'vitest'
import {
  getGeolocationErrorMessage,
  requestCurrentLocation,
} from './geolocation'

describe('requestCurrentLocation', () => {
  it('使用高精確度 GPS 並回傳目前座標', async () => {
    const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>(
      (success) => {
        success({
          coords: {
            accuracy: 8,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            latitude: 25.033,
            longitude: 121.5654,
            speed: null,
            toJSON: () => ({}),
          },
          timestamp: Date.now(),
          toJSON: () => ({}),
        })
      },
    )

    await expect(requestCurrentLocation({ getCurrentPosition })).resolves.toEqual(
      { lat: 25.033, lng: 121.5654 },
    )
    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true }),
    )
  })

  it('在瀏覽器不支援定位時回傳明確錯誤', async () => {
    await expect(requestCurrentLocation(undefined)).rejects.toThrow(
      '此裝置或瀏覽器不支援 GPS 定位。',
    )
  })
})

describe('getGeolocationErrorMessage', () => {
  it.each([
    [1, '位置權限'],
    [2, '無法取得 GPS 位置'],
    [3, '定位逾時'],
  ])('將定位錯誤代碼 %s 轉成可理解的訊息', (code, message) => {
    expect(getGeolocationErrorMessage(code)).toContain(message)
  })
})
