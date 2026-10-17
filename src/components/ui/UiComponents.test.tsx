import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button, Input, Card, Tabs, Modal, Drawer } from './index';

describe('UI Components', () => {
  it('renders Button variants, sizes, hover states, and loading state', () => {
    const variants = ['primary', 'secondary', 'outline', 'tertiary', 'destructive', 'danger'] as const;
    variants.forEach((variant) => {
      const { unmount } = render(
        <Button variant={variant} size="sm" leftIcon={<span>L</span>} rightIcon={<span>R</span>}>
          Btn {variant}
        </Button>,
      );
      const btn = screen.getByRole('button');
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      unmount();
    });

    render(<Button isLoading>Cargando</Button>);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders Input with password toggle, focus/blur, error, helperText, and rightAction', () => {
    const { rerender } = render(
      <Input
        label="Contraseña"
        type="password"
        isPasswordToggleable
        required
        helperText="Texto de ayuda"
      />,
    );

    const input = screen.getByLabelText(/Contraseña/i) as HTMLInputElement;
    expect(input.type).toBe('password');

    fireEvent.focus(input);
    fireEvent.blur(input);

    fireEvent.click(screen.getByLabelText('Mostrar clave'));
    expect(input.type).toBe('text');

    fireEvent.click(screen.getByLabelText('Ocultar clave'));
    expect(input.type).toBe('password');

    rerender(<Input label="Campo" error="Campo inválido" rightAction={<span>Acción</span>} />);
    expect(screen.getByText('Campo inválido')).toBeInTheDocument();
    expect(screen.getByText('Acción')).toBeInTheDocument();
  });

  it('renders Card and Tabs in line and pills variants', () => {
    const onChange = vi.fn();
    const tabs = [
      { id: 't1', label: 'Tab 1', icon: <span>I1</span> },
      { id: 't2', label: 'Tab 2' },
    ];

    const { rerender } = render(
      <Card bordered={false} padding="lg">
        <Tabs tabs={tabs} activeTab="t1" onChange={onChange} variant="line" fullWidth={false} />
      </Card>,
    );

    const tab2 = screen.getByText('Tab 2').closest('button')!;
    fireEvent.mouseEnter(tab2);
    fireEvent.mouseLeave(tab2);
    fireEvent.click(tab2);
    expect(onChange).toHaveBeenCalledWith('t2');

    rerender(
      <Card bordered padding="sm">
        <Tabs tabs={tabs} activeTab="t2" onChange={onChange} variant="pills" fullWidth />
      </Card>,
    );

    const tab1 = screen.getByText('Tab 1').closest('button')!;
    fireEvent.mouseEnter(tab1);
    fireEvent.mouseLeave(tab1);
    fireEvent.click(tab1);
    expect(onChange).toHaveBeenCalledWith('t1');
  });

  it('renders Modal and Drawer with keyboard Escape and backdrop close', () => {
    const onCloseModal = vi.fn();
    const onCloseDrawer = vi.fn();

    render(
      <>
        <Modal
          isOpen={true}
          onClose={onCloseModal}
          title="Título Modal"
          description="Subtítulo Modal"
          closeOnOverlayClick={true}
          footer={<button type="button">Ok</button>}
        >
          Contenido Modal
        </Modal>
        <Drawer
          isOpen={true}
          onClose={onCloseDrawer}
          title="Título Drawer"
          subtitle="Subtítulo Drawer"
          footer={<button type="button">Guardar</button>}
        >
          Contenido Drawer
        </Drawer>
      </>,
    );

    expect(screen.getByText('Contenido Modal')).toBeInTheDocument();
    expect(screen.getByText('Contenido Drawer')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseModal).toHaveBeenCalled();
    expect(onCloseDrawer).toHaveBeenCalled();

    const drawerCloseBtn = screen.getByLabelText('Cerrar panel');
    fireEvent.click(drawerCloseBtn);
    expect(onCloseDrawer).toHaveBeenCalledTimes(2);
  });
});
