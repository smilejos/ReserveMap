import { MapPinned, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { DefinitionsData } from '../types'

interface RegionDialogProps {
  definitions: DefinitionsData
  currentCountryId: string | null
  currentRegionId: string | null
  canClose: boolean
  onConfirm: (countryId: string, regionId: string) => void
  onClose: () => void
}

export function RegionDialog({
  definitions,
  currentCountryId,
  currentRegionId,
  canClose,
  onConfirm,
  onClose,
}: RegionDialogProps) {
  const titleId = useId()
  const [countryId, setCountryId] = useState(currentCountryId ?? '')
  const [regionId, setRegionId] = useState(currentRegionId ?? '')

  useEffect(() => {
    setCountryId(currentCountryId ?? '')
    setRegionId(currentRegionId ?? '')
  }, [currentCountryId, currentRegionId])

  const regions = definitions.regions.filter(
    (region) => region.countryId === countryId,
  )

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="region-dialog"
        role="dialog"
      >
        {canClose && (
          <button
            aria-label="關閉地區選擇"
            className="icon-button dialog-close"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        )}
        <div className="dialog-symbol" aria-hidden="true">
          <MapPinned size={25} />
        </div>
        <p className="eyebrow">開始探索</p>
        <h1 id={titleId}>今天想去哪裡？</h1>
        <p className="dialog-intro">先選擇國家，再挑一個要瀏覽的地區。</p>

        <div className="field-stack">
          <label htmlFor="country-select">國家</label>
          <select
            id="country-select"
            onChange={(event) => {
              setCountryId(event.target.value)
              setRegionId('')
            }}
            value={countryId}
          >
            <option value="">請選擇國家</option>
            {definitions.countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-stack">
          <label htmlFor="region-select">地區</label>
          <select
            disabled={!countryId}
            id="region-select"
            onChange={(event) => setRegionId(event.target.value)}
            value={regionId}
          >
            <option value="">
              {countryId ? '請選擇地區' : '請先選擇國家'}
            </option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="primary-button"
          disabled={!countryId || !regionId}
          onClick={() => onConfirm(countryId, regionId)}
          type="button"
        >
          開啟地圖
        </button>
      </section>
    </div>
  )
}
