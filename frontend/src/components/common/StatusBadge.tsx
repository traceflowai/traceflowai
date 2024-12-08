import { clsx } from 'clsx';

type StatusType = 'low' | 'medium' | 'high' | 'open' | 'closed' | 'pending' | 'new' | 'reviewed' | 'resolved';

interface StatusBadgeProps {
  status: StatusType;
}

const statusStyles = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  new: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={clsx(
      statusStyles[status],
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize'
    )}>
      {status}
    </span>
  );
}