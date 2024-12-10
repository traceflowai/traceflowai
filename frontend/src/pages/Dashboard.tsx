import React from 'react';
import { FileAudio, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { name: 'Jan', cases: 12 },
  { name: 'Feb', cases: 19 },
  { name: 'Mar', cases: 15 },
  { name: 'Apr', cases: 25 },
  { name: 'May', cases: 22 },
  { name: 'Jun', cases: 30 },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Cases"
          value={123}
          icon={FileAudio}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Tracked Individuals"
          value={45}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="High Risk Cases"
          value={8}
          icon={AlertCircle}
          trend={{ value: 2, isPositive: false }}
        />
        <StatCard
          title="Case Resolution Rate"
          value="78%"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Case Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cases" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}