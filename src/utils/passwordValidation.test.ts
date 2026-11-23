import { describe, it, expect } from 'vitest';
import { validateStrongPassword } from './passwordValidation';

describe('validateStrongPassword (NFR-AUTH-SEC-004)', () => {
  it('acepta una contraseña fuerte', () => {
    expect(validateStrongPassword('Fmat#Rest2026!')).toBeNull();
  });

  it.each([
    ['', 'La contraseña es obligatoria'],
    [' Fmat#Rest2026', 'La contraseña no puede empezar ni terminar con espacios'],
    ['Fmat#Rest2026 ', 'La contraseña no puede empezar ni terminar con espacios'],
    ['Fm#1x', 'La contraseña debe tener al menos 8 caracteres'],
    [`Fm#1${'x'.repeat(70)}`, 'La contraseña no puede exceder 72 caracteres'],
  ])('rechaza "%s" por longitud o espacios', (password, message) => {
    expect(validateStrongPassword(password)).toBe(message);
  });

  it.each([
    'fmat#rest2026', // sin mayúscula
    'FMAT#REST2026', // sin minúscula
    'Fmat#RestAbc', // sin número
    'FmatRest2026x', // sin símbolo
  ])('exige mayúscula, minúscula, número y símbolo: %s', (password) => {
    expect(validateStrongPassword(password)).toMatch(/al menos una mayúscula/);
  });

  it.each([
    'Fmat#aaaa2026', // 4 caracteres repetidos
    'Fmat#1234Rest', // secuencia numérica ascendente
    'Fmat#9876Rest', // secuencia numérica descendente
    'Xabcd#Rest2026', // secuencia alfabética
    'Xzyxw#Rest2026', // secuencia alfabética descendente
    'XABCD#rest2026', // secuencia sin importar mayúsculas
  ])('rechaza secuencias triviales: %s', (password) => {
    expect(validateStrongPassword(password)).toBe(
      'La contraseña no puede contener secuencias triviales o caracteres repetidos',
    );
  });

  it('rechaza la contraseña igual al identificador (sin importar mayúsculas ni espacios)', () => {
    expect(validateStrongPassword('Ana@Fmat.Mx1', [undefined, '  ana@fmat.mx1 '])).toBe(
      'La contraseña no puede coincidir con tu identificador de usuario',
    );
  });

  it('ignora identificadores vacíos o distintos', () => {
    expect(validateStrongPassword('Fmat#Rest2026!', [undefined, '', '   ', 'M000001'])).toBeNull();
  });
});
