import { useState } from 'react';
import { WatchlistEntry } from '../types';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { format } from 'date-fns';

const mockWatchlist: WatchlistEntry[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+1234567890',
    riskLevel: 'high',
    lastMentioned: '2024-03-14T10:30:00Z',
  },
  // Add more mock entries as needed
];

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'phone', header: 'Phone Number' },
  {
    key: 'riskLevel',
    header: 'Risk Level',
    render: (value: WatchlistEntry['riskLevel']) => <StatusBadge status={value} />,
  },
  {
    key: 'lastMentioned',
    header: 'Last Mentioned',
    render: (value: string) => format(new Date(value), 'MMM d, yyyy HH:mm'),
  },
];

export default function Watchlist() {
  const [selectedEntry, setSelectedEntry] = useState<WatchlistEntry | null>(null);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Watchlist</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor and manage flagged individuals and entities.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-primary-500"
          >
            Add to watchlist
          </button>
        </div>
      </div>

      <DataTable
        data={mockWatchlist}
        columns={columns}
        onRowClick={setSelectedEntry}
      />
    </div>
  );
}