import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md text-center">
        <p className="text-lg font-medium text-gray-300">{title}</p>
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
};
