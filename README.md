# Interfaz Web de Autenticación y Control de Personal (Auth-Frontend)

Aplicación web (SPA) desarrollada para la gestión de acceso, control de identidad, asignación de roles PBAC y administración de personal de **FMAT Restaurant**.

---

## 🎨 Características Principales

* **Pantalla de Autenticación Unificada:**
  * Pestaña **Personal (Staff ID):** Login ágil para meseros, chefs, almacenistas y hosts con identificador único (`M000001`, `C000001`, etc.).
  * Pestaña **Gerente:** Login y alta segura para administradores con correo corporativo.
* **Flujo de Seguridad de Primer Ingreso:** Modal obligatorio de cambio de contraseña cuando un colaborador inicia sesión con una clave temporal asignada por el sistema.
* **Panel de Gestión de Colaboradores:**
  * Tabla interactiva de empleados con filtrado por rol y estado.
  * **Expediente Lateral (Drawer):** Al presionar cualquier colaborador se despliega un panel lateral derecho para editar sus datos, reactivar/suspender cuenta, restablecer contraseña temporal y dar de baja de forma protegida.
  * Visualización y copia rápida de contraseñas provisionales generadas aleatoriamente por el backend (solo visibles mientras no hayan sido reemplazadas por el colaborador).
* **Gestión Dinámica de Roles y Permisos (PBAC):**
  * Asignación de roles predefinidos o personalizados.
  * Pestaña de creación de roles basada en permisos desglosados por microservicio (Inventario, Sala, Cocina/KDS, Caja, etc.).
  * Opción de personalizar permisos directamente durante el alta de un colaborador con guardado opcional como nuevo rol.
* **Perfil y Preferencias:**
  * Configuración de datos personales (solo editable por administradores, modo lectura para personal operativo).
  * Modo Oscuro/Claro integrado con paleta Obsidian Espresso & Burnt Copper.
  * Eliminación de cuenta protegida exclusivamente para administradores.

---

## 🛠️ Tecnologías y Stack

* **Framework:** React 18 con TypeScript y Vite
* **Estilos:** Variables CSS nativas con soporte completo para Tema Claro / Oscuro
* **Pruebas:** Vitest y React Testing Library (58 pruebas unitarias y de integración) + Playwright (E2E)
* **Despliegue:** Nginx Alpine (Multi-stage build) con reverse-proxy interno hacia la API REST

---

## 🚀 Inicio Rápido

### Opción 1: Con Docker (Recomendado)

En la raíz del proyecto (`FmatRestaurant`), ejecuta:

```bash
docker compose up --build
```

La aplicación web estará disponible en [http://localhost:3000](http://localhost:3000).

---

### Opción 2: Desarrollo Local (sin Docker)

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Variables de entorno (opcional):**
   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

   ```env
   # "auto" = mismo origen (/api/v1); Vite reenvía /api al API Gateway
   VITE_API_BASE_URL=auto
   # Destino del Gateway para ese proxy (se resuelve en tu máquina)
   VITE_GATEWAY_TARGET=http://localhost:8000
   # Gateway para los microfrontends ("auto" = http://<host>:8000)
   VITE_GATEWAY_URL=auto
   ```

   **Toda la API pasa por el API Gateway.** El shell nunca llama directo a Auth-Backend (puerto 4000): pide `/api/v1/...` a su propio origen y el servidor de Vite (o nginx en producción) lo reenvía a Kong, que valida el JWT (`iss`, `aud`, `exp`) antes de llegar al backend. La cookie del refresh token queda como cookie de primera parte.

   **Usarlo desde otra red (por ejemplo, la de la facultad):**
   1. Levanta Auth-Backend, API-Gateway y `npm run dev` en tu equipo, como siempre.
   2. Abre `http://<tu-IP>:3000` desde tu equipo o desde otros equipos de la red. El login, Personal y Roles funcionan sin cambiar nada, porque el proxy se resuelve en tu equipo.
   3. Para los microfrontends (que llaman al Gateway en `http://<tu-IP>:8000`), agrega `http://<tu-IP>:3000` a `CORS_ORIGINS` en el `.env` del API-Gateway y recréalo (`docker compose up -d --force-recreate`).
   4. Si varias personas inician sesión desde la misma red en poco tiempo, todas llegan al backend con la IP del Gateway; sube `AUTH_RATE_LIMIT` en el `.env` de Auth-Backend para la demo (el límite por cuenta sigue aplicando).

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Ejecutar pruebas unitarias:**
   ```bash
   npm test
   ```

5. **Compilar para producción:**
   ```bash
   npm run build
   ```
