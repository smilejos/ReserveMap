import { describe, expect, it } from 'vitest'
import type { DefinitionsData, Place } from '../types'
import { createInfoContent } from './MapView'

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

  it('不直接把分享短網址交給 Google Maps App', () => {
    const content = createInfoContent(
      {
        ...place,
        googleMapsUrl:
          'https://maps.app.goo.gl/ZgzbhRSBNhgjDSZaA?g_st=ic',
        coordinates: { lat: 24.694944, lng: 121.7318456 },
      },
      definitions,
    )
    const link = content.querySelector<HTMLAnchorElement>('.maps-link')

    expect(link?.href).toBe(
      'https://www.google.com/maps/search/?api=1&query=24.694944%2C121.7318456',
    )
  })
})
