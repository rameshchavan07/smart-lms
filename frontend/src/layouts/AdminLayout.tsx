import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '../components/NotificationBell';import { 
  LayoutDashboard, BookOpen, Users, ClipboardList, 
  BarChart3, MessageSquare, Settings, HelpCircle, 
  LogOut, Menu, X, Search, Moon, Sun, Mail,
  ChevronRight, GraduationCap, Plus, Globe, Building
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',     href: '/admin',               icon: LayoutDashboard },
  { label: 'Institutes',    href: '/admin/institutes',    icon: Building },
  { label: 'Courses',       href: '/admin/courses',       icon: BookOpen },
  { label: 'Users',         href: '/admin/users',         icon: Users },
  { label: 'Enrollments',   href: '/admin/enrollments',   icon: GraduationCap },
  { label: 'Assessments',   href: '/admin/assessments',   icon: ClipboardList },
  { label: 'Reports',       href: '/admin/reports',       icon: BarChart3 },
  { label: 'Communication', href: '/admin/communication', icon: MessageSquare },
  { label: 'Integrations',  href: '/admin/integrations',  icon: Globe },
  { label: 'Settings',      href: '/admin/settings',      icon: Settings },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? location.pathname === href : location.pathname.startsWith(href) && href !== '#';

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = `${user?.firstName?.[0] || 'S'}${user?.lastName?.[0] || 'A'}`;
  const fullName = `${user?.firstName || 'System'} ${user?.lastName || 'Admin'}`;

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
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-brand flex-shrink-0 mx-auto" style={{ background: 'var(--brand-500)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-white font-bold text-[15px] leading-none">OpenLearnX</p>
              <p className="text-white/40 text-[11px] mt-0.5">Admin Portal</p>
            </div>
          )}
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
          {!isCollapsed && <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-5 mb-2">Management</p>}
          {navItems.map((item) => {
            if (item.label === 'Institutes' && user?.role !== 'SUPER_ADMIN') return null;
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`sidebar-link ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
                {!isCollapsed && <span className="flex-1">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className="text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-500)' }}>
                    {item.badge}
                  </span>
                )}
                {!isCollapsed && active && <ChevronRight className="w-4 h-4 opacity-50" />}
              </Link>
            );
          })}

          <div className="mx-3 mt-4">
            <Link to="/admin/courses" className={`w-full btn btn-primary btn-sm ${isCollapsed ? 'justify-center p-2' : 'justify-start gap-2'} text-center flex items-center`}>
              <Plus className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Add New Course</span>}
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/5 p-3 space-y-1">
          <Link to="#" className={`sidebar-link ${isCollapsed ? 'justify-center' : ''}`}>
            <HelpCircle className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Support</span>}
          </Link>
          <button onClick={handleLogout} className={`sidebar-link text-red-400 hover:text-red-300 w-full text-left flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-white/5">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 ${isCollapsed ? 'justify-center px-0' : ''}`}>
            <div className="avatar avatar-sm text-white shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>{initials}</div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-semibold leading-none truncate">{fullName}</p>
                <p className="text-white/40 text-[11px] mt-0.5">Super Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="glass sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6 h-16 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => {
              if (window.innerWidth < 1024) setIsMobileOpen(prev => !prev);
              else setIsCollapsed(prev => !prev);
            }}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb on desktop */}
          <div className="hidden lg:flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {navItems.find(n => isActive(n.href))?.label || 'Dashboard'}
            </span>
          </div>

          {/* Search */}
          <div className="relative max-w-xs hidden md:block ml-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search anything..."
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
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Super Admin</p>
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

export default AdminLayout;
