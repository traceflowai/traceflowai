import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

const metrics = [
  {
    name: 'New Alerts',
    value: '24',
    change: '+4.75%',
    trend: 'up',
  },
  {
    name: 'Active Cases',
    value: '12',
    change: '-1.25%',
    trend: 'down',
  },
  {
    name: 'Weekly Resolution Rate',
    value: '85.6%',
    change: '+2.15%',
    trend: 'up',
  },
  {
    name: 'Blocked Numbers',
    value: '156',
    change: '+12.5%',
    trend: 'up',
  },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
              {metric.name}
            </dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-gray-900 dark:text-white">
                {metric.value}
              </div>

              <div
                className={clsx(
                  metric.trend === 'up'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                  'inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0'
                )}
              >
                {metric.trend === 'up' ? (
                  <ArrowUpIcon
                    className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-green-500 dark:text-green-400"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowDownIcon
                    className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-red-500 dark:text-red-400"
                    aria-hidden="true"
                  />
                )}
                {metric.change}
              </div>
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
}