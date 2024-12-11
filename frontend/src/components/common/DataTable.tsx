import { useState } from 'react';
import { clsx } from 'clsx';
import { Pen, Pencil, Trash2 } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  onDelete?: (item: T) => void;
  onEdit?: (item: T) => void; // New prop for edit functionality
}

export default function DataTable<T>({
  data,
  columns,
  onRowClick,
  onDelete,
  onEdit,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle sorting logic
  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort data based on the selected column and direction
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0; // No sorting if no column is selected
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                onClick={() => handleSort(column.key)}
                className={clsx(
                  'px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white',
                  'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {column.header}
                {sortColumn === column.key && (
                  <span className="ml-2 text-xs">
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
            ))}
            {/* Add a header for the action buttons */}
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {sortedData.map((item, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(item)}
              className={clsx(
                'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  {column.render
                    ? column.render(item[column.key], item)
                    : String(item[column.key])}
                </td>
              ))}
              {/* Action buttons for edit and delete */}
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 flex space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering row click
                    onEdit?.(item);
                  }}
                  className="text-blue-500 hover:text-blue-700"
                  title="Edit"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering row click
                    onDelete?.(item);
                  }}
                  className="text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
