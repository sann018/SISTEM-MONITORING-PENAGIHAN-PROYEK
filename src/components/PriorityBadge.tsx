import { memo } from 'react';
import { Badge } from '@/components/ui/badge';

type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

interface PriorityBadgeProps {
  level: PriorityLevel;
  icon?: string;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

const priorityConfigs = {
  critical: {
    label: 'Kritis',
    icon: '🚨',
    className: 'bg-red-600 text-white hover:bg-red-700 border-red-700',
  },
  high: {
    label: 'Tinggi',
    icon: '🔴',
    className: 'bg-orange-500 text-white hover:bg-orange-600 border-orange-600',
  },
  medium: {
    label: 'Menengah',
    icon: '🟡',
    className: 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-600',
  },
  low: {
    label: 'Rendah',
    icon: '🔵',
    className: 'bg-blue-500 text-white hover:bg-blue-600 border-blue-600',
  },
  none: {
    label: 'Tidak Ada',
    icon: '⚪',
    className: 'bg-gray-300 text-gray-700 hover:bg-gray-400 border-gray-400',
  },
};

// ✅ OPTIMIZED: Wrapped with React.memo to prevent unnecessary re-renders
export const PriorityBadge = memo(function PriorityBadge({ 
  level, 
  icon, 
  label, 
  className,
  showIcon = true 
}: PriorityBadgeProps) {
  const config = priorityConfigs[level] || priorityConfigs.none;
  
  return (
    <Badge className={`${config.className} ${className || ''}`}>
      {showIcon && (icon || config.icon)} {label || config.label}
    </Badge>
  );
});

// Helper untuk source badge
interface PrioritySourceBadgeProps {
  source: string | null;
  className?: string;
}

export function PrioritySourceBadge({ source, className }: PrioritySourceBadgeProps) {
  if (!source || source === 'manual') {
    return (
      <Badge variant="outline" className={`text-xs ${className || ''}`}>
        👤 Manual
      </Badge>
    );
  }
  
  const sourceConfigs: Record<string, { label: string; icon: string }> = {
    auto_deadline: { label: 'Auto: Deadline', icon: '⏰' },
    auto_overdue: { label: 'Auto: Overdue', icon: '⚠️' },
    auto_blocked: { label: 'Auto: Stuck', icon: '🚫' },
    system: { label: 'System', icon: '⚙️' },
  };
  
  const config = sourceConfigs[source] || { label: source, icon: '🤖' };
  
  return (
    <Badge variant="outline" className={`text-xs ${className || ''}`}>
      {config.icon} {config.label}
    </Badge>
  );
}

// Helper untuk dropdown options
export const priorityOptions: { value: PriorityLevel; label: string; icon: string }[] = [
  { value: 'critical', label: 'Kritis', icon: '🚨' },
  { value: 'high', label: 'Tinggi', icon: '🔴' },
  { value: 'medium', label: 'Menengah', icon: '🟡' },
  { value: 'low', label: 'Rendah', icon: '🔵' },
  { value: 'none', label: 'Tidak Ada', icon: '⚪' },
];
