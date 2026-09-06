export const meetingDayOptions = [
  { value: 'Lendi', label: 'Lendi' },
  { value: 'Madi', label: 'Madi' },
  { value: 'Mèkredi', label: 'Mèkredi' },
  { value: 'Jedi', label: 'Jedi' },
  { value: 'Vandredi', label: 'Vandredi' },
  { value: 'Samdi', label: 'Samdi' },
  { value: 'Dimanch', label: 'Dimanch' },
];

const aliases: Record<string, string> = {
  lundi: 'Lendi',
  lendi: 'Lendi',
  mardi: 'Madi',
  madi: 'Madi',
  mercredi: 'Mèkredi',
  mekredi: 'Mèkredi',
  mèkredi: 'Mèkredi',
  jeudi: 'Jedi',
  jedi: 'Jedi',
  vendredi: 'Vandredi',
  vandredi: 'Vandredi',
  samedi: 'Samdi',
  samdi: 'Samdi',
  dimanche: 'Dimanch',
  dimanch: 'Dimanch',
};

export const parseMeetingDays = (value?: string | string[] | null): string[] => {
  const values = Array.isArray(value) ? value : (value || '').split(',');

  return Array.from(new Set(values
    .map((day) => day.trim().replace(/^Chaque\s+/i, '').toLocaleLowerCase('fr'))
    .map((day) => aliases[day])
    .filter((day): day is string => Boolean(day))));
};
