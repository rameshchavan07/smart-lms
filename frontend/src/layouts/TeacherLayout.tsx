import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  ClipboardList, 
  Users,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Award,
  FileText,
  Settings,
  Mail
} from 'lucide-react';
import { Logo } from '../components';

const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    {
      section: 'PORTAL',
      items: [
        { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
        { name: 'My Courses', href: '/teacher/courses', icon: BookOpen },
        { name: 'Students', href: '/teacher/students', icon: Users },
        { name: 'Classes', href: '#', icon: Video },
        { name: 'Assignments', href: '#', icon: ClipboardList },
        { name: 'Quizzes', href: '#', icon: Award },
        { name: 'Gradebook', href: '#', icon: Award },
        { name: 'Announcements', href: '#', icon: Bell },
        { name: 'Live Classes', href: '#', icon: Video },
        { name: 'Resources', href: '#', icon: BookOpen },
        { name: 'Reports', href: '#', icon: FileText },
        { name: 'Messages', href: '#', icon: Mail },
        { name: 'Settings', href: '#', icon: Settings }
      ]
    }
  ];

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
    <div className="flex h-screen bg-slate-background dark:bg-[#090e1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-955/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        animate={{ width: isCollapsed ? 76 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-45 flex flex-col bg-[#0b0f19] border-r border-slate-800/40 shadow-xl lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-885/30">
          <Logo 
            iconOnly={isCollapsed} 
            size="md" 
            subtext="Teacher Portal" 
            lightText 
          />
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navigation.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {sec.items.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== '/teacher' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`relative group flex items-center py-2 rounded-xl transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-0' : 'px-3'
                    } ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicatorTeacher"
                        className="absolute inset-0 bg-[#2563eb] rounded-xl -z-10 shadow-sm"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    
                    {!isActive && (
                      <div className="absolute inset-0 bg-slate-800/0 group-hover:bg-slate-800/40 rounded-xl -z-10 transition-colors duration-250" />
                    )}

                    <item.icon
                      className={`flex-shrink-0 h-4.5 w-4.5 transition-colors ${
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

        {/* User Card */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40">
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center px-1">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-650 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm border border-primary-600/10">
                  {user?.firstName?.[0] || 'J'}{user?.lastName?.[0] || 'D'}
                </div>
                <div className="ml-3 truncate text-left">
                  <p className="text-sm font-bold text-white truncate leading-none">
                    {user?.firstName || 'John'} {user?.lastName || 'Doe'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 leading-none">Computer Science Teacher</p>
                  <div className="flex items-center mt-1.5">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-1.5" />
                    <span className="text-[10px] text-slate-400 font-semibold leading-none">Online</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="flex w-full items-center px-3 py-2 text-xs font-bold text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="flex-shrink-0 mr-3 h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={logout}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer mx-auto"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-6 lg:px-8 shadow-sm flex-shrink-0 transition-colors z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative hidden md:block w-64 lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-450" />
              </div>
              <input
                type="text"
                placeholder="Search for courses, students, content..."
                className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 relative transition-colors cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0f172a]" />
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-2.5 text-left">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-650 text-white flex items-center justify-center font-bold text-xs shadow-sm border border-primary-600/10">
                {user?.firstName?.[0] || 'J'}{user?.lastName?.[0] || 'D'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">John Doe</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider leading-none">Computer Science Teacher</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-auto p-6 md:p-8 space-y-6 pb-20 sm:pb-8">
          {breadcrumbs.length > 0 && (
            <nav className="flex text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
              <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                  <span className="hover:text-slate-600 dark:hover:text-slate-400 cursor-default transition-colors">Portal</span>
                </li>
                {breadcrumbs.map((crumb, idx) => (
                  <li key={idx} className="inline-flex items-center">
                    <span className="mx-1.5 text-slate-300 dark:text-slate-700">/</span>
                    <span className={`transition-colors cursor-default truncate max-w-40 ${
                      crumb.isLast ? 'text-slate-800 dark:text-slate-250 font-bold' : 'text-slate-400 dark:text-slate-500'
                    }`}>{crumb.label}</span>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <Outlet />
        </div>

        {/* Bottom Tab Navigation for Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/80 flex justify-around py-2.5 sm:hidden shadow-lg">
          <Link to="/teacher" className="flex flex-col items-center gap-0.5 text-slate-550 dark:text-slate-400 hover:text-primary-500">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link to="/teacher/courses" className="flex flex-col items-center gap-0.5 text-slate-550 dark:text-slate-400 hover:text-primary-500">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold">Courses</span>
          </Link>
          <Link to="/teacher/students" className="flex flex-col items-center gap-0.5 text-slate-550 dark:text-slate-400 hover:text-primary-500">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">Students</span>
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

export default TeacherLayout;
