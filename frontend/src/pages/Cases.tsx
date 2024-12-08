import { useState } from 'react';
import { Case } from '../types';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import CaseDetails from '../components/cases/CaseDetails';
import { format } from 'date-fns';

const initialCases: Case[] = [
  {
    id: '1',
    source: '+1234567890',
    severity: 'high',
    status: 'open',
    type: 'Suspicious Transaction',
    timestamp: '2024-03-14T10:30:00Z',
    riskScore: 85,
    flaggedKeywords: ['unauthorized', 'suspicious', 'offshore'],
    actionsTaken: ['Initial Review'],
  },
  {
    id: '2',
    source: '+0987654321',
    severity: 'medium',
    status: 'pending',
    type: 'Unusual Pattern',
    timestamp: '2024-03-14T09:15:00Z',
    riskScore: 65,
    flaggedKeywords: ['multiple accounts', 'urgent'],
    actionsTaken: ['Automated Flag'],
  },
];

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
  const [cases, setCases] = useState<Case[]>(initialCases); // Use state for cases
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  function addCase(): void {
    const newCase: Case = {
      id: (cases.length + 1).toString(),
      source: '+1122334455',
      severity: 'medium',
      status: 'open',
      type: 'New Case Type',
      timestamp: new Date().toISOString(),
      riskScore: 50,
      flaggedKeywords: ['example', 'test'],
      actionsTaken: ['None'],
    };
    setCases([...cases, newCase]); // Update state to include the new case
  }

  return (
    <div className="space-y-6">
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
            onClick={() => addCase()}
            className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Add case
          </button>
        </div>
      </div>

      <DataTable
        data={cases} // Pass the state variable to DataTable
        columns={columns}
        onRowClick={setSelectedCase}
      />

      <CaseDetails
        caseData={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
}
