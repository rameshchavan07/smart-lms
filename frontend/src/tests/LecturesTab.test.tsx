import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { LecturesTab } from '../pages/shared/LecturesTab';
import { renderWithProviders } from './utils/test-utils';
import api from '../services/api';
import * as AuthContext from '../contexts/AuthContext';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}));

describe('LecturesTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock user context as a STUDENT by default
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'student1', role: 'STUDENT', email: 'test@student.com', firstName: 'Test', lastName: 'Student' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('renders loading state initially', () => {
    // API won't resolve immediately
    (api.get as Mock).mockImplementation(() => new Promise(() => {}));
    
    renderWithProviders(<LecturesTab courseId="course-1" />);
    
    expect(screen.getByText('Loading lectures...')).toBeInTheDocument();
  });

  it('renders empty state when no lectures exist', async () => {
    (api.get as Mock).mockResolvedValue({ data: { lectures: [] } });
    
    renderWithProviders(<LecturesTab courseId="course-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('No lectures scheduled yet.')).toBeInTheDocument();
    });
  });

  it('renders a list of lectures', async () => {
    const mockLectures = [
      {
        id: 'lecture-1',
        title: 'Introduction to React',
        description: 'Learn the basics of React',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        meetingUrl: 'http://meet.test',
      },
      {
        id: 'lecture-2',
        title: 'Advanced State Management',
        description: 'Zustand vs Redux',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        meetingUrl: 'http://meet.test',
      }
    ];

    (api.get as Mock).mockResolvedValue({ data: { lectures: mockLectures } });
    
    renderWithProviders(<LecturesTab courseId="course-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
      expect(screen.getByText('Advanced State Management')).toBeInTheDocument();
    });
    
    // Check that 'Join Class' buttons are visible for students
    const joinButtons = screen.getAllByText('Join Class');
    expect(joinButtons).toHaveLength(2);
  });
});
