import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Shield, Video, Award, ArrowRight, Star, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '../components';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <Video className="w-6 h-6 text-primary-500" />,
      title: "Live Classrooms",
      description: "Join interactive, high-fidelity lectures with real-time video, whiteboarding, and chat integrations."
    },
    {
      icon: <BookOpen className="w-6 h-6 text-primary-500" />,
      title: "Course Libraries",
      description: "Access curated files, syllabus blueprints, and uploaded materials directly from Google Drive."
    },
    {
      icon: <Shield className="w-6 h-6 text-primary-500" />,
      title: "Role-Based Portals",
      description: "Dedicated interfaces specifically tailored for student progress, teacher controls, and admin audits."
    },
    {
      icon: <Award className="w-6 h-6 text-primary-500" />,
      title: "Sleek Gamification",
      description: "Track student performance, daily streaks, assignments, and certificates under a modern interface."
    }
  ];

  const testimonials = [
    {
      quote: "OpenLearnX has completely overhauled our virtual classrooms. The Google Drive file vault is exceptionally fast.",
      author: "Dr. Ramesh Chavan",
      role: "Dean of Academic Systems"
    },
    {
      quote: "I can join Jitsi streams, submit assignments, and review my attendance records all in two clicks. The design is beautiful.",
      author: "Sneha Patil",
      role: "Graduate Scholar"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-background dark:bg-[#090e1a] text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 relative z-10">
        <Logo size="md" />
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-bold text-slate-655 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">
            Login
          </Link>
          <Link 
            to="/register" 
            className="text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-indigo-650 hover:from-primary-600 hover:to-indigo-700 px-4.5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-primary-600/10 cursor-pointer"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center space-y-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-xs font-bold border border-primary-200/30"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          Introducing OpenLearnX Indigo Pro
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-tight text-slate-900 dark:text-white"
        >
          Transform How You{' '}
          <span className="bg-gradient-to-r from-primary-500 to-indigo-650 bg-clip-text text-transparent">
            Learn & Collaborate
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-medium"
        >
          A premium virtual educational portal designed for seamless course management, low-latency live lectures, and interactive streak gamification.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
        >
          <Link 
            to="/register" 
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-indigo-650 hover:from-primary-600 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg active:scale-95 border border-primary-600/10 cursor-pointer"
          >
            Create Your Account
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            to="/login" 
            className="flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold px-8 py-4 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Sign In Portal
          </Link>
        </motion.div>
      </header>

      {/* Feature Section */}
      <section className="bg-white/60 dark:bg-[#0f172a]/30 border-y border-slate-200/50 dark:border-slate-800/50 py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-20">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">State of the Art Core Subsystems</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">Everything needed to schedule, present, participate, and audit courses online.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group text-left"
              >
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/20 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white">{feat.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="text-center space-y-3 mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Trusted by Educators & Students</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((test, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
              className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative space-y-6 text-left"
            >
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4.5 h-4.5 fill-current" />)}
              </div>
              <p className="text-slate-600 dark:text-slate-350 italic text-base leading-relaxed">"{test.quote}"</p>
              <div className="pt-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-650 flex items-center justify-center text-white font-extrabold text-sm shadow-sm border border-primary-600/10">
                  {test.author[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{test.author}</p>
                  <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">{test.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section (Clean & Minimal) */}
      <section className="bg-white/60 dark:bg-[#0f172a]/30 border-t border-slate-200/50 dark:border-slate-800/50 py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Completely Free & Open Source</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto font-medium">Self-host on your own infrastructure or deploy instantly to cloud environments.</p>
          
          <div className="bg-white dark:bg-[#0f172a] max-w-md mx-auto p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-md text-left space-y-6">
            <div>
              <span className="text-xs font-black text-primary-500 uppercase tracking-widest bg-primary-50 dark:bg-primary-950/20 px-3 py-1 rounded-full border border-primary-200/30">Community Edition</span>
              <div className="flex items-baseline mt-4 gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">$0</span>
                <span className="text-slate-400 text-sm font-semibold">/ forever</span>
              </div>
            </div>
            <ul className="space-y-3.5 text-sm font-semibold text-slate-655 dark:text-slate-350">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Unlimited Student & Teacher Profiles</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Google Drive Cloud Storage Sync</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Integrated Jitsi Live Classrooms</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Full Role Administration Controls</span>
              </li>
            </ul>
            <Link 
              to="/register" 
              className="block text-center py-3 bg-gradient-to-r from-primary-500 to-indigo-650 hover:from-primary-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] border border-primary-600/10 cursor-pointer"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-12 bg-slate-50 dark:bg-[#090e1a] relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-slate-400 text-xs font-bold">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-slate-300 dark:text-slate-800">|</span>
            <span>&copy; 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-primary-500 transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary-500 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
