import { describe, expect, it } from 'vitest'
import type { DefinitionsData } from '../types'
import {
  createDefaultViewState,
  loadViewState,
  saveViewState,
} from './storage'

function definitionsWith(categoryIds: string[]): DefinitionsData {
  return {
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
    categories: categoryIds.map((id) => ({
      id,
      name: id,
      color: '#123456',
      subcategories: [{ id: `${id}_SUB`, name: `${id} 子類別`, icon: 'map-pin' }],
    })),
  }
}

function memoryStorage(initial?: string) {
  let value = initial ?? null
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
    value: () => value,
  }
}

describe('view state', () => {
  it('首次造訪預設顯示所有分類且不預選地區', () => {
    const state = createDefaultViewState(definitionsWith(['F', 'L']))
    expect(state.countryId).toBeNull()
    expect(state.regionId).toBeNull()
    expect(state.selectedCategoryIds).toEqual(['F', 'L'])
    expect(state.selectedSubcategoryIds).toEqual(['F_SUB', 'L_SUB'])
    expect(state.clusterMarkers).toBe(false)
  })

  it('定義新增分類後，新分類預設顯示', () => {
    const oldDefinitions = definitionsWith(['F'])
    const storage = memoryStorage()
    saveViewState(
      {
        ...createDefaultViewState(oldDefinitions),
        selectedCategoryIds: [],
        selectedSubcategoryIds: [],
      },
      storage,
    )

    const state = loadViewState(definitionsWith(['F', 'L']), storage)
    expect(state.selectedCategoryIds).toEqual(['L'])
    expect(state.selectedSubcategoryIds).toEqual(['L_SUB'])
  })

  it('地區參照失效時回到安全選擇狀態', () => {
    const definitions = definitionsWith(['F'])
    const storage = memoryStorage(
      JSON.stringify({
        ...createDefaultViewState(definitions),
        countryId: 'TW',
        regionId: 'TW-NOT-FOUND',
      }),
    )

    const state = loadViewState(definitions, storage)
    expect(state.countryId).toBeNull()
    expect(state.regionId).toBeNull()
    expect(storage.value()).toContain('TW-NOT-FOUND')
  })

  it('保存使用者的標記群組化選擇', () => {
    const definitions = definitionsWith(['F'])
    const storage = memoryStorage()
    saveViewState(
      { ...createDefaultViewState(definitions), clusterMarkers: true },
      storage,
    )

    expect(loadViewState(definitions, storage).clusterMarkers).toBe(true)
  })
})
