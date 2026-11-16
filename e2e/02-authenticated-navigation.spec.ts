import { test, expect } from '@playwright/test';
import { injectAdminSession, setupConsoleMonitor } from './helpers';

test.describe('02 - Auditoría UI: Layout y Navegación Autenticada', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar llamadas al backend para evitar expiración 401 durante la auditoría de navegación
    await page.route('**/api/v1/staff', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/roles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/roles/catalog', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await injectAdminSession(page);
  });

  test('Renderizado del Layout Principal, datos del usuario y Sidebar', async ({ page }) => {
    const monitor = setupConsoleMonitor(page);
    await page.goto('/');

    // Verificar saludo en dashboard principal y datos del usuario
    await expect(page.getByRole('heading', { name: /Bienvenido, Héctor Pizza/i })).toBeVisible();

    // Verificar tarjeta de usuario en el Sidebar
    const userCardBtn = page.locator('button[title="Ver perfil y configuración"]');
    await expect(userCardBtn).toBeVisible();
    await expect(userCardBtn).toContainText('Héctor Pizza');
    await expect(userCardBtn).toContainText('ADM000001');

    // Verificar módulos visibles en la barra lateral
    await expect(page.getByRole('button', { name: /^Inicio$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Personal y Roles/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Inventario/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sala/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Menú/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Órdenes y Cocina/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Caja/i })).toBeVisible();

    // Verificar ausencia de excepciones críticas
    const uncaught = monitor.errors.filter(e => e.type === 'uncaught-exception');
    expect(uncaught).toHaveLength(0);
  });

  test('Navegación exhaustiva por todos los módulos del sistema', async ({ page }) => {
    const monitor = setupConsoleMonitor(page);
    await page.goto('/');

    // 1. Módulo Inicio
    await page.getByRole('button', { name: /^Inicio$/i }).click();
    await expect(page.getByRole('heading', { name: /Bienvenido, Héctor Pizza/i })).toBeVisible();

    // 2. Módulo Personal y Roles
    await page.getByRole('button', { name: /Personal y Roles/i }).click();
    await expect(page.getByText(/Control de Personal y Accesos/i)).toBeVisible();

    // 3. Módulo Inventario (Placeholder federado)
    await page.getByRole('button', { name: /Inventario/i }).click();
    await expect(page.getByText(/Inventario/i).first()).toBeVisible();

    // 4. Módulo Sala (Placeholder federado)
    await page.getByRole('button', { name: /Sala/i }).click();
    await expect(page.getByText(/Sala/i).first()).toBeVisible();

    // 5. Módulo Menú (Placeholder federado)
    await page.getByRole('button', { name: /Menú/i }).click();
    await expect(page.getByText(/Menú/i).first()).toBeVisible();

    // 6. Módulo Órdenes (Placeholder federado)
    await page.getByRole('button', { name: /Órdenes y Cocina/i }).click();
    await expect(page.getByText(/Órdenes/i).first()).toBeVisible();

    // 7. Módulo Caja (Placeholder federado)
    await page.getByRole('button', { name: /Caja/i }).click();
    await expect(page.getByText(/Caja/i).first()).toBeVisible();

    // 8. Módulo Perfil
    const profileBtn = page.locator('button[title="Ver perfil y configuración"]');
    await profileBtn.click();
    await expect(page.getByText(/Perfil y Configuración/i)).toBeVisible();

    // Verificar advertencias de React o errores en consola
    const reactKeyWarnings = monitor.warnings.filter(w => w.text.includes('unique "key" prop'));
    expect(reactKeyWarnings).toHaveLength(0);
  });

  test('Persistencia de sesión tras recarga y cierre de sesión seguro', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Bienvenido, Héctor Pizza/i })).toBeVisible();

    // Recargar página
    await page.reload();
    await expect(page.getByRole('heading', { name: /Bienvenido, Héctor Pizza/i })).toBeVisible();

    // Cierre de sesión
    const logoutBtn = page.getByRole('button', { name: /Cerrar sesión/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verificar redirección a pantalla de autenticación
    await expect(page.getByRole('button', { name: /Personal \(Staff ID\)/i })).toBeVisible();
    await expect(page.locator('h1')).toContainText('FMAT Restaurant');

    // Verificar que localStorage ya no contiene la sesión
    const session = await page.evaluate(() => localStorage.getItem('fmat_restaurant_auth_session'));
    expect(session).toBeNull();
  });
});
