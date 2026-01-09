import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  actions,
  icon
}) => {
  return (
    <div className="page-header animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="page-header-title">{title}</h1>
            {description && (
              <p className="page-header-description">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
