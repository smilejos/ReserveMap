import type { DefinitionsData, ViewState } from '../types'

export const VIEW_STATE_KEY = 'reserveMap.viewState.v1'

function currentIds(definitions: DefinitionsData) {
  return {
    categoryIds: definitions.categories.map((category) => category.id),
    subcategoryIds: definitions.categories.flatMap((category) =>
      category.subcategories.map((subcategory) => subcategory.id),
    ),
  }
}

export function createDefaultViewState(definitions: DefinitionsData): ViewState {
  const { categoryIds, subcategoryIds } = currentIds(definitions)
  return {
    countryId: null,
    regionId: null,
    selectedCategoryIds: categoryIds,
    selectedSubcategoryIds: subcategoryIds,
    clusterMarkers: false,
    knownCategoryIds: categoryIds,
    knownSubcategoryIds: subcategoryIds,
  }
}

function reconcileSelected(
  selected: unknown,
  known: unknown,
  current: string[],
): string[] {
  if (!Array.isArray(selected)) return current
  const currentSet = new Set(current)
  const selectedSet = new Set(
    selected.filter((item): item is string => typeof item === 'string'),
  )
  const knownSet = new Set(
    Array.isArray(known)
      ? known.filter((item): item is string => typeof item === 'string')
      : current,
  )

  return current.filter(
    (id) => selectedSet.has(id) || (Array.isArray(known) && !knownSet.has(id)),
  )
}

export function loadViewState(
  definitions: DefinitionsData,
  storage: Pick<Storage, 'getItem'> | undefined = safeStorage(),
): ViewState {
  const fallback = createDefaultViewState(definitions)
  if (!storage) return fallback

  try {
    const raw = storage.getItem(VIEW_STATE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<ViewState>
    const { categoryIds, subcategoryIds } = currentIds(definitions)
    const validCountry = definitions.countries.some(
      (country) => country.id === parsed.countryId,
    )
    const region = definitions.regions.find(
      (candidate) => candidate.id === parsed.regionId,
    )
    const validRegion = Boolean(
      validCountry && region && region.countryId === parsed.countryId,
    )

    return {
      countryId: validRegion ? (parsed.countryId ?? null) : null,
      regionId: validRegion ? (parsed.regionId ?? null) : null,
      selectedCategoryIds: reconcileSelected(
        parsed.selectedCategoryIds,
        parsed.knownCategoryIds,
        categoryIds,
      ),
      selectedSubcategoryIds: reconcileSelected(
        parsed.selectedSubcategoryIds,
        parsed.knownSubcategoryIds,
        subcategoryIds,
      ),
      clusterMarkers:
        typeof parsed.clusterMarkers === 'boolean' ? parsed.clusterMarkers : false,
      knownCategoryIds: categoryIds,
      knownSubcategoryIds: subcategoryIds,
    }
  } catch {
    return fallback
  }
}

export function saveViewState(
  viewState: ViewState,
  storage: Pick<Storage, 'setItem'> | undefined = safeStorage(),
) {
  if (!storage) return
  try {
    storage.setItem(VIEW_STATE_KEY, JSON.stringify(viewState))
  } catch {
    // localStorage 可能被瀏覽器停用；網站仍維持當次瀏覽狀態。
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}
