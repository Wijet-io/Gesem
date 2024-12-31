import React from 'react';
import Button from './Button';

interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="md:flex md:items-center md:justify-between mb-8">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
          {title}
        </h1>
        {description && (
          <div className="mt-1 text-sm text-gray-500">{description}</div>
        )}
      </div>
      {action && (
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}