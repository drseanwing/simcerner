import { useState, useEffect, useRef } from 'react'

export interface AutocompleteItem {
  name: string
  type?: string
  category?: string
  [key: string]: string | undefined
}

interface AutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (item: AutocompleteItem) => void
  placeholder: string
  items: AutocompleteItem[]
  filterKey?: string
}

export function Autocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  items,
  filterKey = 'name',
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredItems = items.filter((item) => {
    const searchValue = value.toLowerCase()
    const fieldValue = item[filterKey]
    return (
      (fieldValue != null && fieldValue.toLowerCase().includes(searchValue)) ||
      (item.type != null && item.type.toLowerCase().includes(searchValue))
    )
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: AutocompleteItem) => {
    onSelect(item)
    setIsOpen(false)
    setSelectedIndex(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && filteredItems.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev,
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div className="autocomplete-container" ref={containerRef}>
      <input
        type="text"
        className="autocomplete-input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
          setSelectedIndex(0)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {isOpen && filteredItems.length > 0 && (
        <div className="autocomplete-dropdown">
          {filteredItems.map((item, index) => (
            <div
              key={index}
              className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {item[filterKey]}
              {item.type && (
                <span className="autocomplete-type">({item.type})</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
