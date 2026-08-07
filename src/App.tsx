import {
  AlertTriangle,
  Compass,
  MapPinned,
  PanelBottomClose,
  PanelBottomOpen,
  Search,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FilterPanel } from './components/FilterPanel'
import { MapView } from './components/MapView'
import { PlacesList } from './components/PlacesList'
import { RegionDialog } from './components/RegionDialog'
import { loadReserveMapData } from './lib/data'
import { filterPlaces, sortPlaces } from './lib/filtering'
import { loadViewState, saveViewState } from './lib/storage'
import type { DefinitionsData, PlacesData, ViewState } from './types'

type DataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      definitions: DefinitionsData
      placesData: PlacesData
    }

function LoadingScreen() {
  return (
    <main className="centered-screen" role="status">
      <span className="brand-mark">
        <Compass size={24} />
      </span>
      <p className="eyebrow">ReserveMap</p>
      <h1>正在整理你的收藏地圖</h1>
      <span className="page-loader" />
    </main>
  )
}

function DataErrorScreen({ message }: { message: string }) {
  return (
    <main className="centered-screen error-screen" role="alert">
      <span className="brand-mark error-mark">
        <AlertTriangle size={24} />
      </span>
      <p className="eyebrow">資料載入失敗</p>
      <h1>目前無法讀取收藏資料</h1>
      <p>{message}</p>
      <button className="primary-button compact" onClick={() => location.reload()}>
        重新載入
      </button>
    </main>
  )
}

function ReserveMap({
  definitions,
  placesData,
}: {
  definitions: DefinitionsData
  placesData: PlacesData
}) {
  const [viewState, setViewState] = useState<ViewState>(() =>
    loadViewState(definitions),
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [regionDialogOpen, setRegionDialogOpen] = useState(!viewState.regionId)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)

  useEffect(() => saveViewState(viewState), [viewState])

  const currentRegion = definitions.regions.find(
    (region) => region.id === viewState.regionId,
  )
  const currentCountry = definitions.countries.find(
    (country) => country.id === viewState.countryId,
  )
  const regionPlaces = useMemo(
    () =>
      currentRegion
        ? placesData.places.filter((place) => place.regionId === currentRegion.id)
        : [],
    [currentRegion, placesData.places],
  )
  const visiblePlaces = useMemo(() => {
    if (!currentRegion) return []
    return sortPlaces(
      filterPlaces(placesData.places, {
        regionId: currentRegion.id,
        query: searchQuery,
        selectedCategoryIds: viewState.selectedCategoryIds,
        selectedSubcategoryIds: viewState.selectedSubcategoryIds,
      }),
      definitions,
    )
  }, [currentRegion, definitions, placesData.places, searchQuery, viewState])

  useEffect(() => {
    if (
      selectedPlaceId &&
      !visiblePlaces.some((place) => place.id === selectedPlaceId)
    ) {
      setSelectedPlaceId(null)
    }
  }, [selectedPlaceId, visiblePlaces])

  const selectPlace = useCallback((placeId: string | null) => {
    setSelectedPlaceId(placeId)
    if (placeId) setMobilePanelOpen(false)
  }, [])

  const updateCategories = useCallback((selectedCategoryIds: string[]) => {
    setViewState((state) => ({ ...state, selectedCategoryIds }))
  }, [])

  const updateSubcategories = useCallback(
    (selectedSubcategoryIds: string[]) => {
      setViewState((state) => ({ ...state, selectedSubcategoryIds }))
    },
    [],
  )

  const updateClusterMarkers = useCallback((clusterMarkers: boolean) => {
    setViewState((state) => ({ ...state, clusterMarkers }))
  }, [])

  const confirmRegion = (countryId: string, regionId: string) => {
    setViewState((state) => ({ ...state, countryId, regionId }))
    setSearchQuery('')
    setSelectedPlaceId(null)
    setRegionDialogOpen(false)
  }

  return (
    <main className="app-layout">
      <aside className={`sidebar${mobilePanelOpen ? ' is-open' : ''}`}>
        <button
          aria-expanded={mobilePanelOpen}
          aria-label={mobilePanelOpen ? '收合地點面板' : '展開地點面板'}
          className="mobile-panel-handle"
          onClick={() => setMobilePanelOpen((open) => !open)}
          type="button"
        >
          <span className="handle-bar" />
          {mobilePanelOpen ? (
            <PanelBottomClose size={18} />
          ) : (
            <PanelBottomOpen size={18} />
          )}
          <span>{mobilePanelOpen ? '收合清單' : `查看地點（${visiblePlaces.length}）`}</span>
        </button>

        <header className="sidebar-header">
          <div className="brand-row">
            <span className="brand-mark small">
              <Compass size={19} />
            </span>
            <div>
              <p className="brand-name">ReserveMap</p>
              <p className="brand-tagline">Places worth keeping</p>
            </div>
          </div>

          <button
            className="location-button"
            onClick={() => setRegionDialogOpen(true)}
            type="button"
          >
            <MapPinned size={18} />
            <span>
              <small>{currentCountry?.name ?? '尚未選擇'}</small>
              <strong>{currentRegion?.name ?? '選擇瀏覽地區'}</strong>
            </span>
            <span className="change-label">切換</span>
          </button>
        </header>

        <div className="sidebar-scroll">
          <div className="search-field">
            <Search aria-hidden="true" size={18} />
            <label className="sr-only" htmlFor="place-search">
              搜尋地點
            </label>
            <input
              id="place-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜尋名稱、ID、地址或備註"
              type="search"
              value={searchQuery}
            />
          </div>

          <FilterPanel
            categories={definitions.categories}
            clusterMarkers={viewState.clusterMarkers}
            onCategoriesChange={updateCategories}
            onClusterMarkersChange={updateClusterMarkers}
            onSubcategoriesChange={updateSubcategories}
            selectedCategoryIds={viewState.selectedCategoryIds}
            selectedSubcategoryIds={viewState.selectedSubcategoryIds}
          />

          <div className="results-heading">
            <p>收藏地點</p>
            <span>{visiblePlaces.length} 筆</span>
          </div>
          <PlacesList
            definitions={definitions}
            onSelect={(placeId) => selectPlace(placeId)}
            places={visiblePlaces}
            regionPlaceCount={regionPlaces.length}
            selectedPlaceId={selectedPlaceId}
          />
        </div>
      </aside>

      <div className="map-area">
        {currentRegion ? (
          <MapView
            clusterMarkers={viewState.clusterMarkers}
            definitions={definitions}
            onSelectPlace={selectPlace}
            places={visiblePlaces}
            region={currentRegion}
            selectedPlaceId={selectedPlaceId}
          />
        ) : (
          <section className="map-placeholder" aria-label="尚未選擇地區">
            <div className="placeholder-compass">
              <Compass size={32} />
            </div>
          </section>
        )}
      </div>

      {regionDialogOpen && (
        <RegionDialog
          canClose={Boolean(currentRegion)}
          currentCountryId={viewState.countryId}
          currentRegionId={viewState.regionId}
          definitions={definitions}
          onClose={() => setRegionDialogOpen(false)}
          onConfirm={confirmRegion}
        />
      )}
    </main>
  )
}

export default function App() {
  const [data, setData] = useState<DataState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    loadReserveMapData()
      .then(({ definitions, placesData }) => {
        if (!cancelled) setData({ status: 'ready', definitions, placesData })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setData({
            status: 'error',
            message: error instanceof Error ? error.message : '發生未知錯誤。',
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (data.status === 'loading') return <LoadingScreen />
  if (data.status === 'error') return <DataErrorScreen message={data.message} />
  return (
    <ReserveMap definitions={data.definitions} placesData={data.placesData} />
  )
}
