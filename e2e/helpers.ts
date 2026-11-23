import { Page } from '@playwright/test';

export interface ConsoleIssue {
  type: string;
  text: string;
  location?: string;
}

export function setupConsoleMonitor(page: Page): {
  errors: ConsoleIssue[];
  warnings: ConsoleIssue[];
} {
  const errors: ConsoleIssue[] = [];
  const warnings: ConsoleIssue[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    const location = msg.location().url;

    if (type === 'error') {
      errors.push({ type, text, location });
    } else if (type === 'warning') {
      warnings.push({ type, text, location });
    }
  });

  page.on('pageerror', (err) => {
    errors.push({
      type: 'uncaught-exception',
      text: `${err.name}: ${err.message}\n${err.stack || ''}`,
    });
  });

  return { errors, warnings };
}

/**
 * La sesión vive solo en memoria (#6): al cargar, la app la recupera con
 * POST /auth/refresh (cookie HttpOnly) y GET /auth/me. Las pruebas simulan esas
 * dos respuestas del backend en lugar de escribir en localStorage.
 */
async function mockRestoredSession(page: Page, accessToken: string, me: Record<string, unknown>) {
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken }) }),
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(me) }),
  );
}

export async function injectAdminSession(page: Page) {
  await mockRestoredSession(page, 'mock_admin_jwt_token_for_audit', {
    id: 'b29ba2fc-4ac9-4ac9-af46-986a4089dbd5',
    userType: 'ADMIN',
    email: 'admin@fmat.com',
    firstName: 'Héctor',
    lastName: 'Pizza',
    staffProfile: { staffId: 'ADM000001', firstName: 'Héctor', lastName: 'Pizza' },
    roles: ['ADMINISTRADOR'],
    permissions: ['*'],
    passwordStatus: 'ACTIVE',
  });
}

export async function injectStaffSession(page: Page, roles: string[] = ['MESERO']) {
  await mockRestoredSession(page, 'mock_staff_jwt_token_for_audit', {
    id: '59aaa30e-4075-436e-9c61-b35a49fadbc3',
    userType: 'STAFF',
    email: null,
    firstName: 'Tony',
    lastName: 'Polanco',
    staffProfile: { staffId: 'M000003', firstName: 'Tony', lastName: 'Polanco' },
    roles,
    permissions: ['orders:orders:view', 'orders:orders:create', 'menu:catalog:read', 'sala:tables:view'],
    passwordStatus: 'ACTIVE',
  });
}
