import { test, expect } from '@playwright/test';
import { injectAdminSession, setupConsoleMonitor } from './helpers';

test.describe('03 - Auditoría UI: Módulo de Gestión de Personal y Roles', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar llamadas API para que el módulo muestre un conjunto predecible de datos y pruebe la UI
    await page.route('**/api/v1/staff', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'collab-1',
              staffId: 'M000001',
              firstName: 'Carlos',
              lastName: 'López',
              roles: ['MESERO'],
              isActive: true,
              passwordStatus: 'TEMPORARY',
              temporaryPassword: 'TempPassword123!',
              passwordResetRequested: false,
              createdAt: '2026-09-30T00:07:09.334Z',
            },
            {
              id: 'collab-2',
              staffId: 'M000003',
              firstName: 'Tony',
              lastName: 'Polanco',
              roles: ['HOST'],
              isActive: true,
              passwordStatus: 'ACTIVE',
              temporaryPassword: null,
              passwordResetRequested: true,
              createdAt: '2026-10-02T07:00:21.071Z',
            },
            {
              id: 'collab-3',
              staffId: 'C000005',
              firstName: 'Ana',
              lastName: 'Martínez',
              roles: ['CHEF_MASTER'],
              isActive: false,
              passwordStatus: 'ACTIVE',
              temporaryPassword: null,
              passwordResetRequested: false,
              createdAt: '2026-10-05T12:00:00.000Z',
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/roles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            code: 'MESERO',
            name: 'Mesero',
            description: 'Gestión y toma de órdenes de comensales',
            permissions: ['orders:orders:view', 'orders:orders:create', 'menu:catalog:read', 'sala:tables:view'],
          },
          {
            code: 'HOST',
            name: 'Host / Anfitrión',
            description: 'Recepción y asignación de mesas en sala',
            permissions: ['sala:tables:view', 'sala:tables:occupy', 'sala:tables:assign_waiter'],
          },
          {
            code: 'CHEF_MASTER',
            name: 'Chef Ejecutivo',
            description: 'Control de comandas de cocina y KDS',
            permissions: ['kitchen:kds:view', 'kitchen:order:start_preparation', 'kitchen:order:mark_ready'],
          },
        ]),
      });
    });

    await page.route('**/api/v1/roles/catalog', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            serviceKey: 'sala',
            serviceName: 'Módulo de Sala',
            permissions: [
              { code: 'sala:tables:view', description: 'Visualizar mesas' },
              { code: 'sala:tables:occupy', description: 'Ocupar mesas' },
            ],
          },
          {
            serviceKey: 'orders',
            serviceName: 'Módulo de Órdenes',
            permissions: [
              { code: 'orders:orders:view', description: 'Ver comandas y pedidos' },
              { code: 'orders:orders:create', description: 'Crear nuevas comandas' },
            ],
          },
        ]),
      });
    });

    await injectAdminSession(page);
  });

  test('Renderizado de vista de Personal Operativo, colaboradores y etiquetas', async ({ page }) => {
    const monitor = setupConsoleMonitor(page);
    await page.goto('/');

    await page.getByRole('button', { name: /Personal y Roles/i }).click();

    // Título de la vista
    await expect(page.getByText('Control de Personal y Accesos')).toBeVisible();

    // Colaboradores listados
    await expect(page.getByText('Carlos López')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'M000001' })).toBeVisible();
    await expect(page.getByText('Tony Polanco')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'M000003' })).toBeVisible();
    await expect(page.getByText('Ana Martínez')).toBeVisible();

    // Estados de cuenta
    await expect(page.getByText(/Activo/i).first()).toBeVisible();

    // Botón de dar de alta
    await expect(page.getByRole('button', { name: /\+ Dar de alta empleado/i })).toBeVisible();

    // Comprobar errores de consola
    const uncaught = monitor.errors.filter(e => e.type === 'uncaught-exception');
    expect(uncaught).toHaveLength(0);
  });

  test('Formulario de alta de nuevo empleado: apertura, validación y campos', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Personal y Roles/i }).click();

    // Abrir formulario
    const createBtn = page.getByRole('button', { name: /\+ Dar de alta empleado/i });
    await createBtn.click();

    // Verificar que el botón cambia a 'Cerrar formulario'
    await expect(page.getByRole('button', { name: /Cerrar formulario/i })).toBeVisible();

    // Verificar campos del formulario
    await expect(page.getByLabel(/Nombre\(s\)/i)).toBeVisible();
    await expect(page.getByLabel(/Apellidos/i)).toBeVisible();

    // Probar cerrar formulario
    await page.getByRole('button', { name: /Cerrar formulario/i }).click();
    await expect(page.getByLabel(/Nombre\(s\)/i)).not.toBeVisible();
  });

  test('Pestaña de Roles y Permisos por Microservicio', async ({ page }) => {
    const monitor = setupConsoleMonitor(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Personal y Roles/i }).click();

    // Cambiar a la pestaña de roles (es un rol tab)
    const rolesTab = page.getByRole('tab', { name: /Roles y Permisos/i });
    await rolesTab.click();

    // Verificar roles renderizados
    await expect(page.getByRole('heading', { name: 'Mesero' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Host / Anfitrión' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chef Ejecutivo' })).toBeVisible();

    // Abrir modal de creación de rol para inspeccionar catálogo de permisos por microservicio
    const newRoleBtn = page.getByRole('button', { name: /\+ Crear Nuevo Rol/i });
    await expect(newRoleBtn).toBeVisible();
    await newRoleBtn.click();

    // Verificar que el catálogo de permisos por microservicio se muestra en el modal
    await expect(page.getByText('Módulo de Sala')).toBeVisible();
    await expect(page.getByText('Módulo de Órdenes')).toBeVisible();

    // Cancelar modal
    await page.getByRole('button', { name: /Cancelar/i }).click();

    const uncaught = monitor.errors.filter(e => e.type === 'uncaught-exception');
    expect(uncaught).toHaveLength(0);
  });

  test('Drawer lateral de detalle de colaborador', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Personal y Roles/i }).click();

    // Clic en la fila de Carlos López para abrir su expediente
    const row = page.locator('tr:has-text("Carlos López")');
    await expect(row).toBeVisible();
    await row.click();

    // Verificar que se abre el drawer lateral
    await expect(page.getByText('Expediente de Personal Operativo')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Carlos López' })).toBeVisible();

    // Cerrar drawer
    const closeBtn = page.getByRole('button', { name: /Cerrar/i }).last();
    await closeBtn.click();
    await expect(page.getByText('Expediente de Personal Operativo')).not.toBeVisible();
  });
});
