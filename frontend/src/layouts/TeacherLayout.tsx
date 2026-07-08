import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInstitute } from '../contexts/InstituteContext';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '../components/NotificationBell';
import { AIBotOnboarding } from '../components/Onboarding/AIBotOnboarding';
import { 
  LayoutDashboard, BookOpen, Users, ClipboardList, 
  BarChart3, MessageSquare, Settings, HelpCircle, 
  LogOut, Menu, X, Search, Moon, Sun, Mail,
  ChevronRight, GraduationCap
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',     path: '',               icon: LayoutDashboard },
  { label: 'Courses',       path: '/courses',       icon: BookOpen },
  { label: 'Students',      path: '/students',      icon: Users },
  { label: 'Enrollments',   path: '/enrollments',   icon: GraduationCap },
  { label: 'Assessments',   path: '/assessments',   icon: ClipboardList },
  { label: 'Reports',       path: '/reports',       icon: BarChart3 },
  { label: 'Communication', path: '/communication', icon: MessageSquare, badge: 3 },
  { label: 'Settings',      path: '/settings',      icon: Settings },
];

const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { institute } = useInstitute();
  const { isDark, toggleDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && user.hasCompletedOnboarding === false) {
      setShowOnboarding(true);
    }
  }, [user]);

  const getHref = (path: string) => {
    if (!institute) return '#';
    return `/i/${institute.slug}/teacher${path}`;
  };

  const isActive = (href: string) => {
    if (href === '#') return false;
    if (href.endsWith('/teacher') || href.endsWith('/teacher/')) {
      return location.pathname === href || location.pathname === href + '/';
    }
    return location.pathname.startsWith(href);
  };

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
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          {institute?.logoUrl ? (
            <img src={institute.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 mx-auto bg-white" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-brand flex-shrink-0 mx-auto" style={{ background: 'var(--brand-500)' }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-[15px] leading-none truncate">{institute?.name || 'Loading...'}</p>
              <p className="text-white/40 text-[11px] mt-0.5 truncate">Teacher Portal</p>
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
          {!isCollapsed && <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-5 mb-2">Menu</p>}
          {navItems.map((item) => {
            const href = getHref(item.path);
            const active = isActive(href);
            return (
              <Link
                key={item.label}
                to={href}
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
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="avatar avatar-sm text-white shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>{initials}</div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-semibold leading-none truncate">{fullName}</p>
                <p className="text-white/40 text-[11px] mt-0.5 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
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
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="avatar avatar-sm font-bold" style={{ background: 'rgba(67,97,240,0.1)', color: 'var(--brand-500)' }}>
                  {initials}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-[13px] font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>{fullName}</p>
                <p className="text-[11px] mt-0.5 truncate w-24" style={{ color: 'var(--text-muted)' }}>Teacher</p>
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
      <BottomNav items={navItems.slice(0, 4).map(item => ({ ...item, href: getHref(item.path) }))} />

      {showOnboarding && <AIBotOnboarding onComplete={() => setShowOnboarding(false)} />}
    </div>
  );
};

export default TeacherLayout;
