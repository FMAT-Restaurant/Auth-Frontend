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
* **Pruebas:** Vitest y React Testing Library (13 pruebas de componentes e integración)
* **Despliegue:** Nginx Alpine (Multi-stage build) con reverse-proxy interno hacia la API REST

---

## 🚀 Inicio Rápido

### Opción 1: Con Docker (Recomendado)

En la raíz del proyecto (`FmatRestaurant`), ejecuta:

```bash
docker compose up --build
```

La aplicación web estará disponible en [http://localhost:5173](http://localhost:5173).

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
   # URL base de la API del Backend (por defecto http://localhost:4000/api/v1)
   VITE_API_BASE_URL=http://localhost:4000/api/v1
   ```

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
