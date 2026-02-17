/**
 * @file DataTable.tsx
 * @description Reusable data table component for clinical data display.
 *
 * Used across results, orders, medications, and other tabular views
 * in the SimCerner EMR. Supports custom column widths, alternating row
 * colours, hover highlighting, row click handlers, and custom cell renderers.
 */

import type { ReactNode } from 'react';
import '../../styles/components/common.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Column definition for the DataTable. */
export interface DataTableColumn {
  /** Object key used to look up the value from each data row. */
  key: string;
  /** Display header label for the column. */
  label: string;
  /** Optional fixed CSS width for the column (e.g. "120px", "20%"). */
  width?: string;
}

/** Props accepted by the DataTable component. */
export interface DataTableProps {
  /** Array of column definitions describing the table structure. */
  columns: DataTableColumn[];
  /** Array of data records — each record is a key→value map. */
  data: Array<Record<string, unknown>>;
  /**
   * Optional callback when a data row is clicked.
   * Receives the row data and its index.
   */
  onRowClick?: (row: Record<string, unknown>, index: number) => void;
  /**
   * Optional custom cell renderer. Return a ReactNode to override
   * the default string rendering for a cell.
   *
   * @param value  - The raw cell value from the data record.
   * @param column - The column definition for this cell.
   * @param row    - The full data record for the row.
   */
  renderCell?: (
    value: unknown,
    column: DataTableColumn,
    row: Record<string, unknown>,
  ) => ReactNode | undefined;
  /** Optional CSS class name added to the <table> element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DataTable renders a styled HTML table with sticky column headers,
 * alternating row colours, hover effects, and optional row click behaviour.
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={[
 *     { key: 'test', label: 'Test', width: '200px' },
 *     { key: 'value', label: 'Value' },
 *     { key: 'unit', label: 'Unit' },
 *   ]}
 *   data={results}
 * />
 * ```
 */
export default function DataTable({
  columns,
  data,
  onRowClick,
  renderCell,
  className,
}: DataTableProps) {
  return (
    <table className={`data-table${className ? ` ${className}` : ''}`}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={col.width ? { width: col.width } : undefined}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              No data available
            </td>
          </tr>
        ) : (
          data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={onRowClick ? 'clickable' : undefined}
              onClick={onRowClick ? () => onRowClick(row, rowIdx) : undefined}
            >
              {columns.map((col) => {
                const value = row[col.key];
                const customCell = renderCell?.(value, col, row);

                return (
                  <td key={col.key}>
                    {customCell !== undefined ? customCell : String(value ?? '')}
                  </td>
                );
              })}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
