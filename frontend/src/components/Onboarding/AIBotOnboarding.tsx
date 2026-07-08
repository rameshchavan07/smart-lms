import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import chatbotAnimation from '../../assets/live-chatbot.json';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

type Reaction = 'idle' | 'thinking' | 'excited' | 'curious';

interface AIBotOnboardingProps {
  onComplete: () => void;
}

export const AIBotOnboarding: React.FC<AIBotOnboardingProps> = ({ onComplete }) => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [reaction, setReaction] = useState<Reaction>('excited');
  const [isTyping, setIsTyping] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Simulated typing effect
  useEffect(() => {
    setIsTyping(true);
    setShowOptions(false);
    
    // Set avatar reaction based on step
    if (step === 0) setReaction('excited');
    else if (step === 1) setReaction('curious');
    else if (step === 2) setReaction('idle');
    else if (step === 3) setReaction('excited');

    const timer = setTimeout(() => {
      setIsTyping(false);
      setShowOptions(true);
      if (step === 0) setReaction('idle');
    }, 1500); // 1.5 seconds typing

    return () => clearTimeout(timer);
  }, [step]);

  const handleComplete = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.patch('/users/me/onboarding');
      await refreshUser(); // Refresh user context
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setSubmitting(false);
    }
  };

  const getReactionVariant = (currentReaction: Reaction): any => {
    switch (currentReaction) {
      case 'excited':
        return {
          y: [0, -20, 0, -10, 0],
          transition: { duration: 0.6, ease: 'easeOut' }
        };
      case 'thinking':
        return {
          y: [0, -10, 0],
          scale: [1, 1.05, 1],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        };
      case 'curious':
        return {
          rotate: [0, -10, 10, 0],
          transition: { duration: 1, ease: 'easeInOut' }
        };
      case 'idle':
      default:
        return {
          y: [0, -5, 0],
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        };
    }
  };

  // Steps based on Role
  const renderDialogue = () => {
    if (isTyping) {
      return (
        <div className="flex space-x-1 p-2 h-6 items-center">
          <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
          <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
          <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
        </div>
      );
    }

    if (step === 0) return <p>Hi {user?.firstName}! 👋 Welcome to Smart LMS. I'm your AI assistant. To get started, what brings you here today?</p>;
    
    if (step === 1) {
      if (user?.role === 'STUDENT') return <p>What are your main learning goals?</p>;
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') return <p>What's your primary goal for your institute?</p>;
      if (user?.role === 'TEACHER') return <p>What subjects do you specialize in?</p>;
    }
    
    if (step === 2) return <p>Got it! I've personalized your dashboard based on your preferences. Ready for a quick tour?</p>;
    
    return null;
  };

  const renderOptions = () => {
    if (!showOptions) return null;

    if (step === 0) {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => setStep(1)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition">Exploring the platform</button>
          <button onClick={() => setStep(1)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition">Getting started immediately</button>
        </div>
      );
    }
    
    if (step === 1) {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => setStep(2)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition">Show me everything</button>
          <button onClick={() => setStep(2)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition">Just the basics</button>
        </div>
      );
    }
    
    if (step === 2) {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={handleComplete} disabled={submitting} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition">
            {submitting ? 'Starting...' : 'Start Tour 🚀'}
          </button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col items-center">
        
        {/* Animated Background blob */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-[20%] -right-[20%] w-[60%] h-[60%] bg-blue-500/20 blur-3xl rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.3, 1] }} 
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-[20%] -left-[20%] w-[60%] h-[60%] bg-purple-500/20 blur-3xl rounded-full"
          />
        </div>

        <motion.div animate={getReactionVariant(reaction)} className="w-64 h-64 mb-6">
          <Lottie animationData={chatbotAnimation} loop={true} />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step + (isTyping ? '-typing' : '-content')}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg bg-white shadow-lg rounded-2xl rounded-tl-none p-6 text-gray-800 text-lg relative"
          >
            {/* Speech bubble tail */}
            <div className="absolute top-0 -left-3 w-4 h-4 bg-white clip-triangle" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
            
            {renderDialogue()}
            
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  {renderOptions()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
