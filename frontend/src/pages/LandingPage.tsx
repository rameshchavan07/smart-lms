import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Shield, Video, Award, ArrowRight, Star } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <Video className="w-6 h-6 text-primary-500" />,
      title: "Live Classrooms",
      description: "Join HD real-time interactive lectures with shared boards, screens, and chat."
    },
    {
      icon: <BookOpen className="w-6 h-6 text-primary-500" />,
      title: "Course Libraries",
      description: "Access teacher-curated study material, video archives, and syllabus roadmaps."
    },
    {
      icon: <Shield className="w-6 h-6 text-primary-500" />,
      title: "Portal Controls",
      description: "Separate dedicated hubs with customized options for admins, teachers, and students."
    },
    {
      icon: <Award className="w-6 h-6 text-primary-500" />,
      title: "Sleek Gamification",
      description: "Stay motivated with student learning streaks, progression tracks, and reports."
    }
  ];

  const testimonials = [
    {
      quote: "OpenLearnX completely transformed our college's remote learning experience. The live classes are rock-solid.",
      author: "Dr. Sharma",
      role: "Dean of Computer Science"
    },
    {
      quote: "The interface is super fast. I can check assignments, join live streams, and download slides in two clicks.",
      author: "Arjun Mehta",
      role: "Undergraduate Student"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm">
            O
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary-500 to-indigo-600 bg-clip-text text-transparent">
            OpenLearnX
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">
            Login
          </Link>
          <Link 
            to="/register" 
            className="text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-xs font-bold border border-primary-200/30">
          ✨ Introducing LMS Indigo Pro
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Transform How You{' '}
          <span className="bg-gradient-to-r from-primary-500 to-indigo-600 bg-clip-text text-transparent">
            Learn and Collaborate
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          OpenLearnX is a premium educational portal designed for seamless course administration, real-time virtual lectures, and student gamification.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link 
            to="/register" 
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Create Your Account
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            to="/login" 
            className="flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-55 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-7 py-3.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Sign In Portal
          </Link>
        </div>
      </header>

      {/* Feature Section */}
      <section className="bg-white dark:bg-slate-800/40 py-20 transition-colors border-y border-slate-205 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-extrabold dark:text-white">State of the Art Core Features</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Everything you need to deliver, manage, and complete courses online.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 dark:text-white">{feat.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold">Loved by Educators & Students</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((test, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative space-y-4"
            >
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-600 dark:text-slate-350 italic">"{test.quote}"</p>
              <div className="pt-2">
                <p className="font-bold text-slate-900 dark:text-slate-100">{test.author}</p>
                <p className="text-xs text-slate-500">{test.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 bg-slate-100 dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">OpenLearnX</span>
            <span>&copy; 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</Link>
            <Link to="#" className="hover:text-slate-600 dark:hover:text-slate-300">Terms of Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
