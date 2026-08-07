import type { DefinitionsData, PlacesData } from '../types'

const definitionsUrl = `${import.meta.env.BASE_URL}data/definitions.json`
const placesUrl = `${import.meta.env.BASE_URL}data/places.json`

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`${label} 載入失敗（${response.status}）`)
  }
  return (await response.json()) as T
}

export async function loadReserveMapData(): Promise<{
  definitions: DefinitionsData
  placesData: PlacesData
}> {
  const [definitions, placesData] = await Promise.all([
    fetchJson<DefinitionsData>(definitionsUrl, '分類與地區資料'),
    fetchJson<PlacesData>(placesUrl, '地點資料'),
  ])

  if (definitions.schemaVersion !== 1 || placesData.schemaVersion !== 1) {
    throw new Error('資料版本不受支援，請先更新網站程式。')
  }
  if (
    !Array.isArray(definitions.countries) ||
    !Array.isArray(definitions.regions) ||
    !Array.isArray(definitions.categories) ||
    !Array.isArray(placesData.places)
  ) {
    throw new Error('資料格式不完整。')
  }

  return { definitions, placesData }
}
