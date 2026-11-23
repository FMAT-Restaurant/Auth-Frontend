const NO_SURROUNDING_WHITESPACE = /^\S(?:[\s\S]*\S)?$/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /\d/;
const HAS_SYMBOL = /[^A-Za-z0-9\s]/;
const HAS_REPEATED_RUN = /(.)\1{3,}/;
const SEQUENTIAL_RUNS = [
  '0123456789',
  '9876543210',
  'abcdefghijklmnopqrstuvwxyz',
  'zyxwvutsrqponmlkjihgfedcba',
];

function hasTrivialSequence(password: string): boolean {
  if (HAS_REPEATED_RUN.test(password)) {
    return true;
  }
  const lower = password.toLowerCase();
  for (const seq of SEQUENTIAL_RUNS) {
    for (let i = 0; i <= seq.length - 4; i += 1) {
      if (lower.includes(seq.slice(i, i + 4))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Política unificada de contraseña definitiva (NFR-AUTH-SEC-004).
 * Espeja exactamente la validación del backend para evitar discrepancias entre cliente y servidor.
 */
export function validateStrongPassword(
  password: string,
  forbiddenIdentifiers: Array<string | undefined> = [],
): string | null {
  if (!password) {
    return 'La contraseña es obligatoria';
  }
  if (!NO_SURROUNDING_WHITESPACE.test(password)) {
    return 'La contraseña no puede empezar ni terminar con espacios';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (password.length > 72) {
    return 'La contraseña no puede exceder 72 caracteres';
  }
  if (
    !HAS_UPPERCASE.test(password) ||
    !HAS_LOWERCASE.test(password) ||
    !HAS_DIGIT.test(password) ||
    !HAS_SYMBOL.test(password)
  ) {
    return 'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un símbolo especial';
  }
  if (hasTrivialSequence(password)) {
    return 'La contraseña no puede contener secuencias triviales o caracteres repetidos';
  }

  const lower = password.toLowerCase();
  for (const id of forbiddenIdentifiers) {
    const cleanId = id?.trim().toLowerCase();
    if (cleanId && lower === cleanId) {
      return 'La contraseña no puede coincidir con tu identificador de usuario';
    }
  }

  return null;
}
