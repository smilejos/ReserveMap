import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { AlertTriangle, Map as MapIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CategoryIcon } from '../config/icons'
import { loadGoogleMaps } from '../lib/googleMaps'
import type { DefinitionsData, Place, Region } from '../types'

interface MarkerEntry {
  marker: google.maps.marker.AdvancedMarkerElement
  root: Root
}

interface MapViewProps {
  definitions: DefinitionsData
  places: Place[]
  region: Region
  selectedPlaceId: string | null
  clusterMarkers: boolean
  onSelectPlace: (placeId: string | null) => void
}

function appendTextRow(container: HTMLElement, label: string, value: string) {
  const row = document.createElement('div')
  row.className = 'info-meta-row'
  const key = document.createElement('span')
  key.textContent = label
  const text = document.createElement('strong')
  text.textContent = value
  row.append(key, text)
  container.append(row)
}

function createInfoContent(place: Place, definitions: DefinitionsData) {
  const category = definitions.categories.find(
    (item) => item.id === place.categoryId,
  )
  const subcategory = category?.subcategories.find(
    (item) => item.id === place.subcategoryId,
  )
  const content = document.createElement('article')
  content.className = 'info-window'

  const categoryLabel = document.createElement('p')
  categoryLabel.className = 'info-category'
  categoryLabel.textContent = `${category?.name ?? place.categoryId} · ${subcategory?.name ?? place.subcategoryId}`
  const title = document.createElement('h2')
  title.textContent = place.name
  content.append(categoryLabel, title)

  if (place.note) {
    const note = document.createElement('p')
    note.className = 'info-note'
    note.textContent = place.note
    content.append(note)
  }
  if (place.rating !== null) {
    appendTextRow(content, '評分', `${place.rating} / 5`)
  }

  const idRow = document.createElement('div')
  idRow.className = 'info-id-row'
  const idText = document.createElement('code')
  idText.textContent = place.id
  const copyButton = document.createElement('button')
  copyButton.type = 'button'
  copyButton.textContent = '複製 ID'
  copyButton.setAttribute('aria-label', `複製地點 ID ${place.id}`)
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(place.id)
      copyButton.textContent = '已複製'
      window.setTimeout(() => {
        copyButton.textContent = '複製 ID'
      }, 1600)
    } catch {
      copyButton.textContent = '複製失敗'
    }
  })
  idRow.append(idText, copyButton)
  content.append(idRow)

  const link = document.createElement('a')
  link.className = 'maps-link'
  link.href = place.googleMapsUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = '在 Google Maps 開啟 ↗'
  content.append(link)
  return content
}

export function MapView({
  definitions,
  places,
  region,
  selectedPlaceId,
  clusterMarkers,
  onSelectPlace,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markerEntriesRef = useRef(new Map<string, MarkerEntry>())
  const [mapReady, setMapReady] = useState(false)
  const [markerRevision, setMarkerRevision] = useState(0)
  const [mapError, setMapError] = useState<string | null>(null)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()
  const mapId = import.meta.env.VITE_GOOGLE_MAP_ID?.trim() || 'DEMO_MAP_ID'

  useEffect(() => {
    let cancelled = false
    if (!apiKey) {
      setMapError('尚未設定 Google Maps API Key；地點清單與搜尋仍可正常使用。')
      return
    }

    loadGoogleMaps(apiKey)
      .then(async () => {
        await google.maps.importLibrary('marker')
        if (cancelled || !containerRef.current) return
        const map = new google.maps.Map(containerRef.current, {
          center: region.center,
          zoom: region.zoom,
          mapId,
          clickableIcons: false,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        })
        const infoWindow = new google.maps.InfoWindow({
          disableAutoPan: false,
          maxWidth: 320,
        })
        infoWindow.addListener('closeclick', () => onSelectPlace(null))
        mapRef.current = map
        infoWindowRef.current = infoWindow
        setMapReady(true)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMapError(
            error instanceof Error ? error.message : 'Google 地圖載入失敗。',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [apiKey, mapId, onSelectPlace])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    infoWindowRef.current?.close()
    map.setCenter(region.center)
    map.setZoom(region.zoom)
  }, [region])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    let cancelled = false
    const roots: Root[] = []

    const unmountLater = (root: Root) => {
      window.setTimeout(() => root.unmount(), 0)
    }

    const createMarkers = async () => {
      const { AdvancedMarkerElement } =
        (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary
      if (cancelled || !mapRef.current) return

      clustererRef.current?.clearMarkers()
      for (const entry of markerEntriesRef.current.values()) {
        entry.marker.map = null
        unmountLater(entry.root)
      }
      markerEntriesRef.current.clear()

      const markers = places.map((place) => {
        const category = definitions.categories.find(
          (item) => item.id === place.categoryId,
        )
        const subcategory = category?.subcategories.find(
          (item) => item.id === place.subcategoryId,
        )
        const content = document.createElement('button')
        content.type = 'button'
        content.className = 'map-marker'
        content.style.setProperty('--marker-color', category?.color ?? '#334155')
        content.setAttribute('aria-label', place.name)
        const root = createRoot(content)
        roots.push(root)
        root.render(
          <CategoryIcon iconKey={subcategory?.icon ?? 'map-pin'} size={18} />,
        )

        const marker = new AdvancedMarkerElement({
          position: place.coordinates,
          title: place.name,
          content,
          gmpClickable: true,
        })
        marker.addEventListener('gmp-click', () => onSelectPlace(place.id))
        markerEntriesRef.current.set(place.id, { marker, root })
        return marker
      })

      if (clusterMarkers) {
        clustererRef.current = new MarkerClusterer({
          map: mapRef.current,
          markers,
        })
      } else {
        for (const marker of markers) marker.map = mapRef.current
        clustererRef.current = null
      }
      setMarkerRevision((revision) => revision + 1)
    }

    void createMarkers()
    return () => {
      cancelled = true
      clustererRef.current?.clearMarkers()
      clustererRef.current = null
      for (const entry of markerEntriesRef.current.values()) {
        entry.marker.map = null
      }
      markerEntriesRef.current.clear()
      for (const root of roots) unmountLater(root)
    }
  }, [clusterMarkers, definitions, mapReady, onSelectPlace, places])

  useEffect(() => {
    const map = mapRef.current
    const infoWindow = infoWindowRef.current
    if (!map || !infoWindow) return
    if (!selectedPlaceId) {
      infoWindow.close()
      return
    }
    const place = places.find((item) => item.id === selectedPlaceId)
    const entry = markerEntriesRef.current.get(selectedPlaceId)
    if (!place || !entry) return

    map.panTo(place.coordinates)
    google.maps.event.addListenerOnce(map, 'idle', () => {
      infoWindow.setContent(createInfoContent(place, definitions))
      infoWindow.open({ map, anchor: entry.marker })
    })
  }, [definitions, markerRevision, places, selectedPlaceId])

  return (
    <section className="map-shell" aria-label={`${region.name}地圖`}>
      <div className="map-canvas" ref={containerRef} />
      {!mapReady && !mapError && (
        <div className="map-status" role="status">
          <span className="map-loader" />
          <strong>正在載入地圖</strong>
        </div>
      )}
      {mapError && (
        <div className="map-status map-error" role="alert">
          <span className="status-icon">
            <AlertTriangle size={21} />
          </span>
          <div>
            <strong>地圖暫時無法顯示</strong>
            <p>{mapError}</p>
          </div>
        </div>
      )}
      <div className="map-region-badge">
        <MapIcon size={15} />
        {region.name}
      </div>
    </section>
  )
}
