
import React from 'react';
import { Truck, Users, Car, Building2, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    activeTrips: number;
    totalTrips: number;
    contractors: number;
    drivers: number;
    vehicles: number;
  };
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  iconBgClass = "bg-primary/10 text-primary"
}) => (
  <div className="stat-card group">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="stat-card-label">{title}</p>
        <p className="stat-card-value">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend.isPositive ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
      <div className={`stat-card-icon ${iconBgClass}`}>
        {icon}
      </div>
    </div>
  </div>
);

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        title="Активные рейсы"
        value={stats.activeTrips}
        subtitle={`из ${stats.totalTrips} всего`}
        icon={<Truck className="h-5 w-5" />}
        iconBgClass="bg-primary/10 text-primary"
      />
      
      <StatCard
        title="Контрагенты"
        value={stats.contractors}
        subtitle="в базе"
        icon={<Building2 className="h-5 w-5" />}
        iconBgClass="bg-emerald-500/10 text-emerald-600"
      />
      
      <StatCard
        title="Водители"
        value={stats.drivers}
        subtitle="активных"
        icon={<Users className="h-5 w-5" />}
        iconBgClass="bg-amber-500/10 text-amber-600"
      />
      
      <StatCard
        title="Транспорт"
        value={stats.vehicles}
        subtitle="в парке"
        icon={<Car className="h-5 w-5" />}
        iconBgClass="bg-purple-500/10 text-purple-600"
      />
    </div>
  );
};
