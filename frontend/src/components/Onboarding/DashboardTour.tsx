import React, { useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step, EventData } from 'react-joyride';

interface DashboardTourProps {
  run: boolean;
  onFinish: () => void;
}

export const DashboardTour: React.FC<DashboardTourProps> = ({ run, onFinish }) => {
  const [steps] = useState<Step[]>([
    {
      target: 'body',
      content: 'Welcome to your personalized dashboard! Let me show you around.',
      placement: 'center',
    },
    {
      target: '.tour-sidebar',
      content: 'Here you can navigate between all the different modules like Courses, Students, and Settings.',
      placement: 'right',
    },
    {
      target: '.tour-profile',
      content: 'Click here to manage your profile and account settings.',
      placement: 'left',
    }
  ]);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideCallback}
    />
  );
};
