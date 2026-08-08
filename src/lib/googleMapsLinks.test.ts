import { describe, expect, it } from 'vitest'
import { getGoogleMapsOpenUrl } from './googleMapsLinks'

const coordinates = { lat: 24.694944, lng: 121.7318456 }

describe('getGoogleMapsOpenUrl', () => {
  it.each([
    'https://maps.app.goo.gl/ZgzbhRSBNhgjDSZaA?g_st=ic',
    'https://goo.gl/maps/example',
  ])('將 Google Maps 短網址改成跨平台座標搜尋網址：%s', (googleMapsUrl) => {
    expect(getGoogleMapsOpenUrl({ coordinates, googleMapsUrl })).toBe(
      'https://www.google.com/maps/search/?api=1&query=24.694944%2C121.7318456',
    )
  })

  it('保留已經是標準格式的 Google Maps 網址', () => {
    const googleMapsUrl =
      'https://www.google.com/maps/search/?api=1&query=example'

    expect(getGoogleMapsOpenUrl({ coordinates, googleMapsUrl })).toBe(
      googleMapsUrl,
    )
  })
})
