import { describe, expect, it } from 'vitest'
import { filterPlaces, sortPlaces } from './filtering'
import type { DefinitionsData, Place } from '../types'

const definitions: DefinitionsData = {
  schemaVersion: 1,
  countries: [{ id: 'TW', name: '台灣' }],
  regions: [
    {
      id: 'TW-TAIPEI',
      countryId: 'TW',
      name: '台北',
      center: { lat: 25, lng: 121 },
      zoom: 11,
    },
  ],
  categories: [
    {
      id: 'F',
      name: '美食',
      color: '#D81B60',
      subcategories: [
        { id: 'RESTAURANT', name: '餐廳', icon: 'restaurant' },
        { id: 'CAFE', name: '咖啡廳', icon: 'coffee' },
      ],
    },
    {
      id: 'L',
      name: '地點',
      color: '#00897B',
      subcategories: [
        { id: 'ATTRACTION', name: '景點', icon: 'landmark' },
      ],
    },
  ],
}

function place(overrides: Partial<Place>): Place {
  return {
    uid: crypto.randomUUID(),
    id: 'TW-F-00001',
    name: '山海咖啡',
    countryId: 'TW',
    regionId: 'TW-TAIPEI',
    categoryId: 'F',
    subcategoryId: 'CAFE',
    coordinates: { lat: 25, lng: 121 },
    googleMapsUrl: 'https://www.google.com/maps/place/example',
    address: '台北市信義區',
    note: '適合下午拜訪',
    rating: null,
    ...overrides,
  }
}

describe('filterPlaces', () => {
  const places = [
    place({}),
    place({
      id: 'TW-L-00001',
      name: '展望台',
      categoryId: 'L',
      subcategoryId: 'ATTRACTION',
    }),
  ]

  it('同時套用地區、大類別與小類別的相依篩選', () => {
    expect(
      filterPlaces(places, {
        regionId: 'TW-TAIPEI',
        query: '',
        selectedCategoryIds: ['F'],
        selectedSubcategoryIds: ['CAFE', 'ATTRACTION'],
      }).map((item) => item.id),
    ).toEqual(['TW-F-00001'])
  })

  it.each([' 山海 ', 'tw-f-00001', '信義區', '下午']) (
    '可用 Unicode 文字搜尋名稱、ID、地址或備註：%s',
    (query) => {
      expect(
        filterPlaces(places, {
          regionId: 'TW-TAIPEI',
          query,
          selectedCategoryIds: ['F', 'L'],
          selectedSubcategoryIds: ['CAFE', 'ATTRACTION'],
        }).map((item) => item.id),
      ).toContain('TW-F-00001')
    },
  )
})

describe('sortPlaces', () => {
  it('依定義順序分組，再依五位流水號排序', () => {
    const input = [
      place({ id: 'TW-L-00001', categoryId: 'L', subcategoryId: 'ATTRACTION' }),
      place({ id: 'TW-F-00003', subcategoryId: 'CAFE' }),
      place({ id: 'TW-F-00002', subcategoryId: 'RESTAURANT' }),
      place({ id: 'TW-F-00001', subcategoryId: 'CAFE' }),
    ]

    expect(sortPlaces(input, definitions).map((item) => item.id)).toEqual([
      'TW-F-00002',
      'TW-F-00001',
      'TW-F-00003',
      'TW-L-00001',
    ])
  })
})
