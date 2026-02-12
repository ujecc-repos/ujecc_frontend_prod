import { useState } from 'react';
import Select from 'react-select';
import type { SingleValue } from 'react-select';

// Types for Options
interface OptionType {
  value: string;
  label: string;
}

// Data Structure Type
interface DataType {
  [departement: string]: {
    communes: {
      [commune: string]: string[];
    };
  };
}

// Static Data
const data: DataType = {
  "Ouest": {
    communes: {
      "Port-au-Prince": ["Bel-Air", "Martissant"],
      "Delmas": ["Delmas 33", "Delmas 75"],
    },
  },
  "Nord": {
    communes: {
      "Cap-Haïtien": ["Shada", "Petite Anse"],
      "Limonade": ["Limonade Centre", "Limonade Sud"],
    },
  },
};

export default function LocationSelector() {
  const [departement, setDepartement] = useState<OptionType | null>(null);
  const [commune, setCommune] = useState<OptionType | null>(null);
  const [sectionCommunale, setSectionCommunale] = useState<OptionType | null>(null);

  const departementOptions: OptionType[] = Object.keys(data).map((dept) => ({
    value: dept,
    label: dept,
  }));

  const communeOptions: OptionType[] = departement
    ? Object.keys(data[departement.value].communes).map((commune) => ({
        value: commune,
        label: commune,
      }))
    : [];

  const sectionCommunaleOptions: OptionType[] = departement && commune
    ? data[departement.value].communes[commune.value].map((section) => ({
        value: section,
        label: section,
      }))
    : [];

  const handleDepartementChange = (selectedOption: SingleValue<OptionType>) => {
    setDepartement(selectedOption);
    setCommune(null);
    setSectionCommunale(null);
  };

  const handleCommuneChange = (selectedOption: SingleValue<OptionType>) => {
    setCommune(selectedOption);
    setSectionCommunale(null);
  };

  const handleSectionCommunaleChange = (selectedOption: SingleValue<OptionType>) => {
    setSectionCommunale(selectedOption);
  };

  return (
    <div style={{ width: 300 }}>
      <h3>Département</h3>
      <Select
        options={departementOptions}
        value={departement}
        onChange={handleDepartementChange}
        placeholder="Choisir un département"
      />

      <h3>Commune</h3>
      <Select
        options={communeOptions}
        value={commune}
        onChange={handleCommuneChange}
        placeholder="Choisir une commune"
        isDisabled={!departement}
      />

      <h3>Section Communale</h3>
      <Select
        options={sectionCommunaleOptions}
        value={sectionCommunale}
        onChange={handleSectionCommunaleChange}
        placeholder="Choisir une section communale"
        isDisabled={!commune}
      />
    </div>
  );
}
