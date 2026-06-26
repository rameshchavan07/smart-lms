import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  LogOut, 
  FileText,
  CalendarCheck,
  ClipboardList,
  Menu,
  X,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { 
      section: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard }
      ]
    },
    { 
      section: 'MANAGEMENT',
      items: [
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Courses', href: '/admin/courses', icon: BookOpen },
        { name: 'Enrollments', href: '/admin/enrollments', icon: GraduationCap }
      ]
    },
    { 
      section: 'TOOLS',
      items: [
        { name: 'Lectures', href: '#', icon: CalendarCheck },
        { name: 'Assignments', href: '#', icon: ClipboardList },
        { name: 'Reports', href: '#', icon: FileText }
      ]
    }
  ];

  // Helper to generate breadcrumbs
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    return paths.map((path, idx) => {
      const href = '/' + paths.slice(0, idx + 1).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
      const isLast = idx === paths.length - 1;
      return { label, href, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-45 flex flex-col bg-[#091124] border-r border-slate-800/40 shadow-xl transition-all duration-300 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-18' : 'w-64'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
          <Logo 
            iconOnly={isCollapsed} 
            size="md" 
            subtext="Admin Portal" 
            lightText 
          />
          {/* Collapse toggle (desktop only) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          
          {/* Close drawer (mobile only) */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navigation.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="text-[9px] font-black tracking-widest text-slate-500 px-3 py-1 uppercase">
                  {sec.section}
                </p>
              )}
              {sec.items.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`group flex items-center py-2.5 rounded-xl transition-all duration-150 ${
                      isCollapsed ? 'justify-center px-0' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-primary-500 text-white font-bold shadow-md'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`flex-shrink-0 h-5 w-5 transition-colors ${
                        isCollapsed ? '' : 'mr-3'
                      } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                    />
                    {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card / Bottom Panel */}
        <div className="p-4 border-t border-slate-800/60 bg-[#060b18]/60">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'mb-4 px-2'}`}>
            <div className="h-9 w-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm border border-slate-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            {!isCollapsed && (
              <div className="ml-3 truncate text-left">
                <p className="text-sm font-bold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Admin</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={logout}
              className="flex w-full items-center px-3 py-2 text-xs font-bold text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="flex-shrink-0 mr-3 h-4 w-4" />
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-205 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8 shadow-xs flex-shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            {/* Hamburger menu for mobile */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search box */}
            <div className="relative hidden md:block w-64 lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search anything..."
                className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Dark Mode Switcher */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell */}
            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 relative transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-750" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5 text-left">
              <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-955/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm shadow-xs border border-primary-200/20">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-extrabold text-slate-850 dark:text-white leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider leading-none">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6 pb-20 sm:pb-8">
          
          {/* Breadcrumbs trail */}
          {breadcrumbs.length > 0 && (
            <nav className="flex text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
              <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                  <span className="hover:text-slate-600 dark:hover:text-slate-400 cursor-default">Portal</span>
                </li>
                {breadcrumbs.map((crumb, idx) => (
                  <li key={idx} className="inline-flex items-center">
                    <span className="mx-1.5">/</span>
                    {crumb.isLast ? (
                      <span className="text-slate-655 dark:text-slate-355 cursor-default truncate max-w-40">{crumb.label}</span>
                    ) : (
                      <span className="hover:text-slate-655 dark:hover:text-slate-355 cursor-default truncate max-w-40">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <Outlet />
        </div>

        {/* Bottom Tab Navigation for Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around py-2.5 sm:hidden shadow-lg">
          <Link to="/admin" className="flex flex-col items-center gap-0.5 text-slate-550 dark:text-slate-400 hover:text-primary-500">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link to="/admin/users" className="flex flex-col items-center gap-0.5 text-slate-550 dark:text-slate-400 hover:text-primary-500">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">Users</span>
          </Link>
          <Link to="/admin/courses" className="flex flex-col items-center gap-0.5 text-slate-550 dark:text-slate-400 hover:text-primary-500">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold">Courses</span>
          </Link>
          <button onClick={logout} className="flex flex-col items-center gap-0.5 text-slate-550 dark:text-slate-400 hover:text-red-500 cursor-pointer">
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-bold">Logout</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default AdminLayout;
