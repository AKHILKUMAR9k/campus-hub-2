import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminDashboard from '../../../app/dashboard/admin/page';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/supabase';

const mockRouter = {
  push: vi.fn(),
};

const mockToast = {
  toast: vi.fn(),
};

const mockSupabase = vi.mocked(require('@/supabase/client').supabase);

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast.toast }),
}));

vi.mock('@/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('@/supabase', () => ({
  useAuth: vi.fn(),
}));

// Mock the server actions
vi.mock('../../../app/dashboard/admin/actions', () => ({
  updateUserRole: vi.fn(),
  approveClub: vi.fn(),
  rejectClub: vi.fn(),
}));

import { updateUserRole, approveClub, rejectClub } from '../../../app/dashboard/admin/actions';
const mockUpdateUserRole = vi.mocked(updateUserRole);
const mockApproveClub = vi.mocked(approveClub);
const mockRejectClub = vi.mocked(rejectClub);

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe('AdminDashboard', () => {
  const mockUseAuth = vi.mocked(require('@/supabase').useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.push.mockClear();
    mockToast.toast.mockClear();
  });

  it('renders loading spinner when user is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isUserLoading: true,
      session: null,
      userError: null,
    });

    render(<AdminDashboard />);
    // Check for Loader2/Spinner - usually by class or aria-label if we add it
    // In the component it's <Loader2 className="h-8 w-8 animate-spin" />
    // We might need to add a test ID or check for specific element
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('redirects to home if user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    render(<AdminDashboard />);
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('redirects to dashboard if user is not admin', async () => {
    const mockUser = { id: 'user-1' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    // Mock non-admin user profile
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: 'student' },
            error: null,
          }),
        };
      }
      return mockSupabase.from();
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('renders admin dashboard for admin user', async () => {
    const mockUser = { id: 'admin-1' };
    const mockUsers = [
      {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'student',
        created_at: '2023-01-01',
      },
    ];
    const mockClubs = [
      {
        id: 'club-1',
        name: 'Tech Club',
        description: 'A club for tech enthusiasts',
        category: 'Tech',
        status: 'pending',
        created_at: '2023-01-01',
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
        };
      } else if (table === 'clubs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockClubs,
            error: null,
          }),
        };
      }
      return mockSupabase.from();
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Users (1)')).toBeInTheDocument();
      expect(screen.getByText('Clubs (1)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Tech Club')).toBeInTheDocument();
    });
  });

  it('allows updating user roles', async () => {
    const mockUser = { id: 'admin-1' };
    const mockUsers = [
      {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'student',
        created_at: '2023-01-01',
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        };
        return mockQuery;
      } else if (table === 'clubs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      }
      return mockSupabase.from();
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    mockUpdateUserRole.mockResolvedValue({ success: true });

    const makeOrganizerButton = screen.getByText('Make Organizer');
    fireEvent.click(makeOrganizerButton);

    await waitFor(() => {
      expect(mockUpdateUserRole).toHaveBeenCalledWith('user-1', 'club_organizer');
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'User role updated to club_organizer',
      });
    });
  });

  it('allows approving a club', async () => {
    const mockUser = { id: 'admin-1' };
    const mockClubs = [
      {
        id: 'club-1',
        name: 'Tech Club',
        description: 'A club for tech enthusiasts',
        category: 'Tech',
        status: 'pending',
        created_at: '2023-01-01',
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      } else if (table === 'clubs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockClubs,
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        };
      }
      return mockSupabase.from();
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tech Club')).toBeInTheDocument();
    });

    mockApproveClub.mockResolvedValue({ success: true });

    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockApproveClub).toHaveBeenCalledWith('club-1');
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Club approved',
      });
    });
  });

  it('allows rejecting a club', async () => {
    const mockUser = { id: 'admin-1' };
    const mockClubs = [
      {
        id: 'club-1',
        name: 'Tech Club',
        description: 'A club for tech enthusiasts',
        category: 'Tech',
        status: 'pending',
        created_at: '2023-01-01',
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      } else if (table === 'clubs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockClubs,
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        };
      }
      return mockSupabase.from();
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tech Club')).toBeInTheDocument();
    });

    const rejectButton = screen.getByText('Reject');
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Club rejected',
      });
    });
  });

  it('handles error fetching users/clubs data', async () => {
    const mockUser = { id: 'admin-1' };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        };
      } else if (table === 'clubs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      }
      return mockSupabase.from();
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load admin data',
      });
    });
  });

  it('handles error updating user role', async () => {
    const mockUser = { id: 'admin-1' };
    const mockUsers = [
      {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'student',
        created_at: '2023-01-01',
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
        };
      } else if (table === 'clubs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      }
      return mockSupabase.from();
    });

    // Mock update to fail
    mockSupabase.from('users').update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      }),
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const makeOrganizerButton = screen.getByText('Make Organizer');
    fireEvent.click(makeOrganizerButton);

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user role',
      });
    });
  });

  it('handles error approving a club', async () => {
    const mockUser = { id: 'admin-1' };
    const mockClubs = [
      {
        id: 'club-1',
        name: 'Tech Club',
        description: 'A club for tech enthusiasts',
        category: 'Tech',
        status: 'pending',
        created_at: '2023-01-01',
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      } else if (table === 'clubs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockClubs,
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Approval failed' },
          }),
        };
      }
      return mockSupabase.from();
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tech Club')).toBeInTheDocument();
    });

    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve club',
      });
    });
  });

  it('handles error rejecting a club', async () => {
    const mockUser = { id: 'admin-1' };
    const mockClubs = [
      {
        id: 'club-1',
        name: 'Tech Club',
        description: 'A club for tech enthusiasts',
        category: 'Tech',
        status: 'pending',
        created_at: '2023-01-01',
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isUserLoading: false,
      session: null,
      userError: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      } else if (table === 'clubs') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockClubs,
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Rejection failed' },
          }),
        };
      }
      return mockSupabase.from();
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tech Club')).toBeInTheDocument();
    });

    const rejectButton = screen.getByText('Reject');
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject club',
      });
    });
  });
});
