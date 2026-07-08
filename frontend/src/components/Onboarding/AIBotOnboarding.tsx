import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import chatbotAnimation from '../../assets/live-chatbot.json';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { ChevronRight, ArrowLeft, Check, Sparkles, Moon, Sun, Monitor, Bell, BellOff } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface AIBotOnboardingProps {
  onComplete: () => void;
}

export const AIBotOnboarding: React.FC<AIBotOnboardingProps> = ({ onComplete }) => {
  const { user, refreshUser } = useAuth();
  const { isDark } = useTheme();
  
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);

  // Form State
  const [learningGoal, setLearningGoal] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [studyTime, setStudyTime] = useState<string>('');
  const [dashboardPreferences, setDashboardPreferences] = useState<string[]>([]);
  const [themePref, setThemePref] = useState<string>('system');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  // For Lottie CJS interop
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LottieComponent = (Lottie as any).default || Lottie;

  const nextStep = () => {
    setDirection(1);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
  };

  const togglePreference = (pref: string) => {
    setDashboardPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleComplete = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.patch('/users/me/onboarding', {
        learningGoal,
        experienceLevel,
        studyTime,
        dashboardPreferences,
        theme: themePref,
        notificationsEnabled,
        tourCompleted: false // Reset tour so it starts after onboarding
      });
      await refreshUser(); // Refresh user context to clear onboarding screen via cache
      
      // Artificial delay for celebration animation
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setSubmitting(false);
    }
  };

  // Skip simply completes with defaults
  const handleSkip = () => {
    handleComplete();
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/40 backdrop-blur-md p-4 sm:p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Background ambient glow matching Notion/Linear premium feel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row ${isDark ? 'bg-[#121212] border border-white/10' : 'bg-white border border-black/5'}`}
        style={{ minHeight: '520px' }}
      >
        {/* Left Side: Avatar & Progress */}
        <div className={`w-full md:w-[280px] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-gray-50/50'}`}>
          <div className="w-full">
            {/* Step Indicators */}
            <div className="flex items-center justify-between gap-1 mb-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                  <motion.div 
                    className="h-full bg-brand-500"
                    initial={{ width: '0%' }}
                    animate={{ width: step >= i ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center -mt-6">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-48 h-48 drop-shadow-2xl"
            >
              <LottieComponent animationData={chatbotAnimation} loop={true} />
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 text-center"
              >
                {step === 1 && <p className="text-[13px] font-medium text-brand-500 bg-brand-500/10 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Hello!</p>}
                {step === 2 && <p className="text-[13px] font-medium text-purple-500 bg-purple-500/10 px-3 py-1.5 rounded-full">Tell me your goals</p>}
                {step === 3 && <p className="text-[13px] font-medium text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full">Assess your level</p>}
                {step === 4 && <p className="text-[13px] font-medium text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">Plan your time</p>}
                {step === 5 && <p className="text-[13px] font-medium text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">Customize Dashboard</p>}
                {step === 6 && <p className="text-[13px] font-medium text-pink-500 bg-pink-500/10 px-3 py-1.5 rounded-full">Final touches</p>}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full text-center mt-4">
            <button onClick={handleSkip} className="text-[12px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              Skip setup
            </button>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className="flex-1 relative overflow-y-auto hide-scrollbar p-8">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="absolute inset-0 p-8 flex flex-col justify-center"
              >
                
                {/* STEP 1: Welcome */}
                {step === 1 && (
                  <div>
                    <h1 className="text-2xl font-bold mb-3 tracking-tight">Welcome, {user?.firstName || 'Student'}!</h1>
                    <p className={`text-[15px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      We're thrilled to have you on board. Let's personalize your OpenLearnX dashboard to match your learning style.
                    </p>
                    <div className="mt-8 p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
                      <p className="text-[13px] font-medium text-brand-600 dark:text-brand-400 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-[10px]">1</span>
                        This will only take 30 seconds.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 2: Learning Goal */}
                {step === 2 && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">What brings you here today?</h2>
                    <div className="space-y-3">
                      {['Learn new skills', 'Complete my course', 'Prepare for exams', 'Career growth', 'Browse courses'].map(goal => (
                        <button
                          key={goal}
                          onClick={() => setLearningGoal(goal)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${learningGoal === goal ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500 shadow-sm' : isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <span className="font-medium text-[14px]">{goal}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${learningGoal === goal ? 'border-brand-500 bg-brand-500 text-white' : isDark ? 'border-white/20' : 'border-gray-300'}`}>
                            {learningGoal === goal && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: Experience Level */}
                {step === 3 && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">How familiar are you with this subject?</h2>
                    <div className="space-y-3">
                      {[
                        { level: 'Beginner', desc: "I'm just getting started", icon: '🌱' },
                        { level: 'Intermediate', desc: 'I have some experience', icon: '🌿' },
                        { level: 'Advanced', desc: "I'm very familiar", icon: '🌳' }
                      ].map(item => (
                        <button
                          key={item.level}
                          onClick={() => setExperienceLevel(item.level)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${experienceLevel === item.level ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500 shadow-sm' : isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <div className="text-2xl">{item.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-[15px]">{item.level}</div>
                            <div className={`text-[12px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${experienceLevel === item.level ? 'border-brand-500 bg-brand-500 text-white' : isDark ? 'border-white/20' : 'border-gray-300'}`}>
                            {experienceLevel === item.level && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: Study Time */}
                {step === 4 && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">How much time can you study daily?</h2>
                    <div className="space-y-3">
                      {['15 Minutes', '30 Minutes', '1 Hour', '2+ Hours'].map(time => (
                        <button
                          key={time}
                          onClick={() => setStudyTime(time)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${studyTime === time ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500 shadow-sm' : isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <span className="font-medium text-[14px]">{time}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${studyTime === time ? 'border-brand-500 bg-brand-500 text-white' : isDark ? 'border-white/20' : 'border-gray-300'}`}>
                            {studyTime === time && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 5: Dashboard Preferences */}
                {step === 5 && (
                  <div>
                    <h2 className="text-xl font-bold mb-2">What do you want to focus on?</h2>
                    <p className={`text-[13px] mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select all that apply. You can change this later.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {['Video Lectures', 'Assignments', 'Live Classes', 'Community', 'Certificates', 'Progress Tracking'].map(pref => {
                        const selected = dashboardPreferences.includes(pref);
                        return (
                          <button
                            key={pref}
                            onClick={() => togglePreference(pref)}
                            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${selected ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500 shadow-sm' : isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                          >
                            <div className="flex w-full justify-between items-center mb-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selected ? 'border-brand-500 bg-brand-500 text-white' : isDark ? 'border-white/20' : 'border-gray-300'}`}>
                                {selected && <Check className="w-3 h-3" />}
                              </div>
                            </div>
                            <span className="font-medium text-[13px]">{pref}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 6: Optional Settings & Finish */}
                {step === 6 && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Final Preferences</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <p className="text-[13px] font-semibold mb-3 uppercase tracking-wider text-gray-500">Theme</p>
                        <div className="flex gap-3">
                          {[
                            { id: 'light', icon: Sun, label: 'Light' },
                            { id: 'dark', icon: Moon, label: 'Dark' },
                            { id: 'system', icon: Monitor, label: 'System' }
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setThemePref(t.id)}
                              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${themePref === t.id ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500' : isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                              <t.icon className={`w-5 h-5 ${themePref === t.id ? 'text-brand-500' : 'text-gray-400'}`} />
                              <span className="text-[12px] font-medium">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[13px] font-semibold mb-3 uppercase tracking-wider text-gray-500">Notifications</p>
                        <button
                          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${notificationsEnabled ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500' : isDark ? 'border-white/10' : 'border-gray-200'}`}
                        >
                          {notificationsEnabled ? <Bell className="w-5 h-5 text-brand-500" /> : <BellOff className="w-5 h-5 text-gray-400" />}
                          <div className="flex-1">
                            <span className="font-medium text-[14px]">Push Notifications</span>
                            <p className="text-[12px] text-gray-500 mt-0.5">Assignment reminders, class alerts.</p>
                          </div>
                          <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${notificationsEnabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                            <motion.div 
                              className="w-4 h-4 bg-white rounded-full shadow-sm"
                              animate={{ x: notificationsEnabled ? 16 : 0 }}
                            />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className={`p-6 border-t flex items-center ${step === 1 ? 'justify-end' : 'justify-between'} ${isDark ? 'border-white/10' : 'border-black/5'}`}>
            {step > 1 && (
              <button 
                onClick={prevStep}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            
            {step < 6 ? (
              <button
                onClick={nextStep}
                disabled={
                  (step === 2 && !learningGoal) ||
                  (step === 3 && !experienceLevel) ||
                  (step === 4 && !studyTime) ||
                  (step === 5 && dashboardPreferences.length === 0)
                }
                className="btn btn-primary px-6 shadow-brand hover:shadow-brand-lg transition-all flex items-center gap-2"
              >
                {step === 1 ? 'Get Started' : 'Next'} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="btn btn-primary px-6 shadow-brand hover:shadow-brand-lg transition-all flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Finish Setup <Check className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Confetti Overlay when submitting */}
        {submitting && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
           >
             <LottieComponent animationData={chatbotAnimation} loop={true} className="w-32 h-32 mb-4" />
             <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-purple-500">
                You're all set!
             </h3>
             <p className="text-gray-500 mt-2 text-[14px]">Preparing your personalized dashboard...</p>
           </motion.div>
        )}
      </motion.div>
    </div>
  );
};
