/**
 * @file Autocomplete.tsx
 * @description Autocomplete input component with keyboard navigation and dropdown.
 *
 * Migrated from the Autocomplete utility in emr-sim-v2.html. Supports
 * filtering items by a configurable key, keyboard navigation (arrow
 * up/down, Enter, Escape), and click-outside-to-close behaviour.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import '../../styles/components/common.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by the Autocomplete component. */
export interface AutocompleteProps<T extends Record<string, unknown>> {
  /** Current text value of the input. */
  value: string;
  /** Callback when the input text changes. */
  onChange: (value: string) => void;
  /** Callback when an item is selected from the dropdown. */
  onSelect: (item: T) => void;
  /** Placeholder text for the input when empty. */
  placeholder?: string;
  /** Full list of items to filter against. */
  items: T[];
  /**
   * Key on each item used for filtering and display.
   * The value at this key is coerced to string for comparison.
   */
  filterKey: keyof T & string;
  /** Optional CSS class added to the container. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Autocomplete provides a text input with a filterable dropdown of suggestions.
 * Keyboard navigation is supported: ArrowUp/ArrowDown to move the highlight,
 * Enter to select, Escape to close the dropdown.
 */
export default function Autocomplete<T extends Record<string, unknown>>({
  value,
  onChange,
  onSelect,
  placeholder = '',
  items,
  filterKey,
  className,
}: AutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Filtered items matching the current input value. */
  const filtered = useMemo(() => {
    if (!value.trim()) return items;
    const query = value.toLowerCase();
    return items.filter((item) =>
      String(item[filterKey]).toLowerCase().includes(query),
    );
  }, [value, items, filterKey]);

  /** Close the dropdown when clicking outside the container. */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Reset highlight when the filtered list changes. */
  useEffect(() => {
    setHighlightIndex(-1);
  }, [filtered.length]);

  /** Handle keyboard navigation within the dropdown. */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown') {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < filtered.length) {
            handleSelect(filtered[highlightIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightIndex(-1);
          break;
      }
    },
    [isOpen, highlightIndex, filtered],
  );

  /** Select an item, fire the callback, and close the dropdown. */
  const handleSelect = (item: T) => {
    onSelect(item);
    onChange(String(item[filterKey]));
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className={`autocomplete-container${className ? ` ${className}` : ''}`}
    >
      <input
        ref={inputRef}
        className="autocomplete-input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {isOpen && filtered.length > 0 && (
        <div className="autocomplete-dropdown">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className={`autocomplete-item${idx === highlightIndex ? ' highlighted' : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              {String(item[filterKey])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
