import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Gift,
  Laptop,
  TrendingUp,
  ArrowDownLeft,
  Coffee,
  Bus,
  Plane,
  Home,
  CreditCard,
  Wallet,
  Sparkles,
  Phone,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Gift,
  Laptop,
  TrendingUp,
  ArrowDownLeft,
  Coffee,
  Bus,
  Plane,
  Home,
  CreditCard,
  Wallet,
  Sparkles,
  Phone,
};

interface CategoryIconProps {
  iconName?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName = 'MoreHorizontal',
  color = '#10b981',
  size = 'md',
  className = '',
}) => {
  const IconComponent = iconMap[iconName] || MoreHorizontal;

  const sizeClasses = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`rounded-xl flex items-center justify-center shrink-0 transition-transform ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${color}18`,
        color: color,
      }}
    >
      <IconComponent className={iconSizes[size]} strokeWidth={2.2} />
    </div>
  );
};
