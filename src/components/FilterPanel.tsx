import { ChevronDown, Layers3, SlidersHorizontal } from 'lucide-react'
import { CategoryIcon } from '../config/icons'
import type { Category } from '../types'

interface FilterPanelProps {
  categories: Category[]
  selectedCategoryIds: string[]
  selectedSubcategoryIds: string[]
  clusterMarkers: boolean
  onCategoriesChange: (ids: string[]) => void
  onSubcategoriesChange: (ids: string[]) => void
  onClusterMarkersChange: (enabled: boolean) => void
}

function ActionPair({
  label,
  onSelectAll,
  onClearAll,
}: {
  label: string
  onSelectAll: () => void
  onClearAll: () => void
}) {
  return (
    <div className="filter-actions" aria-label={`${label}快速操作`}>
      <button onClick={onSelectAll} type="button">
        全選
      </button>
      <span aria-hidden="true">·</span>
      <button onClick={onClearAll} type="button">
        取消
      </button>
    </div>
  )
}

export function FilterPanel({
  categories,
  selectedCategoryIds,
  selectedSubcategoryIds,
  clusterMarkers,
  onCategoriesChange,
  onSubcategoriesChange,
  onClusterMarkersChange,
}: FilterPanelProps) {
  const selectedCategories = new Set(selectedCategoryIds)
  const selectedSubcategories = new Set(selectedSubcategoryIds)
  const allCategoryIds = categories.map((category) => category.id)
  const enabledSubcategoryIds = categories
    .filter((category) => selectedCategories.has(category.id))
    .flatMap((category) =>
      category.subcategories.map((subcategory) => subcategory.id),
    )

  const toggleCategory = (id: string) => {
    onCategoriesChange(
      selectedCategories.has(id)
        ? selectedCategoryIds.filter((candidate) => candidate !== id)
        : allCategoryIds.filter(
            (candidate) =>
              selectedCategories.has(candidate) || candidate === id,
          ),
    )
  }

  const toggleSubcategory = (id: string) => {
    const allSubcategoryIds = categories.flatMap((category) =>
      category.subcategories.map((subcategory) => subcategory.id),
    )
    onSubcategoriesChange(
      selectedSubcategories.has(id)
        ? selectedSubcategoryIds.filter((candidate) => candidate !== id)
        : allSubcategoryIds.filter(
            (candidate) =>
              selectedSubcategories.has(candidate) || candidate === id,
          ),
    )
  }

  const updateCategorySubcategories = (category: Category, selected: boolean) => {
    const categoryIds = new Set(
      category.subcategories.map((subcategory) => subcategory.id),
    )
    const next = new Set(selectedSubcategoryIds)
    for (const id of categoryIds) {
      if (selected) next.add(id)
      else next.delete(id)
    }
    onSubcategoriesChange(
      categories
        .flatMap((item) => item.subcategories)
        .map((subcategory) => subcategory.id)
        .filter((id) => next.has(id)),
    )
  }

  return (
    <details className="filter-panel" open>
      <summary>
        <span>
          <SlidersHorizontal size={17} />
          分類篩選
        </span>
        <ChevronDown className="summary-chevron" size={17} />
      </summary>
      <div className="filter-body">
        <div className="filter-heading-row">
          <p>大類別</p>
          <ActionPair
            label="大類別"
            onClearAll={() => onCategoriesChange([])}
            onSelectAll={() => onCategoriesChange(allCategoryIds)}
          />
        </div>
        <div className="category-chips">
          {categories.map((category) => {
            const checked = selectedCategories.has(category.id)
            return (
              <label
                className={`category-chip${checked ? ' is-selected' : ''}`}
                key={category.id}
                style={{ '--category-color': category.color } as React.CSSProperties}
              >
                <input
                  checked={checked}
                  onChange={() => toggleCategory(category.id)}
                  type="checkbox"
                />
                <span className="chip-dot" />
                {category.name}
              </label>
            )
          })}
        </div>

        <div className="filter-heading-row subcategory-heading">
          <p>小類別</p>
          <ActionPair
            label="小類別"
            onClearAll={() => {
              const enabled = new Set(enabledSubcategoryIds)
              onSubcategoriesChange(
                selectedSubcategoryIds.filter((id) => !enabled.has(id)),
              )
            }}
            onSelectAll={() => {
              const selected = new Set([
                ...selectedSubcategoryIds,
                ...enabledSubcategoryIds,
              ])
              onSubcategoriesChange(
                categories
                  .flatMap((category) => category.subcategories)
                  .map((subcategory) => subcategory.id)
                  .filter((id) => selected.has(id)),
              )
            }}
          />
        </div>

        {selectedCategoryIds.length === 0 ? (
          <p className="filter-hint">請先選擇至少一個大類別。</p>
        ) : (
          <div className="subcategory-groups">
            {categories
              .filter((category) => selectedCategories.has(category.id))
              .map((category) => (
                <div className="subcategory-group" key={category.id}>
                  <div className="subcategory-group-title">
                    <span>{category.name}</span>
                    <ActionPair
                      label={`${category.name}小類別`}
                      onClearAll={() =>
                        updateCategorySubcategories(category, false)
                      }
                      onSelectAll={() => updateCategorySubcategories(category, true)}
                    />
                  </div>
                  <div className="subcategory-grid">
                    {category.subcategories.map((subcategory) => (
                      <label className="subcategory-option" key={subcategory.id}>
                        <input
                          checked={selectedSubcategories.has(subcategory.id)}
                          onChange={() => toggleSubcategory(subcategory.id)}
                          type="checkbox"
                        />
                        <span
                          className="subcategory-icon"
                          style={{ backgroundColor: category.color }}
                        >
                          <CategoryIcon iconKey={subcategory.icon} size={14} />
                        </span>
                        <span>{subcategory.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="clustering-toggle">
          <span className="clustering-icon" aria-hidden="true">
            <Layers3 size={17} />
          </span>
          <span className="clustering-copy">
            <strong>群組化地圖標記</strong>
            <small>縮小地圖時合併鄰近地點</small>
          </span>
          <button
            aria-checked={clusterMarkers}
            aria-label="切換地圖標記群組化"
            className="switch-control"
            onClick={() => onClusterMarkersChange(!clusterMarkers)}
            role="switch"
            type="button"
          >
            <span />
          </button>
        </div>
      </div>
    </details>
  )
}
