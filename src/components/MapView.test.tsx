import { describe, expect, it, vi } from 'vitest'
import type { DefinitionsData, Place } from '../types'
import { createInfoContent, resetMapToRegion } from './MapView'

const definitions: DefinitionsData = {
  schemaVersion: 1,
  countries: [{ id: 'TW', name: '台灣' }],
  regions: [],
  categories: [
    {
      id: 'L',
      name: '地點',
      color: '#00897B',
      subcategories: [{ id: 'FARM', name: '農場', icon: 'squirrel' }],
    },
  ],
}

const place: Place = {
  uid: 'bdf847b5-56cb-4823-8847-35ee126d620c',
  id: 'TW-L-00001',
  name: '測試農場',
  countryId: 'TW',
  regionId: 'TW-TAIPEI',
  categoryId: 'L',
  subcategoryId: 'FARM',
  coordinates: { lat: 25, lng: 121 },
  googleMapsUrl: 'https://www.google.com/maps/place/example',
  address: null,
  note: '',
  rating: null,
}

describe('createInfoContent', () => {
  it('讓 Google Maps 通用連結在目前頁面開啟', () => {
    const content = createInfoContent(place, definitions)
    const link = content.querySelector<HTMLAnchorElement>('.maps-link')

    expect(link).toHaveAttribute('target', '_self')
    expect(link).not.toHaveAttribute('rel')
    expect(link).toHaveTextContent('用 Google Maps 開啟')
  })

  it('保留資料中的 Google Maps 商家識別網址', () => {
    const merchantUrl =
      'https://www.google.com/maps?q=example&ftid=0x1234:0x5678'
    const content = createInfoContent(
      {
        ...place,
        googleMapsUrl: merchantUrl,
      },
      definitions,
    )
    const link = content.querySelector<HTMLAnchorElement>('.maps-link')

    expect(link?.href).toBe(merchantUrl)
  })
})

describe('resetMapToRegion', () => {
  it('回到地區定義的中心與預設縮放', () => {
    const setCenter = vi.fn()
    const setZoom = vi.fn()

    resetMapToRegion(
      { setCenter, setZoom },
      { center: { lat: 26.3344, lng: 127.8056 }, zoom: 9 },
    )

    expect(setCenter).toHaveBeenCalledWith({ lat: 26.3344, lng: 127.8056 })
    expect(setZoom).toHaveBeenCalledWith(9)
  })
})
