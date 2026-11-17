import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardHomeView } from './DashboardHomeView';
import type { User } from '../../types/auth';

const baseUser = {
  id: 'usr-1',
  staffId: 'M000001',
  displayName: 'Juan Pérez',
  roleLabel: 'Mesero',
  roles: ['MESERO'],
  permissions: ['orders:view', 'menu:view'],
} as unknown as User;

describe('DashboardHomeView (UI-LAYOUT-006)', () => {
  it('no repite el Staff ID ni el puesto, que ya están en el Sidebar', () => {
    render(<DashboardHomeView currentUser={baseUser} onNavigate={vi.fn()} />);
    expect(screen.getByText('Bienvenido, Juan Pérez')).toBeInTheDocument();
    expect(screen.queryByText(/Identificador:/)).not.toBeInTheDocument();
    expect(screen.queryByText('M000001')).not.toBeInTheDocument();
    expect(screen.queryByText(/Puesto:/)).not.toBeInTheDocument();
  });

  it('muestra un resumen con los módulos disponibles', () => {
    render(<DashboardHomeView currentUser={baseUser} onNavigate={vi.fn()} />);
    expect(screen.getByTestId('dashboard-summary')).toHaveTextContent('Tienes 2 módulos disponibles.');
  });

  it('avisa si el usuario no tiene módulos', () => {
    render(
      <DashboardHomeView currentUser={{ ...baseUser, permissions: [] }} onNavigate={vi.fn()} />,
    );
    expect(screen.getByTestId('dashboard-summary')).toHaveTextContent(
      'Aún no tienes módulos asignados',
    );
  });
});
