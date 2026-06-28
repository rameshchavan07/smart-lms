import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface BottomNavProps {
  items: NavItem[];
}

export const BottomNav: React.FC<BottomNavProps> = ({ items }) => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/student' || href === '/teacher' || href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href) && href !== '#';
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex justify-around items-center h-16 pb-safe">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            to={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              active ? 'text-[var(--brand-500)]' : 'text-muted hover:text-primary'
            } transition-colors`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
