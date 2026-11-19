export function normalizeSriLankanPhone(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, '');
  let local: string;

  if (/^\+94[0-9]{9}$/.test(digits)) local = digits.slice(3);
  else if (/^0094[0-9]{9}$/.test(digits)) local = digits.slice(4);
  else if (/^0[0-9]{9}$/.test(digits)) local = digits.slice(1);
  else if (/^[1-9][0-9]{8}$/.test(digits)) local = digits;
  else return null;

  return `+94${local}`;
}

export function normalizeUsername(input: string): string | null {
  const value = input.trim();
  return /^[A-Za-z0-9_]{3,30}$/.test(value) ? value.toLowerCase() : null;
}
