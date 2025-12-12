import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  onClick?: () => void;
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  variant = "default",
  onClick 
}: StatsCardProps) => {
  const variants = {
    default: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300",
    success: "bg-gradient-to-br from-green-50 to-green-100 border-green-300",
    warning: "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300",
    danger: "bg-gradient-to-br from-red-50 to-red-100 border-red-300",
  };

  const iconVariants = {
    default: "text-blue-600 bg-blue-200",
    success: "text-green-600 bg-green-200",
    warning: "text-yellow-600 bg-yellow-200",
    danger: "text-red-600 bg-red-200",
  };

  const textVariants = {
    default: "text-blue-700",
    success: "text-green-700",
    warning: "text-yellow-700",
    danger: "text-red-700",
  };

  return (
    <div 
      className={cn(
        "rounded-xl border-2 p-4 sm:p-6 md:p-8 transition-all hover:shadow-xl hover:scale-105",
        variants[variant],
        onClick && "cursor-pointer active:scale-95"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs sm:text-sm font-semibold mb-1 md:mb-2 truncate", textVariants[variant])}>{title}</p>
          <p className={cn("text-2xl sm:text-3xl md:text-4xl font-bold", textVariants[variant])}>{value}</p>
        </div>
        <div className={cn("p-2 sm:p-3 md:p-4 rounded-xl ml-2", iconVariants[variant])}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
        </div>
      </div>
    </div>
  );
};
