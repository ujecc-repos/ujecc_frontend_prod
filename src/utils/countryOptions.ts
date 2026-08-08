import { Country } from 'country-state-city';

export interface CountryOption {
  value: string;
  label: string;
  isoCode: string;
}

const frenchCollator = new Intl.Collator('fr', { sensitivity: 'base' });

export const countryOptions: CountryOption[] = Country.getAllCountries()
  .map((country) => ({
    value: country.name,
    label: country.name,
    isoCode: country.isoCode,
  }))
  .sort((first, second) => {
    if (first.isoCode === 'HT') return -1;
    if (second.isoCode === 'HT') return 1;
    return frenchCollator.compare(first.label, second.label);
  });

export const findCountryOption = (countryName?: string | null): CountryOption | null => {
  if (!countryName) return null;
  const normalizedName = countryName.trim().toLocaleLowerCase('fr');

  return countryOptions.find((option) =>
    option.value.toLocaleLowerCase('fr') === normalizedName
    || (option.isoCode === 'HT' && ['haiti', 'haïti'].includes(normalizedName))
  ) || { value: countryName, label: countryName, isoCode: '' };
};
