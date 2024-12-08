import { useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, BarChart, Settings } from 'lucide-react';
import NavButton from './NavButton';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: FileText },
  { name: 'Watchlist', href: '/watchlist', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">AML Dashboard</h1>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => (
          <NavButton
            key={item.name}
            icon={item.icon}
            label={item.name}
            active={location.pathname === item.href}
            href={item.href}
          />
        ))}
      </nav>
    </div>
  );
}