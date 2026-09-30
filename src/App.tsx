import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  LogOut,
  Key,
  AlertCircle,
  CheckCircle2,
  Building,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  user: {
    id: string;
    restaurantId: string;
    staffId: string;
    email?: string;
    roles: string[];
    views?: string[];
  };
}

const API_BASE = 'http://localhost:4000/api/v1';

export function App() {
  const [isStaff, setIsStaff] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sesión y estados del flujo
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Registro de nuevo restaurante
  const [isRegistering, setIsRegistering] = useState(false);
  const [regData, setRegData] = useState({
    restaurantName: '',
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      setAuthData(data);
      if (data.mustChangePassword) {
        setIsChangingPassword(true);
      } else {
        // Cargar datos de perfil y vistas
        fetchMe(data.accessToken);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchMe = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const me = await res.json();
        setAuthData((prev) =>
          prev ? { ...prev, user: { ...prev.user, views: me.views } } : null,
        );
      }
    } catch (err) {
      console.error('Error fetching /me:', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/change-initial-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData?.accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar contraseña');
      }

      setPasswordSuccess('¡Contraseña actualizada con éxito! Ya estás activo.');
      setIsChangingPassword(false);
      setAuthData((prev) =>
        prev
          ? {
              ...prev,
              accessToken: data.accessToken,
              mustChangePassword: false,
            }
          : null,
      );
      fetchMe(data.accessToken);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/register-restaurant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar restaurante');
      }

      setAuthData(data);
      setIsRegistering(false);
      fetchMe(data.accessToken);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (authData?.accessToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authData.accessToken}` },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setAuthData(null);
    setIsChangingPassword(false);
    setIdentifier('');
    setPassword('');
    setError(null);
    setPasswordSuccess(null);
  };

  const fillCredentials = (type: 'admin' | 'staff') => {
    if (type === 'admin') {
      setIsStaff(false);
      setIdentifier('admin@fmat.com');
      setPassword('Admin123!');
    } else {
      setIsStaff(true);
      setIdentifier('M000001');
      setPassword('Temp1234!');
    }
    setError(null);
  };

  // VISTA: Panel de usuario autenticado
  if (authData && !isChangingPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  ¡Sesión Iniciada con Éxito!
                </h1>
                <p className="text-xs text-slate-500">
                  FMAT Restaurant · Microservicio de Autenticación
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Identificador / Staff ID:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {authData.user.staffId || 'ADMIN'}
                </span>
              </div>
              {authData.user.email && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Correo Electrónico:</span>
                  <span className="font-medium text-slate-800">
                    {authData.user.email}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Roles Asignados:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {authData.user.roles.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">ID de Restaurante:</span>
                <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
                  {authData.user.restaurantId}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2 text-sm font-semibold text-slate-700">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Módulos y Vistas Autorizadas:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(authData.user.views || ['dashboard']).map((view) => (
                  <div
                    key={view}
                    className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs font-medium text-indigo-900 flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="capitalize">{view}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA: Modal Obligatorio de Cambio de Contraseña
  if (isChangingPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-amber-100 text-amber-600 rounded-full mb-3">
              <Key className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              Cambio de Contraseña Requerido
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Es tu primer ingreso con una clave temporal. Por seguridad debes
              definir una nueva contraseña personal.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nueva Contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Confirmar Nueva Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm shadow disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Actualizar y Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA: Formulario de Registro de Nuevo Restaurante
  if (isRegistering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-indigo-100 text-indigo-600 rounded-full mb-3">
              <Building className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Registrar Restaurante
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Crea tu restaurante y cuenta principal de Administrador
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegisterRestaurant} className="space-y-4">
            <div>
              <label
                htmlFor="restaurantName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre del Restaurante
              </label>
              <input
                id="restaurantName"
                type="text"
                placeholder="Ej. La Trattoria"
                value={regData.restaurantName}
                onChange={(e) =>
                  setRegData({ ...regData, restaurantName: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="regEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Correo del Administrador
              </label>
              <input
                id="regEmail"
                type="email"
                placeholder="admin@restaurante.com"
                value={regData.email}
                onChange={(e) =>
                  setRegData({ ...regData, email: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="regPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <input
                id="regPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={regData.password}
                onChange={(e) =>
                  setRegData({ ...regData, password: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Crear Restaurante'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className="text-xs text-indigo-600 hover:underline"
            >
              ← Volver al Inicio de Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VISTA: Login Principal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-full mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FMAT Restaurant</h1>
          <p className="text-sm text-gray-600 mt-1">
            Sistema de Autenticación y Control de Personal
          </p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              isStaff
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setIsStaff(true);
              setError(null);
            }}
          >
            Personal (Staff ID)
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              !isStaff
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setIsStaff(false);
              setError(null);
            }}
          >
            Gerente / Admin
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {isStaff ? 'Staff ID (XYYYYYY)' : 'Correo Electrónico'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="identifier"
                type={isStaff ? 'text' : 'email'}
                placeholder={isStaff ? 'Ej. M000001' : 'admin@fmat.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Credenciales de Prueba Rápidas */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Credenciales de Prueba (Clic para autocompletar):</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="p-2 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg transition"
            >
              <div className="text-xs font-bold text-slate-800">
                👑 Gerente / Admin
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                admin@fmat.com
              </div>
              <div className="text-[10px] text-slate-400">Admin123!</div>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('staff')}
              className="p-2 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg transition"
            >
              <div className="text-xs font-bold text-slate-800">
                🧑‍🍳 Personal (Mesero)
              </div>
              <div className="text-[11px] text-slate-500 font-mono">M000001</div>
              <div className="text-[10px] text-amber-600">Temp1234! (temp)</div>
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setError(null);
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            ¿Eres un nuevo dueño? Registra tu restaurante aquí
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          UADY · Verificación y Validación 2026
        </div>
      </div>
    </div>
  );
}

export default App;
