import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import AddUserModal from '../components/watchlist/AddUserModal';
import { toast, Toaster } from 'sonner'; // For notifications
import { format } from 'date-fns';
import debounce from 'lodash/debounce';
import { API_BASE_URL } from '../constants';

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'user_id', header: 'User ID' },
  { key: 'name', header: 'Name' },
  { key: 'phoneNumber', header: 'Phone Number' },
  {
    key: 'riskLevel',
    header: 'Risk Level',
    render: (value: string) => <StatusBadge status={value} />,
  },
  {
    key: 'lastMentioned',
    header: 'Last Mentioned',
    render: (value: string) => format(new Date(value), 'MMM d, yyyy HH:mm'),
  },
];

export default function Watchlist() {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/watchlist`, { method: 'GET' });
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }
      const data = await response.json();
      setEntries(data);
      setFilteredEntries(data); // Initialize filtered entries
    } catch (error) {
      toast.error('Failed to fetch entries', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAddEntry = async (formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/watchlist`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to add entry');
      }

      const newEntry = await response.json();
      setEntries((prev) => [...prev, newEntry]);
      setFilteredEntries((prev) => [...prev, newEntry]); // Update filtered entries
      toast.success('Entry added successfully');
    } catch (error) {
      toast.error('Failed to add entry', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleDeleteEntry = async (entryToDelete: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/watchlist/${entryToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      setEntries((prev) => prev.filter((entry) => entry.id !== entryToDelete.id));
      setFilteredEntries((prev) => prev.filter((entry) => entry.id !== entryToDelete.id)); // Update filtered entries
      toast.success('Entry deleted successfully');
    } catch (error) {
      toast.error('Failed to delete entry', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const debouncedSearch = useCallback(
    debounce((query) => {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = entries.filter((entry) =>
        entry.name.toLowerCase().includes(lowerCaseQuery) ||
        entry.phoneNumber.toLowerCase().includes(lowerCaseQuery) ||
        entry.user_id.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredEntries(filtered);
    }, 300),
    [entries]
  );

  return (
    <div className="space-y-6">
      {isLoading && <div>Loading entries...</div>}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Watchlist</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            A list of individuals and their associated risk levels.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Add Entry
          </button>
        </div>
      </div>

      <DataTable
        data={filteredEntries}
        columns={columns}
        onDelete={handleDeleteEntry}
        onSearch={debouncedSearch}
      />

      <Toaster />
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEntry}
      />
    </div>
  );
}
