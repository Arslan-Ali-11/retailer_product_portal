import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, trend, color = "text-blue-600", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 active:scale-[0.98]' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-gray-50 ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default MetricCard;