import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function readJson(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath)
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'))
  } catch (error) {
    throw new Error(`${relativePath} 無法讀取或不是合法 JSON：${error.message}`)
  }
}

const [definitions, placesData, definitionsSchema, placesSchema, iconKeys] =
  await Promise.all([
    readJson('data/definitions.json'),
    readJson('data/places.json'),
    readJson('schemas/definitions.schema.json'),
    readJson('schemas/places.schema.json'),
    readJson('src/config/iconKeys.json'),
  ])

const errors = []
const warnings = []
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

function reportSchemaErrors(file, validate) {
  if (validate()) return
  for (const error of validate.errors ?? []) {
    errors.push(`${file}${error.instancePath || '/'} ${error.message}`)
  }
}

const validateDefinitions = ajv.compile(definitionsSchema)
const validatePlaces = ajv.compile(placesSchema)
reportSchemaErrors('definitions.json', () => validateDefinitions(definitions))
reportSchemaErrors('places.json', () => validatePlaces(placesData))

function checkUnique(items, getKey, label) {
  const seen = new Set()
  for (const item of items) {
    const key = getKey(item)
    if (seen.has(key)) errors.push(`${label} 重複：${key}`)
    seen.add(key)
  }
}

const countries = Array.isArray(definitions.countries) ? definitions.countries : []
const regions = Array.isArray(definitions.regions) ? definitions.regions : []
const categories = Array.isArray(definitions.categories) ? definitions.categories : []
const places = Array.isArray(placesData.places) ? placesData.places : []

checkUnique(countries, (item) => item.id, '國家 ID')
checkUnique(regions, (item) => item.id, '地區 ID')
checkUnique(categories, (item) => item.id, '大類別 ID')
checkUnique(places, (item) => item.id, '地點 ID')
checkUnique(places, (item) => item.uid, '地點 UID')

const countryIds = new Set(countries.map((item) => item.id))
const regionById = new Map(regions.map((item) => [item.id, item]))
const categoryById = new Map(categories.map((item) => [item.id, item]))
const supportedIcons = new Set(iconKeys)
const allSubcategories = categories.flatMap((category) =>
  (category.subcategories ?? []).map((subcategory) => ({
    ...subcategory,
    categoryId: category.id,
  })),
)

checkUnique(allSubcategories, (item) => item.id, '小類別 ID')

for (const region of regions) {
  if (!countryIds.has(region.countryId)) {
    errors.push(`地區 ${region.id} 參照不存在的國家 ${region.countryId}`)
  }
  if (!region.id.startsWith(`${region.countryId}-`)) {
    errors.push(`地區 ${region.id} 的國家前綴與 countryId 不一致`)
  }
}

for (const subcategory of allSubcategories) {
  if (!supportedIcons.has(subcategory.icon)) {
    errors.push(
      `小類別 ${subcategory.id} 使用不支援的圖示鍵值 ${subcategory.icon}`,
    )
  }
}

function isAllowedGoogleMapsUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    if (host === 'maps.app.goo.gl') return true
    if (host === 'goo.gl') return url.pathname.startsWith('/maps')
    const allowedGoogleHosts = new Set([
      'google.com',
      'www.google.com',
      'maps.google.com',
      'google.com.tw',
      'www.google.com.tw',
      'maps.google.com.tw',
      'google.co.jp',
      'www.google.co.jp',
      'maps.google.co.jp',
    ])
    return allowedGoogleHosts.has(host) && url.pathname.startsWith('/maps')
  } catch {
    return false
  }
}

const googleMapsUrls = new Set()
for (const place of places) {
  const region = regionById.get(place.regionId)
  const category = categoryById.get(place.categoryId)

  if (!countryIds.has(place.countryId)) {
    errors.push(`${place.id} 參照不存在的國家 ${place.countryId}`)
  }
  if (!region) {
    errors.push(`${place.id} 參照不存在的地區 ${place.regionId}`)
  } else if (region.countryId !== place.countryId) {
    errors.push(`${place.id} 的地區 ${place.regionId} 不屬於 ${place.countryId}`)
  }
  if (!category) {
    errors.push(`${place.id} 參照不存在的大類別 ${place.categoryId}`)
  } else if (
    !category.subcategories.some(
      (subcategory) => subcategory.id === place.subcategoryId,
    )
  ) {
    errors.push(
      `${place.id} 的小類別 ${place.subcategoryId} 不屬於 ${place.categoryId}`,
    )
  }

  const expectedPrefix = `${place.countryId}-${place.categoryId}-`
  if (!place.id?.startsWith(expectedPrefix)) {
    errors.push(`${place.id} 的 ID 前綴應為 ${expectedPrefix}`)
  }

  if (!isAllowedGoogleMapsUrl(place.googleMapsUrl)) {
    errors.push(`${place.id} 的 googleMapsUrl 不是允許的 HTTPS Google Maps 網址`)
  } else {
    const normalizedUrl = new URL(place.googleMapsUrl).href
    if (googleMapsUrls.has(normalizedUrl)) {
      errors.push(`${place.id} 的 googleMapsUrl 與其他地點完全相同`)
    }
    googleMapsUrls.add(normalizedUrl)
  }
}

function normalizedName(value) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}\s]/gu, '')
}

function levenshtein(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0]
    row[0] = i
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j]
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
      )
      diagonal = above
    }
  }
  return row[right.length]
}

function namesAreSimilar(left, right) {
  const a = normalizedName(left)
  const b = normalizedName(right)
  if (!a || !b) return false
  if (a === b) return true
  if (Math.min(a.length, b.length) < 3) return false
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length) >= 0.85
}

function distanceInMeters(left, right) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const earthRadius = 6_371_000
  const deltaLat = radians(right.lat - left.lat)
  const deltaLng = radians(right.lng - left.lng)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(left.lat)) *
      Math.cos(radians(right.lat)) *
      Math.sin(deltaLng / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

for (let i = 0; i < places.length; i += 1) {
  for (let j = i + 1; j < places.length; j += 1) {
    const left = places[i]
    const right = places[j]
    if (left.regionId !== right.regionId) continue
    if (namesAreSimilar(left.name, right.name)) {
      warnings.push(`${left.id} 與 ${right.id} 在相同地區有相似名稱`)
    }
    const distance = distanceInMeters(left.coordinates, right.coordinates)
    if (distance < 50) {
      warnings.push(
        `${left.id} 與 ${right.id} 座標距離約 ${Math.round(distance)} 公尺，請確認是否重複`,
      )
    }
  }
}

for (const warning of warnings) console.warn(`警告：${warning}`)
if (errors.length > 0) {
  for (const error of errors) console.error(`錯誤：${error}`)
  console.error(`資料驗證失敗，共 ${errors.length} 個錯誤。`)
  process.exitCode = 1
} else {
  console.log(
    `資料驗證通過：${countries.length} 個國家、${regions.length} 個地區、${categories.length} 個大類別、${allSubcategories.length} 個小類別、${places.length} 個地點；${warnings.length} 個警告。`,
  )
}
