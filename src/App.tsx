import React, { useState } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';

export function App() {
  const [isStaff, setIsStaff] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { isStaff, identifier });
  };

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
            onClick={() => setIsStaff(true)}
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
            onClick={() => setIsStaff(false)}
          >
            Gerente / Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder={isStaff ? 'Ej. M000104' : 'admin@restaurante.com'}
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          UADY · Verificación y Validación 2026
        </div>
      </div>
    </div>
  );
}

export default App;
