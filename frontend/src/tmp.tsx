import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Search, 
  Bell, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Ban,
  PhoneCall,
  ArrowRight,
  BarChart
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Label } from 'recharts';
import { Button } from './components/ui/button';

const activityData = [
  { name: 'Mon', alerts: 24, resolved: 18 },
  { name: 'Tue', alerts: 18, resolved: 12 },
  { name: 'Wed', alerts: 32, resolved: 25 },
  { name: 'Thu', alerts: 27, resolved: 20 },
  { name: 'Fri', alerts: 45, resolved: 38 },
  { name: 'Sat', alerts: 12, resolved: 10 },
  { name: 'Sun', alerts: 8, resolved: 5 },
];

const riskDistribution = [
  { category: 'High Risk', value: 35 },
  { category: 'Medium Risk', value: 45 },
  { category: 'Low Risk', value: 20 }
];

const recentCases = [
  {
    id: 1,
    severity: 'High',
    source: '+1 (555) 0123',
    type: 'Suspicious Keywords',
    timestamp: '10 min ago',
    status: 'New',
    details: 'Multiple high-value transactions mentioned'
  },
  {
    id: 2,
    severity: 'Medium',
    source: '+1 (555) 0456',
    type: 'Pattern Match',
    timestamp: '25 min ago',
    status: 'In Review',
    details: 'Repeated references to offshore accounts'
  },
  {
    id: 3,
    severity: 'High',
    source: '+1 (555) 0789',
    type: 'Entity Detection',
    timestamp: '1 hour ago',
    status: 'Escalated',
    details: 'Known suspicious entity detected'
  }
];

const DesktopInvestigatorDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState(null);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const NavButton = ({ icon: Icon, label, active }: { icon: React.ComponentType<{ size: number, className?: string }>, label: string, active: boolean }) => (
    <button
      className={`flex items-center w-full p-3 rounded-lg ${
        active ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab(label.toLowerCase())}
    >
      <Icon size={20} className="mr-3" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r p-4">
        <div className="flex items-center mb-8">
          <AlertTriangle className="text-blue-600 mr-2" size={24} />
          <h1 className="text-xl font-bold">AML Monitor</h1>
        </div>
        
        <nav className="space-y-2">
          <NavButton icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} />
          <NavButton icon={FileText} label="Cases" active={activeTab === 'cases'} />
          <NavButton icon={Users} label="Watchlist" active={activeTab === 'watchlist'} />
          <NavButton icon={BarChart} label="Reports" active={activeTab === 'reports'} />
          <NavButton icon={Settings} label="Settings" active={activeTab === 'settings'} />
        </nav>
</div>

    {/* Main Content */}
    <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
            {/* Search and Notifications */}
            <div className="flex items-center flex-1 space-x-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                type="text"
                placeholder="Search cases, alerts, or phone numbers..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            {/* Notifications */}
            <button className="p-2 relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            </div>

            {/* Logout Button */}
            <button className="flex items-center p-3 rounded-lg bg-white text-black shadow-md">
                <LogOut size={20} className="mr-3" />Logout
            </button>
        </div>
        </div>


        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Alerts</p>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-sm text-green-600">+12% from yesterday</p>
                  </div>
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Cases</p>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-yellow-600">4 requiring attention</p>
                  </div>
                  <Clock className="text-yellow-500" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Weekly Resolution Rate</p>
                    <p className="text-2xl font-bold">87%</p>
                    <p className="text-sm text-green-600">+5% from last week</p>
                  </div>
                  <CheckCircle className="text-green-500" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Blocked Numbers</p>
                    <p className="text-2xl font-bold">48</p>
                    <p className="text-sm text-gray-600">Last blocked: 2h ago</p>
                  </div>
                  <Ban className="text-gray-500" size={24} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="alerts" stroke="#3b82f6" strokeWidth={2} name="New Alerts" />
                      <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={riskDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCases.map((caseItem) => (
                  <div 
                    key={caseItem.id} 
                    className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCase(caseItem)}
                  >
                    <div className="flex items-center space-x-4">
                      <PhoneCall className="text-gray-400" size={20} />
                      <div>
                        <p className="font-medium">{caseItem.source}</p>
                        <p className="text-sm text-gray-500">{caseItem.type}</p>
                        <p className="text-sm text-gray-600 mt-1">{caseItem.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(caseItem.severity)}`}>
                        {caseItem.severity}
                      </span>
                      <span className="text-sm text-gray-500">{caseItem.timestamp}</span>
                      <ArrowRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DesktopInvestigatorDashboard;