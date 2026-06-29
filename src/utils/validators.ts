const PHONE_RE = /^1[3-9]\d{9}$/;
const CODE_RE = /^\d{6}$/;
const MAINLAND_ID_RE = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

export function isPhone(value: string): boolean {
  return PHONE_RE.test(value.trim());
}

export function isSmsCode(value: string): boolean {
  return CODE_RE.test(value.trim());
}

export function isMainlandId(value: string): boolean {
  return MAINLAND_ID_RE.test(value.trim());
}

export function normalizeIdCard(value: string): string {
  return value.trim().toUpperCase();
}

export function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a || '').trim().normalize('NFC') === (b || '').trim().normalize('NFC');
}
