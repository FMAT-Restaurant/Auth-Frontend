import { test, expect } from '@playwright/test';
import { setupConsoleMonitor } from './helpers';

test.describe('01 - Auditoría UI: Pantalla de Login y Autenticación', () => {
  test('Renderizado de elementos principales y branding', async ({ page }) => {
    const monitor = setupConsoleMonitor(page);
    await page.goto('/');

    // Verificar encabezado de marca
    await expect(page.locator('h1')).toContainText('FMAT Restaurant');
    await expect(page.getByText('Sistema de Restaurante')).toBeVisible();

    // Verificar presencia de pestañas de inicio de sesión
    await expect(page.getByRole('button', { name: /Personal \(Staff ID\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Gerente \/ Admin/i })).toBeVisible();

    // Verificar botón de submit
    await expect(page.getByRole('button', { name: /Iniciar Sesión|Ingresar|Acceder/i })).toBeVisible();

    // Verificar que no ocurrieron excepciones JS fatales
    const fatalErrors = monitor.errors.filter(e => e.type === 'uncaught-exception');
    expect(fatalErrors).toHaveLength(0);
  });

  test('Alternancia de tema visual (Claro / Oscuro) y persistencia', async ({ page }) => {
    await page.goto('/');

    // Botón de alternancia de tema
    const themeBtn = page.getByRole('button', { name: /Alternar modo visual/i });
    await expect(themeBtn).toBeVisible();

    // Estado inicial de data-theme
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

    // Clic para alternar tema
    await themeBtn.click();
    const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(toggledTheme).not.toBe(initialTheme);

    const storedTheme = await page.evaluate(() => localStorage.getItem('fmat_theme'));
    expect(storedTheme).toBe(toggledTheme);

    // Recargar para comprobar persistencia
    await page.reload();
    const persistedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(persistedTheme).toBe(toggledTheme);
  });

  test('Alternancia entre pestañas Personal y Gerente y detección inteligente de formato', async ({ page }) => {
    await page.goto('/');

    // Por defecto debe estar activa la pestaña Personal
    await expect(page.getByLabel(/Staff ID/i)).toBeVisible();

    // Escribir un correo electrónico en Staff ID
    const staffInput = page.getByLabel(/Staff ID/i);
    await staffInput.fill('admin@fmat.com');

    // Debe aparecer la sugerencia inteligente
    const emailSuggestion = page.getByRole('button', { name: /Parece un correo electrónico/i });
    await expect(emailSuggestion).toBeVisible();

    // Clic en la sugerencia inteligente para cambiar de tab automáticamente
    await emailSuggestion.click();
    await expect(page.getByLabel(/Correo Electrónico/i)).toBeVisible();

    // Escribir un Staff ID en el campo de Correo Electrónico
    const emailInput = page.getByLabel(/Correo Electrónico/i);
    await emailInput.fill('M000001');

    // Debe sugerir cambiar a Personal
    const staffSuggestion = page.getByRole('button', { name: /Parece un Staff ID/i });
    await expect(staffSuggestion).toBeVisible();
    await staffSuggestion.click();
    await expect(page.getByLabel(/Staff ID/i)).toBeVisible();
  });

  test('Alternancia de visibilidad de contraseña (Toggle Show/Hide)', async ({ page }) => {
    await page.goto('/');

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('ClaveSecreta123!');

    // Botón de mostrar/ocultar contraseña (accessible name: "Mostrar clave")
    const togglePassBtn = page.getByRole('button', { name: /Mostrar clave|Ocultar clave/i });
    await expect(togglePassBtn).toBeVisible();

    // Al hacer click, el type debe cambiar a 'text'
    await togglePassBtn.click();
    await expect(page.locator('input[value="ClaveSecreta123!"]')).toHaveAttribute('type', 'text');

    // Al volver a hacer click, regresa a 'password'
    await togglePassBtn.click();
    await expect(page.locator('input[value="ClaveSecreta123!"]')).toHaveAttribute('type', 'password');
  });

  test('Validación de campos vacíos y credenciales erróneas', async ({ page }) => {
    await page.goto('/');

    const submitBtn = page.getByRole('button', { name: /Iniciar Sesión|Ingresar|Acceder/i });

    // Intentar enviar con campos vacíos
    await submitBtn.click();

    // Enviar credenciales incorrectas
    await page.getByLabel(/Staff ID/i).fill('M999999');
    await page.locator('input[type="password"]').fill('ClaveErronea999!');
    await submitBtn.click();

    // Debe mostrar banner o alerta de error
    const errorAlert = page.locator('[role="alert"], .fmat-alert, div:has-text("Error"), div:has-text("inválido"), div:has-text("problemas")').first();
    await expect(errorAlert).toBeVisible({ timeout: 7000 });
  });

  test('Modal de recuperación de contraseña ("¿Olvidaste tu contraseña?")', async ({ page }) => {
    await page.goto('/');

    // Buscar botón de olvidó contraseña
    const forgotBtn = page.getByRole('button', { name: /¿Olvidaste tu contraseña\?/i });
    await expect(forgotBtn).toBeVisible();
    await forgotBtn.click();

    // Debe abrirse el modal
    await expect(page.getByRole('heading', { name: /¿Olvidaste tu contraseña\?/i })).toBeVisible();
    await expect(page.getByLabel(/Staff ID \/ Matrícula/i)).toBeVisible();

    // Probar cancelar y cerrar modal
    const cancelBtn = page.getByRole('button', { name: /Cancelar/i });
    await cancelBtn.click();
    await expect(page.getByRole('heading', { name: /¿Olvidaste tu contraseña\?/i })).not.toBeVisible();
  });
});
