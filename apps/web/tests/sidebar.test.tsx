/**
 * Sidebar Component Tests
 * 
 * Test coverage for sidebar navigation, user card, site status, and admin features.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/sidebar';
import * as React from 'react';

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({
    me: {
      role: 'admin',
      user: { name: 'Test Kullanıcı' }
    }
  }),
}));

vi.mock('@/components/site/site-provider', () => ({
  useSite: () => ({
    sites: [
      { id: 'site-1', name: 'Test Site', status: 'published' }
    ],
    currentSiteId: 'site-1'
  }),
}));

vi.mock('@/hooks/use-unread-count', () => ({
  useUnreadCount: () => ({ data: 5 }),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/home'),
}));

vi.mock('@/components/layout/app-shell', () => ({
  useSidebar: () => ({
    isMobileOpen: false,
    closeMobile: vi.fn(),
  }),
}));

vi.mock('@/features/admin/components/admin-sidebar', () => ({
  adminNavItems: [
    { label: 'Admin 1', href: '/admin/1', icon: <span /> },
  ],
  superAdminNavItems: [
    { label: 'Super Admin', href: '/admin/super', icon: <span /> },
  ],
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sidebar without crashing', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('should render logo with brand name', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('ProsektorWeb')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should render logo only when collapsed', () => {
      render(<Sidebar collapsed={true} onToggleCollapse={vi.fn()} />);
      expect(screen.queryByText('ProsektorWeb')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    it('should render main navigation items', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Ana Sayfa')).toBeInTheDocument();
    });

    it('should render site section with children', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Site')).toBeInTheDocument();
    });

    it('should render modules section', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Modüller')).toBeInTheDocument();
    });

    it('should render inbox section', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Gelen Kutusu')).toBeInTheDocument();
    });

    it('should render analytics and settings', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Analitik')).toBeInTheDocument();
      expect(screen.getByText('Ayarlar')).toBeInTheDocument();
    });
  });

  describe('Unread Badge', () => {
    it('should show unread badge when count > 0', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('User Card', () => {
    it('should render user name in user card', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Test Kullanıcı')).toBeInTheDocument();
    });

    it('should render user role', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Yönetici')).toBeInTheDocument();
    });

    it('should render initials in avatar', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('TK')).toBeInTheDocument();
    });
  });

  describe('Site Status Badge', () => {
    it('should show site name when not collapsed', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Test Site')).toBeInTheDocument();
    });

    it('should show published status', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Canlı')).toBeInTheDocument();
    });

    it('should not show site status when collapsed', () => {
      render(<Sidebar collapsed={true} onToggleCollapse={vi.fn()} />);
      expect(screen.queryByText('Test Site')).not.toBeInTheDocument();
    });
  });

  describe('Admin Navigation', () => {
    it('should show admin link for admin users', () => {
      render(<Sidebar collapsed={false} onToggleCollapse={vi.fn()} />);
      expect(screen.getByText('Yönetici Paneli')).toBeInTheDocument();
    });
  });
});
