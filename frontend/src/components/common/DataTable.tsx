import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { Trash2, Filter } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  onDelete: (item: T) => void;
  onSearch: (search: string, filters: string[]) => void;
  filters?: string[];
}

export default function DataTable<T>({
  data = [],
  columns,
  onRowClick,
  onDelete,
  onSearch,
  filters = [],
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (filter: string) => {
    const updatedFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter((f) => f !== filter)
      : [...selectedFilters, filter];

    setSelectedFilters(updatedFilters);
    onSearch(searchQuery, updatedFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch(query, selectedFilters);
  };

  const handleSelectAllFilters = () => {
    const allSelected = selectedFilters.length === filters.length;
    const updatedFilters = allSelected ? [] : filters;
    setSelectedFilters(updatedFilters);
    onSearch(searchQuery, updatedFilters);
  };

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
      {/* Search bar and Filters */}
      <div className="mb-4 flex items-center space-x-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:ring-opacity-50"
          placeholder="Search..."
        />
        {filters.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className="px-4 py-2 flex items-center text-sm border border-gray-300 rounded-lg shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:ring-opacity-50"
            >
              <Filter className="mr-2" />
              Filters
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600">
                <div className="p-2">
                  <div
                    onClick={handleSelectAllFilters}
                    className="cursor-pointer px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    {selectedFilters.length === filters.length
                      ? 'Clear All'
                      : 'Select All'}
                  </div>
                  <hr className="my-2 border-gray-300 dark:border-gray-600" />
                  {filters.map((filter) => (
                    <label
                      key={filter}
                      className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={filter}
                        checked={selectedFilters.includes(filter)}
                        onChange={() => handleFilterChange(filter)}
                        className="text-blue-500 rounded focus:ring focus:ring-blue-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {filter}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('delete', item);
                    onDelete(item);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
