import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '../components/NotificationBell';import { 
  LayoutDashboard, BookOpen, Users, ClipboardList, 
  BarChart3, MessageSquare, Settings, HelpCircle, 
  LogOut, Menu, X, Search, Bell, Moon, Sun, Mail,
  ChevronRight, GraduationCap, Plus
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',     href: '/teacher',          icon: LayoutDashboard },
  { label: 'Courses',       href: '/teacher/courses',  icon: BookOpen },
  { label: 'Students',      href: '/teacher/students', icon: Users },
  { label: 'Enrollments',   href: '#',                 icon: GraduationCap },
  { label: 'Assessments',   href: '#',                 icon: ClipboardList },
  { label: 'Reports',       href: '#',                 icon: BarChart3 },
  { label: 'Communication', href: '#',                 icon: MessageSquare, badge: 3 },
  { label: 'Settings',      href: '#',                 icon: Settings },
];

const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/teacher' ? location.pathname === href : location.pathname.startsWith(href) && href !== '#';

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = `${user?.firstName?.[0] || 'T'}${user?.lastName?.[0] || 'P'}`;
  const fullName = `${user?.firstName || 'Teacher'} ${user?.lastName || ''}`;

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'dark' : ''}`} style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-brand flex-shrink-0" style={{ background: 'var(--brand-500)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-none">OpenLearnX</p>
            <p className="text-white/40 text-[11px] mt-0.5">Teacher Portal</p>
          </div>
          <button 
            className="ml-auto lg:hidden text-white/40 hover:text-white" 
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto hide-scrollbar py-3">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-5 mb-2">Menu</p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`sidebar-link ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-500)' }}>
                    {item.badge}
                  </span>
                )}
                {active && <ChevronRight className="w-4 h-4 opacity-50" />}
              </Link>
            );
          })}

          <div className="mx-3 mt-4">
            <button className="w-full btn btn-primary btn-sm justify-start gap-2">
              <Plus className="w-4 h-4" />
              Add New Course
            </button>
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/5 p-3 space-y-1">
          <Link to="#" className="sidebar-link">
            <HelpCircle className="w-5 h-5" />
            Support
          </Link>
          <button onClick={handleLogout} className="sidebar-link text-red-400 hover:text-red-300 w-full text-left flex items-center">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
            <div className="avatar avatar-sm text-white" style={{ background: 'rgba(255,255,255,0.1)' }}>{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-semibold leading-none truncate">{fullName}</p>
              <p className="text-white/40 text-[11px] mt-0.5">Teacher</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="glass sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6 h-16 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="hidden sm:block lg:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-sm hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search courses, students..."
              className="input pl-9 py-2 text-[13px] h-9"
              aria-label="Search"
            />
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={toggleDark} className="btn btn-ghost p-2 rounded-xl" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title="Toggle theme">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationBell />
            <button className="btn btn-ghost p-2 rounded-xl hidden sm:flex" aria-label="Messages">
              <Mail className="w-5 h-5" />
            </button>
            <div className="w-px h-6 mx-1 hidden sm:block" style={{ background: 'var(--border)' }} />
            <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="User profile">
              <div className="avatar avatar-sm font-bold" style={{ background: 'rgba(67,97,240,0.1)', color: 'var(--brand-500)' }}>
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-[13px] font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>{fullName}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Teacher</p>
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 sm:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav items={navItems.slice(0, 4)} />
    </div>
  );
};

export default TeacherLayout;
