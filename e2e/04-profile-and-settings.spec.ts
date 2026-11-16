import { test, expect } from '@playwright/test';
import { injectAdminSession, setupConsoleMonitor } from './helpers';

test.describe('04 - Auditoría UI: Perfil y Configuración', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar /auth/me para datos del perfil
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'b29ba2fc-4ac9-4ac9-af46-986a4089dbd5',
          userType: 'ADMIN',
          email: 'admin@fmat.com',
          firstName: 'Héctor',
          lastName: 'Pizza',
          roles: ['ADMINISTRADOR'],
          passwordStatus: 'ACTIVE',
        }),
      });
    });

    await injectAdminSession(page);
  });

  test('Renderizado de vista de Perfil y Secciones Principales', async ({ page }) => {
    const monitor = setupConsoleMonitor(page);
    await page.goto('/');

    // Navegar a perfil usando el botón de usuario del sidebar
    const profileBtn = page.locator('button[title="Ver perfil y configuración"]');
    await profileBtn.click();

    await expect(page.getByText('Perfil y Configuración')).toBeVisible();

    // Secciones
    await expect(page.getByText(/Información Personal/i)).toBeVisible();
    await expect(page.getByText(/Apariencia y Tema/i)).toBeVisible();
    await expect(page.getByText(/Zona de Peligro/i)).toBeVisible();

    // Comprobar campos de nombre y apellido
    await expect(page.getByLabel(/Nombre/i)).toBeVisible();
    await expect(page.getByLabel(/Apellido/i)).toBeVisible();

    const uncaught = monitor.errors.filter(e => e.type === 'uncaught-exception');
    expect(uncaught).toHaveLength(0);
  });

  test('Cambio de tema visual desde el Perfil', async ({ page }) => {
    await page.goto('/');
    const profileBtn = page.locator('button[title="Ver perfil y configuración"]');
    await profileBtn.click();

    // Buscar selector de tema en Apariencia
    const darkThemeCard = page.locator('button:has-text("Oscuro")').first();
    const lightThemeCard = page.locator('button:has-text("Claro")').first();

    if (await darkThemeCard.isVisible()) {
      await darkThemeCard.click();
      const themeVal = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(themeVal).toBe('dark');
    }

    if (await lightThemeCard.isVisible()) {
      await lightThemeCard.click();
      const themeVal = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(themeVal).toBe('light');
    }
  });

  test('Zona de peligro: Apertura y protección del modal de eliminación de cuenta', async ({ page }) => {
    await page.goto('/');
    const profileBtn = page.locator('button[title="Ver perfil y configuración"]');
    await profileBtn.click();

    // Botón de eliminar mi cuenta
    const deleteBtn = page.getByRole('button', { name: /Eliminar mi cuenta/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Debe abrirse modal de confirmación
    await expect(page.getByRole('heading', { name: /¿Eliminar cuenta de usuario definitivamente\?/i })).toBeVisible();

    // El botón Confirmar y eliminar debe estar deshabilitado al inicio
    const confirmBtn = page.getByRole('button', { name: /Confirmar y eliminar/i });
    await expect(confirmBtn).toBeDisabled();

    // Cancelar modal
    const cancelBtn = page.getByRole('button', { name: /Cancelar/i });
    await cancelBtn.click();
    await expect(page.getByRole('heading', { name: /¿Eliminar cuenta de usuario definitivamente\?/i })).not.toBeVisible();
  });
});
