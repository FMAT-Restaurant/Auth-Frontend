import React, { useState, useEffect, useCallback, Suspense, Component } from 'react';
import { Button } from '../ui';
import { AlertCircleIcon, LoaderIcon } from '../ui/Icons';
import type { NavModuleId } from './Sidebar';
import type { User, FederatedModuleProps } from '../../types/auth';

interface ModulePlaceholderViewProps {
  moduleId: NavModuleId;
  currentUser: User;
  token?: string;
  theme?: 'light' | 'dark';
}

interface MicrofrontendInfo {
  title: string;
  team: string;
  remoteName: string;
  defaultPort: number;
  loadComponent: () => Promise<{ default: React.ComponentType<FederatedModuleProps> }>;
}

const MODULE_REGISTRY: Record<string, MicrofrontendInfo> = {
  sala: {
    title: 'Módulo de Sala y Mesas',
    team: 'Equipo Sala / Host',
    remoteName: 'salaApp/App',
    defaultPort: 5174,
    loadComponent: () => import('salaApp/App'),
  },
  menu: {
    title: 'Módulo de Menú y Catálogo',
    team: 'Equipo Menú',
    remoteName: 'menuApp/App',
    defaultPort: 5175,
    loadComponent: () => import('menuApp/App'),
  },
  inventario: {
    title: 'Módulo de Inventario y Almacén',
    team: 'Equipo Inventario',
    remoteName: 'inventarioApp/App',
    defaultPort: 5176,
    loadComponent: () => import('inventarioApp/App'),
  },
  ordenes: {
    title: 'Módulo de Órdenes y Cocina (KDS)',
    team: 'Equipo Orders + Kitchen',
    remoteName: 'ordenesApp/App',
    defaultPort: 5177,
    loadComponent: () => import('ordenesApp/App'),
  },
  caja: {
    title: 'Módulo de Caja y Facturación',
    team: 'Equipo Billing & Payments',
    remoteName: 'cajaApp/App',
    defaultPort: 5178,
    loadComponent: () => import('cajaApp/App'),
  },
};

interface RemoteErrorBoundaryProps {
  onRetry: () => void;
  title: string;
  children: React.ReactNode;
}

interface RemoteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RemoteErrorBoundary extends Component<RemoteErrorBoundaryProps, RemoteErrorBoundaryState> {
  constructor(props: RemoteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RemoteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error al renderizar el microfrontend federado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            flex: 1,
            width: '100%',
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <AlertCircleIcon size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '8px' }}>
            Falló la conexión con el servicio
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', maxWidth: '460px', marginBottom: '24px', lineHeight: 1.5 }}>
            Ocurrió un problema al cargar el {this.props.title}. Por favor verifica que el servicio esté activo e inténtalo nuevamente.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              void this.props.onRetry();
            }}
          >
            <LoaderIcon size={16} />
            <span style={{ marginLeft: '8px' }}>Volver a intentar</span>
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ModulePlaceholderView: React.FC<ModulePlaceholderViewProps> = ({
  moduleId,
  currentUser,
  token,
  theme = 'light',
}) => {
  const info = MODULE_REGISTRY[moduleId] || MODULE_REGISTRY.sala;

  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [RemoteComponent, setRemoteComponent] = useState<React.LazyExoticComponent<
    React.ComponentType<FederatedModuleProps>
  > | null>(null);

  const remoteEntryUrl = `http://localhost:${info.defaultPort}/assets/remoteEntry.js`;

  const loadModule = useCallback(async () => {
    setStatus('loading');
    try {
      const resp = await fetch(remoteEntryUrl);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const LazyRemote = React.lazy(info.loadComponent);
      setRemoteComponent(() => LazyRemote);
      setStatus('online');
    } catch (err) {
      // Que el servicio de otro equipo esté apagado es un estado esperado (se muestra
      // la pantalla "Falló la conexión"), así que se registra como advertencia y no
      // como error no controlado.
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[Microfrontends] ${info.remoteName} no disponible en ${remoteEntryUrl} (${reason})`);
      setStatus('offline');
    }
  }, [remoteEntryUrl, info.loadComponent, info.remoteName]);

  // Carga automática inmediata al entrar a la sección o cambiar de módulo
  useEffect(() => {
    void loadModule();
  }, [loadModule]);

  // 1. Pantalla de carga automática centrada
  if (status === 'loading') {
    return (
      <div
        style={{
          flex: 1,
          width: '100%',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <LoaderIcon size={36} color="var(--color-primary)" />
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>
          Cargando {info.title}...
        </span>
      </div>
    );
  }

  // 2. Pantalla de fallo de conexión con botón "Volver a intentar"
  if (status === 'offline') {
    return (
      <div
        style={{
          flex: 1,
          width: '100%',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <AlertCircleIcon size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '8px' }}>
          Falló la conexión
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', maxWidth: '460px', marginBottom: '24px', lineHeight: 1.5 }}>
          No fue posible conectar con el <strong>{info.title}</strong>. El servidor remoto no responde o se encuentra fuera de línea.
        </p>
        <Button variant="primary" size="md" onClick={() => void loadModule()}>
          <LoaderIcon size={16} />
          <span style={{ marginLeft: '8px' }}>Volver a intentar</span>
        </Button>
      </div>
    );
  }

  // 3. Renderizado a pantalla completa integrado naturalmente en el Shell
  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <RemoteErrorBoundary onRetry={loadModule} title={info.title}>
        <Suspense
          fallback={
            <div
              style={{
                flex: 1,
                width: '100%',
                minHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <LoaderIcon size={36} color="var(--color-primary)" />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Inicializando interfaz...
              </span>
            </div>
          }
        >
          {RemoteComponent && <RemoteComponent token={token} currentUser={currentUser} theme={theme} />}
        </Suspense>
      </RemoteErrorBoundary>
    </div>
  );
};
