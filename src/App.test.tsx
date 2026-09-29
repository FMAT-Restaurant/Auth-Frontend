import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the login header correctly', () => {
    render(<App />);
    expect(screen.getByText('FMAT Restaurant')).toBeInTheDocument();
    expect(
      screen.getByText('Sistema de Autenticación y Control de Personal'),
    ).toBeInTheDocument();
  });

  it('allows toggling between Personal and Gerente modes', () => {
    render(<App />);
    const adminTab = screen.getByText('Gerente / Admin');
    const staffTab = screen.getByText('Personal (Staff ID)');

    // Default is staff
    expect(screen.getByLabelText(/Staff ID/i)).toBeInTheDocument();

    // Click admin tab
    fireEvent.click(adminTab);
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();

    // Click staff tab back
    fireEvent.click(staffTab);
    expect(screen.getByLabelText(/Staff ID/i)).toBeInTheDocument();
  });

  it('updates input values when typing', () => {
    render(<App />);
    const idInput = screen.getByLabelText(/Staff ID/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Contraseña/i) as HTMLInputElement;

    fireEvent.change(idInput, { target: { value: 'M000104' } });
    fireEvent.change(passwordInput, { target: { value: 'Temp123!' } });

    expect(idInput.value).toBe('M000104');
    expect(passwordInput.value).toBe('Temp123!');
  });
});
