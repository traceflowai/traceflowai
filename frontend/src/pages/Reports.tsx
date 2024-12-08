import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const mockData = [
  { month: 'Jan', alerts: 65, resolved: 52 },
  { month: 'Feb', alerts: 78, resolved: 61 },
  { month: 'Mar', alerts: 92, resolved: 85 },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState('month');

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and analyze AML activity trends and statistics.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-primary-500"
          >
            Download Report
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Alert Trends</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="alerts" fill="#0ea5e9" name="New Alerts" />
              <Bar dataKey="resolved" fill="#22c55e" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}