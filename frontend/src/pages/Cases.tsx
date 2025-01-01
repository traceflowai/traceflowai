import { useState, useEffect, useCallback } from 'react';
import { Case } from '../types';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import CaseDetails from '../components/cases/CaseDetails';
import AddCaseModal from '../components/cases/AddCaseModal';
import { format } from 'date-fns';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';
import { ClipLoader } from 'react-spinners';
import { API_BASE_URL } from '../constants';

const statusCaseStyles = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  new: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(new Set());

  const handleStatusChange = async (caseId: string, newStatus: Case['status']) => {
    setUpdatingStatusIds(prev => new Set([...prev, caseId]));
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',  // Set the content type to JSON
        },
        body: JSON.stringify({ status: newStatus })}
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setCases((prev) =>
        prev.map((caseItem) =>
          caseItem.id === caseId ? { ...caseItem, status: newStatus } : caseItem
        )
      );
      setFilteredCases((prev) =>
        prev.map((caseItem) =>
          caseItem.id === caseId ? { ...caseItem, status: newStatus } : caseItem
        )
      );

      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUpdatingStatusIds(prev => {
        const next = new Set(prev);
        next.delete(caseId);
        return next;
      });
    }
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'source', header: 'Source' },
    {
      key: 'status',
      header: 'Status',
      render: (value: Case['status'], row: Case) => (
        <div className="flex items-center space-x-2">
          <select
            value={value}
            disabled={updatingStatusIds.has(row.id)}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleStatusChange(row.id, e.target.value as Case['status'])}
            className="rounded bg-gray-50 border-gray-300 text-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          >
            {Object.keys(statusCaseStyles).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          {updatingStatusIds.has(row.id) && (
            <ClipLoader size={16} color="#2563EB" />
          )}
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (value: Case['severity']) => <StatusBadge status={value} />,
    },
    { key: 'type', header: 'Type' },
    {
      key: 'timestamp',
      header: 'Date',
      render: (value: string) => format(new Date(value), 'MMM d, yyyy HH:mm'),
    },
  ];

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
      setFilteredCases(data);
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
    setIsAddingCase(true);
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
      setIsAddModalOpen(false);
      toast.success('Case added successfully');
    } catch (error) {
      toast.error('Failed to add case', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsAddingCase(false);
    }
  };

  const handleDeleteCase = async (item: Case) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${item.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete case');
      }
      setCases((prev) => prev.filter((c) => c.id !== item.id));
      setFilteredCases((prev) => prev.filter((c) => c.id !== item.id));
      toast.success('Case deleted successfully');
    } catch (error) {
      toast.error('Failed to delete case', {
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
    }, 300),
    [cases]
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Cases</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            A list of all cases in your account including their status, severity, and details.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex sm:items-center sm:space-x-2">
          {isAddingCase && (
            <ClipLoader color="#2563EB" loading={isAddingCase} size={20} />
          )}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Add case
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <ClipLoader color="#2563EB" loading={isLoading} size={35} />
        </div>
      ) : (
        <DataTable
          data={filteredCases}
          columns={columns}
          onRowClick={setSelectedCase}
          onDelete={handleDeleteCase}
          onSearch={debouncedSearch}
        />
      )}

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