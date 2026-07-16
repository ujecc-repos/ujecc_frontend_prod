const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/** Parse a calendar date without allowing UTC conversion to change its day. */
export const parseDateOnly = (value?: string | null): Date | null => {
  if (!value) return null;

  const match = DATE_ONLY_PATTERN.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day, 12);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateOnly = (
  value?: string | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string => {
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString('fr-FR', options) : 'Non renseigné';
};

export const calculateAgeFromDateOnly = (value?: string | null): number => {
  const birthDate = parseDateOnly(value);
  if (!birthDate) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};
