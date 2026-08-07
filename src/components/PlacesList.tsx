import { MapPinOff } from 'lucide-react'
import { CategoryIcon } from '../config/icons'
import type { DefinitionsData, Place } from '../types'

interface PlacesListProps {
  definitions: DefinitionsData
  places: Place[]
  regionPlaceCount: number
  selectedPlaceId: string | null
  onSelect: (placeId: string) => void
}

export function PlacesList({
  definitions,
  places,
  regionPlaceCount,
  selectedPlaceId,
  onSelect,
}: PlacesListProps) {
  if (places.length === 0) {
    return (
      <div className="empty-state">
        <MapPinOff size={24} />
        <strong>
          {regionPlaceCount === 0 ? '這個地區尚無收藏地點' : '沒有符合條件的地點'}
        </strong>
        <span>
          {regionPlaceCount === 0
            ? '之後可由 Hermes Agent 加入第一筆收藏。'
            : '試著調整搜尋文字或分類篩選。'}
        </span>
      </div>
    )
  }

  return (
    <div className="places-list">
      {definitions.categories.map((category) => {
        const categoryPlaces = places.filter(
          (place) => place.categoryId === category.id,
        )
        if (categoryPlaces.length === 0) return null
        return (
          <section className="place-category" key={category.id}>
            <h2>
              <span
                className="category-line"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
              <span className="group-count">{categoryPlaces.length}</span>
            </h2>
            {category.subcategories.map((subcategory) => {
              const subcategoryPlaces = categoryPlaces.filter(
                (place) => place.subcategoryId === subcategory.id,
              )
              if (subcategoryPlaces.length === 0) return null
              return (
                <div className="place-subcategory" key={subcategory.id}>
                  <h3>{subcategory.name}</h3>
                  {subcategoryPlaces.map((place) => (
                    <button
                      aria-pressed={selectedPlaceId === place.id}
                      className={`place-row${selectedPlaceId === place.id ? ' is-active' : ''}`}
                      key={place.uid}
                      onClick={() => onSelect(place.id)}
                      type="button"
                    >
                      <span
                        className="place-row-icon"
                        style={{ backgroundColor: category.color }}
                      >
                        <CategoryIcon iconKey={subcategory.icon} size={16} />
                      </span>
                      <span className="place-row-copy">
                        <strong>{place.name}</strong>
                        <span>{place.id}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
