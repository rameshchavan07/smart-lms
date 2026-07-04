import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationBell } from '../NotificationBell';

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
    })),
  };
});

vi.mock('../../contexts/SocketContext', () => ({
  useSocket: vi.fn(() => ({ socket: null, connected: false })),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockMutation = { mutate: vi.fn() };

function setupMocks(notifications: object[]) {
  (useQueryClient as ReturnType<typeof vi.fn>).mockReturnValue({ invalidateQueries: vi.fn() });
  (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
    data: notifications,
    isLoading: false,
  });
  (useMutation as ReturnType<typeof vi.fn>).mockReturnValue(mockMutation);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the bell icon button', () => {
    setupMocks([]);
    render(<NotificationBell />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does NOT show the red badge when there are no unread notifications', () => {
    setupMocks([
      { id: '1', title: 'Hello', message: 'Hi', isRead: true, createdAt: new Date().toISOString() },
    ]);
    render(<NotificationBell />);
    // Badge is the animate-ping span — should not be present
    const badge = document.querySelector('.animate-ping');
    expect(badge).toBeNull();
  });

  it('shows the red pulsing badge when there are unread notifications', () => {
    setupMocks([
      { id: '1', title: 'New Lecture', message: 'Lecture scheduled', isRead: false, createdAt: new Date().toISOString() },
    ]);
    render(<NotificationBell />);
    const badge = document.querySelector('.animate-ping');
    expect(badge).not.toBeNull();
  });

  it('opens the dropdown panel on bell click', async () => {
    setupMocks([]);
    render(<NotificationBell />);

    const bell = screen.getByRole('button');
    fireEvent.click(bell);

    expect(await screen.findByText('Notifications')).toBeInTheDocument();
  });

  it('shows "No notifications yet" when list is empty', async () => {
    setupMocks([]);
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument();
  });

  it('renders notification title and message in the dropdown', async () => {
    setupMocks([
      {
        id: '1',
        title: 'Assignment Due',
        message: 'Math assignment is due tomorrow',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText('Assignment Due')).toBeInTheDocument();
    expect(await screen.findByText('Math assignment is due tomorrow')).toBeInTheDocument();
  });

  it('shows "Mark all read" button only when there are unread notifications', async () => {
    setupMocks([
      { id: '1', title: 'Test', message: 'msg', isRead: false, createdAt: new Date().toISOString() },
    ]);
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText(/mark all read/i)).toBeInTheDocument();
  });

  it('does not show "Mark all read" when all notifications are read', async () => {
    setupMocks([
      { id: '1', title: 'Test', message: 'msg', isRead: true, createdAt: new Date().toISOString() },
    ]);
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button'));

    await screen.findByText('Notifications');
    expect(screen.queryByText(/mark all read/i)).not.toBeInTheDocument();
  });

  it('shows loading state while fetching', async () => {
    (useQueryClient as ReturnType<typeof vi.fn>).mockReturnValue({ invalidateQueries: vi.fn() });
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: [], isLoading: true });
    (useMutation as ReturnType<typeof vi.fn>).mockReturnValue(mockMutation);

    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText(/loading notifications/i)).toBeInTheDocument();
  });

  it('closes the dropdown when clicking outside', async () => {
    setupMocks([]);
    const { container } = render(
      <div>
        <NotificationBell />
        <div data-testid="outside">Outside</div>
      </div>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Notifications')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });
});
