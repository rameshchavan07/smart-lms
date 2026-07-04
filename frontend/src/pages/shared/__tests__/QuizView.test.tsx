import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuizView from '../QuizView';
import { useAuth } from '../../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.confirm
window.confirm = vi.fn();

// ─── Shared Mock Data ─────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
const MOCK_QUIZ = {
  id: 'quiz-1',
  title: 'React Fundamentals',
  description: 'Test your React knowledge',
  durationMins: 30,
  totalMarks: 10,
  questions: [
    {
      id: 'q1',
      text: 'What is JSX?',
      marks: 10,
      options: [
        { id: 'opt1', text: 'JavaScript XML' },
        { id: 'opt2', text: 'Java Syntax Extension' },
      ],
    },
  ],
};

const MOCK_SUBMISSIONS = [
  {
    id: 'sub-1',
    totalScore: 10,
    submittedAt: new Date().toISOString(),
    student: {
      user: { firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com' },
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface SetupMocksOptions {
  role?: string;
  quizId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiGetImpl?: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiPostImpl?: (...args: any[]) => any;
}

function setupMocks({
  role = 'STUDENT',
  quizId = 'quiz-1',
  apiGetImpl = vi.fn(),
  apiPostImpl = vi.fn(),
}: SetupMocksOptions = {}) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: { id: 'u1', role },
  });
  (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ quizId });
  (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
  (api.get as ReturnType<typeof vi.fn>).mockImplementation(apiGetImpl);
  (api.post as ReturnType<typeof vi.fn>).mockImplementation(apiPostImpl);
  (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuizView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    setupMocks({
      apiGetImpl: () => new Promise(() => {}), // never resolves
    });
    render(<QuizView />);
    // The skeleton is rendered
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('renders "Quiz not found" if API returns no quiz', async () => {
    setupMocks({
      apiGetImpl: () => Promise.reject({ response: { status: 404 } }),
    });
    render(<QuizView />);
    expect(await screen.findByText('Quiz not found.')).toBeInTheDocument();
  });

  it('renders quiz details for a STUDENT', async () => {
    setupMocks({
      role: 'STUDENT',
      apiGetImpl: async (url: string) => {
        if (url.includes('/quizzes/quiz-1')) return { data: { quiz: MOCK_QUIZ } };
        return { data: {} };
      },
    });

    render(<QuizView />);

    expect(await screen.findByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('What is JSX?')).toBeInTheDocument();
    expect(screen.getByText('JavaScript XML')).toBeInTheDocument();
    // Verify teacher submissions tab is not shown
    expect(screen.queryByText(/Submissions/i)).not.toBeInTheDocument();
  });

  it('renders submissions tab for a TEACHER', async () => {
    setupMocks({
      role: 'TEACHER',
      apiGetImpl: async (url: string) => {
        if (url.includes('submissions')) return { data: { submissions: MOCK_SUBMISSIONS } };
        return { data: { quiz: MOCK_QUIZ } };
      },
    });

    render(<QuizView />);
    expect(await screen.findByText('Student Submissions')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('handles option selection and successful submission for a STUDENT', async () => {
    setupMocks({
      role: 'STUDENT',
      apiGetImpl: async () => ({ data: { quiz: MOCK_QUIZ } }),
      apiPostImpl: async () => ({ data: { score: 10, totalMarks: 10 } }),
    });

    render(<QuizView />);

    // Wait for quiz to load
    await screen.findByText('React Fundamentals');

    // Select an option
    const optionRadio = screen.getByLabelText('JavaScript XML');
    fireEvent.click(optionRadio);
    expect(optionRadio).toBeChecked();

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitBtn);

    // Verify successful submission UI
    expect(await screen.findByText('Quiz Completed!')).toBeInTheDocument();
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Quiz submitted successfully!');
  });

  it('shows confirmation prompt if there are unanswered questions on submit', async () => {
    setupMocks({
      role: 'STUDENT',
      apiGetImpl: async () => ({ data: { quiz: MOCK_QUIZ } }),
    });

    render(<QuizView />);

    await screen.findByText('React Fundamentals');

    // Submit without selecting answers
    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitBtn);

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('1 unanswered questions'));
    // Since window.confirm is mocked to return true, it should call api.post
    await waitFor(() => expect(api.post).toHaveBeenCalled());
  });

  it('displays toast error if already submitted error occurs on load', async () => {
    setupMocks({
      role: 'STUDENT',
      apiGetImpl: async () => Promise.reject({
        response: { status: 400, data: { message: 'You have already submitted this quiz' } },
      }),
    });

    render(<QuizView />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You have already submitted this quiz.');
    });
  });

  it('displays toast error if submission fails', async () => {
    setupMocks({
      role: 'STUDENT',
      apiGetImpl: async () => ({ data: { quiz: MOCK_QUIZ } }),
      apiPostImpl: async () => Promise.reject({
        response: { data: { message: 'Server error' } },
      }),
    });

    render(<QuizView />);
    await screen.findByText('React Fundamentals');

    fireEvent.click(screen.getByLabelText('JavaScript XML'));
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('navigates back when clicking the back arrow', async () => {
    setupMocks({
      role: 'STUDENT',
      apiGetImpl: async () => ({ data: { quiz: MOCK_QUIZ } }),
    });

    render(<QuizView />);
    await screen.findByText('React Fundamentals');

    // Click the first button (which should be the back arrow)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
