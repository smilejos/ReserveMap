import type { DefinitionsData, Place } from '../types'

export interface PlaceFilters {
  regionId: string
  query: string
  selectedCategoryIds: string[]
  selectedSubcategoryIds: string[]
}

function normalizeSearchText(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase()
}

export function filterPlaces(places: Place[], filters: PlaceFilters): Place[] {
  const query = normalizeSearchText(filters.query)
  const categoryIds = new Set(filters.selectedCategoryIds)
  const subcategoryIds = new Set(filters.selectedSubcategoryIds)

  return places.filter((place) => {
    if (place.regionId !== filters.regionId) return false
    if (!categoryIds.has(place.categoryId)) return false
    if (!subcategoryIds.has(place.subcategoryId)) return false
    if (!query) return true

    return [place.name, place.id, place.address ?? '', place.note]
      .map(normalizeSearchText)
      .some((value) => value.includes(query))
  })
}

function serialNumber(id: string) {
  const match = id.match(/(\d{5})$/)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

export function sortPlaces(
  places: Place[],
  definitions: DefinitionsData,
): Place[] {
  const categoryOrder = new Map(
    definitions.categories.map((category, index) => [category.id, index]),
  )
  const subcategoryOrder = new Map(
    definitions.categories.flatMap((category) =>
      category.subcategories.map((subcategory, index) => [
        subcategory.id,
        index,
      ]),
    ),
  )

  return [...places].sort(
    (left, right) =>
      (categoryOrder.get(left.categoryId) ?? Number.MAX_SAFE_INTEGER) -
        (categoryOrder.get(right.categoryId) ?? Number.MAX_SAFE_INTEGER) ||
      (subcategoryOrder.get(left.subcategoryId) ?? Number.MAX_SAFE_INTEGER) -
        (subcategoryOrder.get(right.subcategoryId) ?? Number.MAX_SAFE_INTEGER) ||
      serialNumber(left.id) - serialNumber(right.id),
  )
}
