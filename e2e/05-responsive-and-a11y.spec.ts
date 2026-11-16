import { test, expect } from '@playwright/test';
import { injectAdminSession } from './helpers';

test.describe('05 - Auditoría UI: Responsividad y Accesibilidad (A11y)', () => {
  test('Responsividad en Viewport Móvil (375x667): Login', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Comprobar que no existe desbordamiento horizontal
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Los elementos clave deben seguir visibles y usables
    await expect(page.getByRole('button', { name: /Personal \(Staff ID\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Gerente \/ Admin/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar Sesión|Ingresar/i })).toBeVisible();
  });

  test('Responsividad en Viewport Móvil (375x667): Layout autenticado y Menú Hamburguesa', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await injectAdminSession(page);
    await page.goto('/');

    // En móvil debe existir el header móvil con botón hamburguesa
    const menuBtn = page.getByRole('button', { name: /Abrir navegación lateral/i });
    await expect(menuBtn).toBeVisible();

    // Abrir menú lateral
    await menuBtn.click();

    // Ahora los enlaces del sidebar deben ser visibles
    await expect(page.getByRole('button', { name: /^Inicio$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Personal y Roles/i })).toBeVisible();

    // Comprobar que no hay desborde horizontal en la vista móvil autenticada
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('Accesibilidad básica: Etiquetas en inputs y nombres accesibles en botones', async ({ page }) => {
    await page.goto('/');

    // 1. Verificar inputs de la pantalla de login
    const inputs = await page.locator('input:not([type="hidden"])').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');

      // Debe tener un id con un label asociado, o aria-label, o estar dentro de un label
      let hasAssociatedLabel = false;
      if (ariaLabel || ariaLabelledby) {
        hasAssociatedLabel = true;
      } else if (id) {
        const count = await page.locator(`label[for="${id}"]`).count();
        if (count > 0) hasAssociatedLabel = true;
      }

      expect(
        hasAssociatedLabel,
        `El input no cuenta con un label accesible asociado`
      ).toBe(true);
    }

    // 2. Botones de iconos deben tener nombre accesible (aria-label o título o texto)
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.innerText();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      const hasAccessibleName = Boolean(text.trim() || ariaLabel || title);

      expect(
        hasAccessibleName,
        `Se encontró un botón sin nombre accesible`
      ).toBe(true);
    }
  });

  test('Navegación por teclado (Focus Management / Tab)', async ({ page }) => {
    await page.goto('/');

    // Presionar Tab sucesivamente
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Comprobar que algún elemento tiene foco activo
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedTag);
  });
});
