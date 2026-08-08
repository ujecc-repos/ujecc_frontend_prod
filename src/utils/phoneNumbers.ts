const PHONE_ALLOWED_CHARACTERS = /^[+\d\s().-]+$/;

export const splitPhoneNumbers = (value?: string | null): string[] => {
  if (!value) return [];

  return value
    .split(/[\n,;]+/)
    .map((phoneNumber) => phoneNumber.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
};

const phoneNumberKey = (phoneNumber: string): string => {
  const digits = phoneNumber.replace(/\D/g, '');
  return phoneNumber.trim().startsWith('+') ? `+${digits}` : digits;
};

export const normalizePhoneNumbers = (value?: string | null): string => {
  const seen = new Set<string>();

  return splitPhoneNumbers(value)
    .filter((phoneNumber) => {
      const key = phoneNumberKey(phoneNumber);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join('\n');
};

export const getInvalidPhoneNumbers = (value?: string | null): string[] =>
  splitPhoneNumbers(value).filter((phoneNumber) => {
    const digitCount = phoneNumber.replace(/\D/g, '').length;
    return !PHONE_ALLOWED_CHARACTERS.test(phoneNumber) || digitCount < 7 || digitCount > 15;
  });

export const formatPhoneNumbersForExport = (value?: string | null): string =>
  splitPhoneNumbers(value).join(' / ');
