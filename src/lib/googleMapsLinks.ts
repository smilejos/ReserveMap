import type { Coordinates } from '../types'

interface GoogleMapsPlaceLink {
  coordinates: Coordinates
  googleMapsUrl: string
}

function isGoogleMapsShortUrl(url: URL) {
  return (
    url.hostname === 'maps.app.goo.gl' ||
    (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps/'))
  )
}

export function getGoogleMapsOpenUrl(place: GoogleMapsPlaceLink) {
  try {
    const originalUrl = new URL(place.googleMapsUrl)
    if (!isGoogleMapsShortUrl(originalUrl)) return place.googleMapsUrl
  } catch {
    return place.googleMapsUrl
  }

  const mapsUrl = new URL('https://www.google.com/maps/search/')
  mapsUrl.searchParams.set('api', '1')
  mapsUrl.searchParams.set(
    'query',
    `${place.coordinates.lat},${place.coordinates.lng}`,
  )
  return mapsUrl.toString()
}
