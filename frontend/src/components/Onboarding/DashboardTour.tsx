import React, { useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step, EventData } from 'react-joyride';
import api from '../../services/api';

interface DashboardTourProps {
  run: boolean;
  onFinish: () => void;
}

export const DashboardTour: React.FC<DashboardTourProps> = ({ run, onFinish }) => {
  const [steps] = useState<Step[]>([
    {
      target: '.sidebar', // Sidebar
      content: 'This is your sidebar. It contains all the tools you need to learn and stay organized.',
      placement: 'right',
    },
    {
      target: '.tour-search', // Search Bar
      content: 'Use search to find any course, content, or topic in seconds.',
      placement: 'bottom',
    },
    {
      target: '.tour-notifications', // Notifications
      content: "You'll get all important updates and reminders here.",
      placement: 'bottom',
    },
    {
      target: '.tour-courses', // My Courses
      content: 'Your enrolled courses appear here. Continue where you left off.',
      placement: 'top',
    },
    {
      target: '.tour-continue', // Continue Learning
      content: 'Pick up from where you stopped. Continue your learning seamlessly.',
      placement: 'top',
    },
    {
      target: '.tour-profile', // Profile
      content: 'Manage your profile, account settings, and preferences from here.',
      placement: 'left',
    }
  ]);

  const handleJoyrideCallback = async (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      try {
        await api.patch('/users/me/tour'); // Need to create this endpoint or handle it
      } catch (err) {
        console.error('Failed to save tour completion', err);
      }
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      styles={{
        // @ts-expect-error react-joyride v3 types
        options: {
          primaryColor: '#4361EE', // brand-500
          zIndex: 1000,
          backgroundColor: '#ffffff',
          textColor: '#333333',
        },
        tooltip: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          padding: '24px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontWeight: 700,
        },
        buttonNext: {
          backgroundColor: '#4361EE',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          marginRight: 10,
        }
      }}
      locale={{
        last: 'Finish',
        skip: 'Skip Tour',
      }}
      onEvent={handleJoyrideCallback}
    />
  );
};
