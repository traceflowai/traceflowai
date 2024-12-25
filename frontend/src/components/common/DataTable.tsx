import { useState } from 'react';
import { clsx } from 'clsx';
import { Trash2 } from 'lucide-react';

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
  onSearch?: (search: string) => void;
}

export default function DataTable<T>({
  data = [], // Default to an empty array
  columns,
  onRowClick,
  onDelete,
  onSearch,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!sortColumn) return 0;
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      {/* Search bar */}
      <div className="mb-4">
        {onSearch?<input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch?.(e.target.value);
          }}
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:ring-opacity-50"
          placeholder="Search..."
        />:null}
      </div>

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
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {sortedData.map((item, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(item)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200"
                >
                  {column.render
                    ? column.render(item[column.key], item)
                    : item[column.key]}
                </td>
              ))}
              <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
