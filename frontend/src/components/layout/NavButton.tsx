import { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavButtonProps {
  icon: ComponentType<{ size: number; className?: string }>;
  label: string;
  active: boolean;
  href: string;
}

export default function NavButton({ icon: Icon, label, active, href }: NavButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
        active 
          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      onClick={() => navigate(href)}
    >
      <Icon size={20} className="mr-3" />
      {label}
    </button>
  );
}