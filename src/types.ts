export interface Country {
  id: string
  name: string
}

export interface Region {
  id: string
  countryId: string
  name: string
  center: Coordinates
  zoom: number
}

export interface Subcategory {
  id: string
  name: string
  icon: string
}

export interface Category {
  id: string
  name: string
  color: string
  subcategories: Subcategory[]
}

export interface DefinitionsData {
  schemaVersion: number
  countries: Country[]
  regions: Region[]
  categories: Category[]
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface Place {
  uid: string
  id: string
  name: string
  countryId: string
  regionId: string
  categoryId: string
  subcategoryId: string
  coordinates: Coordinates
  googleMapsUrl: string
  address: string | null
  note: string
  rating: number | null
}

export interface PlacesData {
  schemaVersion: number
  places: Place[]
}

export interface ViewState {
  countryId: string | null
  regionId: string | null
  selectedCategoryIds: string[]
  selectedSubcategoryIds: string[]
  clusterMarkers: boolean
  knownCategoryIds: string[]
  knownSubcategoryIds: string[]
}
