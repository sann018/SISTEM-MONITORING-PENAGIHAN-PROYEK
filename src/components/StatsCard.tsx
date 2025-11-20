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
        "rounded-xl border-2 p-8 transition-all hover:shadow-xl hover:scale-105",
        variants[variant],
        onClick && "cursor-pointer active:scale-95"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm font-semibold mb-2", textVariants[variant])}>{title}</p>
          <p className={cn("text-4xl font-bold", textVariants[variant])}>{value}</p>
        </div>
        <div className={cn("p-4 rounded-xl", iconVariants[variant])}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
};
