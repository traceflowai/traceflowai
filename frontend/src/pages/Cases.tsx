import { useState, useEffect, useCallback } from 'react';
import { Case } from '../types';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import CaseDetails from '../components/cases/CaseDetails';
import AddCaseModal from '../components/cases/AddCaseModal';
import { format } from 'date-fns';
import { toast, Toaster } from 'sonner'; // Recommended for better notifications
import debounce from 'lodash/debounce';

const API_BASE_URL = 'http://localhost:8000';

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'source', header: 'Source' },
  {
    key: 'severity',
    header: 'Severity',
    render: (value: Case['severity']) => <StatusBadge status={value} />,
  },
  {
    key: 'status',
    header: 'Status',
    render: (value: Case['status']) => <StatusBadge status={value} />,
  },
  { key: 'type', header: 'Type' },
  {
    key: 'timestamp',
    header: 'Date',
    render: (value: string) => format(new Date(value), 'MMM d, yyyy HH:mm'),
  },
];

export default function Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cases`, {
        method: 'GET',
        mode: 'cors',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      const data = await response.json();
      setCases(data);
      setFilteredCases(data); // Initialize filtered cases
    } catch (error) {
      toast.error('Failed to fetch cases', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleAddCase = async (formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to add case');
      }

      const createdCase = await response.json();
      setCases((prev) => [...prev, createdCase]);
      setFilteredCases((prev) => [...prev, createdCase]);
      toast.success('Case added successfully');
    } catch (error) {
      toast.error('Failed to add case', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const debouncedSearch = useCallback(
    debounce((query) => {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = cases.filter((caseItem) =>
        caseItem.flaggedKeywords.some((keyword) =>
          keyword.toLowerCase().includes(lowerCaseQuery)
        ) ||
        caseItem.source.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredCases(filtered);
    }, 300), // 300ms delay
    [cases]
  );

  return (
    <div className="space-y-6">
      {isLoading && <div>Loading cases...</div>}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Cases</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            A list of all cases in your account including their status, severity, and details.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Add case
          </button>
        </div>
      </div>

      <DataTable
        data={filteredCases}
        columns={columns}
        onRowClick={setSelectedCase}
        onDelete={async (item) => {
          const response = await fetch(`${API_BASE_URL}/cases/${item.id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error('Failed to delete case');
          }
          setCases((prev) => prev.filter((c) => c.id !== item.id));
          setFilteredCases((prev) => prev.filter((c) => c.id !== item.id));
          toast.success('Case deleted successfully');
        }}
        onSearch={debouncedSearch}
      />

      {selectedCase && (
        <CaseDetails
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}

      <AddCaseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCase}
      />
    </div>
  );
}
