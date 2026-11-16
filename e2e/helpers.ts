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

export async function injectAdminSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'fmat_restaurant_auth_session',
      JSON.stringify({
        accessToken: 'mock_admin_jwt_token_for_audit',
        refreshToken: 'mock_admin_refresh_token',
        user: {
          id: 'b29ba2fc-4ac9-4ac9-af46-986a4089dbd5',
          userType: 'ADMIN',
          staffId: 'ADM000001',
          email: 'admin@fmat.com',
          firstName: 'Héctor',
          lastName: 'Pizza',
          displayName: 'Héctor Pizza',
          roleLabel: 'Administrador',
          roles: ['ADMINISTRADOR'],
          permissions: ['*'],
          mustChangePassword: false,
        },
      })
    );
  });
}

export async function injectStaffSession(page: Page, roles: string[] = ['MESERO']) {
  await page.addInitScript((rolesParam) => {
    localStorage.setItem(
      'fmat_restaurant_auth_session',
      JSON.stringify({
        accessToken: 'mock_staff_jwt_token_for_audit',
        refreshToken: 'mock_staff_refresh_token',
        user: {
          id: '59aaa30e-4075-436e-9c61-b35a49fadbc3',
          userType: 'STAFF',
          staffId: 'M000003',
          email: null,
          firstName: 'Tony',
          lastName: 'Polanco',
          displayName: 'Tony Polanco',
          roleLabel: rolesParam.join(', '),
          roles: rolesParam,
          permissions: ['orders:view', 'orders:create', 'menu:view', 'sala:tables:view'],
          mustChangePassword: false,
        },
      })
    );
  }, roles);
}
